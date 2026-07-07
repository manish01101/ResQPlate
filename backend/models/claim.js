const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  donation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickup_pin: {
    type: String, 
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  // Distance at time of claim (km) — recorded for analytics
  distanceKm: Number,
  // mod-FA score that caused this volunteer to be selected
  faScore: Number,
  notes: String
}, { timestamps: true });

// Index: find all claims for a donation quickly
ClaimSchema.index({ donation_id: 1 });
// Index: find all claims by a volunteer
ClaimSchema.index({ receiver_id: 1, status: 1 });

module.exports = mongoose.model('Claim', ClaimSchema);