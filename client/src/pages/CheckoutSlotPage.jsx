import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBooking } from '../context/BookingContext';


function Calendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  function prevMonth() {
    const d = new Date(year, month - 1, 1);
    if (d >= new Date(today.getFullYear(), today.getMonth(), 1)) setViewDate(d);
  }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{monthName}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const date = new Date(year, month, d);
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          const isPast = date < today;
          const isSelected = selectedDate === dateStr;
          const isToday = date.getTime() === today.getTime();
          return (
            <button
              key={d}
              disabled={isPast}
              onClick={() => !isPast && onSelect(dateStr)}
              style={{
                padding: '9px 4px',
                borderRadius: 8,
                border: isToday && !isSelected ? '1.5px solid var(--primary)' : 'none',
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#fff' : isPast ? '#D8CEC4' : 'var(--text)',
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize: 13,
                cursor: isPast ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckoutSlotPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const [selectedDate, setSelectedDate] = useState(null);

  if (!booking.momentId) { navigate('/'); return null; }

  function handleContinue() {
    if (!selectedDate) return;
    const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    update({
      slotDate: selectedDate,
      slotLabel: dateLabel,
      deliveryDate: dateLabel,
    });
    navigate('/checkout/verify');
  }

  const canContinue = !!selectedDate;

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <div>
            <div className="step-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button className="step-bar-back" onClick={() => navigate(`/ritual/${booking.ritualId}/${booking.momentId}`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
              <span className="step-label">Choose slot</span>
              <span className="step-count">2/4</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 28 }}>
              {[true, true, false, false].map((a, i) => <span key={i} className={a ? 'active' : ''} />)}
            </div>
            <p className="step-meta">Step 2 of 4</p>
          </div>

          {/* Ritual summary */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 2 }}>{booking.ritualName}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{booking.momentName}</div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>Rs {booking.price}</div>
          </div>

          {/* Calendar */}
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>Choose date</p>
          <div style={{ marginBottom: 24 }}>
            <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Your pandit will perform the ritual at an auspicious muhurat on the chosen day.
          </p>
        </div>
      </main>

      <div className="bottom-bar">
        <div className="bottom-bar-info">
          <div className="bottom-bar-label" style={{ fontSize: 12 }}>
            {canContinue
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
              : 'Select a date'}
          </div>
          <div className="bottom-bar-price">Rs {booking.price}</div>
        </div>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={!canContinue}
          style={{ opacity: canContinue ? 1 : 0.5 }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
