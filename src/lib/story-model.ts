export const STORY_OPEN_STEPS = 3;
export const STORY_RESULT_STEP = STORY_OPEN_STEPS;
export const storyInterests = ['science', 'technology', 'people', 'creativity', 'business', 'nature'] as const;
export type StoryInterest = typeof storyInterests[number];
export type Criterion = 'programme' | 'budget' | 'country';
export type FirstTask = 'direction' | 'requirements' | 'finance';
export type StoryState = { interests: StoryInterest[]; criterion: Criterion | ''; firstTask: FirstTask | ''; step: number; furthest: number };
export const emptyStory = (): StoryState => ({ interests: [], criterion: '', firstTask: '', step: 0, furthest: 0 });
export function toggleStoryInterest(s: StoryState, value: StoryInterest): StoryState {
  if (s.interests.includes(value)) return {...s, interests: s.interests.filter(x => x !== value)};
  return s.interests.length < 2 ? {...s, interests: [...s.interests, value]} : s;
}
export function canAdvanceStory(s: StoryState): boolean {
  return s.step === 0 ? s.interests.length === 2 : s.step === 1 ? !!s.criterion : s.step === 2 ? !!s.firstTask : true;
}
export function storyTaskOrder(first: StoryState['firstTask']): FirstTask[] {
  const tasks: FirstTask[] = ['direction', 'requirements', 'finance'];
  return first ? [first, ...tasks.filter(x => x !== first)] : tasks;
}
export function moveStory(s: StoryState, step: number): StoryState {
  if (step < 0 || step > STORY_RESULT_STEP || step > s.furthest + 1) return s;
  if (step > s.step && !canAdvanceStory(s)) return s;
  return {...s, step, furthest: Math.max(step, s.furthest)};
}
export function restoreStory(raw: unknown): StoryState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as StoryState;
  if (!Array.isArray(s.interests) || s.interests.length > 2 || new Set(s.interests).size !== s.interests.length
    || s.interests.some(x => !storyInterests.includes(x)) || !['', 'programme', 'budget', 'country'].includes(s.criterion)
    || !['', 'direction', 'requirements', 'finance'].includes(s.firstTask) || !Number.isInteger(s.step)
    || !Number.isInteger(s.furthest) || s.step < 0 || s.step > s.furthest || s.furthest > 7
    || (s.furthest > 0 && s.interests.length !== 2) || (s.furthest > 1 && !s.criterion) || (s.furthest > 2 && !s.firstTask)) return null;
  return {...s, interests: [...s.interests], step: Math.min(s.step, STORY_RESULT_STEP), furthest: Math.min(s.furthest, STORY_RESULT_STEP)};
}
