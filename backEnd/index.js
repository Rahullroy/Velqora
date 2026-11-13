// Must be the FIRST import so .env is loaded before any other module reads process.env
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import connectDB, { query } from './config/db.config.js';
import { validateEnvironment } from './config/env.config.js';
import { apiLimiter, securityHeaders } from './config/security.config.js';
import { errorHandlerMiddleware } from './middlewares/error.middlewares.js';
import apiRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

app.disable('x-powered-by');
app.use(securityHeaders);

// CORS configuration for local and configured client origins
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use('/api', apiLimiter);
app.use(express.json({ limit: '2mb' }));

// Health check (also verifies the database connection)
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// Mount central API router
app.use('/api', apiRoutes);

// Base health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Resumely ATS Enterprise REST API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      analyses: '/api/analyses',
      analyze: '/api/analyze'
    }
  });
});

// 404 Fallback Router Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Centralized Error Handling Middleware
app.use(errorHandlerMiddleware);

async function start() {
  try {
    validateEnvironment();
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Resumely server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`\nStartup failed: ${error.message}`);
    process.exit(1);
  }
}

start();
