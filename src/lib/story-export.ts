import type {Locale} from "./i18n";
import {storyCopy} from "./story-copy";
import {storyInterests,storyTaskOrder,type StoryState,type Criterion,type FirstTask} from "./story-model";
const criteria: Criterion[] = ["programme","budget","country"];
const taskIds: FirstTask[] = ["direction","requirements","finance"];
export function storyText(state: StoryState, locale: Locale) {
  const c=storyCopy[locale], order=storyTaskOrder(state.firstTask);
  return [c.demo, c.resultTitle, `${c.yourChoices}: ${state.interests.map(x=>c.interests[storyInterests.indexOf(x)]).join(', ')}; ${c.criteria[criteria.indexOf(state.criterion as Criterion)] || ''}; ${c.firstTasks[taskIds.indexOf(state.firstTask as FirstTask)] || ''}`, c.criteriaEffect[criteria.indexOf(state.criterion as Criterion)] || '', ...order.map((x,i)=>`${i+1}. ${c.actions[taskIds.indexOf(x)]}`), `${c.continue}: ${c.tools.join(' · ')}`, c.transition].join('\n\n');
}

export async function copyStoryText(text: string, clipboard?: {writeText: (value: string) => Promise<void>}): Promise<'done'|'error'> {
  try { if (!clipboard?.writeText) return 'error'; await clipboard.writeText(text); return 'done'; } catch { return 'error'; }
}
