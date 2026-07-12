import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { trackPageView } from './lib/analytics';
import './styles/globals.css';

import HomePage from './pages/HomePage';
import RitualPage from './pages/RitualPage';
import SignInPage from './pages/SignInPage';
import CheckoutSlotPage from './pages/CheckoutSlotPage';
import CheckoutVerifyPage from './pages/CheckoutVerifyPage';
import CheckoutSignupPage from './pages/CheckoutSignupPage';
import CheckoutPaymentPage from './pages/CheckoutPaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import BookingsPage from './pages/BookingsPage';

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24, background: 'var(--bg)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="48" height="48" style={{ color: 'var(--border)' }}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M9 14l2 2 4-4"/>
      </svg>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600 }}>Page not found</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14 }}>The page you requested does not exist.</p>
      <a href="/" className="btn-primary" style={{ marginTop: 8 }}>Back home</a>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function AnalyticsPageView() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <ScrollToTop />
        <AnalyticsPageView />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/ritual/:ritualId" element={<RitualPage />} />
          <Route path="/ritual/:ritualId/:momentId" element={<RitualPage />} />
          <Route path="/checkout/slot" element={<CheckoutSlotPage />} />
          <Route path="/checkout/verify" element={<CheckoutVerifyPage />} />
          <Route path="/checkout/signup" element={<CheckoutSignupPage />} />
          <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
          <Route path="/booking/:ref" element={<ConfirmationPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
