import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Logo } from '../../components/common';
import { Icon } from '../../components/Icon';
import { SERVICES, STYLISTS, getService, getStylist } from '../../data/salon';
import { occupies, workWindow } from '../../lib/availability';
import { bookingStore, useBookings, useNow } from '../../lib/store';
import {
  addDays,
  formatDateLong,
  formatDayMonth,
  formatDayName,
  formatPrice,
  formatTime,
  salonNow,
} from '../../lib/time';
import type { Booking } from '../../types';
import { BookingPanel } from './BookingPanel';
import { Schedule } from './Schedule';

const priceOf = (b: Booking) => getService(b.serviceId)?.price ?? 0;
/** Revenue counts appointments that happened or are still expected to. */
const earns = (b: Booking) => b.status === 'booked' || b.status === 'completed';

function dayStats(bookings: readonly Booking[], date: string) {
  const day = bookings.filter((b) => b.date === date);
  const active = day.filter(occupies);
  const workMinutes = STYLISTS.reduce((sum, s) => {
    const w = workWindow(s, date);
    return w ? sum + (w.close - w.open) - (w.breakEnd - w.breakStart) : sum;
  }, 0);
  const bookedMinutes = active.reduce((sum, b) => sum + b.end - b.start, 0);
  return {
    appointments: day.filter(earns).length,
    revenue: day.filter(earns).reduce((sum, b) => sum + priceOf(b), 0),
    utilisation: workMinutes ? Math.round((bookedMinutes / workMinutes) * 100) : 0,
    noShows: day.filter((b) => b.status === 'no-show').length,
    cancelled: day.filter((b) => b.status === 'cancelled').length,
  };
}

function greeting(minutes: number) {
  return minutes < 12 * 60 ? 'Good morning' : minutes < 17 * 60 ? 'Good afternoon' : 'Good evening';
}

