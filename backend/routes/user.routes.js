
const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  getMyProfile
);

router.put(
  "/me",
  authMiddleware,
  upload.single("profilePicture"),
  updateMyProfile
);

module.exports = router;

