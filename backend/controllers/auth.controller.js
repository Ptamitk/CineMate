
const crypto = require("crypto");

const User = require("../models/user.model");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");

const {
  sendVerificationEmail,
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
  getMe,
};

