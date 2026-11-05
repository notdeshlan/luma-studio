import { BREAK, OPENING, getService, stylistsForService } from '../data/salon';
import type { Booking, BookingStatus, Stylist } from '../types';
import { addDays, salonNow, toMinutes, weekday } from './time';

export const SLOT_STEP = 15;
/** Same-day bookings need at least an hour's notice. */
export const LEAD_TIME = 60;
/** How far ahead customers can book. */
export const BOOKING_WINDOW_DAYS = 28;

/** Statuses that keep a stylist's chair occupied. */
const OCCUPYING: ReadonlySet<BookingStatus> = new Set(['booked', 'completed', 'no-show']);
export const occupies = (b: Booking) => OCCUPYING.has(b.status);

export interface WorkWindow {
  open: number;
  close: number;
  breakStart: number;
  breakEnd: number;
}

export function isSalonOpen(date: string): boolean {
  return OPENING[weekday(date)] !== null;
}

export function workWindow(stylist: Stylist, date: string): WorkWindow | null {
  const day = weekday(date);
  const hours = OPENING[day];
  if (!hours || !stylist.workDays.includes(day)) return null;
  const breakStart = toMinutes(BREAK.start);
  return { open: toMinutes(hours.open), close: toMinutes(hours.close), breakStart, breakEnd: breakStart + BREAK.duration };
}

const overlaps = (start: number, end: number, otherStart: number, otherEnd: number) =>
  start < otherEnd && otherStart < end;

/** Start times a stylist could take a service of this length, on 15-minute steps. */
export function freeStarts(
  stylist: Stylist,
  date: string,
  duration: number,
  bookings: readonly Booking[],
  now: Date,
  excludeRef?: string,
): number[] {
  const window = workWindow(stylist, date);
  if (!window) return [];

  const today = salonNow(now);
  if (date < today.date) return [];
  const earliest = date === today.date ? today.minutes + LEAD_TIME : -Infinity;

  const busy: [number, number][] = bookings
    .filter((b) => b.stylistId === stylist.id && b.date === date && b.ref !== excludeRef && occupies(b))
    .map((b) => [b.start, b.end]);
  busy.push([window.breakStart, window.breakEnd]);

  const starts: number[] = [];
  for (let start = window.open; start + duration <= window.close; start += SLOT_STEP) {
    if (start < earliest) continue;
    if (busy.some(([s, e]) => overlaps(start, start + duration, s, e))) continue;
    starts.push(start);
  }
  return starts;
}

export interface Slot {
  start: number;
  /** Every stylist free at this time, so "any stylist" can be assigned fairly. */
  stylistIds: string[];
}

export interface SlotQuery {
  date: string;
  serviceId: string;
  /** A stylist's id, or "any". */
  stylistId: string;
  bookings: readonly Booking[];
  now: Date;
  /** When moving a booking, ignore its current slot. */
  excludeRef?: string;
}

export function availableSlots(q: SlotQuery): Slot[] {
  const service = getService(q.serviceId);
  if (!service) return [];
  const today = salonNow(q.now).date;
  if (q.date > addDays(today, BOOKING_WINDOW_DAYS)) return [];

  const candidates = stylistsForService(q.serviceId).filter((s) => q.stylistId === 'any' || s.id === q.stylistId);
  const byStart = new Map<number, string[]>();
  for (const stylist of candidates) {
    for (const start of freeStarts(stylist, q.date, service.duration, q.bookings, q.now, q.excludeRef)) {
      byStart.set(start, [...(byStart.get(start) ?? []), stylist.id]);
    }
  }
  return [...byStart.entries()].sort(([a], [b]) => a - b).map(([start, stylistIds]) => ({ start, stylistIds }));
}

/** The earliest bookable slot within the booking window, if there is one. */
export function nextAvailable(
  serviceId: string,
  stylistId: string,
  bookings: readonly Booking[],
  now: Date,
): { date: string; slot: Slot } | null {
  const today = salonNow(now).date;
  for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
    const date = addDays(today, i);
    const [slot] = availableSlots({ date, serviceId, stylistId, bookings, now });
    if (slot) return { date, slot };
  }
  return null;
}

/** For "any stylist": give the appointment to whoever has the least booked time that day. */
export function chooseStylist(slot: Slot, date: string, bookings: readonly Booking[]): string {
  const load = (id: string) =>
    bookings.filter((b) => b.stylistId === id && b.date === date && occupies(b)).reduce((sum, b) => sum + b.end - b.start, 0);
  return [...slot.stylistIds].sort((a, b) => load(a) - load(b))[0];
}

/** True if the booking would clash with another of the same stylist's appointments. */
export function hasClash(booking: Booking, bookings: readonly Booking[]): boolean {
  return bookings.some(
    (b) =>
      b.ref !== booking.ref &&
      b.stylistId === booking.stylistId &&
      b.date === booking.date &&
      occupies(b) &&
      overlaps(booking.start, booking.end, b.start, b.end),
  );
}
