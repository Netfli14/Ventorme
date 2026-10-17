"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Download,
  Compass,
  Sparkles,
  GitCompareArrows,
  BookOpen,
  GraduationCap,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  X,
} from "lucide-react";
import { dictionaries, type Locale } from "@/lib/i18n";
import { routeCopy } from "@/lib/route-copy";
import {
  interests,
  challenges,
  subjects,
  makeRoute,
  type Subject,
} from "@/lib/route-model";
import { downloadRoute } from "@/lib/export-route";
import { useRoute } from "./RouteProvider";
import { RegistrationButton, ShareButton } from "./Actions";
import styles from "./RouteExperience.module.css";
gsap.registerPlugin(Flip);

function go(id: string) {
  const section = document.getElementById(id);
  section?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
  const heading = section?.querySelector<HTMLElement>("h2");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
}
function SectionLabel({
  n,
  children,
}: {
  n: string;
  children: React.ReactNode;
}) {
  return (
    <p className={styles.sectionLabel}>
      <span>{n}</span>
      {children}
    </p>
  );
}

function RouteScene({
  locale,
  videoAvailable,
}: {
  locale: Locale;
  videoAvailable: boolean;
}) {
  const c = routeCopy[locale],
    d = dictionaries[locale],
    scope = useRef<HTMLDivElement>(null),
    video = useRef<HTMLVideoElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    reduce = useReducedMotion(),
    { route } = useRoute();
  const [run, setRun] = useState(0),
    [failed, setFailed] = useState(false);
  const hint = route.completed
    ? c.quizDone
    : route[route.active].length === 3
      ? c.change
      : route.grade
        ? c.help[route.step]
        : c.mascotHint;
  useLayoutEffect(() => {
    if (reduce || !scope.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from('[data-node="interest"]', {
        x: -32,
        y: -14,
        rotation: -8,
        opacity: 0,
        duration: 0.55,
      })
        .from(
          '[data-node="subject"]',
          { x: -28, y: 12, rotation: 5, opacity: 0, duration: 0.45 },
          0.25,
        )
        .from(
          "[data-path]",
          { strokeDashoffset: 900, duration: 1.25, ease: "power2.inOut" },
          0.4,
        )
        .from(
          '[data-node="direction"]',
          { scale: 0.9, opacity: 0, duration: 0.4 },
          0.75,
        )
        .from(
          '[data-node="route"]',
          { scale: 0.92, y: 18, opacity: 0, duration: 0.5 },
          1,
        )
        .from(
          "[data-tick]",
          {
            scale: 0,
            rotation: -20,
            transformOrigin: "center",
            duration: 0.25,
            stagger: 0.08,
          },
          1.4,
        )
        .from("[data-halo]", { scale: 0.9, opacity: 0, duration: 0.6 }, 1.05);
    }, scope);
    return () => ctx.revert();
  }, [reduce, run]);
  function openVideo() {
    dialog.current?.showModal();
    void video.current?.play().catch(() => {});
  }
  function closeVideo() {
    video.current?.pause();
    dialog.current?.close();
  }
  useLayoutEffect(() => {
    if (reduce || !scope.current) return;
    const ctx = gsap.context(
      () =>
        gsap.from("[data-mascot-hint]", {
          scale: 0.97,
          y: 4,
          opacity: 0.5,
          duration: 0.24,
          ease: "power3.out",
          clearProps: "all",
        }),
      scope,
    );
    return () => ctx.revert();
  }, [hint, reduce]);
  return (
    <div className={styles.scene} ref={scope}>
      <div className={styles.sceneGrid} aria-hidden="true" />
      <div className={styles.sceneHalo} data-halo aria-hidden="true" />
      <div className={styles.sceneTop}>
        <span>
          <span className={styles.liveDot} /> VENTORME / PATH BUILDER
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={() => setRun((n) => n + 1)}
          aria-label={c.replay}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <svg
        className={styles.paths}
        viewBox="0 0 580 470"
        fill="none"
        aria-hidden="true"
      >
        <path
          data-path
          d="M112 123 C240 123 200 245 295 237 S410 193 448 295"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="900"
        />
        <path
          data-path
          d="M120 300 C240 300 200 245 295 237"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="900"
        />
        <circle cx="295" cy="237" r="6" fill="var(--accent)" />
      </svg>
      <div
        className={`${styles.sceneNode} ${styles.interestNode}`}
        data-node="interest"
      >
        <span className={styles.nodeIcon}>↗</span>
        <small>{c.scene[0]}</small>
        <strong>{d.choices.interests.engineering}</strong>
        <span className={styles.pastelGreen}>
          {d.choices.interests.science}
        </span>
      </div>
      <div
        className={`${styles.sceneNode} ${styles.subjectNode}`}
        data-node="subject"
      >
        <small>{c.scene[1]}</small>
        <strong>
          Math AA <span>HL</span>
        </strong>
        <strong>
          Chemistry <span>HL</span>
        </strong>
      </div>
      <div className={styles.directionNode} data-node="direction">
        <Compass size={30} />
        <span>{c.scene[2]}</span>
      </div>
      <div className={styles.routeNode} data-node="route">
        <div>
          <span className={styles.tinyNumber}>01—03</span>
          <Sparkles size={21} />
        </div>
        <h3>{c.scene[3]}</h3>
        {c.scene.slice(0, 3).map((t) => (
          <p key={t}>
            <span data-tick>
              <Check size={14} />
            </span>
            {t}
          </p>
        ))}
      </div>
      <div className={styles.sceneCaption}>
        {c.sceneNote}
        <ArrowUpRight size={17} />
      </div>
      {videoAvailable && (
        <>
          <div className={styles.mascotMini}>
            <button
              type="button"
              className={styles.mascotVideo}
              onClick={openVideo}
              aria-label={c.play}
            >
              <img src="/media/ventorme-mascot-poster.jpg" alt="" />
              <span className={styles.videoButton}>
                <Play size={15} />
              </span>
            </button>
            <p data-mascot-hint>{hint}</p>
          </div>
          <dialog
            ref={dialog}
            className={styles.videoDialog}
            aria-label={c.mascot}
            onCancel={() => video.current?.pause()}
          >
            <button
              className="icon-button"
              type="button"
              onClick={closeVideo}
              aria-label={d.common.closeMenu}
            >
              <X size={22} />
            </button>
            <h3>{c.mascot}</h3>
            <video
              ref={video}
              src="/media/ventorme-mascot-intro.mp4"
              poster="/media/ventorme-mascot-poster.jpg"
              playsInline
              muted
              preload="metadata"
              controls
              aria-label={c.mascot}
              onError={() => setFailed(true)}
            />
            {failed && <p>{d.common.loading}</p>}
          </dialog>
        </>
      )}
    </div>
  );
}

