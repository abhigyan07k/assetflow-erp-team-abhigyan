// AssetFlow ERP - Core State Engine & Application Logic
// Strict TypeScript port of the legacy app.js UI engine. Preserves 100% of the
// original DOM ids, onclick wiring, and business logic. Exposed globally via
// `window` assignments at the bottom so the existing inline HTML event
// handlers (onclick="...", onsubmit="...") continue to resolve correctly.

import type {
  ApplicationState,
  Asset,
  AssetCondition,
  ChartInstanceMap,
  Department,
  MaintenanceStatus,
  Role,
  ToastType
} from '@core/types';
import { apiRequest } from '@config/api';

declare const lucide: { createIcons(): void };

interface ChartDataset {
  label?: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  fill?: boolean;
  borderRadius?: number;
  borderWidth?: number;
}

interface ChartConfig {
  type: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: Record<string, unknown>;
}

declare class Chart {
  constructor(ctx: CanvasRenderingContext2D, config: ChartConfig);
  destroy(): void;
}

// ================= DOM HELPERS =================
function getEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Expected element with id "${id}" to exist in the DOM`);
  }
  return el as T;
}

function getElOrNull<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function getCanvasContext(id: string): CanvasRenderingContext2D {
  const canvas = getEl<HTMLCanvasElement>(id);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(`Expected 2D context for canvas "${id}"`);
  }
  return ctx;
}

// ================= GLOBAL APPLICATION STATE =================
let state: ApplicationState = {
  departments: [],
  categories: [],
  employees: [],
  assets: [],
  allocations: [],
  transfers: [],
  bookings: [],
  maintenance: [],
  audits: [],
  notifications: [],
  auditLogs: [],
  currentUser: null,
  activeRole: 'admin', // default simulated role
  activeCalendarMonth: new Date().getMonth(), // 0-11
  activeCalendarYear: new Date().getFullYear(),
  bookingLayout: 'month', // 'month' or 'timeline'
  assetView: 'grid', // 'grid' or 'table'
  maintView: 'kanban', // 'kanban' or 'table'
  activeAuditCycleId: null,
  strictBooking: true
};

// Global reference for ChartJS instances to destroy before recreating
const charts: ChartInstanceMap = {};

// ================= INITIAL DATABASE SEEDING =================
function seedInitialDatabase(): void {
  // 1. Departments
  state.departments = [
    { id: 'd-1', name: 'Product Engineering', code: 'ENG', head: 'Bob Johnson', parent: '', status: 'active', assetsCount: 5 },
    { id: 'd-2', name: 'Growth Marketing', code: 'MKT', head: 'Priya Sen', parent: '', status: 'active', assetsCount: 4 },
    { id: 'd-3', name: 'Human Resources', code: 'HR', head: 'John Doe', parent: '', status: 'active', assetsCount: 1 },
    { id: 'd-4', name: 'Corporate Finance', code: 'FIN', head: 'Alice Smith', parent: '', status: 'active', assetsCount: 2 },
    { id: 'd-5', name: 'Operations & IT Support', code: 'OPS', head: 'Sarah Connor', parent: '', status: 'active', assetsCount: 3 }
  ];

  // 2. Categories
  state.categories = [
    { id: 'c-1', name: 'Laptops & Workstations', icon: 'laptop', warrantyMonths: 36, customField: 'RAM & CPU Configuration' },
    { id: 'c-2', name: 'Mobile Smart Devices', icon: 'smartphone', warrantyMonths: 24, customField: 'Carrier & Storage Size' },
    { id: 'c-3', name: 'Premium Office Furniture', icon: 'sofa', warrantyMonths: 60, customField: 'Ergonomic Certification' },
    { id: 'c-4', name: 'Corporate Fleet Vehicles', icon: 'car', warrantyMonths: 48, customField: 'License Plate & Fuel/EV Type' },
    { id: 'c-5', name: 'AV & Meeting Room Gear', icon: 'projector', warrantyMonths: 24, customField: 'Output Resolution & Ports' },
    { id: 'c-6', name: 'Rack Servers & Network Systems', icon: 'server', warrantyMonths: 36, customField: 'U-Height & Power Capacity' }
  ];

  // 3. Employees
  state.employees = [
    { id: 'e-1', name: 'Admin User', email: 'admin@assetflow.com', departmentId: 'd-5', role: 'admin', status: 'active' },
    { id: 'e-2', name: 'Sarah Connor', email: 'sarah.connor@assetflow.com', departmentId: 'd-5', role: 'manager', status: 'active' },
    { id: 'e-3', name: 'Priya Sen', email: 'priya.sen@assetflow.com', departmentId: 'd-2', role: 'head', status: 'active' },
    { id: 'e-4', name: 'Bob Johnson', email: 'bob.johnson@assetflow.com', departmentId: 'd-1', role: 'head', status: 'active' },
    { id: 'e-5', name: 'Raj Kumar', email: 'raj.kumar@assetflow.com', departmentId: 'd-1', role: 'employee', status: 'active' },
    { id: 'e-6', name: 'John Doe', email: 'john.doe@assetflow.com', departmentId: 'd-3', role: 'employee', status: 'active' },
    { id: 'e-7', name: 'Alice Smith', email: 'alice.smith@assetflow.com', departmentId: 'd-4', role: 'employee', status: 'active' },
    { id: 'e-8', name: 'Michael Scott', email: 'michael.scott@assetflow.com', departmentId: 'd-2', role: 'employee', status: 'active' },
    { id: 'e-9', name: 'Dwight Schrute', email: 'dwight.schrute@assetflow.com', departmentId: 'd-2', role: 'employee', status: 'active' },
    { id: 'e-10', name: 'Jim Halpert', email: 'jim.halpert@assetflow.com', departmentId: 'd-2', role: 'employee', status: 'active' }
  ];

  // 4. Assets
  state.assets = [
    { id: 'a-1', name: 'MacBook Pro 16" M3 Max', categoryId: 'c-1', assetTag: 'AF-0001', serial: 'SN-MBP16010', cost: 3499, acquireDate: '2025-10-15', condition: 'new', location: 'San Francisco HQ - Floor 3', isBookable: false, warrantyField: '36 Months AppleCare+', status: 'available' },
    { id: 'a-2', name: 'Dell XPS 15 9530', categoryId: 'c-1', assetTag: 'AF-0002', serial: 'SN-XPS15021', cost: 1999, acquireDate: '2025-11-20', condition: 'excellent', location: 'San Francisco HQ - Floor 3', isBookable: false, warrantyField: '3 Year ProSupport', status: 'allocated' },
    { id: 'a-3', name: 'iPhone 15 Pro Max 256GB', categoryId: 'c-2', assetTag: 'AF-0003', serial: 'SN-IPH15034', cost: 1199, acquireDate: '2025-12-05', condition: 'excellent', location: 'New York Office - Suite A', isBookable: false, warrantyField: '2 Year AppleCare', status: 'allocated' },
    { id: 'a-4', name: 'Ergonomic Mesh Office Chair', categoryId: 'c-3', assetTag: 'AF-0004', serial: 'SN-CHR0049', cost: 450, acquireDate: '2024-05-10', condition: 'good', location: 'San Francisco HQ - Row 12', isBookable: false, warrantyField: '10 Years Manufacturer Warranty', status: 'available' },
    { id: 'a-5', name: 'Tesla Model 3 Dual Motor (EV)', categoryId: 'c-4', assetTag: 'AF-0005', serial: 'SN-TESLA059', cost: 42000, acquireDate: '2025-01-20', condition: 'excellent', location: 'HQ Garage - Slot 14', isBookable: true, warrantyField: '8 Year Battery & Drive Unit Warranty', status: 'available' },
    { id: 'a-6', name: 'Boardroom Projector 4K Laser', categoryId: 'c-5', assetTag: 'AF-0006', serial: 'SN-PROJ068', cost: 1499, acquireDate: '2025-02-18', condition: 'good', location: 'Executive Conference Room A', isBookable: true, warrantyField: '24 Months Exchange Plan', status: 'reserved' },
    { id: 'a-7', name: 'Dell PowerEdge R760 Server', categoryId: 'c-6', assetTag: 'AF-0007', serial: 'SN-SRV0782', cost: 8500, acquireDate: '2024-08-01', condition: 'fair', location: 'HQ Server Room - Rack 3', isBookable: false, warrantyField: '5 Year Mission Critical ProSupport', status: 'maintenance' },
    { id: 'a-8', name: 'Lenovo ThinkPad X1 Carbon Gen 11', categoryId: 'c-1', assetTag: 'AF-0008', serial: 'SN-TP08271', cost: 1699, acquireDate: '2025-04-12', condition: 'excellent', location: 'New York Office - Suite B', isBookable: false, warrantyField: '3 Year Premier Warranty', status: 'available' },
    { id: 'a-9', name: 'Samsung Galaxy S24 Ultra 512GB', categoryId: 'c-2', assetTag: 'AF-0009', serial: 'SN-SGS0923', cost: 1299, acquireDate: '2026-02-10', condition: 'new', location: 'San Francisco HQ - Floor 3', isBookable: false, warrantyField: '2 Year Samsung Care+', status: 'allocated' },
    { id: 'a-10', name: 'Standing Office Desk (Dual Motor)', categoryId: 'c-3', assetTag: 'AF-0010', serial: 'SN-DSK1023', cost: 650, acquireDate: '2024-06-15', condition: 'good', location: 'San Francisco HQ - Floor 3', isBookable: false, warrantyField: '5 Year Desktop & Motor Warranty', status: 'available' },
    { id: 'a-11', name: 'Ford Transit Cargo Van', categoryId: 'c-4', assetTag: 'AF-0011', serial: 'SN-FORD113', cost: 35000, acquireDate: '2024-03-10', condition: 'fair', location: 'HQ Garage - Loading Bay', isBookable: true, warrantyField: '3 Year Bumper to Bumper', status: 'available' },
    { id: 'a-12', name: 'VR Headset Meta Quest 3', categoryId: 'c-5', assetTag: 'AF-0012', serial: 'SN-META129', cost: 649, acquireDate: '2025-11-01', condition: 'excellent', location: 'Design Lab Room 202', isBookable: true, warrantyField: '1 Year Manufacturer', status: 'available' },
    { id: 'a-13', name: 'Cisco Catalyst 9300 Switch', categoryId: 'c-6', assetTag: 'AF-0013', serial: 'SN-CISCO13', cost: 4200, acquireDate: '2025-03-01', condition: 'good', location: 'HQ Server Room - Rack 1', isBookable: false, warrantyField: 'Lifetime Limited Hardware Warranty', status: 'available' },
    { id: 'a-14', name: 'iPad Pro 12.9" M2', categoryId: 'c-2', assetTag: 'AF-0014', serial: 'SN-IPAD142', cost: 1099, acquireDate: '2025-05-15', condition: 'good', location: 'Marketing Suite Lounge', isBookable: false, warrantyField: '1 Year Apple Limited', status: 'available' },
    { id: 'a-15', name: 'Conference Room B Speakerphone', categoryId: 'c-5', assetTag: 'AF-0015', serial: 'SN-CONF158', cost: 399, acquireDate: '2025-07-22', condition: 'good', location: 'Conference Room B', isBookable: true, warrantyField: '2 Year Jabra Warranty', status: 'available' }
  ];

  // 5. Allocations (Dell XPS assigned to Raj Kumar, iPhone assigned to Priya Sen [OVERDUE])
  state.allocations = [
    {
      id: 'al-1',
      assetId: 'a-2',
      employeeId: 'e-5', // Raj Kumar
      departmentId: 'd-1', // Product Eng
      allocatedDate: '2026-05-10',
      expectedReturnDate: '2026-08-10',
      returnedDate: '',
      conditionCheckin: '',
      notes: 'Assigned for engineering sprint work.',
      status: 'active'
    },
    {
      id: 'al-2',
      assetId: 'a-3',
      employeeId: 'e-3', // Priya Sen
      departmentId: 'd-2', // Growth Marketing
      allocatedDate: '2026-06-01',
      expectedReturnDate: '2026-07-10', // OVERDUE as current simulated date is 2026-07-12
      returnedDate: '',
      conditionCheckin: '',
      notes: 'Assigned for trade show deployment.',
      status: 'overdue'
    },
    {
      id: 'al-3',
      assetId: 'a-9',
      employeeId: 'e-6', // John Doe
      departmentId: 'd-3', // HR
      allocatedDate: '2026-06-15',
      expectedReturnDate: '2026-12-15',
      returnedDate: '',
      conditionCheckin: '',
      notes: 'Assigned for communications management.',
      status: 'active'
    }
  ];

  // 6. Transfers
  state.transfers = [
    {
      id: 'tr-1',
      assetId: 'a-3', // iPhone 15
      requesterEmployeeId: 'e-5', // Raj Kumar wants it
      targetDepartmentId: 'd-1',
      currentHolderEmployeeId: 'e-3', // Priya Sen currently holds it
      requestedDate: '2026-07-11',
      status: 'pending'
    }
  ];

  // 7. Bookings
  state.bookings = [
    {
      id: 'b-1',
      resourceId: 'a-5', // Tesla Model 3
      employeeId: 'e-4', // Bob Johnson
      bookDate: '2026-07-13',
      startTime: '09:00',
      durationHours: '2',
      status: 'upcoming'
    },
    {
      id: 'b-2',
      resourceId: 'a-6', // Projector
      employeeId: 'e-5', // Raj Kumar
      bookDate: '2026-07-12', // Today
      startTime: '14:00',
      durationHours: '1.5',
      status: 'upcoming'
    },
    {
      id: 'b-3',
      resourceId: 'a-12', // VR Headset
      employeeId: 'e-2', // Sarah Connor
      bookDate: '2026-07-12', // Today
      startTime: '10:00',
      durationHours: '3',
      status: 'ongoing'
    }
  ];

  // 8. Maintenance Tickets
  state.maintenance = [
    {
      id: 'm-1',
      assetId: 'a-7', // PowerEdge Server
      priority: 'high',
      issueDescription: 'Drive Slot 4 reported read failures. Overheating alerts triggered on rack sensor.',
      raisedEmployeeId: 'e-2', // Sarah Connor
      raisedDate: '2026-07-11',
      status: 'progress',
      technicianName: 'Sarah Connor (IT Manager)',
      resolutionDeadline: '2026-07-14',
      resolvedDate: ''
    },
    {
      id: 'm-2',
      assetId: 'a-8', // ThinkPad
      priority: 'medium',
      issueDescription: 'Laptop screen dimming intermittently. Seems like hardware backlighting driver issue.',
      raisedEmployeeId: 'e-7', // Alice Smith
      raisedDate: '2026-07-12',
      status: 'pending',
      technicianName: '',
      resolutionDeadline: '',
      resolvedDate: ''
    }
  ];

  // 9. Audits
  state.audits = [
    {
      id: 'au-1',
      title: 'Q2 Marketing Devices Audit',
      scopeDeptId: 'd-2', // Marketing
      assignedAuditorId: 'e-2', // Sarah Connor
      startDate: '2026-06-01',
      endDate: '2026-06-10',
      status: 'closed',
      progressPercent: 100,
      verifiedAssetIds: ['a-3', 'a-14'],
      missingAssetIds: [],
      damagedAssetIds: [],
      discrepancyText: 'All marketing assets successfully verified in excellent condition.'
    },
    {
      id: 'au-2',
      title: 'Q3 Product Engineering Hardware Audit',
      scopeDeptId: 'd-1', // Product Eng
      assignedAuditorId: 'e-1', // Admin
      startDate: '2026-07-01',
      endDate: '2026-07-20',
      status: 'active',
      progressPercent: 20,
      verifiedAssetIds: ['a-2'],
      missingAssetIds: [],
      damagedAssetIds: [],
      discrepancyText: 'Cycle started. Pending checks for remaining 4 assets.'
    }
  ];

  // 10. Notifications
  state.notifications = [
    { id: 'n-1', type: 'Overdue Return', content: 'Asset iPhone 15 Pro Max (AF-0003) assigned to Priya Sen was due on 2026-07-10.', date: '2026-07-11', isRead: false },
    { id: 'n-2', type: 'Transfer Approved', content: 'Asset Transfer Request for AF-0002 has been automatically updated in audit log.', date: '2026-07-11', isRead: true },
    { id: 'n-3', type: 'Booking Confirmed', content: 'Tesla Model 3 reservation confirmed for Bob Johnson on 2026-07-13.', date: '2026-07-12', isRead: false },
    { id: 'n-4', type: 'Maintenance Approved', content: 'Maintenance Ticket MT-001 for Rack Server has been approved by Admin.', date: '2026-07-11', isRead: false }
  ];

  // 11. Audit Logs
  state.auditLogs = [
    { id: 'l-1', operator: 'Admin User', action: 'CREATE', entityType: 'Asset', details: 'Registered new asset: MacBook Pro 16 M3 Max (AF-0001)', timestamp: '2026-07-12 09:30' },
    { id: 'l-2', operator: 'Sarah Connor', action: 'ASSIGN', entityType: 'Asset', details: 'Allocated Samsung Galaxy S24 to John Doe', timestamp: '2026-07-12 10:15' },
    { id: 'l-3', operator: 'Bob Johnson', action: 'BOOK', entityType: 'Resource', details: 'Booked Tesla Model 3 for July 13th', timestamp: '2026-07-12 11:00' },
    { id: 'l-4', operator: 'Sarah Connor', action: 'CREATE', entityType: 'Maintenance', details: 'Raised Maintenance Ticket MT-001 for Rack Server', timestamp: '2026-07-11 15:45' }
  ];

  saveState();
}

// ================= LOCAL STORAGE MANAGER =================
function loadState(): void {
  if (window.AssetFlow) {
    state = structuredClone(window.AssetFlow.loadState());
    return;
  }

  const stored = localStorage.getItem('assetflow_erp_db');
  if (stored) {
    try {
      state = JSON.parse(stored) as ApplicationState;
    } catch (e) {
      console.error('Failed to parse database state. Re-seeding.', e);
      seedInitialDatabase();
    }
  } else {
    seedInitialDatabase();
  }
}

function saveState(): void {
  if (window.AssetFlow) {
    window.AssetFlow.store.setState(state);
    window.AssetFlow.saveState();
    return;
  }

  localStorage.setItem('assetflow_erp_db', JSON.stringify(state));
}

function resetAppDatabase(): void {
  if (window.AssetFlow) {
    state = structuredClone(window.AssetFlow.resetAppDatabase());
    showToast('Application database successfully reset to defaults!', 'success');
    setTimeout(() => window.location.reload(), 1000);
    return;
  }

  localStorage.removeItem('assetflow_erp_db');
  seedInitialDatabase();
  showToast('Application database successfully reset to defaults!', 'success');
  setTimeout(() => window.location.reload(), 1000);
}

// ================= ROUTING & SHELL NAVIGATION =================
function navigate(pageId: string): void {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach((section) => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = getElOrNull(`page-${pageId}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update sidebar active link state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    btn.classList.remove('active');
  });

  // Find which button contains page click
  const navBtns = document.querySelectorAll('.sidebar-nav .nav-item');
  navBtns.forEach((btn) => {
    const clickHandler = btn.getAttribute('onclick');
    if (clickHandler && clickHandler.includes(pageId)) {
      btn.classList.add('active');
    }
  });

  // Update Breadcrumbs
  const pageTitle = pageId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  getEl('breadcrumb-page').textContent = pageTitle;

  // Run specific page loaders
  if (pageId === 'dashboard') {
    loadDashboardPage();
  } else if (pageId === 'org-setup') {
    loadOrgSetupPage();
  } else if (pageId === 'assets') {
    loadAssetsPage();
  } else if (pageId === 'allocation') {
    loadAllocationsPage();
  } else if (pageId === 'booking') {
    loadBookingPage();
  } else if (pageId === 'maintenance') {
    loadMaintenancePage();
  } else if (pageId === 'audit') {
    loadAuditPage();
  } else if (pageId === 'reports') {
    loadReportsPage();
  } else if (pageId === 'notifications') {
    renderNotificationsPage();
  } else if (pageId === 'settings') {
    loadSettingsPage();
  }

  // Smooth scroll page back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= TOAST SYSTEM =================
