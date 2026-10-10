'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { clearState, initialState, readState, writeState, type QuizState } from '@/lib/storage';
import { type Answers } from '@/lib/quiz';

type Context = { state: QuizState; ready: boolean; update: (answers: Answers, step?: number) => void; reset: () => void; theme: 'light' | 'dark'; toggleTheme: () => void; backgroundPaused: boolean; toggleBackground: () => void };
const AppContext = createContext<Context | null>(null);
function session() { try { return window.sessionStorage; } catch { return undefined; } }
export function Providers({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState), [ready, setReady] = useState(false), [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const current = useRef(state);
  useEffect(() => {
    const restored = readState(session()) ?? initialState();
    current.current = restored;
    setState(restored);
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    try { setBackgroundPaused(window.localStorage.getItem('ventorme.background-paused') === 'true'); } catch { /* Playback preference still works in memory. */ }
    setReady(true);
  }, []);
  const update = useCallback((answers: Answers, step?: number) => {
    const next: QuizState = { version: 1, answers, step: step ?? current.current.step };
    current.current = next;
    writeState(next, session());
    setState(next);
  }, []);
  const reset = useCallback(() => { clearState(session()); const next = initialState(); current.current = next; setState(next); }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem('ventorme.theme', next); } catch { /* Theme still works in memory. */ }
  };
  const toggleBackground = () => {
    const next = !backgroundPaused;
    setBackgroundPaused(next);
    try { window.localStorage.setItem('ventorme.background-paused', String(next)); } catch { /* Playback preference still works in memory. */ }
  };
  return <AppContext.Provider value={{ state, ready, update, reset, theme, toggleTheme, backgroundPaused, toggleBackground }}><MotionConfig reducedMotion="user">{children}</MotionConfig></AppContext.Provider>;
}
export function useApp() { const app = useContext(AppContext); if (!app) throw new Error('App provider missing'); return app; }
