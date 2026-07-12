import type { EntityId, Notification } from '@core/types';
import { notificationStore } from '@store/notificationStore';

export class NotificationService {
  markRead(notificationId: EntityId): Notification | null {
    let updated: Notification | null = null;
    notificationStore.update((notifications) => {
      const notification = notifications.find((item) => item.id === notificationId);
      if (!notification) return;
      notification.isRead = true;
      updated = notification;
    });
    return updated;
  }

  markAllRead(): void {
    notificationStore.update((notifications) => {
      notifications.forEach((notification) => {
        notification.isRead = true;
      });
    });
  }

  unreadCount(): number {
    return notificationStore.unreadCount();
  }
}

export const notificationService = new NotificationService();
