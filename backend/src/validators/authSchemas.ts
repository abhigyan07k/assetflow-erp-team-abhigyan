import { z } from 'zod';
import { idParamSchema } from './common';

const roleEnum = z.enum(['SUPER_ADMIN', 'MANAGER', 'IT_SUPPORT', 'EMPLOYEE']);

const passwordSchema = z
  .string()
  .min(8, 'password must be at least 8 characters long')
  .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'password must contain at least one number');

export const signupSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'name must be at least 2 characters long').max(100),
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: passwordSchema,
    departmentId: z.coerce.number().int().positive().optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: z.string().min(1, 'password is required'),
  }),
};

export const updateRoleSchema = {
  params: idParamSchema,
  body: z.object({
    role: roleEnum,
  }),
};

export const suspendUserSchema = {
  params: idParamSchema,
};

export const forgetPasswordSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    otp: z
      .string()
      .trim()
      .length(6, 'otp must be exactly 6 digits')
      .regex(/^\d{6}$/, 'otp must contain only digits'),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      email: z.string().trim().toLowerCase().email('email must be a valid email address'),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(1, 'confirmPassword is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'newPassword and confirmPassword must match',
      path: ['confirmPassword'],
    }),
};

export type SignupBody = z.infer<typeof signupSchema.body>;
export type LoginBody = z.infer<typeof loginSchema.body>;
export type UpdateRoleBody = z.infer<typeof updateRoleSchema.body>;
export type ForgetPasswordBody = z.infer<typeof forgetPasswordSchema.body>;
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;
