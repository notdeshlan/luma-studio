import { Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { SiteLayout } from './components/SiteLayout';
import { BookPage } from './pages/book/BookPage';
import { BookingPage } from './pages/BookingPage';
import { HomePage } from './pages/HomePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { NotFoundPage, ServicesPage } from './pages/ServicesPage';

// Customers never need the dashboard, so it's only downloaded when someone opens it.
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

/** Start the booking flow afresh whenever its link changes, e.g. "Book with Ayesha" while already booking. */
function BookRoute() {
  const { search } = useLocation();
  return <BookPage key={search} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="book" element={<BookRoute />} />
        <Route path="booking/:ref" element={<BookingPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="admin"
        element={
          <Suspense fallback={<p className="container page muted">Loading dashboard…</p>}>
            <AdminPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
