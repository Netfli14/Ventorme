import { dictionaries, type Locale } from "./i18n";
import { options, questionIds, limits, isStepValid, isComplete, buildPreview, type Answers, type Grade, type Program, type Stage, type Region, type Challenge } from "./quiz";
export const interests = options.interests;
export const challenges = options.challenges;
export { questionIds };
export const subjects = [
  "mathAA",
  "mathAI",
  "physics",
  "chemistry",
  "biology",
  "cs",
  "economics",
  "history",
  "psychology",
  "english",
  "literature",
  "art",
] as const;
export type Subject = (typeof subjects)[number];
export type RouteState = {
  grade: "" | Grade;
  program: "" | Program;
  ibStatus: "" | typeof options.ibStatus[number];
  stage: "" | Stage;
  regions: Region[];
  interests: typeof interests[number][];
  challenges: Challenge[];
  step: number;
  completed: boolean;
  ib: boolean;
  field: typeof interests[number];
  a: Subject[];
  b: Subject[];
  active: "a" | "b";
};
export const emptyRoute = (): RouteState => ({
  grade: "", program: "", ibStatus: "", stage: "", regions: [], interests: [], challenges: [],
  step: 0, completed: false, ib: true, field: "engineering", a: [], b: [], active: "a",
});
export function routeAnswers(s: RouteState): Answers {
  return {grade: s.grade || undefined, program: s.program || undefined,
    ibStatus: s.program === "ib" ? s.ibStatus || undefined : undefined,
    stage: s.stage || undefined, regions: s.regions, interests: s.interests, challenges: s.challenges};
}
export const routeStepValid = (s: RouteState, step: number) => isStepValid(routeAnswers(s), step);
const validSet = (a: unknown, values: readonly string[], max: number): a is string[] =>
  Array.isArray(a) && a.length <= max && new Set(a).size === a.length && a.every(v => values.includes(v));
export function validRoute(x: unknown): x is RouteState {
  if (!x || typeof x !== "object") return false;
  const s = x as RouteState;
  return ["", ...options.grade].includes(s.grade)
    && ["", ...options.program].includes(s.program)
    && ["", ...options.stage].includes(s.stage)
    && ["", ...options.ibStatus].includes(s.ibStatus)
    && (s.program === "ib" || s.ibStatus === "")
    && validSet(s.regions, options.regions, limits.regions)
    && !(s.regions.includes("unknown") && s.regions.length > 1)
    && validSet(s.interests, interests, limits.interests)
    && !(s.interests.includes("unknown") && s.interests.length > 1)
    && validSet(s.challenges, challenges, limits.challenges)
    && Number.isInteger(s.step) && s.step >= 0 && s.step < questionIds.length
    && typeof s.completed === "boolean" && typeof s.ib === "boolean"
    && interests.includes(s.field) && validSet(s.a, subjects, 3) && validSet(s.b, subjects, 3)
    && ["a", "b"].includes(s.active) && (!s.completed || isComplete(routeAnswers(s)));
}
export function routeFromAnswers(a: Answers, step = 0): RouteState {
  return {...emptyRoute(), grade: a.grade || "", program: a.program || "", stage: a.stage || "",
    ibStatus: a.program === "ib" ? a.ibStatus || "" : "", regions: [...a.regions], interests: [...a.interests],
    challenges: [...a.challenges], step, completed: isComplete(a), ib: a.program === "ib",
    field: a.interests.find(i => i !== "unknown") || "engineering"};
}
// Migrate the former three-question session without inventing missing answers.
// Also used to display historical leads; their stored route stays unchanged.
export function restoreRoute(x: unknown): RouteState | null {
  if (validRoute(x)) return x;
  if (!x || typeof x !== "object") return null;
  const s = x as Record<string, unknown>;
  if (!["", ...options.grade].includes(s.grade as string)
    || !validSet(s.interests, interests, 8)
    || (s.interests.includes("unknown") && s.interests.length > 1)
    || !["", "direction", "subjects", "requirements", "plan"].includes(s.challenge as string)
    || typeof s.ib !== "boolean" || typeof s.completed !== "boolean"
    || !Number.isInteger(s.step) || Number(s.step) < 0 || Number(s.step) > 2
    || !interests.includes(s.field as typeof interests[number])
    || !validSet(s.a, subjects, 3) || !validSet(s.b, subjects, 3) || !["a", "b"].includes(s.active as string)) return null;
  const challenge = s.challenge === "requirements" ? "universities" : s.challenge === "plan" ? "start" : s.challenge;
  return {...emptyRoute(), grade: s.grade as RouteState["grade"], interests: s.interests.slice(0, 3) as RouteState["interests"],
    challenges: challenge ? [challenge as Challenge] : [], ib: s.ib, field: s.field as RouteState["field"],
    a: [...s.a] as Subject[], b: [...s.b] as Subject[], active: s.active as "a" | "b", step: s.grade ? 1 : 0};
}
export function routeFocus(s: RouteState) {
  return buildPreview(routeAnswers(s))?.focus || "start";
}
export function makeRoute(s: RouteState, locale: Locale) {
  const d = dictionaries[locale], preview = buildPreview(routeAnswers(s));
  const exploring = s.interests.includes("unknown");
  const focus = preview?.focus === "start" && exploring ? "direction" : preview?.focus || "start";
  const secondary = preview?.secondary || (exploring && focus !== "direction" ? "direction" : null);
  const steps = [...(s.program === "ib" && focus === "subjects" ? d.result.ibSteps : d.result.focus[focus].steps)];
  if (secondary) steps[2] = d.result.focus[secondary].steps[0];
  if (s.grade === "12") steps[0] = `${d.result.years["12"]} ${steps[0]}`;
  return {
    title: d.result.focus[focus].title,
    summary: [s.grade ? d.result.years[s.grade] : "", d.result.focus[focus].why,
      secondary ? d.result.focus[secondary].why : ""].filter(Boolean).join(" "),
    steps, features: [...new Set([...(preview?.features || []), ...(exploring ? ["orientation"] : [])])], focus, secondary,
  };
}
export const eventNames = [
  "quiz_start",
  "quiz_complete",
  "result_view",
  "route_download",
  "registration_click",
] as const;
export type RouteEvent = (typeof eventNames)[number];
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
