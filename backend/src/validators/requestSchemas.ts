import { z } from 'zod';
import { idParamSchema } from './common';

const assetTypeEnum = z.enum(['LAPTOP', 'MONITOR', 'MOBILE', 'SOFTWARE', 'PERIPHERAL']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const requestActionStatusEnum = z.enum(['APPROVED', 'REJECTED']);

export const createRequestSchema = {
  body: z.object({
    assetType: assetTypeEnum,
    justification: z.string().trim().min(10, 'justification must be at least 10 characters long'),
    priority: priorityEnum.optional(),
  }),
};

export const actionRequestSchema = {
  params: idParamSchema,
  body: z.object({
    status: requestActionStatusEnum,
    managerNotes: z.string().trim().optional(),
  }),
};

export type CreateRequestBody = z.infer<typeof createRequestSchema.body>;
export type ActionRequestBody = z.infer<typeof actionRequestSchema.body>;
