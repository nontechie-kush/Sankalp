import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function newClientRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const value = char === 'x' ? rand : (rand & 0x3 | 0x8);
    return value.toString(16);
  });
}

function emptyBooking() {
  return {
    ritualId: null, ritualName: '', momentId: null, momentName: '',
    price: 0, deliveryDate: '', phone: '', userName: '', gotra: '', place: '',
    bookingFor: 'self', beneficiaryName: '', beneficiaryRelation: '',
    beneficiaryGotra: '', beneficiaryLocation: '',
    bookingId: null, bookingRef: '',
    clientRequestId: newClientRequestId(),
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
