import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { localizedMetadata } from '@/lib/metadata';
import { ResultSummary } from '@/components/ResultSummary';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return localizedMetadata(locale, 'result'); }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <ResultSummary locale={locale} />; }
