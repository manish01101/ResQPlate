const express = require("express");
const router = express.Router();
const Donation = require("../models/donation");
const User = require("../models/user");
const { protect, authorize } = require("../middleware/auth");
const { modFireflyAlgorithm } = require("../utils/algorithms");
const { sendEmailToRecipients } = require("../utils/notifications");

// @route  GET /api/donations
// @desc   Get all available donations (Standard list)
// @access Private
router.get("/", protect, async (req, res) => {
  try {
    const { status = "available" } = req.query;
    const donations = await Donation.find({ status })
      .populate("donor_id", "name phone location")
      .sort("-createdAt")
      .limit(50);

    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/donations/nearby
// @desc   Get all available donations near a location
// @query  lat, lng, radius (km, default 5), status
// @access Private
router.get("/nearby", protect, async (req, res) => {
  try {
    const { lat, lng, radius = 5, status = "available" } = req.query;
    let query = { status };

    // Geo-spatial query using MongoDB 2dsphere index — O(log N)
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km → metres
        },
      };
    }

    const donations = await Donation.find(query)
      .populate("donor_id", "name phone location")
      .limit(50);

    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/donations/my
// @desc   Get logged-in donor's donations
// @access Private (donor)
router.get("/my", protect, authorize("donor"), async (req, res) => {
  try {
    const donations = await Donation.find({ donor_id: req.user._id })
      .populate("claimed_by", "name phone")
      .sort("-createdAt");
    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/donations/:id
// @desc   Get single donation by ID (MUST remain below /nearby and /my)
// @access Private
router.get("/:id", protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donor_id", "name phone location")
      .populate("claimed_by", "name phone");

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  POST /api/donations
// @access Private (donors only)
router.post("/", protect, authorize("donor"), async (req, res) => {
  try {
    if (req.user.role === "donor" && !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account must be verified before you can donate food.",
      });
    }

    const {
      food_title,
      quantity,
      food_type,
      expiry_datetime,
      location,
      notes,
      image_url,
    } = req.body;

    // --- SAFETY CHECK: Coordinates ---
    if (
      !location ||
      !location.coordinates ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid location coordinates are required.",
      });
    }

    // --- SAFETY CHECK: Expiry Date (Fixes TC03) ---
    if (new Date(expiry_datetime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Validation error: Expiry date cannot be in the past.",
      });
    }

    const donation = await Donation.create({
      donor_id: req.user._id,
      food_title,
      quantity,
      food_type,
      expiry_datetime,
      location,
      notes,
      image_url,
    });

    // Run mod-FA to find top volunteers to notify
    const [donorLng, donorLat] = location.coordinates;
    const nearbyVolunteers = await User.find({
      role: { $in: ["ngo", "volunteer"] },
      isVerified: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [donorLng, donorLat] },
          $maxDistance: 10000, // 10km search radius for notifications
        },
      },
    }).limit(20);

    let recommendedRecipients = [];
    let notificationResults = [];

    if (nearbyVolunteers.length > 0) {
      recommendedRecipients = modFireflyAlgorithm(donation, nearbyVolunteers, {
        topK: 3,
      }).map((recipient) => {
        const volunteer = nearbyVolunteers.find(
          (vol) => vol._id.toString() === recipient.volunteerId.toString(),
        );
        return {
          ...recipient,
          email: volunteer?.email || null,
        };
      });

      console.log(
        "[mod-FA] Recommended recipients:",
        recommendedRecipients.map((v) => v.name),
      );

      await Donation.findByIdAndUpdate(donation._id, {
        recommendedRecipients,
      });

      notificationResults = await sendEmailToRecipients(
        recommendedRecipients,
        donation,
      );
    }

    const savedDonation = await Donation.findById(donation._id);

    res.status(201).json({
      success: true,
      data: savedDonation,
      recommendedRecipients,
      notificationResults,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/donations/:id
// @access Private (owner donor or admin)
router.put("/:id", protect, async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (
      donation.donor_id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (donation.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a claimed or expired donation",
      });
    }

    // --- SAFETY CHECK: Edited Expiry Date ---
    if (
      req.body.expiry_datetime &&
      new Date(req.body.expiry_datetime) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Validation error: Expiry date cannot be in the past.",
      });
    }

    const allowed = [
      "food_title",
      "quantity",
      "food_type",
      "expiry_datetime",
      "notes",
      "image_url",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) donation[field] = req.body[field];
    });
    await donation.save();

    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  DELETE /api/donations/:id
// @access Private (owner or admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (
      donation.donor_id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await donation.deleteOne();
    res.json({ success: true, message: "Donation removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
