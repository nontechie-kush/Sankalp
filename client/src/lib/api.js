import { authHeaders } from './auth';

async function req(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  sendOtp:     (phone) => req('POST', '/api/auth/send-otp', { phone }),
  verifyOtp:   (phone, otp) => req('POST', '/api/auth/verify-otp', { phone, otp }),
  saveProfile: (name, gotra) => req('PUT', '/api/auth/profile', { name, gotra }),
  me:          () => req('GET', '/api/auth/me'),
  createOrder: (amountPaise, meta) => req('POST', '/api/payment/create-order', { amountPaise, bookingMeta: meta }),
  verifyPay:   (payload) => req('POST', '/api/payment/verify', payload),
  getBookings: () => req('GET', '/api/bookings'),
};
