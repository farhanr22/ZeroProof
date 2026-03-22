import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({
  baseURL: process.env.AI_ENDPOINT, // undefined allows it to use default
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'dummy_key_for_testing',
  fetch: (...args) => fetch(...args), // Dynamically resolve fetch so Jest mocks work
});

const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

export const generateQuestions = async (prompt, campaignName = '', campaignDescription = '') => {
  const systemPrompt = `You are an expert feedback and survey designer for the organization running a campaign named "${campaignName}".
Campaign Description: ${campaignDescription || "No description provided."}

The user has requested a set of questions for their feedback campaign. 
Your task is to generate up to 5 highly relevant and varied questions based on their prompt.
You must use a mix of question types appropriate for the context: text, single_choice, multi_choice, or rating.
If the question is "rating", the UI will automatically provide a 1-10 scale, so DO NOT provide options.
If the question is "text", provide no options.
If it is a choice question, provide concise options.

You MUST respond strictly in JSON format obeying this schema exactly:
{
  "questions": [
    {
      "type": "text" | "single_choice" | "multi_choice" | "rating",
      "text": "string",
      "options": ["string"]
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(completion.choices[0].message.content).questions;
};

/**
 * Summarize text responses for a single question (intermediate call).
 */
const summarizeTextResponses = async (questionText, texts) => {
  const sample = texts.slice(0, 20);
  const prompt = `You are summarizing open-ended feedback responses for the question: "${questionText}"

Here are the responses (up to 20):
${sample.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Provide a concise 4-7 sentence summary of the key themes and sentiments expressed. Do not list individual responses; synthesize them.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  return completion.choices[0].message.content.trim();
};

/**
 * Main insights analysis function.
 * Takes the structured insights data, summarizes text questions individually,
 * then passes everything to a final LLM call for an overall 1-3 paragraph analysis.
 */
export const analyzeInsights = async (campaignName, campaignDescription, insights) => {
  // Step 1: Summarize each text question's responses individually
  const textSummaries = [];
  for (const q of insights) {
    if (q.type === 'text' && q.texts && q.texts.length > 0) {
      const summary = await summarizeTextResponses(q.text, q.texts);
      textSummaries.push({ question: q.text, summary, total: q.total_answers });
    }
  }

  // Step 2: Build a structured context block for quantitative questions
  const quantContext = insights
    .filter(q => q.type !== 'text')
    .map(q => {
      if (q.type === 'rating') {
        const dist = Object.entries(q.distribution || {})
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([v, c]) => `  Rating ${v}: ${c} responses (${Math.round((c / (q.total_answers || 1)) * 100)}%)`)
          .join('\n');
        return `Question: "${q.text}" [Rating 1-10]\nTotal responses: ${q.total_answers} | Average: ${q.average?.toFixed(1) ?? 'N/A'}\nDistribution:\n${dist}`;
      }
      // single_choice / multi_choice
      const opts = Object.entries(q.counts || {})
        .sort((a, b) => b[1] - a[1])
        .map(([opt, c]) => `  "${opt}": ${c} responses (${Math.round((c / (q.total_answers || 1)) * 100)}%)`)
        .join('\n');
      return `Question: "${q.text}" [${q.type === 'multi_choice' ? 'Multiple Choice' : 'Single Choice'}]\nTotal responses: ${q.total_answers}\nBreakdown:\n${opts}`;
    })
    .join('\n\n');

  // Step 3: Build context for text summaries
  const textContext = textSummaries.length > 0
    ? textSummaries.map(t => `Question: "${t.question}" [Open Text — ${t.total} responses]\nSummary: ${t.summary}`).join('\n\n')
    : 'No open-text responses were collected.';

  const totalResponses = Math.max(...insights.map(q => q.total_answers || 0), 0);

  const finalPrompt = `You are an expert analyst reviewing feedback data for the campaign "${campaignName}".
Campaign Description: ${campaignDescription || 'No description provided.'}
Total respondents: approximately ${totalResponses}

--- QUANTITATIVE DATA ---
${quantContext || 'No quantitative questions.'}

--- OPEN-ENDED RESPONSE SUMMARIES ---
${textContext}

Based on all of the above, write a short, friendly summary of the feedback. Keep it simple and easy to read — no jargon, no fancy language. 
Break your response into two short paragraphs of 3-5 short, simple sentences each. Each sentence should be simple and convey a singular thought. Highlight what stands out, any clear patterns, and anything the team might want to act on. If the data is limited or not very conclusive, just say so honestly — that's fine.
Don't go above two short paragraphs unless there is a lot of questions and interesting analysis to be made. Your aim is to give an executive summary, not a thesis report.`;

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful assistant summarizing feedback data for a small team. Write in plain, conversational English. Keep sentences short. Avoid overly formal or academic language. Do not use bullet points.' },
      { role: 'user', content: finalPrompt }
    ],
    temperature: 0.5,
  });

  return completion.choices[0].message.content.trim();
};

