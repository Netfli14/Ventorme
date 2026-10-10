import { notFound } from 'next/navigation';
import { locales, isLocale, dictionaries } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  return <><a className="skip-link" href="#main-content">{dictionaries[locale].common.skip}</a><Header locale={locale} />{children}<Footer locale={locale} /></>;
}
