import test from 'node:test';
import assert from 'node:assert/strict';
import { CLICK_PREFIX, countRegistrationClicks, localClickDate, parseClickId } from '../src/lib/registration-clicks';
import { sendRegistrationClick } from '../src/lib/registration-tracking';
import { GET, POST } from '../src/app/api/registration-click/route';

const ID = 'f27483ad-9ff4-4232-bb95-1e7de52a5a72';

test('clicks contain one event ID and accept no contact or quiz fields', () => {
  assert.equal(parseClickId({ id: ID.toUpperCase() }), ID);
  for (const value of [null, [], {}, { id: '../escape' }, { id: ID, email: 'private@example.test' }, { id: ID, answers: {} }]) {
    assert.equal(parseClickId(value), null);
  }
});

test('daily totals use midnight in Almaty, not the server timezone', () => {
  assert.equal(localClickDate(new Date('2026-10-13T18:59:59Z')), '2026-10-13');
  assert.equal(localClickDate(new Date('2026-10-13T19:00:00Z')), '2026-10-14');
});

test('statistics read every page and exclude unrelated stored files', async () => {
  const cursors: (string | undefined)[] = [];
  const stats = await countRegistrationClicks(async cursor => {
    cursors.push(cursor);
    return cursor ? {
      blobs: [{ pathname: `${CLICK_PREFIX}48b60ec2-fd1a-4090-8a19-dcaee614adad.json`, uploadedAt: new Date('2026-10-13T19:10:00Z') }], hasMore: false,
    } : {
      blobs: [
        { pathname: `${CLICK_PREFIX}${ID}.json`, uploadedAt: new Date('2026-10-13T18:59:00Z') },
        { pathname: 'other/record.json', uploadedAt: new Date('2026-10-13T19:05:00Z') },
      ], hasMore: true, cursor: 'second-page',
    };
  }, new Date('2026-10-13T19:20:00Z'));
  assert.deepEqual(cursors, [undefined, 'second-page']);
  assert.equal(stats.total, 2);
  assert.equal(stats.today, 1);
  assert.deepEqual(stats.days, [{ date: '2026-10-14', clicks: 1 }, { date: '2026-10-13', clicks: 1 }]);
  assert.equal(stats.firstClickAt, '2026-10-13T18:59:00.000Z');
});

test('a new store reports real zeros and storage failures do not become fake zeros', async () => {
  const stats = await countRegistrationClicks(async () => ({ blobs: [], hasMore: false }));
  assert.equal(stats.total, 0); assert.equal(stats.today, 0); assert.equal(stats.firstClickAt, null);
  await assert.rejects(countRegistrationClicks(async () => { throw new Error('Storage offline'); }), /Storage offline/);
});

test('beacon queues only one click, and keepalive handles refused or blocked beacon', async () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalFetch = globalThis.fetch;
  const beacons: Blob[] = [], requests: RequestInit[] = [];
  try {
    globalThis.fetch = async (_url, init) => { requests.push(init ?? {}); return new Response(null, { status: 204 }); };
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { sendBeacon: (_url: string, body: Blob) => { beacons.push(body); return true; } } });
    sendRegistrationClick();
    assert.equal(beacons.length, 1); assert.equal(requests.length, 0);
    assert.ok(parseClickId(JSON.parse(await beacons[0].text())));
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { sendBeacon: () => false } });
    sendRegistrationClick();
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { sendBeacon: () => { throw new Error('Blocked'); } } });
    assert.doesNotThrow(sendRegistrationClick);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].keepalive, true); assert.equal(requests[0].credentials, 'omit');
    const first = parseClickId(JSON.parse(String(requests[0].body)));
    const second = parseClickId(JSON.parse(String(requests[1].body)));
    assert.ok(first); assert.ok(second); assert.notEqual(first, second);
  } finally {
    globalThis.fetch = originalFetch;
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
    else Reflect.deleteProperty(globalThis, 'navigator');
  }
});

test('the API rejects malformed and cross-origin clicks, and ignores previews', async () => {
  const before = { environment: process.env.VERCEL_ENV, token: process.env.BLOB_READ_WRITE_TOKEN, store: process.env.BLOB_STORE_ID };
  const request = (body: string, origin = 'https://ventorme.vercel.app') => new Request('https://ventorme.vercel.app/api/registration-click/', { method: 'POST', headers: { origin }, body });
  try {
    process.env.VERCEL_ENV = 'production'; process.env.BLOB_READ_WRITE_TOKEN = 'test-not-a-real-token';
    assert.equal((await POST(request('{}', 'https://other.test'))).status, 403);
    assert.equal((await POST(request('{'))).status, 400);
    assert.equal((await POST(request(JSON.stringify({ id: ID, email: 'private@example.test' })))).status, 400);
    assert.equal((await POST(request('x'.repeat(513)))).status, 413);
    delete process.env.BLOB_READ_WRITE_TOKEN; delete process.env.BLOB_STORE_ID;
    assert.equal((await POST(request(JSON.stringify({ id: ID })))).status, 503);
    assert.equal((await GET(new Request('https://ventorme.vercel.app/api/registration-click/'))).status, 401);
    process.env.VERCEL_ENV = 'preview';
    assert.equal((await POST(request(JSON.stringify({ id: ID })))).status, 204);
  } finally {
    for (const [key, value] of Object.entries({ VERCEL_ENV: before.environment, BLOB_READ_WRITE_TOKEN: before.token, BLOB_STORE_ID: before.store })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
