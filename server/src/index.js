import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import triageRoutes from './routes/triage.js';

const app = express();

// Derive allowed origins from env, respecting credentials rule
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin/non-browser requests (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      const e = new Error('Not allowed by CORS');
      e.status = 403;
      return callback(e);
    },
    credentials: allowedOrigins.length > 0,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);

const PORT = process.env.PORT || 5000;

// Centralized error handler to return JSON
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ error: message });
});

async function start() {
  try {
    // Validate required envs early
    const missing = [];
    if (!process.env.MONGO_URI) missing.push('MONGO_URI');
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
    if (missing.length) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME || undefined;
    await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
