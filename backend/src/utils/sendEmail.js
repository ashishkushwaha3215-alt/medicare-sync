const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Agar .env mein SMTP credentials diye hain toh real email bhejega, warna console par preview dikhayega
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"MediCare Sync" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
    } else {
      console.log(`📧 [Email Notification Simulated] To: ${to} | Subject: ${subject}`);
      console.log(`   Body: ${text}`);
    }
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

module.exports = sendEmail;