const express = require("express");

const {
toggleLike,
checkLike,
} = require("../controllers/postLike.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================
TOGGLE LIKE
========================= */

router.post(
"/:postId",
authMiddleware,
toggleLike
);

/* =========================
CHECK LIKE
========================= */

router.get(
"/:postId",
authMiddleware,
checkLike
);

module.exports = router;
