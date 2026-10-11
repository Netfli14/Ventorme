'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import styles from './MascotScrollIntro.module.css';

const VIDEO_URL = '/media/ventorme-mascot-intro.mp4';
const introCopy: Record<Locale, { name: string; description: string; skip: string; scroll: string }> = {
  ru: { name: 'Мы VentorMe', description: 'AI-платформа для поступления', skip: 'Пропустить интро', scroll: 'Листай вниз' },
  en: { name: 'We are VentorMe', description: 'Your AI-powered university admissions platform', skip: 'Skip intro', scroll: 'Scroll to explore' },
  kk: { name: 'Біз VentorMe', description: 'Университетке түсуге арналған AI-платформа', skip: 'Кіріспені өткізу', scroll: 'Төмен айналдыр' },
  uz: { name: 'Biz VentorMe', description: 'Universitetga kirish uchun AI-platforma', skip: 'Kirishni o‘tkazib yuborish', scroll: 'Pastga aylantiring' },
  zh: { name: '我们是 VentorMe', description: '助力大学申请的 AI 平台', skip: '跳过开场', scroll: '向下滚动' },
  tr: { name: 'Biz VentorMe', description: 'Üniversite başvuruları için yapay zekâ platformu', skip: 'Girişi atla', scroll: 'Aşağı kaydır' },
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Scroll is the sole source of truth for playback; the browser keeps native
 * wheel/touch scrolling. Put the actual H.264 MP4 at public/media/.
 */
export function MascotScrollIntro({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef(0);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [assetFailed, setAssetFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const text = introCopy[locale];

  const sampleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const totalDistance = Math.max(1, section.offsetHeight - window.innerHeight);
    const next = clamp(-section.getBoundingClientRect().top / totalDistance);
    setProgress(previous => (Math.abs(previous - next) > 0.002 ? next : previous));
    const video = videoRef.current;
    if (!video || !(durationRef.current > 0) || video.readyState < 1) return;
    const target = Math.min(durationRef.current - 0.001, Math.max(0, next * durationRef.current));
    if (Math.abs(video.currentTime - target) >= 1 / 60) {
      try { video.currentTime = target; } catch { /* media metadata not ready */ }
    }
  }, []);

  const scheduleSample = useCallback(() => {
    if (requestRef.current) return;
    requestRef.current = window.requestAnimationFrame(() => {
      requestRef.current = 0;
      sampleScroll();
    });
  }, [sampleScroll]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => setReducedMotion(media.matches);
    onMotionChange();
    media.addEventListener('change', onMotionChange);
    window.addEventListener('scroll', scheduleSample, { passive: true });
    window.addEventListener('resize', scheduleSample);
    scheduleSample();
    return () => {
      media.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', scheduleSample);
      window.removeEventListener('resize', scheduleSample);
      window.cancelAnimationFrame(requestRef.current);
    };
  }, [scheduleSample]);

  // No media: keep the normal landing page instead of a blank 280vh scene.
  if (assetFailed) return null;

  return <section ref={sectionRef}
    className={[styles.scrollSection, reducedMotion ? styles.reduced : ''].join(' ')}
    aria-label={[text.name, text.description].join(': ')}>
    <div className={styles.stickyScene}>
      <video ref={videoRef} className={styles.video} src={VIDEO_URL}
        muted playsInline preload="auto" aria-hidden="true"
        onLoadedMetadata={event => {
          const video = event.currentTarget;
          durationRef.current = Number.isFinite(video.duration) ? video.duration : 0;
          video.pause();
          scheduleSample();
        }}
        onError={() => setAssetFailed(true)}
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.brandReveal}
        style={{ opacity: reducedMotion ? 1 : clamp((progress - 0.78) / 0.16) }}>
        <h2>{text.name}</h2><p>{text.description}</p>
      </div>
      <a className={styles.skip} href="#content-start">{text.skip} <span aria-hidden="true">↓</span></a>
      <p className={styles.scrollHint} aria-hidden="true">{text.scroll} <span>↓</span></p>
    </div>
  </section>;
}
