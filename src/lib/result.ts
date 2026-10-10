import type { Dictionary } from './i18n';
import type { Preview } from './quiz';
export function localizedSteps(preview: Preview, d: Dictionary): string[] {
  const steps = preview.ib && preview.focus === 'subjects' ? [...d.result.ibSteps] : [...d.result.focus[preview.focus].steps];
  if (preview.year === '12') steps[0] = `${d.result.years['12']} ${steps[0]}`;
  return steps;
}
