
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

const router = express.Router();

router.post("/signup", signup);

router.get("/verify-email", verifyEmail);

router.post("/login", login);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);


router.get("/me", authMiddleware, getMe);

module.exports = router;

