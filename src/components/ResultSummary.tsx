'use client';
import { motion, useReducedMotion } from 'motion/react';
import { Compass, Check, ArrowLeft, RotateCcw, PencilLine } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildPreview } from '@/lib/quiz';
import { dictionaries, format, type Locale } from '@/lib/i18n';
import { motionTokens } from '@/lib/motion';
import { localizedSteps } from '@/lib/result';
import { useApp } from './Providers';
import { QuizButton, RegistrationButton, ShareButton } from './Actions';
import { Features } from './Features';

export function NextSteps({ steps, title }: { steps: string[]; title: string }) {
  const reduce = useReducedMotion();
  return <section className="next-steps" aria-labelledby="next-steps-heading"><h2 id="next-steps-heading">{title}</h2><ol>{steps.map((text, i) => <motion.li key={text} initial={reduce ? false : { opacity: 0.65, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : motionTokens.normal, delay: reduce ? 0 : i * motionTokens.stagger }}><span className="result-step-marker" aria-hidden="true">{i + 1}</span><p>{text}</p><Check size={19} aria-hidden="true" /></motion.li>)}</ol></section>;
}
export function ResultSummary({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], { state, ready, reset } = useApp(), router = useRouter(), preview = buildPreview(state.answers);
  if (!ready) return <main id="main-content" className="result-page container"><p className="loading-text" role="status">{d.common.loading}</p></main>;
  if (!preview) return <main id="main-content" className="empty-result container"><Compass size={48} aria-hidden="true" /><h1>{d.common.resultEmpty}</h1><p>{d.common.resultEmptyBody}</p><QuizButton locale={locale} /></main>;
  const focus = d.result.focus[preview.focus], steps = localizedSteps(preview, d);
  const context = [format(d.common.gradeLabel, { grade: preview.year }), d.choices.program[preview.program]];
  const regions = preview.regions.map(r => d.choices.regions[r]);
  if (!preview.regions.includes('unknown')) context.push(regions.join(', '));
  if (preview.ib && state.answers.ibStatus) context.push(d.choices.ibStatus[state.answers.ibStatus]);
  return <main id="main-content" className="result-page container"><Link className="text-button" href={`/${locale}/`}><ArrowLeft size={17} aria-hidden="true" />{d.common.home}</Link><div className="result-heading"><span className="eyebrow">{d.result.subtitle}</span><h1>{d.result.title}</h1><div className="context-tags">{context.slice(0, 4).map(text => <span key={text}>{text}</span>)}</div></div><div className="result-layout"><div className="result-main"><section className="result-focus"><span className="icon-tile"><Compass size={24} aria-hidden="true" /></span><h2>{focus.title}</h2><p>{focus.why}</p><p className="year-note">{d.result.years[preview.year]}</p></section><NextSteps steps={steps} title={d.result.stepsTitle} />{preview.secondary && <div className="secondary-priority"><span className="eyebrow">{d.result.more}</span><p>{d.result.focus[preview.secondary].extra}</p></div>}<details className="result-explanation"><summary>{d.common.explain}</summary><p>{preview.regions.includes('unknown') ? d.result.unknownRegion : format(d.result.regionContext, { regions: regions.join(', ') })}</p><p>{preview.interests.includes('unknown') ? d.result.unknownInterests : format(d.result.interestContext, { interests: preview.interests.map(i => d.choices.interests[i]).join(', ') })}</p>{['other', 'unknown'].includes(preview.program) && <p>{d.result.universalProgram}</p>}<p>{d.result.disclaimer}</p></details><div className="result-controls"><Link className="text-button" href={`/${locale}/quiz/`}><PencilLine size={17} aria-hidden="true" />{d.common.edit}</Link><button className="text-button" type="button" onClick={() => { reset(); router.push(`/${locale}/quiz/`); }}><RotateCcw size={17} aria-hidden="true" />{d.common.restart}</button><ShareButton locale={locale} /></div></div><aside className="result-handoff"><span className="eyebrow">Ventorme</span><h2>{d.result.featuresTitle}</h2><Features locale={locale} only={preview.features} /><RegistrationButton locale={locale} primary /><p>{d.result.handoff}</p><p className="small-note">{d.landing.featuresNote}</p></aside></div><div className="mobile-result-bar"><RegistrationButton locale={locale} primary /></div></main>;
}
