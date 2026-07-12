import type { ApplicationState, Asset, Department, MaintenanceTicket } from '@core/types';

export interface DashboardStatistics {
  availableAssets: number;
  allocatedAssets: number;
  maintenanceTickets: number;
  activeBookings: number;
  pendingTransfers: number;
  overdueReturns: number;
}

export interface DepartmentValuation {
  department: Department;
  value: number;
}

export class ReportService {
  calculateDashboardStatistics(state: Readonly<ApplicationState>): DashboardStatistics {
    return {
      availableAssets: state.assets.filter((asset) => asset.status === 'available').length,
      allocatedAssets: state.assets.filter((asset) => asset.status === 'allocated').length,
      maintenanceTickets: state.maintenance.filter((ticket) => ticket.status !== 'resolved').length,
      activeBookings: state.bookings.filter((booking) => booking.status !== 'cancelled').length,
      pendingTransfers: state.transfers.filter((transfer) => transfer.status === 'pending').length,
      overdueReturns: state.allocations.filter((allocation) => allocation.status === 'overdue').length
    };
  }

  getIdleAssets(state: Readonly<ApplicationState>, limit?: number): readonly Asset[] {
    const idleAssets = state.assets.filter((asset) => asset.status === 'available');
    return typeof limit === 'number' ? idleAssets.slice(0, limit) : idleAssets;
  }

  getOpenMaintenanceTickets(state: Readonly<ApplicationState>): readonly MaintenanceTicket[] {
    return state.maintenance.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'rejected');
  }

  calculateDepartmentValuations(state: Readonly<ApplicationState>): readonly DepartmentValuation[] {
    return state.departments.map((department) => {
      const departmentAssetIds = new Set(
        state.allocations
          .filter((allocation) => allocation.departmentId === department.id && allocation.status !== 'returned')
          .map((allocation) => allocation.assetId)
      );
      const value = state.assets
        .filter((asset) => departmentAssetIds.has(asset.id))
        .reduce((total, asset) => total + asset.cost, 0);
      return { department, value };
    });
  }
}

export const reportService = new ReportService();
