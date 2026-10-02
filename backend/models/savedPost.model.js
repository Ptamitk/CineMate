
const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedPostSchema.index(
  {
    post: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

const SavedPost = mongoose.model(
  "SavedPost",
  savedPostSchema
);

module.exports = SavedPost;

