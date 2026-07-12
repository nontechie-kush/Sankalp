import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState({
    ritualId: null, ritualName: '', momentId: null, momentName: '',
    price: 0, deliveryDate: '', phone: '', userName: '',
  });

  const update = (patch) => setBooking(prev => ({ ...prev, ...patch }));
  const reset  = () => setBooking({ ritualId: null, ritualName: '', momentId: null, momentName: '', price: 0, deliveryDate: '', phone: '', userName: '' });

  return <Ctx.Provider value={{ booking, update, reset }}>{children}</Ctx.Provider>;
}

export function useBooking() {
  return useContext(Ctx);
}
