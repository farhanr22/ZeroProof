import { z } from 'zod';

export const addContactsSchema = z.object({
  values: z.array(z.string().min(1, 'Contact value cannot be empty'))
});
