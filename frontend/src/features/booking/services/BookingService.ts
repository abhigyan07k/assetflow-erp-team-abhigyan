import type { Booking, EntityId } from '@core/types';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';
import { bookingStore } from '@store/bookingStore';

export interface BookResourceInput {
  resourceId: EntityId;
  employeeId: EntityId;
  bookDate: Booking['bookDate'];
  startTime: string;
  durationHours: number;
}

export interface BookingCollision {
  booking: Booking;
  employeeId: EntityId;
}

function timeToHourValue(time: string): number {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number.parseInt(hour, 10) + Number.parseInt(minute, 10) / 60;
}

export class BookingService {
  findCollision(input: BookResourceInput): BookingCollision | null {
    const newStart = timeToHourValue(input.startTime);
    const newEnd = newStart + input.durationHours;
    const existingBookings = bookingStore
      .findForResourceOnDate(input.resourceId, input.bookDate)
      .filter((booking) => booking.status !== 'cancelled');

    const collision = existingBookings.find((booking) => {
      const existingStart = timeToHourValue(booking.startTime);
      const existingEnd = existingStart + Number.parseFloat(booking.durationHours);
      return newStart < existingEnd && newEnd > existingStart;
    });

    return collision ? { booking: collision, employeeId: collision.employeeId } : null;
  }

  bookResource(input: BookResourceInput): Booking {
    const bookings = bookingStore.getAll();
    const newBooking: Booking = {
      id: createSequentialId('b', bookings.length),
      resourceId: input.resourceId,
      employeeId: input.employeeId,
      bookDate: input.bookDate,
      startTime: input.startTime,
      durationHours: String(input.durationHours),
      status: 'upcoming'
    };

    appStore.update((draft) => {
      draft.bookings.push(newBooking);
    });
    saveState();
    return newBooking;
  }
}

export const bookingService = new BookingService();
