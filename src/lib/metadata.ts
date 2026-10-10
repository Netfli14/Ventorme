import type { Metadata } from 'next';
import { dictionaries, locales, type Locale } from './i18n';
import { SITE_URL } from './config';
export function localizedMetadata(locale: Locale, route: 'quiz' | 'result' | '' = ''): Metadata {
  const d = dictionaries[locale], path = `/${locale}/${route ? route + '/' : ''}`;
  const title = route === 'quiz' ? `${d.common.quiz} · Ventorme` : route === 'result' ? `${d.result.title} · Ventorme` : d.meta.title;
  const ogLocale = { ru: 'ru_RU', en: 'en_US', kk: 'kk_KZ', uz: 'uz_UZ', zh: 'zh_CN', tr: 'tr_TR' }[locale];
  return { title, description: d.meta.description, alternates: { canonical: path, languages: Object.fromEntries(locales.map(l => [l, `/${l}/${route ? route + '/' : ''}`])) }, openGraph: { title, description: d.meta.description, url: new URL(path, SITE_URL).toString(), type: 'website', siteName: 'Ventorme', locale: ogLocale, images: [{ url: `/og/${locale}.png`, width: 1200, height: 630, alt: d.meta.title }] }, twitter: { card: 'summary_large_image', title, description: d.meta.description, images: [`/og/${locale}.png`] } };
}
