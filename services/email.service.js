const nodemailer = require("nodemailer");
const env = require("../config/env.config");
const path = require("path");
const fs = require("fs");

const isConfigured = () => !!(env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
};

const sendInvoiceEmail = async (toEmail, userName, orderId, invoiceFilename) => {
  if (!isConfigured()) {
    throw Object.assign(new Error("Email service is not configured. Set SMTP_USER and SMTP_PASS in .env"), { code: "ECONFIG" });
  }

  const filepath = path.join(__dirname, "..", "public", "documents", invoiceFilename);
  if (!fs.existsSync(filepath)) {
    throw new Error("Invoice file not found. Generate it first.");
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Organic Store" <${env.smtpFrom}>`,
    to: toEmail,
    subject: `Invoice for Order #${orderId.toString().slice(-8).toUpperCase()} — Organic Store`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 48px; height: 48px; background: #16a34a; color: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;">OS</div>
          <h2 style="color: #166534; margin: 8px 0 0;">Organic Store</h2>
        </div>
        <p style="font-size: 15px; color: #374151;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Thank you for your order! Your invoice is attached to this email.</p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Order ID</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #166534;">#${orderId.toString().slice(-8).toUpperCase()}</p>
        </div>
        <p style="font-size: 13px; color: #9ca3af;">If you have any questions, reply to this email or contact us through the Messages section on our website.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Organic Store — Fresh, organic goodness delivered to your doorstep.</p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${orderId}.pdf`,
        path: filepath,
      },
    ],
  });

  return info;
};

module.exports = { sendInvoiceEmail, isConfigured };
