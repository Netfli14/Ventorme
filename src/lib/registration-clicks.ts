export const CLICK_PREFIX = 'registration-clicks/';
export const CLICK_TIMEZONE = 'Asia/Almaty';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: CLICK_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function parseClickId(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 1) return null;
  const id = (value as { id?: unknown }).id;
  return typeof id === 'string' && UUID.test(id) ? id.toLowerCase() : null;
}

export function localClickDate(value: Date): string {
  const parts = dateFormatter.formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export type ClickStats = {
  total: number;
  today: number;
  days: { date: string; clicks: number }[];
  firstClickAt: string | null;
  updatedAt: string;
  timezone: string;
};

type ClickPage = { blobs: { pathname: string; uploadedAt: Date }[]; hasMore: boolean; cursor?: string };

export async function countRegistrationClicks(
  readPage: (cursor?: string) => Promise<ClickPage>,
  now = new Date(),
): Promise<ClickStats> {
  let total = 0, cursor: string | undefined, firstClickAt: Date | null = null;
  const counts = new Map<string, number>();
  do {
    const page = await readPage(cursor);
    for (const blob of page.blobs) {
      if (!blob.pathname.startsWith(CLICK_PREFIX) || !blob.pathname.endsWith('.json') ||
          !UUID.test(blob.pathname.slice(CLICK_PREFIX.length).replace(/\.json$/, ''))) continue;
      total++;
      const date = localClickDate(blob.uploadedAt);
      counts.set(date, (counts.get(date) ?? 0) + 1);
      if (!firstClickAt || blob.uploadedAt < firstClickAt) firstClickAt = blob.uploadedAt;
    }
    if (!page.hasMore) break;
    if (!page.cursor || page.cursor === cursor) throw new Error('Invalid click pagination');
    cursor = page.cursor;
  } while (true);
  return {
    total, today: counts.get(localClickDate(now)) ?? 0,
    days: [...counts].sort(([a], [b]) => b.localeCompare(a)).map(([date, clicks]) => ({ date, clicks })),
    firstClickAt: firstClickAt?.toISOString() ?? null,
    updatedAt: now.toISOString(), timezone: CLICK_TIMEZONE,
  };
}
