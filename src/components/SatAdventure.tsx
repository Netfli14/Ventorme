"use client";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import Link from 'next/link';
import {motion,AnimatePresence} from 'motion/react';
import {ArrowLeft,ArrowRight,BookOpen,Calculator,Check,CheckCircle2,Flame,Heart,LockKeyhole,Play,RotateCcw,Sparkles,Star,Trophy,X} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {experienceCopy} from '@/lib/experience-copy';
import {satLessons} from '@/lib/sat-lessons';
import {answerQuestion,beginQuestions,canOpenLesson,continueLesson,emptyGame,gameXp,restartLesson,restoreGame,startLesson,SAT_XP,type SatGame} from '@/lib/sat-model';
import {ContinueDialog} from './ContinueDialog';
import {RegistrationButton} from './Actions';
import {useReducedMotion} from './useMotionPreference';
import styles from './SatAdventure.module.css';
const KEY='ventorme.sat.adventure.v1';
const offsets=[0,16,24,16,0,-16,-24,-16,0,16,24,16];
const road='M230 72 '+offsets.slice(1).map((x,i)=>`C${230+offsets[i]*4.6} ${72+i*142+71}, ${230+x*4.6} ${72+(i+1)*142-71}, ${230+x*4.6} ${72+(i+1)*142}`).join(' ');
export function SatAdventure({locale}:{locale:Locale}){
 const c=experienceCopy[locale],reduce=useReducedMotion(),[game,setGame]=useState<SatGame>(emptyGame),[ready,setReady]=useState(false),[show,setShow]=useState(false),[gate,setGate]=useState(false),[selection,setSelection]=useState<number|null>(null),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null),active=game.attempt,lesson=active?satLessons[active.lesson-1]:null,question=lesson&&active?lesson.questions[active.question]:null;
 useEffect(()=>{try{const saved=restoreGame(JSON.parse(localStorage.getItem(KEY)||'null'));if(saved)setGame(saved);}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(game));}catch{}},[ready,game]);
 useEffect(()=>{if(show&&!dialog.current?.open)dialog.current?.showModal();else if(!show&&dialog.current?.open)dialog.current.close();},[show]);
 useEffect(()=>{setSelection(null);if(show)heading.current?.focus({preventScroll:true});},[active?.lesson,active?.question,active?.phase,show]);
 function openLesson(id:number){if(id>10){setGate(true);return;}if(!canOpenLesson(game,id)){setNotice(c.prerequisite);return;}setNotice('');setGame(s=>startLesson(s,id));setShow(true);}
 const closeLesson=()=>setShow(false);
 const nextLesson=Math.min(10,game.completed.length+1);
 return <main id="main-content" className={styles.root}>
  <div className="container"><nav className={styles.tabs} aria-label={c.navGame}><Link href={`/${locale}/`}><ArrowLeft size={17}/>{c.navPlan}</Link><span aria-current="page"><Sparkles size={17}/>{c.navGame}</span></nav>
   <header className={styles.hero}><p className={styles.eyebrow}>VENTORME / SAT ADVENTURE</p><h1>{c.gameTitle}</h1><p>{c.gameLead}</p><div className={styles.legend}><span><i/ >English</span><span><i/>Math</span><span><Heart size={15}/>3 HP</span></div></header>
   <div className={styles.layout}><aside className={styles.sidebar}>
    <div className={styles.progressCard}><div className={styles.cardHeading}><Flame size={23}/><span>{c.progress}</span><strong>{gameXp(game)} XP</strong></div><h2>{game.completed.length}<span> / 10</span></h2><div className={styles.progress} role="progressbar" aria-label={c.progress} aria-valuenow={game.completed.length} aria-valuemin={0} aria-valuemax={10}><span style={{transform:`scaleX(${game.completed.length/10})`}}/></div><p>{c.saved}</p><button className="button button-primary" type="button" disabled={!ready} onClick={()=>openLesson(nextLesson)}>{game.completed.length===10?c.review:c.gameStart}<ArrowRight size={18}/></button></div>
    <div className={styles.guide}><img src="/media/reference/hero-venti-quiz.webp" width="300" height="330" alt="Barsik"/><p>{c.gameNote}</p><span>READ → TRY → GROW</span></div>
   </aside><section className={styles.pathSection} aria-label={c.map}><div className={styles.unit}><BookOpen/><div><small>UNIT 01 / FOUNDATIONS</small><strong>English + Math</strong></div><span>10 {c.lessons}</span></div>
    <p className={styles.notice} role="status">{notice}</p>
    <div className={styles.path}><svg className={styles.road} viewBox="0 0 460 1740" preserveAspectRatio="none" aria-hidden="true"><path d={road} fill="none" stroke="var(--border)" strokeWidth="9" strokeDasharray="2 19" strokeLinecap="round"/></svg>
     <ol className={styles.stops}>{Array.from({length:12},(_,i)=>{const l=satLessons[i],id=i+1,done=game.completed.includes(id),available=id<=10&&canOpenLesson(game,id),current=id===nextLesson&&game.completed.length<10,Icon=done?Check:id>10?LockKeyhole:i%2?Calculator:BookOpen;
      return <li key={id} className={`${styles.stop} ${i%2?styles.math:styles.english} ${done?styles.completed:''} ${current?styles.current:''} ${!available?styles.unavailable:''}`} style={{'--position':`${50+offsets[i]}%`,top:30+i*142} as CSSProperties}>
       {current&&<span className={styles.startFlag}>{c.gameStart}</span>}<button type="button" disabled={!ready} aria-label={`${c.lesson} ${id}${l?`: ${l.title}`:`: ${c.locked}`}${!available&&id<=10?`. ${c.prerequisite}`:''}`} aria-current={current?'step':undefined} onClick={()=>openLesson(id)}><Icon size={29}/><span className={styles.nodeNumber}>{id}</span></button><span className={styles.lessonName} lang="en">{l?.title||c.locked}</span>{done&&<span className={styles.earned}>+{SAT_XP} XP</span>}
      </li>;})}</ol>
     <img className={`${styles.pathMascot} ${styles.mascotOne}`} src="/media/reference/step-figure.webp" width="160" height="240" alt="" loading="lazy"/>
     <div className={styles.starArt} aria-hidden="true"><Star/><span>KEEP GOING</span></div><div className={styles.fog} aria-hidden="true"/>
    </div><div className={styles.beyond}><LockKeyhole/><h2>{game.completed.length===10?c.allDone:c.more}</h2><p>{c.moreText}</p><RegistrationButton locale={locale} primary/></div>
   </section></div>
  </div>
  <dialog className={styles.lessonDialog} ref={dialog} onCancel={closeLesson} onClose={closeLesson} aria-labelledby="sat-lesson-heading">
   {active&&lesson&&question&&<div className={styles.lessonContent}>
    <div className={styles.lessonTop}><button type="button" className="icon-button" aria-label={c.exit} onClick={closeLesson}><X/></button><span>{c.lesson} {lesson.id} / 10 · <span lang="en">{lesson.subject==='math'?'Math':'English'}</span></span><div className={styles.lives} aria-label={`${c.lives}: ${active.hp} / 3`}>{[0,1,2].map(i=><Heart key={i} size={21} fill={i<active.hp?'currentColor':'none'} className={i>=active.hp?styles.emptyHeart:''}/>)}</div></div>
    <div className={styles.questionProgress} aria-hidden="true">{[0,1,2].map(i=><span key={i} data-done={i<active.question||active.phase==='passed'}/>)}</div>
    <AnimatePresence mode="wait" initial={false}><motion.div onAnimationComplete={()=>heading.current?.focus({preventScroll:true})} key={`${active.phase}-${active.question}`} initial={{opacity:0,y:reduce?0:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduce?0:-6}} transition={{duration:reduce?0:.22,ease:[.2,0,0,1]}}>
    {active.phase==='learn'?<><p className={styles.eyebrow}>{c.learn}</p><h2 ref={heading} tabIndex={-1} id="sat-lesson-heading" lang="en">{lesson.title}</h2><div className={styles.idea} lang="en"><BookOpen/><p>{lesson.idea}</p><blockquote>{lesson.example}</blockquote></div><button type="button" className="button button-primary" onClick={()=>setGame(beginQuestions)}>{c.beginTest}<ArrowRight size={18}/></button></>:
     active.phase==='passed'?<div className={styles.outcome}><Trophy size={64}/><h2 ref={heading} tabIndex={-1} id="sat-lesson-heading">{c.passed}</h2><p>{c.passedText}</p><span className={styles.reward}>{gameXp(game)} XP <small>{c.progress}</small></span><p className={styles.subtle}>{c.saved}</p><button type="button" className="button button-primary" onClick={closeLesson}>{c.mapBack}<ArrowRight size={18}/></button></div>:
     active.phase==='failed'?<div className={`${styles.outcome} ${styles.failure}`}><Heart size={64}/><h2 ref={heading} tabIndex={-1} id="sat-lesson-heading">{c.failed}</h2><p>{c.failedText}</p><div className={styles.feedback} lang="en"><strong>{c.correctAnswer}: {question.choices[question.answer]}</strong><p>{question.explanation}</p></div><button type="button" className="button button-primary" onClick={()=>setGame(restartLesson)}><RotateCcw size={18}/>{c.retryLesson}</button></div>:
     <><p className={styles.eyebrow}>{c.lesson} {lesson.id} · {active.question+1} / 3</p><h2 ref={heading} tabIndex={-1} id="sat-lesson-heading" lang="en">{question.prompt}</h2><fieldset className={styles.answers} disabled={active.phase==='feedback'}><legend className="sr-only">{c.check}</legend>{question.choices.map((choice,i)=><label key={choice} className={`${selection===i?styles.selected:''} ${active.phase==='feedback'&&active.selected===i?(active.correct?styles.rightAnswer:styles.wrongAnswer):''}`}><input type="radio" name="sat-answer" checked={(active.phase==='feedback'?active.selected:selection)===i} onChange={()=>setSelection(i)}/><span>{String.fromCharCode(65+i)}</span><p lang="en">{choice}</p></label>)}</fieldset>
      {active.phase==='feedback'?<div className={styles.feedback} role="status"><strong>{active.correct?<CheckCircle2 size={21}/>:<Heart size={21}/>} {active.correct?c.correct:c.wrong}</strong><p lang="en">{question.explanation}</p><button type="button" className="button button-primary" onClick={()=>setGame(continueLesson)}>{active.correct?c.next:c.retryAnswer}<ArrowRight size={18}/></button></div>:<button type="button" className="button button-primary" disabled={selection===null} onClick={()=>{if(selection!==null)setGame(s=>answerQuestion(s,selection));}}>{c.check}<Check size={18}/></button>}
     </>}
    </motion.div></AnimatePresence>
   </div>}
  </dialog><ContinueDialog locale={locale} open={gate} onClose={()=>setGate(false)} game/>
 </main>;
}
