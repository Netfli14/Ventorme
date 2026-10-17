import {
  createHmac,
  scryptSync,
  timingSafeEqual,
  randomBytes,
} from "node:crypto";
import { savePrivate, storageConfigured } from "./server-store";
export const SESSION_COOKIE = "ventorme_admin";
export const authConfigured = () =>
  Boolean(
    /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(
      process.env.VENTORME_ADMIN_PASSWORD_HASH || "",
    ) &&
      process.env.VENTORME_SESSION_SECRET &&
      process.env.VENTORME_SESSION_SECRET.length >= 32,
  );
function equal(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function passwordMatches(password: string) {
  if (!authConfigured()) return false;
  const [, salt, hash] = process.env.VENTORME_ADMIN_PASSWORD_HASH!.split(":");
  return equal(scryptSync(password, salt, 64).toString("hex"), hash);
}
export function createSession(now = Date.now()) {
  const payload = `${now + 8 * 60 * 60 * 1000}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", process.env.VENTORME_SESSION_SECRET!).update(payload).digest("hex")}`;
}
export function validSession(token: string, now = Date.now()) {
  if (!authConfigured() || token.length > 200) return false;
  const [expires, nonce, signature, ...rest] = token.split(".");
  if (
    rest.length ||
    !/^\d+$/.test(expires) ||
    !nonce ||
    !/^[a-f0-9]{32}$/.test(nonce) ||
    !signature ||
    Number(expires) <= now ||
    Number(expires) > now + 8 * 60 * 60 * 1000
  )
    return false;
  return equal(
    signature,
    createHmac("sha256", process.env.VENTORME_SESSION_SECRET!)
      .update(`${expires}.${nonce}`)
      .digest("hex"),
  );
}
export function authorized(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const token = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return Boolean(token && validSession(token));
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.host;
    return new URL(origin).origin === `${url.protocol}//${host}`;
  } catch {
    return false;
  }
}
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
  Vary: "Cookie",
};
export const cookieOptions = (request: Request) =>
  `Path=/; HttpOnly; SameSite=Strict; ${new URL(request.url).protocol === "https:" ? "Secure; " : ""}`;

// Fixed-slot immutable writes enforce limits across serverless instances.
// No raw IP is stored. Authentication fails closed if the limiter is unavailable.
export async function allowRequest(
  request: Request,
  action: "login" | "lead",
  limit: number,
  windowMs: number,
) {
  if (!storageConfigured() || !process.env.VENTORME_SESSION_SECRET)
    return false;
  const bucket = Math.floor(Date.now() / windowMs),
    ip =
      request.headers.get("x-vercel-forwarded-for") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "local";
  const fingerprint = createHmac("sha256", process.env.VENTORME_SESSION_SECRET)
    .update(`${action}:${ip}:${bucket}`)
    .digest("hex");
  for (let i = 0; i < limit; i++)
    if (
      (await savePrivate(
        `rate-limits/${action}/${bucket}/${fingerprint}-${i}.json`,
        { expiresAt: (bucket + 1) * windowMs },
      )) === "created"
    )
      return true;
  return false;
}
