import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { bookingStore } from './lib/store';

// Tuesday 10 November 2026, 09:00 in Durban.
const NOW = new Date('2026-11-10T07:00:00Z');

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  localStorage.clear();
  bookingStore.reset();
});

afterEach(() => {
  vi.useRealTimers();
});

const timeButtons = () => screen.getAllByRole('button', { name: /^\d{2}:\d{2}$/ });

describe('booking an appointment', () => {
  it('walks through service, stylist, time and details to a confirmation', async () => {
    const user = userEvent.setup();
    renderAt('/book');

    await user.click(screen.getByRole('button', { name: /men's cut/i }));
    await user.click(screen.getByRole('button', { name: /jordan naidoo/i }));

    const [firstTime] = timeButtons();
    const chosen = firstTime.textContent;
    await user.click(firstTime);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.type(screen.getByLabelText('Full name'), 'Thandi Mokoena');
    await user.type(screen.getByLabelText('Email'), 'Thandi@Example.com');
    await user.type(screen.getByLabelText('Mobile number'), '082 123 4567');
    await user.click(screen.getByRole('button', { name: /review booking/i }));

    expect(screen.getByText(/Jordan Naidoo/, { selector: 'dd' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByRole('heading', { name: /you're booked in, thandi/i })).toBeInTheDocument();
    const saved = bookingStore.getAll().find((b) => b.customer.email === 'thandi@example.com');
    expect(saved).toMatchObject({ serviceId: 'mens-cut', stylistId: 'jordan', status: 'booked' });
    expect(screen.getByText(saved!.ref)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${chosen} –`))).toBeInTheDocument();
  });

  it('explains what is missing before letting you continue', async () => {
    const user = userEvent.setup();
    renderAt('/book?service=blowdry&stylist=mia');

    await user.click(timeButtons()[0]);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /review booking/i }));

    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText(/we need an email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(screen.queryByRole('button', { name: /confirm booking/i })).not.toBeInTheDocument();
  });

  it('starts at the time step when a service and stylist are linked from the home page', () => {
    renderAt('/book?service=balayage&stylist=ayesha');
    expect(screen.getByRole('heading', { name: 'When suits you?' })).toBeInTheDocument();
    expect(screen.getByText(/Balayage · 3 h/)).toBeInTheDocument();
  });

  it('picks up the service from a price-list link', async () => {
    const user = userEvent.setup();
    renderAt('/book');
    expect(screen.getByRole('heading', { name: 'What would you like done?' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Services & prices' }));
    await user.click(screen.getByRole('link', { name: /keratin smoothing/i }));
    expect(screen.getByRole('heading', { name: 'Who would you like to see?' })).toBeInTheDocument();
  });
});

describe('managing a booking', () => {
  it('lets the customer cancel an upcoming appointment', async () => {
    const user = userEvent.setup();
    const upcoming = bookingStore.getAll().find((b) => b.status === 'booked' && b.date > '2026-11-10')!;
    renderAt(`/booking/${upcoming.ref}`);

    await user.click(screen.getByRole('button', { name: 'Cancel booking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel it' }));

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(bookingStore.getAll().find((b) => b.ref === upcoming.ref)?.status).toBe('cancelled');
    expect(screen.getByRole('link', { name: 'Book again' })).toBeInTheDocument();
  });

  it('finds bookings by email', async () => {
    const user = userEvent.setup();
    renderAt('/my-bookings');
    await user.click(screen.getByRole('button', { name: /try a demo customer/i }));
    const upcoming = screen.getByRole('region', { name: 'Coming up' });
    expect(within(upcoming).getAllByRole('link').length).toBeGreaterThan(0);
  });
});

describe('salon dashboard', () => {
  it('opens an appointment and marks it as done', async () => {
    const user = userEvent.setup();
    renderAt('/admin');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    const schedule = screen.getByRole('region', { name: 'Appointments by stylist' });
    const [appointment] = within(schedule).getAllByRole('button', { name: /Booked\.$/ });
    await user.click(appointment);

    const panel = screen.getByRole('dialog');
    await user.click(within(panel).getByRole('button', { name: /mark as done/i }));
    expect(within(panel).getByText('Completed')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says when the salon is closed', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    // Tuesday back one day is Monday.
    await user.click(await screen.findByRole('button', { name: 'Previous day' }));
    expect(screen.getByText(/the salon is closed on this day/i)).toBeInTheDocument();
  });
});
