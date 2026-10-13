import { list, put, BlobError } from '@vercel/blob';
import { CLICK_PREFIX, countRegistrationClicks, parseClickId } from '@/lib/registration-clicks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function configured() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID); }
function production() { return process.env.VERCEL_ENV === 'production'; }

export async function POST(request: Request) {
  if (!production()) return new Response(null, { status: 204 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!configured()) return new Response(null, { status: 503 });
  if (Number(request.headers.get('content-length') ?? 0) > 512) return new Response(null, { status: 413 });
  let id: string | null;
  try {
    const body = await request.text();
    if (body.length > 512) return new Response(null, { status: 413 });
    id = parseClickId(JSON.parse(body));
  } catch { return new Response(null, { status: 400 }); }
  if (!id) return new Response(null, { status: 400 });
  try {
    // One immutable record per click makes parallel writes safe. Reusing an ID
    // never overwrites a record or adds another click to the aggregate.
    await put(`${CLICK_PREFIX}${id}.json`, JSON.stringify({ event: 'registration_click' }), {
      access: 'private', addRandomSuffix: false, allowOverwrite: false,
      contentType: 'application/json',
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof BlobError && error.message.toLowerCase().includes('already exists')) {
      return new Response(null, { status: 204 });
    }
    console.error('Registration click could not be saved.');
    return new Response(null, { status: 503 });
  }
}

export async function GET() {
  if (!production() || !configured()) return Response.json({ error: 'unavailable' }, { status: 503 });
  try {
    const stats = await countRegistrationClicks(cursor => list({ prefix: CLICK_PREFIX, cursor, limit: 1000 }));
    return Response.json(stats, { headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30',
      'X-Robots-Tag': 'noindex',
    } });
  } catch {
    console.error('Registration click statistics could not be read.');
    return Response.json({ error: 'unavailable' }, { status: 503 });
  }
}
