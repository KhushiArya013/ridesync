const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// In-memory map of userId -> socketId
const onlineUsers = new Map();

function initSocket(io) {

  // ── Auth middleware for every socket connection ──────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`[Socket] ✅ ${user.name} (${user.role}) connected — ${socket.id}`);

    // Join personal room so we can send targeted events
    socket.join(`user_${user._id}`);
    onlineUsers.set(String(user._id), socket.id);

    // Persist socketId
    await User.findByIdAndUpdate(user._id, { socketId: socket.id });

    // Broadcast updated online list
    io.emit('users:online', Array.from(onlineUsers.keys()));

    // ── Driver events ──────────────────────────────────────────
    socket.on('driver:goOnline', async () => {
      if (user.role !== 'driver') return;
      await User.findByIdAndUpdate(user._id, { isOnline: true });
      io.emit('driver:status', {
        driverId: user._id, isOnline: true,
        name: user.name, vehicle: user.vehicle, location: user.location, rating: user.rating,
      });
    });

    socket.on('driver:goOffline', async () => {
      if (user.role !== 'driver') return;
      await User.findByIdAndUpdate(user._id, { isOnline: false });
      io.emit('driver:status', { driverId: user._id, isOnline: false, name: user.name });
    });

    // Driver sends live location updates
    socket.on('driver:location', async ({ lat, lng }) => {
      if (user.role !== 'driver') return;
      await User.findByIdAndUpdate(user._id, { 'location.lat': lat, 'location.lng': lng });
      io.emit('driver:location', { driverId: user._id, lat, lng, name: user.name });
    });

    // ── Ride room events ───────────────────────────────────────
    // Both passenger and driver join the ride room for targeted updates
    socket.on('ride:join', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`[Socket] ${user.name} joined ride room: ${rideId}`);
    });

    socket.on('ride:leave', (rideId) => {
      socket.leave(`ride_${rideId}`);
    });

    // Driver sends ETA to passenger
    socket.on('ride:eta', ({ rideId, eta }) => {
      io.to(`ride_${rideId}`).emit('ride:eta', { rideId, eta });
    });

    // In-ride chat between passenger and driver
    socket.on('ride:message', ({ rideId, message }) => {
      io.to(`ride_${rideId}`).emit('ride:message', {
        rideId, message,
        from: { id: user._id, name: user.name, role: user.role },
        time: new Date(),
      });
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] ❌ ${user.name} disconnected`);
      onlineUsers.delete(String(user._id));

      if (user.role === 'driver') {
        await User.findByIdAndUpdate(user._id, { isOnline: false, socketId: '' });
        io.emit('driver:status', { driverId: user._id, isOnline: false });
      }

      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
}

module.exports = { initSocket, onlineUsers };