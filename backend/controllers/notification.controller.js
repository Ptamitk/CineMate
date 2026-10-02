const Notification = require("../models/notification.model");

/* =========================
   GET MY NOTIFICATIONS
========================= */

const getMyNotifications = async (
  req,
  res
) => {
  try {
    const notifications =
      await Notification.find({
        recipient: req.userId,
      })
        .populate(
          "sender",
          "name profilePicture"
        )
        .populate(
          "post",
          "text mediaUrl contentId contentType"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error(
      "Get Notifications Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching notifications.",
    });
  }
};

/* =========================
   MARK ONE AS READ
========================= */

const markNotificationAsRead =
  async (req, res) => {
    try {
      const { notificationId } =
        req.params;

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            recipient: req.userId,
          },
          {
            isRead: true,
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          message:
            "Notification not found.",
        });
      }

      return res.status(200).json({
        message:
          "Notification marked as read.",
        notification,
      });
    } catch (error) {
      console.error(
        "Mark Notification Error:",
        error
      );

      return res.status(500).json({
        message:
          "Something went wrong while updating notification.",
      });
    }
  };

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
};