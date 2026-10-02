const express = require("express");

const {
  subscribeToTelegramSearch,
  subscribeToTelegramScene,
} = require("../services/telegram/telegramEvents.service");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/stream",
  authMiddleware,
  (req, res) => {
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
  (req, res) => {
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