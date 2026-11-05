import { describe, expect, it } from 'vitest';
import { booking } from '../test/factories';
import { availableSlots, chooseStylist, hasClash } from './availability';
import { toMinutes } from './time';

// Tuesday 10 November 2026, 09:00 in Durban (UTC+2).
const NOW = new Date('2026-11-10T07:00:00Z');
const WED = '2026-11-11';
const THU = '2026-11-12';

const times = (slots: { start: number }[]) =>
  slots.map((s) => `${String(Math.floor(s.start / 60)).padStart(2, '0')}:${String(s.start % 60).padStart(2, '0')}`);

describe('availableSlots', () => {
  it('has nothing on Sundays and Mondays, when the salon is closed', () => {
    expect(availableSlots({ date: '2026-11-15', serviceId: 'cut-blowdry', stylistId: 'any', bookings: [], now: NOW })).toEqual([]);
    expect(availableSlots({ date: '2026-11-16', serviceId: 'cut-blowdry', stylistId: 'any', bookings: [], now: NOW })).toEqual([]);
  });

  it('only offers stylists who do the service and work that day', () => {
    // Only Jordan does men's cuts, and Jordan doesn't work Tuesdays.
    expect(availableSlots({ date: '2026-11-10', serviceId: 'mens-cut', stylistId: 'any', bookings: [], now: NOW })).toEqual([]);
    expect(availableSlots({ date: WED, serviceId: 'mens-cut', stylistId: 'any', bookings: [], now: NOW }).length).toBeGreaterThan(0);
  });

  it('fits the whole service inside opening hours and around lunch', () => {
    const slots = times(availableSlots({ date: WED, serviceId: 'cut-blowdry', stylistId: 'ayesha', bookings: [], now: NOW }));
    expect(slots[0]).toBe('09:00');
    expect(slots.at(-1)).toBe('17:00'); // 60 minutes before an 18:00 close
    expect(slots).toContain('12:00'); // finishes at 13:00, exactly when lunch starts
    expect(slots).not.toContain('12:15');
    expect(slots).not.toContain('13:15');
    expect(slots).toContain('13:30');
    expect(slots).toHaveLength(28);
  });

  it('stays open later on Thursdays', () => {
    const slots = times(availableSlots({ date: THU, serviceId: 'cut-blowdry', stylistId: 'ayesha', bookings: [], now: NOW }));
    expect(slots.at(-1)).toBe('18:00');
  });

  it('skips times that overlap an existing appointment', () => {
    const bookings = [booking({ start: toMinutes('10:00'), end: toMinutes('11:00') })];
    const slots = times(availableSlots({ date: WED, serviceId: 'cut-blowdry', stylistId: 'ayesha', bookings, now: NOW }));
    expect(slots).toContain('09:00');
    expect(slots).not.toContain('09:15');
    expect(slots).not.toContain('10:45');
    expect(slots).toContain('11:00');
  });

  it('frees up the time when an appointment is cancelled', () => {
    const bookings = [booking({ status: 'cancelled' })];
    const slots = times(availableSlots({ date: WED, serviceId: 'cut-blowdry', stylistId: 'ayesha', bookings, now: NOW }));
    expect(slots).toContain('10:00');
  });

  it('needs an hour’s notice on the day', () => {
    const slots = times(availableSlots({ date: '2026-11-10', serviceId: 'blowdry', stylistId: 'mia', bookings: [], now: NOW }));
    expect(slots[0]).toBe('10:00');
  });

  it('shows no past days and nothing beyond four weeks ahead', () => {
    expect(availableSlots({ date: '2026-11-04', serviceId: 'blowdry', stylistId: 'any', bookings: [], now: NOW })).toEqual([]);
    expect(availableSlots({ date: '2026-12-16', serviceId: 'blowdry', stylistId: 'any', bookings: [], now: NOW })).toEqual([]);
  });

  it('lists every free stylist for "any stylist"', () => {
    const bookings = [booking({ stylistId: 'lerato', start: toMinutes('09:00'), end: toMinutes('10:00') })];
    const [first] = availableSlots({ date: WED, serviceId: 'cut-blowdry', stylistId: 'any', bookings, now: NOW });
    expect(first.start).toBe(toMinutes('09:00'));
    expect(first.stylistIds.sort()).toEqual(['ayesha', 'mia']);
  });
});

describe('chooseStylist', () => {
  it('gives "any stylist" bookings to whoever is least busy that day', () => {
    const bookings = [
      booking({ stylistId: 'ayesha', start: toMinutes('14:00'), end: toMinutes('17:00') }),
      booking({ stylistId: 'mia', start: toMinutes('14:00'), end: toMinutes('15:00') }),
    ];
    expect(chooseStylist({ start: 540, stylistIds: ['ayesha', 'mia', 'lerato'] }, WED, bookings)).toBe('lerato');
    expect(chooseStylist({ start: 540, stylistIds: ['ayesha', 'mia'] }, WED, bookings)).toBe('mia');
  });
});

describe('hasClash', () => {
  it('detects double bookings for the same stylist only', () => {
    const existing = booking({ ref: 'LM-AAAAA' });
    expect(hasClash(booking({ start: toMinutes('10:30'), end: toMinutes('11:30') }), [existing])).toBe(true);
    expect(hasClash(booking({ stylistId: 'mia', start: toMinutes('10:30'), end: toMinutes('11:30') }), [existing])).toBe(false);
    expect(hasClash(booking({ start: toMinutes('11:00'), end: toMinutes('12:00') }), [existing])).toBe(false);
  });
});
