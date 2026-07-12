import { authorizationService } from '@features/auth/services/AuthorizationService';
import { authService } from '@features/auth/services/AuthService';
import { assetService } from '@features/assets/services/AssetService';
import { auditService } from '@features/audit/services/AuditService';
import { bookingService } from '@features/booking/services/BookingService';
import { allocationService } from '@features/allocation/services/AllocationService';
import { maintenanceService } from '@features/maintenance/services/MaintenanceService';
import { notificationService } from '@features/notifications/services/NotificationService';
import { reportService } from '@features/reports/services/ReportService';
import { transferService } from '@features/transfers/services/TransferService';
import { searchService } from '@core/services/SearchService';
import { storageService } from '@core/storage/StorageService';

export interface ServiceContainer {
  readonly allocation: typeof allocationService;
  readonly asset: typeof assetService;
  readonly audit: typeof auditService;
  readonly auth: typeof authService;
  readonly authorization: typeof authorizationService;
  readonly booking: typeof bookingService;
  readonly maintenance: typeof maintenanceService;
  readonly notification: typeof notificationService;
  readonly report: typeof reportService;
  readonly search: typeof searchService;
  readonly storage: typeof storageService;
  readonly transfer: typeof transferService;
}

export function initializeServices(): ServiceContainer {
  return {
    allocation: allocationService,
    asset: assetService,
    audit: auditService,
    auth: authService,
    authorization: authorizationService,
    booking: bookingService,
    maintenance: maintenanceService,
    notification: notificationService,
    report: reportService,
    search: searchService,
    storage: storageService,
    transfer: transferService
  };
}
