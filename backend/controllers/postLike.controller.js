const Post = require("../models/post.model");
const PostLike = require("../models/postLike.model");
const createNotification =
  require("../utils/createNotification");

/* =========================
TOGGLE LIKE
========================= */

const toggleLike = async (req, res) => {
try {
const { postId } = req.params;


const post = await Post.findById(postId);

if (!post) {
  return res.status(404).json({
    message: "Post not found.",
  });
}

const existingLike =
  await PostLike.findOne({
    post: postId,
    user: req.userId,
  });

if (existingLike) {
  await PostLike.findByIdAndDelete(
    existingLike._id
  );

  post.likesCount = Math.max(
    0,
    post.likesCount - 1
  );

  await post.save();

  return res.status(200).json({
    message: "Post unliked.",
    liked: false,
    likesCount: post.likesCount,
  });
}

await PostLike.create({
  post: postId,
  user: req.userId,
});

post.likesCount += 1;

await post.save();
await createNotification({
  recipient: post.user,
  sender: req.userId,
  type: "like",
  post: post._id,
});

return res.status(200).json({
  message: "Post liked.",
  liked: true,
  likesCount: post.likesCount,
});


} catch (error) {
console.error(
"Toggle Like Error:",
error
);


return res.status(500).json({
  message:
    "Something went wrong while updating the like.",
});


}
};

/* =========================
CHECK LIKE
========================= */

const checkLike = async (req, res) => {
try {
const { postId } = req.params;


const like = await PostLike.findOne({
  post: postId,
  user: req.userId,
});

return res.status(200).json({
  liked: Boolean(like),
});


} catch (error) {
console.error(
"Check Like Error:",
error
);


return res.status(500).json({
  message:
    "Something went wrong while checking the like.",
});


}
};

module.exports = {
toggleLike,
checkLike,
};
