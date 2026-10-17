import { dictionaries, type Locale } from '@/lib/i18n';
import { officialLinks, REGISTER_URL } from '@/lib/config';
import { LanguageSelector } from './Header';
import { CookieSettingsButton } from './CookieSettingsButton';
export function Footer({ locale }: { locale: Locale }) {
  const d = dictionaries[locale];
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-bottom">
          <LanguageSelector locale={locale} />
          <CookieSettingsButton locale={locale} />
          <a href={officialLinks.home}>{d.common.platform}</a>
        </div>
        {!REGISTER_URL && <p className="configuration-note" role="status">{d.common.previewLabel}: {d.common.registerUnavailable}</p>}
      </div>
    </footer>
  );
}
