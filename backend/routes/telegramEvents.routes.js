const express = require("express");

const {
subscribeToTelegramSearch,
subscribeToTelegramScene,
} = require("../services/telegram/telegramEvents.service");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
"/search-stream",
authMiddleware,
(req, res) => {
const userId =
req.userId.toString();


res.setHeader(
  "Content-Type",
  "text/event-stream"
);

res.setHeader(
  "Cache-Control",
  "no-cache"
);

res.setHeader(
  "Connection",
  "keep-alive"
);

res.flushHeaders();

res.write(
  `data: ${JSON.stringify({
    type: "connected",
  })}\n\n`
);

/* MOVIE / TV SEARCH EVENT */

const unsubscribeSearch =
  subscribeToTelegramSearch(
    userId,
    (result) => {
      res.write(
        `data: ${JSON.stringify(
          result
        )}\n\n`
      );
    }
  );

/* SCENE FINDER EVENT */

const unsubscribeScene =
  subscribeToTelegramScene(
    userId,
    (result) => {
      res.write(
        `data: ${JSON.stringify(
          result
        )}\n\n`
      );
    }
  );

/* KEEP CONNECTION ALIVE */

const keepAlive =
  setInterval(() => {
    res.write(
      ": keep-alive\n\n"
    );
  }, 30000);

req.on("close", () => {
  clearInterval(keepAlive);

  unsubscribeSearch();
  unsubscribeScene();

  res.end();
});


}
);

module.exports = router;
