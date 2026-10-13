const ENDPOINT = '/api/registration-click/';

export function sendRegistrationClick(): void {
  // A fresh ID belongs to this click, never to a person or browser session.
  // Neither transport delays nor prevents the normal registration navigation.
  try {
    const body = JSON.stringify({ id: crypto.randomUUID() });
    try {
      if (typeof navigator.sendBeacon === 'function' &&
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
    } catch { /* Try the keepalive transport if beacon is blocked. */ }
    void fetch(ENDPOINT, {
      method: 'POST', body, keepalive: true, credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => { /* Registration still opens if counting is unavailable. */ });
  } catch { /* Tracking must never interrupt registration. */ }
}
