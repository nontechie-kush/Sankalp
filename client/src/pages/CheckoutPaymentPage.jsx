import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { useBooking } from '../context/BookingContext';
import { bookingEventParams, trackEvent } from '../lib/analytics';

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking.momentId || !booking.phone) { navigate('/'); return null; }

  async function pay() {
    trackEvent('payment_start_clicked', bookingEventParams(booking));
    setLoading(true); setError('');
    const created = booking.bookingId
      ? { success: true, bookingId: booking.bookingId, bookingRef: booking.bookingRef }
      : await api.createBooking(booking);
    if (!created.success) {
      trackEvent('booking_create_failed', bookingEventParams(booking));
      setLoading(false);
      setError(created.error || 'Could not create the booking. Try again.');
      return;
    }
    trackEvent('booking_created', bookingEventParams(booking));

    update({
      bookingId: created.bookingId,
      bookingRef: created.bookingRef,
      ...(created.amountPaise ? { price: Math.round(created.amountPaise / 100) } : {}),
    });

    const d = await api.createOrder(created.bookingId);
    if (!d.success) {
      trackEvent('payment_order_failed', bookingEventParams(booking));
      setLoading(false);
      setError(d.error || 'Could not initiate payment. Try again.');
      return;
    }

    const order = d.order;
    if (order?.alreadyPaid) {
      update({ bookingRef: created.bookingRef || order.bookingNumber });
      navigate('/booking/' + (created.bookingRef || order.bookingNumber));
      return;
    }

    if (!order?.keyId || !order?.orderId || !order?.amount) {
      trackEvent('payment_order_invalid', bookingEventParams(booking));
      setLoading(false);
      setError('Payment gateway did not return a valid order. Try again.');
      return;
    }

    const isLiveDomain = /(^|\.)sankkalp\.com$/i.test(window.location.hostname);
    if (isLiveDomain && String(order.keyId).startsWith('rzp_test_')) {
      trackEvent('payment_order_failed', {
        ...bookingEventParams(booking),
        reason: 'razorpay_test_key_on_live_domain',
      });
      setLoading(false);
      setError('Live payments are not enabled yet. Add Razorpay live keys before accepting customer payments.');
      return;
    }

    if (!window.Razorpay) {
      trackEvent('payment_checkout_unavailable', bookingEventParams(booking));
      setLoading(false);
      setError('Payment checkout could not load. Refresh and try again.');
      return;
    }

    trackEvent('payment_checkout_opened', {
      ...bookingEventParams(booking),
      value: Number(order.amount) ? Number(order.amount) / 100 : Number(booking.price) || undefined,
      currency: order.currency || 'INR',
    });

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'Sankalp',
      description: `${booking.ritualName} · ${booking.momentName}`,
      order_id: order.orderId,
      handler: async (response) => {
        const v = await api.verifyPay({
          bookingId: created.bookingId,
          bookingRef: created.bookingRef || order.bookingNumber,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        if (v.success) {
          trackEvent('payment_success', {
            ...bookingEventParams(booking),
            value: Number(order.amount) ? Number(order.amount) / 100 : Number(booking.price) || undefined,
            currency: order.currency || 'INR',
          });
          update({ bookingRef: v.bookingRef || order.bookingNumber, paymentId: v.paymentId });
          navigate('/booking/' + (v.bookingRef || order.bookingNumber));
        } else {
          trackEvent('payment_verify_failed', bookingEventParams(booking));
          setError('Payment received but confirmation failed. Save your payment ID: ' + response.razorpay_payment_id);
          setLoading(false);
        }
      },
      prefill: { name: booking.userName || undefined, contact: booking.phone },
      theme: { color: '#7D4A2F' },
      modal: { ondismiss: () => { trackEvent('payment_checkout_dismissed', bookingEventParams(booking)); setLoading(false); } },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  const rows = [
    { label: 'Account', value: booking.userName || booking.phone },
    { label: 'Ritual', value: booking.ritualName },
    { label: 'Intent', value: booking.momentName },
    booking.slotLabel && { label: 'Date', value: booking.slotLabel },
    booking.place && { label: 'Place', value: booking.place },
    { label: 'Total', value: `Rs ${booking.price}`, bold: true },
  ].filter(Boolean);

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <div>
            <div className="step-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button className="step-bar-back" onClick={() => navigate('/checkout/verify')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
              <span className="step-label">Payment</span>
              <span className="step-count">3/3</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 28 }}>
              {[true, true, true].map((_, i) => <span key={i} className="active" />)}
            </div>
          </div>

          {/* Amount hero */}
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="18" height="18" style={{ color: 'var(--primary-light)' }}>
                <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary-light)' }}>Secure Razorpay Checkout</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 52, fontWeight: 600, color: 'var(--text)', letterSpacing: '-1px' }}>Rs {booking.price}</div>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, maxWidth: 300, margin: '8px auto 0' }}>
              Payment confirms your booking and the fulfilment window shown below.
            </p>
          </div>

          {/* Timeline */}
          <div className="timeline-card" style={{ marginBottom: 16 }}>
            <div className="timeline-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="20" height="20">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="timeline-label">Performance Timeline</div>
              <div className="timeline-title">Performed by tomorrow</div>
              <div className="timeline-sub">Bookings placed at or after 2 PM are performed by the end of the next day.</div>
            </div>
            <div className="timeline-date">By {booking.deliveryDate}</div>
          </div>

          {/* Summary */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="summary-table" style={{ width: '100%', borderCollapse: 'collapse', padding: '4px 20px' }}>
              <tbody>
                {rows.map(r => (
                  <tr key={r.label}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-3)', borderBottom: r.bold ? 'none' : '1px solid var(--border)' }}>{r.label}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: r.bold ? 16 : 14, fontWeight: r.bold ? 700 : 600, color: 'var(--text)', borderBottom: r.bold ? 'none' : '1px solid var(--border)' }}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="field-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      </main>

      <div className="bottom-bar">
        <div className="bottom-bar-info">
          <div className="bottom-bar-label">Pay now</div>
          <div className="bottom-bar-price">Rs {booking.price}</div>
        </div>
        <button className="btn-primary" onClick={pay} disabled={loading}>
          {loading ? 'Opening…' : 'Pay securely →'}
        </button>
      </div>
    </div>
  );
}
