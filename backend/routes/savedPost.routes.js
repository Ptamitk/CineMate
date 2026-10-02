
const express = require("express");

const {
  toggleSavePost,
  checkSavedPost,
  getMySavedPosts,
} = require("../controllers/savedPost.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/* GET MY SAVED POSTS */
router.get(
  "/",
  authMiddleware,
  getMySavedPosts
);

/* SAVE / UNSAVE POST */
router.post(
  "/:postId",
  authMiddleware,
  toggleSavePost
);

/* CHECK SAVED STATUS */
router.get(
  "/:postId",
  authMiddleware,
  checkSavedPost
);

module.exports = router;

