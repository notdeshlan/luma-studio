import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Booking } from '../types';
import { generateDemoBookings } from './demo-data';
import { daysBetween, salonNow } from './time';

/**
 * The app's "database". In a real build this module would call an API; here it keeps
 * bookings in localStorage so the demo works on static hosting. Components only use
 * the functions below, so swapping in a server later doesn't touch the UI.
 */

const KEY = 'luma-studio:v2';
/** Demo data is regenerated around today's date if it's older than this. */
const REFRESH_AFTER_DAYS = 3;

interface Saved {
  seededOn: string;
  bookings: Booking[];
}

function read(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Saved>;
    if (typeof data.seededOn !== 'string' || !Array.isArray(data.bookings)) return null;
    return data as Saved;
  } catch {
    return null;
  }
}

function write(data: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private browsing or storage full: the demo still works for this visit.
  }
}

function freshDemo(): Saved {
  const now = new Date();
  return { seededOn: salonNow(now).date, bookings: generateDemoBookings(now) };
}

function initial(): Saved {
  const saved = read();
  if (saved && daysBetween(saved.seededOn, salonNow(new Date()).date) < REFRESH_AFTER_DAYS) return saved;
  const data = freshDemo();
  write(data);
  return data;
}

let data = initial();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function commit(bookings: Booking[]): void {
  data = { ...data, bookings };
  write(data);
  notify();
}

// Keep other open tabs in sync, e.g. book on the site and watch it appear on the dashboard.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    const next = read();
    if (next) {
      data = next;
      notify();
    }
  });
}

export const bookingStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getAll: (): Booking[] => data.bookings,
  add(booking: Booking) {
    commit([...data.bookings, booking]);
  },
  update(ref: string, changes: Partial<Omit<Booking, 'ref'>>) {
    commit(data.bookings.map((b) => (b.ref === ref ? { ...b, ...changes } : b)));
  },
  replace(booking: Booking) {
    commit(data.bookings.map((b) => (b.ref === booking.ref ? booking : b)));
  },
  reset() {
    data = freshDemo();
    write(data);
    notify();
  },
};

export function useBookings(): Booking[] {
  return useSyncExternalStore(bookingStore.subscribe, bookingStore.getAll);
}

/** The current time, refreshed every 30 seconds so "today" views stay correct. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