function showToast(message: string, type: ToastType = 'primary'): void {
  const container = getElOrNull('toast-hub');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'danger') iconName = 'alert-octagon';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Trigger animations & removals
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(1rem)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= THEME TOGGLE (DARK MODE) =================
function toggleTheme(): void {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');

  // Toggle Navbar Icons
  const lightIcon = getEl('theme-icon-light');
  const darkIcon = getEl('theme-icon-dark');

  if (isDark) {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
    showToast('Switched to dark theme', 'primary');
  } else {
    lightIcon.style.display = 'block';
    darkIcon.style.display = 'none';
    showToast('Switched to light theme', 'primary');
  }

  // Re-render graphs to match dark colors
  if (getEl('page-dashboard').classList.contains('active')) {
    loadDashboardPage();
  } else if (getEl('page-reports').classList.contains('active')) {
    loadReportsPage();
  }
}

// ================= AUTHENTICATION SYSTEMS =================
function toggleAuthPanel(mode: 'login' | 'signup' | 'forget'): void {
  const loginPanel = getEl('login-form-panel');
  const signupPanel = getEl('signup-form-panel');
  const forgetPanel = getEl('forget-password-form-panel');

  loginPanel.style.display = mode === 'login' ? 'block' : 'none';
  signupPanel.style.display = mode === 'signup' ? 'block' : 'none';
  forgetPanel.style.display = mode === 'forget' ? 'block' : 'none';

  if (mode === 'forget') {
    resetForgetPasswordFlow();
  }
}

interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentId: number | null;
  status: string;
  createdAt: string;
}

interface AuthResponseData {
  user: AuthUserResponse;
  token: string;
}

const AUTH_TOKEN_STORAGE_KEY = 'assetflow_auth_token';

function mapBackendRoleToFrontendRole(role: string): Role {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'admin';
    case 'MANAGER':
      return 'manager';
    case 'IT_SUPPORT':
      return 'head';
    default:
      return 'employee';
  }
}

async function handleLogin(): Promise<void> {
  const email = getEl<HTMLInputElement>('login-email').value.trim();
  const password = getEl<HTMLInputElement>('login-password').value;

  const submitBtn = getEl<HTMLButtonElement>('btn-login-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  try {
    const payload = await apiRequest<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false
    });

    if (!payload.success || !payload.data) {
      showToast(payload.message || 'Login failed. Please check your credentials.', 'danger');
      return;
    }

    const { user, token } = payload.data;
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

    const mappedRole = mapBackendRoleToFrontendRole(user.role);
    const foundUser = {
      id: `e-${user.id}`,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId ? `d-${user.departmentId}` : 'd-1',
      role: mappedRole,
      status: user.status === 'SUSPENDED' ? ('inactive' as const) : ('active' as const)
    };

    const existingEmployee = state.employees.find((e) => e.email.toLowerCase() === foundUser.email.toLowerCase());
    if (!existingEmployee) {
      state.employees.push(foundUser);
    }

    state.currentUser = existingEmployee ?? foundUser;
    state.activeRole = mappedRole; // Auto sync simulation role
    saveState();

    // Hide auth screen, reveal app workspace
    document.body.classList.remove('auth-mode');
    getEl('auth-screen').style.display = 'none';
    getEl('app-shell').style.display = 'flex';

    // Populate navbar elements
    getEl('navbar-user-name').textContent = state.currentUser.name;
    getEl('dropdown-user-name').textContent = state.currentUser.name;
    getEl('dropdown-user-email').textContent = state.currentUser.email;
    getEl('navbar-user-role').textContent = formatRoleName(state.currentUser.role);
    getEl('user-avatar-initials').textContent = state.currentUser.name
      .split(' ')
      .map((n) => n[0])
      .join('');

    // Set Sidebar switcher role options
    getEl<HTMLSelectElement>('role-switcher-select').value = state.currentUser.role;
    changeActiveRole(state.currentUser.role, false); // Initialize visual restrictions

    showToast(`Welcome back, ${state.currentUser.name}!`, 'success');
    navigate('dashboard');
  } catch (error) {
    console.error('Login request failed', error);
    showToast('Unable to reach the AssetFlow server. Please try again.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Sign In</span>`;
  }
}

async function handleSignup(): Promise<void> {
  const name = getEl<HTMLInputElement>('signup-name').value.trim();
  const email = getEl<HTMLInputElement>('signup-email').value.trim();
  const password = getEl<HTMLInputElement>('signup-password').value;

  const submitBtn = getEl<HTMLButtonElement>('btn-signup-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  try {
    const payload = await apiRequest<AuthResponseData>('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
      auth: false
    });

    if (!payload.success || !payload.data) {
      const detail = payload.message || 'Registration failed. Please review the form and try again.';
      showToast(detail, 'warning');
      return;
    }

    // Log activity locally for the UI's audit trail widget
    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: name,
      action: 'CREATE',
      entityType: 'User',
      details: `Self-registered new employee account (${email})`,
      timestamp: formatLogDate(new Date())
    });
    saveState();

    showToast('Registration completed! Please sign in.', 'success');

    // Switch forms
    toggleAuthPanel('login');
    getEl<HTMLInputElement>('login-email').value = email;
    getEl<HTMLInputElement>('login-password').value = '';
  } catch (error) {
    console.error('Signup request failed', error);
    showToast('Unable to reach the AssetFlow server. Please try again.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Create Account</span>`;
  }
}

// ================= FORGET PASSWORD (OTP) FLOW =================
let forgetPasswordEmail = '';

function showFpError(elementId: string, message: string): void {
  const el = getEl(elementId);
  el.textContent = message;
  el.style.display = 'block';
}

function hideFpError(elementId: string): void {
  const el = getEl(elementId);
  el.textContent = '';
  el.style.display = 'none';
}

function resetForgetPasswordFlow(): void {
  forgetPasswordEmail = '';
  getEl<HTMLInputElement>('fp-email').value = '';
  getEl<HTMLInputElement>('fp-otp').value = '';
  getEl<HTMLInputElement>('fp-new-password').value = '';
  getEl<HTMLInputElement>('fp-confirm-password').value = '';
  hideFpError('fp-email-error');
  hideFpError('fp-otp-error');
  hideFpError('fp-reset-error');
  getEl('fp-section-email').style.display = 'block';
  getEl('fp-section-otp').style.display = 'none';
  getEl('fp-section-reset').style.display = 'none';
  getEl('fp-subtitle').textContent = 'Enter your registered email to receive a one-time verification code.';
}

