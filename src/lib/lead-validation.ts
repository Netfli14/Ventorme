import { isLocale, type Locale } from "./i18n";
import { validRoute, uuidPattern, type RouteState } from "./route-model";
export type LeadInput = {
  id: string;
  journeyId: string;
  name: string;
  email: string;
  consent: true;
  locale: Locale;
  answers: RouteState;
};
export function parseLead(value: unknown): LeadInput | null {
  if (!value || typeof value !== "object") return null;
  const x = value as Record<string, unknown>;
  if (
    Object.keys(x).some(
      (k) =>
        ![
          "id",
          "journeyId",
          "name",
          "email",
          "consent",
          "locale",
          "answers",
          "website",
        ].includes(k),
    ) ||
    x.website
  )
    return null;
  if (
    typeof x.id !== "string" ||
    !uuidPattern.test(x.id) ||
    typeof x.journeyId !== "string" ||
    !uuidPattern.test(x.journeyId) ||
    x.consent !== true ||
    typeof x.locale !== "string" ||
    !isLocale(x.locale)
  )
    return null;
  if (
    typeof x.name !== "string" ||
    !x.name.trim() ||
    x.name.trim().length > 80 ||
    /[\x00-\x1f\x7f]/.test(x.name)
  )
    return null;
  if (
    typeof x.email !== "string" ||
    x.email.length > 254 ||
    !/^\S+@[^\s@]+\.[^\s@]+$/.test(x.email) ||
    /[\x00-\x1f\x7f]/.test(x.email)
  )
    return null;
  if (!validRoute(x.answers) || !x.answers.completed) return null;
  // Reconstruct only known fields. Never persist arbitrary client properties.
  const a = x.answers;
  const answers: RouteState = {
    grade: a.grade,
    program: a.program,
    ibStatus: a.ibStatus,
    stage: a.stage,
    regions: [...a.regions],
    interests: [...a.interests],
    challenges: [...a.challenges],
    step: a.step,
    completed: true,
    ib: a.ib,
    field: a.field,
    a: [...a.a],
    b: [...a.b],
    active: a.active,
  };
  return {
    id: x.id.toLowerCase(),
    journeyId: x.journeyId.toLowerCase(),
    name: x.name.trim(),
    email: x.email.trim().toLowerCase(),
    consent: true,
    locale: x.locale,
    answers,
  };
}
