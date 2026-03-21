import { ApiError } from './errors.js';

export const otpAuthMiddleware = (req, res, next) => {
  const secret = req.headers['x-otp-service-secret'];
  const expected = process.env.OTP_SERVICE_SECRET || 'dev_otp_secret';
  
  if (!secret || secret !== expected) {
    return next(new ApiError(401, 'Unauthorized OTP service access'));
  }
  
  next();
};