async function submitForgetPasswordEmail(): Promise<void> {
  const email = getEl<HTMLInputElement>('fp-email').value.trim();
  hideFpError('fp-email-error');

  const submitBtn = getEl<HTMLButtonElement>('btn-fp-email-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  try {
    const payload = await apiRequest<null>('/auth/forget-password', {
      method: 'POST',
      body: { email },
      auth: false
    });

    if (!payload.success) {
      showFpError('fp-email-error', payload.message || 'Email does not exist.');
      return;
    }

    forgetPasswordEmail = email;
    getEl('fp-subtitle').textContent = `Enter the 6-digit code sent for ${email}.`;
    getEl('fp-section-email').style.display = 'none';
    getEl('fp-section-otp').style.display = 'block';
    showToast('OTP sent successfully. Check the server logs for the verification code.', 'success');
  } catch (error) {
    console.error('Forget password request failed', error);
    showFpError('fp-email-error', 'Unable to reach the AssetFlow server. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Send OTP</span>`;
  }
}

async function submitVerifyOtp(): Promise<void> {
  const otp = getEl<HTMLInputElement>('fp-otp').value.trim();
  hideFpError('fp-otp-error');

  const submitBtn = getEl<HTMLButtonElement>('btn-fp-otp-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  try {
    const payload = await apiRequest<null>('/auth/verify-otp', {
      method: 'POST',
      body: { email: forgetPasswordEmail, otp },
      auth: false
    });

    if (!payload.success) {
      showFpError('fp-otp-error', payload.message || 'Invalid OTP code.');
      return;
    }

    getEl('fp-subtitle').textContent = 'Choose a new password for your account.';
    getEl('fp-section-otp').style.display = 'none';
    getEl('fp-section-reset').style.display = 'block';
    showToast('OTP verified successfully.', 'success');
  } catch (error) {
    console.error('Verify OTP request failed', error);
    showFpError('fp-otp-error', 'Unable to reach the AssetFlow server. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Verify Code</span>`;
  }
}

async function submitResetPassword(): Promise<void> {
  const newPassword = getEl<HTMLInputElement>('fp-new-password').value;
  const confirmPassword = getEl<HTMLInputElement>('fp-confirm-password').value;
  hideFpError('fp-reset-error');

  if (newPassword !== confirmPassword) {
    showFpError('fp-reset-error', 'Passwords do not match.');
    return;
  }

  const submitBtn = getEl<HTMLButtonElement>('btn-fp-reset-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  try {
    const payload = await apiRequest<null>('/auth/reset-password', {
      method: 'POST',
      body: { email: forgetPasswordEmail, newPassword, confirmPassword },
      auth: false
    });

    if (!payload.success) {
      showFpError('fp-reset-error', payload.message || 'Unable to reset password.');
      return;
    }

    const resetEmail = forgetPasswordEmail;
    showToast('Password reset successfully! Please sign in.', 'success');
    toggleAuthPanel('login');
    getEl<HTMLInputElement>('login-email').value = resetEmail;
    getEl<HTMLInputElement>('login-password').value = '';
  } catch (error) {
    console.error('Reset password request failed', error);
    showFpError('fp-reset-error', 'Unable to reach the AssetFlow server. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Reset Password</span>`;
  }
}

function togglePasswordVisibility(inputId: string, button: HTMLElement): void {
  const input = getEl<HTMLInputElement>(inputId);
  const isCurrentlyPassword = input.type === 'password';
  input.type = isCurrentlyPassword ? 'text' : 'password';

  button.innerHTML = '';
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', isCurrentlyPassword ? 'eye-off' : 'eye');
  button.appendChild(icon);
  lucide.createIcons();
}

function bindPasswordToggle(buttonId: string, inputId: string): void {
  const button = getElOrNull<HTMLButtonElement>(buttonId);
  if (!button) return;
  button.addEventListener('click', () => togglePasswordVisibility(inputId, button));
}

function handleLogout(): void {
  state.currentUser = null;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  saveState();

  getEl('app-shell').style.display = 'none';
  getEl('auth-screen').style.display = 'flex';
  document.body.classList.add('auth-mode');
  showToast('Logged out successfully', 'primary');
}

// ================= ROLE SWITCHER & PERMISSION ENFORCEMENT =================
function changeActiveRole(role: Role, notify = true): void {
  state.activeRole = role;

  // Visual marker in footer
  const badge = getEl('current-role-badge');
  badge.textContent = formatRoleName(role);
  badge.className = `badge ${role === 'admin' ? 'badge-available' : role === 'manager' ? 'badge-allocated' : role === 'head' ? 'badge-reserved' : 'badge-retired'}`;

  // Disable or hide Org Setup in Sidebar if not Admin
  const orgSetupBtn = getEl('nav-org-setup');
  if (role !== 'admin') {
    orgSetupBtn.style.opacity = '0.4';
    orgSetupBtn.style.pointerEvents = 'none';
  } else {
    orgSetupBtn.style.opacity = '1';
    orgSetupBtn.style.pointerEvents = 'auto';
  }

  // Update current page display to adapt changes
  const activeSection = document.querySelector('.page-section.active');
  if (activeSection) {
    const pageId = activeSection.id.replace('page-', '');
    navigate(pageId);
  }

  if (notify) {
    showToast(`Switched view mode to: ${formatRoleName(role)}`, 'primary');
  }
}

// ================= BREADCRUMBS & ORG SELECTORS =================
function toggleOrgDropdown(): void {
  const currentOrg = getEl('current-org-name').textContent;
  const targetOrg = currentOrg === 'Global HQ' ? 'NYC Branch' : 'Global HQ';
  getEl('current-org-name').textContent = targetOrg;
  getEl('breadcrumb-company').textContent = targetOrg;
  showToast(`Switched segment context to ${targetOrg}`, 'success');
}

function toggleProfileDropdown(e: Event): void {
  e.stopPropagation();
  getEl('profile-dropdown').classList.toggle('show');
}

// Close profiles dropdown when clicked elsewhere
document.addEventListener('click', () => {
  const dropdown = getElOrNull('profile-dropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

// ================= PAGE 2: DASHBOARD CONTROLLERS =================
function loadDashboardPage(): void {
  // Welcome Text
  if (state.currentUser) {
    getEl('dashboard-welcome').textContent = `Welcome, ${state.currentUser.name}`;
  }

  // Calculations for KPIs
  const availableCount = state.assets.filter((a) => a.status === 'available').length;
  const allocatedCount = state.assets.filter((a) => a.status === 'allocated').length;
  const maintenanceCount = state.maintenance.filter((m) => m.status !== 'resolved').length;
  const activeBookings = state.bookings.filter((b) => b.status === 'ongoing' || b.status === 'upcoming').length;
  const pendingTransfers = state.transfers.filter((t) => t.status === 'pending').length;
  const overdueReturns = state.allocations.filter((al) => al.status === 'overdue').length;

  getEl('kpi-available').textContent = String(availableCount);
  getEl('kpi-allocated').textContent = String(allocatedCount);
  getEl('kpi-maintenance').textContent = String(maintenanceCount);
  getEl('kpi-bookings').textContent = String(activeBookings);
  getEl('kpi-transfers').textContent = String(pendingTransfers);
  getEl('kpi-returns').textContent = String(overdueReturns);

  // Render Charts
  renderDashboardCharts();

  // Render Activities Widget
  const listContainer = getEl('widget-activity-list');
  listContainer.innerHTML = '';

  // Show last 4 audit logs
  state.auditLogs.slice(0, 4).forEach((log) => {
    let dotClass = 'primary';
    if (log.action === 'CREATE') dotClass = 'success';
    if (log.action === 'ASSIGN') dotClass = 'primary';
    if (log.action === 'MAINTENANCE') dotClass = 'danger';
    if (log.action === 'RETURN') dotClass = 'warning';

    listContainer.innerHTML += `
      <div class="activity-item">
        <div class="activity-dot ${dotClass}"></div>
        <div class="activity-details">
          <h5>${log.operator}</h5>
          <p>${log.details}</p>
          <div class="activity-time">${log.timestamp}</div>
        </div>
      </div>
    `;
  });

  // Render Overdue return items
  const overdueTable = getEl('widget-overdue-table');
  overdueTable.innerHTML = '';

  const overdueAllocs = state.allocations.filter((al) => al.status === 'overdue');
  if (overdueAllocs.length === 0) {
    overdueTable.innerHTML = `<tr><td style="color:var(--text-muted); text-align:center;">No overdue assets!</td></tr>`;
  } else {
    overdueAllocs.forEach((al) => {
      const asset = state.assets.find((a) => a.id === al.assetId);
      const employee = state.employees.find((e) => e.id === al.employeeId);
      overdueTable.innerHTML += `
        <tr>
          <td style="font-weight:600; padding: 0.5rem 0.75rem;">${asset ? asset.name : 'Asset'}</td>
          <td style="padding: 0.5rem 0.75rem;">${employee ? employee.name : 'User'}</td>
          <td style="color:var(--danger); font-weight:600; padding: 0.5rem 0.75rem; text-align:right;">
            Overdue
          </td>
        </tr>
      `;
    });
  }

  // Render priority bulletins widget
  const bulletins = getEl('widget-bulletins');
  bulletins.innerHTML = '';

  const unreadNotifs = state.notifications.filter((n) => !n.isRead);
  if (unreadNotifs.length === 0) {
    bulletins.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem 0;">
        No unread bulletins. All quiet.
      </div>
    `;
  } else {
    unreadNotifs.slice(0, 2).forEach((n) => {
      bulletins.innerHTML += `
        <div style="background-color: var(--primary-light); border-left:3px solid var(--primary); padding: 0.5rem 0.75rem; border-radius: 4px; font-size:0.75rem;">
          <strong>${n.type}:</strong> ${n.content}
        </div>
      `;
    });
  }

  updateGlobalUnreadIndicators();
}

function renderDashboardCharts(): void {
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  // 1. Asset Utilization Line Chart
  if (charts.utilization) charts.utilization.destroy();

  const ctx1 = getCanvasContext('chart-utilization');
  charts.utilization = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'Utilization Rate (%)',
          data: [78, 81, 85, 84, 89, 92, 94],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 60,
          max: 100,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });

  // 2. Maintenance Bar Chart
  if (charts.maintenance) charts.maintenance.destroy();
  const ctx2 = getCanvasContext('chart-maintenance');
  charts.maintenance = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Computers', 'Smart Devices', 'Furniture', 'Vehicles', 'AV Equip', 'Servers'],
      datasets: [
        {
          label: 'Allocated',
          data: [6, 4, 3, 2, 4, 1],
          backgroundColor: '#3B82F6',
          borderRadius: 4
        },
        {
          label: 'In Repair',
          data: [1, 0, 0, 1, 2, 1],
          backgroundColor: '#EF4444',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, boxWidth: 12 }
        }
      },
      scales: {
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}

// ================= PAGE 3: ORGANIZATION SETUP CONTROLLERS =================
function loadOrgSetupPage(): void {
  renderDepartments();
  renderCategories();
  renderEmployees();

  // Seed department head select lists in forms
  const headSelect = getElOrNull<HTMLSelectElement>('dept-add-head');
  if (headSelect) {
    headSelect.innerHTML = '';
    state.employees.forEach((emp) => {
      headSelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
  }

  // Seed parent department in forms
  const parentSelect = getElOrNull<HTMLSelectElement>('dept-add-parent');
  if (parentSelect) {
    parentSelect.innerHTML = '<option value="">None (Top-level division)</option>';
    state.departments.forEach((dept) => {
      parentSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }

  // Seed department selector filter in Employee list
  const filterDept = getElOrNull<HTMLSelectElement>('emp-filter-dept');
  if (filterDept) {
    filterDept.innerHTML = '<option value="">All Departments</option>';
    state.departments.forEach((dept) => {
      filterDept.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }
}

function switchSetupTab(e: MouseEvent, tabId: string): void {
  const target = e.target as HTMLElement;
  // Toggle tab buttons visual
  target.parentNode?.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  target.classList.add('active');

  // Toggle visible pane
  const parentSection = target.closest('.page-section');
  parentSection?.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.remove('active');
  });
  getEl(tabId).classList.add('active');
}

function renderDepartments(): void {
  const tbody = getElOrNull('dept-table-body');
  if (!tbody) return;

  const searchQuery = getEl<HTMLInputElement>('dept-search').value.toLowerCase();
  tbody.innerHTML = '';

  const filteredDepts = state.departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery) ||
      d.code.toLowerCase().includes(searchQuery) ||
      d.head.toLowerCase().includes(searchQuery)
  );

  filteredDepts.forEach((dept) => {
    const parentDept = state.departments.find((d) => d.id === dept.parent);
    const parentName = parentDept ? parentDept.name : '—';
    const statusText = dept.status === 'active' ? 'Active' : 'Inactive';
    const statusBadge = dept.status === 'active' ? 'badge-available' : 'badge-retired';

    tbody.innerHTML += `
      <tr>
        <td style="font-weight: 600;">${dept.name}</td>
        <td><span style="font-family: monospace; background-color: var(--bg-app); padding:2px 6px; border-radius:4px; font-size:0.75rem;">${dept.code}</span></td>
        <td>${dept.head}</td>
        <td>${parentName}</td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="toggleDeptStatus('${dept.id}')">Toggle Status</button>
        </td>
      </tr>
    `;
  });
}

function toggleDeptStatus(deptId: string): void {
  const dept = state.departments.find((d) => d.id === deptId);
  if (dept) {
    dept.status = dept.status === 'active' ? 'inactive' : 'active';
    saveState();
    renderDepartments();
    showToast(`Status of ${dept.name} toggled.`, 'success');
  }
}

function renderCategories(): void {
  const grid = getElOrNull('category-cards-grid');
  if (!grid) return;

  grid.innerHTML = '';

  state.categories.forEach((cat) => {
    const count = state.assets.filter((a) => a.categoryId === cat.id).length;

    let lucideIcon = 'package';
    if (cat.icon === 'laptop') lucideIcon = 'laptop';
    if (cat.icon === 'smartphone') lucideIcon = 'smartphone';
    if (cat.icon === 'sofa') lucideIcon = 'sofa';
    if (cat.icon === 'car') lucideIcon = 'car';
    if (cat.icon === 'projector') lucideIcon = 'projector';
    if (cat.icon === 'server') lucideIcon = 'server';

    grid.innerHTML += `
      <div class="category-card">
        <div class="category-card-header">
          <div class="category-icon-wrapper">
            <i data-lucide="${lucideIcon}"></i>
          </div>
          <span style="font-size:0.75rem; background-color:var(--bg-app); padding:2px 8px; border-radius:20px; font-weight:600;">${count} Assets</span>
        </div>
        <div class="category-card-body">
          <h3>${cat.name}</h3>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 0.5rem;">Custom detail field: <strong>${cat.customField}</strong></p>
        </div>
        <div class="category-card-footer">
          <span class="category-meta-item"><i data-lucide="shield" style="width:0.875rem;"></i> Warranty: ${cat.warrantyMonths} Mos</span>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

// Directory Variables
let empCurrentPage = 1;
const empPageSize = 5;

function renderEmployees(): void {
  const tbody = getElOrNull('employee-table-body');
  if (!tbody) return;

  const search = getEl<HTMLInputElement>('emp-search').value.toLowerCase();
  const deptFilter = getEl<HTMLSelectElement>('emp-filter-dept').value;
  const roleFilter = getEl<HTMLSelectElement>('emp-filter-role').value;

  tbody.innerHTML = '';

  const filtered = state.employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(search) || emp.email.toLowerCase().includes(search);
    const matchesDept = !deptFilter || emp.departmentId === deptFilter;
    const matchesRole = !roleFilter || emp.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  // Pagination logic
  const total = filtered.length;
  const pages = Math.ceil(total / empPageSize);

  if (empCurrentPage > pages) empCurrentPage = Math.max(1, pages);

  const start = (empCurrentPage - 1) * empPageSize;
  const end = Math.min(start + empPageSize, total);

  // Update buttons
  getEl<HTMLButtonElement>('btn-emp-prev').disabled = empCurrentPage <= 1;
  getEl<HTMLButtonElement>('btn-emp-next').disabled = empCurrentPage >= pages;
  getEl('emp-pagination-info').textContent =
    total === 0 ? 'No employees found' : `Showing ${start + 1}-${end} of ${total} employees`;

  const paginated = filtered.slice(start, end);

  paginated.forEach((emp) => {
    const dept = state.departments.find((d) => d.id === emp.departmentId);
    const deptName = dept ? dept.name : 'Unassigned';
    const statusText = emp.status === 'active' ? 'Active' : 'Inactive';
    const statusBadge = emp.status === 'active' ? 'badge-available' : 'badge-retired';

    // Disable promotion buttons if current viewing user is not Admin
    const canPromote = state.activeRole === 'admin';
    const disabledAttr = canPromote ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"';

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">${emp.name}</td>
        <td>${emp.email}</td>
        <td>${deptName}</td>
        <td><span class="badge ${emp.role === 'admin' ? 'badge-available' : emp.role === 'manager' ? 'badge-allocated' : emp.role === 'head' ? 'badge-reserved' : 'badge-retired'}">${formatRoleName(emp.role)}</span></td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
        <td style="text-align: right;">
          <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <select class="form-control" style="width:120px; font-size:0.75rem; padding:2px 4px; height:auto;" onchange="promoteEmployee('${emp.id}', this.value)" ${disabledAttr}>
              <option value="employee" ${emp.role === 'employee' ? 'selected' : ''}>Employee</option>
              <option value="head" ${emp.role === 'head' ? 'selected' : ''}>Dept Head</option>
              <option value="manager" ${emp.role === 'manager' ? 'selected' : ''}>Asset Manager</option>
              <option value="admin" ${emp.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="toggleEmployeeStatus('${emp.id}')" ${disabledAttr}>Toggle</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function handleEmpPageChange(dir: number): void {
  empCurrentPage += dir;
  renderEmployees();
}

function promoteEmployee(empId: string, newRole: Role): void {
  if (state.activeRole !== 'admin') {
    showToast('Role adjustment requires Administrator privileges.', 'danger');
    return;
  }

  const emp = state.employees.find((e) => e.id === empId);
  if (emp) {
    const oldRole = emp.role;
    emp.role = newRole;

    // Log activity
    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: state.currentUser ? state.currentUser.name : 'System Admin',
      action: 'UPDATE',
      entityType: 'User',
      details: `Promoted ${emp.name} from ${formatRoleName(oldRole)} to ${formatRoleName(newRole)}`,
      timestamp: formatLogDate(new Date())
    });

    // Notify employee
    state.notifications.unshift({
      id: `n-${state.notifications.length + 1}`,
      type: 'Asset Assigned', // fallback type
      content: `Your profile security permission role has been adjusted to ${formatRoleName(newRole)}.`,
      date: formatLogDate(new Date()).split(' ')[0] ?? '',
      isRead: false
    });

    saveState();
    renderEmployees();
    showToast(`Role of ${emp.name} promoted to ${formatRoleName(newRole)}`, 'success');
  }
}

function toggleEmployeeStatus(empId: string): void {
  const emp = state.employees.find((e) => e.id === empId);
  if (emp) {
    emp.status = emp.status === 'active' ? 'inactive' : 'active';
    saveState();
    renderEmployees();
    showToast(`Status of ${emp.name} set to ${emp.status}.`, 'success');
  }
}

function submitAddDept(): void {
  const name = getEl<HTMLInputElement>('dept-add-name').value.trim();
  const code = getEl<HTMLInputElement>('dept-add-code').value.trim().toUpperCase();
  const parent = getEl<HTMLSelectElement>('dept-add-parent').value;
  const head = getEl<HTMLSelectElement>('dept-add-head').value;

  const newDept: Department = {
    id: `d-${state.departments.length + 1}`,
    name,
    code,
    head,
    parent,
    status: 'active',
    assetsCount: 0
  };

  state.departments.push(newDept);

  // Audit log
  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System Admin',
    action: 'CREATE',
    entityType: 'Department',
    details: `Created new department: ${name} (${code})`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-add-dept');
  loadOrgSetupPage();
  showToast(`Department ${name} successfully configured!`, 'success');
}

function submitAddCategory(): void {
  const name = getEl<HTMLInputElement>('cat-add-name').value.trim();
  const icon = getEl<HTMLSelectElement>('cat-add-icon').value;
  const warranty = parseInt(getEl<HTMLInputElement>('cat-add-warranty').value, 10);
  const custom = getEl<HTMLInputElement>('cat-add-custom').value.trim();

  const newCat = {
    id: `c-${state.categories.length + 1}`,
    name,
    icon,
    warrantyMonths: warranty,
    customField: custom || 'Model Variant Specs'
  };

  state.categories.push(newCat);

  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System Admin',
    action: 'CREATE',
    entityType: 'Category',
    details: `Created asset category: ${name}`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-add-category');
  loadOrgSetupPage();
  showToast(`Asset category ${name} created!`, 'success');
}

// ================= PAGE 4: ASSET DIRECTORY CONTROLLERS =================
function switchAssetView(view: 'grid' | 'table'): void {
  state.assetView = view;

  const gridContainer = getEl('asset-grid-container');
  const tableContainer = getEl('asset-table-container');

  const gridBtn = getEl('btn-asset-view-grid');
  const tableBtn = getEl('btn-asset-view-table');

  if (view === 'grid') {
    gridContainer.style.display = 'grid';
    tableContainer.style.display = 'none';
    gridBtn.style.backgroundColor = 'var(--bg-app)';
    gridBtn.style.color = 'var(--primary)';
    tableBtn.style.backgroundColor = 'transparent';
    tableBtn.style.color = 'var(--text-muted)';
  } else {
    gridContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    tableBtn.style.backgroundColor = 'var(--bg-app)';
    tableBtn.style.color = 'var(--primary)';
    gridBtn.style.backgroundColor = 'transparent';
    gridBtn.style.color = 'var(--text-muted)';
  }
  renderAssets();
}

function loadAssetsPage(): void {
  // Populate Category filter dropdown
  const filterCat = getElOrNull<HTMLSelectElement>('asset-filter-cat');
  if (filterCat) {
    filterCat.innerHTML = '<option value="">Categories</option>';
    state.categories.forEach((cat) => {
      filterCat.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
  }

  // Populate registration category list
  const regCat = getElOrNull<HTMLSelectElement>('reg-cat');
  if (regCat) {
    regCat.innerHTML = '';
    state.categories.forEach((cat) => {
      regCat.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
  }

  // Populate QR simulation selector list
  const qrSim = getElOrNull<HTMLSelectElement>('qr-simulate-select');
  if (qrSim) {
    qrSim.innerHTML = '';
    state.assets.forEach((asset) => {
      qrSim.innerHTML += `<option value="${asset.id}">${asset.name} (${asset.assetTag})</option>`;
    });
  }

  renderAssets();
}

function renderAssets(): void {
  const gridContainer = getElOrNull('asset-grid-container');
  const tableBody = getElOrNull('asset-table-body');
  if (!gridContainer || !tableBody) return;

  const search = getEl<HTMLInputElement>('asset-search').value.toLowerCase();
  const catFilter = getEl<HTMLSelectElement>('asset-filter-cat').value;
  const statusFilter = getEl<HTMLSelectElement>('asset-filter-status').value;
  const conditionFilter = getEl<HTMLSelectElement>('asset-filter-condition').value;

  // Filter logic
  const filtered = state.assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search) ||
      asset.assetTag.toLowerCase().includes(search) ||
      asset.serial.toLowerCase().includes(search);
    const matchesCat = !catFilter || asset.categoryId === catFilter;
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    const matchesCondition = !conditionFilter || asset.condition === conditionFilter;
    return matchesSearch && matchesCat && matchesStatus && matchesCondition;
  });

  // Clean elements
  gridContainer.innerHTML = '';
  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    gridContainer.innerHTML = `<div class="col-12"><div class="empty-state"><h3>No Assets Registered</h3><p>Adjust your search/filters or register a new corporate hardware asset.</p></div></div>`;
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No assets match selected filters.</td></tr>`;
    return;
  }

  filtered.forEach((asset) => {
    const cat = state.categories.find((c) => c.id === asset.categoryId);
    const catName = cat ? cat.name : 'Standard Item';

    // Find current holder from allocations
    const activeAlloc = state.allocations.find((al) => al.assetId === asset.id && al.status !== 'returned');
    let holderName = '—';
    if (activeAlloc) {
      const emp = state.employees.find((e) => e.id === activeAlloc.employeeId);
      holderName = emp ? emp.name : 'Corporate Office';
    }

    // Badge styling mapping
    let badgeClass = 'badge-available';
    if (asset.status === 'allocated') badgeClass = 'badge-allocated';
    if (asset.status === 'reserved') badgeClass = 'badge-reserved';
    if (asset.status === 'maintenance') badgeClass = 'badge-maintenance';
    if (asset.status === 'lost') badgeClass = 'badge-lost';
    if (asset.status === 'retired') badgeClass = 'badge-retired';
    if (asset.status === 'disposed') badgeClass = 'badge-disposed';

    // RENDER GRID CARD
    gridContainer.innerHTML += `
      <div class="col-4 card interactive" onclick="openAssetDetailDrawer('${asset.id}')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1rem;">
          <span style="font-size:0.75rem; font-family:monospace; background-color:var(--bg-app); padding:2px 6px; border-radius:4px; font-weight:600; color:var(--text-muted);">${asset.assetTag}</span>
          <span class="badge ${badgeClass}"><span class="badge-dot-indicator"></span>${asset.status}</span>
        </div>
        <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">${asset.name}</h4>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem;">Category: ${catName}</p>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border); padding-top:0.75rem; font-size:0.75rem;">
          <div>
            <span style="color:var(--text-muted);">Holder:</span>
            <strong style="color:var(--text-main);">${holderName}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted); text-transform:capitalize;">${asset.condition}</span>
          </div>
        </div>
      </div>
    `;

    // RENDER TABLE ROW
    tableBody.innerHTML += `
      <tr>
        <td style="font-family:monospace; font-weight:600;">${asset.assetTag}</td>
        <td style="font-weight:600;">${asset.name}</td>
        <td>${catName}</td>
        <td style="font-family:monospace; font-size:0.8125rem;">${asset.serial}</td>
        <td style="font-weight:500;">$${asset.cost.toLocaleString()}</td>
        <td style="text-transform:capitalize;">${asset.condition}</td>
        <td>${holderName}</td>
        <td><span class="badge ${badgeClass}"><span class="badge-dot-indicator"></span>${asset.status}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openAssetDetailDrawer('${asset.id}')">Inspect</button>
        </td>
      </tr>
    `;
  });
}

function submitRegisterAsset(): void {
  const name = getEl<HTMLInputElement>('reg-name').value.trim();
  const categoryId = getEl<HTMLSelectElement>('reg-cat').value;
  const serial = getEl<HTMLInputElement>('reg-serial').value.trim();
  const cost = parseInt(getEl<HTMLInputElement>('reg-cost').value, 10);
  const acquireDate = getEl<HTMLInputElement>('reg-date').value;
  const condition = getEl<HTMLSelectElement>('reg-condition').value as AssetCondition;
  const location = getEl<HTMLInputElement>('reg-location').value.trim();
  const isBookable = getEl<HTMLInputElement>('reg-is-bookable').checked;
  const warranty = getEl<HTMLInputElement>('reg-warranty').value.trim();

  // Auto-generate Asset Tag
  const lastAsset = state.assets[state.assets.length - 1];
  let lastNum = 15;
  if (lastAsset) {
    lastNum = parseInt(lastAsset.assetTag.replace('AF-', ''), 10);
  }
  const tagNum = String(lastNum + 1).padStart(4, '0');
  const assetTag = `AF-${tagNum}`;

  const newAsset: Asset = {
    id: `a-${state.assets.length + 1}`,
    name,
    categoryId,
    assetTag,
    serial,
    cost,
    acquireDate,
    condition,
    location,
    isBookable,
    warrantyField: warranty || '12 Months Limited Standard Warranty',
    status: 'available'
  };

  state.assets.push(newAsset);

  // Log activity
  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System Admin',
    action: 'CREATE',
    entityType: 'Asset',
    details: `Registered new asset: ${name} (${assetTag})`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-register-asset');
  loadAssetsPage();
  showToast(`Asset successfully cataloged as ${assetTag}!`, 'success');
}

// ================= PAGE 5: ASSET ALLOCATION CONTROLLERS =================
function loadAllocationsPage(): void {
  // Seed allocating asset options
  const select = getElOrNull<HTMLSelectElement>('alloc-asset-select');
  if (select) {
    select.innerHTML = '<option value="">Choose available asset...</option>';
    state.assets
      .filter((a) => a.status === 'available')
      .forEach((asset) => {
        select.innerHTML += `<option value="${asset.id}">${asset.name} (${asset.assetTag})</option>`;
      });
  }

  // Seed allocating dept options
  const deptSelect = getElOrNull<HTMLSelectElement>('alloc-dept-select');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">Choose division...</option>';
    state.departments
      .filter((d) => d.status === 'active')
      .forEach((dept) => {
        deptSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
      });
  }

  // Clear employee select until dept chosen
  const empSelect = getElOrNull<HTMLSelectElement>('alloc-emp-select');
  if (empSelect) empSelect.innerHTML = '<option value="">Select Department first...</option>';

  renderAllocations();
  renderTransferRequests();
}

function updateAllocEmployeeDropdown(deptId: string): void {
  const empSelect = getElOrNull<HTMLSelectElement>('alloc-emp-select');
  if (!empSelect) return;

  empSelect.innerHTML = '<option value="">Select target employee...</option>';

  if (!deptId) return;

  state.employees
    .filter((e) => e.departmentId === deptId && e.status === 'active')
    .forEach((emp) => {
      empSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
}

function renderAllocations(): void {
  const tbody = getElOrNull('alloc-table-body');
  if (!tbody) return;

  const search = getEl<HTMLInputElement>('alloc-search').value.toLowerCase();
  const showOverdue = getEl<HTMLInputElement>('alloc-filter-overdue').checked;

  tbody.innerHTML = '';

  let filtered = state.allocations.filter((al) => al.status !== 'returned');

  if (showOverdue) {
    filtered = filtered.filter((al) => al.status === 'overdue');
  }

  filtered = filtered.filter((al) => {
    const asset = state.assets.find((a) => a.id === al.assetId);
    const emp = state.employees.find((e) => e.id === al.employeeId);

    const assetMatches = asset && asset.name.toLowerCase().includes(search);
    const empMatches = emp && emp.name.toLowerCase().includes(search);
    return assetMatches || empMatches;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No deployments cataloged matching filters.</td></tr>`;
    return;
  }

  filtered.forEach((al) => {
    const asset = state.assets.find((a) => a.id === al.assetId);
    const emp = state.employees.find((e) => e.id === al.employeeId);
    const dept = state.departments.find((d) => d.id === al.departmentId);

    const assetName = asset ? asset.name : 'Unknown Asset';
    const assetTag = asset ? asset.assetTag : '—';
    const empName = emp ? emp.name : '—';
    const deptCode = dept ? dept.code : '—';

    // Status warning classes
    let statusClass = 'badge-allocated';
    if (al.status === 'overdue') statusClass = 'badge-lost';

    tbody.innerHTML += `
      <tr>
        <td>
          <div style="font-weight:600;">${assetName}</div>
          <span style="font-size:0.75rem; font-family:monospace; color:var(--text-muted);">${assetTag}</span>
        </td>
        <td style="font-weight:500;">${empName}</td>
        <td><span style="font-size:0.8125rem; font-weight:600; background-color:var(--bg-app); padding:2px 6px; border-radius:4px;">${deptCode}</span></td>
        <td>${al.allocatedDate}</td>
        <td>${al.expectedReturnDate || 'Indefinite'}</td>
        <td><span class="badge ${statusClass}">${al.status}</span></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm" onclick="openReturnModal('${al.id}')">Process Return</button>
        </td>
      </tr>
    `;
  });
}

function renderTransferRequests(): void {
  const container = getElOrNull('transfer-list-container');
  if (!container) return;

  container.innerHTML = '';

  const pending = state.transfers.filter((t) => t.status === 'pending');
  const countBadge = getEl('transfer-badge-count');

  if (pending.length > 0) {
    countBadge.style.display = 'inline-flex';
    countBadge.textContent = String(pending.length);
  } else {
    countBadge.style.display = 'none';
  }

  if (pending.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted); border: 1px dashed var(--border); border-radius:var(--radius-sm);">
        <i data-lucide="check" style="margin: 0 auto 0.5rem; display:block;"></i>
        <span style="font-size:0.75rem;">All asset transfers fully settled!</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  pending.forEach((tr) => {
    const asset = state.assets.find((a) => a.id === tr.assetId);
    const requester = state.employees.find((e) => e.id === tr.requesterEmployeeId);
    const holder = state.employees.find((e) => e.id === tr.currentHolderEmployeeId);

    const assetName = asset ? asset.name : 'Asset';
    const requesterName = requester ? requester.name : 'User';
    const holderName = holder ? holder.name : 'Holder';

    // Show action triggers only for Admin, Asset Manager, or Department Heads
    const hasApprovalRights = ['admin', 'manager', 'head'].includes(state.activeRole);
    const actionBtns = hasApprovalRights
      ? `
      <div style="display:flex; gap:0.5rem; margin-top:1rem;">
        <button class="btn btn-primary btn-sm" style="flex-grow:1;" onclick="processTransferApproval('${tr.id}', 'approved')">Approve</button>
        <button class="btn btn-secondary btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="processTransferApproval('${tr.id}', 'rejected')">Reject</button>
      </div>
    `
      : `
      <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.5rem; font-style:italic;">Awaiting Manager/Head signature</p>
    `;

    container.innerHTML += `
      <div class="card" style="padding:1rem; border-left: 3px solid var(--warning);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <strong style="font-size:0.8125rem;">${assetName}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted); font-family:monospace;">${tr.requestedDate}</span>
        </div>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
          Requested by <strong>${requesterName}</strong> from currently assigned holder <strong>${holderName}</strong>.
        </p>
        ${actionBtns}
      </div>
    `;
  });
}

// Conflict rules and submit allocation
interface ConflictData {
  assetId: string;
  requesterEmployeeId: string;
  targetDepartmentId: string;
  currentHolderEmployeeId: string;
  requestedDate: string;
}

let activeConflictData: ConflictData | null = null;

function submitAllocateAsset(): void {
  const assetId = getEl<HTMLSelectElement>('alloc-asset-select').value;
  const deptId = getEl<HTMLSelectElement>('alloc-dept-select').value;
  const employeeId = getEl<HTMLSelectElement>('alloc-emp-select').value;
  const returnDate = getEl<HTMLInputElement>('alloc-return-date').value;

  const targetAsset = state.assets.find((a) => a.id === assetId);

  // CONFLICT RULE: Check if already allocated
  const existingAlloc = state.allocations.find((al) => al.assetId === assetId && al.status !== 'returned');

  if (existingAlloc || (targetAsset && targetAsset.status === 'allocated')) {
    // Show conflict modal
    const currentHolder = state.employees.find((e) => e.id === (existingAlloc ? existingAlloc.employeeId : ''));
    const currentDept = state.departments.find((d) => d.id === (existingAlloc ? existingAlloc.departmentId : ''));

    activeConflictData = {
      assetId,
      requesterEmployeeId: employeeId,
      targetDepartmentId: deptId,
      currentHolderEmployeeId: existingAlloc ? existingAlloc.employeeId : 'e-2',
      requestedDate: formatLogDate(new Date()).split(' ')[0] ?? ''
    };

    getEl('conflict-asset-name').textContent = targetAsset ? targetAsset.name : 'Target Laptop';
    getEl('conflict-current-holder').textContent = currentHolder ? currentHolder.name : 'Sarah Connor';
    getEl('conflict-current-dept').textContent = currentDept ? currentDept.name : 'Corporate IT';

    closeModal('modal-allocate-asset');
    openModal('modal-conflict-warning');
    return;
  }

  // Standard allocation execution
  executeAssetAllocation(assetId, employeeId, deptId, returnDate);
}

function executeAssetAllocation(assetId: string, employeeId: string, departmentId: string, returnDate: string): void {
  const asset = state.assets.find((a) => a.id === assetId);
  const emp = state.employees.find((e) => e.id === employeeId);

  state.allocations.push({
    id: `al-${state.allocations.length + 1}`,
    assetId,
    employeeId,
    departmentId,
    allocatedDate: formatLogDate(new Date()).split(' ')[0] ?? '',
    expectedReturnDate: returnDate || '',
    returnedDate: '',
    conditionCheckin: '',
    notes: 'Standard staff issue.',
    status: 'active'
  });

  // Update Asset Status to allocated
  if (asset) asset.status = 'allocated';

  // Audit Logs
  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System Admin',
    action: 'ASSIGN',
    entityType: 'Asset',
    details: `Allocated asset ${asset ? asset.name : ''} to ${emp ? emp.name : 'Staff'}`,
    timestamp: formatLogDate(new Date())
  });

  // Create notifications
  state.notifications.unshift({
    id: `n-${state.notifications.length + 1}`,
    type: 'Asset Assigned',
    content: `New asset ${asset ? asset.name : 'Device'} has been successfully assigned to you.`,
    date: formatLogDate(new Date()).split(' ')[0] ?? '',
    isRead: false
  });

  saveState();
  closeModal('modal-allocate-asset');
  loadAllocationsPage();
  showToast(`Asset allocated to ${emp ? emp.name : 'employee'} successfully!`, 'success');
}

function executeTransferRequest(): void {
  if (!activeConflictData) return;

  state.transfers.push({
    id: `tr-${state.transfers.length + 1}`,
    ...activeConflictData,
    status: 'pending'
  });

  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System User',
    action: 'TRANSFER',
    entityType: 'Asset',
    details: `Initiated transfer request for asset ID ${activeConflictData.assetId}`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-conflict-warning');
  loadAllocationsPage();
  showToast('Transfer Request filed successfully! Awaiting Manager approval.', 'success');
  activeConflictData = null;
}

function processTransferApproval(transferId: string, status: 'approved' | 'rejected'): void {
  const tr = state.transfers.find((t) => t.id === transferId);
  if (!tr) return;

  tr.status = status;

  if (status === 'approved') {
    // 1. Close current active allocation for the asset
    const activeAlloc = state.allocations.find((al) => al.assetId === tr.assetId && al.status !== 'returned');
    if (activeAlloc) {
      activeAlloc.status = 'returned';
      activeAlloc.returnedDate = formatLogDate(new Date()).split(' ')[0] ?? '';
    }

    // 2. Open new allocation to requester
    state.allocations.push({
      id: `al-${state.allocations.length + 1}`,
      assetId: tr.assetId,
      employeeId: tr.requesterEmployeeId,
      departmentId: tr.targetDepartmentId,
      allocatedDate: formatLogDate(new Date()).split(' ')[0] ?? '',
      expectedReturnDate: '',
      returnedDate: '',
      conditionCheckin: '',
      notes: 'Transfer routing.',
      status: 'active'
    });

    // Update asset
    const asset = state.assets.find((a) => a.id === tr.assetId);
    if (asset) asset.status = 'allocated';

    // Logs
    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: state.currentUser ? state.currentUser.name : 'Approver Manager',
      action: 'ASSIGN',
      entityType: 'Asset',
      details: `Approved transfer of ${asset ? asset.name : 'device'}`,
      timestamp: formatLogDate(new Date())
    });

    state.notifications.unshift({
      id: `n-${state.notifications.length + 1}`,
      type: 'Transfer Approved',
      content: `Your transfer request for ${asset ? asset.name : 'device'} was approved.`,
      date: formatLogDate(new Date()).split(' ')[0] ?? '',
      isRead: false
    });

    showToast('Transfer approved and asset re-allocated!', 'success');
  } else {
    showToast('Transfer request rejected.', 'warning');
  }

  saveState();
  loadAllocationsPage();
}

function openReturnModal(allocId: string): void {
  const al = state.allocations.find((a) => a.id === allocId);
  if (!al) return;

  const asset = state.assets.find((a) => a.id === al.assetId);
  const emp = state.employees.find((e) => e.id === al.employeeId);

  getEl<HTMLInputElement>('return-asset-id').value = al.id;
  getEl('return-asset-label').textContent = asset ? `${asset.name} (${asset.assetTag})` : 'Asset';
  getEl('return-employee-label').textContent = emp ? emp.name : 'Staff';

  openModal('modal-return-form');
}

function submitReturnAsset(): void {
  const allocId = getEl<HTMLInputElement>('return-asset-id').value;
  const condition = getEl<HTMLSelectElement>('return-condition').value as AssetCondition;
  const notes = getEl<HTMLTextAreaElement>('return-notes').value.trim();

  const al = state.allocations.find((a) => a.id === allocId);
  if (al) {
    al.status = 'returned';
    al.returnedDate = formatLogDate(new Date()).split(' ')[0] ?? '';
    al.conditionCheckin = condition;
    al.notes += ` | Returned notes: ${notes}`;

    // Revert Asset status back to available
    const asset = state.assets.find((a) => a.id === al.assetId);
    if (asset) {
      asset.status = 'available';
      asset.condition = condition; // Update physical condition
    }

    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: state.currentUser ? state.currentUser.name : 'System Admin',
      action: 'RETURN',
      entityType: 'Asset',
      details: `Asset return completed for ${asset ? asset.name : 'device'}`,
      timestamp: formatLogDate(new Date())
    });

    saveState();
    closeModal('modal-return-form');
    loadAllocationsPage();
    showToast('Asset returned and checked back in as Available!', 'success');
  }
}

// ================= PAGE 6: RESOURCE BOOKING CONTROLLERS =================
function switchBookingLayout(layout: 'month' | 'timeline'): void {
  state.bookingLayout = layout;

  const monthLayout = getEl('booking-month-layout');
  const timelineLayout = getEl('booking-timeline-layout');
  const monthBtn = getEl('btn-booking-view-month');
  const timelineBtn = getEl('btn-booking-view-timeline');

  if (layout === 'month') {
    monthLayout.style.display = 'block';
    timelineLayout.style.display = 'none';
    monthBtn.style.backgroundColor = 'var(--primary-light)';
    monthBtn.style.color = 'var(--primary)';
    timelineBtn.style.backgroundColor = 'transparent';
    timelineBtn.style.color = 'var(--text-muted)';
  } else {
    monthLayout.style.display = 'none';
    timelineLayout.style.display = 'block';
    timelineBtn.style.backgroundColor = 'var(--primary-light)';
    timelineBtn.style.color = 'var(--primary)';
    monthBtn.style.backgroundColor = 'transparent';
    monthBtn.style.color = 'var(--text-muted)';
  }
  loadBookingPage();
}

function adjustCalendarMonth(direction: number): void {
  let m = state.activeCalendarMonth + direction;
  let y = state.activeCalendarYear;
  if (m < 0) {
    m = 11;
    y -= 1;
  } else if (m > 11) {
    m = 0;
    y += 1;
  }
  state.activeCalendarMonth = m;
  state.activeCalendarYear = y;
  loadBookingPage();
}

// Current chosen resource for booking rendering
let selectedBookableResourceId = 'all';

function loadBookingPage(): void {
  // Populate resource select choices
  const bookSelect = getElOrNull<HTMLSelectElement>('book-resource-select');
  if (bookSelect) {
    bookSelect.innerHTML = '';
    state.assets
      .filter((a) => a.isBookable)
      .forEach((r) => {
        bookSelect.innerHTML += `<option value="${r.id}">${r.name} (${r.location})</option>`;
      });
  }

  // Populate Resource Switcher Tabs
  const tabs = getElOrNull('booking-resource-tabs');
  if (tabs) {
    tabs.innerHTML = `
      <div class="resource-card ${selectedBookableResourceId === 'all' ? 'active' : ''}" onclick="selectBookingResourceTab('all')">
        <div class="resource-icon"><i data-lucide="layout-grid"></i></div>
        <div class="resource-info">
          <h4>All Resources</h4>
          <p>Shared infrastructure</p>
        </div>
      </div>
    `;

    state.assets
      .filter((a) => a.isBookable)
      .forEach((r) => {
        let icon = 'calendar';
        const cat = state.categories.find((c) => c.id === r.categoryId);
        if (cat && cat.icon === 'car') icon = 'car';
        if (cat && cat.icon === 'projector') icon = 'projector';

        tabs.innerHTML += `
        <div class="resource-card ${selectedBookableResourceId === r.id ? 'active' : ''}" onclick="selectBookingResourceTab('${r.id}')">
          <div class="resource-icon"><i data-lucide="${icon}"></i></div>
          <div class="resource-info">
            <h4>${r.name}</h4>
            <p>${r.location}</p>
          </div>
        </div>
      `;
      });
    lucide.createIcons();
  }

  // Header month-year display
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  getEl('calendar-month-year').textContent = `${months[state.activeCalendarMonth] ?? ''} ${state.activeCalendarYear}`;

  if (state.bookingLayout === 'month') {
    renderCalendarGrid();
  } else {
    renderTimelineGrid();
  }

  renderUpcomingBookingsWidget();
}

function selectBookingResourceTab(resourceId: string): void {
  selectedBookableResourceId = resourceId;
  loadBookingPage();
}

function renderCalendarGrid(): void {
  const container = getElOrNull('calendar-day-cells');
  if (!container) return;

  container.innerHTML = '';

  const year = state.activeCalendarYear;
  const month = state.activeCalendarMonth;

  // Day calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // 1. Fill previous month tail cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    container.innerHTML += `
      <div class="calendar-cell other-month">
        <span class="calendar-day-number">${prevMonthTotalDays - i}</span>
      </div>
    `;
  }

  // 2. Fill active month cells
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Filter bookings on this specific day
    const dayBookings = state.bookings.filter((b) => {
      const isDate = b.bookDate === cellDateStr;
      const isRes = selectedBookableResourceId === 'all' || b.resourceId === selectedBookableResourceId;
      return isDate && isRes;
    });

    let bookingHtml = '';
    dayBookings.forEach((b) => {
      const resource = state.assets.find((a) => a.id === b.resourceId);
      const name = resource ? resource.name : 'Space';
      let statusClass = 'upcoming';
      if (b.status === 'ongoing') statusClass = 'ongoing';
      if (b.status === 'completed') statusClass = 'completed';
      if (b.status === 'cancelled') statusClass = 'cancelled';

      bookingHtml += `
        <div class="calendar-event ${statusClass}" title="${name} @ ${b.startTime}" onclick="openBookingInspector('${b.id}')">
          ${b.startTime} ${name}
        </div>
      `;
    });

    container.innerHTML += `
      <div class="calendar-cell ${isToday ? 'today' : ''}">
        <span class="calendar-day-number">${day}</span>
        <div class="calendar-events">
          ${bookingHtml}
        </div>
      </div>
    `;
  }
}

function renderTimelineGrid(): void {
  const container = getElOrNull('timeline-slots-container');
  if (!container) return;

  container.innerHTML = '';

  const resources =
    selectedBookableResourceId === 'all'
      ? state.assets.filter((a) => a.isBookable)
      : state.assets.filter((a) => a.id === selectedBookableResourceId);

  if (resources.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No resources selected</h3></div>`;
    return;
  }

  // Render hourly schedule block for today (July 12)
  resources.forEach((res) => {
    const resBookings = state.bookings.filter((b) => b.resourceId === res.id && b.bookDate === '2026-07-12');

    let hoursHtml = '';
    for (let h = 8; h <= 18; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;

      // Check if slot overlaps with any active booking
      const activeBooking = resBookings.find((b) => {
        const startH = parseInt(b.startTime.split(':')[0] ?? '0', 10);
        const dur = parseFloat(b.durationHours);
        return h >= startH && h < startH + dur;
      });

      let slotStyle = '';
      let slotLabel = 'Free';
      if (activeBooking) {
        slotStyle = 'background-color: var(--primary-light); color:var(--primary); font-weight:600;';
        const emp = state.employees.find((e) => e.id === activeBooking.employeeId);
        slotLabel = emp ? emp.name : 'Reserved';
      }

      hoursHtml += `
        <div style="flex:1; border-right: 1px solid var(--border); padding: 0.5rem; min-height: 48px; display:flex; flex-direction:column; justify-content:space-between; ${slotStyle}">
          <span style="font-size:0.65rem; color:var(--text-muted);">${timeStr}</span>
          <span style="font-size:0.75rem; text-align:center;">${slotLabel}</span>
        </div>
      `;
    }

    container.innerHTML += `
      <div style="display:flex; flex-direction:column; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow:hidden;">
        <div style="background-color: var(--bg-app); padding: 0.5rem 1rem; border-bottom: 1px solid var(--border); font-size:0.8125rem; font-weight:600;">
          ${res.name} (${res.location})
        </div>
        <div style="display:flex; overflow-x:auto;">
          ${hoursHtml}
        </div>
      </div>
    `;
  });
}

function renderUpcomingBookingsWidget(): void {
  const container = getElOrNull('booking-upcoming-list');
  if (!container) return;

  container.innerHTML = '';

  const list = state.bookings.filter((b) => b.status === 'upcoming' || b.status === 'ongoing');

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem 0; color:var(--text-muted); font-size:0.8125rem;">No upcoming space reservations.</div>`;
    return;
  }

  list.forEach((b) => {
    const res = state.assets.find((a) => a.id === b.resourceId);
    const emp = state.employees.find((e) => e.id === b.employeeId);

    container.innerHTML += `
      <div class="card" style="padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <strong style="font-size:0.8125rem;">${res ? res.name : 'Resource'}</strong>
          <span class="badge ${b.status === 'ongoing' ? 'badge-maintenance' : 'badge-allocated'}" style="font-size:0.65rem; padding:1px 6px;">${b.status}</span>
        </div>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
          Reserved on: <strong>${b.bookDate}</strong> @ <strong>${b.startTime}</strong> (${b.durationHours} hrs)<br>
          Reserved by: ${emp ? emp.name : 'Staff'}
        </p>
        <div style="display:flex; gap:0.5rem; margin-top:0.75rem; justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="cancelBooking('${b.id}')" style="color:var(--danger); border-color:var(--danger);">Cancel</button>
        </div>
      </div>
    `;
  });
}

