import { useEffect, useRef, type CSSProperties } from 'react';
import { Avatar } from '../../components/common';
import { OPENING, STYLISTS, getService } from '../../data/salon';
import { workWindow } from '../../lib/availability';
import { STATUS_LABELS } from '../../lib/labels';
import { formatTime, salonNow, toMinutes, weekday } from '../../lib/time';
import type { Booking } from '../../types';

const PX_PER_MIN = 1.5;

interface Props {
  date: string;
  bookings: readonly Booking[];
  now: Date;
  showCancelled: boolean;
  onSelect: (ref: string) => void;
}

/** A day view with one column per stylist, like a paper appointment book. */
export function Schedule({ date, bookings, now, showCancelled, onSelect }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const hours = OPENING[weekday(date)];
  const current = salonNow(now);
  const isToday = current.date === date;

  // Open each day at the top, or today at the current time.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !hours) return;
    const target = isToday ? (current.minutes - toMinutes(hours.open) - 60) * PX_PER_MIN : 0;
    el.scrollTop = Math.max(0, target);
    // Deliberately only when the day changes, not on every clock tick.
  }, [date]);

  if (!hours) {
    return (
      <div className="schedule-closed">
        <p>
          <strong>The salon is closed on this day.</strong> We're open Tuesday to Saturday.
        </p>
      </div>
    );
  }

  const dayStart = toMinutes(hours.open);
  const dayEnd = toMinutes(hours.close);
  const height = (dayEnd - dayStart) * PX_PER_MIN;
  const y = (minutes: number) => (minutes - dayStart) * PX_PER_MIN;
  const hourMarks = Array.from({ length: Math.floor((dayEnd - dayStart) / 60) + 1 }, (_, i) => dayStart + i * 60);

  const showNow = isToday && current.minutes >= dayStart && current.minutes <= dayEnd;

  return (
    <div ref={scroller} className="schedule" role="region" aria-label="Appointments by stylist" tabIndex={0}>
      <div className="schedule-grid" style={{ '--cols': STYLISTS.length } as CSSProperties}>
        <div className="schedule-corner" />
        {STYLISTS.map((s) => (
          <div key={s.id} className="schedule-head">
            <Avatar stylist={s} size={30} />
            <span>{s.name.split(' ')[0]}</span>
          </div>
        ))}

        <div className="schedule-times" style={{ height }}>
          {hourMarks.map((m) => (
            <span key={m} style={{ top: y(m) }}>
              {formatTime(m)}
            </span>
          ))}
        </div>

        {STYLISTS.map((stylist) => {
          const window = workWindow(stylist, date);
          const items = bookings
            .filter((b) => b.stylistId === stylist.id && b.date === date && (showCancelled || b.status !== 'cancelled'))
            .sort((a, b) => a.start - b.start);
          return (
            <div
              key={stylist.id}
              className={`schedule-col${window ? '' : ' is-off'}`}
              style={{ height, '--c': stylist.color } as CSSProperties}
            >
              {hourMarks.map((m) => (
                <span key={m} className="hour-line" style={{ top: y(m) }} />
              ))}
              {!window && <span className="off-label">Off today</span>}
              {window && (
                <span
                  className="break-block"
                  style={{ top: y(window.breakStart), height: (window.breakEnd - window.breakStart) * PX_PER_MIN }}
                >
                  Lunch
                </span>
              )}
              {items.map((b) => {
                const service = getService(b.serviceId);
                const blockHeight = (b.end - b.start) * PX_PER_MIN - 3;
                return (
                  <button
                    key={b.ref}
                    type="button"
                    className={`appt appt-${b.status}${blockHeight < 40 ? ' is-short' : ''}`}
                    style={{ top: y(b.start) + 1, height: blockHeight }}
                    onClick={() => onSelect(b.ref)}
                    aria-label={`${formatTime(b.start)} to ${formatTime(b.end)}: ${service?.name} for ${b.customer.name} with ${stylist.name}. ${STATUS_LABELS[b.status]}.`}
                  >
                    <span className="appt-time">
                      {formatTime(b.start)}–{formatTime(b.end)}
                    </span>
                    <span className="appt-title">{service?.name}</span>
                    {blockHeight >= 60 && <span className="appt-client">{b.customer.name}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}

        {showNow && (
          <div className="now-line" style={{ top: y(current.minutes) }} aria-hidden="true">
            <span>{formatTime(current.minutes)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
