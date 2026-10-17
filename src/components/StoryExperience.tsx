'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, RotateCcw, Sparkles, Compass, CalendarDays, BookOpen, Wallet, FileCheck2, GraduationCap, LockKeyhole} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {storyCopy} from '@/lib/story-copy';
import {storyText, copyStoryText} from '@/lib/story-export';
import {STORY_OPEN_STEPS, STORY_RESULT_STEP, storyInterests, emptyStory, restoreStory, toggleStoryInterest, canAdvanceStory, moveStory, storyTaskOrder, type StoryState, type Criterion, type FirstTask} from '@/lib/story-model';
import {RegistrationButton} from './Actions';
import {useRoute} from './RouteProvider';
import styles from './StoryExperience.module.css';
const criteria: Criterion[] = ['programme','budget','country'];
const taskIds: FirstTask[] = ['direction','requirements','finance'];
const icons = [Compass, GraduationCap, CalendarDays, BookOpen, Sparkles, Wallet, FileCheck2];
const storyKey = 'ventorme.story.v1';
export function StoryExperience({locale}: {locale:Locale}) {
  const c=storyCopy[locale], {track}=useRoute();
  const [state,setState]=useState(emptyStory), [ready,setReady]=useState(false);
  const [copy,setCopy]=useState<'idle'|'done'|'error'>('idle');
  const heading=useRef<HTMLHeadingElement>(null), moved=useRef(false);
  useEffect(()=>{try{const saved=restoreStory(JSON.parse(sessionStorage.getItem(storyKey)||'null'));if(saved)setState(saved);}catch{} setReady(true);},[]);
  useEffect(()=>{if(ready)try{sessionStorage.setItem(storyKey,JSON.stringify(state));}catch{}},[ready,state]);
  useEffect(()=>{if(moved.current){heading.current?.focus({preventScroll:true}); const rect=heading.current?.getBoundingClientRect();if(rect&&(rect.top<100||rect.bottom>innerHeight-80)) heading.current?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}},[state.step]);
  const order=storyTaskOrder(state.firstTask), criterion=criteria.indexOf(state.criterion as Criterion), complete=state.step===STORY_RESULT_STEP;
  function navigate(step:number){const next=moveStory(state,step);if(next===state)return;moved.current=true;setCopy('idle');setState(next);track('story_start');if(step===STORY_RESULT_STEP)track('story_complete');else track(`story_step_${step+1}` as Parameters<typeof track>[0]);}
  function interest(value: typeof storyInterests[number]) {setState(s=>{const next=toggleStoryInterest(s,value);return next.interests.length<2?{...next,furthest:0}:next;});track('story_start');track('story_step_1');setCopy('idle');}
  async function copyRoute(){setCopy(await copyStoryText(storyText(state,locale),navigator.clipboard));}
  function restart(){moved.current=true;setState(emptyStory());setCopy('idle');}
  const tool=(index:number)=><aside className={styles.tool}><span>{c.continue}<ArrowUpRight size={15}/></span><h4>{c.tools[index]}</h4><p>{c.toolActions[index]}</p><small>{c.toolNote}</small></aside>;
  return <section className={`${styles.story} container`} id="story" aria-labelledby="story-heading">
    <div className={styles.intro}><div><p className={styles.kicker}>01 / {c.demo}</p><h2 id="story-heading">{c.titleStory}<span aria-hidden="true">↗</span></h2></div><div><p>{c.intro}</p><small>{c.boundary}</small></div></div>
    <div className={`${styles.board} ${state.interests.length===2?styles.assembled:''}`} aria-label={c.titleStory}>
      <div className={styles.boardTop}><span>VENTORME / <span>{c.demo}</span></span><span>{complete?'03':`0${state.step+1}`} / 03</span></div>
      <ol className={styles.nodes}>
        {c.labels.map((label,i)=>{const Icon=icons[i];return <li key={i} className={`${styles.node} ${i<state.furthest?styles.connected:''}`} style={{'--tilt':`${[-6,5,-3,6,-5,4,-4][i]}deg`,'--offset':`${[7,-9,12,-4,-5,7,1][i]}px`} as CSSProperties}>
          <button type="button" disabled={i>=STORY_OPEN_STEPS || i>state.furthest} onClick={()=>navigate(i)} aria-current={!complete && state.step===i?'step':undefined} aria-label={`${i+1}. ${label}${i>=STORY_OPEN_STEPS?`: ${c.locked}`:""}`} title={i>=STORY_OPEN_STEPS?c.unlockText:undefined}><span className={styles.nodeIcon}>{i>=STORY_OPEN_STEPS?<LockKeyhole size={18}/>:i<state.furthest?<Check size={18}/>:<Icon size={18}/>}</span><span><small>0{i+1}</small>{label}</span></button>
        </li>})}
      </ol>
    </div>
    <div className={styles.workspace}>
      <div className={styles.stageHeader}><div><span className={styles.badge}>{c.demo}</span><span className={styles.progressText}>{c.step} {complete?3:state.step+1} / 3</span></div><RegistrationButton locale={locale}/></div>
      <div className={styles.progress} role="progressbar" aria-label={c.titleStory} aria-valuenow={complete?3:state.step} aria-valuemin={0} aria-valuemax={3}><span style={{transform:`scaleX(${complete?1:state.step/3})`}}/></div>
      <div className={styles.stage} key={state.step}>
        <div className={styles.stageHeading}><p className={styles.kicker}>{complete?'03 / 03':`0${state.step+1}`} — {c.titleStory}</p><h3 ref={heading} tabIndex={-1}>{complete?c.resultTitle:c.titles[state.step]}</h3>{!complete&&<p>{c.tasks[state.step]}</p>}</div>
        {!complete?<div className={styles.stageLayout}><div className={styles.demo}>
          {state.step===0&&<><fieldset><legend>{c.selectTwo}</legend><div className={styles.choices}>{storyInterests.map((id,i)=><label key={id} className={state.interests.includes(id)?styles.chosen:''}><input type="checkbox" checked={state.interests.includes(id)} disabled={!state.interests.includes(id)&&state.interests.length===2} onChange={()=>interest(id)}/><span>{c.interests[i]}</span><span>{state.interests.includes(id)?<Check size={16}/>:<span aria-hidden="true">+</span>}</span></label>)}</div></fieldset><p className={styles.status} aria-live="polite">{c.selected}: {state.interests.length} / 2</p>{state.interests.length>0&&<div className={styles.research} aria-live="polite"><h4>{c.researchTitle}</h4>{state.interests.map(id=><p key={id}><ArrowUpRight size={16}/>{c.research[storyInterests.indexOf(id)]}</p>)}</div>}<small>{c.orientationNote}</small></>}
          {state.step===1&&<><fieldset><legend>{c.titles[1]}</legend><div className={styles.criteria}>{criteria.map((id,i)=><label key={id} className={state.criterion===id?styles.chosen:''}><input type="radio" name="story-criterion" checked={state.criterion===id} onChange={()=>{setState(s=>({...s,criterion:id}));setCopy('idle');}}/>{c.criteria[i]}{state.criterion===id&&<Check size={16}/>}</label>)}</div></fieldset><p className={styles.status} aria-live="polite">{criterion>=0?c.criteriaEffect[criterion]:c.tasks[1]}</p><div className={styles.tableWrap}><table><caption>{c.compareLabel}</caption><thead><tr><th scope="col">{c.criteria[0]}</th>{c.compareColumns.map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{(criterion<0?[0,1,2]:[criterion,...[0,1,2].filter(x=>x!==criterion)]).map((row,i)=><tr key={row} className={i===0&&criterion>=0?styles.priority:''}><th scope="row">{i===0&&criterion>=0&&<small>{c.priority} ↗</small>}{c.criteria[row]}</th>{c.compareRows[row].map((x,i)=><td key={i}>{x}</td>)}</tr>)}</tbody></table></div></>}
          {state.step===2&&<><fieldset><legend>{c.titles[2]}</legend><div className={styles.taskChoices}>{taskIds.map((id,i)=><label key={id} className={state.firstTask===id?styles.chosen:''}><input type="radio" name="story-first-task" checked={state.firstTask===id} onChange={()=>setState(s=>({...s,firstTask:id}))}/><span>{c.firstTasks[i]}</span>{state.firstTask===id?<Check size={17}/>:<ArrowUpRight size={17}/>}</label>)}</div></fieldset><p className={styles.caption}>{c.calendar}</p><ol className={styles.tracker}>{order.map((id,i)=><li key={id}><span className={styles.date}><CalendarDays size={17}/>{c.when[i]}</span><span>{c.actions[taskIds.indexOf(id)]}</span></li>)}</ol></>}
        </div>{tool(state.step)}</div>:<div className={styles.result}>
          <div className={styles.resultChoices}><h4>{c.yourChoices}</h4><dl><div><dt>{c.labels[0]}</dt><dd>{state.interests.map(id=>c.interests[storyInterests.indexOf(id)]).join(' + ')}</dd></div><div><dt>{c.labels[1]}</dt><dd>{c.priority}: {c.criteria[criterion]}</dd></div><div><dt>{c.effectFirst}</dt><dd>{c.firstTasks[taskIds.indexOf(state.firstTask as FirstTask)]}</dd></div></dl><h4>{c.effectTitle}</h4><p>{c.criteriaEffect[criterion]}</p>{state.interests.map(id=><p key={id} className={styles.resultResearch}>{c.research[storyInterests.indexOf(id)]}</p>)}</div>
          <div><h4>{c.nextActions}</h4><ol className={styles.actionList}>{order.map((id,i)=><li key={id}><span>0{i+1}</span><p>{c.actions[taskIds.indexOf(id)]}</p></li>)}</ol><h4>{c.continue}</h4><div className={styles.toolTags}>{[...new Set([state.firstTask==='direction'?0:state.firstTask==='finance'?5:1,2,criterion===1?5:1])].map(i=><span key={i}>{c.tools[i]}</span>)}</div></div>
        </div>}
      </div>
      <div className={styles.mascot}><img src="/media/ventorme-mascot-poster.jpg" alt="" width="48" height="48"/><p key={state.step}>{c.mascot[complete?7:state.step]}</p></div>
      {!complete?<div className={styles.navigation}><button type="button" className="text-button" disabled={state.step===0} onClick={()=>navigate(state.step-1)}><ArrowLeft size={17}/>{c.back}</button><button type="button" className="button button-primary" disabled={!canAdvanceStory(state)} onClick={()=>navigate(state.step+1)}>{state.step===2?c.finish:c.next}<ArrowRight size={18}/></button></div>:<div className={styles.resultFooter}><p>{c.transition}</p><div className={styles.resultButtons}><button type="button" className="button button-outline" onClick={copyRoute}><Copy size={17}/>{c.copy}</button><button type="button" className="text-button" onClick={restart}><RotateCcw size={17}/>{c.restart}</button><RegistrationButton locale={locale} primary/></div><p role="status">{copy==='done'?c.copied:copy==='error'?c.copyError:''}</p>{copy==='error'&&<label className={styles.manual}>{c.manual}<textarea readOnly rows={12} value={storyText(state,locale)} onFocus={e=>e.currentTarget.select()}/></label>}</div>}
    </div>
    <section className={styles.lockedPreview} aria-labelledby="more-in-ventorme">
      <div><span className={styles.badge}><LockKeyhole size={13}/>{c.locked}</span><h3 id="more-in-ventorme">{c.unlockTitle}</h3><p>{c.unlockText}</p></div>
      <div className={styles.lockedGrid}>{c.labels.slice(STORY_OPEN_STEPS).map((label,i)=><article key={label}><span>0{i+4}</span><LockKeyhole size={18}/><h4>{label}</h4><p>{c.lockedDescriptions[i]}</p></article>)}</div>
      <RegistrationButton locale={locale} primary/>
    </section>
    <p className={styles.verified}>{c.verified} <a href="https://ventorme.ai/" target="_blank" rel="noreferrer">ventorme.ai <ArrowUpRight size={14}/></a></p>
  </section>;
}
