const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ── GET /api/users/profile ────────────────────────────────────
router.get('/profile', protect, (req, res) =>
  res.json(req.user.toSafeObject())
);

// ── PATCH /api/users/profile ──────────────────────────────────
router.patch('/profile', protect, async (req, res) => {
  const { name, phone, vehicle } = req.body;
  try {
    if (name)  req.user.name  = name;
    if (phone) req.user.phone = phone;
    if (vehicle && req.user.role === 'driver')
      req.user.vehicle = { ...req.user.vehicle.toObject(), ...vehicle };
    await req.user.save();
    res.json(req.user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;