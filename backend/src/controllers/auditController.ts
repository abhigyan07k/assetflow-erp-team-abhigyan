import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/db';
import ApiResponse from '../utils/ApiResponse';

export const getAuditLogs = async (req: Request, res: Response): Promise<Response> => {
  const logs = await prisma.auditLog.findMany({
    include: { performedBy: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { logs, count: logs.length }, 'Audit logs fetched successfully'));
};
