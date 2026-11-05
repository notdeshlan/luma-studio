import { SERVICES, STYLISTS } from '../data/salon';
import type { Booking, BookingStatus, Customer } from '../types';
import { SLOT_STEP, workWindow } from './availability';
import { makeRef } from './bookings';
import { addDays, salonNow, toInstant } from './time';

/** Small seeded random generator, so the demo data is the same for everyone on a given day. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const FIRST = ['Thandeka', 'Sipho', 'Priya', 'Kayla', 'Ruan', 'Naledi', 'Zanele', 'Michelle', 'Kyle', 'Fatima', 'Lindiwe', 'Ashley', 'Tumi', 'Megan', 'Yusuf', 'Chloe', 'Bongani', 'Sarah', 'Nomvula', 'Dylan', 'Aaliyah', 'Jess', 'Keshni', 'Lwazi'];
const LAST = ['Mokoena', 'Govender', 'Botha', 'Ndlovu', 'Khan', 'Smith', 'Mthembu', 'Reddy', 'Zulu', 'Maharaj', 'Adams', 'Nkosi', 'Petersen', 'Chetty', 'Dube', 'Jacobs', 'Moodley', 'Fourie'];
/** How often each service is booked relative to the others, so the demo looks like a real diary. */
const POPULARITY: Record<string, number> = {
  'cut-blowdry': 10,
  'mens-cut': 9,
  blowdry: 7,
  roots: 5,
  'kids-cut': 3,
  'full-colour': 3,
  balayage: 3,
  toner: 3,
  'deep-condition': 2,
  scalp: 2,
  keratin: 1,
  event: 1,
  'bridal-trial': 1,
  fringe: 1,
};

const NOTES = ['First visit', 'Bringing reference photos', 'Sensitive scalp', 'Running from work, may be 5 min late', 'Same as last time please', 'Matric dance on Saturday'];

export function generateDemoBookings(now: Date): Booking[] {
  const { date: today, minutes: nowMinutes } = salonNow(now);
  const random = mulberry32(hash(today));
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  const pickWeighted = <T extends { id: string }>(items: readonly T[]) => {
    const total = items.reduce((sum, item) => sum + (POPULARITY[item.id] ?? 1), 0);
    let roll = random() * total;
    for (const item of items) {
      roll -= POPULARITY[item.id] ?? 1;
      if (roll < 0) return item;
    }
    return items[items.length - 1];
  };

  const customers: Customer[] = Array.from({ length: 48 }, () => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const phone = `08${Math.floor(random() * 4) + 2} ${String(Math.floor(random() * 900) + 100)} ${String(Math.floor(random() * 9000) + 1000)}`;
    return { name: `${first} ${last}`, email: `${first}.${last}@example.com`.toLowerCase().replace(/\s+/g, ''), phone };
  });

  const bookings: Booking[] = [];
  const refs = new Set<string>();

  for (let offset = -35; offset <= 21; offset++) {
    const date = addDays(today, offset);
    // Busier in the coming days, emptier further out, as a real diary is.
    const fill = offset > 10 ? 0.25 : offset > 3 ? 0.5 : 0.72;

    for (const stylist of STYLISTS) {
      const window = workWindow(stylist, date);
      if (!window) continue;

      let t = window.open;
      while (t < window.close) {
        if (t >= window.breakStart && t < window.breakEnd) {
          t = window.breakEnd;
          continue;
        }
        if (random() > fill) {
          t += pick([15, 30, 30, 45, 60]);
          continue;
        }
        const fits = SERVICES.filter(
          (s) =>
            stylist.services.includes(s.id) &&
            t + s.duration <= window.close &&
            !(t < window.breakEnd && window.breakStart < t + s.duration),
        );
        if (!fits.length) {
          t += SLOT_STEP;
          continue;
        }

        const service = pickWeighted(fits);
        // Short services shouldn't fill every gap; leave some of them free.
        if (service.duration < 30 && random() < 0.6) {
          t += SLOT_STEP;
          continue;
        }
        const end = t + service.duration;
        const past = date < today || (date === today && end <= nowMinutes);
        const roll = random();
        const status: BookingStatus = past
          ? roll < 0.05 ? 'no-show' : roll < 0.11 ? 'cancelled' : 'completed'
          : roll < 0.05 ? 'cancelled' : 'booked';
        const ref = makeRef(refs, random);
        refs.add(ref);
        const bookedDaysBefore = Math.floor(random() * 14) + 1;

        bookings.push({
          ref,
          serviceId: service.id,
          stylistId: stylist.id,
          date,
          start: t,
          end,
          customer: pick(customers),
          notes: random() < 0.15 ? pick(NOTES) : '',
          status,
          createdAt: toInstant(addDays(date, -bookedDaysBefore), 600).toISOString(),
        });
        t = end;
      }
    }
  }
  return bookings;
}
