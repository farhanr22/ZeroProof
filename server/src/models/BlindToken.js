import mongoose from 'mongoose';

const blindTokenSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  token_hash: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const BlindToken = mongoose.model('BlindToken', blindTokenSchema);
