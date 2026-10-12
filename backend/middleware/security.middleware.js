const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const buildAllowedOrigins = ({
  frontendUrl,
  nodeEnv = process.env.NODE_ENV,
} = {}) => {
  const configuredOrigins = String(frontendUrl || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const origins = new Set(configuredOrigins);

  if (nodeEnv !== "production") {
    DEFAULT_DEV_ORIGINS.forEach((origin) => origins.add(origin));
  }

  return origins;
};

const createRateLimiter = ({
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  now = () => Date.now(),
} = {}) => {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new TypeError("windowMs must be a positive number.");
  }

  if (!Number.isInteger(max) || max < 1) {
    throw new TypeError("max must be a positive integer.");
  }

  // Process-local protection only. Use a shared store before scaling to
  // multiple backend instances so limits apply across the whole deployment.
  const buckets = new Map();
  let requestCount = 0;

  return (req, res, next) => {
    const currentTime = now();
    const key = String(req.ip || req.socket?.remoteAddress || "unknown");
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      bucket = { count: 0, resetAt: currentTime + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    requestCount += 1;

    if (requestCount % 100 === 0 || buckets.size > 10000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= currentTime) buckets.delete(bucketKey);
      }
    }

    res.set("RateLimit-Limit", String(max));
    res.set(
      "RateLimit-Remaining",
      String(Math.max(0, max - bucket.count))
    );
    res.set(
      "RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000))
    );

    if (bucket.count > max) {
      res.set("Retry-After", String(
        Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))
      ));
      return res.status(429).json({ message });
    }

    return next();
  };
};

module.exports = {
  buildAllowedOrigins,
  createRateLimiter,
};
