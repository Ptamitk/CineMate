const express = require("express");

const {
toggleFollow,
checkFollow,
listFollowing,
listFollowers,
} = require("../controllers/follow.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
"/:userId",
authMiddleware,
toggleFollow
);

router.get(
"/:userId",
authMiddleware,
checkFollow
);

router.get(
"/:userId/following",
authMiddleware,
listFollowing
);

router.get(
"/:userId/followers",
authMiddleware,
listFollowers
);

module.exports = router;
