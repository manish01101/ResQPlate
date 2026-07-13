const express = require("express");
const router = express.Router();
const User = require("../models/user");
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
module.exports = router;
