const express = require("express");

const {
toggleFollow,
checkFollow,
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

module.exports = router;
