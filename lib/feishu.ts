import type { CalendarEvent } from "./status";
import { setSession, type Session } from "./session";

const API = "https://open.feishu.cn/open-apis";
const TOKEN_ENDPOINT = "https://accounts.feishu.cn/oauth/v3/token";

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  open_id?: string;
};

async function tokenRequest(body: Record<string, string>) {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Feishu app credentials are missing");
  const form = new URLSearchParams({
    ...body,
    client_id: appId,
    client_secret: appSecret,
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });
  const data = (await response.json()) as TokenPayload & {
    code?: number;
    msg?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.msg || data.error || `Unable to obtain Feishu access token (${response.status})`,
    );
  }
  return data;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<Session> {
  const data = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
  console.info("[oauth] token sizes:", {
    accessToken: data.access_token.length,
    refreshToken: data.refresh_token?.length ?? 0,
  });
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: data.refresh_token_expires_in
      ? Date.now() + data.refresh_token_expires_in * 1000
      : undefined,
    openId: data.open_id,
  };
}

async function activeSession(session: Session) {
  if (session.expiresAt > Date.now() + 60_000) return session;
  const data = await tokenRequest({ grant_type: "refresh_token", refresh_token: session.refreshToken });
  const refreshed: Session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: data.refresh_token_expires_in
      ? Date.now() + data.refresh_token_expires_in * 1000
      : session.refreshExpiresAt,
    openId: session.openId || data.open_id,
  };
  await setSession(refreshed);
  return refreshed;
}

async function apiGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await response.json()) as { code?: number; msg?: string; data?: T } & T;
  if (!response.ok || (data.code !== undefined && data.code !== 0)) {
    throw new Error(data.msg || `Feishu request failed (${response.status})`);
  }
  return (data.data ?? data) as T;
}

type FeishuEvent = {
  start_time?: { timestamp?: string };
  end_time?: { timestamp?: string };
  status?: string;
  free_busy_status?: string;
  summary?: string;
  is_all_day?: boolean;
  organizer?: { id?: string };
  attendees?: Array<{ attendee_id?: string; open_id?: string; rsvp_status?: string }>;
};

export async function getCalendarEvents(session: Session): Promise<CalendarEvent[]> {
  const current = await activeSession(session);
  const primary = await apiGet<{ calendars?: Array<{ calendar_id: string }> }>(
    "/calendar/v4/calendars/primary",
    current.accessToken,
  );
  const calendarId = primary.calendars?.[0]?.calendar_id;
  if (!calendarId) throw new Error("Primary calendar was not found");

  const nowSeconds = Math.floor(Date.now() / 1000);
  const start = nowSeconds - 24 * 60 * 60;
  const end = nowSeconds + 24 * 60 * 60;
  const query = new URLSearchParams({
    start_time: String(start),
    end_time: String(end),
    page_size: "500",
  });
  const result = await apiGet<{ items?: FeishuEvent[] }>(
    `/calendar/v4/calendars/${encodeURIComponent(calendarId)}/events?${query}`,
    current.accessToken,
  );

  return (result.items ?? []).flatMap((item) => {
    const startTimestamp = item.start_time?.timestamp;
    const endTimestamp = item.end_time?.timestamp;
    if (!startTimestamp || !endTimestamp) return [];
    const ownAttendee = item.attendees?.find(
      (attendee) => attendee.attendee_id === current.openId || attendee.open_id === current.openId,
    );
    const isOrganizer = item.organizer?.id === current.openId;
    return [{
      start: new Date(Number(startTimestamp) * 1000).toISOString(),
      end: new Date(Number(endTimestamp) * 1000).toISOString(),
      status: item.status,
      freeBusyStatus: item.free_busy_status,
      selfRsvpStatus: isOrganizer ? "accept" : ownAttendee?.rsvp_status,
      isAllDay: item.is_all_day,
      summary: item.summary,
    }];
  });
}