function submitBookResource(): void {
  const resourceId = getEl<HTMLSelectElement>('book-resource-select').value;
  const date = getEl<HTMLInputElement>('book-date').value;
  const startTime = getEl<HTMLInputElement>('book-time').value;
  const duration = parseFloat(getEl<HTMLInputElement>('book-duration').value);

  // STRICT OVERLAP VALIDATION: Check collisions
  const resourceBookings = state.bookings.filter(
    (b) => b.resourceId === resourceId && b.bookDate === date && b.status !== 'cancelled'
  );

  const newStartHour = parseInt(startTime.split(':')[0] ?? '0', 10);
  const newStartMin = parseInt(startTime.split(':')[1] ?? '0', 10);
  const newStartVal = newStartHour + newStartMin / 60;
  const newEndVal = newStartVal + duration;

  let collision = false;
  let collisionEmpName = 'Staff';

  resourceBookings.forEach((b) => {
    const existingStartHour = parseInt(b.startTime.split(':')[0] ?? '0', 10);
    const existingStartMin = parseInt(b.startTime.split(':')[1] ?? '0', 10);
    const existingStartVal = existingStartHour + existingStartMin / 60;
    const existingEndVal = existingStartVal + parseFloat(b.durationHours);

    // Overlap condition
    if (newStartVal < existingEndVal && newEndVal > existingStartVal) {
      collision = true;
      const emp = state.employees.find((e) => e.id === b.employeeId);
      collisionEmpName = emp ? emp.name : 'Staff';
    }
  });

  if (collision && state.strictBooking) {
    showToast(`Booking Collision! This slot is already booked by ${collisionEmpName}.`, 'danger');
    return;
  }

  state.bookings.push({
    id: `b-${state.bookings.length + 1}`,
    resourceId,
    employeeId: state.currentUser ? state.currentUser.id : 'e-1',
    bookDate: date,
    startTime,
    durationHours: String(duration),
    status: 'upcoming'
  });

  // Add Log
  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System User',
    action: 'BOOK',
    entityType: 'Resource',
    details: `Booked shared resource ID ${resourceId} for ${date}`,
    timestamp: formatLogDate(new Date())
  });

  // Create notifications
  state.notifications.unshift({
    id: `n-${state.notifications.length + 1}`,
    type: 'Booking Confirmed',
    content: `Your reservation for resource is confirmed for ${date} at ${startTime}.`,
    date: formatLogDate(new Date()).split(' ')[0] ?? '',
    isRead: false
  });

  saveState();
  closeModal('modal-book-resource');
  loadBookingPage();
  showToast('Resource booked successfully!', 'success');
}

