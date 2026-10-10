'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Compass } from 'lucide-react';
import { dictionaries, format, type Locale } from '@/lib/i18n';
import { isStepValid, limits, options, questionIds, toggleChoice, type Answers, type QuestionId, type Stage } from '@/lib/quiz';
import { motionTokens } from '@/lib/motion';
import { useApp } from './Providers';

export function QuizProgress({ step, locale }: { step: number; locale: Locale }) {
  const d = dictionaries[locale];
  return <div className="quiz-progress"><div className="progress-caption"><span>{format(d.common.questionProgress, { current: step + 1, total: 6 })}</span><span aria-hidden="true">{String(step + 1).padStart(2, '0')} / 06</span></div><div className="progress-segments" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-label={format(d.common.questionProgress, { current: step + 1, total: 6 })}>{questionIds.map((id, i) => <span key={id} className={i <= step ? 'filled' : ''} />)}</div></div>;
}
export function QuestionCard({ id, locale, answers, onChange, error, onLimit, headingRef }: { id: QuestionId; locale: Locale; answers: Answers; onChange: (a: Answers) => void; error: string; onLimit: (max: number) => void; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const d = dictionaries[locale], multiple = id in limits, max = multiple ? limits[id as keyof typeof limits] : 1;
  const choiceText = d.choices[id] as Record<string, string>, selected = answers[id];
  const choose = (value: string) => {
    if (!multiple) { const next = { ...answers, [id]: value }; if (id === 'program' && value !== 'ib') delete next.ibStatus; onChange(next); }
    else {
      const result = toggleChoice((selected as string[]) ?? [], value, max, id !== 'challenges' ? 'unknown' : undefined);
      if (result.limited) { onLimit(max); return; }
      onChange({ ...answers, [id]: result.values });
    }
  };
  return <div className="question-card"><h1 ref={headingRef} tabIndex={-1} id="question-heading">{d.questions[id].title}</h1><p className="question-help" id="question-help">{d.questions[id].help}</p><div className="choice-caption"><span>{multiple ? format(d.common.multiChoice, { max }) : d.common.singleChoice}</span>{multiple && <span aria-live="polite">{format(d.common.selectedCount, { count: Array.isArray(selected) ? selected.length : 0, max })}</span>}</div>
    <div className={`choices choices-${id}`} role={multiple ? 'group' : 'radiogroup'} aria-labelledby="question-heading" aria-describedby="question-help">{options[id].map(value => {
      const checked = Array.isArray(selected) ? selected.includes(value as never) : selected === value;
      return <label key={value} className={`choice ${checked ? 'selected' : ''}`}><input type={multiple ? 'checkbox' : 'radio'} name={id} value={value} checked={checked} onChange={() => choose(value)} /><span className="choice-indicator" aria-hidden="true">{checked && (id === 'challenges' ? (answers.challenges.indexOf(value as never) + 1) : <Check size={14} strokeWidth={2.8} />)}</span><span>{choiceText[value]}</span></label>;
    })}</div>
    <p className="choice-error" role="status">{error}</p>
    {id === 'program' && answers.program === 'ib' && <fieldset className="ib-followup"><legend>{d.common.ibPrompt} <span>{d.common.optional}</span></legend><div>{options.ibStatus.map(v => <label className={`ib-option ${answers.ibStatus === v ? 'selected' : ''}`} key={v}><input type="radio" name="ibStatus" value={v} checked={answers.ibStatus === v} onChange={() => onChange({ ...answers, ibStatus: v })} />{d.choices.ibStatus[v]}</label>)}</div></fieldset>}
  </div>;
}
export function QuizShell({ locale }: { locale: Locale }) {
  const d = dictionaries[locale], { state, ready, update, reset } = useApp(), router = useRouter(), reduce = useReducedMotion();
  const [error, setError] = useState(''), [resetMessage, setResetMessage] = useState(false), heading = useRef<HTMLHeadingElement>(null), seeded = useRef(false);
  useEffect(() => {
    if (!ready || seeded.current) return; seeded.current = true;
    const seed = new URLSearchParams(window.location.search).get('stage');
    if (seed && (options.stage as readonly string[]).includes(seed)) { update({ ...state.answers, stage: seed as Stage }); router.replace(`/${locale}/quiz/`, { scroll: false }); }
  }, [ready, locale, router, state.answers, update]);
  useEffect(() => { setError(''); }, [locale, state.step]);
  const move = (back = false) => {
    if (back) { update(state.answers, Math.max(0, state.step - 1)); return; }
    if (!isStepValid(state.answers, state.step)) return;
    if (state.step === 5) router.push(`/${locale}/result/`);
    else update(state.answers, state.step + 1);
  };
  const clear = () => { reset(); setError(''); setResetMessage(true); };
  const focusHeading = () => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }); };
  return <main id="main-content" className="quiz-page container"><div className="quiz-top"><Link className="text-button" href={`/${locale}/`}><ArrowLeft size={17} aria-hidden="true" />{d.common.exit}</Link><button type="button" className="text-button" onClick={clear}><RotateCcw size={16} aria-hidden="true" />{d.common.restart}</button></div><div className="quiz-layout"><aside className="quiz-aside"><span className="icon-tile"><Compass size={26} aria-hidden="true" /></span><h2>{d.landing.finalAccent}</h2><p>{d.landing.note}</p><ol>{questionIds.map((id, i) => <li className={i === state.step ? 'current' : i < state.step ? 'complete' : ''} key={id}><span aria-hidden="true">{i < state.step ? <Check size={15} /> : i + 1}</span>{d.questions[id].title}</li>)}</ol></aside><section className="quiz-panel" aria-label={d.common.quiz}>
    <QuizProgress step={state.step} locale={locale} />
    {!ready ? <p className="loading-text" role="status">{d.common.loading}</p> : <AnimatePresence mode="wait" initial={false}><motion.div key={state.step} initial={{ opacity: 0, x: reduce ? 0 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : motionTokens.normal }} onAnimationComplete={focusHeading}><QuestionCard id={questionIds[state.step]} locale={locale} answers={state.answers} headingRef={heading} error={error} onChange={a => { setError(''); setResetMessage(false); update(a); }} onLimit={max => setError(format(d.common.maxChoices, { max }))} /></motion.div></AnimatePresence>}
    <div className="quiz-navigation"><button type="button" className="button button-outline" disabled={state.step === 0 || !ready} onClick={() => move(true)}><ArrowLeft size={17} aria-hidden="true" />{d.common.back}</button><button type="button" className="button button-primary" disabled={!ready || !isStepValid(state.answers, state.step)} onClick={() => move()}>{state.step === 5 ? d.common.result : d.common.next}<ArrowRight size={17} aria-hidden="true" /></button></div>
    <p className="session-note" role="status">{resetMessage ? d.common.resetNotice : d.common.resume}</p>
  </section></div></main>;
}
