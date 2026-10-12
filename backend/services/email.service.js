
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  // Keep local SMTP failures bounded. Railway Hobby/Free should use the HTTPS API below.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const sendVerificationEmail = async (email, verificationToken) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #050505; color: #ffffff; padding: 40px;">
      <h1 style="margin-bottom: 10px;">Welcome to CineMate</h1>
      <p style="color: #aaaaaa;">Thanks for creating your CineMate account.</p>
      <p style="color: #aaaaaa;">Click the button below to verify your email address.</p>
      <a href="${verificationUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 20px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
      <p style="margin-top: 30px; color: #666666; font-size: 12px;">This verification link will expire soon.</p>
    </div>
  `;

  // Railway Free/Hobby blocks outbound SMTP. Prefer Brevo's HTTPS API when configured.
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
        subject: "Verify your CineMate email",
        htmlContent,
        textContent: `Welcome to CineMate. Verify your email address using this link: ${verificationUrl}`,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 1000);
      throw new Error(`Brevo API request failed (HTTP ${response.status}): ${responseBody}`);
    }

    return;
  }

  // Local development fallback. On Railway Free/Hobby, configure BREVO_API_KEY instead.
  await transporter.sendMail({
    from: `"CineMate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your CineMate email",
    html: htmlContent,
    text: `Welcome to CineMate. Verify your email address using this link: ${verificationUrl}`,
  });
};

module.exports = {
  sendVerificationEmail,
};