function cancelBooking(bookingId: string): void {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (b) {
    b.status = 'cancelled';

    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: state.currentUser ? state.currentUser.name : 'System User',
      action: 'CANCEL',
      entityType: 'Resource',
      details: `Cancelled space booking ID ${bookingId}`,
      timestamp: formatLogDate(new Date())
    });

    saveState();
    loadBookingPage();
    showToast('Reservation successfully cancelled.', 'warning');
  }
}

function openBookingInspector(bookingId: string): void {
  const b = state.bookings.find((x) => x.id === bookingId);
  if (!b) return;

  const res = state.assets.find((a) => a.id === b.resourceId);
  const emp = state.employees.find((e) => e.id === b.employeeId);

  const resName = res ? res.name : 'Resource';
  const empName = emp ? emp.name : 'Staff';

  alert(
    `Reservation Details:\nResource: ${resName}\nReserved By: ${empName}\nDate: ${b.bookDate}\nTime: ${b.startTime}\nDuration: ${b.durationHours} Hours\nStatus: ${b.status}`
  );
}

// ================= PAGE 7: MAINTENANCE CONTROLLERS =================
function switchMaintView(view: 'kanban' | 'table'): void {
  state.maintView = view;

  const kanban = getEl('maint-kanban-board');
  const table = getEl('maint-table-container');
  const kanbanBtn = getEl('btn-maint-view-kanban');
  const tableBtn = getEl('btn-maint-view-table');

  if (view === 'kanban') {
    kanban.style.display = 'flex';
    table.style.display = 'none';
    kanbanBtn.style.backgroundColor = 'var(--bg-app)';
    kanbanBtn.style.color = 'var(--primary)';
    tableBtn.style.backgroundColor = 'transparent';
  } else {
    kanban.style.display = 'none';
    table.style.display = 'block';
    tableBtn.style.backgroundColor = 'var(--bg-app)';
    tableBtn.style.color = 'var(--primary)';
    kanbanBtn.style.backgroundColor = 'transparent';
  }
  renderMaintenance();
}

