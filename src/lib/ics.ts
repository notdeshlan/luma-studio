import { SALON, getService, getStylist } from '../data/salon';
import type { Booking } from '../types';
import { toInstant } from './time';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (text: string) => text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** An iCalendar file for the appointment, so customers can add it to any calendar app. */
export function bookingToIcs(booking: Booking, now = new Date()): string {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Luma Hair Studio//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.ref}@lumastudio.example`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(toInstant(booking.date, booking.start))}`,
    `DTEND:${stamp(toInstant(booking.date, booking.end))}`,
    `SUMMARY:${escape(`${service?.name ?? 'Appointment'} at ${SALON.name}`)}`,
    `DESCRIPTION:${escape(`With ${stylist?.name ?? 'your stylist'}. Booking reference ${booking.ref}.`)}`,
    `LOCATION:${escape(`${SALON.street}, ${SALON.area}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Hair appointment in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(booking: Booking): void {
  const blob = new Blob([bookingToIcs(booking)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `luma-${booking.ref}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
