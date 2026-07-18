import { getStoredUser, setStoredUser, setToken } from './auth';
import { supabase } from './supabase';

function ok(data = {}) {
  return { success: true, ...data };
}

function fail(error) {
  const message = error?.message || error?.error_description || error || 'Something went wrong.';
  return { success: false, error: message };
}

function rupees(minor) {
  return `Rs ${Math.round((minor || 0) / 100)}`;
}

function amountFromBooking(booking) {
  if (booking?.price) return Number(booking.price) * 100;
  return Number(booking?.amount_minor || 0);
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const value = char === 'x' ? rand : (rand & 0x3 | 0x8);
    return value.toString(16);
  });
}

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;
  return raw;
}

function profileToUser(profile) {
  return {
    id: profile?.user_id || profile?.lead_id || null,
    leadId: profile?.lead_id || null,
    phone: profile?.phone || '',
    name: profile?.name || '',
    gotra: profile?.gotra || '',
    sankalpLocation: profile?.sankalp_location || '',
    dateOfBirth: profile?.date_of_birth || null,
    placeOfBirth: profile?.place_of_birth || null,
    ritualPoints: 0,
  };
}

async function getCurrentProfile() {
  const { data, error } = await supabase.rpc('get_my_mweb_profile');
  if (error) throw error;
  return data?.[0] || null;
}

async function ensureLead() {
  const { data, error } = await supabase.rpc('upsert_mweb_authenticated_lead', {
    lead_name: null,
  });
  if (error) throw error;
  return data?.[0] || null;
}

async function activeSessionToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (token) setToken(token);
  return token;
}

async function callPaymentApi(path, body) {
  const token = await activeSessionToken();
  if (!token) throw new Error('Sign in before paying.');
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Payment could not be started.');
  return data;
}

async function resolveSelection(booking) {
  const [ritualsResult, useCasesResult, slotsResult] = await Promise.all([
    supabase
      .from('rituals')
      .select('id,title,slug')
      .eq('status', 'active'),
    supabase
      .from('mweb_ritual_use_cases')
      .select('id,ritual_id,title,price_minor,currency')
      .eq('status', 'active'),
    supabase
      .from('mweb_time_slots')
      .select('id,ritual_id,slot_date,slot_time,label')
      .eq('status', 'open')
      .gte('slot_date', new Date().toISOString().slice(0, 10))
      .order('slot_date')
      .order('slot_time'),
  ]);

  for (const result of [ritualsResult, useCasesResult, slotsResult]) {
    if (result.error) throw result.error;
  }

  const ritualTitle = booking.ritualName || booking.ritual || '';
  const useCaseTitle = booking.momentName || booking.moment || '';
  const ritual = (ritualsResult.data || []).find((item) =>
    item.title?.toLowerCase() === ritualTitle.toLowerCase() ||
    item.slug?.toLowerCase() === String(booking.ritualId || '').toLowerCase()
  );

  const useCase = (useCasesResult.data || []).find((item) =>
    item.ritual_id === ritual?.id &&
    item.title?.toLowerCase() === useCaseTitle.toLowerCase()
  );

  const requestedSlot = (slotsResult.data || []).find((slot) =>
    slot.ritual_id === ritual?.id &&
    (!booking.slotDate || slot.slot_date === booking.slotDate)
  ) || (slotsResult.data || []).find((slot) => !slot.ritual_id || slot.ritual_id === ritual?.id);

  if (!ritual?.id) {
    throw new Error(`${ritualTitle || 'This ritual'} is not configured in Supabase yet.`);
  }

  if (!useCase?.id) {
    throw new Error(`${useCaseTitle || 'This ritual intent'} is not configured in Supabase yet.`);
  }

  return { ritual, useCase, slot: requestedSlot || null };
}

function transformBooking(row) {
  const date = row.preferred_date || row.promised_service_date || null;
  const active = ['pending_payment', 'pending_assignment', 'pandit_assigned', 'ritual_scheduled'].includes(row.status);
  const bookingFor = row.booking_for || 'self';
  const beneficiaryName = row.beneficiary_name || row.customer_name || '';
  return {
    id: row.booking_id,
    booking_ref: row.booking_number,
    ritual_name: row.ritual_title || 'Ritual',
    ritual_key: '',
    moment: row.use_case_title || row.ritual_title || 'Ritual',
    booking_for: bookingFor,
    beneficiary_name: beneficiaryName,
    beneficiary_relation: row.beneficiary_relation || '',
    beneficiary_gotra: row.beneficiary_gotra || '',
    beneficiary_location: row.beneficiary_location || '',
    for_label: bookingFor === 'other' && beneficiaryName ? `For ${beneficiaryName}` : 'For myself',
    booking_date: date,
    slot: row.preferred_time || '',
    price_display: rupees(row.amount_minor),
    price_paise: row.amount_minor,
    status: row.status || 'confirmed',
    payment_status: row.payment_status,
    promised_by: row.promised_by,
    promised_service_date: row.promised_service_date,
    upcoming: active,
  };
}

