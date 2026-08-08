const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Claim = require("../models/claim");
const Donation = require("../models/donation");
const ChatMessage = require("../models/chatMessage");
const { protect } = require("../middleware/auth");
const wsHub = require("../sockets/wsServer");
const { createAndSendNotification } = require("../utils/notify");

/**
 * Ensure the requesting user is a participant of a claim:
 * either the NGO who claimed, or the donor (or admin).
 */
async function assertParticipant(claim, userId) {
  if (!claim) return false;
  if (String(claim.receiver_id) === String(userId)) return true;
  const donation = await Donation.findById(claim.donation_id);
  if (donation && String(donation.donor_id) === String(userId)) return true;
  return false;
}

// @route  GET /api/chat/:claimId
// @desc   Get message history for a claim
// @access Private (participants + admin)
router.get("/:claimId", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.claimId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });

    const claim = await Claim.findById(req.params.claimId);
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });

    const isAdmin = req.user.role === "admin";
    const participant = await assertParticipant(claim, req.user._id);
    if (!participant && !isAdmin)
      return res
        .status(403)
        .json({ success: false, message: "Not a participant of this claim" });

    const messages = await ChatMessage.find({ claim_id: claim._id }).sort(
      "createdAt",
    );

    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  POST /api/chat/:claimId
// @desc   Send a chat message on a claim
// @access Private (participant + admin)
router.post("/:claimId", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.claimId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });

    const claim = await Claim.findById(req.params.claimId);
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });

    const participant = await assertParticipant(claim, req.user._id);
    if (!participant && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Not a participant of this claim" });

    const body = String(req.body.body || "").trim();
    if (!body)
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });

    const message = await ChatMessage.create({
      claim_id: claim._id,
      sender_id: req.user._id,
      sender_name: req.user.name,
      body,
      readBy: [req.user._id],
    });

    wsHub.notifyClaim(claim._id, { type: "chat", data: message });

    // Notify the other participant about the new message.
    const donation = await Donation.findById(claim.donation_id);
    const isSenderNgo = String(claim.receiver_id) === String(req.user._id);
    const otherPartyId =
      donation && isSenderNgo ? donation.donor_id : claim.receiver_id;

    if (String(otherPartyId) !== String(req.user._id)) {
      await createAndSendNotification({
        recipient: otherPartyId,
        sender: req.user._id,
        type: "chat",
        title: "New message",
        message: `${req.user.name}: ${body.slice(0, 120)}`,
        link: "/my-claims",
        relatedId: claim._id,
        data: { claimId: claim._id },
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/chat/:claimId/read
// @desc   Mark messages of a claim read by the current user
// @access Private (participant)
router.put("/:claimId/read", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.claimId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });

    const claim = await Claim.findById(req.params.claimId);
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });

    const participant = await assertParticipant(claim, req.user._id);
    if (!participant)
      return res
        .status(403)
        .json({ success: false, message: "Not a participant of this claim" });

    const result = await ChatMessage.updateMany(
      { claim_id: claim._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } },
    );

    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;