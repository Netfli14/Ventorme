"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "./useMotionPreference";
import styles from "./MessageText.module.css";

/** A short message reveal. The complete text remains available to assistive tech. */
export function MessageText({ text }: { text: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  // Deterministic segmentation keeps server/client markup identical. CJK may
  // wrap between characters; Latin and Cyrillic words remain together.
  const words = useMemo(() => text.split(/(\s+|[\u3400-\u9fff])/u).filter(Boolean), [text]);
  useLayoutEffect(() => {
    if (reduce || !host.current) return;
    const node = host.current;
    const ctx = gsap.context(() => {}, node);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      ctx.add(() => {
        const glyphs = node.querySelectorAll("[data-message-glyph]");
        const dots = node.querySelector("[data-message-dots]");
        const delay = Math.min(0.012, 0.5 / Math.max(1, glyphs.length));
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .set(glyphs, { opacity: 0, y: 3 })
          .set(dots, { autoAlpha: 1 })
          .to(dots, { autoAlpha: 0, duration: 0.12 }, 0.16)
          .to(glyphs, { opacity: 1, y: 0, duration: 0.08, stagger: delay, clearProps: "opacity,transform" }, 0.23);
      });
    }, { threshold: 0.15 });
    observer.observe(node);
    return () => { observer.disconnect(); ctx.revert(); };
  }, [text, reduce]);
  return (
    <span className={styles.message} ref={host} data-message>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        <span className={styles.dots} data-message-dots><i /><i /><i /></span>
        {words.map((word, index) => /^\s+$/u.test(word) ? word : (
          <span className={styles.word} key={index}>
            {Array.from(word).map((glyph, i) => <span className={styles.glyph} data-message-glyph key={i}>{glyph}</span>)}
          </span>
        ))}
      </span>
    </span>
  );
}
