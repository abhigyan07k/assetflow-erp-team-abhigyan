import type { Booking, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('bookings');

export const bookingStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(bookingId: EntityId): Booking | undefined {
    return slice.getAll().find((booking) => booking.id === bookingId);
  },
  findForResourceOnDate(resourceId: EntityId, bookDate: string): readonly Booking[] {
    return slice.getAll().filter((booking) => booking.resourceId === resourceId && booking.bookDate === bookDate);
  }
};