function loadMaintenancePage(): void {
  // Populate asset selects in form
  const select = getElOrNull<HTMLSelectElement>('maint-asset-select');
  if (select) {
    select.innerHTML = '';
    state.assets.forEach((a) => {
      select.innerHTML += `<option value="${a.id}">${a.name} (${a.assetTag})</option>`;
    });
  }

  // Populate technician dropdown lists
  const techSelect = getElOrNull<HTMLSelectElement>('assign-tech-select');
  if (techSelect) {
    techSelect.innerHTML = '<option value="">Select Technician...</option>';
    // Filter IT / Ops managers
    state.employees.forEach((emp) => {
      techSelect.innerHTML += `<option value="${emp.name}">${emp.name} (${emp.role})</option>`;
    });
  }

  renderMaintenance();
}

function renderMaintenance(): void {
  const search = getEl<HTMLInputElement>('maint-search').value.toLowerCase();
  const priorityFilter = getEl<HTMLSelectElement>('maint-filter-priority').value;

  // Filter tasks
  const filtered = state.maintenance.filter((ticket) => {
    const asset = state.assets.find((a) => a.id === ticket.assetId);

    const matchesSearch =
      ticket.issueDescription.toLowerCase().includes(search) ||
      (asset && asset.name.toLowerCase().includes(search)) ||
      (asset && asset.assetTag.toLowerCase().includes(search));
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  if (state.maintView === 'kanban') {
    renderMaintenanceKanban(filtered);
  } else {
    renderMaintenanceTable(filtered);
  }
}

function renderMaintenanceKanban(tickets: typeof state.maintenance): void {
  // Columns identifiers
  const columns: Record<MaintenanceStatus, HTMLElement | null> = {
    pending: getElOrNull('col-maint-pending'),
    approved: getElOrNull('col-maint-approved'),
    assigned: getElOrNull('col-maint-assigned'),
    progress: getElOrNull('col-maint-progress'),
    resolved: getElOrNull('col-maint-resolved'),
    rejected: null
  };

  // Clear all columns
  Object.values(columns).forEach((col) => {
    if (col) col.innerHTML = '';
  });

  // Counts
  const counts: Record<MaintenanceStatus, number> = {
    pending: 0,
    approved: 0,
    assigned: 0,
    progress: 0,
    resolved: 0,
    rejected: 0
  };

  tickets.forEach((t) => {
    const asset = state.assets.find((a) => a.id === t.assetId);
    const assetName = asset ? asset.name : 'Unknown Device';
    const assetTag = asset ? asset.assetTag : '—';
    const techText = t.technicianName ? `Tech: ${t.technicianName}` : 'No Tech Assigned';

    counts[t.status]++;

    const col = columns[t.status];
    if (col) {
      // Role-based actions on ticket cards
      let actionButtons = '';
      const isManager = ['admin', 'manager'].includes(state.activeRole);

      if (t.status === 'pending' && isManager) {
        actionButtons = `<button class="btn btn-primary btn-sm" style="width:100%; margin-top:0.5rem;" onclick="approveMaintenanceTicket('${t.id}')">Approve Request</button>`;
      } else if (t.status === 'approved' && isManager) {
        actionButtons = `<button class="btn btn-secondary btn-sm" style="width:100%; margin-top:0.5rem;" onclick="openAssignTechModal('${t.id}')">Assign Technician</button>`;
      } else if (t.status === 'assigned') {
        actionButtons = `<button class="btn btn-secondary btn-sm" style="width:100%; margin-top:0.5rem;" onclick="advanceMaintenanceStatus('${t.id}', 'progress')">Start Work</button>`;
      } else if (t.status === 'progress') {
        actionButtons = `<button class="btn btn-primary btn-sm" style="width:100%; margin-top:0.5rem;" onclick="advanceMaintenanceStatus('${t.id}', 'resolved')">Resolve Issue</button>`;
      }

      col.innerHTML += `
        <div class="kanban-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
            <span style="font-size:0.7rem; font-family:monospace; color:var(--text-muted);">${assetTag}</span>
            <span class="badge ${t.priority === 'high' ? 'badge-high' : t.priority === 'medium' ? 'badge-medium' : 'badge-low'}">${t.priority}</span>
          </div>
          <h4 class="kanban-card-title">${assetName}</h4>
          <p class="kanban-card-desc">${t.issueDescription}</p>
          <div class="kanban-card-footer">
            <span>${techText}</span>
            <span style="font-weight:600;">${t.status.toUpperCase()}</span>
          </div>
          ${actionButtons}
        </div>
      `;
    }
  });

  // Render Column Header Counts
  getEl('count-maint-pending').textContent = String(counts.pending);
  getEl('count-maint-approved').textContent = String(counts.approved);
  getEl('count-maint-assigned').textContent = String(counts.assigned);
  getEl('count-maint-progress').textContent = String(counts.progress);
  getEl('count-maint-resolved').textContent = String(counts.resolved);
}

function renderMaintenanceTable(tickets: typeof state.maintenance): void {
  const tbody = getElOrNull('maint-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No maintenance tickets found.</td></tr>`;
    return;
  }

  tickets.forEach((t, i) => {
    const asset = state.assets.find((a) => a.id === t.assetId);

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">TKT-00${i + 1}</td>
        <td>
          <div style="font-weight:600;">${asset ? asset.name : 'Asset'}</div>
          <span style="font-size:0.75rem; font-family:monospace; color:var(--text-muted);">${asset ? asset.assetTag : ''}</span>
        </td>
        <td style="max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.issueDescription}</td>
        <td><span class="badge ${t.priority === 'high' ? 'badge-high' : t.priority === 'medium' ? 'badge-medium' : 'badge-low'}">${t.priority}</span></td>
        <td>${t.technicianName || 'Unassigned'}</td>
        <td style="text-transform:capitalize; font-weight:600;">${t.status}</td>
        <td>${t.raisedDate}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm" onclick="showMaintDetailsSummary('${t.id}')">Inspect</button>
        </td>
      </tr>
    `;
  });
}

function submitMaintenanceRequest(): void {
  const assetId = getEl<HTMLSelectElement>('maint-asset-select').value;
  const priority = getEl<HTMLSelectElement>('maint-priority').value as 'low' | 'medium' | 'high' | 'critical';
  const desc = getEl<HTMLTextAreaElement>('maint-desc').value.trim();

  state.maintenance.push({
    id: `m-${state.maintenance.length + 1}`,
    assetId,
    priority,
    issueDescription: desc,
    raisedEmployeeId: state.currentUser ? state.currentUser.id : 'e-1',
    raisedDate: formatLogDate(new Date()).split(' ')[0] ?? '',
    status: 'pending',
    technicianName: '',
    resolutionDeadline: '',
    resolvedDate: ''
  });

  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System User',
    action: 'MAINTENANCE',
    entityType: 'Asset',
    details: `Filed maintenance ticket for asset ID ${assetId} (${priority})`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-maintenance-request');
  loadMaintenancePage();
  showToast('Maintenance ticket submitted successfully for approval!', 'success');
}

function approveMaintenanceTicket(ticketId: string): void {
  const t = state.maintenance.find((x) => x.id === ticketId);
  if (t) {
    t.status = 'approved';

    // TRANSITION RULE: Update target asset status to Under Maintenance
    const asset = state.assets.find((a) => a.id === t.assetId);
    if (asset) asset.status = 'maintenance';

    // Notify requester
    state.notifications.unshift({
      id: `n-${state.notifications.length + 1}`,
      type: 'Maintenance Approved',
      content: `Your maintenance request for asset ${asset ? asset.name : 'device'} has been approved. Status flipped to Under Maintenance.`,
      date: formatLogDate(new Date()).split(' ')[0] ?? '',
      isRead: false
    });

    saveState();
    loadMaintenancePage();
    showToast("Maintenance request approved. Asset status set to 'Under Maintenance'.", 'success');
  }
}

function openAssignTechModal(ticketId: string): void {
  const t = state.maintenance.find((x) => x.id === ticketId);
  if (!t) return;

  const asset = state.assets.find((a) => a.id === t.assetId);

  getEl<HTMLInputElement>('assign-maint-id').value = t.id;
  getEl('assign-tech-asset-details').innerHTML = `
    <strong>Target Asset:</strong> ${asset ? asset.name : 'Device'}<br>
    <strong>Priority:</strong> ${t.priority.toUpperCase()}<br>
    <strong>Description:</strong> ${t.issueDescription}
  `;

  openModal('modal-assign-tech');
}

function submitAssignTechnician(): void {
  const ticketId = getEl<HTMLInputElement>('assign-maint-id').value;
  const tech = getEl<HTMLSelectElement>('assign-tech-select').value;
  const deadline = getEl<HTMLInputElement>('assign-tech-deadline').value;

  const t = state.maintenance.find((x) => x.id === ticketId);
  if (t) {
    t.status = 'assigned';
    t.technicianName = tech;
    t.resolutionDeadline = deadline;

    saveState();
    closeModal('modal-assign-tech');
    loadMaintenancePage();
    showToast(`Technician ${tech} assigned to ticket successfully!`, 'success');
  }
}

function advanceMaintenanceStatus(ticketId: string, nextStatus: MaintenanceStatus): void {
  const t = state.maintenance.find((x) => x.id === ticketId);
  if (!t) return;

  t.status = nextStatus;

  if (nextStatus === 'resolved') {
    t.resolvedDate = formatLogDate(new Date()).split(' ')[0] ?? '';

    // TRANSITION RULE: Revert asset status back to available
    const asset = state.assets.find((a) => a.id === t.assetId);
    if (asset) asset.status = 'available';

    showToast("Maintenance resolved! Asset status reverted back to 'Available'.", 'success');
  } else {
    showToast(`Ticket status advanced to: ${nextStatus}`, 'primary');
  }

  saveState();
  loadMaintenancePage();
}

function showMaintDetailsSummary(ticketId: string): void {
  const t = state.maintenance.find((x) => x.id === ticketId);
  if (!t) return;
  const asset = state.assets.find((a) => a.id === t.assetId);

  alert(
    `Ticket Summary:\nAsset: ${asset ? asset.name : 'device'}\nPriority: ${t.priority}\nIssue: ${t.issueDescription}\nAssigned Tech: ${t.technicianName || 'None'}\nDeadline: ${t.resolutionDeadline || '—'}\nResolution State: ${t.status}`
  );
}

// ================= PAGE 8: AUDIT CONTROLLERS =================
function loadAuditPage(): void {
  renderAuditCycles();

  // Seed scope departments
  const scopeSelect = getElOrNull<HTMLSelectElement>('audit-scope-dept');
  if (scopeSelect) {
    scopeSelect.innerHTML = '';
    state.departments.forEach((dept) => {
      scopeSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }

  // Seed auditors select
  const auditorSelect = getElOrNull<HTMLSelectElement>('audit-auditor');
  if (auditorSelect) {
    auditorSelect.innerHTML = '';
    state.employees.forEach((emp) => {
      auditorSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${formatRoleName(emp.role)})</option>`;
    });
  }

  // Reload checklist pane if active cycle exists
  if (state.activeAuditCycleId) {
    loadAuditChecklist(state.activeAuditCycleId);
  }
}

function renderAuditCycles(): void {
  const tbody = getElOrNull('audit-cycles-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  state.audits.forEach((aud) => {
    const dept = state.departments.find((d) => d.id === aud.scopeDeptId);
    const auditor = state.employees.find((e) => e.id === aud.assignedAuditorId);

    const deptName = dept ? dept.name : 'All';
    const auditorName = auditor ? auditor.name : 'Sarah Connor';

    tbody.innerHTML += `
      <tr onclick="loadAuditChecklist('${aud.id}')" style="cursor:pointer;" class="${state.activeAuditCycleId === aud.id ? 'breadcrumb-active' : ''}">
        <td style="font-weight:600;">${aud.title}</td>
        <td>${deptName}</td>
        <td>${auditorName}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="flex-grow:1; height:6px; background-color:var(--border); border-radius:10px; overflow:hidden; min-width:60px;">
              <div style="height:100%; width:${aud.progressPercent}%; background-color:var(--success);"></div>
            </div>
            <span style="font-size:0.75rem; font-weight:600;">${aud.progressPercent}%</span>
          </div>
        </td>
        <td><span class="badge ${aud.status === 'closed' ? 'badge-retired' : 'badge-available'}">${aud.status}</span></td>
      </tr>
    `;
  });
}

