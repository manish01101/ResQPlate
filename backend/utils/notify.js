const Notification = require("../models/notification");
const wsHub = require("../sockets/wsServer");

/**
 * Create an in-app notification, persist it, and push it in real-time
 * over raw WebSockets to the recipient's connected socket(s).
 */
const createAndSendNotification = async ({
  recipient,
  sender = null,
  type = "system",
  title,
  message = "",
  link = "",
  relatedId = null,
  data = {},
}) => {
  if (!recipient) return null;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    link,
    relatedId,
    data,
  });

  // Real-time push to the recipient's connected WebSocket(s)
  wsHub.notifyUser(String(recipient), {
    type: "notification",
    notification: {
      _id: notification._id,
      type,
      title,
      message,
      link,
      relatedId,
      read: false,
      data,
      createdAt: notification.createdAt,
    },
  });

  return notification;
};

const notifyUsers = async ({ recipients = [], ...opts }) => {
  const results = [];
  for (const recipient of recipients) {
    if (!recipient) continue;
    try {
      results.push(await createAndSendNotification({ ...opts, recipient }));
    } catch (err) {
      console.error("[notify] failed for", recipient, err.message);
    }
  }
  return results;
};

module.exports = { createAndSendNotification, notifyUsers };