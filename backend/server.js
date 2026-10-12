const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  buildAllowedOrigins,
} = require("./middleware/security.middleware");

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

// Railway terminates TLS at its proxy. Trust only the nearest proxy hop so
// req.ip can be used consistently by the process-local rate limiter.
app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = buildAllowedOrigins({
  frontendUrl: process.env.CORS_ORIGINS || process.env.FRONTEND_URL,
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  next();
});

app.use(cors({
  origin(origin, callback) {
    // Requests without Origin include health checks and server-to-server calls.
    callback(null, !origin || allowedOrigins.has(origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Bound JSON/form bodies to reduce accidental or abusive memory consumption.
// Media endpoints use their own Multer limits.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

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

// Return consistent JSON errors without exposing stack traces or internals.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }

  if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Uploaded file exceeds the allowed size." });
  }

  console.error("Unhandled API error:", error.message);
  return res.status(500).json({ message: "An unexpected server error occurred." });
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
