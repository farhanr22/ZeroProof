import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from './errors.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) throw new ApiError(401, 'No token provided');

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.user_id);
  if (!user) throw new ApiError(401, 'User not found');
  if (decoded.password_version !== user.password_version)
    throw new ApiError(401, 'Token invalid – password changed');

  req.user = decoded;
  next();
});
