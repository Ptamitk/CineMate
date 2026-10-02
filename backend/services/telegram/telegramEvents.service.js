const EventEmitter = require("events");

const telegramEvents =
  new EventEmitter();

telegramEvents.setMaxListeners(1000);

const emitTelegramSearchResult = (
  userId,
  result
) => {
  if (!userId) {
    return;
  }

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

const emitTelegramSceneResult = async (
  userId,
  result
) => {
  if (!userId) {
    return;
  }

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