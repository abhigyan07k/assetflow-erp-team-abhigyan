import { Router } from 'express';
import * as auditController from '../controllers/auditController';
import authenticate from '../middleware/auth';
import authorizeRoles from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles('IT_SUPPORT', 'MANAGER', 'SUPER_ADMIN'), auditController.getAuditLogs);

export default router;
