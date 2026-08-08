const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/notification");
const { protect } = require("../middleware/auth");

// @route  GET /api/notifications
// @desc   List the current user's notifications + unread count
// @access Private
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort("-createdAt")
      .limit(limit)
      .skip((page - 1) * limit);

    const unread = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unread,
      data: notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/notifications/unread-count
// @desc   Quick unread badge count (lightweight)
// @access Private
router.get("/unread-count", protect, async (req, res) => {
  try {
    const unread = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/notifications/:id/read
// @desc   Mark a single notification as read
// @access Private
router.put("/:id/read", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    if (!notification.read) await notification.markRead();
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/notifications/read-all
// @desc   Mark all the user's notifications as read
// @access Private
router.put("/read-all", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } },
    );
    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  DELETE /api/notifications/:id
// @desc   Delete a single notification
// @access Private
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  DELETE /api/notifications
// @desc   Clear all read notifications
// @access Private
router.delete("/", protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true,
    });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;