export type EntityId = string;
export type DateString = string;
export type DateTimeString = string;
export type CurrencyAmount = number;

export type Role = 'admin' | 'manager' | 'head' | 'employee';
export type EmployeeStatus = 'active' | 'inactive';
export type DepartmentStatus = 'active' | 'inactive';
export type AssetCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';
export type AssetStatus =
  | 'available'
  | 'allocated'
  | 'reserved'
  | 'maintenance'
  | 'lost'
  | 'retired'
  | 'disposed';

export type AllocationStatus = 'active' | 'overdue' | 'returned';
export type TransferStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'pending' | 'approved' | 'progress' | 'resolved' | 'rejected';
export type AuditStatus = 'active' | 'closed';
export type AuditVerificationState = 'verified' | 'missing' | 'damaged';
export type AuditLogAction =
  | 'CREATE'
  | 'ASSIGN'
  | 'BOOK'
  | 'CANCEL'
  | 'UPDATE'
  | 'DELETE'
  | 'AUDIT_CREATE'
  | 'AUDIT_CLOSE'
  | 'TRANSFER'
  | 'RETURN';

export interface Department {
  readonly id: EntityId;
  name: string;
  code: string;
  head: string;
  parent: EntityId | '';
  status: DepartmentStatus;
  assetsCount: number;
}

export interface Category {
  readonly id: EntityId;
  name: string;
  icon: string;
  warrantyMonths: number;
  customField: string;
}

export interface Employee {
  readonly id: EntityId;
  name: string;
  email: string;
  departmentId: EntityId;
  role: Role;
  status: EmployeeStatus;
}

export type User = Employee;

export interface Asset {
  readonly id: EntityId;
  name: string;
  categoryId: EntityId;
  assetTag: string;
  serial: string;
  cost: CurrencyAmount;
  acquireDate: DateString;
  condition: AssetCondition;
  location: string;
  isBookable: boolean;
  warrantyField: string;
  status: AssetStatus;
}

export interface Allocation {
  readonly id: EntityId;
  assetId: EntityId;
  employeeId: EntityId;
  departmentId: EntityId;
  allocatedDate: DateString;
  expectedReturnDate: DateString;
  returnedDate: DateString | '';
  conditionCheckin: AssetCondition | '';
  notes: string;
  status: AllocationStatus;
}

export interface Transfer {
  readonly id: EntityId;
  assetId: EntityId;
  requesterEmployeeId: EntityId;
  targetDepartmentId: EntityId;
  currentHolderEmployeeId: EntityId;
  requestedDate: DateString;
  status: TransferStatus;
}

export interface Booking {
  readonly id: EntityId;
  resourceId: EntityId;
  employeeId: EntityId;
  bookDate: DateString;
  startTime: string;
  durationHours: string;
  status: BookingStatus;
}

export interface MaintenanceTicket {
  readonly id: EntityId;
  assetId: EntityId;
  priority: MaintenancePriority;
  issueDescription: string;
  raisedEmployeeId: EntityId;
  raisedDate: DateString;
  status: MaintenanceStatus;
  technicianName: string;
  resolutionDeadline: DateString | '';
  resolvedDate: DateString | '';
}

export interface AuditCycle {
  readonly id: EntityId;
  title: string;
  scopeDeptId: EntityId;
  assignedAuditorId: EntityId;
  startDate: DateString;
  endDate: DateString;
  status: AuditStatus;
  progressPercent: number;
  verifiedAssetIds: EntityId[];
  missingAssetIds: EntityId[];
  damagedAssetIds: EntityId[];
  discrepancyText: string;
}

export interface Notification {
  readonly id: EntityId;
  type: string;
  content: string;
  date: DateString;
  isRead: boolean;
}

export interface AuditLog {
  readonly id: EntityId;
  operator: string;
  action: AuditLogAction | string;
  entityType: string;
  details: string;
  timestamp: DateTimeString;
}
