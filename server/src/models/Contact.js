import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  value: { type: String, required: true },
  otp: { type: String },
  otp_used: { type: Boolean, default: false },
  sent_at: { type: Date, default: null },
  send_lock: {
    locked_by: { type: String, default: null },
    locked_at: { type: Date, default: null }
  },
  failures: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

contactSchema.index({ otp: 1 }, { unique: true, sparse: true });

export const Contact = mongoose.model('Contact', contactSchema);
