import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { OPENING } from '../data/salon';
import { DAY_LABELS, STATUS_LABELS } from '../lib/labels';
import { salonNow, weekday } from '../lib/time';
import type { BookingStatus, Stylist } from '../types';

export function Logo({ to = '/', subtitle = 'Hair Studio' }: { to?: string; subtitle?: string }) {
  return (
    <Link className="logo" to={to} aria-label={`Luma ${subtitle}, home`}>
      <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="12" className="logo-bg" />
        <path d="M12 30V16a8 8 0 0 1 16 0v14" fill="none" className="logo-arch" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="20" cy="16" r="3" className="logo-dot" />
      </svg>
      <span className="logo-text">
        Luma <span>{subtitle}</span>
      </span>
    </Link>
  );
}

export function Avatar({ stylist, size = 48 }: { stylist: Stylist; size?: number }) {
  const initials = stylist.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
  return (
    <span className="avatar" style={{ '--c': stylist.color, width: size, height: size, fontSize: size * 0.36 } as CSSProperties} aria-hidden="true">
      {initials}
    </span>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

/** Weekly opening hours, Tuesday first, with today highlighted. */
export function OpeningHours({ now }: { now: Date }) {
  const today = weekday(salonNow(now).date);
  return (
    <ul className="hours">
      {[2, 3, 4, 5, 6, 0, 1].map((day) => {
        const hours = OPENING[day];
        return (
          <li key={day} className={day === today ? 'is-today' : undefined} aria-current={day === today ? 'date' : undefined}>
            <span>
              {DAY_LABELS[day]}
              {day === today && <small>Today</small>}
            </span>
            <span>{hours ? `${hours.open} – ${hours.close}` : 'Closed'}</span>
          </li>
        );
      })}
    </ul>
  );
}
