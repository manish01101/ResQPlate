const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const { protect } = require("../middleware/auth");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// @route  POST /api/auth/register
// @access Public
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
    body("role")
      .isIn(["donor", "ngo"])
      .withMessage("Role must be donor or ngo"),
    body("phone").notEmpty().withMessage("Phone required"),
    body("location.type")
      .optional()
      .equals("Point")
      .withMessage("Location type must be Point"),
    body("location.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Coordinates [lng, lat] required"),
    body("location.coordinates.0")
      .isFloat()
      .withMessage("Longitude must be a number"),
    body("location.coordinates.1")
      .isFloat()
      .withMessage("Latitude must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { name, email, password, role, phone, location } = req.body;

      const existing = await User.findOne({ email });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });

      const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
        location: {
          type: location?.type || "Point",
          coordinates: location?.coordinates || [0, 0],
          address: location?.address || "",
        },
      });
      const token = signToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          verificationDocument: user.verificationDocument,
          phone: user.phone,
          location: user.location,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// @route  POST /api/auth/login
// @access Public
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.matchPassword(password))) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
      const token = signToken(user._id);
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          verificationDocument: user.verificationDocument,
          phone: user.phone,
          location: user.location,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// @route  GET /api/auth/me
// @access Private
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
