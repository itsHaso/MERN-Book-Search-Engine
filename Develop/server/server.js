const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const { typeDefs, resolvers } = require("./schemas");
const db = require("./config/connection");
const { User } = require("./models");
const { signToken } = require("./utils/auth");
const path = require("path");
const jwt = require("jsonwebtoken");
const { JsonWebTokenError } = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "build")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "..", "client", "build", "index.html")
    );
  });
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || "";

    try {
      let user = null;
      if (token && token.startsWith("Bearer ")) {
        const actualToken = token.slice(7);
        console.log("Token to be verified:", actualToken);
        const data = jwt.verify(actualToken, JWT_SECRET);
        user = await User.findById(data._id);
      }

      return { user, signToken };
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        console.log("invalid token");
      } else {
        console.error(err);
      }
      return {};
    }
  },
  formatError: (err) => {
    console.error("Error details:", err);
    console.error("Path:", err.path);
    console.error("Message:", err.message);
    console.error("Extensions:", err.extensions);
    return err;
  },
});

server.applyMiddleware({ app });

db.once("open", () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});