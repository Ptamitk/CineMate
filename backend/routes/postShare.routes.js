
const express = require("express");

const {
  sharePost,
} = require(
  "../controllers/postShare.controller"
);

const authMiddleware =
  require(
    "../middleware/auth.middleware"
  );

const router =
  express.Router();

router.post(
  "/:postId",
  authMiddleware,
  sharePost
);

module.exports = router;

