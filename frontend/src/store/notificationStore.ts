import type { EntityId, Notification } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('notifications');

export const notificationStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(notificationId: EntityId): Notification | undefined {
    return slice.getAll().find((notification) => notification.id === notificationId);
  },
  unreadCount(): number {
    return slice.getAll().filter((notification) => !notification.isRead).length;
  }
};
