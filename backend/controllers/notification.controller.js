const Notification = require("../models/notification.model");

/* =========================
   GET MY NOTIFICATIONS
========================= */

const getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
    const filter = { recipient: req.userId };
    const [notifications, total] = await Promise.all([
      Notification.find(filter).populate("sender", "name profilePicture").populate("post", "text mediaUrl contentId contentType").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);
    return res.status(200).json({ notifications, page, limit, hasMore: page * limit < total, total });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching notifications." });
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