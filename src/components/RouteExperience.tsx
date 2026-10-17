"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "./useMotionPreference";
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
import { useRoute } from "./RouteProvider";
import { useRouteMotion } from "./useRouteMotion";
import { MascotScrollIntro } from "./MascotScrollIntro";
import { StoryExperience } from "./StoryExperience";
import { platformFaq } from "@/lib/platform-faq";
import { storyCopy } from "@/lib/story-copy";
import { RegistrationButton } from "./Actions";
import styles from "./RouteExperience.module.css";

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
  const hint = c.mascotHint;
  useLayoutEffect(() => {
    if (reduce || !scope.current) return;
    const host = scope.current;
    const mobile = matchMedia("(max-width: 850px)").matches;
    let timeline: gsap.core.Timeline;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      timeline = tl;
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
        .from("[data-halo]", { scale: 0.7, opacity: 0, duration: 0.8 }, 0.8)
        .from("[data-orbit]", { scale: 0.75, rotation: -60, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.5)
        .to('[data-node="interest"]', {y: mobile ? -4 : -8, rotation: -4, duration: 0.9, repeat: 1, yoyo: true, ease: "sine.inOut"}, 1.9)
        .to('[data-node="route"]', {y: mobile ? 3 : 6, rotation: 2, duration: 0.9, repeat: 1, yoyo: true, ease: "sine.inOut"}, 2.1);
      const paths = host.querySelectorAll<SVGPathElement>("[data-path]");
      host.querySelectorAll<SVGCircleElement>("[data-signal]").forEach((signal, i) => {
        const path = paths[i], progress = {value: 0}, length = path.getTotalLength();
        tl.to(signal, {opacity: 1, duration: 0.15}, 0.8 + i * 0.25)
          .to(progress, {value: 1, duration: 1.5, ease: "power1.inOut", onUpdate: () => {
            const p = path.getPointAtLength(length * progress.value);
            signal.setAttribute("cx", String(p.x)); signal.setAttribute("cy", String(p.y));
          }}, 0.8 + i * 0.25)
          .to(signal, {opacity: 0, duration: 0.2}, 2.3 + i * 0.25);
      });
    }, scope);
    let visible = false;
    const sync = () => visible && !document.hidden ? timeline?.play() : timeline?.pause();
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}, {threshold: 0.12});
    observer.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {observer.disconnect(); document.removeEventListener("visibilitychange", sync); ctx.revert();};
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
      <div className={styles.sceneOrbits} aria-hidden="true">
        <span data-orbit /><span data-orbit />
      </div>
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
        <circle data-signal cx="112" cy="123" r="5" fill="#DFFF00" stroke="var(--accent)" strokeWidth="2" opacity="0" />
        <circle data-signal cx="120" cy="300" r="4" fill="var(--accent)" opacity="0" />
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
    { track } = useRoute(),
    scope = useRef<HTMLElement>(null);
  useRouteMotion(scope, locale);
  const story = storyCopy[locale];
  function startPlan() { track("story_start"); go("story"); }
  useEffect(() => {
    if (entry !== "home") {
      const timer = setTimeout(() => go("story"), 100);
      return () => clearTimeout(timer);
    }
  }, [entry]);
  return (
    <main id="main-content" className={styles.root} ref={scope}>
      {entry === "home" && mascotVideoAvailable && <MascotScrollIntro locale={locale} planLabel={story.try} />}
      <section id="content-start" className={`${styles.hero} container`}>
        <div className={styles.heroCopy} data-motion-section="hero">
          <p data-hero-support className={styles.heroEyebrow}>
            <span className={styles.pastelGreen}>10—12</span>
            {story.eyebrow}
          </p>
          <h1>
            <span className={styles.heroLine}><span data-hero-line>{story.title}</span></span>
            <span className={`${styles.heroLine} ${styles.heroAccent}`}><span data-hero-line>{story.accent}</span></span>
          </h1>
          <span data-hero-underline className={styles.heroUnderline} aria-hidden="true" />
          <p data-hero-support className={styles.heroLead}>{story.lead}</p>
          <div data-hero-support className={styles.heroButtons}>
            <button type="button" className="button button-primary" onClick={startPlan}>
              {story.try}<ArrowUpRight size={19}/>
            </button>
            <RegistrationButton locale={locale}/>
          </div>
          <p data-hero-support className={styles.heroNote}><ShieldCheck size={16}/>{story.demo}</p>
        </div>
        <RouteScene locale={locale} videoAvailable={mascotVideoAvailable} />
      </section>
      <div id="how"><div id="features"><StoryExperience locale={locale}/></div></div>
      <section id="faq" className={`${styles.faq} container`}>
        <h2>{c.faqTitle}</h2>
        <div>
          {platformFaq[locale].map(([q, a]) => (
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
      <section className={`${styles.final} container`} data-motion-section="final">
        <div className={styles.finalArt} aria-hidden="true">
          <span data-final-orbit /><span data-final-orbit /><span data-final-arrow>↗</span>
        </div>
        <div>
          <span className={styles.sectionLabel}>YOUR NEXT MOVE ↗</span>
          <h2>{c.finalTitle}</h2>
          <p>{c.finalText}</p>
        </div>
        <div>
          <button className="button button-lime" onClick={startPlan}>
            {story.try}
            <ArrowUpRight size={18} />
          </button>
          <RegistrationButton locale={locale} />
        </div>
      </section>
    </main>
  );
}
