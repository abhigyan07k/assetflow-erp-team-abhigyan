// AssetFlow ERP - Core State Engine & Application Logic

// ================= GLOBAL APPLICATION STATE =================
let state = {
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
let charts = {};

// ================= INITIAL DATABASE SEEDING =================
function seedInitialDatabase() {
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
function loadState() {
  if (window.AssetFlow) {
    state = structuredClone(window.AssetFlow.loadState());
    return;
  }

  const stored = localStorage.getItem('assetflow_erp_db');
  if (stored) {
    try {
      state = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse database state. Re-seeding.", e);
      seedInitialDatabase();
    }
  } else {
    seedInitialDatabase();
  }
}

function saveState() {
  if (window.AssetFlow) {
    window.AssetFlow.store.setState(state);
    window.AssetFlow.saveState();
    return;
  }

  localStorage.setItem('assetflow_erp_db', JSON.stringify(state));
}

function resetAppDatabase() {
  if (window.AssetFlow) {
    state = structuredClone(window.AssetFlow.resetAppDatabase());
    showToast("Application database successfully reset to defaults!", "success");
    setTimeout(() => window.location.reload(), 1000);
    return;
  }

  localStorage.removeItem('assetflow_erp_db');
  seedInitialDatabase();
  showToast("Application database successfully reset to defaults!", "success");
  setTimeout(() => window.location.reload(), 1000);
}

// ================= ROUTING & SHELL NAVIGATION =================
function navigate(pageId) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(`page-${pageId}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update sidebar active link state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Find which button contains page click
  const navBtns = document.querySelectorAll('.sidebar-nav .nav-item');
  navBtns.forEach(btn => {
    const clickHandler = btn.getAttribute('onclick');
    if (clickHandler && clickHandler.includes(pageId)) {
      btn.classList.add('active');
    }
  });

  // Update Breadcrumbs
  const pageTitle = pageId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  document.getElementById('breadcrumb-page').textContent = pageTitle;

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
function showToast(message, type = 'primary') {
  const container = document.getElementById('toast-hub');
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
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');
  
  // Toggle Navbar Icons
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');
  
  if (isDark) {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
    showToast("Switched to dark theme", "primary");
  } else {
    lightIcon.style.display = 'block';
    darkIcon.style.display = 'none';
    showToast("Switched to light theme", "primary");
  }
  
  // Re-render graphs to match dark colors
  if (document.getElementById('page-dashboard').classList.contains('active')) {
    loadDashboardPage();
  } else if (document.getElementById('page-reports').classList.contains('active')) {
    loadReportsPage();
  }
}

// ================= AUTHENTICATION SYSTEMS =================
function toggleAuthPanel(mode) {
  const loginPanel = document.getElementById('login-form-panel');
  const signupPanel = document.getElementById('signup-form-panel');
  
  if (mode === 'signup') {
    loginPanel.style.display = 'none';
    signupPanel.style.display = 'block';
  } else {
    loginPanel.style.display = 'block';
    signupPanel.style.display = 'none';
  }
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;

  // Simple hardcoded login validator or employee selector
  const foundUser = state.employees.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!foundUser) {
    showToast("Account email details not registered.", "danger");
    return;
  }

  // Simulate loading state on the button
  const submitBtn = document.getElementById('btn-login-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  setTimeout(() => {
    state.currentUser = foundUser;
    state.activeRole = foundUser.role; // Auto sync simulation role
    saveState();

    // Hide auth screen, reveal app workspace
    document.body.classList.remove('auth-mode');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';

    // Populate navbar elements
    document.getElementById('navbar-user-name').textContent = foundUser.name;
    document.getElementById('dropdown-user-name').textContent = foundUser.name;
    document.getElementById('dropdown-user-email').textContent = foundUser.email;
    document.getElementById('navbar-user-role').textContent = formatRoleName(foundUser.role);
    document.getElementById('user-avatar-initials').textContent = foundUser.name.split(' ').map(n=>n[0]).join('');
    
    // Set Sidebar switcher role options
    document.getElementById('role-switcher-select').value = foundUser.role;
    changeActiveRole(foundUser.role, false); // Initialize visual restrictions

    showToast(`Welcome back, ${foundUser.name}!`, "success");
    navigate('dashboard');

    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Sign In</span>`;
  }, 1200);
}

function handleSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-password').value;

  // Email conflict checker
  const exists = state.employees.some(e => e.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    showToast("This corporate email is already registered.", "warning");
    return;
  }

  const submitBtn = document.getElementById('btn-signup-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="skeleton skeleton-text" style="width:50px; margin:0 auto;"></span>`;

  setTimeout(() => {
    const newEmp = {
      id: `e-${state.employees.length + 1}`,
      name: name,
      email: email,
      departmentId: 'd-1', // Default assigned to Eng
      role: 'employee', // Normal employee at sign up
      status: 'active'
    };

    state.employees.push(newEmp);
    
    // Log activity
    state.auditLogs.unshift({
      id: `l-${state.auditLogs.length + 1}`,
      operator: name,
      action: 'CREATE',
      entityType: 'User',
      details: `Self-registered new employee account (${email})`,
      timestamp: formatLogDate(new Date())
    });

    saveState();
    showToast("Registration completed! Please sign in.", "success");
    
    // Switch forms
    toggleAuthPanel('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = '';

    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Create Account</span>`;
  }, 1000);
}

function handleForgotPassword() {
  showToast("A password recovery link has been simulated to your inbox.", "success");
}

function handleLogout() {
  state.currentUser = null;
  saveState();
  
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.body.classList.add('auth-mode');
  showToast("Logged out successfully", "primary");
}

// ================= ROLE SWITCHER & PERMISSION ENFORCEMENT =================
function changeActiveRole(role, notify = true) {
  state.activeRole = role;
  
  // Visual marker in footer
  const badge = document.getElementById('current-role-badge');
  badge.textContent = formatRoleName(role);
  badge.className = `badge ${role === 'admin' ? 'badge-available' : role === 'manager' ? 'badge-allocated' : role === 'head' ? 'badge-reserved' : 'badge-retired'}`;
  
  // Disable or hide Org Setup in Sidebar if not Admin
  const orgSetupBtn = document.getElementById('nav-org-setup');
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
    showToast(`Switched view mode to: ${formatRoleName(role)}`, "primary");
  }
}

// ================= BREADCRUMBS & ORG SELECTORS =================
function toggleOrgDropdown() {
  const currentOrg = document.getElementById('current-org-name').textContent;
  const targetOrg = currentOrg === 'Global HQ' ? 'NYC Branch' : 'Global HQ';
  document.getElementById('current-org-name').textContent = targetOrg;
  document.getElementById('breadcrumb-company').textContent = targetOrg;
  showToast(`Switched segment context to ${targetOrg}`, "success");
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('show');
}

// Close profiles dropdown when clicked elsewhere
document.addEventListener('click', () => {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});


// ================= PAGE 2: DASHBOARD CONTROLLERS =================
function loadDashboardPage() {
  // Welcome Text
  if (state.currentUser) {
    document.getElementById('dashboard-welcome').textContent = `Welcome, ${state.currentUser.name}`;
  }

  // Calculations for KPIs
  const availableCount = state.assets.filter(a => a.status === 'available').length;
  const allocatedCount = state.assets.filter(a => a.status === 'allocated').length;
  const maintenanceCount = state.maintenance.filter(m => m.status !== 'resolved').length;
  const activeBookings = state.bookings.filter(b => b.status === 'ongoing' || b.status === 'upcoming').length;
  const pendingTransfers = state.transfers.filter(t => t.status === 'pending').length;
  const overdueReturns = state.allocations.filter(al => al.status === 'overdue').length;

  document.getElementById('kpi-available').textContent = availableCount;
  document.getElementById('kpi-allocated').textContent = allocatedCount;
  document.getElementById('kpi-maintenance').textContent = maintenanceCount;
  document.getElementById('kpi-bookings').textContent = activeBookings;
  document.getElementById('kpi-transfers').textContent = pendingTransfers;
  document.getElementById('kpi-returns').textContent = overdueReturns;

  // Render Charts
  renderDashboardCharts();

  // Render Activities Widget
  const listContainer = document.getElementById('widget-activity-list');
  listContainer.innerHTML = '';
  
  // Show last 4 audit logs
  state.auditLogs.slice(0, 4).forEach(log => {
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
  const overdueTable = document.getElementById('widget-overdue-table');
  overdueTable.innerHTML = '';
  
  const overdueAllocs = state.allocations.filter(al => al.status === 'overdue');
  if (overdueAllocs.length === 0) {
    overdueTable.innerHTML = `<tr><td style="color:var(--text-muted); text-align:center;">No overdue assets!</td></tr>`;
  } else {
    overdueAllocs.forEach(al => {
      const asset = state.assets.find(a => a.id === al.assetId);
      const employee = state.employees.find(e => e.id === al.employeeId);
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
  const bulletins = document.getElementById('widget-bulletins');
  bulletins.innerHTML = '';
  
  const unreadNotifs = state.notifications.filter(n => !n.isRead);
  if (unreadNotifs.length === 0) {
    bulletins.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:1rem 0;">
        No unread bulletins. All quiet.
      </div>
    `;
  } else {
    unreadNotifs.slice(0, 2).forEach(n => {
      bulletins.innerHTML += `
        <div style="background-color: var(--primary-light); border-left:3px solid var(--primary); padding: 0.5rem 0.75rem; border-radius: 4px; font-size:0.75rem;">
          <strong>${n.type}:</strong> ${n.content}
        </div>
      `;
    });
  }

  updateGlobalUnreadIndicators();
}

function renderDashboardCharts() {
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  // 1. Asset Utilization Line Chart
  if (charts.utilization) charts.utilization.destroy();
  
  const ctx1 = document.getElementById('chart-utilization').getContext('2d');
  charts.utilization = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Utilization Rate (%)',
        data: [78, 81, 85, 84, 89, 92, 94],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        tension: 0.3,
        fill: true
      }]
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
  const ctx2 = document.getElementById('chart-maintenance').getContext('2d');
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
function loadOrgSetupPage() {
  renderDepartments();
  renderCategories();
  renderEmployees();

  // Seed department head select lists in forms
  const headSelect = document.getElementById('dept-add-head');
  if (headSelect) {
    headSelect.innerHTML = '';
    state.employees.forEach(emp => {
      headSelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
  }

  // Seed parent department in forms
  const parentSelect = document.getElementById('dept-add-parent');
  if (parentSelect) {
    parentSelect.innerHTML = '<option value="">None (Top-level division)</option>';
    state.departments.forEach(dept => {
      parentSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }

  // Seed department selector filter in Employee list
  const filterDept = document.getElementById('emp-filter-dept');
  if (filterDept) {
    filterDept.innerHTML = '<option value="">All Departments</option>';
    state.departments.forEach(dept => {
      filterDept.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }
}

function switchSetupTab(e, tabId) {
  // Toggle tab buttons visual
  e.target.parentNode.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  // Toggle visible pane
  const parentSection = e.target.closest('.page-section');
  parentSection.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

function renderDepartments() {
  const tbody = document.getElementById('dept-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('dept-search').value.toLowerCase();
  tbody.innerHTML = '';

  const filteredDepts = state.departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery) ||
    d.code.toLowerCase().includes(searchQuery) ||
    d.head.toLowerCase().includes(searchQuery)
  );

  filteredDepts.forEach(dept => {
    const parentDept = state.departments.find(d => d.id === dept.parent);
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

function toggleDeptStatus(deptId) {
  const dept = state.departments.find(d => d.id === deptId);
  if (dept) {
    dept.status = dept.status === 'active' ? 'inactive' : 'active';
    saveState();
    renderDepartments();
    showToast(`Status of ${dept.name} toggled.`, "success");
  }
}

function renderCategories() {
  const grid = document.getElementById('category-cards-grid');
  if (!grid) return;

  grid.innerHTML = '';

  state.categories.forEach(cat => {
    let count = state.assets.filter(a => a.categoryId === cat.id).length;
    
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

function renderEmployees() {
  const tbody = document.getElementById('employee-table-body');
  if (!tbody) return;

  const search = document.getElementById('emp-search').value.toLowerCase();
  const deptFilter = document.getElementById('emp-filter-dept').value;
  const roleFilter = document.getElementById('emp-filter-role').value;

  tbody.innerHTML = '';

  let filtered = state.employees.filter(emp => {
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
  document.getElementById('btn-emp-prev').disabled = empCurrentPage <= 1;
  document.getElementById('btn-emp-next').disabled = empCurrentPage >= pages;
  document.getElementById('emp-pagination-info').textContent = total === 0 ? 'No employees found' : `Showing ${start + 1}-${end} of ${total} employees`;

  const paginated = filtered.slice(start, end);

  paginated.forEach(emp => {
    const dept = state.departments.find(d => d.id === emp.departmentId);
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

function handleEmpPageChange(dir) {
  empCurrentPage += dir;
  renderEmployees();
}

function promoteEmployee(empId, newRole) {
  if (state.activeRole !== 'admin') {
    showToast("Role adjustment requires Administrator privileges.", "danger");
    return;
  }

  const emp = state.employees.find(e => e.id === empId);
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
      date: formatLogDate(new Date()).split(' ')[0],
      isRead: false
    });

    saveState();
    renderEmployees();
    showToast(`Role of ${emp.name} promoted to ${formatRoleName(newRole)}`, "success");
  }
}

function toggleEmployeeStatus(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (emp) {
    emp.status = emp.status === 'active' ? 'inactive' : 'active';
    saveState();
    renderEmployees();
    showToast(`Status of ${emp.name} set to ${emp.status}.`, "success");
  }
}

function submitAddDept() {
  const name = document.getElementById('dept-add-name').value.trim();
  const code = document.getElementById('dept-add-code').value.trim().toUpperCase();
  const parent = document.getElementById('dept-add-parent').value;
  const head = document.getElementById('dept-add-head').value;

  const newDept = {
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
  showToast(`Department ${name} successfully configured!`, "success");
}

function submitAddCategory() {
  const name = document.getElementById('cat-add-name').value.trim();
  const icon = document.getElementById('cat-add-icon').value;
  const warranty = parseInt(document.getElementById('cat-add-warranty').value);
  const custom = document.getElementById('cat-add-custom').value.trim();

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
  showToast(`Asset category ${name} created!`, "success");
}


// ================= PAGE 4: ASSET DIRECTORY CONTROLLERS =================
function switchAssetView(view) {
  state.assetView = view;
  
  const gridContainer = document.getElementById('asset-grid-container');
  const tableContainer = document.getElementById('asset-table-container');
  
  const gridBtn = document.getElementById('btn-asset-view-grid');
  const tableBtn = document.getElementById('btn-asset-view-table');

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

function loadAssetsPage() {
  // Populate Category filter dropdown
  const filterCat = document.getElementById('asset-filter-cat');
  if (filterCat) {
    filterCat.innerHTML = '<option value="">Categories</option>';
    state.categories.forEach(cat => {
      filterCat.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
  }

  // Populate registration category list
  const regCat = document.getElementById('reg-cat');
  if (regCat) {
    regCat.innerHTML = '';
    state.categories.forEach(cat => {
      regCat.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
  }

  // Populate QR simulation selector list
  const qrSim = document.getElementById('qr-simulate-select');
  if (qrSim) {
    qrSim.innerHTML = '';
    state.assets.forEach(asset => {
      qrSim.innerHTML += `<option value="${asset.id}">${asset.name} (${asset.assetTag})</option>`;
    });
  }

  renderAssets();
}

function renderAssets() {
  const gridContainer = document.getElementById('asset-grid-container');
  const tableBody = document.getElementById('asset-table-body');
  if (!gridContainer || !tableBody) return;

  const search = document.getElementById('asset-search').value.toLowerCase();
  const catFilter = document.getElementById('asset-filter-cat').value;
  const statusFilter = document.getElementById('asset-filter-status').value;
  const conditionFilter = document.getElementById('asset-filter-condition').value;

  // Filter logic
  const filtered = state.assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search) || 
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

  filtered.forEach(asset => {
    const cat = state.categories.find(c => c.id === asset.categoryId);
    const catName = cat ? cat.name : 'Standard Item';
    
    // Find current holder from allocations
    const activeAlloc = state.allocations.find(al => al.assetId === asset.id && al.status !== 'returned');
    let holderName = '—';
    if (activeAlloc) {
      const emp = state.employees.find(e => e.id === activeAlloc.employeeId);
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

function submitRegisterAsset() {
  const name = document.getElementById('reg-name').value.trim();
  const categoryId = document.getElementById('reg-cat').value;
  const serial = document.getElementById('reg-serial').value.trim();
  const cost = parseInt(document.getElementById('reg-cost').value);
  const acquireDate = document.getElementById('reg-date').value;
  const condition = document.getElementById('reg-condition').value;
  const location = document.getElementById('reg-location').value.trim();
  const isBookable = document.getElementById('reg-is-bookable').checked;
  const warranty = document.getElementById('reg-warranty').value.trim();

  // Auto-generate Asset Tag
  const lastAsset = state.assets[state.assets.length - 1];
  let lastNum = 15;
  if (lastAsset) {
    lastNum = parseInt(lastAsset.assetTag.replace('AF-', ''));
  }
  const tagNum = String(lastNum + 1).padStart(4, '0');
  const assetTag = `AF-${tagNum}`;

  const newAsset = {
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
  showToast(`Asset successfully cataloged as ${assetTag}!`, "success");
}


// ================= PAGE 5: ASSET ALLOCATION CONTROLLERS =================
function loadAllocationsPage() {
  // Seed allocating asset options
  const select = document.getElementById('alloc-asset-select');
  if (select) {
    select.innerHTML = '<option value="">Choose available asset...</option>';
    state.assets.filter(a => a.status === 'available').forEach(asset => {
      select.innerHTML += `<option value="${asset.id}">${asset.name} (${asset.assetTag})</option>`;
    });
  }

  // Seed allocating dept options
  const deptSelect = document.getElementById('alloc-dept-select');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">Choose division...</option>';
    state.departments.filter(d => d.status === 'active').forEach(dept => {
      deptSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }

  // Clear employee select until dept chosen
  const empSelect = document.getElementById('alloc-emp-select');
  if (empSelect) empSelect.innerHTML = '<option value="">Select Department first...</option>';

  renderAllocations();
  renderTransferRequests();
}

function updateAllocEmployeeDropdown(deptId) {
  const empSelect = document.getElementById('alloc-emp-select');
  if (!empSelect) return;

  empSelect.innerHTML = '<option value="">Select target employee...</option>';
  
  if (!deptId) return;

  state.employees.filter(e => e.departmentId === deptId && e.status === 'active').forEach(emp => {
    empSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
  });
}

function renderAllocations() {
  const tbody = document.getElementById('alloc-table-body');
  if (!tbody) return;

  const search = document.getElementById('alloc-search').value.toLowerCase();
  const showOverdue = document.getElementById('alloc-filter-overdue').checked;

  tbody.innerHTML = '';

  let filtered = state.allocations.filter(al => al.status !== 'returned');

  if (showOverdue) {
    filtered = filtered.filter(al => al.status === 'overdue');
  }

  filtered = filtered.filter(al => {
    const asset = state.assets.find(a => a.id === al.assetId);
    const emp = state.employees.find(e => e.id === al.employeeId);
    
    const assetMatches = asset && asset.name.toLowerCase().includes(search);
    const empMatches = emp && emp.name.toLowerCase().includes(search);
    return assetMatches || empMatches;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No deployments cataloged matching filters.</td></tr>`;
    return;
  }

  filtered.forEach(al => {
    const asset = state.assets.find(a => a.id === al.assetId);
    const emp = state.employees.find(e => e.id === al.employeeId);
    const dept = state.departments.find(d => d.id === al.departmentId);

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

function renderTransferRequests() {
  const container = document.getElementById('transfer-list-container');
  if (!container) return;

  container.innerHTML = '';

  const pending = state.transfers.filter(t => t.status === 'pending');
  const countBadge = document.getElementById('transfer-badge-count');
  
  if (pending.length > 0) {
    countBadge.style.display = 'inline-flex';
    countBadge.textContent = pending.length;
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

  pending.forEach(tr => {
    const asset = state.assets.find(a => a.id === tr.assetId);
    const requester = state.employees.find(e => e.id === tr.requesterEmployeeId);
    const holder = state.employees.find(e => e.id === tr.currentHolderEmployeeId);

    const assetName = asset ? asset.name : 'Asset';
    const requesterName = requester ? requester.name : 'User';
    const holderName = holder ? holder.name : 'Holder';

    // Show action triggers only for Admin, Asset Manager, or Department Heads
    const hasApprovalRights = ['admin', 'manager', 'head'].includes(state.activeRole);
    const actionBtns = hasApprovalRights ? `
      <div style="display:flex; gap:0.5rem; margin-top:1rem;">
        <button class="btn btn-primary btn-sm" style="flex-grow:1;" onclick="processTransferApproval('${tr.id}', 'approved')">Approve</button>
        <button class="btn btn-secondary btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="processTransferApproval('${tr.id}', 'rejected')">Reject</button>
      </div>
    ` : `
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
let activeConflictData = null;

function submitAllocateAsset() {
  const assetId = document.getElementById('alloc-asset-select').value;
  const deptId = document.getElementById('alloc-dept-select').value;
  const employeeId = document.getElementById('alloc-emp-select').value;
  const returnDate = document.getElementById('alloc-return-date').value;

  const targetAsset = state.assets.find(a => a.id === assetId);

  // CONFLICT RULE: Check if already allocated
  const existingAlloc = state.allocations.find(al => al.assetId === assetId && al.status !== 'returned');

  if (existingAlloc || (targetAsset && targetAsset.status === 'allocated')) {
    // Show conflict modal
    const currentHolder = state.employees.find(e => e.id === (existingAlloc ? existingAlloc.employeeId : ''));
    const currentDept = state.departments.find(d => d.id === (existingAlloc ? existingAlloc.departmentId : ''));
    
    activeConflictData = {
      assetId,
      requesterEmployeeId: employeeId,
      targetDepartmentId: deptId,
      currentHolderEmployeeId: existingAlloc ? existingAlloc.employeeId : 'e-2',
      requestedDate: formatLogDate(new Date()).split(' ')[0]
    };

    document.getElementById('conflict-asset-name').textContent = targetAsset ? targetAsset.name : 'Target Laptop';
    document.getElementById('conflict-current-holder').textContent = currentHolder ? currentHolder.name : 'Sarah Connor';
    document.getElementById('conflict-current-dept').textContent = currentDept ? currentDept.name : 'Corporate IT';

    closeModal('modal-allocate-asset');
    openModal('modal-conflict-warning');
    return;
  }

  // Standard allocation execution
  executeAssetAllocation(assetId, employeeId, deptId, returnDate);
}

function executeAssetAllocation(assetId, employeeId, departmentId, returnDate) {
  const asset = state.assets.find(a => a.id === assetId);
  const emp = state.employees.find(e => e.id === employeeId);

  const newAlloc = {
    id: `al-${state.allocations.length + 1}`,
    assetId,
    employeeId,
    departmentId,
    allocatedDate: formatLogDate(new Date()).split(' ')[0],
    expectedReturnDate: returnDate || '',
    returnedDate: '',
    conditionCheckin: '',
    notes: 'Standard staff issue.',
    status: 'active'
  };

  state.allocations.push(newAlloc);

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
    date: formatLogDate(new Date()).split(' ')[0],
    isRead: false
  });

  saveState();
  closeModal('modal-allocate-asset');
  loadAllocationsPage();
  showToast(`Asset allocated to ${emp ? emp.name : 'employee'} successfully!`, "success");
}

function executeTransferRequest() {
  if (!activeConflictData) return;

  const newTransfer = {
    id: `tr-${state.transfers.length + 1}`,
    ...activeConflictData,
    status: 'pending'
  };

  state.transfers.push(newTransfer);

  state.auditLogs.unshift({
    id: `l-${state.auditLogs.length + 1}`,
    operator: state.currentUser ? state.currentUser.name : 'System User',
    action: 'TRANSFER',
    entityType: 'Asset',
    details: `Initiated transfer request for asset ID ${newTransfer.assetId}`,
    timestamp: formatLogDate(new Date())
  });

  saveState();
  closeModal('modal-conflict-warning');
  loadAllocationsPage();
  showToast("Transfer Request filed successfully! Awaiting Manager approval.", "success");
  activeConflictData = null;
}

function processTransferApproval(transferId, status) {
  const tr = state.transfers.find(t => t.id === transferId);
  if (!tr) return;

  tr.status = status;

  if (status === 'approved') {
    // 1. Close current active allocation for the asset
    const activeAlloc = state.allocations.find(al => al.assetId === tr.assetId && al.status !== 'returned');
    if (activeAlloc) {
      activeAlloc.status = 'returned';
      activeAlloc.returnedDate = formatLogDate(new Date()).split(' ')[0];
    }

    // 2. Open new allocation to requester
    const newAlloc = {
      id: `al-${state.allocations.length + 1}`,
      assetId: tr.assetId,
      employeeId: tr.requesterEmployeeId,
      departmentId: tr.targetDepartmentId,
      allocatedDate: formatLogDate(new Date()).split(' ')[0],
      expectedReturnDate: '',
      returnedDate: '',
      conditionCheckin: '',
      notes: 'Transfer routing.',
      status: 'active'
    };
    state.allocations.push(newAlloc);

    // Update asset
    const asset = state.assets.find(a => a.id === tr.assetId);
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
      date: formatLogDate(new Date()).split(' ')[0],
      isRead: false
    });

    showToast("Transfer approved and asset re-allocated!", "success");
  } else {
    showToast("Transfer request rejected.", "warning");
  }

  saveState();
  loadAllocationsPage();
}

function openReturnModal(allocId) {
  const al = state.allocations.find(a => a.id === allocId);
  if (!al) return;

  const asset = state.assets.find(a => a.id === al.assetId);
  const emp = state.employees.find(e => e.id === al.employeeId);

  document.getElementById('return-asset-id').value = al.id;
  document.getElementById('return-asset-label').textContent = asset ? `${asset.name} (${asset.assetTag})` : 'Asset';
  document.getElementById('return-employee-label').textContent = emp ? emp.name : 'Staff';

  openModal('modal-return-form');
}

function submitReturnAsset() {
  const allocId = document.getElementById('return-asset-id').value;
  const condition = document.getElementById('return-condition').value;
  const notes = document.getElementById('return-notes').value.trim();

  const al = state.allocations.find(a => a.id === allocId);
  if (al) {
    al.status = 'returned';
    al.returnedDate = formatLogDate(new Date()).split(' ')[0];
    al.conditionCheckin = condition;
    al.notes += ` | Returned notes: ${notes}`;

    // Revert Asset status back to available
    const asset = state.assets.find(a => a.id === al.assetId);
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
    showToast("Asset returned and checked back in as Available!", "success");
  }
}


// ================= PAGE 6: RESOURCE BOOKING CONTROLLERS =================
function switchBookingLayout(layout) {
  state.bookingLayout = layout;
  
  const monthLayout = document.getElementById('booking-month-layout');
  const timelineLayout = document.getElementById('booking-timeline-layout');
  const monthBtn = document.getElementById('btn-booking-view-month');
  const timelineBtn = document.getElementById('btn-booking-view-timeline');

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

function adjustCalendarMonth(direction) {
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

function loadBookingPage() {
  // Populate resource select choices
  const bookSelect = document.getElementById('book-resource-select');
  if (bookSelect) {
    bookSelect.innerHTML = '';
    state.assets.filter(a => a.isBookable).forEach(r => {
      bookSelect.innerHTML += `<option value="${r.id}">${r.name} (${r.location})</option>`;
    });
  }

  // Populate Resource Switcher Tabs
  const tabs = document.getElementById('booking-resource-tabs');
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

    state.assets.filter(a => a.isBookable).forEach(r => {
      let icon = 'calendar';
      const cat = state.categories.find(c => c.id === r.categoryId);
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
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calendar-month-year').textContent = `${months[state.activeCalendarMonth]} ${state.activeCalendarYear}`;

  if (state.bookingLayout === 'month') {
    renderCalendarGrid();
  } else {
    renderTimelineGrid();
  }

  renderUpcomingBookingsWidget();
}

function selectBookingResourceTab(resourceId) {
  selectedBookableResourceId = resourceId;
  loadBookingPage();
}

function renderCalendarGrid() {
  const container = document.getElementById('calendar-day-cells');
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
    const dayBookings = state.bookings.filter(b => {
      const isDate = b.bookDate === cellDateStr;
      const isRes = selectedBookableResourceId === 'all' || b.resourceId === selectedBookableResourceId;
      return isDate && isRes;
    });

    let bookingHtml = '';
    dayBookings.forEach(b => {
      const resource = state.assets.find(a => a.id === b.resourceId);
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

function renderTimelineGrid() {
  const container = document.getElementById('timeline-slots-container');
  if (!container) return;

  container.innerHTML = '';

  const resources = selectedBookableResourceId === 'all' ? 
                    state.assets.filter(a => a.isBookable) : 
                    state.assets.filter(a => a.id === selectedBookableResourceId);

  if (resources.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No resources selected</h3></div>`;
    return;
  }

  // Render hourly schedule block for today (July 12)
  resources.forEach(res => {
    const resBookings = state.bookings.filter(b => b.resourceId === res.id && b.bookDate === '2026-07-12');
    
    let hoursHtml = '';
    for (let h = 8; h <= 18; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      
      // Check if slot overlaps with any active booking
      const activeBooking = resBookings.find(b => {
        const startH = parseInt(b.startTime.split(':')[0]);
        const dur = parseFloat(b.durationHours);
        return h >= startH && h < (startH + dur);
      });

      let slotStyle = '';
      let slotLabel = 'Free';
      if (activeBooking) {
        slotStyle = 'background-color: var(--primary-light); color:var(--primary); font-weight:600;';
        const emp = state.employees.find(e => e.id === activeBooking.employeeId);
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

function renderUpcomingBookingsWidget() {
  const container = document.getElementById('booking-upcoming-list');
  if (!container) return;

  container.innerHTML = '';

  const list = state.bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing');
  
  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:2rem 0; color:var(--text-muted); font-size:0.8125rem;">No upcoming space reservations.</div>`;
    return;
  }

  list.forEach(b => {
    const res = state.assets.find(a => a.id === b.resourceId);
    const emp = state.employees.find(e => e.id === b.employeeId);

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

function submitBookResource() {
  const resourceId = document.getElementById('book-resource-select').value;
  const date = document.getElementById('book-date').value;
  const startTime = document.getElementById('book-time').value;
  const duration = parseFloat(document.getElementById('book-duration').value);

  // STRICT OVERLAP VALIDATION: Check collisions
  const resourceBookings = state.bookings.filter(b => b.resourceId === resourceId && b.bookDate === date && b.status !== 'cancelled');
  
  const newStartHour = parseInt(startTime.split(':')[0]);
  const newStartMin = parseInt(startTime.split(':')[1]);
  const newStartVal = newStartHour + (newStartMin / 60);
  const newEndVal = newStartVal + duration;

  let collision = false;
  let collisionEmpName = 'Staff';

  resourceBookings.forEach(b => {
    const existingStartHour = parseInt(b.startTime.split(':')[0]);
    const existingStartMin = parseInt(b.startTime.split(':')[1]);
    const existingStartVal = existingStartHour + (existingStartMin / 60);
    const existingEndVal = existingStartVal + parseFloat(b.durationHours);

    // Overlap condition
    if (newStartVal < existingEndVal && newEndVal > existingStartVal) {
      collision = true;
      const emp = state.employees.find(e => e.id === b.employeeId);
      collisionEmpName = emp ? emp.name : 'Staff';
    }
  });

  if (collision && state.strictBooking) {
    showToast(`Booking Collision! This slot is already booked by ${collisionEmpName}.`, "danger");
    return;
  }

  const newBooking = {
    id: `b-${state.bookings.length + 1}`,
    resourceId,
    employeeId: state.currentUser ? state.currentUser.id : 'e-1',
    bookDate: date,
    startTime,
    durationHours: String(duration),
    status: 'upcoming'
  };

  state.bookings.push(newBooking);

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
    date: formatLogDate(new Date()).split(' ')[0],
    isRead: false
  });

  saveState();
  closeModal('modal-book-resource');
  loadBookingPage();
  showToast("Resource booked successfully!", "success");
}

function cancelBooking(bookingId) {
  const b = state.bookings.find(x => x.id === bookingId);
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
    showToast("Reservation successfully cancelled.", "warning");
  }
}

function openBookingInspector(bookingId) {
  const b = state.bookings.find(x => x.id === bookingId);
  if (!b) return;

  const res = state.assets.find(a => a.id === b.resourceId);
  const emp = state.employees.find(e => e.id === b.employeeId);

  const resName = res ? res.name : 'Resource';
  const empName = emp ? emp.name : 'Staff';

  alert(`Reservation Details:\nResource: ${resName}\nReserved By: ${empName}\nDate: ${b.bookDate}\nTime: ${b.startTime}\nDuration: ${b.durationHours} Hours\nStatus: ${b.status}`);
}


// ================= PAGE 7: MAINTENANCE CONTROLLERS =================
function switchMaintView(view) {
  state.maintView = view;
  
  const kanban = document.getElementById('maint-kanban-board');
  const table = document.getElementById('maint-table-container');
  const kanbanBtn = document.getElementById('btn-maint-view-kanban');
  const tableBtn = document.getElementById('btn-maint-view-table');

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

function loadMaintenancePage() {
  // Populate asset selects in form
  const select = document.getElementById('maint-asset-select');
  if (select) {
    select.innerHTML = '';
    state.assets.forEach(a => {
      select.innerHTML += `<option value="${a.id}">${a.name} (${a.assetTag})</option>`;
    });
  }

  // Populate technician dropdown lists
  const techSelect = document.getElementById('assign-tech-select');
  if (techSelect) {
    techSelect.innerHTML = '<option value="">Select Technician...</option>';
    // Filter IT / Ops managers
    state.employees.forEach(emp => {
      techSelect.innerHTML += `<option value="${emp.name}">${emp.name} (${emp.role})</option>`;
    });
  }

  renderMaintenance();
}

function renderMaintenance() {
  const search = document.getElementById('maint-search').value.toLowerCase();
  const priorityFilter = document.getElementById('maint-filter-priority').value;

  // Filter tasks
  const filtered = state.maintenance.filter(ticket => {
    const asset = state.assets.find(a => a.id === ticket.assetId);
    
    const matchesSearch = ticket.issueDescription.toLowerCase().includes(search) || 
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

function renderMaintenanceKanban(tickets) {
  // Columns identifiers
  const columns = {
    pending: document.getElementById('col-maint-pending'),
    approved: document.getElementById('col-maint-approved'),
    assigned: document.getElementById('col-maint-assigned'),
    progress: document.getElementById('col-maint-progress'),
    resolved: document.getElementById('col-maint-resolved')
  };

  // Clear all columns
  Object.values(columns).forEach(col => { if(col) col.innerHTML = ''; });

  // Counts
  const counts = { pending: 0, approved: 0, assigned: 0, progress: 0, resolved: 0 };

  tickets.forEach(t => {
    const asset = state.assets.find(a => a.id === t.assetId);
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
  document.getElementById('count-maint-pending').textContent = counts.pending;
  document.getElementById('count-maint-approved').textContent = counts.approved;
  document.getElementById('count-maint-assigned').textContent = counts.assigned;
  document.getElementById('count-maint-progress').textContent = counts.progress;
  document.getElementById('count-maint-resolved').textContent = counts.resolved;
}

function renderMaintenanceTable(tickets) {
  const tbody = document.getElementById('maint-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No maintenance tickets found.</td></tr>`;
    return;
  }

  tickets.forEach((t, i) => {
    const asset = state.assets.find(a => a.id === t.assetId);
    
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:600;">TKT-00${i+1}</td>
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

function submitMaintenanceRequest() {
  const assetId = document.getElementById('maint-asset-select').value;
  const priority = document.getElementById('maint-priority').value;
  const desc = document.getElementById('maint-desc').value.trim();

  const newTicket = {
    id: `m-${state.maintenance.length + 1}`,
    assetId,
    priority,
    issueDescription: desc,
    raisedEmployeeId: state.currentUser ? state.currentUser.id : 'e-1',
    raisedDate: formatLogDate(new Date()).split(' ')[0],
    status: 'pending',
    technicianName: '',
    resolutionDeadline: '',
    resolvedDate: ''
  };

  state.maintenance.push(newTicket);

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
  showToast("Maintenance ticket submitted successfully for approval!", "success");
}

function approveMaintenanceTicket(ticketId) {
  const t = state.maintenance.find(x => x.id === ticketId);
  if (t) {
    t.status = 'approved';
    
    // TRANSITION RULE: Update target asset status to Under Maintenance
    const asset = state.assets.find(a => a.id === t.assetId);
    if (asset) asset.status = 'maintenance';

    // Notify requester
    state.notifications.unshift({
      id: `n-${state.notifications.length + 1}`,
      type: 'Maintenance Approved',
      content: `Your maintenance request for asset ${asset ? asset.name : 'device'} has been approved. Status flipped to Under Maintenance.`,
      date: formatLogDate(new Date()).split(' ')[0],
      isRead: false
    });

    saveState();
    loadMaintenancePage();
    showToast("Maintenance request approved. Asset status set to 'Under Maintenance'.", "success");
  }
}

function openAssignTechModal(ticketId) {
  const t = state.maintenance.find(x => x.id === ticketId);
  if (!t) return;

  const asset = state.assets.find(a => a.id === t.assetId);

  document.getElementById('assign-maint-id').value = t.id;
  document.getElementById('assign-tech-asset-details').innerHTML = `
    <strong>Target Asset:</strong> ${asset ? asset.name : 'Device'}<br>
    <strong>Priority:</strong> ${t.priority.toUpperCase()}<br>
    <strong>Description:</strong> ${t.issueDescription}
  `;

  openModal('modal-assign-tech');
}

function submitAssignTechnician() {
  const ticketId = document.getElementById('assign-maint-id').value;
  const tech = document.getElementById('assign-tech-select').value;
  const deadline = document.getElementById('assign-tech-deadline').value;

  const t = state.maintenance.find(x => x.id === ticketId);
  if (t) {
    t.status = 'assigned';
    t.technicianName = tech;
    t.resolutionDeadline = deadline;

    saveState();
    closeModal('modal-assign-tech');
    loadMaintenancePage();
    showToast(`Technician ${tech} assigned to ticket successfully!`, "success");
  }
}

function advanceMaintenanceStatus(ticketId, nextStatus) {
  const t = state.maintenance.find(x => x.id === ticketId);
  if (!t) return;

  t.status = nextStatus;

  if (nextStatus === 'resolved') {
    t.resolvedDate = formatLogDate(new Date()).split(' ')[0];
    
    // TRANSITION RULE: Revert asset status back to available
    const asset = state.assets.find(a => a.id === t.assetId);
    if (asset) asset.status = 'available';

    showToast("Maintenance resolved! Asset status reverted back to 'Available'.", "success");
  } else {
    showToast(`Ticket status advanced to: ${nextStatus}`, "primary");
  }

  saveState();
  loadMaintenancePage();
}

function showMaintDetailsSummary(ticketId) {
  const t = state.maintenance.find(x => x.id === ticketId);
  if (!t) return;
  const asset = state.assets.find(a => a.id === t.assetId);
  
  alert(`Ticket Summary:\nAsset: ${asset ? asset.name : 'device'}\nPriority: ${t.priority}\nIssue: ${t.issueDescription}\nAssigned Tech: ${t.technicianName || 'None'}\nDeadline: ${t.resolutionDeadline || '—'}\nResolution State: ${t.status}`);
}


// ================= PAGE 8: AUDIT CONTROLLERS =================
function loadAuditPage() {
  renderAuditCycles();

  // Seed scope departments
  const scopeSelect = document.getElementById('audit-scope-dept');
  if (scopeSelect) {
    scopeSelect.innerHTML = '';
    state.departments.forEach(dept => {
      scopeSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
    });
  }

  // Seed auditors select
  const auditorSelect = document.getElementById('audit-auditor');
  if (auditorSelect) {
    auditorSelect.innerHTML = '';
    state.employees.forEach(emp => {
      auditorSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${formatRoleName(emp.role)})</option>`;
    });
  }

  // Reload checklist pane if active cycle exists
  if (state.activeAuditCycleId) {
    loadAuditChecklist(state.activeAuditCycleId);
  }
}

function renderAuditCycles() {
  const tbody = document.getElementById('audit-cycles-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  state.audits.forEach(aud => {
    const dept = state.departments.find(d => d.id === aud.scopeDeptId);
    const auditor = state.employees.find(e => e.id === aud.assignedAuditorId);
    
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

function loadAuditChecklist(cycleId) {
  state.activeAuditCycleId = cycleId;

  // Toggle highlight in list table
  loadAuditPage; // sync highlights
  
  const aud = state.audits.find(a => a.id === cycleId);
  if (!aud) return;

  const dept = state.departments.find(d => d.id === aud.scopeDeptId);
  const auditor = state.employees.find(e => e.id === aud.assignedAuditorId);
  
  document.getElementById('audit-active-title').textContent = aud.title;
  document.getElementById('audit-active-scope').textContent = dept ? dept.name : 'Finance';
  document.getElementById('audit-active-auditor').textContent = auditor ? auditor.name : 'Sarah Connor';

  // Toggle placeholder view
  document.getElementById('audit-checklist-placeholder').style.display = 'none';
  document.getElementById('audit-checklist-active').style.display = 'block';

  // Populate checklist table of assets in the department scope
  const checklistBody = document.getElementById('audit-verification-tbody');
  checklistBody.innerHTML = '';

  const scopeAssets = state.assets.filter(a => a.categoryId !== ''); // load all assets for simulation or filter by department if allocation department matches
  
  // To keep it simple, load assets whose current allocated department matches the audit scope
  const targetAssets = state.assets.filter(asset => {
    // Check active allocation
    const alloc = state.allocations.find(al => al.assetId === asset.id && al.status !== 'returned');
    return alloc && alloc.departmentId === aud.scopeDeptId;
  });

  if (targetAssets.length === 0) {
    checklistBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No assets currently allocated to this department.</td></tr>`;
    return;
  }

  // Disable verify buttons if cycle is closed
  const isClosed = aud.status === 'closed';

  targetAssets.forEach(asset => {
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
  document.getElementById('audit-discrepancy-text').textContent = text;

  // Toggle Close lock btn visibility depending on role & status
  const lockBtn = document.getElementById('btn-close-audit');
  if (isClosed) {
    lockBtn.style.display = 'none';
  } else {
    lockBtn.style.display = 'inline-flex';
  }
}

function markAuditAsset(cycleId, assetId, verifyState) {
  const aud = state.audits.find(a => a.id === cycleId);
  if (!aud || aud.status === 'closed') return;

  // Clear existing logs in other arrays
  aud.verifiedAssetIds = aud.verifiedAssetIds.filter(id => id !== assetId);
  aud.missingAssetIds = aud.missingAssetIds.filter(id => id !== assetId);
  aud.damagedAssetIds = aud.damagedAssetIds.filter(id => id !== assetId);

  if (verifyState === 'verified') {
    aud.verifiedAssetIds.push(assetId);
    showToast("Asset marked as verified", "success");
  } else if (verifyState === 'missing') {
    aud.missingAssetIds.push(assetId);
    showToast("Discrepancy registered: Asset is Missing!", "danger");
  } else if (verifyState === 'damaged') {
    aud.damagedAssetIds.push(assetId);
    showToast("Discrepancy registered: Asset is Damaged!", "warning");
  }

  // Recalculate progress percent
  const targetAssets = state.assets.filter(asset => {
    const alloc = state.allocations.find(al => al.assetId === asset.id && al.status !== 'returned');
    return alloc && alloc.departmentId === aud.scopeDeptId;
  });
  const total = targetAssets.length;
  const completed = aud.verifiedAssetIds.length + aud.missingAssetIds.length + aud.damagedAssetIds.length;
  aud.progressPercent = total === 0 ? 100 : Math.round((completed / total) * 100);

  saveState();
  loadAuditChecklist(cycleId);
  renderAuditCycles();
}

function closeAuditCycleTrigger() {
  const aud = state.audits.find(a => a.id === state.activeAuditCycleId);
  if (!aud || aud.status === 'closed') return;

  if (confirm("Are you sure you want to close and lock this audit cycle? A discrepancy report will be generated and missing assets automatically updated to 'Lost' status.")) {
    aud.status = 'closed';
    
    // TRANSITION RULE: Update missing assets to 'Lost'
    aud.missingAssetIds.forEach(assetId => {
      const asset = state.assets.find(a => a.id === assetId);
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
      date: formatLogDate(new Date()).split(' ')[0],
      isRead: false
    });

    saveState();
    loadAuditChecklist(state.activeAuditCycleId);
    renderAuditCycles();
    showToast("Audit cycle locked and discrepancies processed!", "success");
  }
}

function submitStartAudit() {
  const title = document.getElementById('audit-title').value.trim();
  const deptId = document.getElementById('audit-scope-dept').value;
  const auditorId = document.getElementById('audit-auditor').value;
  const start = document.getElementById('audit-start-date').value;
  const end = document.getElementById('audit-end-date').value;

  const newAudit = {
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
  };

  state.audits.push(newAudit);

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
  showToast(`Audit cycle scheduled successfully! Click to inspect.`, "success");
}


// ================= PAGE 9: REPORTS & ANALYTICS =================
function loadReportsPage() {
  renderReportsCharts();
  renderHeatmap();
  
  // Render Idle assets warning table
  const table = document.getElementById('table-reports-idle-assets');
  if (table) {
    table.innerHTML = '';
    
    // Find assets with available status (sitting idle)
    const idles = state.assets.filter(a => a.status === 'available');
    if (idles.length === 0) {
      table.innerHTML = `<tr><td style="color:var(--text-muted); text-align:center;">No idle assets. Perfect inventory turnover!</td></tr>`;
    } else {
      idles.slice(0, 3).forEach(asset => {
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

function renderReportsCharts() {
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  // 1. Department Allocation Pie/Doughnut Chart
  if (charts.reportsDeptAlloc) charts.reportsDeptAlloc.destroy();
  const ctx1 = document.getElementById('chart-reports-dept-alloc').getContext('2d');
  charts.reportsDeptAlloc = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Engineering', 'Marketing', 'HR', 'Finance', 'Operations'],
      datasets: [{
        label: 'Total Asset Valuation ($)',
        data: [13498, 8399, 1299, 4500, 12500],
        backgroundColor: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        borderRadius: 6
      }]
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
  const ctx2 = document.getElementById('chart-reports-maint-freq').getContext('2d');
  charts.reportsMaintFreq = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Computers', 'Vehicles', 'Servers', 'AV Systems'],
      datasets: [{
        data: [15, 8, 30, 22],
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'],
        borderWidth: 0
      }]
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
  const ctx3 = document.getElementById('chart-reports-retirement').getContext('2d');
  charts.reportsRetirement = new Chart(ctx3, {
    type: 'line',
    data: {
      labels: ['Jul 26', 'Oct 26', 'Jan 27', 'Apr 27'],
      datasets: [{
        label: 'Predictive Retirements',
        data: [1, 2, 4, 3],
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2
      }]
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

function renderHeatmap() {
  const container = document.getElementById('analytics-heatmap');
  if (!container) return;

  container.innerHTML = '';

  const hoursLabels = ['09:00', '12:00', '15:00', '18:00'];
  const labelsHtml = hoursLabels.map(label => `<span style="font-size:0.6rem; color:var(--text-muted);">${label}</span>`).join('');

  // 5 rows representing meeting rooms / vehicles / equipment
  const rows = ['Conf Room A', 'Conf Room B', 'Tesla Fleet', 'Transit Van', 'AR Headset'];

  rows.forEach(room => {
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

function triggerExport(format) {
  showToast(`Simulating compilation export of all ERP tables to ${format}...`, "primary");
  setTimeout(() => {
    showToast(`Compiled report successfully downloaded: AssetFlow_Analytics_Report.${format.toLowerCase()}`, "success");
  }, 1500);
}


// ================= PAGE 10: NOTIFICATIONS & AUDIT TRAIL =================
function switchNotificationTab(e, tabId) {
  e.target.parentNode.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  const paneParent = e.target.closest('.page-section');
  paneParent.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');

  if (tabId === 'tab-notif-inbox') {
    renderNotificationsPage();
  } else {
    renderAuditLogs();
  }
}

function renderNotificationsPage() {
  const container = document.getElementById('notifications-inbox-list');
  if (!container) return;

  const typeFilter = document.getElementById('notif-filter-type').value;
  container.innerHTML = '';

  const filtered = state.notifications.filter(n => !typeFilter || n.type === typeFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>Inbox is Empty</h3><p>No system notifications recorded.</p></div>`;
    return;
  }

  filtered.forEach(n => {
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

function markNotificationRead(id) {
  const notif = state.notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveState();
    renderNotificationsPage();
    updateGlobalUnreadIndicators();
  }
}

function markAllNotificationsAsRead() {
  state.notifications.forEach(n => n.isRead = true);
  saveState();
  renderNotificationsPage();
  updateGlobalUnreadIndicators();
  showToast("All notifications flagged as read.", "success");
}

function updateGlobalUnreadIndicators() {
  const unreadCount = state.notifications.filter(n => !n.isRead).length;
  
  const navDot = document.getElementById('nav-unread-dot');
  const sidebarIndicator = document.getElementById('sidebar-unread-indicator');

  if (unreadCount > 0) {
    if (navDot) navDot.style.display = 'block';
    if (sidebarIndicator) {
      sidebarIndicator.style.display = 'inline-flex';
      sidebarIndicator.textContent = unreadCount;
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

function renderAuditLogs() {
  const tbody = document.getElementById('audit-logs-table-body');
  if (!tbody) return;

  const search = document.getElementById('audit-log-search').value.toLowerCase();
  tbody.innerHTML = '';

  const filtered = state.auditLogs.filter(log => 
    log.operator.toLowerCase().includes(search) || 
    log.details.toLowerCase().includes(search) ||
    log.entityType.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No audit logs match filters.</td></tr>`;
    return;
  }

  filtered.forEach(log => {
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
function loadSettingsPage() {
  if (state.currentUser) {
    document.getElementById('settings-fullname').value = state.currentUser.name;
    document.getElementById('settings-email').value = state.currentUser.email;
    
    const dept = state.departments.find(d => d.id === state.currentUser.departmentId);
    document.getElementById('settings-dept').value = dept ? dept.name : 'Corporate Management';
    document.getElementById('settings-role').value = formatRoleName(state.currentUser.role);
  }
  document.getElementById('settings-strict-booking').checked = state.strictBooking;
}

function saveUserSettings() {
  const name = document.getElementById('settings-fullname').value.trim();
  const strict = document.getElementById('settings-strict-booking').checked;

  if (state.currentUser) {
    state.currentUser.name = name;
    
    // Sync back name inside Employee directory database
    const emp = state.employees.find(e => e.id === state.currentUser.id);
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
    document.getElementById('navbar-user-name').textContent = name;
    document.getElementById('dropdown-user-name').textContent = name;
    document.getElementById('user-avatar-initials').textContent = name.split(' ').map(n=>n[0]).join('');

    showToast("User details successfully saved!", "success");
  }
}


// ================= GLOBAL SEARCH MANAGER =================
function handleGlobalSearch(query) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return;

  // Let's filter the items based on which page is active to be most intuitive!
  const activeSection = document.querySelector('.page-section.active');
  const pageId = activeSection.id.replace('page-', '');

  if (pageId === 'assets') {
    document.getElementById('asset-search').value = query;
    renderAssets();
  } else if (pageId === 'allocation') {
    document.getElementById('alloc-search').value = query;
    renderAllocations();
  } else if (pageId === 'maintenance') {
    document.getElementById('maint-search').value = query;
    renderMaintenance();
  } else if (pageId === 'org-setup') {
    const activeTab = document.querySelector('#page-org-setup .tab-btn.active').textContent;
    if (activeTab.includes('Department')) {
      document.getElementById('dept-search').value = query;
      renderDepartments();
    } else if (activeTab.includes('Employee')) {
      document.getElementById('emp-search').value = query;
      renderEmployees();
    }
  }
}


// ================= DETAIL DRAWER INTERACTIONS =================
let activeDrawerAssetId = null;

function openAssetDetailDrawer(assetId) {
  const asset = state.assets.find(a => a.id === assetId);
  if (!asset) return;

  activeDrawerAssetId = assetId;

  const cat = state.categories.find(c => c.id === asset.categoryId);
  const catName = cat ? cat.name : 'Device';

  // Badge mapping
  let badgeClass = 'badge-available';
  if (asset.status === 'allocated') badgeClass = 'badge-allocated';
  if (asset.status === 'reserved') badgeClass = 'badge-reserved';
  if (asset.status === 'maintenance') badgeClass = 'badge-maintenance';
  if (asset.status === 'lost') badgeClass = 'badge-lost';
  if (asset.status === 'retired') badgeClass = 'badge-retired';
  if (asset.status === 'disposed') badgeClass = 'badge-disposed';

  document.getElementById('drawer-asset-status').textContent = asset.status;
  document.getElementById('drawer-asset-status').className = `badge ${badgeClass}`;
  document.getElementById('drawer-asset-name').textContent = asset.name;
  document.getElementById('drawer-asset-tag').textContent = `Tag: ${asset.assetTag}`;
  document.getElementById('drawer-asset-serial').textContent = asset.serial;
  document.getElementById('drawer-asset-category').textContent = catName;
  document.getElementById('drawer-asset-date').textContent = asset.acquireDate;
  document.getElementById('drawer-asset-cost').textContent = `$${asset.cost.toLocaleString()}`;
  document.getElementById('drawer-asset-condition').textContent = asset.condition;
  document.getElementById('drawer-asset-location').textContent = asset.location;
  document.getElementById('drawer-asset-warranty').textContent = asset.warrantyField || 'Indefinite';
  document.getElementById('drawer-asset-bookable').textContent = asset.isBookable ? 'Yes (Bookable)' : 'No (Assigned Only)';

  // Build simulated QR Code SVG icon
  const qrContainer = document.getElementById('drawer-qr-container');
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
  const timelineAlloc = document.getElementById('drawer-timeline-alloc');
  timelineAlloc.innerHTML = '';
  
  const allocs = state.allocations.filter(al => al.assetId === asset.id);
  if (allocs.length === 0) {
    timelineAlloc.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">No allocation histories recorded.</span>`;
  } else {
    allocs.forEach(al => {
      const emp = state.employees.find(e => e.id === al.employeeId);
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

  const timelineMaint = document.getElementById('drawer-timeline-maint');
  timelineMaint.innerHTML = '';
  
  const maints = state.maintenance.filter(m => m.assetId === asset.id);
  if (maints.length === 0) {
    timelineMaint.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">No maintenance tickets filed.</span>`;
  } else {
    maints.forEach(m => {
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
  const allocBtn = document.getElementById('drawer-allocation-action-btn');
  if (asset.status !== 'available') {
    allocBtn.style.display = 'none';
  } else {
    allocBtn.style.display = 'inline-flex';
  }

  openDrawer('drawer-asset-details');
}

function switchDrawerTab(e, tabId) {
  e.target.parentNode.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  const paneParent = e.target.parentNode.parentNode;
  paneParent.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

function triggerMaintRequestFromDrawer() {
  if (!activeDrawerAssetId) return;
  closeDrawer('drawer-asset-details');
  openMaintenanceModal();
  document.getElementById('maint-asset-select').value = activeDrawerAssetId;
}

function triggerAllocationFromDrawer() {
  if (!activeDrawerAssetId) return;
  closeDrawer('drawer-asset-details');
  openAllocateAssetModal();
  document.getElementById('alloc-asset-select').value = activeDrawerAssetId;
}

// ================= QR SIMULATOR LOGIC =================
function executeQrScanSearch() {
  const assetId = document.getElementById('qr-simulate-select').value;
  closeModal('modal-qr-scan');
  
  // Directly open drawer details
  openAssetDetailDrawer(assetId);
  showToast("QR scan matching catalog tag detected!", "success");
}


// ================= MODAL & DRAWER HELPER HANDLERS =================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function openDrawer(drawerId) {
  document.getElementById(drawerId).classList.add('show');
}

function closeDrawer(drawerId) {
  document.getElementById(drawerId).classList.remove('show');
}

function closeDrawerIfOverlay(e, drawerId) {
  if (e.target.id === drawerId) {
    closeDrawer(drawerId);
  }
}

// Quick action launchers
function openQuickActionModal() { openModal('modal-quick-action'); }
function openRegisterAssetModal() { openModal('modal-register-asset'); }
function openAllocateAssetModal() { 
  openModal('modal-allocate-asset'); 
  loadAllocationsPage(); // reload selectors
}
function openBookResourceModal() { openModal('modal-book-resource'); }
function openMaintenanceModal() { openModal('modal-maintenance-request'); }
function openQrScanModal() { openModal('modal-qr-scan'); }
function openStartAuditModal() { openModal('modal-start-audit'); }
function openAddDeptModal() { openModal('modal-add-dept'); }
function openAddCategoryModal() { openModal('modal-add-category'); }


// ================= UTILITIES & HELPERS =================
function formatRoleName(role) {
  if (window.AssetFlow && window.AssetFlow.isRole(role)) {
    return window.AssetFlow.formatRoleName(role);
  }

  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Asset Manager';
  if (role === 'head') return 'Dept Head';
  if (role === 'employee') return 'Employee';
  return role;
}

function formatLogDate(date) {
  if (window.AssetFlow) {
    return window.AssetFlow.formatLogDate(date);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('app-sidebar');
  const workspace = document.getElementById('main-workspace');
  
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
  const sidebar = document.getElementById('app-sidebar');
  const workspace = document.getElementById('main-workspace');
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
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display = 'none';

  // Seed default dates on form inputs
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (document.getElementById('reg-date')) document.getElementById('reg-date').value = today;
  if (document.getElementById('book-date')) document.getElementById('book-date').value = today;
  if (document.getElementById('audit-start-date')) document.getElementById('audit-start-date').value = today;
  if (document.getElementById('audit-end-date')) document.getElementById('audit-end-date').value = nextWeek;
  if (document.getElementById('assign-tech-deadline')) document.getElementById('assign-tech-deadline').value = nextWeek;
});
