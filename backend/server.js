const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const watchlistRoutes = require("./routes/watchlist.routes");
const postRoutes = require("./routes/post.routes");
const postLikeRoutes = require("./routes/postLike.routes");
const commentRoutes = require("./routes/comment.routes");
const followRoutes = require("./routes/follow.routes");
const savedPostRoutes = require("./routes/savedPost.routes");
const postShareRoutes = require("./routes/postShare.routes");
const notificationRoutes = require("./routes/notification.routes");
const sceneFinderRoutes = require("./routes/sceneFinder.routes");
const { getTelegramBotInfo } = require("./services/telegram/telegram.service");
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
app.use("/api/posts", postRoutes);
app.use("/api/posts", postLikeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/saved-posts", savedPostRoutes);
app.use("/api/post-shares", postShareRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/scene-finder", sceneFinderRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/telegram-account", telegramAccountRoutes);
app.use("/api/telegram-events", telegramEventsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "CineMate Backend is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Database is required for the API, so fail clearly if it cannot connect.
  await connectDB();

  // Start listening before optional integrations and background recovery tasks.
  // This prevents Telegram/network or Scene Finder recovery issues from blocking
  // Railway's HTTP healthcheck.
  app.listen(PORT, () => {
    console.log(`CineMate server running on port ${PORT}`);
  });

  void (async () => {
    try {
      await cleanupStaleSceneTempFiles();
      await recoverSceneFinderJobs();
      startSceneFinderQueueRecovery();
      console.log("Scene Finder startup recovery completed");
    } catch (error) {
      console.error("Scene Finder startup recovery failed:", error.message);
    }
  })();

  void getTelegramBotInfo()
    .then((telegramBot) => {
      console.log("Telegram Bot Connected:", telegramBot.result.username);
    })
    .catch((error) => {
      // Telegram should not prevent the core CineMate API from starting.
      console.error("Telegram bot verification failed:", error.message);
    });
};

startServer().catch((error) => {
  console.error("CineMate startup failed:", error.message);
  process.exit(1);
});
