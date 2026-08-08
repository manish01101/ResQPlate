const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Donation = require("../models/donation");
const User = require("../models/user");
const { protect, authorize } = require("../middleware/auth");
const {
  modFireflyAlgorithm,
  surgeRadiusKm,
} = require("../utils/algorithms");
const { sendEmailToRecipients } = require("../utils/notifications");
const { notifyUsers } = require("../utils/notify");

// Pagination helper: clamps and returns { skip, limit } for list endpoints
const paginate = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);
  return { skip: (page - 1) * limit, limit };
};

// Validate a [lng, lat] coordinate pair (finite, in-range numbers)
const isValidPoint = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  Number.isFinite(Number(coords[0])) &&
  Number.isFinite(Number(coords[1])) &&
  Number(coords[0]) >= -180 &&
  Number(coords[0]) <= 180 &&
  Number(coords[1]) >= -90 &&
  Number(coords[1]) <= 90;

// Parse + validate an expiry datetime string. Returns an error message or null.
const expiryError = (value) => {
  if (value === undefined || value === null || value === "") {
    return "Validation error: a valid expiry date/time is required.";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Validation error: expiry date/time must be a valid date.";
  }
  if (parsed < new Date()) {
    return "Validation error: Expiry date cannot be in the past.";
  }
  return null;
};

// @route  GET /api/donations
// @desc   Get all available donations (Standard list)
// @access Private
router.get("/", protect, async (req, res) => {
  try {
    const { status = "available" } = req.query;
    const { skip, limit } = paginate(req.query);
    const donations = await Donation.find({ status })
      .populate("donor_id", "name phone location")
      .sort("-createdAt")
      .limit(limit)
      .skip(skip);

    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/donations/nearby
// @desc   Get all available donations near a location
// @query  lat, lng, radius (km, default 5), status, page, limit
// @access Private
router.get("/nearby", protect, async (req, res) => {
  try {
    const { lat, lng, radius = 5, status = "available" } = req.query;
    const { skip, limit } = paginate(req.query);

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (lat || lng) {
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        return res.status(400).json({
          success: false,
          message: "lat and lng must both be valid numbers when provided",
        });
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({
          success: false,
          message: "lat/lng values are out of range",
        });
      }
    }
    const radiusNum = parseFloat(radius);
    if (!Number.isFinite(radiusNum) || radiusNum <= 0 || radiusNum > 100) {
      return res.status(400).json({
        success: false,
        message: "radius must be a number between 0 and 100 km",
      });
    }

    let query = { status };

    // Geo-spatial query using MongoDB 2dsphere index — O(log N)
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lngNum, latNum],
          },
          $maxDistance: radiusNum * 1000, // Convert km → metres
        },
      };
    }

    const donations = await Donation.find(query)
      .populate("donor_id", "name phone location")
      .limit(limit)
      .skip(skip);

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

// @route  GET /api/donations/ranking/:id — match transparency for the donor
// @desc   Return the scored match breakdown (surge radius, distance factor,
//         reliability, urgency bonus, final faScore) for a donation.
// @access Private (donor who posted it or admin)
router.get("/ranking/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation ID" });

    const donation = await Donation.findById(req.params.id);
    if (!donation)
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });

    if (
      String(donation.donor_id) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not your donation" });
    }

    // Recompute against the current verified volunteer pool so the donor
    // sees live breakdown data (and it stays honest after score updates).
    const [donorLng, donorLat] = donation.location.coordinates;
    const radiusKm = donation.surgeRadiusKm || surgeRadiusKm(donation.urgencyScore);
    const candidates = await User.find({
      role: { $in: ["ngo", "volunteer"] },
      isVerified: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [donorLng, donorLat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(50);

    const matched = modFireflyAlgorithm(donation, candidates, {
      topK: 10,
      radiusKm,
    });

    res.json({
      success: true,
      data: {
        donationId: donation._id,
        food_title: donation.food_title,
        surgeRadiusKm: matched.surgeRadiusKm,
        urgency: matched.urgency,
        candidates: matched.recipients,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/donations/:id
// @desc   Get single donation by ID (MUST remain below /nearby, /my and /ranking)
// @access Private
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation ID" });

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
    if (!location || !isValidPoint(location.coordinates)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid [lng, lat] coordinates within range are required.",
      });
    }
    if (!location.address || !String(location.address).trim()) {
      return res.status(400).json({
        success: false,
        message: "A pickup address is required.",
      });
    }

    // --- SAFETY CHECK: Expiry Date (Fixes TC03) ---
    const expiryErr = expiryError(expiry_datetime);
    if (expiryErr) {
      return res.status(400).json({ success: false, message: expiryErr });
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

    const donationWithUrgency = {
      ...donation.toObject(),
      urgencyScore: donation.urgencyScore ?? 0.5,
    };

    // --- MOD-FA STEP 1: compute the surge search radius from urgency ---
    // Urgent food reaches further (up to maxKm), fresh food stays local.
    const surgeRadius = surgeRadiusKm(donationWithUrgency.urgencyScore);

    // Run mod-FA to find top volunteers to notify (within the surge radius)
    const [donorLng, donorLat] = location.coordinates;
    const nearbyVolunteers = await User.find({
      role: { $in: ["ngo", "volunteer"] },
      isVerified: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [donorLng, donorLat] },
          $maxDistance: surgeRadius * 1000, // surge radius (km → metres)
        },
      },
    }).limit(50);

    let recommendedRecipients = [];
    let notificationResults = [];

    if (nearbyVolunteers.length > 0) {
      const matched = modFireflyAlgorithm(donationWithUrgency, nearbyVolunteers, {
        topK: 3,
        radiusKm: surgeRadius,
      });

      recommendedRecipients = matched.recipients.map((recipient) => {
        const volunteer = nearbyVolunteers.find(
          (vol) => vol._id.toString() === recipient.volunteerId.toString(),
        );
        return {
          ...recipient,
          email: volunteer?.email || null,
        };
      });

      console.log(
        `[mod-FA] "${donation.food_title}" urgency=${matched.urgency} surgeRadius=${matched.surgeRadiusKm}km -> ${recommendedRecipients.length} candidate(s)`,
      );

      await Donation.findByIdAndUpdate(
        donation._id,
        { recommendedRecipients, surgeRadiusKm: matched.surgeRadiusKm },
        { runValidators: true },
      );

      notificationResults = await sendEmailToRecipients(
        recommendedRecipients,
        donationWithUrgency,
      );

      // Push in-app real-time notifications to recommended volunteers
      await notifyUsers({
        recipients: recommendedRecipients.map((r) => r.volunteerId),
        sender: req.user._id,
        type: "new_donation",
        title: "New donation available",
        message: `"${donation.food_title}" was posted nearby. Open Find Food to claim it!`,
        link: "/find-food",
        relatedId: donation._id,
      });
    }

    const savedDonation = await Donation.findById(donation._id);

    res.status(201).json({
      success: true,
      data: savedDonation,
      recommendedRecipients,
      notificationResults,
      surgeRadiusKm: surgeRadius,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/donations/:id
// @access Private (owner donor or admin)
router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation ID" });

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
    if (req.body.expiry_datetime !== undefined) {
      const expiryErr = expiryError(req.body.expiry_datetime);
      if (expiryErr) {
        return res.status(400).json({
          success: false,
          message: expiryErr,
        });
      }
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
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation ID" });

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
