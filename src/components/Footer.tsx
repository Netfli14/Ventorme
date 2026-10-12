import { dictionaries, type Locale } from '@/lib/i18n';
import { officialLinks, REGISTER_URL } from '@/lib/config';
import { LanguageSelector } from './Header';
import { Compass } from 'lucide-react';
import { CookieSettingsButton } from './CookieSettingsButton';
export function Footer({ locale }: { locale: Locale }) {
  const d = dictionaries[locale];
  return <footer className="site-footer"><div className="container"><div className="footer-top"><a className="wordmark" href={officialLinks.home}><Compass size={22} aria-hidden="true" />Ventorme<span className="brand-period" aria-hidden="true">.</span></a><LanguageSelector locale={locale} /></div><div className="footer-bottom"><p>{d.common.footerNote}</p><CookieSettingsButton locale={locale} /><a href={officialLinks.home}>{d.common.platform}</a></div>{!REGISTER_URL && <p className="configuration-note" role="status">{d.common.previewLabel}: {d.common.registerUnavailable}</p>}</div></footer>;
}
