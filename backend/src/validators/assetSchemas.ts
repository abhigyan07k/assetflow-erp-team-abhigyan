import { z } from 'zod';
import { idParamSchema } from './common';

const assetTypeEnum = z.enum(['LAPTOP', 'MONITOR', 'MOBILE', 'SOFTWARE', 'PERIPHERAL']);
const assetStatusEnum = z.enum(['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED']);

const assetBaseSchema = z.object({
  serialNumber: z.string().trim().min(1, 'serialNumber is required'),
  name: z.string().trim().min(1, 'name is required'),
  type: assetTypeEnum,
  cost: z.coerce.number().positive('cost must be a positive number').optional(),
  purchaseDate: z.coerce.date().optional(),
  vendorName: z.string().trim().min(1).optional(),
  warrantyExpiry: z.coerce.date().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

export const createAssetSchema = {
  body: assetBaseSchema,
};

export const bulkImportAssetsSchema = {
  body: z
    .array(assetBaseSchema)
    .min(1, 'At least one asset is required')
    .max(500, 'Cannot import more than 500 assets in a single request'),
};

export const getAssetsQuerySchema = {
  query: z.object({
    status: assetStatusEnum.optional(),
    type: assetTypeEnum.optional(),
    departmentId: z.coerce.number().int().positive().optional(),
  }),
};

export const assetIdParamSchema = {
  params: idParamSchema,
};

export const assignAssetSchema = {
  params: idParamSchema,
  body: z.object({
    userId: z.coerce.number().int().positive('userId must be a positive integer'),
  }),
};

export const updateAssetStatusSchema = {
  params: idParamSchema,
  body: z.object({
    status: assetStatusEnum,
  }),
};

export type CreateAssetBody = z.infer<typeof createAssetSchema.body>;
export type BulkImportAssetsBody = z.infer<typeof bulkImportAssetsSchema.body>;
export type GetAssetsQuery = z.infer<typeof getAssetsQuerySchema.query>;
export type AssignAssetBody = z.infer<typeof assignAssetSchema.body>;
export type UpdateAssetStatusBody = z.infer<typeof updateAssetStatusSchema.body>;
