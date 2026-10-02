    
const PostShare = require("../models/postShare.model");

const Post = require("../models/post.model");

const createNotification =
  require("../utils/createNotification");

/* =========================
   SHARE POST
========================= */

const sharePost = async (
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

    await PostShare.create({
      post: postId,
      user: req.userId,
    });

    post.sharesCount += 1;

    await post.save();

    await createNotification({
      recipient: post.user,
      sender: req.userId,
      type: "share",
      post: post._id,
    });

    return res.status(200).json({
      message:
        "Post shared successfully.",
      sharesCount:
        post.sharesCount,
    });
  } catch (error) {
    console.error(
      "Share Post Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while sharing the post.",
    });
  }
};

module.exports = {
  sharePost,
};

