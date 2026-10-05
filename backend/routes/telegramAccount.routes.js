const express = require("express");

const {
  generateTelegramLinkCode,
  getTelegramConnection,
  disconnectTelegram,
} = require("../controllers/telegram.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/status",
  authMiddleware,
  getTelegramConnection
);

router.post(
  "/generate-code",
  authMiddleware,
  generateTelegramLinkCode
);

router.delete(
  "/disconnect",
  authMiddleware,
  disconnectTelegram
);

module.exports = router;
