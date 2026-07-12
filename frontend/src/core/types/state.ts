import type {
  Allocation,
  Asset,
  AuditCycle,
  AuditLog,
  Booking,
  Category,
  Department,
  Employee,
  MaintenanceTicket,
  Notification,
  Role,
  Transfer,
  User
} from './domain';
import type { AssetView, BookingLayout, MaintenanceView } from './ui';

export interface ApplicationState {
  departments: Department[];
  categories: Category[];
  employees: Employee[];
  assets: Asset[];
  allocations: Allocation[];
  transfers: Transfer[];
  bookings: Booking[];
  maintenance: MaintenanceTicket[];
  audits: AuditCycle[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  activeRole: Role;
  activeCalendarMonth: number;
  activeCalendarYear: number;
  bookingLayout: BookingLayout;
  assetView: AssetView;
  maintView: MaintenanceView;
  activeAuditCycleId: string | null;
  strictBooking: boolean;
}

export interface Store<TState> {
  getState(): Readonly<TState>;
  setState(nextState: TState): void;
  update(mutator: (draft: TState) => void): void;
  subscribe(listener: (state: Readonly<TState>) => void): () => void;
}
