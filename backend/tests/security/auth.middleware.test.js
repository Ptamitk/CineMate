const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-unit-tests";

const authMiddleware = require("../../middleware/auth.middleware");

const runMiddleware = (headers = {}) => new Promise((resolve) => {
  const req = { headers };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      resolve({ statusCode: this.statusCode, body, req });
    },
  };
  authMiddleware(req, res, () => resolve({ statusCode: 200, req }));
});

test("rejects missing authorization", async () => {
  const result = await runMiddleware();
  assert.equal(result.statusCode, 401);
});

test("rejects malformed bearer token", async () => {
  const result = await runMiddleware({ authorization: "Bearer" });
  assert.equal(result.statusCode, 401);
});

test("accepts a valid JWT and sets req.userId", async () => {
  const token = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const result = await runMiddleware({ authorization: "Bearer " + token });
  assert.equal(result.statusCode, 200);
  assert.equal(result.req.userId, "507f1f77bcf86cd799439011");
});

test("rejects an expired JWT", async () => {
  const token = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
  const result = await runMiddleware({ authorization: "Bearer " + token });
  assert.equal(result.statusCode, 401);
});
