const express = require("express");

const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} = require(
  "../controllers/notification.controller"
);

const authMiddleware =
  require(
    "../middleware/auth.middleware"
  );

const router =
  express.Router();

/* GET MY NOTIFICATIONS */
router.get(
  "/",
  authMiddleware,
  getMyNotifications
);

/* GET UNREAD NOTIFICATION COUNT */
router.get(
  "/unread-count",
  authMiddleware,
  getUnreadNotificationCount
);

/* MARK NOTIFICATION AS READ */
router.put(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

module.exports = router;