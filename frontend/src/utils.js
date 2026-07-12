// ================= TOAST SYSTEM =================
export function showToast(message, type = 'primary') {
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
  // Lucide is loaded via CDN on the window object
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Trigger animations & removals
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(1rem)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ================= UTILITIES & HELPERS =================
export function formatRoleName(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Asset Manager';
  if (role === 'head') return 'Dept Head';
  if (role === 'employee') return 'Employee';
  return role;
}

export function formatLogDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function toggleSidebarCollapse() {
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
