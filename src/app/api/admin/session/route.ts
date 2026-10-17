import {
  authorized,
  authConfigured,
  passwordMatches,
  createSession,
  SESSION_COOKIE,
  sameOrigin,
  privateHeaders,
  cookieOptions,
  allowRequest,
} from "@/lib/server-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return Response.json(
    { authenticated: authorized(request), configured: authConfigured() },
    { headers: privateHeaders },
  );
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!authConfigured())
    return Response.json(
      { error: "not_configured" },
      { status: 503, headers: privateHeaders },
    );
  try {
    const raw = await request.text();
    if (raw.length > 512) return new Response(null, { status: 413 });
    const x = JSON.parse(raw);
    if (typeof x.password !== "string" || x.password.length > 256)
      return new Response(null, { status: 400 });
    if (!(await allowRequest(request, "login", 5, 15 * 60 * 1000)))
      return Response.json(
        { error: "rate_limit" },
        { status: 429, headers: privateHeaders },
      );
    if (!passwordMatches(x.password))
      return Response.json(
        { error: "credentials" },
        { status: 401, headers: privateHeaders },
      );
    return Response.json(
      { authenticated: true },
      {
        headers: {
          ...privateHeaders,
          "Set-Cookie": `${SESSION_COOKIE}=${createSession()}; ${cookieOptions(request)}Max-Age=28800`,
        },
      },
    );
  } catch {
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...privateHeaders,
      "Set-Cookie": `${SESSION_COOKIE}=; ${cookieOptions(request)}Max-Age=0`,
    },
  });
}
