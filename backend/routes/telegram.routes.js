const express = require("express");

const {
  telegramRequest,
} = require("../services/telegram/telegram.service");

const {
  handleTelegramText,
} = require("../services/telegram/telegramIntent.service");

const {
  emitTelegramSearchResult,
  emitTelegramSceneResult,
} = require("../services/telegram/telegramEvents.service");

const {
  processSceneFinderJob,
} = require("../workers/sceneFinder.worker");

const SceneFinderJob = require("../models/sceneFinderJob.model");

const User = require("../models/user.model");

const router = express.Router();

const CINEMATE_FRONTEND_URL =
  "https://headers-gibraltar-banners-signing.trycloudflare.com";

const isVideoOrInstagramUrl = (text) => {
  try {
    const url = new URL(text);

    const hostname =
      url.hostname.toLowerCase();

    return (
      hostname === "instagram.com" ||
      hostname === "www.instagram.com" ||
      hostname === "m.instagram.com" ||
      hostname === "instagr.am" ||
      hostname === "www.instagr.am"
    );
  } catch {
    return false;
  }
};

router.post("/webhook", async (req, res) => {
  try {
    console.log(
      "Telegram Update:",
      JSON.stringify(req.body, null, 2)
    );

    const message = req.body?.message;

    if (!message?.chat?.id) {
      return res.sendStatus(200);
    }

    const chatId = String(message.chat.id);

    const text =
      message.text?.trim() || "";

    if (text === "/start") {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text:
          "Welcome to CineMate! 🎬\n\n" +
          "First connect your CineMate account.\n\n" +
          "In CineMate Profile → Connect Telegram → Generate Code.\n\n" +
          "Then send:\n" +
          "/connect YOUR_CODE",
      });

      return res.sendStatus(200);
    }

    if (text.startsWith("/connect ")) {
      const code = text
        .slice("/connect ".length)
        .trim()
        .toUpperCase();

      if (!code) {
        await telegramRequest("sendMessage", {
          chat_id: chatId,
          text:
            "Please provide your CineMate pairing code.\n\n" +
            "Example:\n" +
            "/connect ABCD1234",
        });

        return res.sendStatus(200);
      }

      const user =
        await User.findOne({
          telegramLinkCode: code,
          telegramLinkCodeExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        await telegramRequest("sendMessage", {
          chat_id: chatId,
          text:
            "This pairing code is invalid or expired.\n\n" +
            "Please generate a new code from your CineMate Profile.",
        });

        return res.sendStatus(200);
      }

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            telegramChatId: chatId,
          },
          $unset: {
            telegramLinkCode: "",
            telegramLinkCodeExpires: "",
          },
        }
      );

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text:
          "✅ Telegram connected successfully!\n\n" +
          "Now type a movie or TV show name here.\n\n" +
          "You can also send an Instagram Reel/video link.\n\n" +
          "The result will appear directly inside CineMate.",
      });

      return res.sendStatus(200);
    }

    if (text) {
      const connectedUser =
        await User.findOne({
          telegramChatId: chatId,
        });

      if (!connectedUser) {
        await telegramRequest("sendMessage", {
          chat_id: chatId,
          text:
            "Please connect your CineMate account first.\n\n" +
            "Open CineMate → Profile → Connect Telegram → Generate Code.",
        });

        return res.sendStatus(200);
      }

      if (isVideoOrInstagramUrl(text)) {
        const job =
          await SceneFinderJob.create({
            user: connectedUser._id,
            reelUrl: text,
            videoPath: "",
            status: "pending",
          });

        console.log(
          "Telegram Scene Finder Job Created:",
          job._id.toString()
        );

        emitTelegramSceneResult(
          connectedUser._id.toString(),
          {
            type: "scene",
            jobId: job._id.toString(),
            status: "processing",
            result: null,
            error: "",
          }
        );

        res.sendStatus(200);

        processSceneFinderJob(
          job._id.toString()
        )
          .then(async () => {
            try {
              await telegramRequest("sendMessage", {
                chat_id: chatId,
                text:
                  "🎬 Reel/video received.\n\n" +
                  "CineMate is analyzing the scene.\n\n" +
                  "The result will appear directly inside CineMate.",
              });
            } catch (error) {
              console.error(
                "Telegram Processing Message Error:",
                error.message
              );
            }
          })
          .catch((error) => {
            console.error(
              "Telegram Scene Finder Processing Error:",
              error.message
            );
          });

        return;
      }

      const result =
        await handleTelegramText(text);

      if (
        result.type === "search" &&
        result.results.length > 0
      ) {
        emitTelegramSearchResult(
          connectedUser._id.toString(),
          result
        );

        await telegramRequest("sendMessage", {
          chat_id: chatId,
          text:
            `✅ Search received: "${result.query}"\n\n` +
            "Your CineMate app will show the results.",
        });

        return res.sendStatus(200);
      }

      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text:
          `I couldn't find a matching movie or TV show for "${text}".`,
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Telegram Webhook Error:",
      error.message
    );

    if (!res.headersSent) {
      return res.sendStatus(500);
    }
  }
});

module.exports = router;