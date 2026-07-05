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
  return status.replaceAll("_", " ");
}
