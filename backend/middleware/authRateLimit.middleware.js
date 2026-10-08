const Redis = require("ioredis");

const localBuckets = new Map();
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

if (redisClient) {
  redisClient.on("error", (error) =>
    console.error("Redis auth rate limiter:", error.message)
  );
}

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = process.env.AUTH_RATE_LIMIT_MAX
  ? Number(process.env.AUTH_RATE_LIMIT_MAX)
  : 10;

module.exports = async (req, res, next) => {
  const key = "cinemate:auth-rate:" + (req.ip || "unknown");

  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) await redisClient.expire(key, WINDOW_SECONDS);
      if (count > MAX_ATTEMPTS) {
        res.set("Retry-After", String(WINDOW_SECONDS));
        return res.status(429).json({
          message: "Too many authentication attempts. Please try again later.",
        });
      }
      return next();
    } catch (error) {
      console.error("Redis auth rate limit fallback:", error.message);
    }
  }

  const now = Date.now();
  const current = localBuckets.get(key);

  if (!current || now - current.start >= WINDOW_SECONDS * 1000) {
    localBuckets.set(key, { start: now, count: 1 });
    return next();
  }

  current.count += 1;

  if (current.count > MAX_ATTEMPTS) {
    res.set("Retry-After", String(WINDOW_SECONDS));
    return res.status(429).json({
      message: "Too many authentication attempts. Please try again later.",
    });
  }

  return next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of localBuckets) {
    if (now - bucket.start >= WINDOW_SECONDS * 1000) {
      localBuckets.delete(key);
    }
  }
}, WINDOW_SECONDS * 1000).unref();
