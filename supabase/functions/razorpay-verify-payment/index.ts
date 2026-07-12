import {
  authenticatedPaymentClients,
  corsHeaders,
  json,
  razorpayRequest,
  validUuid,
} from "../_shared/payment.ts";

interface PaymentContext {
  booking_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  razorpay_order_id: string | null;
}

async function hmacHex(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  const clients = await authenticatedPaymentClients(request);
  if (!clients) return json(request, { error: "Sign in before verifying payment." }, 401);

  const body = await request.json().catch(() => null) as {
    bookingId?: unknown;
    razorpayOrderId?: unknown;
    razorpayPaymentId?: unknown;
    razorpaySignature?: unknown;
  } | null;
  if (
    !validUuid(body?.bookingId) ||
    typeof body?.razorpayOrderId !== "string" ||
    typeof body?.razorpayPaymentId !== "string" ||
    typeof body?.razorpaySignature !== "string" ||
    !/^order_[A-Za-z0-9]+$/.test(body.razorpayOrderId) ||
    !/^pay_[A-Za-z0-9]+$/.test(body.razorpayPaymentId) ||
    !/^[a-f0-9]{64}$/i.test(body.razorpaySignature)
  ) {
    return json(request, { error: "Invalid payment response." }, 400);
  }

  const { data, error } = await clients.serviceClient.rpc("get_mweb_booking_payment_context", {
    p_booking_id: body.bookingId,
    p_user_id: clients.user.id,
  });
  if (error) return json(request, { error: "The booking could not be loaded." }, 500);
  const booking = (data?.[0] ?? null) as PaymentContext | null;
  if (!booking) return json(request, { error: "Booking not found." }, 404);
  if (booking.razorpay_order_id !== body.razorpayOrderId) {
    return json(request, { error: "Payment order mismatch." }, 400);
  }

  const expectedSignature = await hmacHex(
    `${booking.razorpay_order_id}|${body.razorpayPaymentId}`,
    clients.environment.razorpayKeySecret,
  );
  if (!constantTimeEqual(expectedSignature, body.razorpaySignature.toLowerCase())) {
    return json(request, { error: "Payment signature verification failed." }, 400);
  }

  let paymentResponse = await razorpayRequest(
    `/payments/${encodeURIComponent(body.razorpayPaymentId)}`,
    clients.environment,
  );
  let payment = await paymentResponse.json().catch(() => null) as {
    id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    error?: { description?: string };
  } | null;
  if (!paymentResponse.ok || !payment) {
    console.error("Razorpay payment lookup failed", paymentResponse.status, payment?.error);
    return json(request, { error: "Razorpay could not verify the payment." }, 502);
  }

  if (
    payment.id !== body.razorpayPaymentId ||
    payment.order_id !== booking.razorpay_order_id ||
    payment.amount !== booking.amount_minor ||
    payment.currency !== booking.currency
  ) {
    return json(request, { error: "Payment details do not match the booking." }, 400);
  }

  if (payment.status === "authorized") {
    paymentResponse = await razorpayRequest(
      `/payments/${encodeURIComponent(body.razorpayPaymentId)}/capture`,
      clients.environment,
      {
        method: "POST",
        body: JSON.stringify({ amount: booking.amount_minor, currency: booking.currency }),
      },
    );
    payment = await paymentResponse.json().catch(() => null);
  }
  if (!paymentResponse.ok || payment?.status !== "captured") {
    console.error("Razorpay payment not captured", paymentResponse.status, payment?.status);
    return json(request, { error: "Payment is not captured yet. Please retry status shortly." }, 409);
  }

  const completion = await clients.serviceClient.rpc("complete_mweb_razorpay_payment", {
    p_booking_id: booking.booking_id,
    p_user_id: clients.user.id,
    p_razorpay_order_id: body.razorpayOrderId,
    p_razorpay_payment_id: body.razorpayPaymentId,
  });
  if (completion.error || !completion.data?.[0]) {
    console.error("Payment completion failed", completion.error);
    return json(request, { error: "Payment was verified but the booking could not be updated." }, 500);
  }

  return json(request, completion.data[0]);
});
