const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  pickup: {
    name: { type: String, required: true },
    lat:  { type: Number, default: 29.8650 },
    lng:  { type: Number, default: 77.8983 },
  },
  destination: {
    name: { type: String, required: true },
    lat:  { type: Number, default: 29.8670 },
    lng:  { type: Number, default: 77.9000 },
  },

  status: {
    type: String,
    enum: ['requested', 'accepted', 'inprogress', 'completed', 'cancelled'],
    default: 'requested',
  },

  fare:     { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // minutes

  // Scheduling
  isScheduled:  { type: Boolean, default: false },
  scheduledAt:  { type: Date, default: null },

  // Lifecycle timestamps
  acceptedAt:   { type: Date, default: null },
  startedAt:    { type: Date, default: null },
  completedAt:  { type: Date, default: null },
  cancelledAt:  { type: Date, default: null },

  // Rating
  rating:       { type: Number, min: 1, max: 5, default: null },
  feedback:     { type: String, default: '' },

  // Cancellation
  cancelledBy:  { type: String, enum: ['passenger', 'driver', null], default: null },
  cancelReason: { type: String, default: '' },
}, { timestamps: true });

// Indexes for fast queries
rideSchema.index({ passenger: 1, status: 1 });
rideSchema.index({ driver: 1,    status: 1 });
rideSchema.index({ status: 1,    createdAt: -1 });

module.exports = mongoose.model('Ride', rideSchema);