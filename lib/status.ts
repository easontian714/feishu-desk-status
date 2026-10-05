export type DeskStatus = "working" | "meeting" | "lunch" | "off";

export type CalendarEvent = {
  start: string;
  end: string;
  status?: string;
  freeBusyStatus?: string;
  selfRsvpStatus?: string;
  isAllDay?: boolean;
  summary?: string;
};

export type StatusResult = {
  status: DeskStatus;
  until: string | null;
};

const PLACEHOLDER_PATTERNS = [/跨时区会议专用时间段/i, /仅提醒/i];

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function isActiveMeeting(event: CalendarEvent, now: Date) {
  const title = event.summary ?? "";
  return (
    !event.isAllDay &&
    !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(title)) &&
    event.status !== "cancelled" &&
    event.freeBusyStatus !== "free" &&
    event.selfRsvpStatus === "accept" &&
    new Date(event.start) <= now &&
    new Date(event.end) > now
  );
}

export function deriveStatus(
  now: Date,
  events: CalendarEvent[],
  timeZone = "Europe/London",
): StatusResult {
  const activeMeetings = events.filter((event) => isActiveMeeting(event, now));
  if (activeMeetings.length > 0) {
    const latestEnd = activeMeetings.reduce((latest, event) => {
      const end = new Date(event.end);
      return end > latest ? end : latest;
    }, new Date(0));
    return { status: "meeting", until: latestEnd.toISOString() };
  }

  const { weekday, minutes } = partsAt(now, timeZone);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  if (!isWeekday || minutes < 9 * 60 || minutes >= 21 * 60) {
    return { status: "off", until: null };
  }
  if (minutes >= 12 * 60 + 30 && minutes < 13 * 60 + 30) {
    return { status: "lunch", until: null };
  }
  return { status: "working", until: null };
}
