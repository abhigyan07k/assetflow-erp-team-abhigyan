import { Router } from 'express';
import * as assetController from '../controllers/assetController';
import authenticate from '../middleware/auth';
import authorizeRoles from '../middleware/rbac';
import validate from '../middleware/validate';
import {
  createAssetSchema,
  bulkImportAssetsSchema,
  getAssetsQuerySchema,
  assetIdParamSchema,
  assignAssetSchema,
  updateAssetStatusSchema,
} from '../validators/assetSchemas';

const router = Router();

router.use(authenticate);

router.get('/', validate(getAssetsQuerySchema), assetController.getAssets);
router.post('/', authorizeRoles('SUPER_ADMIN', 'MANAGER'), validate(createAssetSchema), assetController.createAsset);
router.post(
  '/bulk-import',
  authorizeRoles('MANAGER', 'SUPER_ADMIN'),
  validate(bulkImportAssetsSchema),
  assetController.bulkImportAssets
);
router.get(
  '/:id/depreciation',
  authorizeRoles('IT_SUPPORT', 'MANAGER', 'SUPER_ADMIN'),
  validate(assetIdParamSchema),
  assetController.getAssetDepreciation
);
router.patch('/:id/assign', authorizeRoles('MANAGER'), validate(assignAssetSchema), assetController.assignAsset);
router.patch(
  '/:id/status',
  authorizeRoles('IT_SUPPORT', 'MANAGER', 'SUPER_ADMIN'),
  validate(updateAssetStatusSchema),
  assetController.updateAssetStatus
);

export default router;
