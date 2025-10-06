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

// Lightweight internal status endpoint to check DB connection state
app.get('/internal/status', (_req, res) => {
  const stateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const rs = mongoose.connection.readyState;
  res.json({ db: { readyState: rs, state: stateMap[rs] || 'unknown' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
// Centralized error handler to return JSON
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ error: message });
});

// Initialize database connection with caching. For serverless (Vercel) we
// ensure init is awaited on each invocation but reuse connections when
// available to avoid excessive reconnects.
let initialized = false;
async function init() {
  if (initialized) return;

  // Validate essential envs early
  const missing = [];
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || undefined;

  // Connection retry helpers (exponential backoff capped)
  const MAX_DELAY = 30000; // 30s
  let attempt = 0;

  async function connectWithRetry() {
    attempt += 1;
    try {
      await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
      console.log('MongoDB connected');
      initialized = true;
    } catch (err) {
      const delay = Math.min(MAX_DELAY, 1000 * 2 ** attempt);
      console.error(`MongoDB connection attempt ${attempt} failed:`, err?.message || err);
      console.log(`Retrying in ${delay}ms...`);
      setTimeout(connectWithRetry, delay);
    }
  }

  // Attach listeners to handle disconnections and attempt reconnects
  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected - will attempt reconnect');
    initialized = false;
    // start reconnect attempts if not already trying
    connectWithRetry();
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  // Start initial connect loop
  await connectWithRetry();
}

// Only start a listener when not running on Vercel (e.g., local dev)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  init()
    .then(() => app.listen(PORT, () => console.log(`Server listening on :${PORT}`)))
    .catch((err) => {
      console.error('Failed to initialize server (local):', err);
      process.exit(1);
    });
}

// Export a request handler that Vercel's Node runtime can call. We await
// initialization on each invocation (it's fast when already connected) so
// that required env checks and DB connection errors return clean 500s.
export default async function handler(req, res) {
  try {
    await init();
  } catch (err) {
    console.error('Initialization error (request):', err);
    // Return JSON consistent with the rest of the API
    res.status(500).json({ error: 'Server initialization error' });
    return;
  }

  // Delegate to the Express app instance
  return app(req, res);
}
