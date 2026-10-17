import { eventNames, uuidPattern } from "@/lib/route-model";
import { savePrivate, storageConfigured } from "@/lib/server-store";
import { sameOrigin, privateHeaders } from "@/lib/server-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!storageConfigured()) return new Response(null, { status: 503 });
  let x;
  try {
    const raw = await request.text();
    if (raw.length > 512) return new Response(null, { status: 413 });
    x = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (
    !x ||
    Object.keys(x).length !== 2 ||
    !eventNames.includes(x.event) ||
    typeof x.journeyId !== "string" ||
    !uuidPattern.test(x.journeyId)
  )
    return new Response(null, { status: 400 });
  try {
    await savePrivate(
      `route-events/${x.event}/${x.journeyId.toLowerCase()}.json`,
      {
        event: x.event,
        journeyId: x.journeyId.toLowerCase(),
        source: "team-004",
        createdAt: new Date().toISOString(),
      },
    );
    return new Response(null, { status: 204, headers: privateHeaders });
  } catch {
    return new Response(null, { status: 503 });
  }
}
