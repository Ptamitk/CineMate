
const Post = require("../models/post.model");

const PostLike = require("../models/postLike.model");
const Comment = require("../models/comment.model");
const SavedPost = require("../models/savedPost.model");
const PostShare = require("../models/postShare.model");
const Notification = require("../models/notification.model");

const {
  uploadToCloudinary,
} = require("../utils/cloudinaryUpload");

/* =========================
   CREATE POST
========================= */

const createPost = async (req, res) => {
  try {
    const {
      contentId,
      contentType,
      text,
    } = req.body || {};

    if (
      !text?.trim() &&
      !req.file &&
      !contentId
    ) {
      return res.status(400).json({
        message:
          "Post must contain text, content or media.",
      });
    }

    let mediaUrl = "";

    if (req.file) {
      const uploadResult =
        await uploadToCloudinary(
          req.file.buffer
        );

      mediaUrl =
        uploadResult.secure_url;
    }

    const post = await Post.create({
      user: req.userId,

      contentId: contentId
        ? Number(contentId)
        : null,

      contentType:
        contentType || null,

      text: text?.trim() || "",

      mediaUrl,
    });

    const populatedPost =
      await Post.findById(
        post._id
      ).populate(
        "user",
        "name profilePicture"
      );

    return res.status(201).json({
      message:
        "Post created successfully.",
      post: populatedPost,
    });
  } catch (error) {
    console.error(
      "Create Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while creating the post.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
};

/* =========================
   GET FEED
========================= */

const getFeed = async (req, res) => {
  try {
    const posts =
      await Post.find()
        .populate(
          "user",
          "name profilePicture"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error(
      "Get Feed Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching the feed.",
    });
  }
};

/* =========================
   UPDATE POST
========================= */

const updatePost = async (
  req,
  res
) => {
  try {
    const { postId } =
      req.params;

    const { text } =
      req.body || {};

    const post =
      await Post.findOne({
        _id: postId,
        user: req.userId,
      });

    if (!post) {
      return res.status(404).json({
        message:
          "Post not found or you are not allowed to edit it.",
      });
    }

    if (
      text !== undefined &&
      !text.trim() &&
      !post.mediaUrl &&
      !post.contentId
    ) {
      return res.status(400).json({
        message:
          "Post cannot be empty.",
      });
    }

    if (text !== undefined) {
      post.text = text.trim();
    }

    await post.save();

    const updatedPost =
      await Post.findById(
        post._id
      ).populate(
        "user",
        "name profilePicture"
      );

    return res.status(200).json({
      message:
        "Post updated successfully.",
      post: updatedPost,
    });
  } catch (error) {
    console.error(
      "Update Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while updating the post.",
    });
  }
};

/* =========================
   DELETE POST
========================= */

const deletePost = async (
  req,
  res
) => {
  try {
    const { postId } =
      req.params;

    const post =
      await Post.findOne({
        _id: postId,
        user: req.userId,
      });

    if (!post) {
      return res.status(404).json({
        message:
          "Post not found or you are not allowed to delete it.",
      });
    }

    await Promise.all([
      PostLike.deleteMany({
        post: postId,
      }),

      Comment.deleteMany({
        post: postId,
      }),

      SavedPost.deleteMany({
        post: postId,
      }),

      PostShare.deleteMany({
        post: postId,
      }),

      Notification.deleteMany({
        post: postId,
      }),
    ]);

    await Post.findByIdAndDelete(
      postId
    );

    return res.status(200).json({
      message:
        "Post deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while deleting the post.",
    });
  }
};

module.exports = {
  createPost,
  getFeed,
  updatePost,
  deletePost,
};

