import type { AuditLog, EntityId, TransferStatus } from '@core/types';
import { formatLogDate } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';

export class TransferService {
  processTransferApproval(transferId: EntityId, status: TransferStatus): boolean {
    const state = appStore.getState();
    const transfer = state.transfers.find((item) => item.id === transferId);
    if (!transfer) return false;

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Manager',
      action: 'TRANSFER',
      entityType: 'Asset',
      details: `Transfer request ${transferId} marked as ${status}.`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      const targetTransfer = draft.transfers.find((item) => item.id === transferId);
      if (!targetTransfer) return;
      targetTransfer.status = status;

      if (status === 'approved') {
        const activeAllocation = draft.allocations.find(
          (item) => item.assetId === targetTransfer.assetId && item.status !== 'returned'
        );
        if (activeAllocation) {
          activeAllocation.employeeId = targetTransfer.requesterEmployeeId;
          activeAllocation.departmentId = targetTransfer.targetDepartmentId;
        }
      }

      draft.auditLogs.unshift(log);
    });
    saveState();
    return true;
  }
}

export const transferService = new TransferService();
