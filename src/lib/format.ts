export function formatMoney(minorUnits: number | null | undefined, currency = "INR") {
  const amount = Math.round((minorUnits ?? 0) / 100);
  return currency === "INR" ? `Rs ${amount}` : `${currency} ${amount}`;
}

export function formatDate(isoDate: string | null | undefined) {
  if (!isoDate) return "Flexible";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`));
}

export function formatTime(time: string | null | undefined) {
  if (!time) return "Anytime";
  const [hours, minutes] = time.split(":");
  const value = new Date();
  value.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function todayIso(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readableStatus(status: string) {
  const labels: Record<string, string> = {
    pending_payment: "Payment pending",
    pending_assignment: "Finding your pandit",
    pandit_assigned: "Pandit assigned",
    ritual_scheduled: "Ritual scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export interface FulfilmentExpectation {
  isSameDay: boolean;
  title: string;
  dateLabel: string;
  serviceDateIso: string;
  detail: string;
}

export function getFulfilmentExpectation(now = new Date()): FulfilmentExpectation {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const hour = value("hour");
  const isSameDay = hour < 14;
  const serviceDate = new Date(Date.UTC(year, month - 1, day + (isSameDay ? 0 : 1)));
  const serviceDateIso = serviceDate.toISOString().slice(0, 10);
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(serviceDate);

  if (isSameDay) {
    return {
      isSameDay,
      title: "Expected today",
      dateLabel: `Today, ${formattedDate}`,
      serviceDateIso,
      detail:
        "Booked before 2 PM. If today is an inauspicious day, the ritual will be performed by tomorrow.",
    };
  }

  return {
    isSameDay,
    title: "Performed by tomorrow",
    dateLabel: `By ${formattedDate}`,
    serviceDateIso,
    detail: "Bookings placed at or after 2 PM are performed by the end of the next day.",
  };
}

export function getBookingFulfilmentExpectation(
  serviceDateIso: string | null | undefined,
  bookedBeforeCutoff: boolean,
  now = new Date(),
): FulfilmentExpectation {
  if (!serviceDateIso) return getFulfilmentExpectation(now);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? "";
  const today = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
  const tomorrowDate = new Date(`${today}T00:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const formattedDate = formatDate(serviceDateIso);
  const isSameDay = serviceDateIso === today;

  return {
    isSameDay,
    title: isSameDay
      ? bookedBeforeCutoff
        ? "Expected today"
        : "Performed by end of today"
      : serviceDateIso === tomorrow
        ? "Performed by tomorrow"
        : "Scheduled performance",
    dateLabel: isSameDay ? `Today, ${formattedDate}` : `By ${formattedDate}`,
    serviceDateIso,
    detail: bookedBeforeCutoff
      ? "Booked before 2 PM. If today is an inauspicious day, the ritual will be performed by tomorrow."
      : "Booked at or after 2 PM. The ritual will be performed by the end of the next day.",
  };
}
