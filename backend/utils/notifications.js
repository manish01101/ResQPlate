const sendEmail = async ({ to, subject, text, html }) => {
  const serviceId =
    process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId =
    process.env.EMAILJS_TEMPLATE_ID ||
    process.env.EMAILJS_NEWSLETTER_TEMPLATE_ID ||
    process.env.VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID;
  const publicKey =
    process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn(
      "[notifications] EmailJS configuration not found. Email delivery will be skipped.",
    );
    return { to, skipped: true };
  }

  const overrideEmail = process.env.NOTIFICATION_OVERRIDE_EMAIL;
  const recipientEmail = overrideEmail || to;

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: recipientEmail,
      subject,
      message: text,
      html,
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS request failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    to: recipientEmail,
    info: {
      messageId: data?.id || null,
    },
  };
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

module.exports = { sendEmail, sendEmailToRecipients };
