const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAllowedOrigins,
  createRateLimiter,
} = require("../middleware/security.middleware");

const createResponse = () => {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: null,
    set(name, value) {
      headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
};

test("production CORS origins are restricted to configured frontend origins", () => {
  const origins = buildAllowedOrigins({
    frontendUrl: "https://cinemate.example/, https://admin.cinemate.example",
    nodeEnv: "production",
  });

  assert.deepEqual(
    [...origins].sort(),
    ["https://admin.cinemate.example", "https://cinemate.example"].sort()
  );
  assert.equal(origins.has("https://attacker.example"), false);
  assert.equal(origins.has("http://localhost:5173"), false);
});

test("development CORS allows local Vite origins", () => {
  const origins = buildAllowedOrigins({ nodeEnv: "development" });
  assert.equal(origins.has("http://localhost:5173"), true);
});

test("rate limiter allows requests within limit and rejects excess requests", () => {
  let time = 1000;
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    now: () => time,
  });
  const req = { ip: "203.0.113.10" };

  const first = createResponse();
  let nextCalls = 0;
  limiter(req, first, () => { nextCalls += 1; });

  const second = createResponse();
  limiter(req, second, () => { nextCalls += 1; });

  const third = createResponse();
  limiter(req, third, () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
  assert.equal(third.statusCode, 429);
  assert.ok(Number(third.headers["Retry-After"]) > 0);

  time += 60_001;
  const afterWindow = createResponse();
  limiter(req, afterWindow, () => { nextCalls += 1; });
  assert.equal(afterWindow.statusCode, 200);
  assert.equal(nextCalls, 3);
});

test("rate limiter separates clients by IP", () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 1,
    now: () => 1000,
  });

  const first = createResponse();
  limiter({ ip: "203.0.113.10" }, first, () => {});
  const second = createResponse();
  limiter({ ip: "203.0.113.11" }, second, () => {});

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
});
