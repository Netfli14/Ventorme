"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight, Check, Plus, CheckCircle2 } from "lucide-react";
import { dictionaries, format, type Locale } from "@/lib/i18n";
import { routeCopy } from "@/lib/route-copy";
import { questionIds, routeStepValid, type RouteState } from "@/lib/route-model";
import { options, limits, toggleChoice } from "@/lib/quiz";
import { useRoute } from "./RouteProvider";
import { useReducedMotion } from "./useMotionPreference";
import { MessageText } from "./MessageText";
import { scrollToSection as go } from "@/lib/scroll";
import styles from "./RouteExperience.module.css";
function SectionLabel({n,children}:{n:string;children:React.ReactNode}) {return <p className={styles.sectionLabel}><span>{n}</span>{children}</p>;}
export function AdmissionQuiz({ locale }: { locale: Locale }) {
  const c = routeCopy[locale], d = dictionaries[locale],
    { route: s, patch, track } = useRoute(),
    scope = useRef<HTMLDivElement>(null), heading = useRef<HTMLHeadingElement>(null),
    reduce = useReducedMotion(), moved = useRef(false), direction = useRef(1);
  const [limited, setLimited] = useState(false);
  const id = questionIds[s.step], total = questionIds.length;
  const valid = routeStepValid(s, s.step);
  const multi = id === "regions" || id === "interests" || id === "challenges";
  const selection = s[id];
  const selected = (value: string) => Array.isArray(selection) ? (selection as readonly string[]).includes(value) : selection === value;
  useLayoutEffect(() => {
    if (moved.current && heading.current) {
      heading.current.focus({ preventScroll: true });
      const rect = heading.current.getBoundingClientRect();
      if (rect.top < 100 || rect.bottom > innerHeight - 100)
        heading.current.scrollIntoView({block: "center", behavior: reduce ? "instant" : "smooth"});
    }
    if (reduce || !scope.current) return;
    const ctx = gsap.context(() => {
      const answers = scope.current!.querySelectorAll("[data-answer]");
      const timeline = gsap.timeline({defaults: {ease: "power3.out", clearProps: "all"}})
        .from("[data-question-message], [data-question] > svg", {x: 22 * direction.current, scale: 0.97, opacity: 0.25, duration: 0.35});
      if (answers.length) timeline.from(answers, {y: 18, scale: 0.97, opacity: 0.3, duration: 0.35, stagger: 0.025}, 0.08);
      gsap.fromTo("[data-quiz-arrow]", {x: -12, scaleX: 0.6}, {x: 0, scaleX: 1, duration: 0.4, ease: "power3.out", clearProps: "all"});
    }, scope);
    return () => ctx.revert();
  }, [s.step, s.completed, reduce]);
  const select = (value: string) => {
    track("quiz_start"); setLimited(false);
    if (id === "grade") patch({grade: value as RouteState["grade"], completed: false});
    else if (id === "program") patch({program: value as RouteState["program"], ibStatus: value === "ib" ? s.ibStatus : "", ib: value === "ib", completed: false});
    else if (id === "stage") patch({stage: value as RouteState["stage"], completed: false});
    else {
      const next = toggleChoice<string>(s[id], value, limits[id], id === "challenges" ? undefined : "unknown");
      setLimited(next.limited);
      if (!next.limited) patch({[id]: next.values, completed: false,
        ...(id === "interests" ? {field: next.values.find(v => v !== "unknown") as RouteState["field"] || s.field} : {})});
    }
  };
  const jump = (step: number) => {
    moved.current = true; direction.current = step < s.step ? -1 : 1;
    setLimited(false); patch({step, completed: false});
  };
  const move = (back = false) => {
    if (back) return jump(Math.max(0, s.step - 1));
    if (!valid) return;
    if (s.step < total - 1) jump(s.step + 1);
    else {
      patch({completed: true}); track("quiz_complete");
      requestAnimationFrame(() => go("my-route"));
    }
  };
  return (
    <section id="quiz" className={styles.quizSection} ref={scope}>
      <div className="container">
        <div className={styles.quizLayout}>
          <div className={styles.quizIntro}>
            <SectionLabel n="01">{c.eyebrow}</SectionLabel>
            <h2>{c.quizTitle}</h2><p>{c.quizLead}</p>
            <nav className={styles.quizTopics} aria-label={c.quizTitle}>
              {questionIds.map((key, index) => <button key={key} type="button"
                aria-label={d.questions[key].title} aria-current={!s.completed && index === s.step ? "step" : undefined}
                disabled={!s.completed && index > s.step} onClick={() => jump(index)}>
                <span>{(s.completed || index < s.step) && routeStepValid(s, index) ? <Check size={14} /> : `0${index + 1}`}</span>
                {c.quizTopics[index]}
              </button>)}
            </nav>
            <div className={styles.quizDecor} aria-hidden="true" data-motion-section="quiz">
              <span data-quiz-symbol>?</span><div data-quiz-arrow>→</div>
              <span data-quiz-symbol>{s.completed ? <Check size={52} /> : "!"}</span>
            </div>
            <p className={styles.smallNote}>{c.free}</p>
          </div>
          <div className={styles.quizCard} data-quiz-step={id}>
            <div className={styles.progressCaption}>
              <span>{s.completed ? c.done : `${c.step} ${s.step + 1} / ${total}`}</span>
              <span>{s.completed ? "06" : `0${s.step + 1}`}<span className={styles.muted}> / 06</span></span>
            </div>
            <div className={styles.progress} role="progressbar" aria-label={c.step}
              aria-valuemin={0} aria-valuemax={total} aria-valuenow={s.completed ? total : s.step + 1}>
              <span style={{transform: `scaleX(${s.completed ? 1 : (s.step + 1) / total})`}} />
            </div>
            {s.completed ? <div data-question className={styles.quizComplete}>
              <CheckCircle2 size={42} /><h3>{c.quizDone}</h3><p>{c.quizDone}</p>
              <div className={styles.buttonRow}>
                <button className="button button-primary" onClick={() => go("my-route")}>{c.show}<ArrowRight size={17} /></button>
                <button className="text-button" onClick={() => jump(0)}>{c.edit}</button>
              </div>
            </div> : <div data-question>
              <div className={styles.questionMessage} data-question-message>
                <span className={styles.messageSender} aria-hidden="true"><img src="/media/ventorme-mascot-poster.jpg" alt="" /> VentorMe</span>
                <h3 ref={heading} tabIndex={-1} id="route-question"><MessageText text={c.questions[s.step]} /></h3>
                <p className={styles.questionHelp}>{c.help[s.step]}</p>
              </div>
              {multi && <div className={styles.choiceCaption} aria-live="polite">
                <span>{format(d.common.multiChoice, {max: limits[id]})}</span>
                <span>{format(d.common.selectedCount, {count: (selection as string[]).length, max: limits[id]})}</span>
              </div>}
              <div className={`${styles.options} ${id === "grade" ? styles.grades : ""} ${id === "program" || id === "stage" ? styles.wideOptions : ""}`}
                role="group" aria-labelledby="route-question">
                {options[id].map((value, index) => <label data-answer key={value}
                  className={`${styles.option} ${selected(value) ? styles.chosen : ""}`}>
                  <input type={multi ? "checkbox" : "radio"} name={`route-${id}`} value={value}
                    checked={selected(value)} onChange={() => select(value)} />
                  {id === "grade" ? <><strong>{value}</strong><span>{c.grade}</span></> : <>
                    <span className={styles.optionNumber}>{id === "challenges" && selected(value)
                      ? `0${s.challenges.indexOf(value as typeof s.challenges[number]) + 1}` : `0${index + 1}`}</span>
                    <span>{(d.choices[id] as Record<string, string>)[value]}</span>
                  </>}
                  <span className={styles.optionCheck}>{selected(value) ? <Check size={15} /> : multi ? <Plus size={15} /> : null}</span>
                </label>)}
              </div>
              {limited && multi && <p role="status" className={styles.choiceLimit}>{format(d.common.maxChoices, {max: limits[id]})}</p>}
              {id === "program" && s.program === "ib" && <fieldset className={styles.ibStatus}>
                <legend>{d.common.ibPrompt} <small>{c.optional}</small></legend>
                <div>{options.ibStatus.map(value => <label key={value} className={s.ibStatus === value ? styles.chosen : ""}>
                  <input type="radio" name="route-ibStatus" value={value} checked={s.ibStatus === value}
                    onChange={() => patch({ibStatus: value})} />{d.choices.ibStatus[value]}
                </label>)}</div>
              </fieldset>}
              <div className={styles.quizNav}>
                <button type="button" className="text-button" onClick={() => move(true)} disabled={s.step === 0}><ArrowLeft size={17} />{c.back}</button>
                <button type="button" className="button button-primary" disabled={!valid} onClick={() => move()}>{s.step === total - 1 ? c.show : c.next}<ArrowRight size={17} /></button>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
