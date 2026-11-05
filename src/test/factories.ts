import type { Booking } from '../types';

let counter = 0;

/** A booking for tests: Ayesha, cut & blow-dry, Wednesday 11 November 2026 at 10:00. */
export function booking(overrides: Partial<Booking> = {}): Booking {
  counter += 1;
  return {
    ref: `LM-T${String(counter).padStart(4, '0')}`,
    serviceId: 'cut-blowdry',
    stylistId: 'ayesha',
    date: '2026-11-11',
    start: 600,
    end: 660,
    customer: { name: 'Test Client', email: 'test@example.com', phone: '0821234567' },
    notes: '',
    status: 'booked',
    createdAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}
