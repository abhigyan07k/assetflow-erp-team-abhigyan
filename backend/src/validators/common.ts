import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('id must be a positive integer'),
});

export type IdParam = z.infer<typeof idParamSchema>;
