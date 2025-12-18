import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "admin"],
      default: "donor",
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // Format: [longitude, latitude]
        required: false,
      },
    },
    isVerified: {
      type: Boolean,
      default: false, // Admin verifies NGOs
    },
  },
  { timestamps: true }
);

// creating a geospatial index for faster "Near Me" queries
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
