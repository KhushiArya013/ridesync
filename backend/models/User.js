const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['passenger', 'driver'], required: true },
  phone:    { type: String, default: '' },
  avatar:   { type: String, default: '' },

  // Stats
  rating:     { type: Number, default: 5.0, min: 1, max: 5 },
  totalRides: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },

  // Driver only
  vehicle: {
    type:          { type: String, enum: ['E-Rickshaw','Golf Cart','Mini Bus','Auto'], default: 'E-Rickshaw' },
    licenseNumber: { type: String, default: '' },
    vehicleId:     { type: String, default: '' },
  },
  isOnline:   { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  location: {
    lat: { type: Number, default: 29.8650 },
    lng: { type: Number, default: 77.8983 },
  },
  socketId: { type: String, default: '' },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);