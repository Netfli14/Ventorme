import test from 'node:test';
import assert from 'node:assert/strict';
import { scrollProgress, scrollTime } from '../src/lib/video-scroll';

test('scroll position maps to a 280svh sticky scene', () => {
  assert.equal(scrollProgress(0, 280, 100), 0);
  assert.equal(scrollProgress(-90, 280, 100), 0.5);
  assert.equal(scrollProgress(-180, 280, 100), 1);
  assert.equal(scrollProgress(-999, 280, 100), 1);
  assert.equal(scrollProgress(999, 280, 100), 0);
});

test('scrolling up seeks backward and has no time-based playback', () => {
  const atSeventyFive = scrollTime(scrollProgress(-135, 280, 100), 6);
  const atTwentyFive = scrollTime(scrollProgress(-45, 280, 100), 6);
  assert.equal(atSeventyFive, 4.5);
  assert.equal(atTwentyFive, 1.5);
  assert.ok(atSeventyFive! > atTwentyFive!);
});

test('seek time is bounded and avoids the exact final frame', () => {
  assert.equal(scrollTime(-5, 6), 0);
  assert.equal(scrollTime(0.5, 6), 3);
  assert.ok(scrollTime(1, 6)! < 6);
  assert.equal(scrollTime(5, 6), scrollTime(1, 6));
  assert.equal(scrollTime(0.5, NaN), null);
  assert.equal(scrollTime(0.5, 0), null);
});

test('zero travel and non-finite input never produce invalid progress', () => {
  assert.equal(scrollProgress(-1, 100, 100), 1);
  assert.equal(scrollProgress(NaN, 280, 100), 0);
  assert.equal(scrollTime(NaN, 6), 0);
});
