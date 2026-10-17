'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from './useMotionPreference';
import { Compass, Globe2, Menu, Moon, Sun, X } from 'lucide-react';
import { dictionaries, locales, localeNames, localeLabels, localizePath, type Locale } from '@/lib/i18n';
import { RegistrationButton } from './Actions';
import { useApp } from './Providers';
import { experienceCopy } from '@/lib/experience-copy';

export function LanguageSelector({ locale }: { locale: Locale }) {
  const router = useRouter(), pathname = usePathname(), d = dictionaries[locale];
  return <label className="language-select"><Globe2 size={17} aria-hidden="true" /><span className="sr-only">{d.common.chooseLanguage}</span><select value={locale} aria-label={d.common.chooseLanguage} onChange={e => router.push(localizePath(pathname, e.target.value as Locale), { scroll: false })}>{locales.map(l => <option value={l} key={l}>{localeLabels[l]} · {localeNames[l]}</option>)}</select></label>;
}
export function Header({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], { theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false), panel = useRef<HTMLDivElement>(null), toggle = useRef<HTMLButtonElement>(null), reduce = useReducedMotion();
  const pathname = usePathname();
  const home = /^\/(?:ru|en|kk|uz|zh|tr)\/?$/.test(pathname);
  useEffect(() => { document.documentElement.lang = locale; setOpen(false); }, [locale, pathname]);
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button, a, select')?.focus();
    function keyboard(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (e.key === 'Tab') {
        const items = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function outside(e: PointerEvent) { if (!panel.current?.contains(e.target as Node) && !toggle.current?.contains(e.target as Node)) { setOpen(false); toggle.current?.focus(); } }
    document.addEventListener('keydown', keyboard); document.addEventListener('pointerdown', outside);
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', keyboard); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  const links = [[`/${locale}/#quiz`, experienceCopy[locale].navPlan], [`/${locale}/sat/`, experienceCopy[locale].navGame], [`/${locale}/#universities`, d.nav.features]];
  return <header className={`site-header${home ? ' site-header--home' : ''}`}><div className="container header-inner">
    <Link className="wordmark" href={`/${locale}/`} aria-label={`VentorMe · ${d.common.home}`}><span className="brand-symbol"><Compass size={22} strokeWidth={1.8} aria-hidden="true" /></span>VentorMe<span className="brand-period" aria-hidden="true">.</span></Link>
    <nav className="desktop-nav" aria-label={d.common.menu}>{links.map(([id, name]) => <Link key={id} href={id}>{name}</Link>)}</nav>
    <div className="header-actions"><LanguageSelector locale={locale} /><button type="button" className="icon-button" onClick={toggleTheme} aria-label={theme === 'light' ? d.common.darkTheme : d.common.lightTheme}>{theme === 'light' ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}</button><span className="desktop-registration"><RegistrationButton locale={locale} /></span><button ref={toggle} type="button" className="icon-button menu-toggle" aria-label={open ? d.common.closeMenu : d.common.menu} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)}>{open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button></div>
    <AnimatePresence>{open && <motion.div key="menu-backdrop" className="menu-backdrop" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.15 }} />}</AnimatePresence>
    <AnimatePresence>{open && <motion.div ref={panel} key="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label={d.common.menu} className="mobile-menu" initial={{ opacity: 0, y: reduce ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}><button type="button" className="text-button" onClick={() => { setOpen(false); toggle.current?.focus(); }}><X size={18} aria-hidden="true" />{d.common.closeMenu}</button>{links.map(([id, name]) => <Link href={id} key={id} onClick={() => { setOpen(false); toggle.current?.focus(); }}>{name}</Link>)}<RegistrationButton locale={locale} /></motion.div>}</AnimatePresence>
  </div></header>;
}
