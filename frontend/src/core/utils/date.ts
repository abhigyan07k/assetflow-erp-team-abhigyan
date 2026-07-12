import type { DateString, DateTimeString } from '@core/types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLogDate(date: Date): DateTimeString {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function toDateString(date: Date): DateString {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}
