import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  type: { type: String, enum: ['single_choice', 'multi_choice', 'rating', 'text'], required: true },
  text: { type: String, required: true },
  options: [{ type: String }] // empty for rating/text
});

const campaignSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  mode: { type: String, enum: ['draft', 'active'], default: 'draft' },
  public_key_pem: { type: String, default: null },
  private_key_pem: { type: String, default: null },
  questions: [questionSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

campaignSchema.index({ admin_id: 1 });
campaignSchema.index({ mode: 1, admin_id: 1 });
campaignSchema.index({ admin_id: 1, name: 1 }, { unique: true });

export const Campaign = mongoose.model('Campaign', campaignSchema);
