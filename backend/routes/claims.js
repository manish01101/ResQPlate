const express = require("express");
const router = express.Router();
const Claim = require("../models/claim");
const Donation = require("../models/donation");
const User = require("../models/user");
const { protect, authorize } = require("../middleware/auth");
const { haversineDistance } = require("../utils/algorithms");

// @route  POST /api/claims
// @desc   NGO/Volunteer claims a donation
// @access Private (ngo)
router.post("/", protect, authorize("ngo"), async (req, res) => {
  try {
    const { donation_id } = req.body;

    if (req.user.role !== "ngo" || !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Your account needs admin verification before you can claim pickups.",
      });
    }

    const donation = await Donation.findById(donation_id);
    if (!donation)
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    if (donation.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Donation is already ${donation.status}`,
      });
    }

    // Prevent duplicate claims from same user
    const existing = await Claim.findOne({
      donation_id,
      receiver_id: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You have already claimed this donation",
      });

    // Calculate distance at time of claim
    const [dLng, dLat] = donation.location.coordinates;
    const [vLng, vLat] = req.user.location.coordinates;
    const distanceKm = haversineDistance(dLat, dLng, vLat, vLng);

    const claim = await Claim.create({
      donation_id,
      receiver_id: req.user._id,
      distanceKm,
      faScore: req.body.faScore || null,
    });

    // Mark donation as claimed and lock it from other volunteers
    donation.status = "claimed";
    donation.claimed_by = req.user._id;
    donation.claimed_at = new Date();
    await donation.save();

    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/claims/:id/accept
// @desc   Donor accepts the claim
// @access Private (donor)
// PUT /api/claims/:id/accept
router.put("/:id/accept", protect, authorize("donor"), async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("donation_id");
    if (claim.donation_id.donor_id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not your donation" });
    }

    // Generate a random 4-digit PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    claim.pickup_pin = generatedPin;

    claim.status = "accepted";
    claim.acceptedAt = new Date();
    await claim.save();

    await Donation.findByIdAndUpdate(claim.donation_id, {
      status: "claimed",
    });

    res.json({ success: true, data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const completeClaimHandler = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("donation_id");
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });

    const { pin, pickup_pin } = req.body;
    const expectedPin = String(claim.pickup_pin).trim();
    const receivedPin = String(pin ?? pickup_pin ?? "").trim();

    if (expectedPin !== receivedPin) {
      return res.status(400).json({
        success: false,
        message: "Invalid Pickup PIN. Please check with the donor.",
      });
    }

    claim.status = "completed";
    claim.completedAt = new Date();
    await claim.save();

    await Donation.findByIdAndUpdate(claim.donation_id, {
      status: "completed",
    });

    // Update volunteer reliability score
    const volunteer = await User.findById(claim.receiver_id);
    if (volunteer) {
      volunteer.totalPickups += 1;
      volunteer.updateReliability();
      await volunteer.save();
    }

    res.json({
      success: true,
      data: claim,
      message: "Pickup confirmed! Reliability score updated.",
    });
  } catch (err) {
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
// @desc   Cancel a claim — penalizes reliability score
// @access Private
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate("donation_id");
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });

    claim.status = "cancelled";
    claim.cancelledAt = new Date();
    await claim.save();

    // Re-open the donation
    await Donation.findByIdAndUpdate(claim.donation_id, {
      status: "available",
      claimed_by: null,
      claimed_at: null,
    });

    // Penalize reliability
    const volunteer = await User.findById(claim.receiver_id);
    if (volunteer) {
      volunteer.totalCancellations += 1;
      volunteer.updateReliability();
      await volunteer.save();
    }

    res.json({
      success: true,
      message: "Claim cancelled. Donation relisted as available.",
    });
  } catch (err) {
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
