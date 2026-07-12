import { Router } from 'express';
import * as authController from '../controllers/authController';
import authenticate from '../middleware/auth';
import authorizeRoles from '../middleware/rbac';
import validate from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  signupSchema,
  loginSchema,
  updateRoleSchema,
  suspendUserSchema,
  forgetPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validators/authSchemas';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

router.post('/forget-password', authLimiter, validate(forgetPasswordSchema), authController.forgetPassword);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.patch(
  '/user/:id/role',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  validate(updateRoleSchema),
  authController.updateRole
);
router.patch(
  '/user/:id/suspend',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  validate(suspendUserSchema),
  authController.suspendUser
);

export default router;
