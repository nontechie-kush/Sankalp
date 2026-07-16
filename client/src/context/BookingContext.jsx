import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

function emptyBooking() {
  return {
    ritualId: null, ritualName: '', momentId: null, momentName: '',
    price: 0, deliveryDate: '', phone: '', userName: '', gotra: '', place: '',
    bookingFor: 'self', beneficiaryRelation: '',
    clientRequestId: crypto.randomUUID(),
  };
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(emptyBooking);

  const update = (patch) => setBooking(prev => ({ ...prev, ...patch }));
  const reset  = () => setBooking(emptyBooking());

  return <Ctx.Provider value={{ booking, update, reset }}>{children}</Ctx.Provider>;
}

export function useBooking() {
  return useContext(Ctx);
}
