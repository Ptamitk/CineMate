
const express = require("express");

const {
  generateTelegramLinkCode,
} = require("../controllers/telegram.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/generate-code",
  authMiddleware,
  generateTelegramLinkCode
);

module.exports = router;

