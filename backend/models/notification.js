const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "claim_request",
        "claim_accepted",
        "claim_rejected",
        "claim_cancelled",
        "claim_completed",
        "new_donation",
        "account_verified",
        "account_rejected",
        "chat",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Efficient lookup: notifications per user, unread first, newest first
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

NotificationSchema.methods.markRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Notification", NotificationSchema);
