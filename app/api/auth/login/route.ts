import { cookies } from "next/headers";

export async function GET(request: Request) {
  const appId = process.env.FEISHU_APP_ID;
  if (!appId) return Response.json({ error: "FEISHU_APP_ID is missing" }, { status: 500 });
  const state = crypto.randomUUID();
  const origin = process.env.APP_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;
  const store = await cookies();
  store.set("feishu_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://accounts.feishu.cn/open-apis/authen/v1/authorize");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "calendar:calendar.event:read");
  url.searchParams.set("state", state);
  return Response.redirect(url);
}
