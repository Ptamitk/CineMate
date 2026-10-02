
const SavedPost = require("../models/savedPost.model");
const Post = require("../models/post.model");

/* =========================
   TOGGLE SAVE POST
========================= */

const toggleSavePost = async (
  req,
  res
) => {
  try {
    const { postId } =
      req.params;

    const post =
      await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const existingSave =
      await SavedPost.findOne({
        post: postId,
        user: req.userId,
      });

    if (existingSave) {
      await SavedPost.findByIdAndDelete(
        existingSave._id
      );

      return res.status(200).json({
        message: "Post unsaved.",
        saved: false,
      });
    }

    await SavedPost.create({
      post: postId,
      user: req.userId,
    });

    return res.status(200).json({
      message: "Post saved.",
      saved: true,
    });
  } catch (error) {
    console.error(
      "Toggle Save Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while updating saved post.",
    });
  }
};

/* =========================
   CHECK SAVED STATUS
========================= */

const checkSavedPost = async (
  req,
  res
) => {
  try {
    const { postId } =
      req.params;

    const saved =
      await SavedPost.findOne({
        post: postId,
        user: req.userId,
      });

    return res.status(200).json({
      saved: Boolean(saved),
    });
  } catch (error) {
    console.error(
      "Check Saved Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while checking saved status.",
    });
  }
};

/* =========================
   GET MY SAVED POSTS
========================= */

const getMySavedPosts = async (
  req,
  res
) => {
  try {
    const savedPosts =
      await SavedPost.find({
        user: req.userId,
      })
        .populate({
          path: "post",
          populate: {
            path: "user",
            select: "name profilePicture",
          },
        })
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      savedPosts,
    });
  } catch (error) {
    console.error(
      "Get Saved Posts Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching saved posts.",
    });
  }
};

module.exports = {
  toggleSavePost,
  checkSavedPost,
  getMySavedPosts,
};

