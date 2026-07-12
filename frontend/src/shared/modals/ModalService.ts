import type { Modal } from '@core/types';
import { createStore } from '@store/createStore';

export const modalStore = createStore<Record<string, Modal>>({});

export class ModalService {
  open(modalId: string): void {
    modalStore.update((modals) => {
      modals[modalId] = { id: modalId, isOpen: true };
    });
  }

  close(modalId: string): void {
    modalStore.update((modals) => {
      modals[modalId] = { id: modalId, isOpen: false };
    });
  }

  isOpen(modalId: string): boolean {
    return modalStore.getState()[modalId]?.isOpen ?? false;
  }
}

export const modalService = new ModalService();
