import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Avatar, StatusBadge } from '../components/common';
import { Icon } from '../components/Icon';
import { SALON, getService, getStylist } from '../data/salon';
import { canChange } from '../lib/bookings';
import { downloadIcs } from '../lib/ics';
import { bookingStore, useBookings, useNow } from '../lib/store';
import { formatDateLong, formatDuration, formatPrice, formatTime } from '../lib/time';

/** The customer's view of one booking: confirmation, details and self-service changes. */
export function BookingPage() {
  const { ref = '' } = useParams();
  const location = useLocation();
  const notice = (location.state as { notice?: 'booked' | 'moved' } | null)?.notice;
  const bookings = useBookings();
  const now = useNow();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const booking = bookings.find((b) => b.ref === ref.toUpperCase());
  if (!booking) {
    return (
      <div className="container page empty-state">
        <h1>We couldn't find booking {ref}</h1>
        <p className="lead">Check the reference in your confirmation email, or look it up with your email address.</p>
        <Link className="btn btn-primary" to="/my-bookings">
          Find my bookings
        </Link>
      </div>
    );
  }

  const service = getService(booking.serviceId)!;
  const stylist = getStylist(booking.stylistId)!;
  const changeable = canChange(booking, now);
  const firstName = booking.customer.name.split(' ')[0];

  return (
    <div className="container page narrow">
      {notice && booking.status === 'booked' && (
        <div className="success-banner" role="status">
          <span className="success-icon">
            <Icon name="check" size={28} />
          </span>
          <div>
            <h1>{notice === 'moved' ? 'Your booking has moved' : `You're booked in, ${firstName}!`}</h1>
            <p>
              We've sent the details to <strong>{booking.customer.email}</strong> and will text a reminder the day
              before.
            </p>
          </div>
        </div>
      )}
      {!notice && (
        <header className="page-head">
          <p className="eyebrow">Booking {booking.ref}</p>
          <h1>{service.name}</h1>
        </header>
      )}

      <article className="card booking-card">
        <div className="booking-card-head">
          <div>
            <p className="muted small">Reference</p>
            <p className="ref">{booking.ref}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="booking-when">
          <Icon name="calendar" size={24} />
          <div>
            <strong>{formatDateLong(booking.date)}</strong>
            <span>
              {formatTime(booking.start)} – {formatTime(booking.end)} ({formatDuration(service.duration)})
            </span>
          </div>
        </div>

        <dl className="details-list">
          <div>
            <dt>Service</dt>
            <dd>{service.name}</dd>
          </div>
          <div>
            <dt>Stylist</dt>
            <dd className="with-avatar">
              <Avatar stylist={stylist} size={32} />
              {stylist.name}
            </dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(service.price)}, paid in the studio</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>
              {SALON.street}, {SALON.area}
            </dd>
          </div>
          {booking.notes && (
            <div>
              <dt>Your notes</dt>
              <dd>{booking.notes}</dd>
            </div>
          )}
        </dl>

        {changeable && (
          <div className="booking-actions">
            <button type="button" className="btn btn-ghost" onClick={() => downloadIcs(booking)}>
              <Icon name="download" size={18} /> Add to calendar
            </button>
            <Link className="btn btn-ghost" to={`/book?reschedule=${booking.ref}`}>
              <Icon name="refresh" size={18} /> Change time
            </Link>
            {confirmingCancel ? (
              <span className="confirm-inline" role="group" aria-label="Confirm cancellation">
                <span>Cancel this appointment?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => {
                    bookingStore.update(booking.ref, { status: 'cancelled' });
                    setConfirmingCancel(false);
                  }}
                >
                  Yes, cancel it
                </button>
                <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmingCancel(false)}>
                  Keep it
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmingCancel(true)}>
                Cancel booking
              </button>
            )}
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="booking-actions">
            <p className="muted">This appointment was cancelled.</p>
            <Link className="btn btn-primary" to={`/book?service=${booking.serviceId}&stylist=${booking.stylistId}`}>
              Book again
            </Link>
          </div>
        )}
      </article>

      <p className="note">
        Demo app: no emails or texts are really sent. Bookings are stored in this browser, so the salon dashboard on this
        device sees them straight away. <Link to="/admin">Open the dashboard</Link>
      </p>
    </div>
  );
}
