const express = require('express');
const router  = express.Router();
const Ride    = require('../models/Ride');
const Rating  = require('../models/Rating');
const User    = require('../models/User');
const { protect, driverOnly, passengerOnly } = require('../middleware/auth');

// Simple fare calculator based on campus locations
function calcFare(pickup, dest) {
  const R = 6371;
  const lat1 = (pickup.lat || 29.865) * Math.PI / 180;
  const lat2 = (dest.lat   || 29.867) * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = ((dest.lng || 77.900) - (pickup.lng || 77.898)) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return {
    fare: Math.max(10, Math.round(dist * 10 + 5)),
    distance: parseFloat(dist.toFixed(2)),
  };
}

// Populate helper
const populate = (q) =>
  q.populate('passenger', 'name email phone rating totalRides')
   .populate('driver',    'name email phone rating vehicle isOnline location');

// ── POST /api/rides — passenger requests a ride ────────────────
router.post('/', protect, passengerOnly, async (req, res) => {
  const { pickup, destination, isScheduled, scheduledAt } = req.body;
  if (!pickup?.name || !destination?.name)
    return res.status(400).json({ message: 'Pickup and destination are required' });

  try {
    // Block if active ride exists
    const active = await Ride.findOne({
      passenger: req.user._id,
      status: { $in: ['requested','accepted','inprogress'] },
    });
    if (active)
      return res.status(409).json({ message: 'You already have an active ride', rideId: active._id });

    const { fare, distance } = calcFare(pickup, destination);

    const ride = await Ride.create({
      passenger: req.user._id,
      pickup, destination, fare, distance,
      isScheduled: !!isScheduled,
      scheduledAt: isScheduled ? scheduledAt : null,
    });

    await populate(Ride.findById(ride._id)).then(r => {
      // Broadcast to all online drivers
      req.io.emit('ride:new', r);
      res.status(201).json(r);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rides — list rides (role-aware) ───────────────────
router.get('/', protect, async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  const filter = req.user.role === 'passenger'
    ? { passenger: req.user._id }
    : { driver: req.user._id };

  // Handle comma-separated status
  if (status) {
    const statuses = status.split(',');
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }

  try {
    const [rides, total] = await Promise.all([
      populate(Ride.find(filter))
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page)-1) * Number(limit)),
      Ride.countDocuments(filter),
    ]);
    res.json({ rides, total, page: Number(page), pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rides/available — driver sees all pending rides ───
router.get('/available', protect, driverOnly, async (req, res) => {
  try {
    const rides = await populate(
      Ride.find({ status: 'requested', driver: null })
    ).sort({ createdAt: -1 }).limit(20);
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/rides/:id ─────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await populate(Ride.findById(req.params.id));
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/rides/:id/accept — driver accepts ──────────────
router.patch('/:id/accept', protect, driverOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride)               return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'requested')
      return res.status(400).json({ message: 'Ride is no longer available' });
    if (ride.driver)
      return res.status(409).json({ message: 'Ride already taken by another driver' });

    ride.driver     = req.user._id;
    ride.status     = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    const full = await populate(Ride.findById(ride._id));
    // Notify passenger
    req.io.to(`user_${ride.passenger}`).emit('ride:accepted', full);
    req.io.emit('ride:updated', full);
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/rides/:id/start ────────────────────────────────
router.patch('/:id/start', protect, driverOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || String(ride.driver) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorised' });
    if (ride.status !== 'accepted')
      return res.status(400).json({ message: 'Ride must be accepted first' });

    ride.status    = 'inprogress';
    ride.startedAt = new Date();
    await ride.save();

    const full = await populate(Ride.findById(ride._id));
    req.io.to(`user_${ride.passenger}`).emit('ride:started', full);
    req.io.emit('ride:updated', full);
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/rides/:id/complete ─────────────────────────────
router.patch('/:id/complete', protect, driverOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || String(ride.driver) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorised' });
    if (ride.status !== 'inprogress')
      return res.status(400).json({ message: 'Ride must be in progress' });

    ride.status      = 'completed';
    ride.completedAt = new Date();
    if (ride.startedAt)
      ride.duration = Math.round((ride.completedAt - ride.startedAt) / 60000);

    await ride.save();

    // Update ride counts and earnings
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, {
        $inc: { totalRides: 1, totalEarnings: ride.fare },
      }),
      User.findByIdAndUpdate(ride.passenger, { $inc: { totalRides: 1 } }),
    ]);

    const full = await populate(Ride.findById(ride._id));
    req.io.to(`user_${ride.passenger}`).emit('ride:completed', full);
    req.io.emit('ride:updated', full);
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/rides/:id/cancel ───────────────────────────────
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (!['requested','accepted'].includes(ride.status))
      return res.status(400).json({ message: 'Cannot cancel at this stage' });

    // Check ownership
    const isPassenger = String(ride.passenger) === String(req.user._id);
    const isDriver    = String(ride.driver)    === String(req.user._id);
    if (!isPassenger && !isDriver)
      return res.status(403).json({ message: 'Not authorised' });

    ride.status       = 'cancelled';
    ride.cancelledAt  = new Date();
    ride.cancelledBy  = req.user.role;
    ride.cancelReason = req.body.reason || '';
    await ride.save();

    const full = await populate(Ride.findById(ride._id));
    req.io.emit('ride:cancelled', full);
    if (ride.driver)    req.io.to(`user_${ride.driver}`).emit('ride:cancelled', full);
    req.io.to(`user_${ride.passenger}`).emit('ride:cancelled', full);
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/rides/:id/rate — passenger rates completed ride ──
router.post('/:id/rate', protect, passengerOnly, async (req, res) => {
  const { stars, feedback } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ message: 'Stars must be between 1 and 5' });

  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride)
      return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed')
      return res.status(400).json({ message: 'Can only rate completed rides' });
    if (String(ride.passenger) !== String(req.user._id))
      return res.status(403).json({ message: 'Not your ride' });
    if (ride.rating)
      return res.status(409).json({ message: 'Already rated' });

    ride.rating   = stars;
    ride.feedback = feedback || '';
    await ride.save();

    // Save to ratings collection
    await Rating.create({
      ride: ride._id, passenger: req.user._id,
      driver: ride.driver, stars, feedback: feedback || '',
    });

    // Recalculate driver average rating
    const allRatings = await Rating.find({ driver: ride.driver });
    const avg = allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length;
    await User.findByIdAndUpdate(ride.driver, { rating: parseFloat(avg.toFixed(1)) });

    req.io.to(`user_${ride.driver}`).emit('ride:rated', {
      rideId: ride._id, stars, feedback, passengerName: req.user.name,
    });
    res.json({ message: 'Rating submitted', ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;