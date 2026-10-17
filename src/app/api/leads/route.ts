import { parseLead } from "@/lib/lead-validation";
import { makeRoute } from "@/lib/route-model";
import {
  savePrivate,
  readPrivate,
  storageConfigured,
} from "@/lib/server-store";
import {
  sameOrigin,
  privateHeaders,
  allowRequest,
  authConfigured,
} from "@/lib/server-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "origin" },
      { status: 403, headers: privateHeaders },
    );
  if (!storageConfigured() || !authConfigured())
    return Response.json(
      { error: "not_configured" },
      { status: 503, headers: privateHeaders },
    );
  let input;
  try {
    const raw = await request.text();
    if (raw.length > 16000)
      return Response.json({ error: "too_large" }, { status: 413 });
    input = parseLead(JSON.parse(raw));
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (!input)
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: privateHeaders },
    );
  try {
    if (!(await allowRequest(request, "lead", 10, 60 * 60 * 1000)))
      return Response.json(
        { error: "rate_limit" },
        { status: 429, headers: privateHeaders },
      );
    const record = {
      ...input,
      route: makeRoute(input.answers, input.locale),
      source: "team-004",
      createdAt: new Date().toISOString(),
      consentVersion: "team004-route-v1",
    };
    const saved = await savePrivate(`leads/${input.id}.json`, record);
    if (saved === "exists") {
      const existing = await readPrivate<typeof record>(
        `leads/${input.id}.json`,
      );
      if (
        !existing ||
        existing.name !== input.name ||
        existing.email !== input.email ||
        JSON.stringify(existing.answers) !== JSON.stringify(input.answers)
      )
        return Response.json(
          { error: "conflict" },
          { status: 409, headers: privateHeaders },
        );
    }
    return Response.json(
      { saved: true },
      { status: 201, headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "save_failed" },
      { status: 503, headers: privateHeaders },
    );
  }
}
