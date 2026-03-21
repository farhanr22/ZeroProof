import { z } from 'zod';

export const updateQuestionsSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['single_choice', 'multi_choice', 'rating', 'text']),
    text: z.string().min(1),
    options: z.array(z.string())
  }))
});
