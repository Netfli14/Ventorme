import type { Metadata } from 'next';
import { RegistrationStats } from '@/components/RegistrationStats';

export const metadata: Metadata = { title: 'Заявки и статистика · VentorMe', robots: { index: false, follow: false } };

export default function StatsPage() { return <RegistrationStats />; }
