import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './core/logger.js';
import { ApiError } from './core/errors.js';
import { sendResponse } from './core/response.js';
import apiRoutes from './routes/api/index.js';

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

// Single CORS middleware with dynamic origin based on path:
// - /api/public/* : open to ANY origin (response-client is open source, hosted anywhere)
// - /api/*        : restricted to CORS_ORIGIN (admin-client, known domain)
const adminCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use('/api', cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Always allow any origin — the path-based check below handles restrictions
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Override: for /api/public/* force Access-Control-Allow-Origin: *
// This runs AFTER the cors() middleware and patches the header for public routes.
app.use('/api/public', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // When origin is *, credentials must be false (browser rule)
  res.removeHeader('Access-Control-Allow-Credentials');
  next();
});

// For admin routes: enforce specific origin (non-public /api/* paths)
app.use('/api', (req, res, next) => {
  // Skip if this is a public route (already handled above)
  if (req.path.startsWith('/public')) return next();
  // Set the restrictive origin for admin routes
  res.setHeader('Access-Control-Allow-Origin', adminCorsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use('/api', apiRoutes);

// 404 catch-all
app.use((req, res, next) => next(new ApiError(404, 'Route not found')));

// Central error handler
app.use((err, req, res, next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  if (!err.isOperational) {
    logger.error(err, 'Unhandled error');
  }
  sendResponse(res, null, true, message, statusCode);
});

export default app;
