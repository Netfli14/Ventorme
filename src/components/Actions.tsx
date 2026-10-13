'use client';
import { useId, useState } from 'react';
import { Share2, ArrowUpRight, ArrowRight, Check, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { REGISTER_URL, SITE_URL } from '@/lib/config';
import { dictionaries, type Locale } from '@/lib/i18n';
import { sendRegistrationClick } from '@/lib/registration-tracking';
export function RegistrationButton({ locale, primary = false }: { locale: Locale; primary?: boolean }) {
  const d = dictionaries[locale], descriptionId = useId();
  if (!REGISTER_URL) return <span className="registration-unavailable"><button type="button" className={`button ${primary ? 'button-primary' : 'button-outline'}`} disabled aria-describedby={descriptionId}><LockKeyhole size={17} aria-hidden="true" />{d.common.register}</button><span className="sr-only" id={descriptionId}>{d.common.registerUnavailable}</span></span>;
  return <a className={`button ${primary ? 'button-primary' : 'button-outline'}`} href={REGISTER_URL} onClick={sendRegistrationClick} onAuxClick={event => { if (event.button === 1) sendRegistrationClick(); }}>{d.common.register}<ArrowUpRight size={18} aria-hidden="true" /></a>;
}
export function QuizButton({ locale, stage, className = '' }: { locale: Locale; stage?: string; className?: string }) {
  return <Link className={`button button-primary ${className}`} href={`/${locale}/quiz/${stage ? `?stage=${stage}` : ''}`}>{dictionaries[locale].common.quiz}<ArrowRight size={18} aria-hidden="true" /></Link>;
}
export function ShareButton({ locale }: { locale: Locale }) {
  const d = dictionaries[locale]; const [message, setMessage] = useState(''), [copied, setCopied] = useState(false);
  const share = async () => {
    const url = new URL(`/${locale}/`, SITE_URL).toString();
    try {
      if (navigator.share) await navigator.share({ title: d.meta.title, text: d.meta.description, url });
      else {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url); setCopied(true); setMessage(d.common.copied);
      }
    } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setMessage(d.common.shareError); }
  };
  return <div className="share-wrap"><button type="button" className="text-button" onClick={share}>{copied ? <Check size={17} aria-hidden="true" /> : <Share2 size={17} aria-hidden="true" />}{d.common.share}</button><span role="status" className="share-message">{message}</span></div>;
}
