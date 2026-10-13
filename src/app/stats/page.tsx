import type { Metadata } from 'next';
import { RegistrationStats } from '@/components/RegistrationStats';

export const metadata: Metadata = { title: 'Клики по регистрации · Ventorme', robots: { index: false, follow: false } };

export default function StatsPage() { return <RegistrationStats />; }
