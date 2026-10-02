
const Follow = require("../models/follow.model");

const User = require("../models/user.model");

const createNotification =
  require("../utils/createNotification");

/* =========================
TOGGLE FOLLOW
========================= */

const toggleFollow = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (req.userId === userId) {
      return res.status(400).json({
        message:
          "You cannot follow yourself.",
      });
    }

    const targetUser =
      await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const existingFollow =
      await Follow.findOne({
        follower: req.userId,
        following: userId,
      });

    if (existingFollow) {
      await Follow.findByIdAndDelete(
        existingFollow._id
      );

      return res.status(200).json({
        message: "User unfollowed.",
        following: false,
      });
    }

    await Follow.create({
      follower: req.userId,
      following: userId,
    });

    await createNotification({
      recipient: userId,
      sender: req.userId,
      type: "follow",
    });

    return res.status(200).json({
      message: "User followed.",
      following: true,
    });
  } catch (error) {
    console.error(
      "Toggle Follow Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while updating follow status.",
    });
  }
};

/* =========================
CHECK FOLLOW
========================= */

const checkFollow = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const follow =
      await Follow.findOne({
        follower: req.userId,
        following: userId,
      });

    return res.status(200).json({
      following: Boolean(follow),
    });
  } catch (error) {
    console.error(
      "Check Follow Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while checking follow status.",
    });
  }
};

module.exports = {
  toggleFollow,
  checkFollow,
};

