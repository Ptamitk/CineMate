
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const watchlistRoutes = require("./routes/watchlist.routes");
const libraryRoutes = require("./routes/library.routes");
const ratingReviewRoutes = require("./routes/ratingReview.routes");
const postRoutes = require("./routes/post.routes");
const postLikeRoutes = require("./routes/postLike.routes");
const commentRoutes = require("./routes/comment.routes");
const followRoutes = require("./routes/follow.routes");
const savedPostRoutes = require("./routes/savedPost.routes");
const postShareRoutes =
  require("./routes/postShare.routes");
  const notificationRoutes =
  require("./routes/notification.routes");
  const sceneFinderRoutes = require("./routes/sceneFinder.routes");
  const {
  getTelegramBotInfo,
  configureTelegramWebhook,
} = require("./services/telegram/telegram.service");
const telegramRoutes = require("./routes/telegram.routes");
const telegramAccountRoutes = require("./routes/telegramAccount.routes");
const telegramEventsRoutes = require("./routes/telegramEvents.routes");
const {
  recoverSceneFinderJobs,
  startSceneFinderQueueRecovery,
} = require("./services/sceneFinder/sceneJobQueue.service");
const {
  cleanupStaleSceneTempFiles,
} = require("./services/sceneFinder/sceneCleanup.service");





const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/content", ratingReviewRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts", postLikeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/saved-posts", savedPostRoutes);
app.use(
  "/api/post-shares",
  postShareRoutes
);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use("/api/scene-finder", sceneFinderRoutes);
app.use("/api/telegram", telegramRoutes);
app.use(
  "/api/telegram-account",
  telegramAccountRoutes
);
app.use(
  "/api/telegram-events",
  telegramEventsRoutes
);






app.get("/", (req, res) => {
  res.json({
    message: "CineMate Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  await cleanupStaleSceneTempFiles();
  await recoverSceneFinderJobs();
  startSceneFinderQueueRecovery();

  const telegramBot =
  await getTelegramBotInfo();

console.log(
  "Telegram Bot Connected:",
  telegramBot.result.username
);

  await configureTelegramWebhook();

  const server = app.listen(PORT, () => {
    console.log(`CineMate server running on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}; shutting down CineMate gracefully...`);
    server.close(async () => {
      try {
        const { closeSceneFinderQueue } = require("./services/sceneFinder/sceneJobQueue.service");
        await closeSceneFinderQueue();
        process.exit(0);
      } catch (error) {
        console.error("Scene Finder shutdown error:", error.message);
        process.exit(1);
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });
};

startServer();

