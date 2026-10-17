import { dictionaries, type Locale } from "./i18n";
import { routeCopy } from "./route-copy";
export const interests = [
  "engineering",
  "science",
  "health",
  "it",
  "business",
  "humanities",
  "art",
  "unknown",
] as const;
export const challenges = [
  "direction",
  "subjects",
  "requirements",
  "plan",
] as const;
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
  grade: "" | "10" | "11" | "12";
  interests: (typeof interests)[number][];
  challenge: "" | (typeof challenges)[number];
  step: number;
  completed: boolean;
  ib: boolean;
  field: (typeof interests)[number];
  a: Subject[];
  b: Subject[];
  active: "a" | "b";
};
export const emptyRoute = (): RouteState => ({
  grade: "",
  interests: [],
  challenge: "",
  step: 0,
  completed: false,
  ib: true,
  field: "engineering",
  a: [],
  b: [],
  active: "a",
});
export function validRoute(x: unknown): x is RouteState {
  if (!x || typeof x !== "object") return false;
  const s = x as RouteState;
  const set = (
    a: unknown,
    values: readonly string[],
    max: number,
  ): a is string[] =>
    Array.isArray(a) &&
    a.length <= max &&
    new Set(a).size === a.length &&
    a.every((v) => values.includes(v));
  return (
    ["", "10", "11", "12"].includes(s.grade) &&
    set(s.interests, interests, 8) &&
    !(s.interests.includes("unknown") && s.interests.length > 1) &&
    ["", ...challenges].includes(s.challenge) &&
    Number.isInteger(s.step) &&
    s.step >= 0 &&
    s.step <= 2 &&
    typeof s.completed === "boolean" &&
    typeof s.ib === "boolean" &&
    interests.includes(s.field) &&
    set(s.a, subjects, 3) &&
    set(s.b, subjects, 3) &&
    ["a", "b"].includes(s.active) &&
    (!s.completed || Boolean(s.grade && s.interests.length && s.challenge))
  );
}
export function routeFocus(s: RouteState) {
  return s.interests.includes("unknown") || s.challenge === "direction"
    ? "direction"
    : s.challenge === "subjects"
      ? "subjects"
      : s.challenge === "requirements"
        ? "universities"
        : "start";
}
export function makeRoute(s: RouteState, locale: Locale) {
  const d = dictionaries[locale],
    focus = routeFocus(s),
    c = routeCopy[locale];
  const steps = [
    ...(focus === "start" && s.challenge === "plan"
      ? c.planSteps
      : s.ib && focus === "subjects"
        ? d.result.ibSteps
        : d.result.focus[focus].steps),
  ];
  if (s.grade === "12") steps[0] = `${d.result.years["12"]} ${steps[0]}`;
  return {
    title:
      focus === "start" && s.challenge === "plan"
        ? c.featureTitles[2]
        : d.result.focus[focus].title,
    summary:
      `${s.grade ? d.result.years[s.grade] : ""} ${focus === "start" && s.challenge === "plan" ? c.featureTexts[2] : d.result.focus[focus].why}`.trim(),
    steps,
    features:
      focus === "direction"
        ? ["orientation", "universities"]
        : focus === "start"
          ? ["universities", "exams"]
          : ["universities", "venti"],
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
