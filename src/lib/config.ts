export function registrationUrl(teamNumber: string | undefined): string | null {
  // Never invent a team number. Preserve all official leading zeros.
  if (!teamNumber || !/^[0-9]{1,12}$/.test(teamNumber)) return null;
  const url = new URL('https://ventorme.ai/register');
  url.searchParams.set('utm_source', 'hacknext');
  url.searchParams.set('utm_campaign', `team-${teamNumber}`);
  return url.toString();
}
// HACKNEXT assigns this landing to team 004. Pin the attribution so an
// outdated deployment environment cannot send visitors to another team.
export const TEAM_NUMBER = '004';
export const REGISTER_URL = registrationUrl(TEAM_NUMBER);
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ventorme1.vercel.app';
export const officialLinks = { home: 'https://ventorme.ai/', terms: 'https://ventorme.ai/terms', privacy: 'https://ventorme.ai/privacy' };
