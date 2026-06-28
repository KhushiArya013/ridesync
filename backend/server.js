
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const rideRoutes      = require('./routes/rides');
const driverRoutes    = require('./routes/drivers');
const analyticsRoutes = require('./routes/analytics');
const userRoutes      = require('./routes/users');
const { initSocket }  = require('./socket/socketHandler');

const app    = express();
const server = http.createServer(app);

// Allow ALL origins (fixes CORS for any Vercel deployment URL)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow localhost
    if (origin.includes('localhost')) return callback(null, true);
    // Allow all vercel.app domains
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow specific production URL from env
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    // Block everything else
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(express.json());
app.use(morgan('dev'));

app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/auth',      authRoutes);
app.use('/api/rides',     rideRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users',     userRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date(), env: process.env.NODE_ENV })
);

initSocket(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 RideSync backend running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
