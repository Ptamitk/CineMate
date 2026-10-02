const express = require("express");

const {
  telegramRequest,
} = require("../services/telegram/telegram.service");

const {
  handleTelegramText,
} = require("../services/telegram/telegramIntent.service");

const {
  emitTelegramSearchResult,
} = require("../services/telegram/telegramEvents.service");

const {
  enqueueSceneFinderJob,
} = require("../services/sceneFinder/sceneJobQueue.service");

const SceneFinderJob =
  require("../models/sceneFinderJob.model");

const User =
  require("../models/user.model");

const router =
  express.Router();

const PAIRING_WINDOW_MS =
  10 * 60 * 1000;

const MAX_PAIRING_ATTEMPTS =
  5;

const pairingAttempts = new Map();

const TELEGRAM_UPDATE_TTL_MS =
  15 * 60 * 1000;

const processedTelegramUpdates = new Map();

const isDuplicateTelegramUpdate = (
  updateId
) => {
  if (
    updateId === undefined ||
    updateId === null
  ) {
    return false;
  }

  const normalizedId = String(updateId);
  const now = Date.now();
  const processedAt =
    processedTelegramUpdates.get(
      normalizedId
    );

  if (
    processedAt &&
    now - processedAt < TELEGRAM_UPDATE_TTL_MS
  ) {
    return true;
  }

  processedTelegramUpdates.set(
    normalizedId,
    now
  );

  return false;
};

const isPairingRateLimited = (chatId) => {
  const now = Date.now();
  const entry = pairingAttempts.get(chatId);

  if (!entry || now - entry.startedAt >= PAIRING_WINDOW_MS) {
    pairingAttempts.set(chatId, {
      startedAt: now,
      count: 0,
    });
    return false;
  }

  if (entry.count >= MAX_PAIRING_ATTEMPTS) {
    return true;
  }

  return false;
};

const recordPairingFailure = (chatId) => {
  const now = Date.now();
  const entry = pairingAttempts.get(chatId);

  if (!entry || now - entry.startedAt >= PAIRING_WINDOW_MS) {
    pairingAttempts.set(chatId, {
      startedAt: now,
      count: 1,
    });
    return;
  }

  entry.count += 1;
};

const clearPairingAttempts = (chatId) => {
  pairingAttempts.delete(chatId);
};

const telegramUpdateCleanupTimer =
  setInterval(() => {
    const cutoff =
      Date.now() - TELEGRAM_UPDATE_TTL_MS;

    for (
      const [updateId, processedAt]
      of processedTelegramUpdates
    ) {
      if (processedAt < cutoff) {
        processedTelegramUpdates.delete(
          updateId
        );
      }
    }
  }, TELEGRAM_UPDATE_TTL_MS);

telegramUpdateCleanupTimer.unref?.();

const pairingCleanupTimer = setInterval(() => {
  const cutoff = Date.now() - PAIRING_WINDOW_MS;

  for (const [chatId, entry] of pairingAttempts) {
    if (entry.startedAt < cutoff) {
      pairingAttempts.delete(chatId);
    }
  }
}, PAIRING_WINDOW_MS);

pairingCleanupTimer.unref?.();

const getCanonicalInstagramUrl = (
  text = ""
) => {
  try {
    const url = new URL(text);

    const hostname =
      url.hostname.toLowerCase();

    const validHost =
      hostname === "instagram.com" ||
      hostname === "www.instagram.com" ||
      hostname === "m.instagram.com" ||
      hostname === "instagr.am" ||
      hostname === "www.instagr.am";

    if (!validHost) {
      return null;
    }

    const pathname =
      url.pathname
        .replace(/\/+$/, "")
        .toLowerCase();

    const validPath =
      pathname.startsWith("/reel/") ||
      pathname.startsWith("/reels/") ||
      pathname.startsWith("/p/");

    if (!validPath) {
      return null;
    }

    return `https://www.instagram.com${pathname}`;
  } catch {
    return null;
  }
};

const sendTelegramMessage = async (
  chatId,
  text
) => {
  try {
    await telegramRequest(
      "sendMessage",
      {
        chat_id: chatId,
        text,
      }
    );
  } catch (error) {
    console.error(
      "Telegram Send Message Error:",
      error.message
    );
  }
};

