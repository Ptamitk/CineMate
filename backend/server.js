
const express = require("express");
const cors = require("cors");
const rateLimit = require("./middleware/rateLimit.middleware");
const { metricsMiddleware, getMetrics } = require("./middleware/metrics.middleware");
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

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("CORS origin denied.")); }, credentials: true }));
app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(metricsMiddleware);
app.use(rateLimit);

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






app.get("/health", (req,res) => res.status(200).json({ status:"ok", service:"cinemate-backend", timestamp:new Date().toISOString() }));
app.get("/metrics", (req,res) => res.status(200).json(getMetrics()));

app.get("/", (req, res) => {
  res.json({
    message: "CineMate Backend is running",
  });
});

app.use((req,res,next)=>{if(res.headersSent)return next();res.status(404).json({message:"Route not found."});});
app.use((error,req,res,next)=>{console.error("API Error:",error);if(res.headersSent)return next(error);res.status(error.statusCode||500).json({message:process.env.NODE_ENV==="production"?"Internal server error.":(error.message||"Internal server error.")});});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const requiredProductionEnv = [
    "MONGO_URI",
    "JWT_SECRET",
    "FRONTEND_URL",
  ];

  if (process.env.NODE_ENV === "production") {
    const missing = requiredProductionEnv.filter((key) => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production.");
    }
  }

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

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
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
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });
};

startServer();

