
const express = require("express");

const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} = require("../controllers/comment.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================
GET COMMENTS
========================= */

router.get(
  "/post/:postId",
  authMiddleware,
  getComments
);

/* =========================
CREATE COMMENT
========================= */

router.post(
  "/post/:postId",
  authMiddleware,
  createComment
);

/* =========================
UPDATE COMMENT
========================= */

router.put(
  "/:commentId",
  authMiddleware,
  updateComment
);

/* =========================
DELETE COMMENT
========================= */

router.delete(
  "/:commentId",
  authMiddleware,
  deleteComment
);

module.exports = router;

