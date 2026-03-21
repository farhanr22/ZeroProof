import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const responseSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  blind_token_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BlindToken', required: true, unique: true },
  answers: [answerSchema],
  submitted_at: { type: Date, default: Date.now }
});

responseSchema.index({ campaign_id: 1, submitted_at: -1 });

export const Response = mongoose.model('Response', responseSchema);