router.post(
  "/webhook",
  async (req, res) => {
    const webhookSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

    if (webhookSecret) {
      const receivedSecret =
        req.get("X-Telegram-Bot-Api-Secret-Token");

      if (
        !receivedSecret ||
        receivedSecret !== webhookSecret
      ) {
        return res.sendStatus(401);
      }
    }
    try {
      const updateId =
        req.body?.update_id;

      if (
        isDuplicateTelegramUpdate(
          updateId
        )
      ) {
        return res.sendStatus(200);
      }

      const message =
        req.body?.message;

      if (!message?.chat?.id) {
        return res.sendStatus(200);
      }

      const chatId =
        String(message.chat.id);

      const text =
        message.text?.trim() || "";

      if (!text) {
        return res.sendStatus(200);
      }

      if (text === "/start") {
        await sendTelegramMessage(
          chatId,
          "Welcome to CineMate!\n\n" +
            "Connect your CineMate account first.\n\n" +
            "Open CineMate → Profile → Connect Telegram → Generate Code.\n\n" +
            "Then send:\n/connect YOUR_CODE"
        );

        return res.sendStatus(200);
      }

      if (
        text.startsWith(
          "/connect "
        )
      ) {
        const code =
          text
            .slice(
              "/connect ".length
            )
            .trim()
            .toUpperCase();

        if (!code) {
          await sendTelegramMessage(
            chatId,
            "Please provide your CineMate pairing code.\n\nExample:\n/connect ABCD1234"
          );

          return res.sendStatus(200);
        }

        if (isPairingRateLimited(chatId)) {
          await sendTelegramMessage(
            chatId,
            "Too many invalid pairing attempts. Please wait 10 minutes and generate a new code."
          );

          return res.sendStatus(200);
        }

        const user =
          await User.findOne({
            telegramLinkCode:
              code,
            telegramLinkCodeExpires:
              {
                $gt: new Date(),
              },
          });

        if (!user) {
          recordPairingFailure(chatId);

          await sendTelegramMessage(
            chatId,
            "This pairing code is invalid or expired.\n\nGenerate a new code from CineMate."
          );

          return res.sendStatus(200);
        }

        await User.updateOne(
          {
            _id: user._id,
          },
          {
            $set: {
              telegramChatId:
                chatId,
            },
            $unset: {
              telegramLinkCode:
                "",
              telegramLinkCodeExpires:
                "",
            },
          }
        );

        clearPairingAttempts(chatId);

        await sendTelegramMessage(
          chatId,
          "Telegram connected successfully!\n\n" +
            "You can now send:\n" +
            "• Movie names\n" +
            "• TV show names\n" +
            "• Instagram Reel links"
        );

        return res.sendStatus(
          200
        );
      }

      const connectedUser =
        await User.findOne({
          telegramChatId:
            chatId,
        });

      if (!connectedUser) {
        await sendTelegramMessage(
          chatId,
          "Please connect your CineMate account first.\n\nOpen CineMate → Profile → Connect Telegram → Generate Code."
        );

        return res.sendStatus(
          200
        );
      }

      const canonicalReelUrl =
        getCanonicalInstagramUrl(text);

      if (canonicalReelUrl) {
        let existingJob =
          await SceneFinderJob.findOne(
            {
              user:
                connectedUser._id,
              reelUrl:
                canonicalReelUrl,
              status: {
                $in: [
                  "pending",
                  "processing",
                ],
              },
            }
          );

        if (existingJob) {
          await sendTelegramMessage(
            chatId,
            "This Reel is already being analyzed.\n\nThe result will appear in CineMate."
          );

          return res.sendStatus(
            200
          );
        }

        let job;

        try {
          job =
            await SceneFinderJob.create(
              {
                user:
                  connectedUser._id,
                reelUrl:
                  canonicalReelUrl,
                videoPath: "",
                source: "telegram",
                status: "pending",
              }
            );
        } catch (error) {
          if (error?.code !== 11000) {
            throw error;
          }

          existingJob =
            await SceneFinderJob.findOne(
              {
                user:
                  connectedUser._id,
                reelUrl:
                  canonicalReelUrl,
                status: {
                  $in: [
                    "pending",
                    "processing",
                  ],
                },
              }
            );

          if (existingJob) {
            await sendTelegramMessage(
              chatId,
              "This Reel is already being analyzed.\n\nThe result will appear in CineMate."
            );

            return res.sendStatus(
              200
            );
          }

          throw error;
        }

        await sendTelegramMessage(
          chatId,
          "Reel received.\n\nCineMate is analyzing the scene.\n\nThe result will appear inside CineMate."
        );

        res.sendStatus(200);

        enqueueSceneFinderJob(
          job._id.toString()
        );

        return;
      }

      const result =
        await handleTelegramText(
          text
        );

      if (
        result.type === "search" &&
        Array.isArray(
          result.results
        ) &&
        result.results.length
      ) {
        emitTelegramSearchResult(
          connectedUser._id.toString(),
          result
        );

        await sendTelegramMessage(
          chatId,
          `Search received: "${result.query}"\n\nCineMate will show the results in your app.`
        );

        return res.sendStatus(
          200
        );
      }

      await sendTelegramMessage(
        chatId,
        `I couldn't find a matching movie or TV show for "${text}".`
      );

      return res.sendStatus(
        200
      );
    } catch (error) {
      console.error(
        "Telegram Webhook Error:",
        error.message
      );

      if (!res.headersSent) {
        return res.sendStatus(
          500
        );
      }
    }
  }
);

module.exports = router;