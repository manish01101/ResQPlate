const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ["donor", "ngo", "admin"],
      required: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    // GeoJSON Point — enables 2dsphere spatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — MongoDB convention
        required: true,
      },
      address: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocument: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    aadhaarNumber: {
      type: String,
      default: null,
    },
    verificationDocumentType: {
      type: String,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: "",
    },
    verificationSubmittedAt: {
      type: Date,
      default: null,
    },
    verificationReviewedAt: {
      type: Date,
      default: null,
    },
    // Reliability score for mod-FA algorithm (0–1)
    reliabilityScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    totalPickups: { type: Number, default: 0 },
    totalCancellations: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// 2dsphere index on location — enables O(log N) geo queries
UserSchema.index({ location: "2dsphere" });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Recalculate reliability score after each pickup/cancellation
UserSchema.methods.updateReliability = function () {
  const total = this.totalPickups + this.totalCancellations;
  if (total === 0) {
    this.reliabilityScore = 0.5;
    return;
  }
  this.reliabilityScore = parseFloat((this.totalPickups / total).toFixed(3));
};

module.exports = mongoose.model("User", UserSchema);
