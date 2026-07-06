import {
  authenticatedPaymentClients,
  corsHeaders,
  json,
  razorpayRequest,
  validUuid,
} from "../_shared/payment.ts";

interface PaymentContext {
  booking_id: string;
  booking_number: string;
  ritual_title: string;
  amount_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  razorpay_order_id: string | null;
}

async function reconcileCompletedOrder(
  booking: PaymentContext,
  orderId: string,
  clients: NonNullable<Awaited<ReturnType<typeof authenticatedPaymentClients>>>,
): Promise<{ completed: boolean; diagnostic?: unknown }> {
  const paymentsResponse = await razorpayRequest(
    `/orders/${encodeURIComponent(orderId)}/payments`,
    clients.environment,
  );
  const payments = await paymentsResponse.json().catch(() => null) as {
    items?: Array<{
      id?: string;
      order_id?: string;
      amount?: number;
      currency?: string;
      status?: string;
    }>;
  } | null;
  if (!paymentsResponse.ok || !payments?.items) return { completed: false };

  let payment = payments.items.find((candidate) =>
    candidate.order_id === orderId &&
    candidate.amount === booking.amount_minor &&
    candidate.currency === booking.currency &&
    (candidate.status === "authorized" || candidate.status === "captured")
  );
  if (!payment?.id) return { completed: false };

  if (payment.status === "authorized") {
    const captureResponse = await razorpayRequest(
      `/payments/${encodeURIComponent(payment.id)}/capture`,
      clients.environment,
      {
        method: "POST",
        body: JSON.stringify({ amount: booking.amount_minor, currency: booking.currency }),
      },
    );
    payment = await captureResponse.json().catch(() => null) as typeof payment;
    if (!captureResponse.ok || payment?.status !== "captured") return { completed: false };
  }

  const completion = await clients.serviceClient.rpc("complete_mweb_razorpay_payment", {
    p_booking_id: booking.booking_id,
    p_user_id: clients.user.id,
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: payment.id,
  });
  return completion.error
    ? { completed: false, diagnostic: completion.error }
    : { completed: Boolean(completion.data?.[0]) };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  const clients = await authenticatedPaymentClients(request);
  if (!clients) return json(request, { error: "Sign in before paying." }, 401);

  const body = await request.json().catch(() => null) as { bookingId?: unknown } | null;
  if (!validUuid(body?.bookingId)) return json(request, { error: "Invalid booking." }, 400);

  const { data, error } = await clients.serviceClient.rpc("get_mweb_booking_payment_context", {
    p_booking_id: body.bookingId,
    p_user_id: clients.user.id,
  });
  if (error) return json(request, { error: "The booking could not be loaded." }, 500);
  const booking = (data?.[0] ?? null) as PaymentContext | null;
  if (!booking) return json(request, { error: "Booking not found." }, 404);
  if (booking.payment_status === "paid") {
    return json(request, { error: "This booking is already paid." }, 409);
  }
  if (booking.status !== "pending_payment") {
    return json(request, { error: "This booking is not awaiting payment." }, 409);
  }

  let orderId = booking.razorpay_order_id;
  let reusableOrder = false;

  if (orderId) {
    const existingResponse = await razorpayRequest(
      `/orders/${encodeURIComponent(orderId)}`,
      clients.environment,
    );
    const existingOrder = await existingResponse.json().catch(() => null) as {
      id?: string;
      amount?: number;
      currency?: string;
      status?: string;
    } | null;
    const matchesBooking = existingResponse.ok &&
      existingOrder?.id === orderId &&
      existingOrder.amount === booking.amount_minor &&
      existingOrder.currency === booking.currency;
    reusableOrder = matchesBooking && existingOrder.status === "created";

    const reconciliation = matchesBooking &&
        (existingOrder.status === "attempted" || existingOrder.status === "paid")
      ? await reconcileCompletedOrder(booking, orderId, clients)
      : { completed: false };
    if (reconciliation.diagnostic) {
      console.error("Payment reconciliation failed", reconciliation.diagnostic);
      return json(request, { error: "The verified payment could not be applied to the booking." }, 500);
    }
    if (reconciliation.completed) {
      return json(request, {
        keyId: clients.environment.razorpayKeyId,
        orderId,
        amount: booking.amount_minor,
        currency: booking.currency,
        bookingNumber: booking.booking_number,
        description: booking.ritual_title,
        alreadyPaid: true,
      });
    }
  }

  if (!reusableOrder) {
    const previousOrderId = orderId;
    const receipt = `sk_${booking.booking_id.replaceAll("-", "").slice(0, 22)}_${Date.now().toString(36)}`;
    const razorpayResponse = await razorpayRequest("/orders", clients.environment, {
      method: "POST",
      body: JSON.stringify({
        amount: booking.amount_minor,
        currency: booking.currency,
        receipt,
        notes: {
          booking_id: booking.booking_id,
          booking_number: booking.booking_number,
          user_id: clients.user.id,
        },
      }),
    });
    const razorpayOrder = await razorpayResponse.json().catch(() => null) as {
      id?: string;
      error?: { description?: string };
    } | null;
    if (!razorpayResponse.ok || !razorpayOrder?.id) {
      console.error("Razorpay create order failed", razorpayResponse.status, razorpayOrder?.error);
      return json(request, { error: "Razorpay could not start the payment." }, 502);
    }

    const attachment = await clients.serviceClient.rpc("replace_mweb_razorpay_order", {
      p_booking_id: booking.booking_id,
      p_user_id: clients.user.id,
      p_expected_order_id: previousOrderId,
      p_razorpay_order_id: razorpayOrder.id,
    });
    if (attachment.error || typeof attachment.data !== "string") {
      return json(request, { error: "The payment order could not be attached." }, 500);
    }
    orderId = attachment.data;
  }

  return json(request, {
    keyId: clients.environment.razorpayKeyId,
    orderId,
    amount: booking.amount_minor,
    currency: booking.currency,
    bookingNumber: booking.booking_number,
    description: booking.ritual_title,
  });
});
