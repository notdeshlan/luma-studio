import { Link } from 'react-router';
import { ServiceMenu } from '../components/ServiceMenu';

export function ServicesPage() {
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">Services & prices</p>
        <h1>What we do</h1>
        <p className="lead">
          Every service starts with a quick consultation. Prices include VAT. Tap any service to see when it's available.
        </p>
      </header>
      <ServiceMenu detailed />
      <p className="note">
        Not sure what you need? Book a <Link to="/book?service=cut-blowdry">cut & blow-dry</Link> and talk it through
        with your stylist, or call us on 031 555 0187.
      </p>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="container page empty-state">
      <h1>We couldn't find that page</h1>
      <p className="lead">It may have moved, or the link may be mistyped.</p>
      <Link className="btn btn-primary" to="/">
        Back to the home page
      </Link>
    </div>
  );
}
