const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const TELEGRAM_REQUEST_TIMEOUT_MS = Math.max(
  5 * 1000,
  Number(
    process.env.TELEGRAM_REQUEST_TIMEOUT_MS ||
      15 * 1000
  )
);

const telegramRequest = async (
method,
body = {}
) => {
const controller = new AbortController();
const timeout = setTimeout(
  () => controller.abort(),
  TELEGRAM_REQUEST_TIMEOUT_MS
);

let response;

try {
  response = await fetch(
    `${TELEGRAM_API_URL}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }
  );
} catch (error) {
  if (error?.name === "AbortError") {
    throw new Error(
      `Telegram API request timed out after ${TELEGRAM_REQUEST_TIMEOUT_MS}ms`
    );
  }

  throw error;
} finally {
  clearTimeout(timeout);
}

const data = await response.json();

if (!response.ok || !data.ok) {
throw new Error(
data.description ||
`Telegram API Error: ${response.status}`
);
}

return data;
};

const getTelegramBotInfo = async () => {
return telegramRequest("getMe");
};

module.exports = {
telegramRequest,
getTelegramBotInfo,
};
