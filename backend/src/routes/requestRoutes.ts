import { Router } from 'express';
import * as requestController from '../controllers/requestController';
import authenticate from '../middleware/auth';
import authorizeRoles from '../middleware/rbac';
import validate from '../middleware/validate';
import { createRequestSchema, actionRequestSchema } from '../validators/requestSchemas';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles('EMPLOYEE'), validate(createRequestSchema), requestController.createRequest);
router.get('/pending', authorizeRoles('MANAGER', 'SUPER_ADMIN'), requestController.getPendingRequests);
router.patch(
  '/:id/action',
  authorizeRoles('MANAGER'),
  validate(actionRequestSchema),
  requestController.actionRequest
);

export default router;
