
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


const sendPasswordResetEmail = async (
  email,
  resetToken
) => {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  const resetUrl =
    frontendUrl + "/reset-password?token=" + encodeURIComponent(resetToken);

  await transporter.sendMail({
    from: `"CineMate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your CineMate password",

    html: `
      <div style="font-family: Arial, sans-serif; background: #050505; color: #ffffff; padding: 40px;">
        <h1 style="margin-bottom: 10px;">Reset your CineMate password</h1>
        <p style="color: #aaaaaa;">We received a request to reset your CineMate password.</p>
        <p style="color: #aaaaaa;">Click the button below to choose a new password.</p>

        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #ffffff;
            color: #000000;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>

        <p style="margin-top: 30px; color: #666666; font-size: 12px;">
          This password reset link will expire in 15 minutes.
        </p>
      </div>
    `,
  });
};

const sendVerificationEmail = async (
  email,
  verificationToken
) => {
  const verificationUrl =
    `http://localhost:5173/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: `"CineMate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your CineMate email",

    html: `
      <div style="font-family: Arial, sans-serif; background: #050505; color: #ffffff; padding: 40px;">
        <h1 style="margin-bottom: 10px;">Welcome to CineMate</h1>

        <p style="color: #aaaaaa;">
          Thanks for creating your CineMate account.
        </p>

        <p style="color: #aaaaaa;">
          Click the button below to verify your email address.
        </p>

        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #ffffff;
            color: #000000;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          "
        >
          Verify Email
        </a>

        <p style="margin-top: 30px; color: #666666; font-size: 12px;">
          This verification link will expire soon.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

