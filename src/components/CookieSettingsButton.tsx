'use client';
import { dictionaries, type Locale } from '@/lib/i18n';
import { openCookieSettings } from '@/lib/cookies';

export function CookieSettingsButton({ locale }: { locale: Locale }) {
  return <button className="text-button" type="button" onClick={openCookieSettings}>{dictionaries[locale].cookies.settings}</button>;
}
