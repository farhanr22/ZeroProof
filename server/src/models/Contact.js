import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  value: { type: String, required: true },
  otp: { type: String, required: true, unique: true },
  otp_used: { type: Boolean, default: false },
  sent_at: { type: Date, default: null },
  send_lock: {
    locked_by: { type: String, default: null },
    locked_at: { type: Date, default: null }
  },
  created_at: { type: Date, default: Date.now }
});

export const Contact = mongoose.model('Contact', contactSchema);
