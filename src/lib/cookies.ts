export const CONSENT_KEY = 'ventorme.cookies.v1';
export const CONSENT_EVENT = 'ventorme:cookie-consent';
export const COOKIE_SETTINGS_EVENT = 'ventorme:cookie-settings';
const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;

export type CookieConsent = { version: 1; preferences: boolean; updatedAt: number };

export function parseCookieConsent(raw: string | null, now = Date.now()): CookieConsent | null {
  if (!raw || raw.length > 512) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const consent = value as Partial<CookieConsent>;
    if (consent.version !== 1 || typeof consent.preferences !== 'boolean' ||
        typeof consent.updatedAt !== 'number' || !Number.isFinite(consent.updatedAt) ||
        consent.updatedAt > now || now - consent.updatedAt >= CONSENT_LIFETIME) return null;
    return { version: 1, preferences: consent.preferences, updatedAt: consent.updatedAt };
  } catch { return null; }
}

export function readCookieConsent(): CookieConsent | null {
  try { return parseCookieConsent(window.localStorage.getItem(CONSENT_KEY)); }
  catch { return null; }
}

export function saveCookieConsent(preferences: boolean): void {
  const consent: CookieConsent = { version: 1, preferences, updatedAt: Date.now() };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    if (preferences) window.localStorage.setItem('ventorme.theme', document.documentElement.dataset.theme ?? 'light');
    else window.localStorage.removeItem('ventorme.theme');
  } catch { /* Choices still apply for this visit when storage is blocked. */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
