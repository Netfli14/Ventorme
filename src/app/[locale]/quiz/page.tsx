import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { localizedMetadata } from '@/lib/metadata';
import { QuizShell } from '@/components/QuizShell';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return localizedMetadata(locale, 'quiz'); }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <QuizShell locale={locale} />; }
