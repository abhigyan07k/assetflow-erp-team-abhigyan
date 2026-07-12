import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/db';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logAudit from '../utils/auditLogger';
import { IdParam } from '../validators/common';
import { CreateRequestBody, ActionRequestBody } from '../validators/requestSchemas';

export const createRequest = async (req: Request, res: Response): Promise<Response> => {
  const { assetType, justification, priority }: CreateRequestBody = req.body;

  const request = await prisma.assetRequest.create({
    data: {
      userId: req.user!.id,
      assetType,
      justification,
      priority: priority || 'MEDIUM',
    },
  });

  return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, { request }, 'Asset request submitted successfully'));
};

export const getPendingRequests = async (req: Request, res: Response): Promise<Response> => {
  const requests = await prisma.assetRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true, departmentId: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { requests, count: requests.length }, 'Pending requests fetched successfully'));
};

export const actionRequest = async (req: Request, res: Response): Promise<Response> => {
  const { id: requestId } = req.params as unknown as IdParam;
  const { status, managerNotes }: ActionRequestBody = req.body;

  const request = await prisma.assetRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Asset request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(StatusCodes.CONFLICT, `Request has already been ${request.status.toLowerCase()}`);
  }

  const updatedRequest = await prisma.assetRequest.update({
    where: { id: requestId },
    data: {
      status,
      managerNotes: managerNotes || null,
      processedById: req.user!.id,
    },
  });

  let linkedAsset = null;

  if (status === 'APPROVED') {
    const availableAsset = await prisma.asset.findFirst({
      where: { type: request.assetType, status: 'AVAILABLE' },
    });

    if (availableAsset) {
      linkedAsset = await prisma.asset.update({
        where: { id: availableAsset.id },
        data: { assignedToId: request.userId, status: 'ASSIGNED' },
      });

      await logAudit({
        actionType: 'ASSET_ASSIGNED',
        performedById: req.user!.id,
        description: `Asset ${linkedAsset.serialNumber} auto-linked to user ID ${request.userId} from approved request #${requestId}`,
      });
    }
  }

  await logAudit({
    actionType: 'STATUS_CHANGED',
    performedById: req.user!.id,
    description: `Asset request #${requestId} marked as ${status}`,
  });

  const message =
    status === 'APPROVED'
      ? linkedAsset
        ? 'Request approved and asset assigned'
        : 'Request approved. No matching available asset found to auto-assign.'
      : 'Request rejected';

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { request: updatedRequest, linkedAsset }, message));
};
