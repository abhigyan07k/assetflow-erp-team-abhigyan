import { loadAllocationsPage } from './allocation.js';

// ================= MODAL & DRAWER HELPER HANDLERS =================
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

export function openDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (drawer) drawer.classList.add('show');
}

export function closeDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (drawer) drawer.classList.remove('show');
}

export function closeDrawerIfOverlay(e, drawerId) {
  if (e.target.id === drawerId) {
    closeDrawer(drawerId);
  }
}

// Quick action launchers
export function openQuickActionModal() { openModal('modal-quick-action'); }
export function openRegisterAssetModal() { openModal('modal-register-asset'); }
export function openAllocateAssetModal() { 
  openModal('modal-allocate-asset'); 
  loadAllocationsPage(); // reload selectors
}
export function openBookResourceModal() { openModal('modal-book-resource'); }
export function openMaintenanceModal() { openModal('modal-maintenance-request'); }
export function openQrScanModal() { openModal('modal-qr-scan'); }
export function openStartAuditModal() { openModal('modal-start-audit'); }
export function openAddDeptModal() { openModal('modal-add-dept'); }
export function openAddCategoryModal() { openModal('modal-add-category'); }
