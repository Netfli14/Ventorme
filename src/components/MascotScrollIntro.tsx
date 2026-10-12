'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { scrollProgress, scrollTime } from '@/lib/video-scroll';
import styles from './MascotScrollIntro.module.css';
import { MascotFallback } from './MascotFallback';

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
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef(0);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [assetFailed, setAssetFailed] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const text = introCopy[locale];

  const sampleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Use the sticky scene's real height; mobile browser chrome can change innerHeight.
    const sceneHeight = sceneRef.current?.offsetHeight ?? window.innerHeight;
    const next = scrollProgress(section.getBoundingClientRect().top, section.offsetHeight, sceneHeight);
    document.documentElement.dataset.mascotScene = next < 0.995 ? 'active' : 'done';
    setProgress(previous => (Math.abs(previous - next) > 0.002 ? next : previous));
    const video = videoRef.current;
    if (assetFailed || !video || !(durationRef.current > 0) || video.readyState < 1) return;
    const target = scrollTime(next, durationRef.current);
    if (target !== null && Math.abs(video.currentTime - target) >= 1 / 60) {
      try { video.currentTime = target; } catch { /* media metadata not ready */ }
    }
  }, [assetFailed]);

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

  useEffect(() => {
    if (assetFailed) {
      delete document.documentElement.dataset.mascotScene;
      return;
    }
    document.documentElement.dataset.mascotScene = 'active';
    scheduleSample();
    return () => { delete document.documentElement.dataset.mascotScene; };
  }, [assetFailed, scheduleSample]);

  // If the MP4 is missing or iOS has not decoded a frame, the snow-leopard
  // illustration remains visible and is controlled by the SAME scroll progress.
  return <section ref={sectionRef}
    data-mascot-intro="true"
    className={[styles.scrollSection, reducedMotion ? styles.reduced : ''].join(' ')}
    aria-label={[text.name, text.description].join(': ')}>
    <div ref={sceneRef} className={styles.stickyScene}>
      <MascotFallback progress={progress} reducedMotion={reducedMotion} />
      <video ref={videoRef} className={styles.video} src={VIDEO_URL}
        style={{ opacity: frameReady && !assetFailed ? 1 : 0 }}
        muted playsInline preload="auto" aria-hidden="true"
        onLoadedMetadata={event => {
          const video = event.currentTarget;
          durationRef.current = Number.isFinite(video.duration) ? video.duration : 0;
          video.pause();
          scheduleSample();
        }}
        onLoadedData={() => { setFrameReady(true); scheduleSample(); }}
        onSeeked={() => { setFrameReady(true); scheduleSample(); }}
        onError={() => { setFrameReady(false); setAssetFailed(true); }}
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
