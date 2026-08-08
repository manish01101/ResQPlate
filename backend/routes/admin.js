const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Donation = require("../models/donation");
const Claim = require("../models/claim");
const { protect, authorize } = require("../middleware/auth");
const { createAndSendNotification } = require("../utils/notify");

// All admin routes require admin role
router.use(protect, authorize("admin"));

// @route  GET /api/admin/stats
// @desc   Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const [users, donations, claims] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Donation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const toMap = (arr) =>
      arr.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        users: toMap(users),
        donations: toMap(donations),
        claims: toMap(claims),
        totalUsers: users.reduce((s, u) => s + u.count, 0),
        totalDonations: donations.reduce((s, d) => s + d.count, 0),
        totalClaims: claims.reduce((s, c) => s + c.count, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/admin/users
// @desc   List all users (sensitive verification PII excluded)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-aadhaarNumber -verificationDocument -verificationNotes")
      .sort("-createdAt");
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/admin/users/:id/verification
// @desc   Full verification record (PII) for a single user being reviewed
router.get("/users/:id/verification", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email phone role isVerified verificationStatus verificationDocument verificationDocumentType verificationNotes verificationSubmittedAt verificationReviewedAt aadhaarNumber",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/admin/users/:id/verify
// @desc   Verify an NGO/Volunteer
router.put("/users/:id/verify", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verificationStatus: "verified",
        verificationReviewedAt: new Date(),
      },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    await createAndSendNotification({
      recipient: user._id,
      sender: req.user._id,
      type: "account_verified",
      title: "Account verified",
      message: `Congratulations ${user.name}! Your account was verified. You can now donate and claim pickups.`,
      link: "/dashboard",
      relatedId: user._id,
    });

    res.json({
      success: true,
      message: `${user.name} verified successfully`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/admin/users/:id/reject
router.put("/users/:id/reject", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: false,
        verificationStatus: "rejected",
        verificationReviewedAt: new Date(),
      },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    await createAndSendNotification({
      recipient: user._id,
      sender: req.user._id,
      type: "account_rejected",
      title: "Verification rejected",
      message: `Your account verification was rejected. Please re-submit a valid document.`,
      link: "/verify",
      relatedId: user._id,
    });

    res.json({ success: true, message: "Verification rejected", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  DELETE /api/admin/users/:id
// @desc   Delete a user
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/admin/donations
// @desc   All donations (any status)
router.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donor_id", "name email")
      .populate("claimed_by", "name")
      .sort("-createdAt")
      .limit(200);
    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// NEW: Fetch all global claims for Admin
// ==========================================
// @route  GET /api/admin/claims
// @desc   All claims/requests (any status)
router.get("/claims", async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("donation_id", "food_title donor_id quantity location")
      .populate("receiver_id", "name email phone")
      .sort("-createdAt")
      .limit(200);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
