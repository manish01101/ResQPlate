const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
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

// Each party may rate once per claim (donor → NGO and NGO → donor)
RatingSchema.index({ claim_id: 1, rater_id: 1 }, { unique: true });

module.exports = mongoose.model("Rating", RatingSchema);
