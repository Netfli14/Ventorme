import { authorized, privateHeaders } from "@/lib/server-auth";
import {
  listPrivate,
  readPrivate,
  storageConfigured,
} from "@/lib/server-store";
import {
  CLICK_PREFIX,
  countRegistrationClicks,
} from "@/lib/registration-clicks";
import { buildFunnel } from "@/lib/funnel";
import type { LeadInput } from "@/lib/lead-validation";
import { restoreRoute, type makeRoute } from "@/lib/route-model";
export type LeadRecord = LeadInput & {
  route: ReturnType<typeof makeRoute>;
  source: string;
  createdAt: string;
  consentVersion: string;
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorized(request))
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: privateHeaders },
    );
  if (!storageConfigured())
    return Response.json(
      { error: "not_configured" },
      { status: 503, headers: privateHeaders },
    );
  try {
    const [events, leadFiles, clickFiles] = await Promise.all([
      listPrivate("route-events/"),
      listPrivate("leads/"),
      listPrivate(CLICK_PREFIX),
    ]);
    const clickStats = await countRegistrationClicks(async () => ({
      blobs: clickFiles,
      hasMore: false,
    }));
    const sorted = leadFiles
      .filter((x) => /^leads\/[a-f0-9-]{36}\.json$/.test(x.pathname))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    const offset = Math.max(
      0,
      Math.min(
        100000,
        Number(new URL(request.url).searchParams.get("offset")) || 0,
      ),
    );
    // Read in bounded batches; all records stay behind the same authorization check.
    const journeys: string[] = [];
    const page: LeadRecord[] = [];
    for (let i = 0; i < sorted.length; i += 20) {
      const batch = await Promise.all(
        sorted.slice(i, i + 20).map((x) => readPrivate<LeadRecord>(x.pathname)),
      );
      for (let j = 0; j < batch.length; j++) {
        const r = batch[j];
        if (r) {
          journeys.push(r.journeyId);
          if (i + j >= offset && i + j < offset + 25) {
            const answers = restoreRoute(r.answers);
            if (answers) page.push({...r, answers});
          }
        }
      }
    }
    return Response.json(
      {
        clickStats,
        funnel: buildFunnel(
          events.map((e) => e.pathname),
          journeys,
        ),
        leads: page,
        totalLeads: journeys.length,
        offset,
        nextOffset: offset + 25 < sorted.length ? offset + 25 : null,
        updatedAt: new Date().toISOString(),
        confirmedRegistrations: null,
      },
      { headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
