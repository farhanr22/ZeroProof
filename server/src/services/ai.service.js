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
