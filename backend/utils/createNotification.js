const Notification = require("../models/notification.model");

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
}) => {
  try {
    if (
      !recipient ||
      !sender ||
      String(recipient) === String(sender)
    ) {
      return null;
    }

    const notification =
      await Notification.create({
        recipient,
        sender,
        type,
        post,
      });

    return notification;
  } catch (error) {
    console.error(
      "Create Notification Error:",
      error
    );

    return null;
  }
};

module.exports = createNotification;