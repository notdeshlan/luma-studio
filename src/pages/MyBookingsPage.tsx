import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '../components/common';
import { Icon } from '../components/Icon';
import { getService, getStylist } from '../data/salon';
import { canChange } from '../lib/bookings';
import { useBookings, useNow } from '../lib/store';
import { formatDateShort, formatTime } from '../lib/time';
import type { Booking } from '../types';

export function MyBookingsPage() {
  const bookings = useBookings();
  const now = useNow();
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState('');

  // A demo customer with something coming up, so visitors can try this page without booking first.
  const demoEmail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookings) if (canChange(b, now)) counts.set(b.customer.email, (counts.get(b.customer.email) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  }, [bookings, now]);

  const results = useMemo(() => {
    if (!searched) return null;
    const mine = bookings
      .filter((b) => b.customer.email === searched)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
    return {
      upcoming: mine.filter((b) => canChange(b, now)),
      past: mine.filter((b) => !canChange(b, now)).reverse(),
    };
  }, [bookings, searched, now]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setSearched(email.trim().toLowerCase());
  };

  return (
    <div className="container page narrow">
      <header className="page-head">
        <p className="eyebrow">My bookings</p>
        <h1>Change or cancel an appointment</h1>
        <p className="lead">Enter the email you booked with to see your appointments.</p>
      </header>

      <form className="card lookup" onSubmit={search} role="search">
        <label htmlFor="lookup-email">Email address</label>
        <div className="lookup-row">
          <input
            id="lookup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit" className="btn btn-primary">
            <Icon name="search" size={18} /> Find bookings
          </button>
        </div>
        {demoEmail && (
          <p className="muted small">
            Just looking?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setEmail(demoEmail);
                setSearched(demoEmail);
              }}
            >
              Try a demo customer
            </button>
          </p>
        )}
        <p className="muted small">
          In a live system we'd email you a secure sign-in link first. This demo skips that step.
        </p>
      </form>

      {results && (
        <div aria-live="polite">
          {results.upcoming.length + results.past.length === 0 ? (
            <div className="empty-state compact">
              <p>
                No bookings found for <strong>{searched}</strong>. Check the spelling, or{' '}
                <Link to="/book">make a new booking</Link>.
              </p>
            </div>
          ) : (
            <>
              <BookingList title="Coming up" items={results.upcoming} empty="Nothing booked right now." />
              <BookingList title="Past and cancelled" items={results.past} empty="No past appointments yet." />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BookingList({ title, items, empty }: { title: string; items: Booking[]; empty: string }) {
  return (
    <section className="booking-list" aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul>
          {items.map((b) => (
            <li key={b.ref}>
              <Link to={`/booking/${b.ref}`} className="booking-row">
                <span className="booking-row-date">
                  <strong>{formatDateShort(b.date)}</strong>
                  {formatTime(b.start)}
                </span>
                <span className="booking-row-main">
                  <strong>{getService(b.serviceId)?.name}</strong>
                  with {getStylist(b.stylistId)?.name}
                </span>
                <StatusBadge status={b.status} />
                <Icon name="chevronRight" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
