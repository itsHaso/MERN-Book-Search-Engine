const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, _args, context) => {
      // if user is authenticated
      if (context.user) {
        // return the user
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("savedBooks");

        return userData;
      }

      // if user is not authenticated
      throw new AuthenticationError("Please log in!");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("User not found!");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect password!");
      }

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (_parent, { input }, context) => {
      console.log("User in context:", context.user);
      console.log("bookData:", input);
      if (context.user) {
        const updateUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: input } },
          { new: true }
        );

        return updateUser;
      }

      throw new AuthenticationError("Please log in!");
    },

    removeBook: async (_parent, { bookId }, context) => {
      if (context.user) {
        const updateUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );

        return updateUser;
      }

      throw new AuthenticationError("Please log in!");
    },
  },
};

module.exports = resolvers;