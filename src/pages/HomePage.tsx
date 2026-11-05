import { useMemo } from 'react';
import { Link } from 'react-router';
import { Avatar, OpeningHours } from '../components/common';
import { Icon } from '../components/Icon';
import { ServiceMenu } from '../components/ServiceMenu';
import { SALON, STYLISTS } from '../data/salon';
import { nextAvailable } from '../lib/availability';
import { describeDays } from '../lib/labels';
import { useBookings, useNow } from '../lib/store';
import { formatDateShort, formatTime } from '../lib/time';

export function HomePage() {
  const bookings = useBookings();
  const now = useNow();
  const next = useMemo(() => nextAvailable('cut-blowdry', 'any', bookings, now), [bookings, now]);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Morningside, Durban</p>
            <h1>
              Hair that feels <em>like you.</em>
            </h1>
            <p className="lead">
              Cuts, colour and treatments from a small team who take the time to listen. See real availability and book
              in under a minute, day or night.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/book">
                Book an appointment <Icon name="arrowRight" size={18} />
              </Link>
              <Link className="btn btn-ghost" to="/services">
                View prices
              </Link>
            </div>
          </div>

          <div className="hero-art">
            <svg viewBox="0 0 520 500" role="img" aria-label="Abstract illustration of three arches and a rising sun">
              <circle cx="150" cy="128" r="52" className="art-sun" />
              <path d="M40 230a100 100 0 0 1 200 0v250H40z" className="art-peach" />
              <path d="M190 180a125 125 0 0 1 250 0v300H190z" className="art-green" />
              <path d="M360 340a70 70 0 0 1 140 0v140H360z" className="art-ink" />
              <g className="art-lines" fill="none" strokeWidth="5" strokeLinecap="round">
                <path d="M235 215c30 22 55-18 85 0s55-18 85 0" />
                <path d="M235 250c30 22 55-18 85 0s55-18 85 0" />
                <path d="M235 285c30 22 55-18 85 0s55-18 85 0" />
              </g>
              <g className="art-dots">
                {Array.from({ length: 20 }, (_, i) => (
                  <circle key={i} cx={392 + (i % 5) * 22} cy={64 + Math.floor(i / 5) * 22} r="3.5" />
                ))}
              </g>
            </svg>
            {next && (
              <div className="hero-card">
                <span className="hero-card-icon">
                  <Icon name="calendar" />
                </span>
                <span>
                  <strong>Next free cut & blow-dry</strong>
                  {formatDateShort(next.date)} at {formatTime(next.slot.start)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container perks" aria-label="Why book with us">
        <div className="perk">
          <Icon name="clock" />
          <div>
            <h2>Book in under a minute</h2>
            <p>Live availability for every stylist. No phone tag.</p>
          </div>
        </div>
        <div className="perk">
          <Icon name="sparkle" />
          <div>
            <h2>Late on Thursdays</h2>
            <p>Open until 19:00, so you can come straight from work.</p>
          </div>
        </div>
        <div className="perk">
          <Icon name="refresh" />
          <div>
            <h2>Free changes</h2>
            <p>Move or cancel online up to 24 hours before.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Services</p>
              <h2 id="services-title">Everything we do, and what it costs</h2>
            </div>
            <Link className="link-arrow" to="/services">
              Full descriptions <Icon name="arrowRight" size={18} />
            </Link>
          </div>
          <ServiceMenu />
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="team-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">The team</p>
              <h2 id="team-title">Four chairs, four specialists</h2>
            </div>
          </div>
          <div className="team-grid">
            {STYLISTS.map((stylist) => (
              <article key={stylist.id} className="team-card">
                <Avatar stylist={stylist} size={64} />
                <h3>{stylist.name}</h3>
                <p className="team-role">{stylist.role}</p>
                <p className="muted">{stylist.bio}</p>
                <ul className="chips" aria-label="Specialties">
                  {stylist.specialties.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="team-days">
                  <Icon name="calendar" size={16} /> {describeDays(stylist.workDays)}
                </p>
                <Link className="btn btn-ghost btn-small" to={`/book?stylist=${stylist.id}`}>
                  Book with {stylist.name.split(' ')[0]}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="visit-title">
        <div className="container visit">
          <div className="card">
            <h2 id="visit-title">Visit the studio</h2>
            <ul className="contact-list">
              <li>
                <Icon name="pin" />
                <span>
                  <strong>{SALON.street}</strong>
                  {SALON.area}. Free parking on the street.
                </span>
              </li>
              <li>
                <Icon name="phone" />
                <span>
                  <strong>Call or WhatsApp</strong>
                  <a href={SALON.phoneHref}>{SALON.phone}</a>
                </span>
              </li>
              <li>
                <Icon name="mail" />
                <span>
                  <strong>Email</strong>
                  <a href={`mailto:${SALON.email}`}>{SALON.email}</a>
                </span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h2>Opening hours</h2>
            <OpeningHours now={now} />
          </div>
        </div>
      </section>

      <section className="container cta-wrap">
        <div className="cta">
          <div>
            <h2>Ready for a change?</h2>
            <p>Pick a service, a stylist and a time. We'll take care of the rest.</p>
          </div>
          <Link className="btn btn-light" to="/book">
            Book now
          </Link>
        </div>
      </section>
    </>
  );
}
