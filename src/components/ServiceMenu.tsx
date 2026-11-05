import { Link } from 'react-router';
import { CATEGORIES, SERVICES } from '../data/salon';
import { formatDuration, formatPrice } from '../lib/time';

/** The price list, grouped by category. Every service links straight into booking. */
export function ServiceMenu({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className={`service-menu${detailed ? ' is-detailed' : ''}`}>
      {CATEGORIES.map((category) => (
        <section key={category.id} className="service-group" aria-labelledby={`cat-${category.id}`}>
          <h3 id={`cat-${category.id}`}>{category.label}</h3>
          <ul>
            {SERVICES.filter((s) => s.category === category.id).map((service) => (
              <li key={service.id}>
                <Link to={`/book?service=${service.id}`} className="service-row">
                  <span className="service-row-main">
                    <span className="service-name">{service.name}</span>
                    {detailed && <span className="service-desc">{service.description}</span>}
                    <span className="service-meta">{formatDuration(service.duration)}</span>
                  </span>
                  <span className="service-price">{formatPrice(service.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
