'use client';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, Check, Compass, GraduationCap, BookOpen, ArrowRight, ChevronDown, ListChecks, PencilLine, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { dictionaries, type Locale } from '@/lib/i18n';
import { motionTokens } from '@/lib/motion';
import { QuizButton, RegistrationButton, ShareButton } from './Actions';
import { CompassScene } from './CompassScene';
import { Features } from './Features';
import { useApp } from './Providers';
gsap.registerPlugin(useGSAP);
const DataRain = dynamic(() => import('./ui/data-rain'), { ssr: false });

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={{ opacity: 1, y: 0 }} onViewportEnter={e => {
    if (reduce || !e?.target || !(e.target as HTMLElement).animate) return;
    const element = e.target as HTMLElement;
    element.animate([{ opacity: 0.65, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: motionTokens.reveal * 1000, easing: 'cubic-bezier(0.2,0,0,1)' });
  }} viewport={{ once: true, amount: 0.12 }}>{children}</motion.div>;
}
export function ExamplePreview({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], [selected, setSelected] = useState(2), reduce = useReducedMotion();
  const focus = [d.result.focus.direction, d.result.focus.universities, d.result.focus.subjects][selected];
  const steps = selected === 2 ? d.result.ibSteps : focus.steps;
  return <div className="example-area" id="example"><div className="example-tabs" role="tablist" aria-label={d.landing.exampleLabel}>{d.landing.tabs.map((label, i) => <button id={`example-tab-${i}`} key={i} type="button" role="tab" aria-selected={selected === i} aria-controls="example-panel" tabIndex={selected === i ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (selected + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
    setSelected(next); document.getElementById(`example-tab-${next}`)?.focus();
  }}>{label}</button>)}</div><div className="preview-card"><div className="preview-top"><span className="eyebrow">{d.landing.exampleLabel}</span><span className="preview-symbol" aria-hidden="true"><Compass size={21} /></span></div><div role="tabpanel" id="example-panel" aria-labelledby={`example-tab-${selected}`} tabIndex={0}>
    <AnimatePresence mode="wait" initial={false}><motion.div key={selected} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}><p className="scenario">{d.landing.scenarios[selected]}</p><h2>{focus.title}</h2><ol className="preview-steps">{steps.map((text, i) => <li key={text}><span className="step-marker" aria-hidden="true">{i + 1}</span><span>{text}</span></li>)}</ol></motion.div></AnimatePresence>
  </div><div className="preview-bottom"><Check size={16} aria-hidden="true" /><span>{d.landing.note}</span></div></div><div className="compass-note"><CompassScene /><div><p>{d.landing.compassLabel}</p><span>{d.landing.compassHint}</span></div></div></div>;
}
export function Hero({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], hero = useRef<HTMLElement>(null);
  const { backgroundPaused, toggleBackground, ready } = useApp();
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { duration: motionTokens.reveal, ease: 'power2.out' } });
      tl.from('.hero-copy > *', { opacity: 0, y: 14, stagger: motionTokens.stagger, clearProps: 'all' }).from('.example-area', { opacity: 0, y: 12, clearProps: 'all' }, 0.2);
    }); return () => mm.revert();
  }, { scope: hero });
  return <div className="hero-stage">
    {ready && <DataRain className="hero-rain" fullscreen={false} flowSpeed={0.65} paused={backgroundPaused} />}
    <section className="hero container" ref={hero} aria-labelledby="hero-heading"><div className="hero-copy"><span className="hero-label"><GraduationCap size={17} aria-hidden="true" />{d.landing.eyebrow}</span><h1 id="hero-heading">{d.landing.titleStart}<br /><span>{d.landing.titleEnd}</span></h1><p className="hero-lead">{d.landing.lead}</p><div className="hero-actions" id="hero-actions"><QuizButton locale={locale} /><RegistrationButton locale={locale} /></div><p className="hero-note"><Check size={15} aria-hidden="true" />{d.landing.note}</p><a className="text-button example-link" href="#example">{d.common.example}<ArrowUpRight size={16} aria-hidden="true" /></a></div><ExamplePreview locale={locale} /></section>
    <button className="icon-button hero-animation-toggle" type="button" aria-pressed={backgroundPaused} aria-label={backgroundPaused ? d.common.resumeAnimation : d.common.pauseAnimation} title={backgroundPaused ? d.common.resumeAnimation : d.common.pauseAnimation} onClick={toggleBackground}>
      {backgroundPaused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
    </button>
  </div>;
}
export function Benefits({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], icons = [Compass, GraduationCap, BookOpen], stages = ['direction', 'universities', 'requirements'];
  return <section className="section container" aria-labelledby="situations-heading"><Reveal><div className="section-heading"><h2 id="situations-heading">{d.landing.situationTitle}</h2><p>{d.landing.situationIntro}</p></div><div className="situation-grid">{d.landing.situations.map((s, i) => { const Icon = icons[i]; return <Link className="situation-card" key={s.title} href={`/${locale}/quiz/?stage=${stages[i]}`}><span className="icon-tile"><Icon size={22} aria-hidden="true" /></span><h3>{s.title}</h3><p>{s.text}</p><span className="card-arrow" aria-hidden="true"><ArrowUpRight size={21} /></span></Link>; })}</div></Reveal></section>;
}
export function HowItWorks({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], icons = [PencilLine, ListChecks, ArrowUpRight];
  return <section className="how-section section" id="how" aria-labelledby="how-heading"><div className="container how-layout"><Reveal className="how-intro"><span className="eyebrow">{d.nav.how}</span><h2 id="how-heading">{d.landing.howTitle}</h2><p>{d.landing.howBoundary}</p><span className="how-compass" aria-hidden="true"><Compass size={100} strokeWidth={0.8} /></span></Reveal><Reveal className="how-steps"><ol>{d.landing.howSteps.map((s, i) => { const Icon = icons[i]; return <li key={s.title}><span className="how-number" aria-hidden="true">{i + 1}</span><div><h3>{s.title}</h3><p>{s.text}</p></div><Icon size={21} aria-hidden="true" /></li>; })}</ol></Reveal></div></section>;
}
export function FAQ({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], [open, setOpen] = useState<number | null>(0), reduce = useReducedMotion();
  return <section className="section container faq-layout" id="faq" aria-labelledby="faq-heading"><Reveal><span className="eyebrow">{d.nav.faq}</span><h2 id="faq-heading">{d.landing.faqTitle}</h2><ShareButton locale={locale} /></Reveal><div className="faq-list">{d.faq.map((item, i) => <div className="faq-item" key={item.q}><h3><button type="button" aria-expanded={open === i} aria-controls={`faq-answer-${i}`} id={`faq-question-${i}`} onClick={() => setOpen(open === i ? null : i)}>{item.q}<ChevronDown className={open === i ? 'rotated' : ''} size={20} aria-hidden="true" /></button></h3><AnimatePresence initial={false}>{open === i && <motion.div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`} key={`answer-${i}`} initial={{ opacity: 0, y: reduce ? 0 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.15 }}><p>{item.a}</p></motion.div>}</AnimatePresence></div>)}</div></section>;
}
export function FinalCTA({ locale }: { locale: Locale }) {
  const d = dictionaries[locale];
  return <section className="container final-section"><Reveal className="final-cta"><span className="final-compass" aria-hidden="true"><Compass size={180} strokeWidth={0.6} /></span><h2>{d.landing.finalTitle}<br /><span>{d.landing.finalAccent}</span></h2><p>{d.landing.finalText}</p><div className="cta-actions"><QuizButton locale={locale} /><RegistrationButton locale={locale} /></div></Reveal></section>;
}
export function MobileActionBar({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false), reduce = useReducedMotion();
  useEffect(() => {
    const el = document.getElementById('hero-actions');
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom < 0), { threshold: 0 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  return <AnimatePresence>{visible && <motion.div key="quiz-action-bar" className="mobile-action-bar" initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : motionTokens.micro }}><QuizButton locale={locale} /></motion.div>}</AnimatePresence>;
}
export function Landing({ locale }: { locale: Locale }) {
  const d = dictionaries[locale];
  return <><main id="main-content"><Hero locale={locale} /><Benefits locale={locale} /><HowItWorks locale={locale} /><section className="section container" id="features" aria-labelledby="features-heading"><Reveal><div className="section-heading"><h2 id="features-heading">{d.landing.featuresTitle}</h2><p>{d.landing.featuresIntro}</p></div><Features locale={locale} /><p className="section-note">{d.landing.featuresNote}</p></Reveal></section><FAQ locale={locale} /><FinalCTA locale={locale} /></main><MobileActionBar locale={locale} /></>;
}
