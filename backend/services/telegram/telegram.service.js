const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const telegramRequest = async (
method,
body = {}
) => {
const response = await fetch(
`${TELEGRAM_API_URL}/${method}`,
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(body),
}
);

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
