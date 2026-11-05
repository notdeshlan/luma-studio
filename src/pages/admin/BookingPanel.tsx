import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Avatar, StatusBadge } from '../../components/common';
import { Icon } from '../../components/Icon';
import { getService, getStylist } from '../../data/salon';
import { hasClash } from '../../lib/availability';
import { bookingStore } from '../../lib/store';
import { formatDateLong, formatDuration, formatPrice, formatTime } from '../../lib/time';
import type { Booking, BookingStatus } from '../../types';

interface Props {
  booking: Booking;
  bookings: readonly Booking[];
  onClose: () => void;
}

/** Side panel with an appointment's details and the actions front-of-house needs. */
export function BookingPanel({ booking, bookings, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const service = getService(booking.serviceId)!;
  const stylist = getStylist(booking.stylistId)!;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const setStatus = (status: BookingStatus) => bookingStore.update(booking.ref, { status });
  const canRestore = !hasClash({ ...booking, status: 'booked' }, bookings);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <aside
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <StatusBadge status={booking.status} />
          <button ref={closeButton} type="button" className="icon-button" onClick={onClose} aria-label="Close details">
            <Icon name="close" />
          </button>
        </div>
        <h2 id="panel-title">{service.name}</h2>
        <p className="panel-when">
          {formatDateLong(booking.date)}
          <br />
          <strong>
            {formatTime(booking.start)} – {formatTime(booking.end)}
          </strong>{' '}
          · {formatDuration(service.duration)}
        </p>

        <dl className="details-list compact">
          <div>
            <dt>Client</dt>
            <dd>
              <strong>{booking.customer.name}</strong>
              <br />
              <a href={`tel:${booking.customer.phone.replace(/\s/g, '')}`}>{booking.customer.phone}</a>
              <br />
              <a href={`mailto:${booking.customer.email}`}>{booking.customer.email}</a>
            </dd>
          </div>
          <div>
            <dt>Stylist</dt>
            <dd className="with-avatar">
              <Avatar stylist={stylist} size={28} /> {stylist.name}
            </dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(service.price)}</dd>
          </div>
          {booking.notes && (
            <div>
              <dt>Notes</dt>
              <dd>{booking.notes}</dd>
            </div>
          )}
          <div>
            <dt>Reference</dt>
            <dd>
              <Link to={`/booking/${booking.ref}`}>{booking.ref}</Link>
            </dd>
          </div>
        </dl>

        <div className="panel-actions">
          {booking.status === 'booked' && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => setStatus('completed')}>
                <Icon name="check" size={18} /> Mark as done
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setStatus('no-show')}>
                No-show
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setStatus('cancelled')}>
                Cancel appointment
              </button>
            </>
          )}
          {(booking.status === 'completed' || booking.status === 'no-show') && (
            <button type="button" className="btn btn-ghost" onClick={() => setStatus('booked')}>
              Undo: mark as booked
            </button>
          )}
          {booking.status === 'cancelled' &&
            (canRestore ? (
              <button type="button" className="btn btn-ghost" onClick={() => setStatus('booked')}>
                Restore appointment
              </button>
            ) : (
              <p className="muted small">This slot has been rebooked, so the appointment can't be restored.</p>
            ))}
        </div>
      </aside>
    </div>
  );
}
