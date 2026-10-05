import { getCalendarEvents } from "@/lib/feishu";
import { getSession } from "@/lib/session";
import { deriveStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const now = new Date();
    const result = deriveStatus(now, await getCalendarEvents(session));
    return Response.json({ ...result, refreshedAt: now.toISOString() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "calendar_unavailable" },
      { status: 503 },
    );
  }
}
