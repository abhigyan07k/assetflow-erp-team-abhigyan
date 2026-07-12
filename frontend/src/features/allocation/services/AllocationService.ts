import type { Allocation, AssetCondition, AuditLog, EntityId, Notification, Transfer } from '@core/types';
import { formatLogDate, toDateString } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { allocationStore } from '@store/allocationStore';
import { appStore, saveState } from '@store/appStore';

export interface AllocateAssetInput {
  assetId: EntityId;
  employeeId: EntityId;
  departmentId: EntityId;
  expectedReturnDate: string;
  notes?: string;
}

export interface ReturnAssetInput {
  allocationId: EntityId;
  conditionCheckin: AssetCondition;
  notes: string;
}

export class AllocationService {
  findActiveAllocationForAsset(assetId: EntityId): Allocation | undefined {
    return allocationStore.findActiveByAssetId(assetId);
  }

  allocateAsset(input: AllocateAssetInput): Allocation {
    const state = appStore.getState();
    const allocation: Allocation = {
      id: createSequentialId('al', state.allocations.length),
      assetId: input.assetId,
      employeeId: input.employeeId,
      departmentId: input.departmentId,
      allocatedDate: toDateString(new Date()),
      expectedReturnDate: input.expectedReturnDate,
      returnedDate: '',
      conditionCheckin: '',
      notes: input.notes ?? 'Direct allocation via AssetFlow.',
      status: 'active'
    };

    const asset = state.assets.find((item) => item.id === input.assetId);
    const employee = state.employees.find((item) => item.id === input.employeeId);
    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Manager',
      action: 'ASSIGN',
      entityType: 'Asset',
      details: `Allocated ${asset?.name ?? input.assetId} to ${employee?.name ?? input.employeeId}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.allocations.push(allocation);
      const targetAsset = draft.assets.find((item) => item.id === input.assetId);
      if (targetAsset) targetAsset.status = 'allocated';
      draft.auditLogs.unshift(log);
    });
    saveState();
    return allocation;
  }

  createTransferRequestForConflict(input: AllocateAssetInput, currentHolderEmployeeId: EntityId): Transfer {
    const state = appStore.getState();
    const transfer: Transfer = {
      id: createSequentialId('tr', state.transfers.length),
      assetId: input.assetId,
      requesterEmployeeId: input.employeeId,
      targetDepartmentId: input.departmentId,
      currentHolderEmployeeId,
      requestedDate: toDateString(new Date()),
      status: 'pending'
    };

    const notification: Notification = {
      id: createSequentialId('n', state.notifications.length),
      type: 'Transfer Requested',
      content: `Transfer request created for asset ${input.assetId}.`,
      date: toDateString(new Date()),
      isRead: false
    };

    appStore.update((draft) => {
      draft.transfers.push(transfer);
      draft.notifications.unshift(notification);
    });
    saveState();
    return transfer;
  }

  returnAsset(input: ReturnAssetInput): Allocation | null {
    let returnedAllocation: Allocation | null = null;
    const state = appStore.getState();
    const allocation = state.allocations.find((item) => item.id === input.allocationId);
    if (!allocation) return null;

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Manager',
      action: 'RETURN',
      entityType: 'Asset',
      details: `Returned asset allocation ${input.allocationId}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      const targetAllocation = draft.allocations.find((item) => item.id === input.allocationId);
      if (!targetAllocation) return;
      targetAllocation.status = 'returned';
      targetAllocation.returnedDate = toDateString(new Date());
      targetAllocation.conditionCheckin = input.conditionCheckin;
      targetAllocation.notes = input.notes;
      const asset = draft.assets.find((item) => item.id === targetAllocation.assetId);
      if (asset) asset.status = 'available';
      draft.auditLogs.unshift(log);
      returnedAllocation = targetAllocation;
    });
    saveState();
    return returnedAllocation;
  }
}

export const allocationService = new AllocationService();
