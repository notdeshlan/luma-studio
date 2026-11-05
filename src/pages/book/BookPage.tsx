import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '../../components/common';
import { Icon } from '../../components/Icon';
import { CATEGORIES, SERVICES, getService, getStylist, stylistsForService } from '../../data/salon';
import { nextAvailable } from '../../lib/availability';
import { canChange, createBooking, rescheduleBooking } from '../../lib/bookings';
import { describeDays } from '../../lib/labels';
import { bookingStore, useBookings, useNow } from '../../lib/store';
import { formatDateLong, formatDateShort, formatDuration, formatPrice, formatTime } from '../../lib/time';
import { validateCustomer, type CustomerErrors } from '../../lib/validation';
import type { Customer } from '../../types';
import { TimePicker } from './TimePicker';

type StepId = 'service' | 'stylist' | 'time' | 'details' | 'review';

const STEP_LABELS: Record<StepId, string> = {
  service: 'Service',
  stylist: 'Stylist',
  time: 'Date & time',
  details: 'Your details',
  review: 'Confirm',
};

const STEP_TITLES: Record<StepId, string> = {
  service: 'What would you like done?',
  stylist: 'Who would you like to see?',
  time: 'When suits you?',
  details: 'Your details',
  review: 'Check and confirm',
};

export function BookPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookings = useBookings();
  const now = useNow();

  const rescheduleRef = params.get('reschedule');
  const original = rescheduleRef ? bookings.find((b) => b.ref === rescheduleRef) : undefined;
  const rescheduling = Boolean(original && canChange(original, now));

  const serviceParam = getService(params.get('service') ?? '')?.id ?? '';
  const stylistParam = params.get('stylist') ?? '';
  const linkedStylist = getStylist(stylistParam);
  const initialService = original?.serviceId ?? serviceParam;
  const initialStylist =
    original?.stylistId ??
    (stylistParam === 'any' && initialService
      ? 'any'
      : linkedStylist && (!initialService || linkedStylist.services.includes(initialService))
        ? linkedStylist.id
        : '');

  const [serviceId, setServiceId] = useState(initialService);
  const [stylistId, setStylistId] = useState(initialStylist);
  const [date, setDate] = useState(original?.date ?? '');
  const [start, setStart] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer>({ name: '', email: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [alert, setAlert] = useState('');
  const [step, setStep] = useState<StepId>(
    rescheduling ? 'time' : !initialService ? 'service' : !initialStylist ? 'stylist' : 'time',
  );

  const steps: StepId[] = rescheduling ? ['time', 'review'] : ['service', 'stylist', 'time', 'details', 'review'];
  const stepIndex = steps.indexOf(step);

  // Move focus to the new step's heading so keyboard and screen reader users know where they are.
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const service = getService(serviceId);
  const stylist = getStylist(stylistId);

  if (rescheduleRef && !rescheduling) {
    return (
      <div className="container page empty-state">
        <h1>This booking can't be moved online</h1>
        <p className="lead">It may already have happened or been cancelled. Call us on 031 555 0187 and we'll help.</p>
        <Link className="btn btn-primary" to="/book">
          Make a new booking
        </Link>
      </div>
    );
  }

  const chooseService = (id: string) => {
    setServiceId(id);
    setStart(null);
    if (stylistId !== 'any' && stylistId && !getStylist(stylistId)?.services.includes(id)) setStylistId('');
    setStep('stylist');
  };

  const chooseStylist = (id: string) => {
    setStylistId(id);
    setStart(null);
    setStep('time');
  };

  const submitDetails = (event: FormEvent) => {
    event.preventDefault();
    const found = validateCustomer(customer);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setStep('review');
  };

  const confirm = () => {
    if (start === null || !date) return;
    const result =
      rescheduling && original
        ? rescheduleBooking(original, date, start, bookings, new Date())
        : createBooking({ serviceId, stylistId, date, start, customer, notes }, bookings, new Date());

    if (!result.ok) {
      setAlert(result.error);
      setStart(null);
      setStep('time');
      return;
    }
    if (rescheduling) bookingStore.replace(result.booking);
    else bookingStore.add(result.booking);
    navigate(`/booking/${result.booking.ref}`, { state: { notice: rescheduling ? 'moved' : 'booked' } });
  };

  return (
    <div className="container page book">
      <header className="page-head">
        <p className="eyebrow">{rescheduling ? `Moving booking ${original?.ref}` : 'Book an appointment'}</p>
        <ol className="stepper" aria-label="Booking steps">
          {steps.map((id, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo';
            return (
              <li key={id} className={`step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                {state === 'done' ? (
                  <button type="button" onClick={() => setStep(id)}>
                    <span className="step-dot">
                      <Icon name="check" size={14} />
                    </span>
                    {STEP_LABELS[id]}
                  </button>
                ) : (
                  <span>
                    <span className="step-dot">{i + 1}</span>
                    {STEP_LABELS[id]}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </header>

      <div className="book-layout">
        <section className="card book-main" aria-labelledby="step-title">
          <h1 id="step-title" ref={heading} tabIndex={-1}>
            {STEP_TITLES[step]}
          </h1>

          {alert && (
            <p className="alert" role="alert">
              {alert}
            </p>
          )}

          {step === 'service' && <ServiceStep selected={serviceId} onChoose={chooseService} />}

          {step === 'stylist' && service && (
            <StylistStep serviceId={service.id} selected={stylistId} onChoose={chooseStylist} />
          )}

          {step === 'time' && service && stylistId && (
            <>
              <TimePicker
                serviceId={service.id}
                stylistId={stylistId}
                date={date}
                start={start}
                bookings={bookings}
                now={now}
                excludeRef={rescheduling ? original?.ref : undefined}
                onPick={(d, s) => {
                  setDate(d);
                  setStart(s);
                  setAlert('');
                }}
              />
              <div className="step-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={start === null}
                  onClick={() => setStep(rescheduling ? 'review' : 'details')}
                >
                  Continue <Icon name="arrowRight" size={18} />
                </button>
                {start === null && <p className="muted small">Choose a time to continue.</p>}
              </div>
            </>
          )}

          {step === 'details' && (
            <form className="form" noValidate onSubmit={submitDetails}>
              <Field id="name" label="Full name" error={errors.name}>
                <input
                  id="f-name"
                  autoComplete="name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'e-name' : undefined}
                />
              </Field>
              <div className="form-row">
                <Field id="email" label="Email" error={errors.email}>
                  <input
                    id="f-email"
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'e-email' : undefined}
                  />
                </Field>
                <Field id="phone" label="Mobile number" error={errors.phone}>
                  <input
                    id="f-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="082 123 4567"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'e-phone' : undefined}
                  />
                </Field>
              </div>
              <Field id="notes" label="Anything your stylist should know?" optional>
                <textarea
                  id="f-notes"
                  rows={3}
                  maxLength={300}
                  placeholder="First visit, allergies, the look you're after…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              <div className="step-actions">
                <button type="submit" className="btn btn-primary">
                  Review booking <Icon name="arrowRight" size={18} />
                </button>
              </div>
            </form>
          )}

          {step === 'review' && service && stylistId && start !== null && (
            <div className="review">
              <dl className="details-list">
                <div>
                  <dt>Service</dt>
                  <dd>
                    {service.name} · {formatDuration(service.duration)}
                  </dd>
                </div>
                <div>
                  <dt>Stylist</dt>
                  <dd>{stylist ? stylist.name : "First available (we'll assign one when you confirm)"}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>
                    {formatDateLong(date)} at {formatTime(start)}
                  </dd>
                </div>
                {!rescheduling && (
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {customer.name}
                      <br />
                      {customer.email} · {customer.phone}
                    </dd>
                  </div>
                )}
                {!rescheduling && notes.trim() && (
                  <div>
                    <dt>Notes</dt>
                    <dd>{notes}</dd>
                  </div>
                )}
                <div>
                  <dt>Price</dt>
                  <dd>{formatPrice(service.price)}, paid in the studio</dd>
                </div>
              </dl>
              <p className="note">
                Free changes and cancellations up to 24 hours before your appointment. You'll get a text reminder the day
                before.
              </p>
              <div className="step-actions">
                <button type="button" className="btn btn-primary btn-large" onClick={confirm}>
                  {rescheduling ? 'Move my booking' : 'Confirm booking'}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="card book-summary" aria-label="Your booking so far">
          <h2>Your booking</h2>
          <SummaryRow
            icon="scissors"
            label="Service"
            value={service ? `${service.name} · ${formatDuration(service.duration)}` : 'Not chosen yet'}
            onChange={!rescheduling && step !== 'service' && service ? () => setStep('service') : undefined}
          />
          <SummaryRow
            icon="user"
            label="Stylist"
            value={stylistId === 'any' ? 'First available' : stylist?.name ?? 'Not chosen yet'}
            onChange={!rescheduling && service && stylistId && step !== 'stylist' ? () => setStep('stylist') : undefined}
          />
          <SummaryRow
            icon="calendar"
            label="When"
            value={start !== null && date ? `${formatDateShort(date)} at ${formatTime(start)}` : 'Not chosen yet'}
            onChange={start !== null && step !== 'time' ? () => setStep('time') : undefined}
          />
          {service && (
            <p className="summary-total">
              <span>Total</span>
              <strong>{formatPrice(service.price)}</strong>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function ServiceStep({ selected, onChoose }: { selected: string; onChoose: (id: string) => void }) {
  return (
    <div className="choice-groups">
      {CATEGORIES.map((category) => (
        <fieldset key={category.id} className="choice-group">
          <legend>{category.label}</legend>
          <div className="choices">
            {SERVICES.filter((s) => s.category === category.id).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`choice${selected === s.id ? ' is-selected' : ''}`}
                aria-pressed={selected === s.id}
                onClick={() => onChoose(s.id)}
              >
                <span className="choice-main">
                  <span className="choice-title">{s.name}</span>
                  <span className="choice-desc">{s.description}</span>
                </span>
                <span className="choice-side">
                  <strong>{formatPrice(s.price)}</strong>
                  <span>{formatDuration(s.duration)}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function StylistStep({ serviceId, selected, onChoose }: { serviceId: string; selected: string; onChoose: (id: string) => void }) {
  const bookings = useBookings();
  const now = useNow();
  const stylists = useMemo(() => stylistsForService(serviceId), [serviceId]);
  const nextFree = useMemo(
    () => new Map(['any', ...stylists.map((s) => s.id)].map((id) => [id, nextAvailable(serviceId, id, bookings, now)])),
    [serviceId, stylists, bookings, now],
  );
  const describeNext = (id: string) => {
    const next = nextFree.get(id);
    return next ? `Next free: ${formatDateShort(next.date)}, ${formatTime(next.slot.start)}` : 'Fully booked for four weeks';
  };

  return (
    <div className="choices">
      {stylists.length > 1 && (
        <button
          type="button"
          className={`choice${selected === 'any' ? ' is-selected' : ''}`}
          aria-pressed={selected === 'any'}
          onClick={() => onChoose('any')}
        >
          <span className="avatar avatar-any" aria-hidden="true">
            <Icon name="sparkle" />
          </span>
          <span className="choice-main">
            <span className="choice-title">First available stylist</span>
            <span className="choice-desc">The most times to choose from. {describeNext('any')}</span>
          </span>
        </button>
      )}
      {stylists.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`choice${selected === s.id ? ' is-selected' : ''}`}
          aria-pressed={selected === s.id}
          onClick={() => onChoose(s.id)}
        >
          <Avatar stylist={s} />
          <span className="choice-main">
            <span className="choice-title">{s.name}</span>
            <span className="choice-desc">
              {s.role} · Works {describeDays(s.workDays)}
            </span>
            <span className="choice-next">{describeNext(s.id)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${id}`}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {error && (
        <p className="field-error" id={`e-${id}`}>
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: 'scissors' | 'user' | 'calendar';
  label: string;
  value: string;
  onChange?: () => void;
}) {
  return (
    <div className="summary-row">
      <Icon name={icon} />
      <div>
        <span className="summary-label">{label}</span>
        <span className="summary-value">{value}</span>
      </div>
      {onChange && (
        <button type="button" className="link-button" onClick={onChange}>
          Change<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      )}
    </div>
  );
}