export const api = {
  async sendOtp(phone) {
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true },
    });
    return error ? fail(error) : ok({ message: 'OTP sent via SMS', phone: normalized });
  },

  async verifyOtp(phone, otp) {
    const normalized = normalizePhone(phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: String(otp || '').trim(),
      type: 'sms',
    });
    if (error) return fail(error);

    try {
      await ensureLead();
      const profile = await getCurrentProfile();
      const user = profileToUser(profile || { phone: normalized });
      if (data.session?.access_token) setToken(data.session.access_token);
      setStoredUser(user);
      return ok({ token: data.session?.access_token || '', isNew: !user.name, user });
    } catch (err) {
      return fail(err);
    }
  },

  async saveProfile(name, gotra, extra = {}) {
    try {
      let result = await supabase.rpc('update_my_mweb_profile_v2', {
        p_name: name,
        p_gotra: gotra || null,
        p_sankalp_location: extra.sankalpLocation || extra.location || null,
        p_date_of_birth: extra.dateOfBirth || null,
        p_place_of_birth: extra.placeOfBirth || null,
        p_place_of_birth_id: extra.placeOfBirthId || null,
        p_place_of_birth_provider: extra.placeOfBirthProvider || null,
        p_complete: true,
      });

      if (result.error && /function .* does not exist/i.test(result.error.message || '')) {
        result = await supabase.rpc('update_my_mweb_profile', {
          p_name: name,
          p_date_of_birth: extra.dateOfBirth || null,
          p_place_of_birth: extra.placeOfBirth || null,
          p_complete: true,
        });
      }

      if (result.error) throw result.error;
      const user = profileToUser(result.data?.[0]);
      setStoredUser(user);
      return ok({ user });
    } catch (err) {
      return fail(err);
    }
  },

  async me() {
    try {
      const profile = await getCurrentProfile();
      const user = profileToUser(profile);
      setStoredUser(user);
      await activeSessionToken();
      return ok({ user });
    } catch (err) {
      return fail(err);
    }
  },

  async createBooking(booking) {
    try {
      const selection = await resolveSelection(booking);
      const storedUser = getStoredUser();
      const bookingFor = booking.bookingFor === 'other' ? 'other' : 'self';
      const beneficiaryName = booking.beneficiaryName || booking.userName || booking.customerName || storedUser?.name || 'Sankalp customer';
      const beneficiaryGotra = booking.beneficiaryGotra || booking.gotra || null;
      const beneficiaryLocation = booking.beneficiaryLocation || booking.place || null;

      const createBookingParams = {
        p_ritual_id: selection.ritual.id,
        p_use_case_id: selection.useCase.id,
        p_slot_id: selection.slot?.id || null,
        p_booking_for: bookingFor,
        p_beneficiary_name: beneficiaryName,
        p_beneficiary_relation: bookingFor === 'other' ? booking.beneficiaryRelation || null : null,
        p_beneficiary_gotra: beneficiaryGotra,
        p_beneficiary_location: beneficiaryLocation,
        p_intent_note: booking.intentNote || null,
        p_client_request_id: booking.clientRequestId || uuid(),
      };

      let result = await supabase.rpc('create_my_mweb_booking_v2', createBookingParams);

      if (result.error && /function .* does not exist/i.test(result.error.message || '')) {
        if (bookingFor === 'other') {
          throw new Error('Book for someone else needs the latest database migration.');
        }
        result = await supabase.rpc('create_my_mweb_booking', {
          p_ritual_id: selection.ritual.id,
          p_use_case_id: selection.useCase.id,
          p_slot_id: selection.slot?.id || null,
          p_customer_name: beneficiaryName,
          p_intent_note: booking.intentNote || null,
          p_client_request_id: booking.clientRequestId || uuid(),
        });
      }

      const { data, error } = result;
      if (error) throw error;
      const created = data?.[0];
      if (!created?.booking_id) throw new Error('Booking could not be created.');
      return ok({
        bookingId: created.booking_id,
        bookingRef: created.booking_number,
        amountPaise: selection.useCase.price_minor || amountFromBooking(booking),
      });
    } catch (err) {
      return fail(err);
    }
  },

  async createOrder(bookingIdOrAmount, meta) {
    try {
      const bookingId = typeof bookingIdOrAmount === 'string'
        ? bookingIdOrAmount
        : meta?.bookingId;
      if (!bookingId) throw new Error('Create the booking before starting payment.');

      const data = await callPaymentApi('/api/payments/create-order', { bookingId });
      return ok({ order: data });
    } catch (err) {
      return fail(err);
    }
  },

  async verifyPay(payload) {
    try {
      const bookingId = payload.bookingId;
      if (!bookingId) throw new Error('Missing booking id for payment verification.');
      const data = await callPaymentApi('/api/payments/verify', {
        bookingId,
        razorpayOrderId: payload.razorpay_order_id,
        razorpayPaymentId: payload.razorpay_payment_id,
        razorpaySignature: payload.razorpay_signature,
      });
      return ok({
        bookingRef: payload.bookingRef,
        bookingId: data?.booking_id || bookingId,
        status: data?.status,
        paymentStatus: data?.payment_status,
        paymentId: payload.razorpay_payment_id,
      });
    } catch (err) {
      return fail(err);
    }
  },

  async getBookings() {
    try {
      const { data, error } = await supabase.rpc('list_my_mweb_bookings');
      if (error) throw error;
      const rows = (data || []).map(transformBooking);
      return ok({
        bookings: {
          upcoming: rows.filter((row) => row.upcoming),
          past: rows.filter((row) => !row.upcoming),
        },
      });
    } catch (err) {
      return fail(err);
    }
  },
};

async function functionError(error, fallback) {
  let message = error?.message || fallback;
  const context = error?.context;
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null);
    message = body?.error || message;
  }
  return new Error(message);
}
