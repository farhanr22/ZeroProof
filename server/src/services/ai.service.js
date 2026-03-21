import Anthropic from '@anthropic-ai/sdk';

export const generateQuestions = async (scenario) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return [
      {
        type: "single_choice",
        text: "How satisfied are you with our service based on " + scenario.substring(0, 20) + "?",
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
      },
      {
        type: "text",
        text: "What could we improve?",
        options: []
      }
    ];
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    system: `You are a survey designer. Return ONLY a JSON array, no markdown, no preamble.
Each item: { "type": "single_choice"|"multi_choice"|"rating"|"text", "text": "string", "options": ["string"] }
options is empty [] for rating and text types. Max 8 questions.`,
    messages: [{ role: 'user', content: `Scenario: ${scenario}` }]
  });
  
  const raw = response.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('AI output was not valid JSON');
  }
};
