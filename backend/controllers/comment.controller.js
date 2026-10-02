
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const createNotification =
  require("../utils/createNotification");

/* =========================
CREATE COMMENT
========================= */

const createComment = async (
  req,
  res
) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message:
          "Comment text is required.",
      });
    }

    const post =
      await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const comment =
      await Comment.create({
        post: postId,
        user: req.userId,
        text: text.trim(),
      });

    post.commentsCount += 1;

    await post.save();

    await createNotification({
      recipient: post.user,
      sender: req.userId,
      type: "comment",
      post: post._id,
    });

    const populatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name profilePicture"
      );

    return res.status(201).json({
      message:
        "Comment added successfully.",
      comment: populatedComment,
    });
  } catch (error) {
    console.error(
      "Create Comment Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while adding the comment.",
    });
  }
};

/* =========================
GET COMMENTS
========================= */

const getComments = async (
  req,
  res
) => {
  try {
    const { postId } = req.params;

    const post =
      await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const comments =
      await Comment.find({
        post: postId,
      })
        .populate(
          "user",
          "name profilePicture"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error(
      "Get Comments Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching comments.",
    });
  }
};

/* =========================
UPDATE COMMENT
========================= */

const updateComment = async (
  req,
  res
) => {
  try {
    const { commentId } =
      req.params;

    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message:
          "Comment text is required.",
      });
    }

    const comment =
      await Comment.findOne({
        _id: commentId,
        user: req.userId,
      });

    if (!comment) {
      return res.status(404).json({
        message:
          "Comment not found or you are not allowed to edit it.",
      });
    }

    comment.text =
      text.trim();

    await comment.save();

    const updatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name profilePicture"
      );

    return res.status(200).json({
      message:
        "Comment updated successfully.",
      comment: updatedComment,
    });
  } catch (error) {
    console.error(
      "Update Comment Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while updating the comment.",
    });
  }
};

/* =========================
DELETE COMMENT
========================= */

const deleteComment = async (
  req,
  res
) => {
  try {
    const { commentId } =
      req.params;

    const comment =
      await Comment.findOne({
        _id: commentId,
        user: req.userId,
      });

    if (!comment) {
      return res.status(404).json({
        message:
          "Comment not found or you are not allowed to delete it.",
      });
    }

    await Comment.findByIdAndDelete(
      commentId
    );

    await Post.findByIdAndUpdate(
      comment.post,
      {
        $inc: {
          commentsCount: -1,
        },
      }
    );

    return res.status(200).json({
      message:
        "Comment deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Comment Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while deleting the comment.",
    });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};

