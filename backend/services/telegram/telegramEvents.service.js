const EventEmitter = require("events");

const telegramEvents =
new EventEmitter();

/* TELEGRAM MOVIE / TV SEARCH */

const emitTelegramSearchResult = (
userId,
result
) => {
telegramEvents.emit(
`search:${userId}`,
result
);
};

const subscribeToTelegramSearch = (
userId,
callback
) => {
const eventName =
`search:${userId}`;

telegramEvents.on(
eventName,
callback
);

return () => {
telegramEvents.off(
eventName,
callback
);
};
};

/* TELEGRAM SCENE FINDER */

const emitTelegramSceneResult = (
userId,
result
) => {
telegramEvents.emit(
`scene:${userId}`,
result
);
};

const subscribeToTelegramScene = (
userId,
callback
) => {
const eventName =
`scene:${userId}`;

telegramEvents.on(
eventName,
callback
);

return () => {
telegramEvents.off(
eventName,
callback
);
};
};

module.exports = {
emitTelegramSearchResult,
subscribeToTelegramSearch,

emitTelegramSceneResult,
subscribeToTelegramScene,
};
