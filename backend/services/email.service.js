const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const sendEmail = async ({ email, subject, html, text }) => {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "CineMate <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 1000);
      throw new Error(`Resend API request failed (HTTP ${response.status}): ${responseBody}`);
    }
    return;
  }

  if (process.env.BREVO_API_KEY) {
    if (!process.env.EMAIL_USER) {
      throw new Error("EMAIL_USER is required as the verified Brevo sender address.");
    }
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CineMate", email: process.env.EMAIL_USER },
        to: [{ email }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 1000);
      throw new Error(`Brevo API request failed (HTTP ${response.status}): ${responseBody}`);
    }
    return;
  }

  if (process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID || process.env.NODE_ENV === "production") {
    throw new Error("No HTTPS email provider configured. Add RESEND_API_KEY to Railway backend variables.");
  }

  await transporter.sendMail({
    from: `"CineMate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    text,
  });
};

const sendVerificationEmail = async (email, verificationToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:40px">
      <h1>Welcome to CineMate</h1>
      <p style="color:#aaa">Thanks for creating your CineMate account.</p>
      <p style="color:#aaa">Click below to verify your email address.</p>
      <a href="${verificationUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#fff;color:#000;text-decoration:none;border-radius:8px;font-weight:600">Verify Email</a>
      <p style="margin-top:30px;color:#666;font-size:12px">This verification link will expire soon.</p>
    </div>`;
  await sendEmail({ email, subject: "Verify your CineMate email", html, text: `Verify your CineMate email: ${verificationUrl}` });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:40px">
      <h1>Reset your CineMate password</h1>
      <p style="color:#aaa">We received a request to reset your CineMate password.</p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#fff;color:#000;text-decoration:none;border-radius:8px;font-weight:600">Reset Password</a>
      <p style="margin-top:30px;color:#666;font-size:12px">This password reset link expires in 15 minutes.</p>
    </div>`;
  await sendEmail({ email, subject: "Reset your CineMate password", html, text: `Reset your CineMate password: ${resetUrl}` });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
