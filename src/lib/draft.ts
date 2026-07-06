import type { BookingDraft } from "../types";

const DRAFT_KEY = "sankalp-booking-draft-v1";
const RETURN_TO_KEY = "sankalp-auth-return-to-v1";

export function createBookingDraft(useCaseId: string): BookingDraft {
  return {
    useCaseId,
    startedAt: new Date().toISOString(),
    clientRequestId: crypto.randomUUID(),
    paymentIdempotencyKey: crypto.randomUUID(),
  };
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<BookingDraft>;
    if (
      typeof value.useCaseId !== "string" ||
      typeof value.startedAt !== "string" ||
      Number.isNaN(Date.parse(value.startedAt)) ||
      typeof value.clientRequestId !== "string" ||
      typeof value.paymentIdempotencyKey !== "string"
    ) {
      return null;
    }
    return value as BookingDraft;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: BookingDraft) {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearBookingDraft() {
  window.sessionStorage.removeItem(DRAFT_KEY);
}

export function saveAuthReturnTo(path: string) {
  window.sessionStorage.setItem(RETURN_TO_KEY, path);
}

export function consumeAuthReturnTo(fallback = "/bookings") {
  const path = window.sessionStorage.getItem(RETURN_TO_KEY) || fallback;
  window.sessionStorage.removeItem(RETURN_TO_KEY);
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
