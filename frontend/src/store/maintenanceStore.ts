import type { EntityId, MaintenanceTicket } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('maintenance');

export const maintenanceStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(ticketId: EntityId): MaintenanceTicket | undefined {
    return slice.getAll().find((ticket) => ticket.id === ticketId);
  }
};
