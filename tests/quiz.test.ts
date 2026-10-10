import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPreview, emptyAnswers, isComplete, isStepValid, toggleChoice, type Answers } from '../src/lib/quiz';
import { dictionaries, locales, localizePath } from '../src/lib/i18n';
import { localizedSteps } from '../src/lib/result';
import { registrationUrl } from '../src/lib/config';
import { initialState, parseState, readState, writeState, clearState, QUIZ_KEY, type StorageLike } from '../src/lib/storage';

const complete = (patch: Partial<Answers> = {}): Answers => ({ grade: '11', program: 'kz', stage: 'direction', regions: ['kz'], interests: ['engineering'], challenges: ['direction'], ...patch });
test('six questions require an answer and optional IB status is optional', () => {
  assert.equal(isComplete(emptyAnswers()), false);
  for (let i = 0; i < 6; i++) assert.equal(isStepValid(complete(), i), true);
  assert.equal(isComplete(complete({ program: 'ib' })), true);
  assert.equal(buildPreview(emptyAnswers()), null);
  assert.equal(isStepValid(complete(), 6), false);
});
test('choice limits, deselection and mutually exclusive undecided answers', () => {
  assert.deepEqual(toggleChoice(['kz', 'uk', 'asia'], 'europe', 3, 'unknown'), { values: ['kz', 'uk', 'asia'], limited: true });
  assert.deepEqual(toggleChoice(['kz', 'uk'], 'unknown', 3, 'unknown').values, ['unknown']);
  assert.deepEqual(toggleChoice(['unknown'], 'uk', 3, 'unknown').values, ['uk']);
  assert.deepEqual(toggleChoice(['kz', 'uk'], 'kz', 3, 'unknown').values, ['uk']);
  assert.equal(toggleChoice(['subjects', 'funding'], 'exams', 2).limited, true);
});
test('different priorities produce different real actions and deterministic results', () => {
  const a = buildPreview(complete())!;
  const b = buildPreview(complete({ program: 'ib', stage: 'requirements', regions: ['uk'], challenges: ['subjects'] }))!;
  const c = buildPreview(complete({ challenges: ['funding'] }))!;
  assert.deepEqual(a, buildPreview(complete()));
  const steps = [a, b, c].map(p => localizedSteps(p, dictionaries.ru));
  assert.equal(new Set(steps.map(s => s.join('|'))).size, 3);
  assert.match(steps[1].join(' '), /HL\/SL/);
  for (const s of steps) assert.equal(s.length, 3);
});
test('both priorities, year, region, interests and universal programs survive in the result', () => {
  const p = buildPreview(complete({ grade: '12', program: 'unknown', regions: ['turkey'], interests: ['art'], challenges: ['documents', 'funding'] }))!;
  assert.equal(p.focus, 'documents'); assert.equal(p.secondary, 'funding');
  assert.deepEqual(p.regions, ['turkey']); assert.deepEqual(p.interests, ['art']);
  assert.equal(p.program, 'unknown'); assert.equal(p.ib, false);
  assert.ok(localizedSteps(p, dictionaries.ru)[0].startsWith(dictionaries.ru.result.years['12']));
  assert.ok(!p.features.includes('grants'));
  assert.ok(buildPreview(complete({ challenges: ['funding'] }))!.features.includes('grants'));
  assert.equal(buildPreview(complete({ stage: 'universities', challenges: ['start'] }))!.focus, 'universities');
});
test('changing one answer updates the result without mutating the previous answers', () => {
  const a = complete({ challenges: ['subjects', 'exams'] }); const before = structuredClone(a);
  const first = buildPreview(a)!; const second = buildPreview({ ...a, challenges: ['exams', 'subjects'] })!;
  assert.equal(first.focus, 'subjects'); assert.equal(second.focus, 'exams');
  assert.deepEqual(a, before);
});
test('one official registration URL preserves leading zeros and contains no answers', () => {
  const url = new URL(registrationUrl('0042')!);
  assert.equal(url.origin + url.pathname, 'https://ventorme.ai/register');
  assert.equal(url.searchParams.get('utm_source'), 'hacknext');
  assert.equal(url.searchParams.get('utm_campaign'), 'team-0042');
  assert.deepEqual([...url.searchParams.keys()].sort(), ['utm_campaign', 'utm_source']);
  for (const v of [undefined, '', 'team-42', ' 42', '42&email=a', '42.0']) assert.equal(registrationUrl(v), null);
});
test('same-tab storage restores answers and current step, reset removes them', () => {
  const data = new Map<string, string>(); const storage: StorageLike = { getItem: k => data.get(k) ?? null, setItem: (k,v) => { data.set(k,v); }, removeItem: k => { data.delete(k); } };
  const state = { version: 1 as const, step: 4, answers: complete({ program: 'ib', ibStatus: 'choosing' }) };
  assert.equal(writeState(state, storage), true); assert.deepEqual(readState(storage), state);
  clearState(storage); assert.equal(data.has(QUIZ_KEY), false); assert.equal(readState(storage), null);
});
test('corrupt, untrusted and unavailable storage cannot crash the quiz', () => {
  const state = initialState();
  for (const raw of ['{', 'null', JSON.stringify({ ...state, version: 2 }), JSON.stringify({ ...state, step: 999 }), JSON.stringify({ ...state, answers: { ...state.answers, regions: ['kz', 'unknown'] } }), JSON.stringify({ ...state, answers: { ...state.answers, challenges: ['fake'] } })]) assert.equal(parseState(raw), null);
  const throwing: StorageLike = { getItem(){throw Error('blocked');}, setItem(){throw Error('quota');}, removeItem(){throw Error('blocked');} };
  assert.equal(readState(throwing), null); assert.equal(writeState(state, throwing), false); assert.doesNotThrow(() => clearState(throwing));
  assert.equal(writeState(state), false);
  const sanitized = parseState(JSON.stringify({ ...state, answers: { ...state.answers, email: 'private@example.invalid', name: 'private' } }))!;
  assert.deepEqual(sanitized, state);
});
test('locale switching preserves the route, stable option IDs, answers and step', () => {
  const state = { version: 1 as const, step: 3, answers: complete({ program: 'ib', ibStatus: 'chosen', regions: ['uk', 'europe'] }) };
  const serialized = JSON.stringify(state);
  for (const locale of locales) {
    assert.equal(localizePath('/ru/quiz/', locale), `/${locale}/quiz/`);
    assert.deepEqual(parseState(serialized), state);
    assert.equal(localizedSteps(buildPreview(state.answers)!, dictionaries[locale]).length, 3);
  }
  assert.equal(localizePath('/kk/result/', 'zh'), '/zh/result/');
});
test('all six dictionaries contain every text and matching interpolation placeholders', () => {
  function paths(value: unknown, prefix = ''): Record<string,string> {
    if (typeof value === 'string') return { [prefix]: value };
    return Object.assign({}, ...Object.entries(value as object).map(([k,v]) => paths(v, `${prefix}.${k}`)));
  }
  const source = paths(dictionaries.ru);
  for (const locale of locales) {
    const target = paths(dictionaries[locale]); assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort());
    for (const [key,text] of Object.entries(target)) {
      assert.ok(text.trim(), `${locale}${key}`);
      assert.deepEqual((text.match(/\{\w+\}/g) ?? []).sort(), (source[key].match(/\{\w+\}/g) ?? []).sort(), `${locale}${key}`);
    }
  }
});
