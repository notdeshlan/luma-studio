/** The salon keeps Durban time, whatever time zone the visitor is in. Durban is UTC+2 all year. */
export const TIMEZONE = 'Africa/Johannesburg';
export const UTC_OFFSET_MIN = 120;

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

const nowFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Today's date (YYYY-MM-DD) and minutes past midnight at the salon. */
export function salonNow(now: Date): { date: string; minutes: number } {
  const parts: Record<string, string> = {};
  for (const part of nowFormat.formatToParts(now)) parts[part.type] = part.value;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

export function addDays(date: string, days: number): string {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return utc(date).getUTCDay();
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);
}

// en-GB gives "Friday 6 November" (en-ZA zero-pads the day and adds commas).
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayName = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export const formatDateLong = (date: string) => longDate.format(utc(date));
export const formatDateShort = (date: string) => shortDate.format(utc(date));
export const formatDayName = (date: string) => dayName.format(utc(date));
export const formatDayMonth = (date: string) => dayMonth.format(utc(date));

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const formatPrice = (rand: number) => `R${rand.toLocaleString('en-ZA')}`;

/** A salon-local date and time as a real instant. */
export function toInstant(date: string, minutes: number): Date {
  return new Date(utc(date).getTime() + (minutes - UTC_OFFSET_MIN) * 60_000);
}
