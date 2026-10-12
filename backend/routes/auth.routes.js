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
const { createRateLimiter } = require("../middleware/security.middleware");

const router = express.Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

const signupLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Please try again in 15 minutes.",
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts. Please try again in 15 minutes.",
});

router.post("/signup", signupLimiter, signup);
router.get("/verify-email", verifyEmail);
router.post("/login", loginLimiter, login);
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.get("/me", authMiddleware, getMe);

module.exports = router;
