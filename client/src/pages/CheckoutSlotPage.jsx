import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export default function CheckoutSlotPage() {
  const navigate = useNavigate();
  const { booking } = useBooking();

  useEffect(() => {
    navigate(booking?.momentId ? '/checkout/verify' : '/', { replace: true });
  }, [booking?.momentId, navigate]);

  return null;
}
