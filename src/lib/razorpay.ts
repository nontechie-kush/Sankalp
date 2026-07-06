import type { MemberProfile, RazorpayCheckoutResult, RazorpayOrder } from "../types";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name?: string; contact?: string };
  theme: { color: string };
  retry: { enabled: boolean };
  modal: { ondismiss: () => void };
  handler: (result: RazorpayCheckoutResult) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let checkoutPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutPromise) return checkoutPromise;

  checkoutPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay-checkout]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay Checkout could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not load."));
    document.head.append(script);
  }).catch((reason) => {
    checkoutPromise = null;
    throw reason;
  });

  return checkoutPromise;
}

export async function openRazorpayCheckout(
  order: RazorpayOrder,
  profile: MemberProfile | null,
) {
  await loadRazorpayCheckout();
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.");

  return new Promise<RazorpayCheckoutResult>((resolve, reject) => {
    let settled = false;
    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Sankalp by Tathastu",
      description: `${order.description} · ${order.bookingNumber}`,
      order_id: order.orderId,
      prefill: {
        name: profile?.name ?? undefined,
        contact: profile?.phone ?? undefined,
      },
      theme: { color: "#BD6842" },
      retry: { enabled: true },
      modal: {
        ondismiss: () => {
          if (settled) return;
          settled = true;
          reject(new Error("Payment window closed. Your booking is saved so you can retry."));
        },
      },
      handler: (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      },
    });
    checkout.on("payment.failed", () => {
      if (settled) return;
      settled = true;
      reject(new Error("Payment failed. No booking payment was confirmed."));
    });
    checkout.open();
  });
}
