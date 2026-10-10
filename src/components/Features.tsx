'use client';
import { Compass, Map, Languages, Wallet, PencilLine, Sparkles } from 'lucide-react';
import { dictionaries, type Locale } from '@/lib/i18n';
const icons = { orientation: Compass, universities: Map, exams: Languages, grants: Wallet, essays: PencilLine, venti: Sparkles };
export function Features({ locale, only }: { locale: Locale; only?: string[] }) {
  const d = dictionaries[locale];
  const entries = Object.entries(d.features).filter(([key]) => !only || only.includes(key));
  return <div className="features-grid">{entries.map(([key, f]) => { const Icon = icons[key as keyof typeof icons]; return <article className={`feature-card feature-${key}`} key={key}><span className="feature-icon" aria-hidden="true"><Icon size={23} /></span><div><h3>{f.title}</h3><p>{f.text}</p></div></article>; })}</div>;
}
