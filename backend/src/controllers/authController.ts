import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '@prisma/client';
import prisma from '../config/db';
import logger from '../config/logger';
import { generateToken } from '../utils/token';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logAudit from '../utils/auditLogger';
import { sendOtpEmail } from '../services/emailService';
import {
  SignupBody,
  LoginBody,
  UpdateRoleBody,
  ForgetPasswordBody,
  VerifyOtpBody,
  ResetPasswordBody,
} from '../validators/authSchemas';
import { IdParam } from '../validators/common';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;

const generateOtp = (): string => String(Math.floor(100000 + Math.random() * 900000));

const stripPassword = <T extends { password: string; otpCode: string | null; otpExpires: Date | null }>(
  user: T
): Omit<T, 'password' | 'otpCode' | 'otpExpires'> => {
  const { password, otpCode, otpExpires, ...safeUser } = user;
  return safeUser;
};

export const signup = async (req: Request, res: Response): Promise<Response> => {
  const { name, email, password, departmentId }: SignupBody = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'A user with this email already exists');
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Provided department does not exist');
    }
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user: User = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      departmentId: departmentId || null,
    },
  });

  const { token } = generateToken({ userId: user.id, role: user.role });

  return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, { user: stripPassword(user), token }, 'User registered successfully'));
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password }: LoginBody = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (user.status === 'SUSPENDED') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been suspended. Contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const { token } = generateToken({ userId: user.id, role: user.role });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user: stripPassword(user), token }, 'Login successful'));
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  const { jti, id: userId } = req.user!;
  const expiresAt = new Date(req.tokenExp! * 1000);

  await prisma.revokedToken.create({ data: { jti, userId, expiresAt } });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, 'Logged out successfully. Session revoked.'));
};

export const getMe = async (req: Request, res: Response): Promise<Response> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { department: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user: stripPassword(user) }, 'Profile fetched successfully'));
};

export const updateRole = async (req: Request, res: Response): Promise<Response> => {
  const { id: userId } = req.params as unknown as IdParam;
  const { role }: UpdateRoleBody = req.body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({ where: { id: userId }, data: { role } });

  await logAudit({
    actionType: 'ROLE_CHANGED',
    performedById: req.user!.id,
    description: `User ${targetUser.email} role changed from ${targetUser.role} to ${role}`,
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user: stripPassword(updatedUser) }, 'User role updated successfully'));
};

export const suspendUser = async (req: Request, res: Response): Promise<Response> => {
  const { id: userId } = req.params as unknown as IdParam;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (targetUser.status === 'SUSPENDED') {
    throw new ApiError(StatusCodes.CONFLICT, 'User is already suspended');
  }

  const updatedUser = await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });

  await logAudit({
    actionType: 'ACCESS_REVOKED',
    performedById: req.user!.id,
    description: `Access revoked for user ${targetUser.email}`,
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user: stripPassword(updatedUser) }, 'User access suspended successfully'));
};

export const forgetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email }: ForgetPasswordBody = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email does not exist');
  }

  const otpCode = generateOtp();
  const hashedOtp = await bcrypt.hash(otpCode, SALT_ROUNDS);
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { otpCode: hashedOtp, otpExpires, isOtpVerified: false },
  });

  try {
    await sendOtpEmail(email, otpCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send OTP email to ${email}: ${message}`);
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unable to send the OTP email at this time. Please try again later.');
  }

  logger.info(`Password reset OTP email dispatched to ${email} (expires ${otpExpires.toISOString()})`);

  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        null,
        'An OTP has been sent for verification. Please check your registered email inbox.'
      )
    );
};

export const verifyOtp = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp }: VerifyOtpBody = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email does not exist');
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No OTP request found for this email. Please request a new OTP.');
  }

  if (user.otpExpires.getTime() < Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP code has expired. Please request a new one.');
  }

  const isOtpMatch = await bcrypt.compare(otp, user.otpCode);
  if (!isOtpMatch) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP code');
  }

  await prisma.user.update({ where: { email }, data: { isOtpVerified: true } });

  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'OTP verified successfully'));
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email, newPassword }: ResetPasswordBody = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email does not exist');
  }

  if (!user.isOtpVerified) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'OTP verification is required before resetting the password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otpCode: null,
      otpExpires: null,
      isOtpVerified: false,
    },
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, 'Password reset successfully. Please sign in with your new password.'));
};
