import type { Role } from './domain';

export type Theme = 'light' | 'dark';
export type ToastType = 'primary' | 'success' | 'warning' | 'danger';
export type RouteId =
  | 'dashboard'
  | 'org-setup'
  | 'assets'
  | 'allocation'
  | 'booking'
  | 'maintenance'
  | 'audit'
  | 'reports'
  | 'notifications'
  | 'settings';

export type BookingLayout = 'month' | 'timeline';
export type AssetView = 'grid' | 'table';
export type MaintenanceView = 'kanban' | 'table';

export interface Modal {
  readonly id: string;
  isOpen: boolean;
}

export interface Drawer {
  readonly id: string;
  isOpen: boolean;
}

export interface Toast {
  readonly id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

export interface CalendarState {
  activeCalendarMonth: number;
  activeCalendarYear: number;
}

export interface NavigationItem {
  readonly id: RouteId;
  label: string;
  icon: string;
  requiredRoles?: ReadonlyArray<Role>;
}

export interface Breadcrumb {
  company: string;
  page: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ChartInstance {
  destroy(): void;
}

export type ChartInstanceMap = Record<string, ChartInstance>;

export interface TableColumn<TRecord> {
  readonly key: keyof TRecord | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
