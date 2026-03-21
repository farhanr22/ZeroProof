import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  password_version: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
