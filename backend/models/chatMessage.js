const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender_name: { type: String, default: "" },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

ChatMessageSchema.index({ claim_id: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
