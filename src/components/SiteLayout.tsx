import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { SALON } from '../data/salon';
import { useNow } from '../lib/store';
import { Logo, OpeningHours } from './common';
import { Icon } from './Icon';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services & prices', end: false },
  { to: '/my-bookings', label: 'My bookings', end: false },
];

export function SiteLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const now = useNow();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <button
            className="icon-button nav-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
            <span className="sr-only">Menu</span>
          </button>
          <nav id="site-nav" className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main">
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <Link className="btn btn-primary btn-small" to="/book">
                  Book now
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Logo />
            <p className="muted">Cuts, colour and care in a calm, light-filled studio in Morningside.</p>
          </div>
          <div>
            <h2 className="footer-heading">Visit</h2>
            <address>
              {SALON.street}
              <br />
              {SALON.area}
            </address>
            <p>
              <a href={SALON.phoneHref}>{SALON.phone}</a>
              <br />
              <a href={`mailto:${SALON.email}`}>{SALON.email}</a>
            </p>
          </div>
          <div>
            <h2 className="footer-heading">Hours</h2>
            <OpeningHours now={now} />
          </div>
          <div>
            <h2 className="footer-heading">More</h2>
            <ul className="footer-links">
              <li>
                <Link to="/book">Book an appointment</Link>
              </li>
              <li>
                <Link to="/my-bookings">Change or cancel</Link>
              </li>
              <li>
                <Link to="/admin">Salon dashboard (demo)</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>Luma Hair Studio is a fictional salon. The bookings are demo data stored in your browser.</p>
          <p>
            Designed and built by <a href="https://www.upwork.com/freelancers/~0136f319881683d143">Deshlan P.</a>
          </p>
        </div>
      </footer>
    </>
  );
}
