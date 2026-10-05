const crypto = require("crypto");

const User = require("../models/user.model");
const {
  getTelegramBotInfo,
} = require("../services/telegram/telegram.service");

const generateTelegramLinkCode = async (req, res) => {
  try {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          telegramLinkCode: code,
          telegramLinkCodeExpires: expiresAt,
        },
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({
      message: "Telegram pairing code generated.",
      code,
      expiresAt,
    });
  } catch (error) {
    console.error("Telegram Pairing Code Error:", error.message);
    return res.status(500).json({
      message: "Unable to generate Telegram pairing code.",
    });
  }
};

const getTelegramConnection = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("name email telegramChatId telegramLinkCode telegramLinkCodeExpires")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let bot = null;
    try {
      const botResult = await getTelegramBotInfo();
      bot = botResult?.result
        ? {
            id: botResult.result.id,
            username: botResult.result.username || "",
            firstName: botResult.result.first_name || "",
          }
        : null;
    } catch (error) {
      console.error("Telegram Bot Info Error:", error.message);
    }

    return res.status(200).json({
      connected: Boolean(user.telegramChatId),
      chatId: user.telegramChatId || null,
      pairingCodeActive: Boolean(
        user.telegramLinkCode &&
        user.telegramLinkCodeExpires &&
        new Date(user.telegramLinkCodeExpires).getTime() > Date.now()
      ),
      pairingCodeExpiresAt: user.telegramLinkCodeExpires || null,
      bot,
    });
  } catch (error) {
    console.error("Telegram Connection Status Error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch Telegram connection status.",
    });
  }
};

const disconnectTelegram = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.userId,
      {
        $unset: {
          telegramChatId: "",
          telegramLinkCode: "",
          telegramLinkCodeExpires: "",
        },
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({
      message: "Telegram disconnected successfully.",
      connected: false,
    });
  } catch (error) {
    console.error("Telegram Disconnect Error:", error.message);
    return res.status(500).json({
      message: "Unable to disconnect Telegram.",
    });
  }
};

module.exports = {
  generateTelegramLinkCode,
  getTelegramConnection,
  disconnectTelegram,
};