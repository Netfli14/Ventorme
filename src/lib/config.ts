export function registrationUrl(teamNumber: string | undefined): string | null {
  // Never invent a team number. Preserve all official leading zeros.
  if (!teamNumber || !/^[0-9]{1,12}$/.test(teamNumber)) return null;
  const url = new URL('https://ventorme.ai/register');
  url.searchParams.set('utm_source', 'hacknext');
  url.searchParams.set('utm_campaign', `team-${teamNumber}`);
  return url.toString();
}
export const TEAM_NUMBER = process.env.NEXT_PUBLIC_TEAM_NUMBER;
export const REGISTER_URL = registrationUrl(TEAM_NUMBER);
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ventorme-next-step.yerzhanuly-y.chatgpt.site';
export const officialLinks = { home: 'https://ventorme.ai/', terms: 'https://ventorme.ai/terms', privacy: 'https://ventorme.ai/privacy' };
