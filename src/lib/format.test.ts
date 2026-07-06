import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatMoney,
  formatTime,
  getBookingFulfilmentExpectation,
  getFulfilmentExpectation,
  readableStatus,
  todayIso,
} from "./format";

describe("format helpers", () => {
  it("formats INR minor units", () => {
    expect(formatMoney(25_100)).toBe("Rs 251");
  });

  it("formats date-only values without a timezone shift", () => {
    expect(formatDate("2026-07-07")).toContain("7 Jul");
  });

  it("formats times and statuses for display", () => {
    expect(formatTime("11:54:00")).toMatch(/11:54/);
    expect(readableStatus("pending_assignment")).toBe("Finding your pandit");
  });

  it("creates a local ISO date", () => {
    expect(todayIso(new Date(2026, 6, 5))).toBe("2026-07-05");
  });

  it("promises same-day fulfilment before 2 PM in Mumbai", () => {
    const expectation = getFulfilmentExpectation(new Date("2026-07-05T08:29:00.000Z"));
    expect(expectation.isSameDay).toBe(true);
    expect(expectation.title).toBe("Expected today");
    expect(expectation.dateLabel).toContain("5 Jul");
  });

  it("moves fulfilment to the next day at 2 PM in Mumbai", () => {
    const expectation = getFulfilmentExpectation(new Date("2026-07-05T08:30:00.000Z"));
    expect(expectation.isSameDay).toBe(false);
    expect(expectation.title).toBe("Performed by tomorrow");
    expect(expectation.dateLabel).toContain("6 Jul");
  });

  it("uses the server cutoff decision in an existing booking explanation", () => {
    expect(getBookingFulfilmentExpectation(todayIso(), false).detail).toContain(
      "at or after 2 PM",
    );
    expect(getBookingFulfilmentExpectation(todayIso(), true).detail).toContain(
      "before 2 PM",
    );
  });
});
