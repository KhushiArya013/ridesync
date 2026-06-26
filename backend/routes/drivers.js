const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Ride     = require('../models/Ride');
const Rating   = require('../models/Rating');
const { protect, driverOnly } = require('../middleware/auth');

router.get('/online', protect, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isOnline: true }).select('-password').sort({ rating: -1 });
    res.json(drivers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/status', protect, driverOnly, async (req, res) => {
  const { isOnline } = req.body;
  try {
    req.user.isOnline = isOnline;
    await req.user.save();
    req.io.emit('driver:status', { driverId: req.user._id, isOnline, name: req.user.name, vehicle: req.user.vehicle, location: req.user.location, rating: req.user.rating });
    res.json({ isOnline });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/location', protect, driverOnly, async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });
  try {
    await User.findByIdAndUpdate(req.user._id, { location: { lat, lng } });
    req.io.emit('driver:location', { driverId: req.user._id, lat, lng, name: req.user.name });
    res.json({ location: { lat, lng } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/dashboard', protect, driverOnly, async (req, res) => {
  try {
    const driverId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: 'Invalid driver ID' });
    }

    const driverObjectId = new mongoose.Types.ObjectId(driverId);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [total, active, completed, cancelled, todayRides, ratings, recent, earnings] = await Promise.all([
      Ride.countDocuments({ driver: driverObjectId }),
      Ride.countDocuments({ driver: driverObjectId, status: { $in: ['accepted', 'inprogress'] } }),
      Ride.countDocuments({ driver: driverObjectId, status: 'completed' }),
      Ride.countDocuments({ driver: driverObjectId, status: 'cancelled' }),
      Ride.countDocuments({ driver: driverObjectId, status: 'completed', completedAt: { $gte: today } }),
      Rating.find({ driver: driverObjectId }).sort({ createdAt: -1 }).limit(10),
      Ride.find({ driver: driverObjectId }).populate('passenger', 'name').sort({ createdAt: -1 }).limit(10),
      Ride.aggregate([
        { $match: { driver: driverObjectId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]),
    ]);

    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
      : '5.0';

    res.json({
      total, active, completed, cancelled, todayRides,
      avgRating,
      totalEarnings: earnings[0]?.total || 0,
      recentRides: recent,
      recentRatings: ratings,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;