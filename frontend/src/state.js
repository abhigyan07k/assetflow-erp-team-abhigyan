import { showToast } from './utils.js';

// ================= GLOBAL APPLICATION STATE =================
export let state = {
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
export let charts = {};

// ================= INITIAL DATABASE SEEDING =================
export function seedInitialDatabase() {
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
export function loadState() {
  const stored = localStorage.getItem('assetflow_erp_db');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      Object.assign(state, parsed);
    } catch (e) {
      console.error("Failed to parse database state. Re-seeding.", e);
      seedInitialDatabase();
    }
  } else {
    seedInitialDatabase();
  }
}

export function saveState() {
  localStorage.setItem('assetflow_erp_db', JSON.stringify(state));
}

export function resetAppDatabase() {
  localStorage.removeItem('assetflow_erp_db');
  seedInitialDatabase();
  showToast("Application database successfully reset to defaults!", "success");
  setTimeout(() => window.location.reload(), 1000);
}
