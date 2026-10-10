export const options = {
  grade: ['10', '11', '12'],
  program: ['kz', 'ib', 'alevel', 'other', 'unknown'],
  ibStatus: ['choosing', 'chosen', 'unknown'],
  stage: ['direction', 'universities', 'requirements', 'documents', 'unknown'],
  regions: ['kz', 'europe', 'uk', 'northAmerica', 'asia', 'turkey', 'unknown'],
  interests: ['engineering', 'science', 'health', 'it', 'business', 'humanities', 'art', 'unknown'],
  challenges: ['direction', 'universities', 'subjects', 'funding', 'exams', 'documents', 'start'],
} as const;
export type Grade = typeof options.grade[number];
export type Program = typeof options.program[number];
export type Stage = typeof options.stage[number];
export type Region = typeof options.regions[number];
export type Interest = typeof options.interests[number];
export type Challenge = typeof options.challenges[number];
export type Answers = {
  grade?: Grade; program?: Program; ibStatus?: typeof options.ibStatus[number]; stage?: Stage;
  regions: Region[]; interests: Interest[]; challenges: Challenge[];
};
export type QuestionId = 'grade' | 'program' | 'stage' | 'regions' | 'interests' | 'challenges';
export const questionIds: QuestionId[] = ['grade', 'program', 'stage', 'regions', 'interests', 'challenges'];
export const limits = { regions: 3, interests: 3, challenges: 2 } as const;
export const emptyAnswers = (): Answers => ({ regions: [], interests: [], challenges: [] });
export const isStepValid = (a: Answers, step: number): boolean => {
  const id = questionIds[step];
  if (!id) return false;
  const value = a[id];
  return Array.isArray(value) ? value.length > 0 && value.length <= limits[id as keyof typeof limits] : typeof value === 'string';
};
export const isComplete = (a: Answers): boolean => questionIds.every((_, i) => isStepValid(a, i));
export function toggleChoice<T extends string>(selected: T[], choice: T, max: number, exclusive?: T): { values: T[]; limited: boolean } {
  if (selected.includes(choice)) return { values: selected.filter(x => x !== choice), limited: false };
  if (choice === exclusive) return { values: [choice], limited: false };
  const values = selected.filter(x => x !== exclusive);
  return values.length >= max ? { values: selected, limited: true } : { values: [...values, choice], limited: false };
}
export type Focus = 'direction' | 'universities' | 'subjects' | 'funding' | 'exams' | 'documents' | 'start';
export type Preview = { focus: Focus; secondary: Focus | null; ib: boolean; year: Grade; program: Program; regions: Region[]; interests: Interest[]; features: string[] };
const featureMap: Record<Focus, string[]> = {
  direction: ['orientation', 'venti'], universities: ['universities', 'venti'], subjects: ['universities', 'venti'],
  funding: ['grants', 'universities'], exams: ['exams', 'venti'], documents: ['essays', 'venti'], start: ['orientation', 'universities'],
};
// Ordered challenges express the student's first and second priorities, not a psychological score.
export function buildPreview(a: Answers): Preview | null {
  if (!isComplete(a)) return null;
  const requested = a.challenges.filter(x => x !== 'start');
  const inferred: Focus = a.stage === 'requirements' ? 'subjects' : a.stage === 'documents' ? 'documents' : a.stage === 'universities' ? 'universities' : a.stage === 'direction' ? 'direction' : 'start';
  const focus: Focus = requested.find(() => true) ?? inferred;
  const includeStart = a.challenges.includes('start') && focus !== 'start';
  const secondary = requested.find(x => x !== focus) ?? (includeStart ? 'start' : null);
  const features = [...new Set([...featureMap[focus], ...(secondary ? featureMap[secondary] : [])])].filter(id => id !== 'grants' || a.program === 'kz' || a.regions.includes('kz'));
  return { focus, secondary, ib: a.program === 'ib', year: a.grade!, program: a.program!, regions: [...a.regions], interests: [...a.interests], features };
}
