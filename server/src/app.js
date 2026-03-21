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

// Public client routes: open to any origin — the response-client app is open source
// and can be served from any domain. No auth is required here anyway.
app.use('/api/public', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// Admin + OTP routes: restrict to the configured origin in production
const adminCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use('/api', cors({ origin: adminCorsOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));

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
