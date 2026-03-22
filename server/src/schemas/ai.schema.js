import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  prompt: z.string().min(1).max(2000),
});
