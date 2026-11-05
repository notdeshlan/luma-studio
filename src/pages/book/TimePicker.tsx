import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { BOOKING_WINDOW_DAYS, availableSlots, isSalonOpen } from '../../lib/availability';
import { addDays, formatDateLong, formatDayMonth, formatDayName, formatTime, salonNow } from '../../lib/time';
import type { Booking } from '../../types';

interface Props {
  serviceId: string;
  stylistId: string;
  date: string;
  start: number | null;
  bookings: readonly Booking[];
  now: Date;
  excludeRef?: string;
  onPick: (date: string, start: number | null) => void;
}

const PERIODS = [
  { label: 'Morning', from: 0, to: 12 * 60 },
  { label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { label: 'Evening', from: 17 * 60, to: 24 * 60 },
];

export function TimePicker({ serviceId, stylistId, date, start, bookings, now, excludeRef, onPick }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const today = salonNow(now).date;

  const days = useMemo(
    () =>
      Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
        const day = addDays(today, i);
        const slots = availableSlots({ date: day, serviceId, stylistId, bookings, now, excludeRef });
        return { date: day, open: isSalonOpen(day), slots };
      }),
    [today, serviceId, stylistId, bookings, now, excludeRef],
  );

  const selected = days.find((d) => d.date === date && d.slots.length) ?? days.find((d) => d.slots.length);

  // Keep the chosen date visible in the strip, e.g. when the first free day is two weeks out.
  useEffect(() => {
    const el = strip.current;
    const chip = el?.querySelector<HTMLElement>('.is-selected');
    if (!el || !chip) return;
    const left = chip.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft || left + chip.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollLeft = Math.max(0, left - el.clientWidth / 2 + chip.offsetWidth / 2);
    }
  }, [selected?.date]);

  if (!selected) {
    return (
      <div className="empty-state compact">
        <p>
          <strong>No free times in the next four weeks.</strong> Try another stylist, or call us on 031 555 0187 and
          we'll do our best to fit you in.
        </p>
      </div>
    );
  }

  const scroll = (direction: number) => strip.current?.scrollBy?.({ left: direction * strip.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="time-picker">
      <div className="date-strip-wrap">
        <button type="button" className="icon-button strip-arrow" onClick={() => scroll(-1)} aria-label="Earlier dates">
          <Icon name="chevronLeft" />
        </button>
        <div className="date-strip" ref={strip} role="group" aria-label="Choose a date">
          {days.map((day) => {
            const count = day.slots.length;
            const isSelected = day.date === selected.date;
            const times = `${count} ${count === 1 ? 'time' : 'times'}`;
            const status = !day.open ? 'Closed' : count ? times : 'Full';
            return (
              <button
                key={day.date}
                type="button"
                className={`date-chip${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                disabled={!count}
                aria-label={`${formatDateLong(day.date)}: ${count ? `${times} available` : day.open ? 'fully booked' : 'closed'}`}
                onClick={() => onPick(day.date, null)}
              >
                <span className="date-chip-day">{day.date === today ? 'Today' : formatDayName(day.date)}</span>
                <span className="date-chip-date">{formatDayMonth(day.date)}</span>
                <span className="date-chip-status">{status}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="icon-button strip-arrow" onClick={() => scroll(1)} aria-label="Later dates">
          <Icon name="chevronRight" />
        </button>
      </div>

      <h3 className="slots-title">{formatDateLong(selected.date)}</h3>
      {PERIODS.map((period) => {
        const slots = selected.slots.filter((s) => s.start >= period.from && s.start < period.to);
        if (!slots.length) return null;
        return (
          <div key={period.label} className="slot-group">
            <h4>{period.label}</h4>
            <div className="slots" role="group" aria-label={`${period.label} times`}>
              {slots.map((slot) => {
                const isSelected = selected.date === date && slot.start === start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    className={`slot${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onPick(selected.date, slot.start)}
                  >
                    {formatTime(slot.start)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
