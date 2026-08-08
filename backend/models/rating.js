const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      unique: true,
    },
    rater_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

RatingSchema.index({ recipient_id: 1 });
RatingSchema.index({ rater_id: 1 });

module.exports = mongoose.model("Rating", RatingSchema);
