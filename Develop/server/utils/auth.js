const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const secret = "JWT_SECRET";
const expiration = "2h";

module.exports = {
  authMiddleware: function (req, res, next) {
    let token = req.query.token || req.headers.authorization;

    if (req.headers.authorization) {
      token = token.split(" ").pop().trim();
    }

    if (!token) {
      return res.status(400).json({ message: "You have no token!" });
    }

    try {
      const data = jwt.verify(token, secret);
      console.log("Signing secret:", secret);
      console.log("Decoded data:", data);
      req.user = data;
    } catch (err) {
      console.log("Invalid token");
      console.log("Error details:", err);
      return res.status(400).json({ message: "invalid token!" });
    }

    next();
  },
  signToken: function ({ username, email, _id }) {
    console.log("Signing secret:", secret);
    const payload = { username, email, _id };
    const token = jwt.sign(payload, secret, {
      expiresIn: expiration,
    });
    console.log("Signed token:", token);
    return token;
  },
};