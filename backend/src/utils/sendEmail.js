
const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      console.error('Email skipped: Required email fields are missing');
      return false;
    }

    const emailTransporter = getTransporter();

    if (!emailTransporter) {
      if (process.env.NODE_ENV === 'production') {
        console.error('Email failed: SMTP configuration is missing');
        return false;
      }

      console.log(`[Email Simulated] To: ${to} | Subject: ${subject}`);
      console.log(`Body: ${text || 'HTML email'}`);
      return false;
    }

    await emailTransporter.sendMail({
      from: `"MediCare Sync" <${process.env.SMTP_USER}>`,
      to: to.trim(),
      subject: subject.trim(),
      text,
      html,
    });

    console.log(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

module.exports = sendEmail;
