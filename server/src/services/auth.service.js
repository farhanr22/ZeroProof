import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../core/errors.js';

export const signup = async (email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already in use');
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const user = new User({ email, password_hash });
  await user.save();

  const token = jwt.sign(
    { user_id: user._id, password_version: user.password_version },
    process.env.JWT_SECRET || 'secret'
  );

  return { token };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { user_id: user._id, password_version: user.password_version },
    process.env.JWT_SECRET || 'secret'
  );

  return { token };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid old password');
  }

  const saltRounds = 10;
  user.password_hash = await bcrypt.hash(newPassword, saltRounds);
  user.password_version += 1;
  await user.save();

  return true;
};
