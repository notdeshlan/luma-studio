import { describe, expect, it } from 'vitest';
import { booking } from '../test/factories';
import { canChange, createBooking, makeRef, rescheduleBooking } from './bookings';
import { bookingToIcs } from './ics';
import { toMinutes } from './time';
import { validateCustomer } from './validation';

const NOW = new Date('2026-11-10T07:00:00Z'); // Tuesday 09:00 in Durban
const WED = '2026-11-11';
const customer = { name: '  Thandi Mokoena ', email: ' Thandi@Example.com ', phone: '082 123 4567' };

describe('createBooking', () => {
  it('books a free slot and tidies the customer details', () => {
    const result = createBooking(
      { serviceId: 'cut-blowdry', stylistId: 'ayesha', date: WED, start: toMinutes('09:00'), customer, notes: '' },
      [],
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.booking).toMatchObject({
      stylistId: 'ayesha',
      start: 540,
      end: 600,
      status: 'booked',
      customer: { name: 'Thandi Mokoena', email: 'thandi@example.com' },
    });
    expect(result.booking.ref).toMatch(/^LM-[A-Z2-9]{5}$/);
  });

  it('assigns a real stylist when the customer picks "any"', () => {
    const result = createBooking(
      { serviceId: 'mens-cut', stylistId: 'any', date: WED, start: toMinutes('09:00'), customer, notes: '' },
      [],
      NOW,
    );
    expect(result.ok && result.booking.stylistId).toBe('jordan');
  });

  it('refuses a slot that was taken in the meantime', () => {
    const taken = [booking({ start: toMinutes('09:00'), end: toMinutes('10:00') })];
    const result = createBooking(
      { serviceId: 'cut-blowdry', stylistId: 'ayesha', date: WED, start: toMinutes('09:30'), customer, notes: '' },
      taken,
      NOW,
    );
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/just booked/) });
  });
});

describe('rescheduleBooking', () => {
  it('can move a booking to overlap its own old time', () => {
    const original = booking({ ref: 'LM-MOVE1', start: toMinutes('10:00'), end: toMinutes('11:00') });
    const result = rescheduleBooking(original, WED, toMinutes('10:30'), [original], NOW);
    expect(result.ok && [result.booking.start, result.booking.end]).toEqual([630, 690]);
  });

  it('keeps the same stylist and refuses their busy times', () => {
    const original = booking({ ref: 'LM-MOVE2' });
    const other = booking({ ref: 'LM-OTHER', start: toMinutes('14:00'), end: toMinutes('15:00') });
    expect(rescheduleBooking(original, WED, toMinutes('14:00'), [original, other], NOW).ok).toBe(false);
  });
});

describe('canChange', () => {
  it('allows changes to upcoming bookings only', () => {
    expect(canChange(booking({ date: WED }), NOW)).toBe(true);
    expect(canChange(booking({ date: '2026-11-10', start: toMinutes('08:30') }), NOW)).toBe(false);
    expect(canChange(booking({ date: WED, status: 'cancelled' }), NOW)).toBe(false);
  });
});

describe('makeRef', () => {
  it('never repeats a reference that is already used', () => {
    let calls = 0;
    const fakeRandom = () => (calls++ < 5 ? 0 : 0.5);
    expect(makeRef(new Set(['LM-AAAAA']), fakeRandom)).not.toBe('LM-AAAAA');
  });
});

describe('validateCustomer', () => {
  it('accepts South African numbers in common formats', () => {
    expect(validateCustomer({ ...customer, phone: '082 123 4567' })).toEqual({});
    expect(validateCustomer({ ...customer, phone: '+27 82 123 4567' })).toEqual({});
    expect(validateCustomer({ ...customer, phone: '(031) 555-0187' })).toEqual({});
  });

  it('explains what is wrong with each field', () => {
    const errors = validateCustomer({ name: 'A', email: 'nope', phone: '123' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'phone']);
  });
});

describe('bookingToIcs', () => {
  it('writes the appointment in UTC so every calendar app shows the right time', () => {
    const ics = bookingToIcs(booking({ ref: 'LM-CAL01', start: toMinutes('09:30'), end: toMinutes('10:30') }), NOW);
    expect(ics).toContain('DTSTART:20261111T073000Z');
    expect(ics).toContain('DTEND:20261111T083000Z');
    expect(ics).toContain('UID:LM-CAL01@lumastudio.example');
  });
});