function Quiz({ locale }: { locale: Locale }) {
  const c = routeCopy[locale],
    d = dictionaries[locale],
    { route: s, patch, track } = useRoute(),
    scope = useRef<HTMLDivElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    reduce = useReducedMotion(),
    moved = useRef(false);
  const valid =
    s.step === 0
      ? Boolean(s.grade)
      : s.step === 1
        ? s.interests.length > 0
        : Boolean(s.challenge);
  useLayoutEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
    if (reduce || !scope.current) return;
    const ctx = gsap.context(
      () =>
        gsap.from("[data-question]", {
          x: 12,
          opacity: 0.4,
          duration: 0.28,
          ease: "power3.out",
          clearProps: "all",
        }),
      scope,
    );
    return () => ctx.revert();
  }, [s.step, s.completed, reduce]);
  const selectInterest = (id: (typeof interests)[number]) => {
    track("quiz_start");
    const next =
      id === "unknown"
        ? (["unknown"] as typeof s.interests)
        : s.interests.includes(id)
          ? s.interests.filter((v) => v !== id)
          : [...s.interests.filter((v) => v !== "unknown"), id];
    patch({
      interests: next,
      field: next.find((v) => v !== "unknown") || s.field,
      completed: false,
    });
  };
  const move = (back = false) => {
    moved.current = true;
    if (back) {
      patch({ step: Math.max(0, s.step - 1), completed: false });
      return;
    }
    if (!valid) return;
    if (s.step < 2) patch({ step: s.step + 1 });
    else {
      patch({ completed: true });
      track("quiz_complete");
      requestAnimationFrame(() => go("my-route"));
    }
  };
  return (
    <section id="quiz" className={styles.quizSection} ref={scope}>
      <div className="container">
        <div className={styles.quizLayout}>
          <div className={styles.quizIntro}>
            <SectionLabel n="01">{c.eyebrow}</SectionLabel>
            <h2>{c.quizTitle}</h2>
            <p>{c.quizLead}</p>
            <div className={styles.quizDecor} aria-hidden="true">
              <span>?</span>
              <div>→</div>
              <span>!</span>
            </div>
            <p className={styles.smallNote}>{c.free}</p>
          </div>
          <div className={styles.quizCard}>
            <div className={styles.progressCaption}>
              <span>
                {s.completed ? c.done : `${c.step} ${s.step + 1} / 3`}
              </span>
              <span>
                {s.completed ? "03" : `0${s.step + 1}`}
                <span className={styles.muted}> / 03</span>
              </span>
            </div>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label={c.step}
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={s.completed ? 3 : s.step + 1}
            >
              <span
                style={{
                  transform: `scaleX(${s.completed ? 1 : (s.step + 1) / 3})`,
                }}
              />
            </div>
            {s.completed ? (
              <div data-question className={styles.quizComplete}>
                <CheckCircle2 size={42} />
                <h3>{c.quizDone}</h3>
                <p>{c.quizDoneText}</p>
                <div className={styles.buttonRow}>
                  <button
                    className="button button-primary"
                    onClick={() => go("ib-builder")}
                  >
                    {c.secondary}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      moved.current = true;
                      patch({ completed: false, step: 0 });
                    }}
                  >
                    {c.edit}
                  </button>
                </div>
              </div>
            ) : (
              <div data-question>
                <h3 ref={heading} tabIndex={-1} id="route-question">
                  {c.questions[s.step]}
                </h3>
                <p className={styles.questionHelp}>{c.help[s.step]}</p>
                <div
                  className={`${styles.options} ${s.step === 0 ? styles.grades : ""}`}
                  role="group"
                  aria-labelledby="route-question"
                >
                  {s.step === 0 &&
                    (["10", "11", "12"] as const).map((g) => (
                      <label
                        key={g}
                        className={`${styles.option} ${s.grade === g ? styles.chosen : ""}`}
                      >
                        <input
                          type="radio"
                          name="route-grade"
                          checked={s.grade === g}
                          onChange={() => {
                            track("quiz_start");
                            patch({ grade: g });
                          }}
                        />
                        <strong>{g}</strong>
                        <span>{c.grade}</span>
                        {s.grade === g && <Check size={17} />}
                      </label>
                    ))}
                  {s.step === 1 &&
                    interests.map((id, i) => (
                      <label
                        key={id}
                        className={`${styles.option} ${s.interests.includes(id) ? styles.chosen : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={s.interests.includes(id)}
                          onChange={() => selectInterest(id)}
                        />
                        <span className={styles.optionNumber}>0{i + 1}</span>
                        <span>{d.choices.interests[id]}</span>
                        <span className={styles.optionCheck}>
                          {s.interests.includes(id) ? (
                            <Check size={15} />
                          ) : (
                            <Plus size={15} />
                          )}
                        </span>
                      </label>
                    ))}
                  {s.step === 2 &&
                    challenges.map((id, i) => (
                      <label
                        key={id}
                        className={`${styles.option} ${s.challenge === id ? styles.chosen : ""}`}
                      >
                        <input
                          type="radio"
                          name="route-challenge"
                          checked={s.challenge === id}
                          onChange={() => {
                            track("quiz_start");
                            patch({ challenge: id });
                          }}
                        />
                        <span className={styles.optionNumber}>0{i + 1}</span>
                        <span>{c.challenges[i]}</span>
                        {s.challenge === id && <Check size={17} />}
                      </label>
                    ))}
                </div>
                <div className={styles.quizNav}>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => move(true)}
                    disabled={s.step === 0}
                  >
                    <ArrowLeft size={17} />
                    {c.back}
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={!valid}
                    onClick={() => move()}
                  >
                    {s.step === 2 ? c.show : c.next}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function IBBuilder({ locale }: { locale: Locale }) {
  const c = routeCopy[locale],
    d = dictionaries[locale],
    { route: s, patch } = useRoute(),
    [compare, setCompare] = useState(false),
    scope = useRef<HTMLDivElement>(null),
    flip = useRef<ReturnType<typeof Flip.getState> | null>(null),
    reduce = useReducedMotion();
  const active = s[s.active],
    label = (id: Subject) => c.subjects[subjects.indexOf(id)];
  useLayoutEffect(() => {
    if (flip.current && !reduce && scope.current) {
      const state = flip.current;
      flip.current = null;
      const targets = scope.current.querySelectorAll("[data-flip-id]");
      const animation = Flip.from(state, {
        targets,
        duration: 0.32,
        ease: "power3.out",
        absolute: false,
        scale: false,
        prune: true,
        onComplete: () => {
          gsap.set(targets, { clearProps: "all" });
        },
      });
      return () => {
        animation.progress(1);
        animation.kill();
        gsap.set(targets, { clearProps: "all" });
      };
    }
  }, [s.a, s.b, s.active, reduce]);
  function change(id: Subject) {
    if (!scope.current) return;
    const targets = scope.current.querySelectorAll("[data-flip-id]");
    gsap.killTweensOf(targets);
    gsap.set(targets, { clearProps: "all" });
    if (!reduce) flip.current = Flip.getState(targets);
    const next = active.includes(id)
      ? active.filter((v) => v !== id)
      : active.length < 3
        ? [...active, id]
        : active;
    patch({ [s.active]: next });
  }
  const added = s.b.filter((x) => !s.a.includes(x)),
    removed = s.a.filter((x) => !s.b.includes(x));
  const fieldCheck = ["engineering", "it", "business"].includes(s.field)
    ? c.checks[0]
    : ["science", "health"].includes(s.field)
      ? c.checks[1]
      : ["humanities", "art"].includes(s.field)
        ? c.checks[2]
        : c.checks[3];
  return (
    <section
      id="ib-builder"
      className={`${styles.section} container`}
      ref={scope}
    >
      <SectionLabel n="02">IB / A ↔ B</SectionLabel>
      <div className={styles.sectionHeading}>
        <h2>{c.ibTitle}</h2>
        <p>{c.ibLead}</p>
      </div>
      <div className={styles.modeSwitch}>
        <button
          type="button"
          aria-pressed={s.ib}
          onClick={() => patch({ ib: true })}
        >
          {c.ibMode}
        </button>
        <button
          type="button"
          aria-pressed={!s.ib}
          onClick={() => patch({ ib: false })}
        >
          {c.generalMode}
        </button>
      </div>
      {!s.ib ? (
        <div className={styles.generalCard}>
          <GraduationCap size={38} />
          <div>
            <h3>{c.generalMode}</h3>
            <p>{c.generalNote}</p>
          </div>
          <button
            className="button button-primary"
            onClick={() => go(s.completed ? "my-route" : "quiz")}
          >
            {c.primary}
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className={styles.builderLayout}>
          <div className={styles.builderCard}>
            <div className={styles.builderTop}>
              <label htmlFor="route-field">{c.field}</label>
              <select
                id="route-field"
                value={s.field}
                onChange={(e) =>
                  patch({ field: e.target.value as typeof s.field })
                }
              >
                {interests.map((i) => (
                  <option key={i} value={i}>
                    {d.choices.interests[i]}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.builderBar}>
              <h3>{c.selected}</h3>
              <span>{active.length} / 3 HL</span>
            </div>
            <div className={styles.setTabs} role="group" aria-label={c.set}>
              {(["a", "b"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  aria-pressed={s.active === k}
                  onClick={() => patch({ active: k })}
                >
                  {c.set} {k.toUpperCase()}
                  <span>{s[k].length}/3</span>
                </button>
              ))}
            </div>
            <div
              className={styles.selectedSubjects}
              aria-label={`${c.set} ${s.active.toUpperCase()}`}
            >
              {active.map((id) => (
                <button
                  type="button"
                  className={styles.subjectSelected}
                  data-flip-id={id}
                  key={id}
                  onClick={() => change(id)}
                  aria-label={`${c.removed}: ${label(id)}`}
                >
                  {label(id)}
                  <span>HL</span>
                  <Minus size={15} />
                </button>
              ))}
              {Array.from({ length: 3 - active.length }, (_, i) => (
                <div key={`empty-${i}`} className={styles.emptySlot}>
                  <Plus size={18} />
                  <span>HL 0{active.length + i + 1}</span>
                </div>
              ))}
            </div>
            <p className={styles.smallNote}>{c.empty}</p>
            <div className={styles.subjectPool} aria-label={c.choose}>
              {subjects
                .filter((id) => !active.includes(id))
                .map((id) => (
                  <button
                    type="button"
                    data-flip-id={id}
                    key={id}
                    disabled={active.length === 3}
                    onClick={() => change(id)}
                  >
                    {label(id)}
                    <Plus size={14} />
                  </button>
                ))}
            </div>
            <div className={styles.builderActions}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setCompare((v) => !v)}
                aria-expanded={compare}
                aria-controls="subject-comparison"
              >
                <GitCompareArrows size={17} />
                {c.compare}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  patch({ b: [...s.a], active: "b" });
                  setCompare(true);
                }}
              >
                {c.copy}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <aside className={styles.builderNotes}>
            <span className={styles.pastelPurple}>{c.demo}</span>
            <h3>{c.checkTitle}</h3>
            <ul>
              <li>
                <span>01</span>
                {fieldCheck}
              </li>
              {active.slice(0, 2).map((id, i) => (
                <li key={id}>
                  <span>0{i + 2}</span>
                  {c.subjectCheck.replace("{subject}", label(id))}
                </li>
              ))}
            </ul>
            <p className={styles.smallNote}>{c.ibNote}</p>
            <div className={styles.inlineHint}>
              <Sparkles size={18} />
              <span>{active.length === 3 ? c.change : c.mascotHint}</span>
            </div>
          </aside>
        </div>
      )}
      {s.ib && compare && (
        <div id="subject-comparison" className={styles.comparison}>
          <div className={styles.comparisonTitle}>
            <GitCompareArrows size={22} />
            <h3>{c.compare}</h3>
          </div>
          <div className={styles.compareSets}>
            {(["a", "b"] as const).map((k) => (
              <div
                key={k}
                className={s.active === k ? styles.activeCompare : ""}
              >
                <button
                  type="button"
                  className="text-button"
                  onClick={() => patch({ active: k })}
                >
                  {c.set} {k.toUpperCase()} <ArrowUpRight size={16} />
                </button>
                <p>
                  {s[k].map((id) => (
                    <span
                      key={id}
                      className={
                        (k === "b" ? added : removed).includes(id)
                          ? styles.differentSubject
                          : ""
                      }
                    >
                      {label(id)} <small>HL</small>
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
          <div className={styles.diff} aria-live="polite">
            {!added.length && !removed.length ? (
              <p>{c.same}</p>
            ) : (
              <>
                <p>
                  <strong>+ {c.added}: </strong>
                  {added.map(label).join(", ") || "—"}
                </p>
                <p>
                  <strong>− {c.removed}: </strong>
                  {removed.map(label).join(", ") || "—"}
                </p>
                {added.map((id) => (
                  <p key={id}>
                    {c.subjectCheck.replace("{subject}", label(id))}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LeadForm({ locale }: { locale: Locale }) {
  const c = routeCopy[locale],
    { route: s, journey } = useRoute(),
    [status, setStatus] = useState<
      "idle" | "sending" | "success" | "error" | "invalid"
    >("idle"),
    [privacy, setPrivacy] = useState(false),
    requestId = useRef(""),
    payloadKey = useRef("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget,
      fd = new FormData(form),
      name = String(fd.get("name") || "").trim(),
      email = String(fd.get("email") || "").trim();
    if (
      !name ||
      !email ||
      !form.checkValidity() ||
      fd.get("consent") !== "on"
    ) {
      setStatus("invalid");
      form.reportValidity();
      return;
    }
    const key = JSON.stringify({ name, email, answers: s, locale });
    if (key !== payloadKey.current) {
      payloadKey.current = key;
      requestId.current = crypto.randomUUID();
    }
    setStatus("sending");
    try {
      const r = await fetch("/api/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId.current,
          journeyId: journey(),
          name,
          email,
          consent: true,
          locale,
          answers: s,
          website: fd.get("website"),
        }),
      });
      if (!r.ok) throw new Error("Not saved");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }
  return (
    <aside className={styles.leadCard}>
      <span className={styles.pastelGreen}>{c.optional}</span>
      <h3>{c.leadTitle}</h3>
      <p>{c.leadText}</p>
      <form onSubmit={submit} method="post" action="/api/leads/" noValidate aria-busy={status === "sending"}>
        <label>
          {c.name}
          <input
            name="name"
            autoComplete="given-name"
            maxLength={80}
            required
            disabled={status === "success"}
          />
        </label>
        <label>
          {c.email}
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={status === "success"}
          />
        </label>
        <label className={styles.honeypot} aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className={styles.consent}>
          <input
            type="checkbox"
            name="consent"
            required
            disabled={status === "success"}
          />
          <span>{c.consent}</span>
        </label>
        <button
          type="button"
          className="text-button"
          aria-expanded={privacy}
          aria-controls="lead-privacy"
          onClick={() => setPrivacy((v) => !v)}
        >
          {c.privacy}
          <ChevronDown size={14} />
        </button>
        {privacy && (
          <p id="lead-privacy" className={styles.smallNote}>
            {c.privacyText}
          </p>
        )}
        <button
          className="button button-primary"
          type="submit"
          disabled={status === "sending" || status === "success"}
        >
          {status === "sending" ? (
            c.sending
          ) : status === "success" ? (
            <>
              <Check size={18} />
              {c.done}
            </>
          ) : (
            <>
              {c.submit}
              <ArrowUpRight size={18} />
            </>
          )}
        </button>
        <p
          role={status === "error" || status === "invalid" ? "alert" : "status"}
          className={styles.formStatus}
        >
          {status === "success"
            ? c.success
            : status === "error"
              ? c.failed
              : status === "invalid"
                ? c.invalid
                : ""}
        </p>
      </form>
    </aside>
  );
}

function MyRoute({ locale }: { locale: Locale }) {
  const c = routeCopy[locale],
    d = dictionaries[locale],
    { route: s, patch, track } = useRoute(),
    route = makeRoute(s, locale),
    scope = useRef<HTMLElement>(null),
    reduce = useReducedMotion();
  const [download, setDownload] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  useEffect(() => {
    if (!s.completed || !scope.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) track("result_view");
      },
      { threshold: 0.2 },
    );
    observer.observe(scope.current);
    return () => observer.disconnect();
  }, [s.completed, track]);
  useLayoutEffect(() => {
    if (!s.completed || reduce || !scope.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-route-piece]", {
        y: 14,
        scale: 0.98,
        opacity: 0.3,
        duration: 0.4,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "all",
      });
    }, scope);
    return () => ctx.revert();
  }, [s.completed, s.challenge, s.grade, s.interests, reduce]);
  async function save() {
    setDownload("loading");
    try {
      await downloadRoute(s, locale);
      setDownload("idle");
      track("route_download");
    } catch {
      setDownload("error");
    }
  }
  return (
    <section id="my-route" className={styles.resultSection} ref={scope}>
      <div className="container">
        <SectionLabel n="03">{c.done}</SectionLabel>
        <div className={styles.sectionHeading}>
          <h2>{c.resultTitle}</h2>
          <p>{c.resultLead}</p>
        </div>
        {!s.completed ? (
          <div className={styles.emptyResult}>
            <Compass size={32} />
            <p>{c.noResult}</p>
            <button
              className="button button-primary"
              onClick={() => go("quiz")}
            >
              {c.primary}
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className={styles.resultLayout}>
            <div>
              <article className={styles.routeCard} aria-label={c.resultTitle}>
                <div data-route-piece className={styles.routeCardTop}>
                  <span>VENTORME / YOUR NEXT MOVE</span>
                  <CheckCircle2 size={24} />
                </div>
                <h3 data-route-piece>{route.title}</h3>
                <div data-route-piece className={styles.contextTags}>
                  <span>
                    {s.grade} {c.grade}
                  </span>
                  <span>{s.ib ? "IB" : c.generalMode}</span>
                </div>
                <dl data-route-piece className={styles.routeDetails}>
                  <div>
                    <dt>{c.interests}</dt>
                    <dd>
                      {s.interests
                        .map((i) => d.choices.interests[i])
                        .join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt>{c.difficulty}</dt>
                    <dd>
                      {
                        c.challenges[
                          challenges.indexOf(
                            s.challenge as (typeof challenges)[number],
                          )
                        ]
                      }
                    </dd>
                  </div>
                  {s.ib && s[s.active].length > 0 && (
                    <div>
                      <dt>
                        {c.selected} · {s.active.toUpperCase()}
                      </dt>
                      <dd>
                        {s[s.active]
                          .map((id) => c.subjects[subjects.indexOf(id)])
                          .join(" · ")}
                      </dd>
                    </div>
                  )}
                </dl>
                <p data-route-piece className={styles.routeSummary}>
                  {route.summary}
                </p>
                <h4 data-route-piece>{c.actions}</h4>
                <ol className={styles.routeSteps}>
                  {route.steps.map((t, i) => (
                    <li data-route-piece key={t}>
                      <span>0{i + 1}</span>
                      <p>{t}</p>
                    </li>
                  ))}
                </ol>
                <p className={styles.smallNote}>{c.rules}</p>
              </article>
              <div className={styles.routeControls}>
                <button
                  className="button button-primary"
                  onClick={save}
                  disabled={download === "loading"}
                >
                  <Download size={18} />
                  {download === "loading" ? c.downloading : c.download}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    patch({ completed: false, step: 0 });
                    go("quiz");
                  }}
                >
                  {c.edit}
                  <ArrowUpRight size={16} />
                </button>
                <ShareButton locale={locale} />
              </div>
              {download === "error" && <p role="alert">{c.downloadError}</p>}
              <div className={styles.recommendations}>
                <h3>{c.startWith}</h3>
                {route.features.map((key) => {
                  const f = d.features[key as keyof typeof d.features];
                  return (
                    <div key={key}>
                      <BookOpen size={19} />
                      <p>
                        <strong>{f.title}</strong>
                        <span>{f.text}</span>
                      </p>
                    </div>
                  );
                })}
                <p className={styles.smallNote}>{c.featureNote}</p>
                <RegistrationButton locale={locale} primary />
              </div>
            </div>
            <LeadForm locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}

export function RouteExperience({
  locale,
  mascotVideoAvailable = true,
  entry = "home",
}: {
  locale: Locale;
  mascotVideoAvailable?: boolean;
  entry?: "home" | "quiz" | "result";
}) {
  const c = routeCopy[locale],
    { ready, track } = useRoute();
  useEffect(() => {
    if (ready && entry !== "home") {
      const timer = setTimeout(
        () => go(entry === "quiz" ? "quiz" : "my-route"),
        100,
      );
      return () => clearTimeout(timer);
    }
  }, [ready, entry]);
  return (
    <main id="main-content" className={styles.root}>
      <section className={`${styles.hero} container`}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>
            <span className={styles.pastelGreen}>10—12</span>
            {c.eyebrow}
          </p>
          <h1>
            {c.title}
            <br />
            <span>{c.accent}</span>
          </h1>
          <p className={styles.heroLead}>{c.lead}</p>
          <div className={styles.heroButtons}>
            <button
              className="button button-primary"
              onClick={() => {
                track("quiz_start");
                go("quiz");
              }}
            >
              {c.primary}
              <ArrowUpRight size={19} />
            </button>
            <button className="text-button" onClick={() => go("ib-builder")}>
              {c.secondary}
              <ArrowRight size={17} />
            </button>
          </div>
          <p className={styles.heroNote}>
            <ShieldCheck size={16} />
            {c.free}
          </p>
        </div>
        <RouteScene locale={locale} videoAvailable={mascotVideoAvailable} />
      </section>
      <div id="how" className={styles.journeyStrip}>
        <div className="container">
          {c.scene.map((t, i) => (
            <div key={t}>
              <span>0{i + 1}</span>
              <strong>{t}</strong>
              {i < 3 && <ArrowRight size={18} />}
            </div>
          ))}
        </div>
      </div>
      <Quiz locale={locale} />
      <IBBuilder locale={locale} />
      <MyRoute locale={locale} />
      <section id="features" className={`${styles.section} container`}>
        <SectionLabel n="04">VENTORME</SectionLabel>
        <div className={styles.sectionHeading}>
          <h2>{c.platformTitle}</h2>
          <p>{c.platformLead}</p>
        </div>
        <div className={styles.platformGrid}>
          {c.featureTitles.map((title, i) => (
            <div key={title}>
              <span
                className={
                  [
                    styles.pastelGreen,
                    styles.pastelOrange,
                    styles.pastelPurple,
                  ][i]
                }
              >
                0{i + 1}
              </span>
              <h3>{title}</h3>
              <p>{c.featureTexts[i]}</p>
              {i === 0 ? (
                <Compass size={50} strokeWidth={1} />
              ) : i === 1 ? (
                <GraduationCap size={50} strokeWidth={1} />
              ) : (
                <BookOpen size={50} strokeWidth={1} />
              )}
            </div>
          ))}
        </div>
      </section>
      <section id="faq" className={`${styles.faq} container`}>
        <h2>{c.faqTitle}</h2>
        <div>
          {c.faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={19} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={`${styles.final} container`}>
        <div>
          <span className={styles.sectionLabel}>YOUR NEXT MOVE ↗</span>
          <h2>{c.finalTitle}</h2>
          <p>{c.finalText}</p>
        </div>
        <div>
          <button className="button button-lime" onClick={() => go("quiz")}>
            {c.primary}
            <ArrowUpRight size={18} />
          </button>
          <RegistrationButton locale={locale} />
        </div>
      </section>
    </main>
  );
}
