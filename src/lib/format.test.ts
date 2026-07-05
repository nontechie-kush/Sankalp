import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, formatTime, readableStatus, todayIso } from "./format";

describe("format helpers", () => {
  it("formats INR minor units", () => {
    expect(formatMoney(25_100)).toBe("Rs 251");
  });

  it("formats date-only values without a timezone shift", () => {
    expect(formatDate("2026-07-07")).toContain("7 Jul");
  });

  it("formats times and statuses for display", () => {
    expect(formatTime("11:54:00")).toMatch(/11:54/);
    expect(readableStatus("pending_assignment")).toBe("pending assignment");
  });

  it("creates a local ISO date", () => {
    expect(todayIso(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
});
