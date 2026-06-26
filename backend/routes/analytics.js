const express = require('express');
const router  = express.Router();
const Ride    = require('../models/Ride');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ── GET /api/analytics/overview ───────────────────────────────
router.get('/overview', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const [total, todayRides, active, onlineDrivers, passengers, completionRate] =
      await Promise.all([
        Ride.countDocuments(),
        Ride.countDocuments({ createdAt: { $gte: today } }),
        Ride.countDocuments({ status: { $in: ['requested','accepted','inprogress'] } }),
        User.countDocuments({ role: 'driver', isOnline: true }),
        User.countDocuments({ role: 'passenger' }),
        Ride.countDocuments({ status: 'completed' }),
      ]);
    const rate = total > 0 ? Math.round((completionRate / total) * 100) : 0;
    res.json({ total, todayRides, active, onlineDrivers, passengers, completionRate: rate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/analytics/hourly — last 24 hours ─────────────────
router.get('/hourly', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rides = await Ride.find({ createdAt: { $gte: since } }).select('createdAt');
    const hours = Array(24).fill(0);
    rides.forEach(r => { hours[new Date(r.createdAt).getHours()]++; });
    res.json(hours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/analytics/weekly ─────────────────────────────────
router.get('/weekly', protect, async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = await Ride.countDocuments({ createdAt: { $gte: d, $lt: next } });
      days.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/analytics/popular-locations ──────────────────────
router.get('/popular-locations', protect, async (req, res) => {
  try {
    const [pickups, destinations] = await Promise.all([
      Ride.aggregate([
        { $group: { _id: '$pickup.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      Ride.aggregate([
        { $group: { _id: '$destination.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
    ]);
    res.json({ pickups, destinations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;