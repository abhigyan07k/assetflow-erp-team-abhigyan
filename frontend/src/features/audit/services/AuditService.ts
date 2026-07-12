import type { AuditCycle, AuditLog, AuditVerificationState, EntityId, Notification } from '@core/types';
import { formatLogDate, toDateString } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';

export interface CreateAuditCycleInput {
  title: string;
  scopeDeptId: EntityId;
  assignedAuditorId: EntityId;
  startDate: string;
  endDate: string;
}

function removeId(values: EntityId[], targetId: EntityId): EntityId[] {
  return values.filter((value) => value !== targetId);
}

export class AuditService {
  createAuditCycle(input: CreateAuditCycleInput): AuditCycle {
    const state = appStore.getState();
    const audit: AuditCycle = {
      id: createSequentialId('au', state.audits.length),
      title: input.title,
      scopeDeptId: input.scopeDeptId,
      assignedAuditorId: input.assignedAuditorId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'active',
      progressPercent: 0,
      verifiedAssetIds: [],
      missingAssetIds: [],
      damagedAssetIds: [],
      discrepancyText: 'Cycle configured. Checklist compiled.'
    };

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Admin',
      action: 'AUDIT_CREATE',
      entityType: 'Audit',
      details: `Scheduled new audit cycle: ${input.title}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.audits.push(audit);
      draft.auditLogs.unshift(log);
    });
    saveState();
    return audit;
  }

  markAuditAsset(cycleId: EntityId, assetId: EntityId, verificationState: AuditVerificationState): AuditCycle | null {
    let updated: AuditCycle | null = null;

    appStore.update((draft) => {
      const audit = draft.audits.find((item) => item.id === cycleId);
      if (!audit || audit.status === 'closed') return;

      audit.verifiedAssetIds = removeId(audit.verifiedAssetIds, assetId);
      audit.missingAssetIds = removeId(audit.missingAssetIds, assetId);
      audit.damagedAssetIds = removeId(audit.damagedAssetIds, assetId);

      if (verificationState === 'verified') audit.verifiedAssetIds.push(assetId);
      if (verificationState === 'missing') audit.missingAssetIds.push(assetId);
      if (verificationState === 'damaged') audit.damagedAssetIds.push(assetId);

      const scopedAssets = draft.assets.filter((asset) => {
        const allocation = draft.allocations.find(
          (item) => item.assetId === asset.id && item.departmentId === audit.scopeDeptId
        );
        return Boolean(allocation);
      });
      const total = scopedAssets.length;
      const completed = audit.verifiedAssetIds.length + audit.missingAssetIds.length + audit.damagedAssetIds.length;
      audit.progressPercent = total === 0 ? 100 : Math.round((completed / total) * 100);
      updated = audit;
    });

    saveState();
    return updated;
  }

  closeAuditCycle(cycleId: EntityId): AuditCycle | null {
    const state = appStore.getState();
    const audit = state.audits.find((item) => item.id === cycleId);
    if (!audit || audit.status === 'closed') return null;

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Auditor',
      action: 'AUDIT_CLOSE',
      entityType: 'Audit',
      details: `Closed audit cycle: ${audit.title}. Flags generated: ${audit.missingAssetIds.length} missing.`,
      timestamp: formatLogDate(new Date())
    };

    const notification: Notification = {
      id: createSequentialId('n', state.notifications.length),
      type: 'Audit Flagged',
      content: `Discrepancy Report generated for ${audit.title}. ${audit.missingAssetIds.length} missing items flagged.`,
      date: toDateString(new Date()),
      isRead: false
    };

    let closedAudit: AuditCycle | null = null;
    appStore.update((draft) => {
      const targetAudit = draft.audits.find((item) => item.id === cycleId);
      if (!targetAudit) return;
      targetAudit.status = 'closed';
      targetAudit.missingAssetIds.forEach((missingAssetId) => {
        const asset = draft.assets.find((item) => item.id === missingAssetId);
        if (asset) asset.status = 'lost';
      });
      targetAudit.discrepancyText = `Audit closed. Verified: ${targetAudit.verifiedAssetIds.length}. Missing (Transitioned to Lost): ${targetAudit.missingAssetIds.length}. Damaged: ${targetAudit.damagedAssetIds.length}.`;
      draft.auditLogs.unshift(log);
      draft.notifications.unshift(notification);
      closedAudit = targetAudit;
    });
    saveState();
    return closedAudit;
  }
}

export const auditService = new AuditService();
