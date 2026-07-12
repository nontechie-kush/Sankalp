import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { getToken, tokenPayload } from '../lib/auth';
import { useBooking } from '../context/BookingContext';

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { booking, update, reset } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = tokenPayload();
  if (!booking.momentId || !booking.phone) { navigate('/'); return null; }

  async function pay() {
    setLoading(true); setError('');
    const amountPaise = booking.price * 100;
    const d = await api.createOrder(amountPaise, { ritual: booking.ritualName, moment: booking.momentName, place: booking.place || '' });
    if (!d.success) { setLoading(false); setError('Could not initiate payment. Try again.'); return; }

    const options = {
      key: d.order.key,
      amount: d.order.amount,
      currency: d.order.currency || 'INR',
      name: 'Sankalp',
      description: `${booking.ritualName} · ${booking.momentName}`,
      order_id: d.order.id,
      handler: async (response) => {
        const v = await api.verifyPay({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          bookingData: {
            ritual: booking.ritualName,
            ritualKey: booking.ritualId,
            moment: booking.momentName,
            date: booking.slotDate || new Date().toISOString().split('T')[0],
            slot: booking.slotLabel || booking.deliveryDate,
            place: booking.place || '',
            price: `Rs ${booking.price}`,
            amountPaise,
          },
        });
        if (v.success) {
          update({ bookingRef: v.bookingRef, paymentId: v.paymentId });
          window.location.href = '/booking/' + v.bookingRef;
        } else {
          setError('Payment received but confirmation failed. Save your payment ID: ' + response.razorpay_payment_id);
          setLoading(false);
        }
      },
      prefill: { contact: booking.phone },
      theme: { color: '#7D4A2F' },
      modal: { ondismiss: () => setLoading(false) },
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
              <span className="step-count">4/4</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 28 }}>
              {[true, true, true, true].map((_, i) => <span key={i} className="active" />)}
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
