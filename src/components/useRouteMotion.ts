"use client";
import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";

// Each scene runs when it is seen. Content is visible before JS and without motion.
export function useRouteMotion(scope: RefObject<HTMLElement | null>, locale: string) {
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    if (reduce || !scope.current) return;
    const root = scope.current;
    const mobile = matchMedia("(max-width: 850px)").matches;
    const ctx = gsap.context(() => {}, root);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        ctx.add(() => {
          const el = entry.target;
          const find = (selector: string) => el.querySelectorAll(selector);
          const tl = gsap.timeline({defaults: {ease: "power3.out", duration: mobile ? 0.4 : 0.6, clearProps: "transform,opacity"}});
          switch ((el as HTMLElement).dataset.motionSection) {
            case "hero":
              tl.from(find("[data-hero-line]"), {yPercent: 105, rotation: 2, stagger: 0.08})
                .from(find("[data-hero-support]"), {y: 16, opacity: 0.3, stagger: 0.06}, 0.2)
                .from(find("[data-hero-underline]"), {scaleX: 0, transformOrigin: "left", duration: 0.7}, 0.5);
              break;
            case "journey":
              tl.from(find("[data-journey-step] > span"), {scale: 0.5, rotation: -35, stagger: 0.09})
                .from(find("[data-journey-step] > svg"), {x: -14, opacity: 0, stagger: 0.12}, 0.15);
              break;
            case "quiz":
              tl.from(find("[data-quiz-symbol]"), {rotation: (i) => i ? 32 : -32, scale: 0.7, stagger: 0.12})
                .from(find("[data-quiz-arrow]"), {scaleX: 0, transformOrigin: "left"}, 0.2);
              break;
            case "feature":
              tl.from(find("[data-feature-icon]"), {rotation: -35, scale: 0.4, opacity: 0, transformOrigin: "center"})
                .from(find("[data-feature-number]"), {x: -12, scale: 0.8, opacity: 0}, 0.12);
              break;
            case "final":
              tl.from(find("[data-final-orbit]"), {scale: 0.65, rotation: -70, opacity: 0, stagger: 0.09, duration: 1})
                .from(find("[data-final-arrow]"), {x: -35, y: 35, scale: 0.8, opacity: 0}, 0.2);
              break;
          }
        });
      }
    }, {threshold: 0.16});
    root.querySelectorAll("[data-motion-section]").forEach(el => observer.observe(el));
    const feedback = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.checked) return;
      const label = input.closest("[data-answer]");
      if (!label) return;
      ctx.add(() => {
        gsap.fromTo(label, {scale: 0.97}, {scale: 1, duration: 0.32, ease: "back.out(1.7)", overwrite: "auto", clearProps: "transform"});
        const icon = label.querySelector("svg");
        if (icon) gsap.fromTo(icon, {scale: 0.35, rotation: -35}, {scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.8)", clearProps: "transform"});
      });
    };
    root.addEventListener("change", feedback);
    return () => {observer.disconnect(); root.removeEventListener("change", feedback); ctx.revert();};
  }, [scope, locale, reduce]);
}
