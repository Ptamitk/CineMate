const Redis = require("ioredis");

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

if (redisClient) {
  redisClient.on("error", (error) =>
    console.error("Redis cache:", error.message)
  );
}

const cacheResponse = (ttlSeconds = 30) => async (req, res, next) => {
  if (!redisClient) return next();

  const key = "cinemate:cache:" + req.originalUrl;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await redisClient.set(key, JSON.stringify(body), "EX", ttlSeconds);
        res.set("X-Cache", "MISS");
      } catch (error) {
        console.error("Redis cache write:", error.message);
      }
      return originalJson(body);
    };

    return next();
  } catch (error) {
    console.error("Redis cache read:", error.message);
    return next();
  }
};

const invalidateCache = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys("cinemate:cache:" + pattern);
    if (keys.length) await redisClient.del(keys);
  } catch (error) {
    console.error("Redis cache invalidation:", error.message);
  }
};

module.exports = {
  cacheResponse,
  invalidateCache,
};