function loadAuditChecklist(cycleId: string): void {
  state.activeAuditCycleId = cycleId;

  const aud = state.audits.find((a) => a.id === cycleId);
  if (!aud) return;

  const dept = state.departments.find((d) => d.id === aud.scopeDeptId);
  const auditor = state.employees.find((e) => e.id === aud.assignedAuditorId);

  getEl('audit-active-title').textContent = aud.title;
  getEl('audit-active-scope').textContent = dept ? dept.name : 'Finance';
  getEl('audit-active-auditor').textContent = auditor ? auditor.name : 'Sarah Connor';

  // Toggle placeholder view
  getEl('audit-checklist-placeholder').style.display = 'none';
  getEl('audit-checklist-active').style.display = 'block';

  // Populate checklist table of assets in the department scope
  const checklistBody = getEl('audit-verification-tbody');
  checklistBody.innerHTML = '';

  // Load assets whose current allocated department matches the audit scope
  const targetAssets = state.assets.filter((asset) => {
    const alloc = state.allocations.find((al) => al.assetId === asset.id && al.status !== 'returned');
    return alloc && alloc.departmentId === aud.scopeDeptId;
  });

  if (targetAssets.length === 0) {
    checklistBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No assets currently allocated to this department.</td></tr>`;
    return;
  }

  // Disable verify buttons if cycle is closed
  const isClosed = aud.status === 'closed';

  targetAssets.forEach((asset) => {
    // Check verify state from cycle data
    const isVerified = aud.verifiedAssetIds.includes(asset.id);
    const isMissing = aud.missingAssetIds.includes(asset.id);
    const isDamaged = aud.damagedAssetIds.includes(asset.id);

    let verifyHtml = '';
    if (isClosed) {
      const stateLabel = isVerified ? 'Verified' : isMissing ? 'Missing' : isDamaged ? 'Damaged' : 'Pending';
      const badgeClass = isVerified ? 'badge-available' : isMissing ? 'badge-lost' : isDamaged ? 'badge-maintenance' : 'badge-retired';
      verifyHtml = `<span class="badge ${badgeClass}">${stateLabel}</span>`;
    } else {
      verifyHtml = `
        <div style="display:flex; gap:0.25rem;">
          <button class="btn btn-sm ${isVerified ? 'btn-primary' : 'btn-secondary'}" onclick="markAuditAsset('${aud.id}', '${asset.id}', 'verified')">Verify</button>
          <button class="btn btn-sm ${isMissing ? 'btn-danger' : 'btn-secondary'}" onclick="markAuditAsset('${aud.id}', '${asset.id}', 'missing')">Missing</button>
          <button class="btn btn-sm ${isDamaged ? 'btn-secondary' : 'btn-secondary'}" onclick="markAuditAsset('${aud.id}', '${asset.id}', 'damaged')">Damage</button>
        </div>
      `;
    }

    checklistBody.innerHTML += `
      <tr>
        <td style="font-family:monospace; font-weight:600;">${asset.assetTag}</td>
        <td style="font-weight:600;">${asset.name}</td>
        <td>${asset.location}</td>
        <td style="text-transform:capitalize;">${asset.condition}</td>
        <td>${verifyHtml}</td>
      </tr>
    `;
  });

  // Calculate discrepancy values and update report card
  const missingCount = aud.missingAssetIds.length;
  const damagedCount = aud.damagedAssetIds.length;

  const text = `Currently: ${missingCount} Missing and ${damagedCount} Damaged assets flagged. Closing this cycle will auto-transition missing items to 'Lost'.`;
  getEl('audit-discrepancy-text').textContent = text;

  // Toggle Close lock btn visibility depending on role & status
  const lockBtn = getEl('btn-close-audit');
  if (isClosed) {
    lockBtn.style.display = 'none';
  } else {
    lockBtn.style.display = 'inline-flex';
  }
}

function markAuditAsset(cycleId: string, assetId: string, verifyState: 'verified' | 'missing' | 'damaged'): void {
  const aud = state.audits.find((a) => a.id === cycleId);
  if (!aud || aud.status === 'closed') return;

  // Clear existing logs in other arrays
  aud.verifiedAssetIds = aud.verifiedAssetIds.filter((id) => id !== assetId);
  aud.missingAssetIds = aud.missingAssetIds.filter((id) => id !== assetId);
  aud.damagedAssetIds = aud.damagedAssetIds.filter((id) => id !== assetId);

  if (verifyState === 'verified') {
    aud.verifiedAssetIds.push(assetId);
    showToast('Asset marked as verified', 'success');
  } else if (verifyState === 'missing') {
    aud.missingAssetIds.push(assetId);
    showToast('Discrepancy registered: Asset is Missing!', 'danger');
  } else if (verifyState === 'damaged') {
    aud.damagedAssetIds.push(assetId);
    showToast('Discrepancy registered: Asset is Damaged!', 'warning');
  }

  // Recalculate progress percent
  const targetAssets = state.assets.filter((asset) => {
    const alloc = state.allocations.find((al) => al.assetId === asset.id && al.status !== 'returned');
    return alloc && alloc.departmentId === aud.scopeDeptId;
  });
  const total = targetAssets.length;
  const completed = aud.verifiedAssetIds.length + aud.missingAssetIds.length + aud.damagedAssetIds.length;
  aud.progressPercent = total === 0 ? 100 : Math.round((completed / total) * 100);

  saveState();
  loadAuditChecklist(cycleId);
  renderAuditCycles();
}

function closeAuditCycleTrigger(): void {
  const aud = state.audits.find((a) => a.id === state.activeAuditCycleId);
  if (!aud || aud.status === 'closed') return;

  if (
    confirm(
      "Are you sure you want to close and lock this audit cycle? A discrepancy report will be generated and missing assets automatically updated to 'Lost' status."
    )
  ) {
    aud.status = 'closed';

    // TRANSITION RULE: Update missing assets to 'Lost'
    aud.missingAssetIds.forEach((assetId) => {
      const asset = state.assets.find((a) => a.id === assetId);
      if (asset) asset.status = 'lost';
    });

    // Generate summary report
    aud.discrepancyText = `Audit closed. Verified: ${aud.verifiedAssetIds.length}. Missing (Transitioned to Lost): ${aud.missingAssetIds.length}. Damaged: ${aud.damagedAssetIds.length}.`;

    // Log
    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: state.currentUser ? state.currentUser.name : 'System Auditor',
      action: 'AUDIT_CLOSE',
      entityType: 'Audit',
      details: `Closed audit cycle: ${aud.title}. Flags generated: ${aud.missingAssetIds.length} missing.`,
      timestamp: formatLogDate(new Date())
    });

    state.notifications.unshift({
      id: `n-${state.notifications.length + 1}`,
      type: 'Audit Flagged',
      content: `Discrepancy Report generated for ${aud.title}. ${aud.missingAssetIds.length} missing items flagged.`,
      date: formatLogDate(new Date()).split(' ')[0] ?? '',
      isRead: false
    });

    saveState();
    if (state.activeAuditCycleId) {
      loadAuditChecklist(state.activeAuditCycleId);
    }
    renderAuditCycles();
    showToast('Audit cycle locked and discrepancies processed!', 'success');
  }
}

function submitStartAudit(): void {
  const title = getEl<HTMLInputElement>('audit-title').value.trim();
  const deptId = getEl<HTMLSelectElement>('audit-scope-dept').value;
  const auditorId = getEl<HTMLSelectElement>('audit-auditor').value;
  const start = getEl<HTMLInputElement>('audit-start-date').value;
  const end = getEl<HTMLInputElement>('audit-end-date').value;

  state.audits.push({
    id: `au-${state.audits.length + 1}`,
    title,
    scopeDeptId: deptId,
    assignedAuditorId: auditorId,
    startDate: start,
    endDate: end,
    status: 'active',
    progressPercent: 0,
    verifiedAssetIds: [],
    missingAssetIds: [],
    damagedAssetIds: [],
    discrepancyText: 'Cycle configured. Checklist compiled.'
  });

  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System Admin',
    action: 'AUDIT_CREATE',
    entityType: 'Audit',
    details: `Scheduled new audit cycle: ${title}`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-start-audit');
  loadAuditPage();
  showToast('Audit cycle scheduled successfully! Click to inspect.', 'success');
}

// ================= PAGE 9: REPORTS & ANALYTICS =================
function loadReportsPage(): void {
  renderReportsCharts();
  renderHeatmap();

  // Render Idle assets warning table
  const table = getElOrNull('table-reports-idle-assets');
  if (table) {
    table.innerHTML = '';

    // Find assets with available status (sitting idle)
    const idles = state.assets.filter((a) => a.status === 'available');
    if (idles.length === 0) {
      table.innerHTML = `<tr><td style="color:var(--text-muted); text-align:center;">No idle assets. Perfect inventory turnover!</td></tr>`;
    } else {
      idles.slice(0, 3).forEach((asset) => {
        table.innerHTML += `
          <tr>
            <td style="font-weight:600; padding:0.5rem 0;">${asset.name}</td>
            <td style="font-family:monospace; padding:0.5rem 0;">${asset.assetTag}</td>
            <td style="color:var(--warning); font-weight:600; text-align:right; padding:0.5rem 0;">$${asset.cost.toLocaleString()} Idle</td>
          </tr>
        `;
      });
    }
  }
}

function renderReportsCharts(): void {
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  // 1. Department Allocation Pie/Doughnut Chart
  if (charts.reportsDeptAlloc) charts.reportsDeptAlloc.destroy();
  const ctx1 = getCanvasContext('chart-reports-dept-alloc');
  charts.reportsDeptAlloc = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Engineering', 'Marketing', 'HR', 'Finance', 'Operations'],
      datasets: [
        {
          label: 'Total Asset Valuation ($)',
          data: [13498, 8399, 1299, 4500, 12500],
          backgroundColor: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });

  // 2. Maintenance Frequency Category Bar
  if (charts.reportsMaintFreq) charts.reportsMaintFreq.destroy();
  const ctx2 = getCanvasContext('chart-reports-maint-freq');
  charts.reportsMaintFreq = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Computers', 'Vehicles', 'Servers', 'AV Systems'],
      datasets: [
        {
          data: [15, 8, 30, 22],
          backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: textColor, boxWidth: 10, font: { size: 10 } }
        }
      }
    }
  });

  // 3. Retirement Prediction Line Chart
  if (charts.reportsRetirement) charts.reportsRetirement.destroy();
  const ctx3 = getCanvasContext('chart-reports-retirement');
  charts.reportsRetirement = new Chart(ctx3, {
    type: 'line',
    data: {
      labels: ['Jul 26', 'Oct 26', 'Jan 27', 'Apr 27'],
      datasets: [
        {
          label: 'Predictive Retirements',
          data: [1, 2, 4, 3],
          borderColor: '#F59E0B',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}

function renderHeatmap(): void {
  const container = getElOrNull('analytics-heatmap');
  if (!container) return;

  container.innerHTML = '';

  const hoursLabels = ['09:00', '12:00', '15:00', '18:00'];
  const labelsHtml = hoursLabels.map((label) => `<span style="font-size:0.6rem; color:var(--text-muted);">${label}</span>`).join('');
  void labelsHtml;

  // 5 rows representing meeting rooms / vehicles / equipment
  const rows = ['Conf Room A', 'Conf Room B', 'Tesla Fleet', 'Transit Van', 'AR Headset'];

  rows.forEach((room) => {
    // Generate simulated occupancy blocks for 24 hours of the day
    let blocksHtml = '';
    for (let h = 0; h < 24; h++) {
      let level = 'level-0'; // idle
      // Add fake peak variables for mock visual depth
      if (h >= 9 && h <= 17) {
        const rand = Math.random();
        if (rand > 0.8) level = 'level-4';
        else if (rand > 0.5) level = 'level-3';
        else if (rand > 0.2) level = 'level-2';
        else level = 'level-1';
      }
      blocksHtml += `<div class="heatmap-cell ${level}" title="${room} @ hour ${h}"></div>`;
    }

    container.innerHTML += `
      <div class="heatmap-label">${room}</div>
      <div class="heatmap-row">
        ${blocksHtml}
      </div>
    `;
  });
}

function triggerExport(format: string): void {
  showToast(`Simulating compilation export of all ERP tables to ${format}...`, 'primary');
  setTimeout(() => {
    showToast(`Compiled report successfully downloaded: AssetFlow_Analytics_Report.${format.toLowerCase()}`, 'success');
  }, 1500);
}

// ================= PAGE 10: NOTIFICATIONS & AUDIT TRAIL =================
function switchNotificationTab(e: MouseEvent, tabId: string): void {
  const target = e.target as HTMLElement;
  target.parentNode?.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  target.classList.add('active');

  const paneParent = target.closest('.page-section');
  paneParent?.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.remove('active');
  });
  getEl(tabId).classList.add('active');

  if (tabId === 'tab-notif-inbox') {
    renderNotificationsPage();
  } else {
    renderAuditLogs();
  }
}

function renderNotificationsPage(): void {
  const container = getElOrNull('notifications-inbox-list');
  if (!container) return;

  const typeFilter = getEl<HTMLSelectElement>('notif-filter-type').value;
  container.innerHTML = '';

  const filtered = state.notifications.filter((n) => !typeFilter || n.type === typeFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>Inbox is Empty</h3><p>No system notifications recorded.</p></div>`;
    return;
  }

  filtered.forEach((n) => {
    let icon = 'bell';
    let iconColor = 'var(--primary)';

    if (n.type === 'Overdue Return' || n.type === 'Audit Flagged') {
      icon = 'alert-triangle';
      iconColor = 'var(--danger)';
    } else if (n.type === 'Booking Confirmed') {
      icon = 'calendar';
      iconColor = 'var(--success)';
    } else if (n.type === 'Transfer Approved' || n.type === 'Maintenance Approved') {
      icon = 'check-circle';
      iconColor = 'var(--success)';
    }

    container.innerHTML += `
      <div class="card" style="padding: 1rem; border-left: 4px solid ${iconColor}; opacity: ${n.isRead ? '0.7' : '1'}; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:0.75rem; align-items:center;">
          <i data-lucide="${icon}" style="color:${iconColor}; flex-shrink:0;"></i>
          <div>
            <h4 style="font-size:0.875rem; font-weight:700;">${n.type}</h4>
            <p style="font-size:0.8125rem; color:var(--text-muted); margin-top:0.125rem;">${n.content}</p>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
          <span style="font-size:0.7rem; color:var(--text-muted);">${n.date}</span>
          ${!n.isRead ? `<button class="btn btn-secondary btn-sm" onclick="markNotificationRead('${n.id}')">Read</button>` : ''}
        </div>
      </div>
    `;
  });
  lucide.createIcons();
}

function markNotificationRead(id: string): void {
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveState();
    renderNotificationsPage();
    updateGlobalUnreadIndicators();
  }
}

function markAllNotificationsAsRead(): void {
  state.notifications.forEach((n) => (n.isRead = true));
  saveState();
  renderNotificationsPage();
  updateGlobalUnreadIndicators();
  showToast('All notifications flagged as read.', 'success');
}

function updateGlobalUnreadIndicators(): void {
  const unreadCount = state.notifications.filter((n) => !n.isRead).length;

  const navDot = getElOrNull('nav-unread-dot');
  const sidebarIndicator = getElOrNull('sidebar-unread-indicator');

  if (unreadCount > 0) {
    if (navDot) navDot.style.display = 'block';
    if (sidebarIndicator) {
      sidebarIndicator.style.display = 'inline-flex';
      sidebarIndicator.textContent = String(unreadCount);
      sidebarIndicator.style.backgroundColor = 'var(--danger)';
      sidebarIndicator.style.color = 'white';
      sidebarIndicator.style.fontSize = '0.7rem';
      sidebarIndicator.style.padding = '2px 6px';
      sidebarIndicator.style.borderRadius = '10px';
      sidebarIndicator.style.fontWeight = 'bold';
    }
  } else {
    if (navDot) navDot.style.display = 'none';
    if (sidebarIndicator) sidebarIndicator.style.display = 'none';
  }
}

function renderAuditLogs(): void {
  const tbody = getElOrNull('audit-logs-table-body');
  if (!tbody) return;

  const search = getEl<HTMLInputElement>('audit-log-search').value.toLowerCase();
  tbody.innerHTML = '';

  const filtered = state.auditLogs.filter(
    (log) =>
      log.operator.toLowerCase().includes(search) ||
      log.details.toLowerCase().includes(search) ||
      log.entityType.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No audit logs match filters.</td></tr>`;
    return;
  }

  filtered.forEach((log) => {
    let actionBadge = 'badge-available';
    if (log.action === 'ASSIGN') actionBadge = 'badge-allocated';
    if (log.action === 'MAINTENANCE') actionBadge = 'badge-maintenance';
    if (log.action === 'AUDIT_CLOSE') actionBadge = 'badge-lost';

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">${log.operator}</td>
        <td><span class="badge ${actionBadge}">${log.action}</span></td>
        <td style="font-weight:500;">${log.entityType}</td>
        <td style="max-width:320px; font-size:0.8125rem;">${log.details}</td>
        <td style="font-family:monospace; font-size:0.8125rem; color:var(--text-muted);">${log.timestamp}</td>
      </tr>
    `;
  });
}

// ================= SYSTEM SETTINGS CONTROLLERS =================
function loadSettingsPage(): void {
  if (state.currentUser) {
    getEl<HTMLInputElement>('settings-fullname').value = state.currentUser.name;
    getEl<HTMLInputElement>('settings-email').value = state.currentUser.email;

    const dept = state.departments.find((d) => d.id === state.currentUser?.departmentId);
    getEl<HTMLInputElement>('settings-dept').value = dept ? dept.name : 'Corporate Management';
    getEl<HTMLInputElement>('settings-role').value = formatRoleName(state.currentUser.role);
  }
  getEl<HTMLInputElement>('settings-strict-booking').checked = state.strictBooking;
}

function saveUserSettings(): void {
  const name = getEl<HTMLInputElement>('settings-fullname').value.trim();
  const strict = getEl<HTMLInputElement>('settings-strict-booking').checked;

  if (state.currentUser) {
    state.currentUser.name = name;

    // Sync back name inside Employee directory database
    const emp = state.employees.find((e) => e.id === state.currentUser?.id);
    if (emp) emp.name = name;

    state.strictBooking = strict;

    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: name,
      action: 'UPDATE',
      entityType: 'User',
      details: 'Updated account settings details',
      timestamp: formatLogDate(new Date())
    });

    saveState();
    loadSettingsPage();

    // Update navbar indicators
    getEl('navbar-user-name').textContent = name;
    getEl('dropdown-user-name').textContent = name;
    getEl('user-avatar-initials').textContent = name
      .split(' ')
      .map((n) => n[0])
      .join('');

    showToast('User details successfully saved!', 'success');
  }
}

// ================= GLOBAL SEARCH MANAGER =================
function handleGlobalSearch(query: string): void {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return;

  // Let's filter the items based on which page is active to be most intuitive!
  const activeSection = document.querySelector('.page-section.active');
  if (!activeSection) return;
  const pageId = activeSection.id.replace('page-', '');

  if (pageId === 'assets') {
    getEl<HTMLInputElement>('asset-search').value = query;
    renderAssets();
  } else if (pageId === 'allocation') {
    getEl<HTMLInputElement>('alloc-search').value = query;
    renderAllocations();
  } else if (pageId === 'maintenance') {
    getEl<HTMLInputElement>('maint-search').value = query;
    renderMaintenance();
  } else if (pageId === 'org-setup') {
    const activeTab = document.querySelector('#page-org-setup .tab-btn.active')?.textContent ?? '';
    if (activeTab.includes('Department')) {
      getEl<HTMLInputElement>('dept-search').value = query;
      renderDepartments();
    } else if (activeTab.includes('Employee')) {
      getEl<HTMLInputElement>('emp-search').value = query;
      renderEmployees();
    }
  }
}

