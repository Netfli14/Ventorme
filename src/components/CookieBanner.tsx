'use client';

import { useEffect, useState } from 'react';
import { Cookie, ChevronDown } from 'lucide-react';
import { dictionaries, type Locale } from '@/lib/i18n';
import { COOKIE_SETTINGS_EVENT, readCookieConsent, saveCookieConsent } from '@/lib/cookies';

export function CookieBanner({ locale }: { locale: Locale }) {
  const copy = dictionaries[locale].cookies;
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    setVisible(!readCookieConsent());
    const reopen = () => { setDetails(true); setVisible(true); };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function choose(preferences: boolean) {
    saveCookieConsent(preferences);
    setVisible(false);
    setDetails(false);
  }

  if (!visible) return null;
  return <aside className="cookie-banner" aria-labelledby="cookies-heading" aria-describedby="cookies-description">
    <div className="cookie-banner__heading"><Cookie size={22} aria-hidden="true" /><h2 id="cookies-heading">{copy.title}</h2></div>
    <p id="cookies-description">{copy.description}</p>
    <button className="cookie-banner__policy text-button" type="button" aria-expanded={details} aria-controls="cookie-policy" onClick={() => setDetails(value => !value)}>
      {copy.policy}<ChevronDown size={16} className={details ? 'rotated' : ''} aria-hidden="true" />
    </button>
    {details && <div id="cookie-policy" className="cookie-banner__details"><p>{copy.necessary}</p><p>{copy.preferences}</p><p>{copy.analytics}</p></div>}
    <div className="cookie-banner__actions">
      <button className="button button-primary" type="button" onClick={() => choose(true)}>{copy.accept}</button>
      <button className="button button-outline" type="button" onClick={() => choose(false)}>{copy.essential}</button>
    </div>
  </aside>;
}
