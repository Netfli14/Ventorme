import { emptyAnswers, options, type Answers } from './quiz';
export const QUIZ_KEY = 'ventorme.context.v1';
export type QuizState = { version: 1; step: number; answers: Answers };
export const initialState = (): QuizState => ({ version: 1, step: 0, answers: emptyAnswers() });
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, value: string): void; removeItem(k: string): void }
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
export function parseState(raw: string | null): QuizState | null {
  if (!raw || raw.length > 4096) return null;
  try {
    const x: unknown = JSON.parse(raw);
    if (!object(x) || x.version !== 1 || !Number.isInteger(x.step) || Number(x.step) < 0 || Number(x.step) > 5 || !object(x.answers)) return null;
    const input = x.answers, a = emptyAnswers();
    for (const id of ['grade', 'program', 'ibStatus', 'stage'] as const) {
      if (input[id] !== undefined) {
        if (typeof input[id] !== 'string' || !(options[id] as readonly string[]).includes(input[id] as string)) return null;
        Object.assign(a, { [id]: input[id] });
      }
    }
    for (const [id, max] of [['regions', 3], ['interests', 3], ['challenges', 2]] as const) {
      const values = input[id];
      if (!Array.isArray(values) || !values.every(v => typeof v === 'string' && (options[id] as readonly string[]).includes(v)) || values.length > max || new Set(values).size !== values.length || (id !== 'challenges' && values.includes('unknown') && values.length > 1)) return null;
      Object.assign(a, { [id]: [...values] });
    }
    if (a.program !== 'ib') delete a.ibStatus;
    return { version: 1, step: Number(x.step), answers: a };
  } catch { return null; }
}
export function readState(storage?: StorageLike): QuizState | null {
  try { return storage ? parseState(storage.getItem(QUIZ_KEY)) : null; } catch { return null; }
}
export function writeState(state: QuizState, storage?: StorageLike): boolean {
  try { if (!storage) return false; storage.setItem(QUIZ_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function clearState(storage?: StorageLike): void { try { storage?.removeItem(QUIZ_KEY); } catch { /* The in-memory state is still reset. */ } }
