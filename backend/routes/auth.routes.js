
const express = require("express");

const {
  signup,
  verifyEmail,
  login,
  googleLogin,
  googleCallback,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authRateLimit = require("../middleware/authRateLimit.middleware");

const router = express.Router();

router.post("/signup", authRateLimit, signup);

router.get("/verify-email", verifyEmail);

router.post("/login", authRateLimit, login);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

router.post("/forgot-password", authRateLimit, forgotPassword);

router.post("/reset-password", authRateLimit, resetPassword);


router.get("/me", authMiddleware, getMe);

module.exports = router;

