const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Rating = require("../models/rating");
const Claim = require("../models/claim");
const Donation = require("../models/donation");
const User = require("../models/user");
const { protect } = require("../middleware/auth");

// @route  POST /api/ratings
// @desc   Rate + review the counterparty after a completed pickup
// @access Private
router.post("/", protect, async (req, res) => {
  try {
    const { claim_id, rating, review } = req.body;
    if (!claim_id || !rating)
      return res
        .status(400)
        .json({ success: false, message: "claim_id and rating are required" });
    if (!mongoose.isValidObjectId(claim_id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid claim_id" });

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be an integer 1-5" });
    }

    const claim = await Claim.findById(claim_id);
    if (!claim)
      return res
        .status(404)
        .json({ success: false, message: "Claim not found" });
    if (claim.status !== "completed")
      return res
        .status(400)
        .json({ success: false, message: "Only completed pickups can be rated" });

    const donation = await Donation.findById(claim.donation_id);
    const isNgo = String(claim.receiver_id) === String(req.user._id);
    const isDonor =
      !!donation && String(donation.donor_id) === String(req.user._id);

    if (req.user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admins cannot rate pickups" });
    }
    if (!isNgo && !isDonor) {
      return res.status(403).json({
        success: false,
        message: "Only participants of this pickup can rate it",
      });
    }

    // Determine who this user is rating
    const recipientId = isNgo ? donation.donor_id : claim.receiver_id;

    const existing = await Rating.findOne({
      claim_id,
      rater_id: req.user._id,
    });
    if (existing) {
      await Rating.updateOne(
        { _id: existing._id },
        { $set: { rating: numericRating, review: review || "" } },
      );
    } else {
      await Rating.create({
        claim_id,
        rater_id: req.user._id,
        recipient_id: recipientId,
        rating: numericRating,
        review: review || "",
      });
    }

    // Recompute the recipient's reliability + average rating
    const recipient = await User.findById(recipientId);
    if (recipient) {
      const aggs = await Rating.aggregate([
        { $match: { recipient_id: recipient._id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      const totalAvg = aggs[0]?.avg ?? null;
      const ratingsCount = aggs[0]?.count ?? 0;
      recipient.avgRating = totalAvg;
      recipient.totalRatings = ratingsCount;

      // Blend the rating with the pickup/cancellation history instead of
      // discarding it: behavior still matters, ratings add a signal.
      if (totalAvg !== null) {
        const ratingScore = totalAvg / 5;
        const totalActivity =
          recipient.totalPickups + recipient.totalCancellations;
        let blended;
        if (totalActivity === 0) {
          blended = ratingScore;
        } else {
          const behavior = recipient.totalPickups / totalActivity;
          blended = behavior * 0.4 + ratingScore * 0.6;
        }
        recipient.reliabilityScore = parseFloat(
          Math.min(1, Math.max(0, blended)).toFixed(3),
        );
      }
      await recipient.save();
    }

    res.json({
      success: true,
      message: existing ? "Rating updated" : "Thank you for your feedback!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/ratings/:userId
// @desc   Get ratings for a specific user
// @access Private
router.get("/:userId", protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ recipient_id: req.params.userId })
      .populate("rater_id", "name role")
      .sort("-createdAt")
      .limit(50);
    res.json({ success: true, count: ratings.length, data: ratings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;