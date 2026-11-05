import { getService } from '../data/salon';
import type { Booking, Customer } from '../types';
import { availableSlots, chooseStylist } from './availability';
import { salonNow } from './time';

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeRef(taken: ReadonlySet<string>, random: () => number = Math.random): string {
  for (;;) {
    let ref = 'LM-';
    for (let i = 0; i < 5; i++) ref += REF_CHARS[Math.floor(random() * REF_CHARS.length)];
    if (!taken.has(ref)) return ref;
  }
}

export interface NewBooking {
  serviceId: string;
  /** A stylist's id, or "any". */
  stylistId: string;
  date: string;
  start: number;
  customer: Customer;
  notes: string;
}

export type Result = { ok: true; booking: Booking } | { ok: false; error: string };

const TAKEN = 'Sorry, someone has just booked that time. Please choose another.';

export function createBooking(input: NewBooking, bookings: readonly Booking[], now: Date): Result {
  const service = getService(input.serviceId);
  if (!service) return { ok: false, error: 'Please choose a service.' };

  const slot = availableSlots({ ...input, bookings, now }).find((s) => s.start === input.start);
  if (!slot) return { ok: false, error: TAKEN };

  const stylistId = input.stylistId === 'any' ? chooseStylist(slot, input.date, bookings) : input.stylistId;
  return {
    ok: true,
    booking: {
      ref: makeRef(new Set(bookings.map((b) => b.ref))),
      serviceId: service.id,
      stylistId,
      date: input.date,
      start: input.start,
      end: input.start + service.duration,
      customer: {
        name: input.customer.name.trim(),
        email: input.customer.email.trim().toLowerCase(),
        phone: input.customer.phone.trim(),
      },
      notes: input.notes.trim(),
      status: 'booked',
      createdAt: now.toISOString(),
    },
  };
}

/** Moves a booking to a new time with the same stylist. */
export function rescheduleBooking(booking: Booking, date: string, start: number, bookings: readonly Booking[], now: Date): Result {
  const free = availableSlots({
    date,
    serviceId: booking.serviceId,
    stylistId: booking.stylistId,
    bookings,
    now,
    excludeRef: booking.ref,
  }).some((s) => s.start === start);
  if (!free) return { ok: false, error: TAKEN };
  return { ok: true, booking: { ...booking, date, start, end: start + (booking.end - booking.start) } };
}

/** Customers can change or cancel upcoming bookings online. */
export function canChange(booking: Booking, now: Date): boolean {
  if (booking.status !== 'booked') return false;
  const today = salonNow(now);
  return booking.date > today.date || (booking.date === today.date && booking.start > today.minutes);
}
