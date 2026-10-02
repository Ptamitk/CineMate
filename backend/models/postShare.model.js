
const mongoose = require("mongoose");

const postShareSchema =
  new mongoose.Schema(
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

const PostShare = mongoose.model(
  "PostShare",
  postShareSchema
);

module.exports = PostShare;

