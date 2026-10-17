import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync, randomBytes } from "node:crypto";
import { mkdtemp, rm, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { emptyRoute, makeRoute, validRoute, restoreRoute, routeFromAnswers, routeStepValid } from "../src/lib/route-model";
import { parseLead } from "../src/lib/lead-validation";
import { buildFunnel } from "../src/lib/funnel";
import { routeCopy } from "../src/lib/route-copy";
import { dictionaries, locales } from "../src/lib/i18n";
import { POST as leadPost } from "../src/app/api/leads/route";
import { POST as eventPost } from "../src/app/api/route-events/route";
import { GET as statsGet } from "../src/app/api/stats/route";
import {
  POST as login,
  DELETE as logout,
} from "../src/app/api/admin/session/route";
import { createSession, validSession } from "../src/lib/server-auth";

const id = "e1390d0f-64fb-4898-829b-2635410df42c",
  journeyId = "e1390d0f-64fb-4898-829b-2635410df42d";
const route = () => ({
  ...emptyRoute(),
  grade: "11" as const,
  interests: ["engineering"] as const,
  program: "ib" as const,
  ibStatus: "chosen" as const,
  stage: "requirements" as const,
  regions: ["uk"] as const,
  challenges: ["subjects", "exams"] as const,
  completed: true,
  a: ["mathAA", "physics", "chemistry"] as const,
});
const state = () => ({
  ...route(),
  interests: [...route().interests],
  a: [...route().a],
  regions: [...route().regions],
  challenges: [...route().challenges],
});
const input = () => ({
  id,
  journeyId,
  name: "Тест Қатысушы",
  email: "test@example.invalid",
  consent: true,
  locale: "ru",
  answers: state(),
  website: "",
});
const request = (
  endpoint: string,
  body: unknown,
  origin = "https://example.test",
  cookie = "",
) =>
  new Request(`https://example.test/api/${endpoint}/`, {
    method: "POST",
    headers: { origin, cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("six-question state validates context and both priorities affect the route", () => {
  const s = state();
  assert.equal(validRoute(s), true);
  assert.equal(validRoute({ ...s, a: ["mathAA", "mathAA"] }), false);
  assert.equal(
    validRoute({ ...s, interests: ["engineering", "unknown"] }),
    false,
  );
  assert.equal(validRoute({ ...s, grade: "" }), false);
  assert.match(makeRoute(s, "ru").title, /Предметы/);
  assert.notDeepEqual(
    makeRoute(s, "ru"),
    makeRoute({ ...s, challenges: ["direction"] }, "ru"),
  );
  assert.equal(makeRoute({ ...s, ib: false }, "ru").steps.length, 3);
  assert.equal(
    makeRoute({ ...s, grade: "12" }, "ru").steps[0].startsWith("В 12"),
    true,
  );
});
test("partial context, invalid options and duplicate priorities cannot produce a completed lead", () => {
  const s = state();
  for (const changes of [{program: ""}, {stage: ""}, {regions: []}, {challenges: []}, {challenges: ["subjects", "subjects"]}, {program: "fake"}, {regions: ["unknown", "uk"]}, {step: 6}, {program: "kz"}]) {
    assert.equal(validRoute({...s, ...changes}), false);
    assert.equal(parseLead({...input(), answers: {...s, ...changes}}), null);
  }
  assert.equal(validRoute({...s, program: "kz", ibStatus: ""}), true);
  for (let i=0;i<6;i++) assert.equal(routeStepValid(s, i), true);
  assert.equal(makeRoute(s, "ru").steps[2], dictionaries.ru.result.focus.exams.steps[0]);
  assert.notDeepEqual(makeRoute(s, "ru"), makeRoute({...s, challenges: ["exams", "subjects"]}, "ru"));
  assert.equal(makeRoute({...s, challenges: ["start"], stage: "universities"}, "ru").focus, "universities");
  assert.equal(makeRoute({...s, challenges: ["start", "exams"], stage: "universities"}, "ru").focus, "universities");
  assert.equal(makeRoute({...s, challenges: ["start", "exams"], stage: "universities"}, "ru").secondary, "exams");
  assert.ok(makeRoute({...s, interests: ["unknown"]}, "ru").features.includes("orientation"));
});
test("previous sessions retain known choices while new context stays unanswered", () => {
  const old = {grade: "11", interests: ["engineering"], challenge: "subjects", step: 2, completed: true, ib: true, field: "engineering", a: ["mathAA"], b: ["physics"], active: "b"};
  const migrated = restoreRoute(old)!;
  assert.equal(migrated.completed, false); assert.equal(migrated.step, 1);
  assert.deepEqual(migrated.a, old.a); assert.equal(migrated.grade, "11"); assert.equal(migrated.program, "");
  assert.deepEqual(migrated.challenges, ["subjects"]);
  assert.equal(restoreRoute({...old, a: ["fake"]}), null);
  const six = routeFromAnswers({grade: "12", program: "kz", stage: "documents", regions: ["kz"], interests: ["science"], challenges: ["funding"]}, 5);
  assert.equal(validRoute(six), true); assert.equal(six.completed, true); assert.equal(six.ib, false);
  assert.ok(makeRoute(six, "ru").features.includes("grants"));
  assert.ok(!makeRoute({...six, program: "other", regions: ["uk"]}, "ru").features.includes("grants"));
});
test("lead schema requires consent and strips arbitrary client fields from stored answers", () => {
  assert.equal(parseLead({ ...input(), consent: false }), null);
  assert.equal(parseLead({ ...input(), email: "bad" }), null);
  assert.equal(parseLead({ ...input(), website: "bot" }), null);
  assert.equal(
    parseLead({ ...input(), answers: { ...state(), completed: false } }),
    null,
  );
  const parsed = parseLead({
    ...input(),
    answers: { ...state(), secret: "must not persist" },
  });
  assert.ok(parsed);
  assert.equal("secret" in parsed.answers, false);
});
test("six locale packs contain full route copy, subject labels and quiz options", () => {
  for (const l of locales) {
    const c = routeCopy[l];
    assert.deepEqual(Object.keys(c).sort(), Object.keys(routeCopy.ru).sort());
    assert.equal(c.questions.length, 6);
    assert.equal(c.quizTopics.length, 6);
    assert.equal(c.challenges.length, 7);
    assert.equal(c.subjects.length, 12);
    assert.equal(c.faqs.length, 4);
    for (const v of Object.values(c))
      assert.ok(typeof v === "string" ? v.trim() : v.length);
  }
});
test("funnel conversions use intersecting journey IDs and independent post-result branches", () => {
  const f = buildFunnel(
    [
      `route-events/quiz_start/${id}.json`,
      `route-events/quiz_complete/${id}.json`,
      `route-events/result_view/${id}.json`,
      `route-events/registration_click/${journeyId}.json`,
    ],
    [id],
  );
  assert.equal(f.conversions.startToComplete.rate, 100);
  assert.equal(f.conversions.resultToLead.rate, 100);
  assert.equal(f.conversions.resultToRegistrationClick.rate, 0);
  assert.equal(f.counts.registration_click, 1);
  assert.equal(buildFunnel([], []).conversions.resultToLead.rate, null);
});
test("real server flow: consent → private immutable storage → authenticated panel, no public leak", async () => {
  const keys = [
      "VENTORME_LOCAL_DATA_DIR",
      "VENTORME_ADMIN_PASSWORD_HASH",
      "VENTORME_SESSION_SECRET",
      "VERCEL",
    ] as const,
    previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const root = await mkdtemp(path.join(tmpdir(), "ventorme-test-"));
  const salt = randomBytes(16).toString("hex");
  delete process.env.VERCEL;
  process.env.VENTORME_LOCAL_DATA_DIR = root;
  process.env.VENTORME_ADMIN_PASSWORD_HASH = `scrypt:${salt}:${scryptSync("test-admin-password", salt, 64).toString("hex")}`;
  process.env.VENTORME_SESSION_SECRET = randomBytes(48).toString("hex");
  try {
    assert.equal(
      (await statsGet(new Request("https://example.test/api/stats/"))).status,
      401,
    );
    assert.equal(
      (await leadPost(request("leads", input(), "https://evil.test"))).status,
      403,
    );
    assert.equal(
      (await leadPost(request("leads", { ...input(), consent: false }))).status,
      400,
    );
    for (const event of [
      "quiz_start",
      "quiz_complete",
      "result_view",
      "route_download",
      "registration_click",
    ]) {
      assert.equal(
        (await eventPost(request("route-events", { event, journeyId }))).status,
        204,
      );
    }
    assert.equal(
      (
        await eventPost(
          request("route-events", {
            event: "quiz_start",
            journeyId,
            email: "no@example.test",
          }),
        )
      ).status,
      400,
    );
    assert.equal((await leadPost(request("leads", input()))).status, 201);
    assert.equal((await leadPost(request("leads", input()))).status, 201);
    assert.equal((await readdir(path.join(root, "leads"))).length, 1);
    assert.equal(
      (await login(request("admin/session", { password: "wrong" }))).status,
      401,
    );
    const auth = await login(
      request("admin/session", { password: "test-admin-password" }),
    );
    assert.equal(auth.status, 200);
    const cookie = auth.headers.get("Set-Cookie")!.split(";")[0];
    assert.match(auth.headers.get("Set-Cookie")!, /HttpOnly/);
    assert.match(auth.headers.get("Set-Cookie")!, /Secure/);
    const res = await statsGet(
      new Request("https://example.test/api/stats/", { headers: { cookie } }),
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    const data = await res.json();
    assert.equal(data.totalLeads, 1);
    assert.equal(data.leads[0].name, "Тест Қатысушы");
    assert.deepEqual(data.leads[0].answers, state());
    assert.equal(data.leads[0].source, "team-004");
    assert.equal(data.leads[0].route.steps.length, 3);
    const historicalId = "e1390d0f-64fb-4898-829b-2635410df430";
    const historical = {...input(), id: historicalId, source: "team-004", createdAt: new Date().toISOString(),
      consentVersion: "team004-route-v1", route: {title: "Прежний сохранённый маршрут", summary: "Прежний план", steps: ["Один", "Два", "Три"], features: []},
      answers: {grade: "10", interests: ["science"], challenge: "requirements", step: 2, completed: true, ib: false, field: "science", a: [], b: [], active: "a"}};
    await writeFile(path.join(root, "leads", historicalId + ".json"), JSON.stringify(historical));
    const history = await (await statsGet(new Request("https://example.test/api/stats/", {headers: {cookie}}))).json();
    const restored = history.leads.find((lead: {id: string}) => lead.id === historicalId);
    assert.equal(restored.answers.program, "");
    assert.deepEqual(restored.answers.challenges, ["universities"]);
    assert.equal(restored.route.title, historical.route.title);
    assert.equal(data.funnel.counts.quiz_start, 1);
    assert.equal(data.funnel.conversions.resultToLead.rate, 100);
    assert.equal(data.confirmedRegistrations, null);
    const session = createSession();
    assert.ok(validSession(session));
    assert.ok(!validSession(`${session}x`));
    assert.ok(!validSession(session, Date.now() + 9 * 3600000));
    assert.equal((await logout(request("admin/session", {}))).status, 204);
    delete process.env.VENTORME_ADMIN_PASSWORD_HASH;
    assert.equal(
      (
        await leadPost(
          request("leads", { ...input(), id: crypto.randomUUID() }),
        )
      ).status,
      503,
    );
  } finally {
    for (const k of keys) {
      if (previous[k] === undefined) delete process.env[k];
      else process.env[k] = previous[k];
    }
    await rm(root, { recursive: true, force: true });
  }
});
