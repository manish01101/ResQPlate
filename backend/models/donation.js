const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    donor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    food_title: {
      type: String,
      required: [true, "Food title is required"],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, "Quantity is required"],
    },
    food_type: {
      type: String,
      enum: ["vegetarian", "non-vegetarian", "vegan"],
      default: "vegetarian",
    },
    expiry_datetime: {
      type: Date,
      required: [true, "Expiry date/time is required"],
    },
    status: {
      type: String,
      enum: ["available", "claimed", "expired"],
      default: "available",
    },
    // GeoJSON Point — 2dsphere indexed for $near queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    notes: String,
    image_url: {
      type: String,
      default: null,
    },
    // Populated when claimed
    claimed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimed_at: Date,
  },
  { timestamps: true },
);

// 2dsphere index — powers the Haversine + $near geo queries
DonationSchema.index({ location: "2dsphere" });

// Compound index for common query: available donations, newest first
DonationSchema.index({ status: 1, createdAt: -1 });

// Virtual: time remaining before expiry (in minutes)
DonationSchema.virtual("minutesRemaining").get(function () {
  if (this.status !== "available") return 0;
  return Math.max(0, Math.floor((this.expiry_datetime - Date.now()) / 60000));
});

// Virtual: food urgency score for mod-FA (quantity proxy × time urgency)
DonationSchema.virtual("urgencyScore").get(function () {
  const minutesLeft = this.minutesRemaining;
  if (minutesLeft === 0) return 0;
  // Higher score = more urgent (less time left = higher urgency)
  return parseFloat(Math.min(1, 120 / minutesLeft).toFixed(3));
});

DonationSchema.set("toJSON", { virtuals: true });
DonationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Donation", DonationSchema);
