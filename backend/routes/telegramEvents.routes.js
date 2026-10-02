const express = require("express");

const {
  subscribeToTelegramSearch,
  subscribeToTelegramScene,
} = require("../services/telegram/telegramEvents.service");

const authMiddleware = require("../middleware/auth.middleware");
const SceneFinderJob = require("../models/sceneFinderJob.model");

const router = express.Router();

router.get(
  "/stream",
  authMiddleware,
  async (req, res) => {
    const userId =
      req.userId.toString();

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.flushHeaders();

    res.write(
      `data: ${JSON.stringify({
        type: "connected",
      })}\n\n`
    );

    const sendEvent = (result) => {
      if (res.writableEnded) {
        return;
      }

      res.write(
        `data: ${JSON.stringify(
          result
        )}\n\n`
      );
    };

    const unsubscribeSearch =
      subscribeToTelegramSearch(
        userId,
        sendEvent
      );

    const unsubscribeScene =
      subscribeToTelegramScene(
        userId,
        sendEvent
      );

    const keepAlive =
      setInterval(() => {
        if (
          res.writableEnded
        ) {
          return;
        }

        res.write(
          ": keep-alive\n\n"
        );
      }, 30000);

    req.on("close", () => {
      clearInterval(
        keepAlive
      );

      unsubscribeSearch();
      unsubscribeScene();

      if (!res.writableEnded) {
        res.end();
      }
    });
  }
);

router.get(
  "/search-stream",
  authMiddleware,
  async (req, res) => {
    const userId =
      req.userId.toString();

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.flushHeaders();

    res.write(
      `data: ${JSON.stringify({
        type: "connected",
      })}\n\n`
    );

    const unsubscribe =
      subscribeToTelegramSearch(
        userId,
        (result) => {
          if (
            !res.writableEnded
          ) {
            res.write(
              `data: ${JSON.stringify(
                result
              )}\n\n`
            );
          }
        }
      );

    try {
      const recentSceneJobs =
        await SceneFinderJob.find({
          user: userId,
          updatedAt: {
            $gte: new Date(
              Date.now() - 15 * 60 * 1000
            ),
          },
        })
          .sort({ updatedAt: -1 })
          .limit(5)
          .lean();

      for (const job of recentSceneJobs.reverse()) {
        if (res.writableEnded) {
          break;
        }

        res.write(
          `data: ${JSON.stringify({
            type: "scene",
            jobId: job._id.toString(),
            status: job.status,
            result: job.result || null,
            error: job.error || "",
          updatedAt: job.updatedAt,
        })}\n\n`
        );
      }
    } catch (error) {
      console.error(
        "Telegram Scene Replay Error:",
        error.message
      );
    }

    const keepAlive =
      setInterval(() => {
        if (
          !res.writableEnded
        ) {
          res.write(
            ": keep-alive\n\n"
          );
        }
      }, 30000);

    req.on("close", () => {
      clearInterval(
        keepAlive
      );

      unsubscribe();

      if (!res.writableEnded) {
        res.end();
      }
    });
  }
);

module.exports = router;