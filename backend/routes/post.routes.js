
const express = require("express");

const {
  createPost,
  getFeed,
  updatePost,
  deletePost,
} = require("../controllers/post.controller");

const authMiddleware =
  require("../middleware/auth.middleware");

const upload =
  require("../middleware/upload.middleware");

const router =
  express.Router();

/* =========================
   GET FEED
========================= */

router.get(
  "/",
  authMiddleware,
  getFeed
);

/* =========================
   CREATE POST
========================= */

router.post(
  "/",
  authMiddleware,
  upload.single("media"),
  createPost
);

/* =========================
   UPDATE POST
========================= */

router.put(
  "/:postId",
  authMiddleware,
  updatePost
);

/* =========================
   DELETE POST
========================= */

router.delete(
  "/:postId",
  authMiddleware,
  deletePost
);

module.exports = router;

