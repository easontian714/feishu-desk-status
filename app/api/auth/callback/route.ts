import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/feishu";
import { setSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get("feishu_oauth_state")?.value;
  if (!code || !state || state !== expectedState) {
    return Response.redirect(new URL("/?auth=failed", request.url));
  }
  store.delete("feishu_oauth_state");
  const origin = process.env.APP_URL || url.origin;
  try {
    await setSession(await exchangeCode(code, `${origin}/api/auth/callback`));
    return Response.redirect(new URL("/", request.url));
  } catch {
    return Response.redirect(new URL("/?auth=failed", request.url));
  }
}
