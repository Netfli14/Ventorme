'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { RegistrationButton } from './Actions';
import { useReducedMotion } from './useMotionPreference';
import styles from './MascotScrollIntro.module.css';

const VIDEO_URL = '/media/ventorme-mascot-intro.mp4?v=2';

const introCopy: Record<Locale, {
  name: string; description: string; skip: string; continue: string; play: string; replay: string; pause: string;
}> = {
  ru: { name: 'Мы VentorMe', description: 'AI-платформа для поступления', skip: 'Пропустить интро', continue: 'Листай дальше', play: 'Воспроизвести видео', replay: 'Посмотреть ещё раз', pause: 'Пауза видео' },
  en: { name: 'We are VentorMe', description: 'AI-powered university admissions platform', skip: 'Skip intro', continue: 'Scroll to continue', play: 'Play video', replay: 'Watch again', pause: 'Pause video' },
  kk: { name: 'Біз VentorMe', description: 'Университетке түсуге арналған AI-платформа', skip: 'Кіріспені өткізу', continue: 'Әрі қарай айналдыр', play: 'Видеоны ойнату', replay: 'Қайта көру', pause: 'Видеоны кідірту' },
  uz: { name: 'Biz VentorMe', description: 'Universitetga kirish uchun AI-platforma', skip: 'Kirishni o‘tkazib yuborish', continue: 'Davom etish uchun aylantiring', play: 'Videoni ijro etish', replay: 'Yana ko‘rish', pause: 'Videoni pauza qilish' },
  zh: { name: '我们是 VentorMe', description: '助力大学申请的 AI 平台', skip: '跳过视频', continue: '继续向下', play: '播放视频', replay: '再次观看', pause: '暂停视频' },
  tr: { name: 'Biz VentorMe', description: 'Üniversite başvuruları için yapay zekâ platformu', skip: 'Girişi atla', continue: 'Devam etmek için kaydır', play: 'Videoyu oynat', replay: 'Tekrar izle', pause: 'Videoyu duraklat' },
};

/**
 * One natural, timed video on ALL screen sizes:
 * - Autoplays muted and inline, with manual playback for reduced motion.
 * - Never seeks, pauses, or changes rate in response to wheel/touch scroll.
 * - The page scrolls normally and the next section begins immediately below.
 */
export function MascotScrollIntro({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [assetFailed, setAssetFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [requiresTap, setRequiresTap] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [paused, setPaused] = useState(true);
  const reduce = useReducedMotion();
  const text = introCopy[locale];

  useEffect(() => {
    if (assetFailed) {
      delete document.documentElement.dataset.mascotScene;
      return;
    }

    const section = sectionRef.current;
    document.documentElement.dataset.mascotScene = 'active';
    const observer = section && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          document.documentElement.dataset.mascotScene = entry.isIntersecting ? 'active' : 'done';
          if (!entry.isIntersecting) videoRef.current?.pause();
        }, { threshold: 0.04 })
      : null;
    if (observer && section) observer.observe(section);
    return () => {
      observer?.disconnect();
      delete document.documentElement.dataset.mascotScene;
    };
  }, [assetFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduce) {
      video.pause();
      setRequiresTap(true);
    } else if (!video.ended) {
      const bounds = sectionRef.current?.getBoundingClientRect();
      if (bounds && bounds.bottom > 0 && bounds.top < innerHeight) {
        // play() may be requested before decoding is ready; the browser starts
        // it as soon as media is available, without waiting for a user gesture.
        setRequiresTap(false);
        startVideo();
      }
    }
  }, [reduce]);

  const startVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(() => {
      setRequiresTap(false);
    }).catch(() => {
      // Some phone power-saving and browser settings require a tap to play.
      setRequiresTap(true);
    });
  };

  const replayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setFinished(false);
    setShowTitle(false);
    video.currentTime = 0;
    startVideo();
  };

  // The real video is gated at build time. If decoding fails, do not leave
  // a black full-screen intro or switch to an artificial mascot.
  if (assetFailed) return null;

  return <section ref={sectionRef}
    className={styles.videoSection}
    aria-label={`${text.name}: ${text.description}`}
    data-mascot-intro="video">
    <video ref={videoRef} className={styles.video} src={VIDEO_URL}
      poster="/media/ventorme-mascot-poster.jpg?v=2"
      width={1484} height={620}
      autoPlay={!reduce} muted playsInline preload={reduce ? 'metadata' : 'auto'} controls aria-label={`${text.name}: ${text.description}`}
      onCanPlay={event => {
        setReady(true);
        // Browsers should autoplay normally; if disallowed, expose a tap target.
        const bounds = sectionRef.current?.getBoundingClientRect();
        if (!reduce && bounds && bounds.bottom > 0 && bounds.top < innerHeight && !event.currentTarget.ended && event.currentTarget.paused && !requiresTap) startVideo();
      }}
      onPlay={() => { setRequiresTap(false); setPaused(false); }}
      onPause={() => { setPaused(true); setRequiresTap(true); }}
      onTimeUpdate={event => {
        const video = event.currentTarget;
        if (Number.isFinite(video.duration) && video.duration > 0 &&
            video.currentTime >= video.duration * 0.69) setShowTitle(true);
      }}
      onEnded={() => { setFinished(true); setShowTitle(true); }}
      onError={() => setAssetFailed(true)}
    />
    <div className={styles.scrim} aria-hidden="true" />
    <div className={[styles.brandReveal, showTitle ? styles.visible : ''].join(' ')}>
      <h2>{text.name}</h2>
      <p>{text.description}</p>
    </div>
    <a href="#content-start" className={styles.skip}>{text.skip} <span aria-hidden="true">↓</span></a>
    <div className={styles.registration}>
      <RegistrationButton locale={locale} primary />
    </div>
    {paused && !finished && (ready || requiresTap || reduce) && <button type="button" className={styles.playButton} onClick={startVideo}>
      <span aria-hidden="true">▶</span> {text.play}
    </button>}
    {!paused && !finished && <button type="button" className={styles.pauseButton} onClick={() => videoRef.current?.pause()}>
      <span aria-hidden="true">Ⅱ</span> {text.pause}
    </button>}
    {finished && <button type="button" className={styles.replayButton} onClick={replayVideo}>
      <span aria-hidden="true">↻</span> {text.replay}
    </button>}
    <p className={styles.scrollHint} aria-hidden="true">{text.continue} ↓</p>
  </section>;
}
