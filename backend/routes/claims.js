const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Claim = require("../models/claim");
const Donation = require("../models/donation");
const User = require("../models/user");
const { protect, authorize } = require("../middleware/auth");
const { haversineDistance } = require("../utils/algorithms");
const { createAndSendNotification } = require("../utils/notify");

// @route  POST /api/claims
// @desc   NGO/Volunteer claims a donation
// @access Private (ngo)
router.post("/", protect, authorize("ngo"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { donation_id } = req.body;
    if (!mongoose.isValidObjectId(donation_id)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation ID" });
    }

    if (req.user.role !== "ngo" || !req.user.isVerified) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message:
          "Your account needs admin verification before you can claim pickups.",
      });
    }

    const donation = await Donation.findById(donation_id).session(session);
    if (!donation) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }
    if (donation.status !== "available") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Donation is already ${donation.status}`,
      });
    }

    // Prevent duplicate claims from same user (inside the transaction)
    const existing = await Claim.findOne({
      donation_id,
      receiver_id: req.user._id,
      status: { $in: ["pending", "accepted"] },
    }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "You have already claimed this donation",
      });
    }

    // Calculate distance at time of claim
    const [dLng, dLat] = donation.location.coordinates;
    const [vLng, vLat] = req.user.location.coordinates;
    const distanceKm = haversineDistance(dLat, dLng, vLat, vLng);

    const [claim] = await Claim.create(
      [
        {
          donation_id,
          receiver_id: req.user._id,
          distanceKm,
          faScore: req.body.faScore || null,
        },
      ],
      { session },
    );

    // Atomically lock the donation — closes the double-claim race window
    const locked = await Donation.findOneAndUpdate(
      { _id: donation_id, status: "available" },
      {
        status: "claimed",
        claimed_by: req.user._id,
        claimed_at: new Date(),
      },
      { session, new: true, runValidators: true },
    );
    if (!locked) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "This donation was just claimed by someone else.",
      });
    }

    await session.commitTransaction();
    session.endSession();

    // Notify the donor in real-time that a volunteer wants their food
    await createAndSendNotification({
      recipient: donation.donor_id,
      sender: req.user._id,
      type: "claim_request",
      title: "New pickup request",
      message: `${req.user.name} has requested to claim "${donation.food_title}".`,
      link: "/my-claims",
      relatedId: donation._id,
      data: { claimId: claim._id },
    });

    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/claims/:id/accept
// @desc   Donor accepts the claim
// @access Private (donor)
// PUT /api/claims/:id/accept
router.put("/:id/accept", protect, authorize("donor"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });
    }

    const claim = await Claim.findById(req.params.id)
      .populate("donation_id")
      .session(session);
    if (!claim) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    }
    if (claim.status !== "pending") {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: `Claim is already ${claim.status}` });
    }
    if (claim.donation_id.donor_id.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: "Not your donation" });
    }

    // Generate a random 4-digit PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    claim.pickup_pin = generatedPin;

    claim.status = "accepted";
    claim.acceptedAt = new Date();
    await claim.save({ session });

    await Donation.findByIdAndUpdate(
      claim.donation_id,
      { status: "claimed" },
      { session, runValidators: true },
    );

    await session.commitTransaction();
    session.endSession();

    // Notify the volunteer that their request was approved + share PIN
    await createAndSendNotification({
      recipient: claim.receiver_id,
      sender: req.user._id,
      type: "claim_accepted",
      title: "Claim approved!",
      message: `Your request for "${claim.donation_id.food_title}" was approved. Share the pickup PIN with the donor when you arrive.`,
      link: "/my-claims",
      relatedId: claim.donation_id._id,
      data: { claimId: claim._id, pickupPin: generatedPin },
    });

    res.json({ success: true, data: claim });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
});

const completeClaimHandler = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });
    }

    const claim = await Claim.findById(req.params.id)
      .populate("donation_id")
      .session(session);
    if (!claim) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    }
    if (claim.status !== "accepted") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Only accepted claims can be completed (current: ${claim.status})`,
      });
    }

    const { pin, pickup_pin } = req.body;
    const expectedPin = String(claim.pickup_pin).trim();
    const receivedPin = String(pin ?? pickup_pin ?? "").trim();

    if (expectedPin !== receivedPin) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid Pickup PIN. Please check with the donor.",
      });
    }

    claim.status = "completed";
    claim.completedAt = new Date();
    await claim.save({ session });

    await Donation.findByIdAndUpdate(
      claim.donation_id,
      { status: "completed" },
      { session, runValidators: true },
    );

    // Update volunteer reliability score
    const volunteer = await User.findById(claim.receiver_id).session(session);
    if (volunteer) {
      volunteer.totalPickups += 1;
      volunteer.updateReliability();
      await volunteer.save({ session });
    }

    const donor = await User.findById(claim.donation_id.donor_id);

    await session.commitTransaction();
    session.endSession();

    // Notify the donor pickup was completed
    await createAndSendNotification({
      recipient: donor?._id,
      sender: claim.receiver_id,
      type: "claim_completed",
      title: "Pickup completed!",
      message: `${volunteer?.name || "A volunteer"} has verified pickup of "${claim.donation_id.food_title}".`,
      link: "/my-claims",
      relatedId: claim.donation_id._id,
      data: { claimId: claim._id },
    });

    res.json({
      success: true,
      data: claim,
      message: "Pickup confirmed! Reliability score updated.",
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  PUT /api/claims/:id/complete
// @route  POST /api/claims/:id/complete
// @route  PUT /api/claims/:id/verify
// @route  POST /api/claims/:id/verify
// @desc   Mark pickup as physically completed
// @access Private (ngo or donor)
router.put(["/:id/complete", "/:id/verify"], protect, completeClaimHandler);
router.post(["/:id/complete", "/:id/verify"], protect, completeClaimHandler);

// @route  PUT /api/claims/:id/cancel
// @desc   Cancel a claim — only volunteer-initiated cancels penalize reliability
// @access Private
router.put("/:id/cancel", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim ID" });
    }

    const claim = await Claim.findById(req.params.id)
      .populate("donation_id")
      .session(session);
    if (!claim) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    }
    if (claim.status === "completed") {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Completed claims cannot be cancelled" });
    }

    // Only participants can cancel
    const isDonor = req.user.role === "donor";
    const isVolunteer = req.user.role === "ngo";
    const isOwner =
      (isDonor && String(claim.donation_id?.donor_id) === String(req.user._id)) ||
      (isVolunteer && String(claim.receiver_id) === String(req.user._id));
    if (!isOwner && req.user.role !== "admin") {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to cancel this claim" });
    }

    claim.status = "cancelled";
    claim.cancelledAt = new Date();
    claim.cancelledBy = isVolunteer ? "ngo" : "donor";
    await claim.save({ session });

    // Re-open the donation
    await Donation.findByIdAndUpdate(
      claim.donation_id,
      { status: "available", claimed_by: null, claimed_at: null },
      { session, runValidators: true },
    );

    // Penalize reliability ONLY for volunteer-initiated cancellations
    if (isVolunteer) {
      const volunteer = await User.findById(claim.receiver_id).session(session);
      if (volunteer) {
        volunteer.totalCancellations += 1;
        volunteer.updateReliability();
        await volunteer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Notify the counterparty depending on who cancelled/rejected
    const recipientId = isDonor ? claim.receiver_id : claim.donation_id.donor_id;
    await createAndSendNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: isDonor ? "claim_rejected" : "claim_cancelled",
      title: isDonor ? "Request rejected" : "Request cancelled",
      message: `${req.user.name} ${isDonor ? "rejected" : "cancelled"} the request for "${claim.donation_id?.food_title || "a donation"}".`,
      link: "/my-claims",
      relatedId: claim.donation_id?._id || null,
      data: { claimId: claim._id },
    });

    res.json({
      success: true,
      message: "Claim cancelled. Donation relisted as available.",
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/claims/my
// @desc   Get claims for logged-in user (Personal Requests/Claims)
// @access Private
router.get("/my", protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "ngo") {
      // NGOs only see the claims they have made
      query = { receiver_id: req.user._id };
    } else {
      // Donors AND Admins see incoming requests for THEIR specific donations
      // 1. First, find all donations posted by this specific user
      const myDonations = await Donation.find({
        donor_id: req.user._id,
      }).select("_id");
      const myDonationIds = myDonations.map((d) => d._id);

      // 2. Then, find claims that are attached to those donations
      query = { donation_id: { $in: myDonationIds } };
    }

    const claims = await Claim.find(query)
      .populate({
        path: "donation_id",
        select: "food_title quantity location expiry_datetime donor_id",
        populate: {
          path: "donor_id",
          select: "name phone",
        },
      })
      .populate("receiver_id", "name phone")
      .sort("-requestedAt")
      .limit(50);

    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
