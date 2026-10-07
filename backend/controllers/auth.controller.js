
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/email.service");

const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message:
          "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await hashPassword(password);

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const verificationExpires =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken:
        verificationToken,
      emailVerificationExpires:
        verificationExpires,
    });

    try {
      await sendVerificationEmail(
        user.email,
        verificationToken
      );
    } catch (emailError) {
      await User.findByIdAndDelete(
        user._id
      );

      console.error(
        "Verification Email Error:",
        emailError
      );

      return res.status(500).json({
        message:
          "Unable to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      message:
        "Account created. Please verify your email.",
    });
  } catch (error) {
    console.error(
      "Signup Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong during signup.",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message:
          "Verification token is required.",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Verification link is invalid or expired.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Email verified successfully. You can now login.",
    });
  } catch (error) {
    console.error(
      "Email Verification Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong during email verification.",
    });
  }
};

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
      });
    }

    const isPasswordValid =
      await comparePassword(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    const token =
      generateToken(
        user._id.toString()
      );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture,
        isEmailVerified:
          user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong during login.",
    });
  }
};



const googleLogin = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      message:
        "Google authentication is not configured on the server.",
    });
  }

  const state = jwt.sign(
    { purpose: "google-oauth" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return res.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" +
      params.toString()
  );
};

const googleCallback = async (req, res) => {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(
        frontendUrl +
          "/login?google_error=" +
          encodeURIComponent("Google sign-in was cancelled or invalid.")
      );
    }

    const statePayload = jwt.verify(
      state,
      process.env.JWT_SECRET
    );

    if (statePayload.purpose !== "google-oauth") {
      throw new Error("Invalid Google OAuth state.");
    }

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description ||
          "Unable to exchange Google authorization code."
      );
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization:
            "Bearer " + tokenData.access_token,
        },
      }
    );

    const profile = await profileResponse.json();

    if (
      !profileResponse.ok ||
      !profile.email ||
      profile.email_verified !== true
    ) {
      throw new Error(
        "Google account email could not be verified."
      );
    }

    const normalizedEmail =
      profile.email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [
        { googleId: profile.sub },
        { email: normalizedEmail },
      ],
    });

    if (!user) {
      user = await User.create({
        name:
          profile.name ||
          normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: null,
        googleId: profile.sub,
        isEmailVerified: true,
        profilePicture: profile.picture || "",
      });
    } else {
      user.googleId = profile.sub;
      user.isEmailVerified = true;

      if (profile.picture && !user.profilePicture) {
        user.profilePicture = profile.picture;
      }

      await user.save();
    }

    const authToken = generateToken(
      user._id.toString()
    );

    return res.redirect(
      frontendUrl +
        "/oauth-callback?token=" +
        encodeURIComponent(authToken)
    );
  } catch (error) {
    console.error(
      "Google OAuth Error:",
      error
    );

    return res.redirect(
      frontendUrl +
        "/login?google_error=" +
        encodeURIComponent(
          "Google sign-in failed. Please try again."
        )
    );
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an email exists.
    const successMessage =
      "If an account with that email exists, a password reset link has been sent.";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    try {
      await sendPasswordResetEmail(
        user.email,
        resetToken
      );
    } catch (emailError) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      console.error(
        "Password Reset Email Error:",
        emailError
      );

      return res.status(500).json({
        message:
          "Unable to send password reset email. Please try again.",
      });
    }

    return res.status(200).json({
      message: successMessage,
    });
  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while requesting a password reset.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const {
      token,
      password,
    } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Password reset link is invalid or expired.",
      });
    }

    user.password = await hashPassword(password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while resetting your password.",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.userId
    ).select(
      "-password -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture,
        isEmailVerified:
          user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(
      "Get Current User Error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong while fetching your account.",
    });
  }
};

module.exports = {
  signup,
  verifyEmail,
  login,
  googleLogin,
  googleCallback,
  forgotPassword,
  resetPassword,
  getMe,
};

