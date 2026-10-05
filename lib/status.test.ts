import { describe, expect, it } from "vitest";
import { deriveStatus, type CalendarEvent } from "./status";

const event = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  start: "2026-10-05T09:30:00.000Z",
  end: "2026-10-05T10:30:00.000Z",
  status: "confirmed",
  freeBusyStatus: "busy",
  selfRsvpStatus: "accept",
  ...overrides,
});

describe("deriveStatus", () => {
  it("shows working during weekday work hours", () => {
    expect(deriveStatus(new Date("2026-10-05T10:00:00.000Z"), [])).toEqual({
      status: "working",
      until: null,
    });
  });

  it("shows lunch during the configured lunch window", () => {
    expect(deriveStatus(new Date("2026-10-05T11:45:00.000Z"), []).status).toBe("lunch");
  });

  it("shows off after 21:00 and on weekends", () => {
    expect(deriveStatus(new Date("2026-10-05T20:30:00.000Z"), []).status).toBe("off");
    expect(deriveStatus(new Date("2026-10-10T10:00:00.000Z"), []).status).toBe("off");
  });

  it("lets an accepted busy meeting override lunch", () => {
    expect(deriveStatus(new Date("2026-10-05T10:00:00.000Z"), [event()])).toEqual({
      status: "meeting",
      until: "2026-10-05T10:30:00.000Z",
    });
  });

  it("ignores declined, free, all-day and placeholder events", () => {
    const now = new Date("2026-10-05T10:00:00.000Z");
    const ignored = [
      event({ selfRsvpStatus: "decline" }),
      event({ freeBusyStatus: "free" }),
      event({ isAllDay: true }),
      event({ summary: "跨时区会议专用时间段" }),
    ];
    expect(deriveStatus(now, ignored).status).toBe("working");
  });

  it("uses the latest end time for overlapping meetings", () => {
    const now = new Date("2026-10-05T10:00:00.000Z");
    const result = deriveStatus(now, [event(), event({ end: "2026-10-05T11:00:00.000Z" })]);
    expect(result.until).toBe("2026-10-05T11:00:00.000Z");
  });
});
