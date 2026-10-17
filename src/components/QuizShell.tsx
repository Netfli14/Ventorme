'use client';
import { RouteExperience } from './RouteExperience';
import type { Locale } from '@/lib/i18n';
export function QuizShell({locale}:{locale:Locale}){return <RouteExperience locale={locale} entry="quiz"/>;}
