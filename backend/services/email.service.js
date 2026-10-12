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

  const textContent = `Welcome to CineMate. Verify your email address using this link: ${verificationUrl}`;

  // Use Resend over HTTPS on Railway; it avoids blocked outbound SMTP.
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
        subject: "Verify your CineMate email",
        html: htmlContent,
        text: textContent,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 1000);
      throw new Error(`Resend API request failed (HTTP ${response.status}): ${responseBody}`);
    }

    return;
  }

  // Keep Brevo available for deployments already configured with it.
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
        textContent,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 1000);
      throw new Error(`Brevo API request failed (HTTP ${response.status}): ${responseBody}`);
    }

    return;
  }

  // Never silently fall back to SMTP on Railway; that produces opaque timeouts.
  if (
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "No HTTPS email provider configured. Add RESEND_API_KEY to the Railway backend service variables and redeploy."
    );
  }

  // Local development fallback only.
  await transporter.sendMail({
    from: `"CineMate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your CineMate email",
    html: htmlContent,
    text: textContent,
  });
};

module.exports = {
  sendVerificationEmail,
};
