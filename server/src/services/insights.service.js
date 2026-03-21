import { Response } from '../models/Response.js';
import { getCampaignById } from './campaign.service.js';

export const listResponses = async (admin_id, campaign_id) => {
  await getCampaignById(admin_id, campaign_id);
  return Response.find({ campaign_id }).sort({ submitted_at: -1 });
};

export const getInsights = async (admin_id, campaign_id) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  const responses = await Response.find({ campaign_id });

  const insights = {};

  campaign.questions.forEach(q => {
    const base = {
      _id: q._id,
      text: q.text,
      type: q.type,
      total_answers: 0
    };

    if (q.type === 'single_choice' || q.type === 'multi_choice') {
      base.counts = {};
      q.options.forEach(opt => base.counts[opt] = 0);
    } else if (q.type === 'rating') {
      base.sum = 0;
      base.average = 0;
      base.distribution = {};
    } else if (q.type === 'text') {
      base.texts = [];
    }

    insights[q._id.toString()] = base;
  });

  responses.forEach(res => {
    res.answers.forEach(ans => {
      const qId = ans.question_id.toString();
      const insight = insights[qId];
      if (!insight) return;

      insight.total_answers++;

      if (insight.type === 'single_choice') {
        const val = String(ans.value);
        insight.counts[val] = (insight.counts[val] || 0) + 1;
      } else if (insight.type === 'multi_choice') {
        const vals = Array.isArray(ans.value) ? ans.value : [String(ans.value)];
        vals.forEach(v => {
          const val = String(v);
          insight.counts[val] = (insight.counts[val] || 0) + 1;
        });
      } else if (insight.type === 'rating') {
        const val = Number(ans.value);
        if (!isNaN(val)) {
          insight.sum += val;
          insight.distribution[val] = (insight.distribution[val] || 0) + 1;
          insight.average = parseFloat((insight.sum / insight.total_answers).toFixed(2));
        }
      } else if (insight.type === 'text') {
        insight.texts.push(String(ans.value));
      }
    });
  });

  return Object.values(insights);
};
