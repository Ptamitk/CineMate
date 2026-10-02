
const express = require("express");

const {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require("../controllers/watchlist.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getMyWatchlist
);

router.post(
  "/",
  authMiddleware,
  addToWatchlist
);

router.delete(
  "/:contentType/:contentId",
  authMiddleware,
  removeFromWatchlist
);

module.exports = router;

