
const crypto = require("crypto");

const User = require("../models/user.model");

const generateTelegramLinkCode = async (req, res) => {
  try {
    const code = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await User.findByIdAndUpdate(
      req.userId,
      {
        telegramLinkCode: code,
        telegramLinkCodeExpires: expiresAt,
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message:
        "Telegram pairing code generated.",
      code,
      expiresAt,
    });
  } catch (error) {
    console.error(
      "Telegram Pairing Code Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Unable to generate Telegram pairing code.",
    });
  }
};

module.exports = {
  generateTelegramLinkCode,
};

