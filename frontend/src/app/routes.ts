import type { NavigationItem, RouteId } from '@core/types';

export const routes: readonly NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'org-setup', label: 'Organization Setup', icon: 'building-2', requiredRoles: ['admin'] },
  { id: 'assets', label: 'Assets Directory', icon: 'package' },
  { id: 'allocation', label: 'Asset Allocation', icon: 'git-pull-request' },
  { id: 'booking', label: 'Resource Booking', icon: 'calendar' },
  { id: 'maintenance', label: 'Maintenance', icon: 'wrench' },
  { id: 'audit', label: 'Audit Cycle', icon: 'clipboard-check' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-3' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export function findRoute(routeId: RouteId): NavigationItem | undefined {
  return routes.find((route) => route.id === routeId);
}
