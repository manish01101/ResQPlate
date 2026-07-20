const nodemailer = require("nodemailer");

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[notifications] SMTP configuration not found. Email delivery will be skipped.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(
      `[notifications] Skipped email to ${to}. SMTP is not configured.`,
    );
    return { to, skipped: true };
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const message = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(message);
  return { to, info };
};

const sendEmailToRecipients = async (recipients = [], donation = {}) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return [];
  }

  const sendPromises = recipients.map(async (recipient) => {
    if (!recipient.email) {
      return {
        email: null,
        status: "skipped",
        reason: "recipient email missing",
      };
    }

    try {
      const subject = `New donation match: ${donation.food_title}`;
      const text = `A new donation has been posted nearby.

Title: ${donation.food_title}
Quantity: ${donation.quantity}
Expiry: ${new Date(donation.expiry_datetime).toLocaleString()}
Location: ${donation.location.address}

Please log in to the ResQPlate dashboard to claim this donation.`;
      const html = `
        <h2>New donation match available</h2>
        <p><strong>${donation.food_title}</strong></p>
        <ul>
          <li><strong>Quantity:</strong> ${donation.quantity}</li>
          <li><strong>Expiry:</strong> ${new Date(donation.expiry_datetime).toLocaleString()}</li>
          <li><strong>Location:</strong> ${donation.location.address}</li>
          <li><strong>Estimated match rank:</strong> ${recipient.rank}</li>
          <li><strong>Reliability:</strong> ${Math.round((recipient.reliabilityScore || 0) * 100)}%</li>
        </ul>
        <p>Please log in to <a href="${process.env.FRONTEND_URL || "https://your-app-url.com"}">ResQPlate</a> to respond.</p>
      `;

      const result = await sendEmail({
        to: recipient.email,
        subject,
        text,
        html,
      });

      return {
        email: recipient.email,
        status: "sent",
        messageId: result.info?.messageId || null,
      };
    } catch (error) {
      return {
        email: recipient.email,
        status: "failed",
        error: error.message,
      };
    }
  });

  return Promise.all(sendPromises);
};

module.exports = { sendEmailToRecipients };
