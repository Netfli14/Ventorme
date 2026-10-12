/** Turn a native scroll position into progress in the 280svh intro scene. */
export function scrollProgress(sectionTop: number, sectionHeight: number, sceneHeight: number): number {
  const travel = Math.max(1, sectionHeight - sceneHeight);
  const progress = -sectionTop / travel;
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
}

/** Convert scroll progress into an accurate media seek target, without autoplay. */
export function scrollTime(progress: number, duration: number): number | null {
  if (!Number.isFinite(duration) || duration <= 0) return null;
  const fraction = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return Math.max(0, Math.min(duration - 0.001, duration * fraction));
}
