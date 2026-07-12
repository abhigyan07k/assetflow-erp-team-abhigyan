import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logAudit from '../utils/auditLogger';
import { IdParam } from '../validators/common';
import {
  CreateAssetBody,
  BulkImportAssetsBody,
  GetAssetsQuery,
  AssignAssetBody,
  UpdateAssetStatusBody,
} from '../validators/assetSchemas';

const ANNUAL_DEPRECIATION_RATE = 0.2;
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export const createAsset = async (req: Request, res: Response): Promise<Response> => {
  const {
    serialNumber,
    name,
    type,
    purchaseDate,
    cost,
    vendorName,
    warrantyExpiry,
    departmentId,
  }: CreateAssetBody = req.body;

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Provided department does not exist');
    }
  }

  const asset = await prisma.asset.create({
    data: {
      serialNumber,
      name,
      type,
      purchaseDate: purchaseDate || null,
      cost: cost !== undefined ? cost : null,
      vendorName: vendorName || null,
      warrantyExpiry: warrantyExpiry || null,
      departmentId: departmentId || null,
    },
  });

  await logAudit({
    actionType: 'ASSET_CREATED',
    performedById: req.user!.id,
    description: `Asset ${asset.serialNumber} (${asset.name}) created`,
  });

  return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, { asset }, 'Asset created successfully'));
};

export const bulkImportAssets = async (req: Request, res: Response): Promise<Response> => {
  const assets: BulkImportAssetsBody = req.body;

  const result = await prisma.asset.createMany({
    data: assets,
    skipDuplicates: true,
  });

  await logAudit({
    actionType: 'ASSET_BULK_IMPORTED',
    performedById: req.user!.id,
    description: `Bulk import: ${result.count} of ${assets.length} asset(s) inserted (duplicates skipped)`,
  });

  const data = {
    submittedCount: assets.length,
    insertedCount: result.count,
    skippedCount: assets.length - result.count,
  };

  return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, data, 'Bulk asset import completed successfully'));
};

export const getAssets = async (req: Request, res: Response): Promise<Response> => {
  const { status, type, departmentId } = req.query as unknown as GetAssetsQuery;
  const where: Prisma.AssetWhereInput = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (departmentId) where.departmentId = departmentId;

  if (req.user!.role === 'EMPLOYEE') {
    where.assignedToId = req.user!.id;
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      department: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { assets, count: assets.length }, 'Assets fetched successfully'));
};

export const getAssetDepreciation = async (req: Request, res: Response): Promise<Response> => {
  const { id: assetId } = req.params as unknown as IdParam;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Asset not found');
  }
  if (asset.cost === null || asset.purchaseDate === null) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Asset is missing cost or purchaseDate; depreciation cannot be calculated');
  }

  const originalCost = asset.cost.toNumber();
  const yearsElapsed = Math.max((Date.now() - asset.purchaseDate.getTime()) / MS_PER_YEAR, 0);

  const rawDepreciation = originalCost * ANNUAL_DEPRECIATION_RATE * yearsElapsed;
  const totalDepreciation = Math.min(rawDepreciation, originalCost);
  const currentBookValue = Math.max(originalCost - totalDepreciation, 0);

  const data = {
    assetId: asset.id,
    serialNumber: asset.serialNumber,
    originalCost: Number(originalCost.toFixed(2)),
    purchaseDate: asset.purchaseDate,
    yearsElapsed: Number(yearsElapsed.toFixed(2)),
    annualDepreciationRate: ANNUAL_DEPRECIATION_RATE,
    totalDepreciation: Number(totalDepreciation.toFixed(2)),
    currentBookValue: Number(currentBookValue.toFixed(2)),
  };

  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, data, 'Depreciation calculated successfully'));
};

export const assignAsset = async (req: Request, res: Response): Promise<Response> => {
  const { id: assetId } = req.params as unknown as IdParam;
  const { userId }: AssignAssetBody = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Asset not found');
  }
  if (asset.status !== 'AVAILABLE') {
    throw new ApiError(StatusCodes.CONFLICT, `Asset is not available for assignment (current status: ${asset.status})`);
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.status === 'SUSPENDED') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Target user not found or suspended');
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: { assignedToId: userId, status: 'ASSIGNED' },
  });

  await logAudit({
    actionType: 'ASSET_ASSIGNED',
    performedById: req.user!.id,
    description: `Asset ${asset.serialNumber} assigned to user ID ${userId}`,
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { asset: updatedAsset }, 'Asset assigned successfully'));
};

export const updateAssetStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id: assetId } = req.params as unknown as IdParam;
  const { status }: UpdateAssetStatusBody = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Asset not found');
  }

  const previousStatus = asset.status;

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: { status },
  });

  await logAudit({
    actionType: 'STATUS_CHANGED',
    performedById: req.user!.id,
    description: `Asset ${asset.serialNumber} status changed from ${previousStatus} to ${status}`,
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { asset: updatedAsset }, 'Asset status updated successfully'));
};