// ================= DETAIL DRAWER INTERACTIONS =================
let activeDrawerAssetId: string | null = null;

function openAssetDetailDrawer(assetId: string): void {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset) return;

  activeDrawerAssetId = assetId;

  const cat = state.categories.find((c) => c.id === asset.categoryId);
  const catName = cat ? cat.name : 'Device';

  // Badge mapping
  let badgeClass = 'badge-available';
  if (asset.status === 'allocated') badgeClass = 'badge-allocated';
  if (asset.status === 'reserved') badgeClass = 'badge-reserved';
  if (asset.status === 'maintenance') badgeClass = 'badge-maintenance';
  if (asset.status === 'lost') badgeClass = 'badge-lost';
  if (asset.status === 'retired') badgeClass = 'badge-retired';
  if (asset.status === 'disposed') badgeClass = 'badge-disposed';

  getEl('drawer-asset-status').textContent = asset.status;
  getEl('drawer-asset-status').className = `badge ${badgeClass}`;
  getEl('drawer-asset-name').textContent = asset.name;
  getEl('drawer-asset-tag').textContent = `Tag: ${asset.assetTag}`;
  getEl('drawer-asset-serial').textContent = asset.serial;
  getEl('drawer-asset-category').textContent = catName;
  getEl('drawer-asset-date').textContent = asset.acquireDate;
  getEl('drawer-asset-cost').textContent = `$${asset.cost.toLocaleString()}`;
  getEl('drawer-asset-condition').textContent = asset.condition;
  getEl('drawer-asset-location').textContent = asset.location;
  getEl('drawer-asset-warranty').textContent = asset.warrantyField || 'Indefinite';
  getEl('drawer-asset-bookable').textContent = asset.isBookable ? 'Yes (Bookable)' : 'No (Assigned Only)';

  // Build simulated QR Code SVG icon
  const qrContainer = getEl('drawer-qr-container');
  qrContainer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1"/>
      <rect width="5" height="5" x="16" y="3" rx="1"/>
      <rect width="5" height="5" x="3" y="16" rx="1"/>
      <path d="M21 16V21H16"/>
      <path d="M12 21v-4"/>
      <path d="M12 12v.01"/>
      <path d="M17 12h.01"/>
      <path d="M12 3v.01"/>
      <path d="M3 12h.01"/>
      <path d="M21 12v.01"/>
    </svg>
  `;

  // Draw logs/history in drawer panels
  const timelineAlloc = getEl('drawer-timeline-alloc');
  timelineAlloc.innerHTML = '';

  const allocs = state.allocations.filter((al) => al.assetId === asset.id);
  if (allocs.length === 0) {
    timelineAlloc.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">No allocation histories recorded.</span>`;
  } else {
    allocs.forEach((al) => {
      const emp = state.employees.find((e) => e.id === al.employeeId);
      const isReturned = al.status === 'returned';
      timelineAlloc.innerHTML += `
        <div class="timeline-item">
          <div class="timeline-marker ${isReturned ? 'success' : 'warning'}"></div>
          <div class="timeline-time">${al.allocatedDate} ${isReturned ? `to ${al.returnedDate}` : '(Active)'}</div>
          <div class="timeline-content-title">Assigned to ${emp ? emp.name : 'Staff'}</div>
          <div class="timeline-content-desc">${al.notes}</div>
        </div>
      `;
    });
  }

  const timelineMaint = getEl('drawer-timeline-maint');
  timelineMaint.innerHTML = '';

  const maints = state.maintenance.filter((m) => m.assetId === asset.id);
  if (maints.length === 0) {
    timelineMaint.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">No maintenance tickets filed.</span>`;
  } else {
    maints.forEach((m) => {
      const isResolved = m.status === 'resolved';
      timelineMaint.innerHTML += `
        <div class="timeline-item">
          <div class="timeline-marker ${isResolved ? 'success' : 'danger'}"></div>
          <div class="timeline-time">${m.raisedDate} ${isResolved ? `Resolved on ${m.resolvedDate}` : '(Ongoing)'}</div>
          <div class="timeline-content-title">${m.issueDescription}</div>
          <div class="timeline-content-desc">Priority: ${m.priority.toUpperCase()} | ${m.technicianName ? `Tech: ${m.technicianName}` : 'Unassigned'}</div>
        </div>
      `;
    });
  }

  // Handle drawer action buttons based on status
  const allocBtn = getEl('drawer-allocation-action-btn');
  if (asset.status !== 'available') {
    allocBtn.style.display = 'none';
  } else {
    allocBtn.style.display = 'inline-flex';
  }

  openDrawer('drawer-asset-details');
}

function switchDrawerTab(e: MouseEvent, tabId: string): void {
  const target = e.target as HTMLElement;
  target.parentNode?.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  target.classList.add('active');

  const paneParent = (target.parentNode as HTMLElement | null)?.parentNode as HTMLElement | undefined;
  paneParent?.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.remove('active');
  });
  getEl(tabId).classList.add('active');
}

function triggerMaintRequestFromDrawer(): void {
  if (!activeDrawerAssetId) return;
  closeDrawer('drawer-asset-details');
  openMaintenanceModal();
  getEl<HTMLSelectElement>('maint-asset-select').value = activeDrawerAssetId;
}

function triggerAllocationFromDrawer(): void {
  if (!activeDrawerAssetId) return;
  closeDrawer('drawer-asset-details');
  openAllocateAssetModal();
  getEl<HTMLSelectElement>('alloc-asset-select').value = activeDrawerAssetId;
}

// ================= QR SIMULATOR LOGIC =================
function executeQrScanSearch(): void {
  const assetId = getEl<HTMLSelectElement>('qr-simulate-select').value;
  closeModal('modal-qr-scan');

  // Directly open drawer details
  openAssetDetailDrawer(assetId);
  showToast('QR scan matching catalog tag detected!', 'success');
}

// ================= MODAL & DRAWER HELPER HANDLERS =================
function openModal(modalId: string): void {
  getEl(modalId).classList.add('show');
}

function closeModal(modalId: string): void {
  getEl(modalId).classList.remove('show');
}

function openDrawer(drawerId: string): void {
  getEl(drawerId).classList.add('show');
}

function closeDrawer(drawerId: string): void {
  getEl(drawerId).classList.remove('show');
}

function closeDrawerIfOverlay(e: MouseEvent, drawerId: string): void {
  if ((e.target as HTMLElement).id === drawerId) {
    closeDrawer(drawerId);
  }
}

// Quick action launchers
function openQuickActionModal(): void {
  openModal('modal-quick-action');
}
function openRegisterAssetModal(): void {
  openModal('modal-register-asset');
}
function openAllocateAssetModal(): void {
  openModal('modal-allocate-asset');
  loadAllocationsPage(); // reload selectors
}
function openBookResourceModal(): void {
  openModal('modal-book-resource');
}
function openMaintenanceModal(): void {
  openModal('modal-maintenance-request');
}
function openQrScanModal(): void {
  openModal('modal-qr-scan');
}
function openStartAuditModal(): void {
  openModal('modal-start-audit');
}
function openAddDeptModal(): void {
  openModal('modal-add-dept');
}
function openAddCategoryModal(): void {
  openModal('modal-add-category');
}

// ================= UTILITIES & HELPERS =================
function formatRoleName(role: Role): string {
  if (window.AssetFlow && window.AssetFlow.isRole(role)) {
    return window.AssetFlow.formatRoleName(role);
  }

  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Asset Manager';
  if (role === 'head') return 'Dept Head';
  if (role === 'employee') return 'Employee';
  return role;
}

function formatLogDate(date: Date): string {
  if (window.AssetFlow) {
    return window.AssetFlow.formatLogDate(date);
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

function toggleSidebarCollapse(): void {
  const sidebar = getEl('app-sidebar');
  const workspace = getEl('main-workspace');

  if (sidebar.style.left === '0px' || sidebar.style.left === '') {
    sidebar.style.left = '-260px';
    workspace.style.marginLeft = '0px';
  } else {
    sidebar.style.left = '0px';
    workspace.style.marginLeft = '260px';
  }
}

// Handle responsive sidebar states automatically on load
window.addEventListener('resize', () => {
  const sidebar = getEl('app-sidebar');
  const workspace = getEl('main-workspace');
  if (window.innerWidth > 900) {
    sidebar.style.left = '0px';
    workspace.style.marginLeft = '260px';
  } else {
    sidebar.style.left = '-260px';
    workspace.style.marginLeft = '0px';
  }
});

// ================= APPLICATION INITIALIZER =================
window.addEventListener('DOMContentLoaded', () => {
  // Load local storage states
  loadState();

  // Initialize Lucide icons
  lucide.createIcons();

  // If session active skip auth screen (in practice)
  // For safety, force auth screen to verify login layout works
  getEl('auth-screen').style.display = 'flex';
  getEl('app-shell').style.display = 'none';

  // Seed default dates on form inputs
  const today = new Date().toISOString().split('T')[0] ?? '';
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';

  const regDate = getElOrNull<HTMLInputElement>('reg-date');
  if (regDate) regDate.value = today;
  const bookDate = getElOrNull<HTMLInputElement>('book-date');
  if (bookDate) bookDate.value = today;
  const auditStartDate = getElOrNull<HTMLInputElement>('audit-start-date');
  if (auditStartDate) auditStartDate.value = today;
  const auditEndDate = getElOrNull<HTMLInputElement>('audit-end-date');
  if (auditEndDate) auditEndDate.value = nextWeek;
  const assignTechDeadline = getElOrNull<HTMLInputElement>('assign-tech-deadline');
  if (assignTechDeadline) assignTechDeadline.value = nextWeek;

  // Bind the Forget Password reset-view password visibility toggles
  bindPasswordToggle('fp-new-password-toggle', 'fp-new-password');
  bindPasswordToggle('fp-confirm-password-toggle', 'fp-confirm-password');
});

// ================= GLOBAL EXPOSURE (for inline HTML event handlers) =================
declare global {
  interface Window {
    navigate: typeof navigate;
    showToast: typeof showToast;
    toggleTheme: typeof toggleTheme;
    toggleAuthPanel: typeof toggleAuthPanel;
    handleLogin: typeof handleLogin;
    handleSignup: typeof handleSignup;
    submitForgetPasswordEmail: typeof submitForgetPasswordEmail;
    submitVerifyOtp: typeof submitVerifyOtp;
    submitResetPassword: typeof submitResetPassword;
    handleLogout: typeof handleLogout;
    changeActiveRole: typeof changeActiveRole;
    toggleOrgDropdown: typeof toggleOrgDropdown;
    toggleProfileDropdown: typeof toggleProfileDropdown;
    switchSetupTab: typeof switchSetupTab;
    toggleDeptStatus: typeof toggleDeptStatus;
    handleEmpPageChange: typeof handleEmpPageChange;
    promoteEmployee: typeof promoteEmployee;
    toggleEmployeeStatus: typeof toggleEmployeeStatus;
    submitAddDept: typeof submitAddDept;
    submitAddCategory: typeof submitAddCategory;
    switchAssetView: typeof switchAssetView;
    submitRegisterAsset: typeof submitRegisterAsset;
    updateAllocEmployeeDropdown: typeof updateAllocEmployeeDropdown;
    submitAllocateAsset: typeof submitAllocateAsset;
    executeTransferRequest: typeof executeTransferRequest;
    processTransferApproval: typeof processTransferApproval;
    openReturnModal: typeof openReturnModal;
    submitReturnAsset: typeof submitReturnAsset;
    switchBookingLayout: typeof switchBookingLayout;
    adjustCalendarMonth: typeof adjustCalendarMonth;
    selectBookingResourceTab: typeof selectBookingResourceTab;
    submitBookResource: typeof submitBookResource;
    cancelBooking: typeof cancelBooking;
    openBookingInspector: typeof openBookingInspector;
    switchMaintView: typeof switchMaintView;
    submitMaintenanceRequest: typeof submitMaintenanceRequest;
    approveMaintenanceTicket: typeof approveMaintenanceTicket;
    openAssignTechModal: typeof openAssignTechModal;
    submitAssignTechnician: typeof submitAssignTechnician;
    advanceMaintenanceStatus: typeof advanceMaintenanceStatus;
    showMaintDetailsSummary: typeof showMaintDetailsSummary;
    closeAuditCycleTrigger: typeof closeAuditCycleTrigger;
    submitStartAudit: typeof submitStartAudit;
    loadAuditChecklist: typeof loadAuditChecklist;
    markAuditAsset: typeof markAuditAsset;
    triggerExport: typeof triggerExport;
    switchNotificationTab: typeof switchNotificationTab;
    markNotificationRead: typeof markNotificationRead;
    markAllNotificationsAsRead: typeof markAllNotificationsAsRead;
    switchDrawerTab: typeof switchDrawerTab;
    triggerMaintRequestFromDrawer: typeof triggerMaintRequestFromDrawer;
    triggerAllocationFromDrawer: typeof triggerAllocationFromDrawer;
    executeQrScanSearch: typeof executeQrScanSearch;
    openAssetDetailDrawer: typeof openAssetDetailDrawer;
    openModal: typeof openModal;
    closeModal: typeof closeModal;
    openDrawer: typeof openDrawer;
    closeDrawer: typeof closeDrawer;
    closeDrawerIfOverlay: typeof closeDrawerIfOverlay;
    openQuickActionModal: typeof openQuickActionModal;
    openRegisterAssetModal: typeof openRegisterAssetModal;
    openAllocateAssetModal: typeof openAllocateAssetModal;
    openBookResourceModal: typeof openBookResourceModal;
    openMaintenanceModal: typeof openMaintenanceModal;
    openQrScanModal: typeof openQrScanModal;
    openStartAuditModal: typeof openStartAuditModal;
    openAddDeptModal: typeof openAddDeptModal;
    openAddCategoryModal: typeof openAddCategoryModal;
    handleGlobalSearch: typeof handleGlobalSearch;
    toggleSidebarCollapse: typeof toggleSidebarCollapse;
    saveUserSettings: typeof saveUserSettings;
    resetAppDatabase: typeof resetAppDatabase;
  }
}

Object.assign(window, {
  navigate,
  showToast,
  toggleTheme,
  toggleAuthPanel,
  handleLogin,
  handleSignup,
  submitForgetPasswordEmail,
  submitVerifyOtp,
  submitResetPassword,
  handleLogout,
  changeActiveRole,
  toggleOrgDropdown,
  toggleProfileDropdown,
  switchSetupTab,
  toggleDeptStatus,
  handleEmpPageChange,
  promoteEmployee,
  toggleEmployeeStatus,
  submitAddDept,
  submitAddCategory,
  switchAssetView,
  submitRegisterAsset,
  updateAllocEmployeeDropdown,
  submitAllocateAsset,
  executeTransferRequest,
  processTransferApproval,
  openReturnModal,
  submitReturnAsset,
  switchBookingLayout,
  adjustCalendarMonth,
  selectBookingResourceTab,
  submitBookResource,
  cancelBooking,
  openBookingInspector,
  switchMaintView,
  submitMaintenanceRequest,
  approveMaintenanceTicket,
  openAssignTechModal,
  submitAssignTechnician,
  advanceMaintenanceStatus,
  showMaintDetailsSummary,
  closeAuditCycleTrigger,
  submitStartAudit,
  loadAuditChecklist,
  markAuditAsset,
  triggerExport,
  switchNotificationTab,
  markNotificationRead,
  markAllNotificationsAsRead,
  switchDrawerTab,
  triggerMaintRequestFromDrawer,
  triggerAllocationFromDrawer,
  executeQrScanSearch,
  openAssetDetailDrawer,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer,
  closeDrawerIfOverlay,
  openQuickActionModal,
  openRegisterAssetModal,
  openAllocateAssetModal,
  openBookResourceModal,
  openMaintenanceModal,
  openQrScanModal,
  openStartAuditModal,
  openAddDeptModal,
  openAddCategoryModal,
  handleGlobalSearch,
  toggleSidebarCollapse,
  saveUserSettings,
  resetAppDatabase
});
