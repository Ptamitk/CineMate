const test = require("node:test");
const assert = require("node:assert/strict");

process.env.TELEGRAM_BOT_TOKEN = "test-token";
process.env.TELEGRAM_REQUEST_TIMEOUT_MS = "5000";

const { telegramRequest } = require("../../services/telegram/telegram.service");

test("telegramRequest surfaces Telegram API failures", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ ok: false, description: "Telegram unavailable" }),
  });

  try {
    await assert.rejects(
      () => telegramRequest("getMe"),
      /Telegram unavailable/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("telegramRequest surfaces timeout failures", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => new Promise((_, reject) => {
    const onAbort = () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    };
    options.signal.addEventListener("abort", onAbort, { once: true });
  });

  try {
    process.env.TELEGRAM_REQUEST_TIMEOUT_MS = "5000";
    await assert.rejects(
      () => telegramRequest("getMe"),
      /timed out/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
