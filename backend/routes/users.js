const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Donation = require("../models/donation");
const Claim = require("../models/claim");
const { protect } = require("../middleware/auth");

// @route  GET /api/users/profile
router.get("/profile", protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @route  PUT /api/users/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const allowed = ["name", "phone", "location"];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/users/volunteers/nearby
// @desc   Get verified volunteers near a location (for mod-FA preview)
router.get("/volunteers/nearby", protect, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng)
      return res
        .status(400)
        .json({ success: false, message: "lat and lng required" });

    const volunteers = await User.find({
      role: { $in: ["ngo"] },
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    })
      .select("name phone location reliabilityScore totalPickups")
      .limit(10);

    res.json({ success: true, count: volunteers.length, data: volunteers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  POST /api/users/verify-submit
// @desc   User submits government ID for verification
router.post("/verify-submit", protect, async (req, res) => {
  try {
    const { documentUrl, aadhaarNumber, documentType, notes } = req.body;
    if (!documentUrl || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document and provide your Aadhaar number",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        verificationDocument: documentUrl,
        verificationStatus: "pending",
        aadhaarNumber,
        verificationDocumentType: documentType || "Aadhaar",
        verificationNotes: notes || "",
        verificationSubmittedAt: new Date(),
        verificationReviewedAt: null,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Verification submitted to Admin",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// @route  GET /api/users/impact
// @desc   Environmental + social impact metrics for the logged-in user
// @access Private
router.get("/impact", protect, async (req, res) => {
  try {
    let donations = [];
    let claims = [];

    if (req.user.role === "donor") {
      donations = await Donation.find({ donor_id: req.user._id }).select(
        "quantity status food_type",
      );
    } else if (req.user.role === "ngo") {
      claims = await Claim.find({
        receiver_id: req.user._id,
        status: "completed",
      }).populate("donation_id", "quantity food_type");
    }

    // Extract a numeric "servings/meals" figure from free-text quantities
    const toMeals = (quantity, food_type) => {
      if (!quantity) return 0;
      const str = String(quantity).toLowerCase();
      const numbers = str.match(/\d+(\.\d+)?/g)?.map(Number) || [];
      const base = numbers[0] || 0;
      if (/\b(serv|meal|person|plate|people)\b/.test(str)) return Math.floor(base);
      if (/\btray\b|\bkg\b|\bkg\b|\bkilogram/.test(str)) {
        // ~2.5 meals per kg of food; trays ~ 15 meals
        const perUnit = /\btray/.test(str) ? 15 : 2.5;
        return Math.floor(base * perUnit);
      }
      // Fallback: treat the raw number as servings
      return Math.floor(base);
    };

    const selected =
      req.user.role === "donor"
        ? donations
            .filter((d) => d.status === "completed")
            .map((d) => d.toObject())
        : claims.map((c) => c.donation_id?.toObject?.() || {});

    let meals = 0;
    selected.forEach((d) => {
      meals += toMeals(d?.quantity, d?.food_type);
    });

    const mealsServed = meals;
    const kgFood = Math.round(meals * 0.4); // ~0.4 kg of food per meal
    const co2Offset = Math.round(kgFood * 2.5); // ~2.5 kg CO₂e saved per kg food

    res.json({
      success: true,
      data: {
        mealsServed,
        kgFood,
        co2Offset,
        pickups: req.user.role === "ngo" ? claims.length : selected.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
