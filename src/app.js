require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/auth');
const connectDb = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  const status = mongoose.connection?.readyState === 1 ? 'up' : 'down';
  res.json({
    status,
    dbReadyState: mongoose.connection?.readyState,
    time: new Date().toISOString(),
  });
});

async function ensureSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.warn('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required to create the super admin user.');
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase(),
    role: 'superadmin',
    password: hashed,
  });

  console.log(`Super admin created with email: ${email}`);
}

async function start() {
  await connectDb(process.env.MONGO_URI);
  await ensureSuperAdmin();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

// centralized error handler so async errors don't crash the process
app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  return res.status(500).json({ message: 'Internal server error' });
});

start().catch((err) => {
  console.error('Startup failed', err);
  process.exit(1);
});
