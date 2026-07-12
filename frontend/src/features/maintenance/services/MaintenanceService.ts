import type { AuditLog, EntityId, MaintenancePriority, MaintenanceStatus, MaintenanceTicket } from '@core/types';
import { formatLogDate, toDateString } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';
import { maintenanceStore } from '@store/maintenanceStore';

export interface CreateMaintenanceTicketInput {
  assetId: EntityId;
  priority: MaintenancePriority;
  issueDescription: string;
  raisedEmployeeId: EntityId;
}

export interface AssignTechnicianInput {
  ticketId: EntityId;
  technicianName: string;
  resolutionDeadline: string;
}

export class MaintenanceService {
  createTicket(input: CreateMaintenanceTicketInput): MaintenanceTicket {
    const state = appStore.getState();
    const ticket: MaintenanceTicket = {
      id: createSequentialId('m', state.maintenance.length),
      assetId: input.assetId,
      priority: input.priority,
      issueDescription: input.issueDescription,
      raisedEmployeeId: input.raisedEmployeeId,
      raisedDate: toDateString(new Date()),
      status: 'pending',
      technicianName: '',
      resolutionDeadline: '',
      resolvedDate: ''
    };

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System User',
      action: 'CREATE',
      entityType: 'Maintenance',
      details: `Raised maintenance ticket for asset ${input.assetId}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.maintenance.push(ticket);
      const asset = draft.assets.find((item) => item.id === input.assetId);
      if (asset) asset.status = 'maintenance';
      draft.auditLogs.unshift(log);
    });
    saveState();
    return ticket;
  }

  approveTicket(ticketId: EntityId): MaintenanceTicket | null {
    return this.advanceStatus(ticketId, 'approved');
  }

  assignTechnician(input: AssignTechnicianInput): MaintenanceTicket | null {
    let updated: MaintenanceTicket | null = null;
    maintenanceStore.update((tickets) => {
      const ticket = tickets.find((item) => item.id === input.ticketId);
      if (!ticket) return;
      ticket.technicianName = input.technicianName;
      ticket.resolutionDeadline = input.resolutionDeadline;
      ticket.status = 'progress';
      updated = ticket;
    });
    return updated;
  }

  advanceStatus(ticketId: EntityId, nextStatus: MaintenanceStatus): MaintenanceTicket | null {
    let updated: MaintenanceTicket | null = null;
    maintenanceStore.update((tickets) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!ticket) return;
      ticket.status = nextStatus;
      if (nextStatus === 'resolved') ticket.resolvedDate = toDateString(new Date());
      updated = ticket;
    });
    return updated;
  }
}

export const maintenanceService = new MaintenanceService();