export function AdminPage() {
  const bookings = useBookings();
  const now = useNow();
  const current = salonNow(now);
  const [date, setDate] = useState(current.date);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard | Luma Hair Studio';
    return () => {
      document.title = 'Luma Hair Studio | Book online in Morningside, Durban';
    };
  }, []);

  useEffect(() => {
    if (!confirmReset) return;
    const id = window.setTimeout(() => setConfirmReset(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmReset]);

  const stats = useMemo(() => dayStats(bookings, date), [bookings, date]);
  const lastWeek = useMemo(() => dayStats(bookings, addDays(date, -7)), [bookings, date]);

  const chart = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const day = addDays(date, i - 6);
        return { date: day, revenue: dayStats(bookings, day).revenue };
      }),
    [bookings, date],
  );
  const chartMax = Math.max(1, ...chart.map((d) => d.revenue));

  const upNext = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'booked' && (b.date > current.date || (b.date === current.date && b.end > current.minutes)))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
        .slice(0, 6),
    [bookings, current.date, current.minutes],
  );

  const popular = useMemo(() => {
    const from = addDays(current.date, -30);
    const counts = new Map<string, number>();
    for (const b of bookings) {
      if (b.date >= from && b.date <= current.date && b.status === 'completed') {
        counts.set(b.serviceId, (counts.get(b.serviceId) ?? 0) + 1);
      }
    }
    return SERVICES.map((s) => ({ service: s, count: counts.get(s.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings, current.date]);
  const popularMax = Math.max(1, ...popular.map((p) => p.count));

  const selectedBooking = bookings.find((b) => b.ref === selected);
  const closePanel = useCallback(() => setSelected(null), []);

  const change = (value: number, previous: number) => {
    if (!previous) return null;
    const pct = Math.round(((value - previous) / previous) * 100);
    return { pct, up: pct >= 0 };
  };
  const revenueChange = change(stats.revenue, lastWeek.revenue);

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <Logo to="/admin" subtitle="Dashboard" />
          <span className="demo-pill">Demo: no sign-in needed</span>
          <div className="admin-bar-actions">
            <button
              type="button"
              className={`btn btn-small ${confirmReset ? 'btn-danger' : 'btn-quiet'}`}
              onClick={() => {
                if (confirmReset) {
                  bookingStore.reset();
                  setConfirmReset(false);
                  setSelected(null);
                } else setConfirmReset(true);
              }}
            >
              <Icon name="refresh" size={16} /> {confirmReset ? 'Click again to reset' : 'Reset demo data'}
            </button>
            <Link className="btn btn-ghost btn-small" to="/">
              View site
            </Link>
          </div>
        </div>
      </header>

      <main className="admin-main" id="main">
        <div className="admin-head">
          <div>
            <p className="muted">{greeting(current.minutes)}, Luma team</p>
            <h1>{date === current.date ? 'Today' : formatDateLong(date)}</h1>
            {date === current.date && <p className="muted">{formatDateLong(date)}</p>}
          </div>
          <div className="date-nav" role="group" aria-label="Choose a day">
            <button type="button" className="icon-button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setDate(current.date)} disabled={date === current.date}>
              Today
            </button>
            <button type="button" className="icon-button" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
              <Icon name="chevronRight" />
            </button>
            <label className="sr-only" htmlFor="admin-date">
              Go to date
            </label>
            <input id="admin-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
        </div>

        <section className="kpis" aria-label="Day summary">
          <div className="kpi">
            <span className="kpi-label">Appointments</span>
            <strong className="kpi-value">{stats.appointments}</strong>
            <span className="kpi-foot">{lastWeek.appointments} on the same day last week</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Revenue</span>
            <strong className="kpi-value">{formatPrice(stats.revenue)}</strong>
            <span className="kpi-foot">
              {revenueChange ? (
                <span className={revenueChange.up ? 'trend-up' : 'trend-down'}>
                  {revenueChange.up ? '▲' : '▼'} {Math.abs(revenueChange.pct)}%
                </span>
              ) : (
                '–'
              )}{' '}
              vs last week
            </span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Chair time booked</span>
            <strong className="kpi-value">{stats.utilisation}%</strong>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${Math.min(100, stats.utilisation)}%` }} />
            </span>
          </div>
          <div className="kpi">
            <span className="kpi-label">No-shows & cancellations</span>
            <strong className="kpi-value">
              {stats.noShows} <span className="kpi-sep">/</span> {stats.cancelled}
            </strong>
            <span className="kpi-foot">Keep an eye on repeat no-shows</span>
          </div>
        </section>

        <div className="admin-grid">
          <section className="admin-card schedule-card" aria-labelledby="schedule-title">
            <div className="admin-card-head">
              <h2 id="schedule-title">Schedule</h2>
              <label className="toggle-label">
                <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Show
                cancelled
              </label>
            </div>
            <Schedule date={date} bookings={bookings} now={now} showCancelled={showCancelled} onSelect={setSelected} />
          </section>

          <div className="admin-side">
            <section className="admin-card" aria-labelledby="next-title">
              <h2 id="next-title">Up next</h2>
              {upNext.length === 0 ? (
                <p className="muted">Nothing else booked.</p>
              ) : (
                <ul className="up-next">
                  {upNext.map((b) => (
                    <li key={b.ref}>
                      <button
                        type="button"
                        onClick={() => {
                          setDate(b.date);
                          setSelected(b.ref);
                        }}
                        style={{ '--c': getStylist(b.stylistId)?.color } as CSSProperties}
                      >
                        <span className="up-next-time">
                          {b.date === current.date ? formatTime(b.start) : `${formatDayName(b.date)} ${formatTime(b.start)}`}
                        </span>
                        <span className="up-next-main">
                          <strong>{b.customer.name}</strong>
                          {getService(b.serviceId)?.name} · {getStylist(b.stylistId)?.name.split(' ')[0]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-card" aria-labelledby="popular-title">
              <h2 id="popular-title">Most booked, last 30 days</h2>
              <ul className="bar-list">
                {popular.map(({ service, count }) => (
                  <li key={service.id}>
                    <span className="bar-list-label">
                      {service.name}
                      <strong>{count}</strong>
                    </span>
                    <span className="bar-track" aria-hidden="true">
                      <span style={{ width: `${(count / popularMax) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="admin-card" aria-labelledby="revenue-title">
          <div className="admin-card-head">
            <h2 id="revenue-title">Revenue, two weeks around {date === current.date ? 'today' : formatDayMonth(date)}</h2>
            <span className="legend">
              <span className="legend-swatch is-past" /> Earned <span className="legend-swatch is-future" /> Booked ahead
            </span>
          </div>
          <div className="chart" role="list">
            {chart.map((d) => (
              <button
                key={d.date}
                type="button"
                role="listitem"
                className={`chart-bar${d.date === date ? ' is-selected' : ''}${d.date > current.date ? ' is-future' : ''}`}
                onClick={() => setDate(d.date)}
                aria-label={`${formatDateLong(d.date)}: ${formatPrice(d.revenue)}`}
                title={`${formatDateLong(d.date)}: ${formatPrice(d.revenue)}`}
              >
                <span className="chart-value">{d.revenue ? `R${Math.round(d.revenue / 100) / 10}k` : ''}</span>
                <span className="chart-fill" style={{ height: `${(d.revenue / chartMax) * 100}%` }} />
                <span className="chart-label">
                  {formatDayName(d.date)}
                  <small>{formatDayMonth(d.date)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {selectedBooking && <BookingPanel booking={selectedBooking} bookings={bookings} onClose={closePanel} />}
    </div>
  );
}
