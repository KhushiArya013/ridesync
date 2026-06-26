const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const rideRoutes     = require('./routes/rides');
const driverRoutes   = require('./routes/drivers');
const analyticsRoutes = require('./routes/analytics');
const userRoutes     = require('./routes/users');
const { initSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Attach io to every request so routes can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/rides',     rideRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users',     userRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date(), env: process.env.NODE_ENV })
);

// ── Socket.IO ──────────────────────────────────────────────────
initSocket(io);

// ── Connect DB & Start ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 CampusRide backend running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });