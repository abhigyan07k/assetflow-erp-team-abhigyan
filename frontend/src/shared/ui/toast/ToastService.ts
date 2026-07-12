import type { Toast, ToastType } from '@core/types';
import { createSequentialId } from '@core/utils/id';
import { createStore } from '@store/createStore';

export const toastStore = createStore<Toast[]>([]);

export class ToastService {
  show(message: string, type: ToastType = 'primary'): Toast {
    const toast: Toast = {
      id: createSequentialId('toast', toastStore.getState().length),
      message,
      type,
      createdAt: Date.now()
    };

    toastStore.update((toasts) => {
      toasts.push(toast);
    });

    return toast;
  }

  dismiss(toastId: string): void {
    toastStore.update((toasts) => {
      const index = toasts.findIndex((toast) => toast.id === toastId);
      if (index >= 0) toasts.splice(index, 1);
    });
  }
}

export const toastService = new ToastService();
