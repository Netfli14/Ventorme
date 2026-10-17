"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {gsap} from 'gsap';
import {ArrowUpRight,ArrowRight,BookOpen,CalendarDays,Check,CheckCircle2,Compass,Copy,GraduationCap,LockKeyhole,Pause,Play,Plus,Sparkles,Target} from 'lucide-react';
import {type Locale,dictionaries} from '@/lib/i18n';
import {experienceCopy} from '@/lib/experience-copy';
import {routeCopy} from '@/lib/route-copy';
import {makeRoute} from '@/lib/route-model';
import {platformFaq} from '@/lib/platform-faq';
import {scrollToSection as go} from '@/lib/scroll';
import {RegistrationButton} from './Actions';
import {useRoute} from './RouteProvider';
import {useReducedMotion} from './useMotionPreference';
import {MascotScrollIntro} from './MascotScrollIntro';
import {AdmissionQuiz} from './AdmissionQuiz';
import {ContinueDialog} from './ContinueDialog';
import styles from './AdmissionLanding.module.css';
const universities=[
 {name:'Nazarbayev University',country:'Kazakhstan',logo:'uni-nazarbayev.webp'},
 {name:'University of Padua',country:'Italy',logo:'uni-padova.webp'},
 {name:'University College London',country:'United Kingdom',logo:'uni-ucl.webp'},
 {name:'The University of Hong Kong',country:'Hong Kong',logo:'uni-hku.webp'},
 {name:'Bocconi University',country:'Italy',logo:'uni-bocconi.webp'},
 {name:'The Hong Kong Polytechnic University',country:'Hong Kong',logo:'uni-polyu.webp'},
 {name:'King’s College London',country:'United Kingdom',logo:'uni-kings.webp'},
 {name:'University of Birmingham',country:'United Kingdom',logo:'uni-birmingham.webp'},
];
function useEntrance(ref:React.RefObject<HTMLElement|null>,locale:Locale){
 const reduce=useReducedMotion();
 useLayoutEffect(()=>{if(reduce||!ref.current)return;const ctx=gsap.context(()=>{},ref.current);const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);ctx.add(()=>{const pieces=entry.target.querySelectorAll('[data-piece]');gsap.from(pieces.length?pieces:entry.target,{y:20,scale:.985,opacity:.3,duration:.52,stagger:pieces.length?.055:0,ease:'power3.out',clearProps:'transform,opacity'});});});},{threshold:.12});ref.current.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));return()=>{observer.disconnect();ctx.revert();};},[ref,reduce,locale]);
}
function HeroBoard({locale}:{locale:Locale}){const c=experienceCopy[locale];return <div className={styles.heroBoard} data-reveal>
 <div className={styles.boardGrid} aria-hidden="true"/><span className={styles.boardTag}>YOUR NEXT CHAPTER ↗</span>
 <svg className={styles.heroPath} viewBox="0 0 520 510" aria-hidden="true"><path d="M60 120 C380 85 430 150 300 235 S90 420 450 390" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 8"/><circle cx="60" cy="120" r="6" fill="var(--warm)"/><circle cx="450" cy="390" r="6" fill="var(--warm)"/></svg>
 <div className={`${styles.miniCard} ${styles.interestCard}`} data-piece><span><Compass size={17}/>01 / DISCOVER</span><strong>{c.pathLabels[0]}</strong><div className={styles.miniPills}><span>Science</span><span>Creativity</span></div></div>
 <div className={`${styles.miniCard} ${styles.universityMini}`} data-piece><span><GraduationCap size={17}/>02 / EXPLORE</span><img src="/media/reference/uni-nazarbayev.webp" width="180" height="36" alt="Nazarbayev University"/><p>{c.pathLabels[1]}<ArrowUpRight size={16}/></p></div>
 <img className={styles.heroMascot} data-piece src="/media/reference/hero-venti-quiz.webp" width="300" height="330" alt="Barsik" fetchPriority="high"/>
 <div className={`${styles.miniCard} ${styles.taskMini}`} data-piece><span><CalendarDays size={17}/>03 / YOUR NEXT MOVE</span><strong>{c.pathLabels[2]}</strong><div><i><Check size={11}/></i><span/><span/></div></div>
 <div className={styles.boardFooter}><span><i/>VENTORME · AI MENTOR</span><Sparkles size={17}/></div>
 </div>;}
function UniversityMarquee({locale}:{locale:Locale}){
 const c=experienceCopy[locale],[paused,setPaused]=useState(false);
 return <section className={styles.universitySection} aria-labelledby="university-strip-heading"><div className={`container ${styles.uniHeading}`}><div><p className={styles.eyebrow}>{c.uniEyebrow}</p><h2 id="university-strip-heading">{c.uniTitle}</h2></div><button type="button" className="icon-button" onClick={()=>setPaused(v=>!v)} aria-pressed={paused} aria-label={paused?c.resume:c.pause}>{paused?<Play size={17}/>:<Pause size={17}/>}</button></div>
  <div className={styles.marquee} data-paused={paused}>{[universities.slice(0,4),universities.slice(4)].map((row,i)=><div key={i} className={`${styles.track} ${i?styles.reverse:''}`}><div className={styles.logoGroup}>{row.map(u=><div key={u.name} className={styles.logo}><img src={`/media/reference/${u.logo}`} alt={u.name} width="160" height="70" loading="lazy"/></div>)}</div><div className={styles.logoGroup} aria-hidden="true">{row.map(u=><div key={u.name} className={styles.logo}><img src={`/media/reference/${u.logo}`} alt="" width="160" height="70" loading="lazy"/></div>)}</div></div>)}</div><p className={`container ${styles.finePrint}`}>{c.uniNote}</p>
 </section>;
}
function UniversityExplorer({locale,onGate}:{locale:Locale;onGate:()=>void}){
 const c=experienceCopy[locale],[criterion,setCriterion]=useState(0),[opened,setOpened]=useState<number|null>(null);
 return <section id="universities" className={`container ${styles.explorer}`} aria-labelledby="explorer-title"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>02 / EXPLORE</p><h2 id="explorer-title">{c.universityTitle}</h2></div><p>{c.universityLead}</p></div><div className={styles.explorerToolbar}><span>{c.universityDemo}</span><fieldset><legend>{c.compare}</legend>{c.criteria.map((label,i)=><label key={label} className={criterion===i?styles.activeFilter:''}><input type="radio" name="university-criterion" checked={criterion===i} onChange={()=>setCriterion(i)}/>{label}</label>)}</fieldset></div>
  <div className={styles.universityGrid}>{universities.slice(0,4).map((u,i)=>i<2?<article key={u.name} className={styles.universityCard}><div className={styles.universityLogo}><img src={`/media/reference/${u.logo}`} alt="" width="180" height="80" loading="lazy"/></div><small>0{i+1} / {u.country}</small><h3>{u.name}</h3><p>{c.aspects[criterion]}</p><button className="text-button" type="button" aria-expanded={opened===i} onClick={()=>setOpened(v=>v===i?null:i)}>{c.view}<Plus size={17}/></button>{opened===i&&<ul className={styles.checks}>{[criterion,...[0,1,2].filter(n=>n!==criterion)].map(n=><li key={n}><CheckCircle2 size={15}/>{c.aspects[n]}</li>)}</ul>}</article>:<button type="button" className={styles.fogUniversity} key={u.name} onClick={onGate} aria-label={`${c.hiddenUniversities} ${i+1}`}><div className={styles.hiddenUniArt} aria-hidden="true"><GraduationCap size={44}/><span/><span/><span/></div><div className={styles.fogLabel}><LockKeyhole size={21}/><span>{c.hiddenUniversities}</span><ArrowUpRight size={18}/></div></button>)}</div>
 </section>;
}
function AdmissionResult({locale,onGate}:{locale:Locale;onGate:()=>void}){
 const {route:s,patch,track}=useRoute(),c=experienceCopy[locale],d=dictionaries[locale],old=routeCopy[locale],result=makeRoute(s,locale),[copy,setCopy]=useState<'idle'|'done'|'error'>('idle');
 const text=[c.plan,`${s.grade} · ${s.interests.map(i=>d.choices.interests[i]).join(', ')}`,result.summary,...result.steps.slice(0,2).map((t,i)=>`${i+1}. ${t}`),c.resultNote,c.gateText].join('\n\n');
 useEffect(()=>{setCopy('idle');},[s]);
 useEffect(()=>{if(s.completed)track('result_view');},[s.completed,track]);
 if(!s.completed)return null;
 async function copyResult(){try{await navigator.clipboard.writeText(text);setCopy('done');}catch{setCopy('error');}}
 return <section id="my-route" className={`container ${styles.result}`} aria-labelledby="admission-result-heading"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>01 / YOUR PATH</p><h2 id="admission-result-heading">{c.plan}</h2></div><p>{c.resultNote}</p></div>
  <div className={styles.resultSummary}><div><span className={styles.eyebrow}>{c.why}</span><h3>{result.title}</h3><p>{result.summary}</p></div><div className={styles.resultTags}><span>{s.grade} {old.grade}</span><span>{s.program?d.choices.program[s.program]:''}</span>{s.interests.map(i=><span key={i}>{d.choices.interests[i]}</span>)}</div></div>
  <h3 className={styles.actionsTitle}>{c.actions}</h3><div className={styles.admissionPath}>
   {result.steps.slice(0,2).map((step,i)=><article key={step} className={styles.openStep}><span className={styles.pathNumber}>0{i+1}</span><div><small>{i===0?'START HERE':'NEXT UP'}</small><h3>{step}</h3><p><CheckCircle2 size={16}/>{d.features[result.features[i] as keyof typeof d.features]?.title||c.plan}</p></div><ArrowUpRight size={22}/></article>)}
   <div className={styles.fogSteps}>{c.pathLabels.slice(2).map((label,i)=><button key={label} type="button" className={styles.lockedStep} onClick={onGate} aria-label={`${i+3}. ${label}. ${c.locked}`}><span className={styles.pathNumber}>0{i+3}</span><span><strong>{label}</strong><i aria-hidden="true"/><i aria-hidden="true"/></span><LockKeyhole size={20}/></button>)}<div className={styles.fogHint}><LockKeyhole size={16}/>{c.locked}</div></div>
  </div><div className={styles.resultActions}><button type="button" className="button button-outline" onClick={copyResult}><Copy size={17}/>{c.copy}</button><button type="button" className="text-button" onClick={()=>{patch({completed:false,step:0});go('quiz');}}>{old.edit}<ArrowRight size={16}/></button><span role="status">{copy==='done'?c.copied:copy==='error'?c.copyError:''}</span></div>{copy==='error'&&<textarea className={styles.copyFallback} aria-label={c.copy} readOnly rows={8} value={text} onFocus={e=>e.currentTarget.select()}/>}
  <div className={styles.resultTools}><div><p className={styles.eyebrow}>{c.tools}</p>{result.features.map(key=><span key={key}>{d.features[key as keyof typeof d.features]?.title}</span>)}</div><RegistrationButton locale={locale} primary/></div><p className={styles.finePrint}>{c.gateText}</p>
 </section>;
}
export function RouteExperience({locale,mascotVideoAvailable=true,entry='home'}:{locale:Locale;mascotVideoAvailable?:boolean;entry?:'home'|'quiz'|'result'}){
 const c=experienceCopy[locale],old=routeCopy[locale],{ready,track}=useRoute(),scope=useRef<HTMLElement>(null),[gate,setGate]=useState(false);useEntrance(scope,locale);
 useEffect(()=>{if(ready&&entry!=='home'){requestAnimationFrame(()=>go(entry==='quiz'?'quiz':'my-route'));}},[ready,entry]);
 const start=()=>{track('quiz_start');go('quiz');};
 return <main id="main-content" className={styles.root} ref={scope}>
  {entry==='home'&&mascotVideoAvailable&&<MascotScrollIntro locale={locale} planLabel={c.start}/>}
  <section id="content-start" className={`container ${styles.hero}`}><div className={styles.heroCopy} data-reveal><p className={styles.eyebrow} data-piece><span className={styles.liveDot}/>{c.eyebrow}</p><h1 data-piece>{c.title}<br/><span>{c.accent}</span></h1><p data-piece className={styles.heroLead}>{c.lead}</p><div data-piece className={styles.heroButtons}><button type="button" className="button button-primary" onClick={start}>{c.start}<ArrowUpRight size={18}/></button><RegistrationButton locale={locale}/></div><div className={styles.heroBottom} data-piece><span><CheckCircle2 size={15}/>{c.free}</span><Link href={`/${locale}/sat/`}><Play size={14}/>{c.navGame}<ArrowUpRight size={15}/></Link></div></div><HeroBoard locale={locale}/></section>
  <UniversityMarquee locale={locale}/>
  <section id="features" className={`container ${styles.features}`}><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>THE VENTORME WAY</p><h2>{c.featureTitle}</h2></div><p>{c.featureLead}</p></div><div className={styles.bento}>
   <article className={styles.mentorCard} data-reveal><span className={styles.eyebrow} data-piece>01 / DIRECTION</span><h3 data-piece>{c.mentor}</h3><p data-piece>{c.mentorText}</p><div className={styles.mentorDiagram} aria-hidden="true"><span><Compass/>INTERESTS</span><i/><span><Target/>DIRECTION</span><i/><span><CalendarDays/>PLAN</span></div><button type="button" className="text-button" onClick={start}>{c.start}<ArrowUpRight size={17}/></button><img src="/media/reference/step-figure.webp" alt="" width="200" height="300" loading="lazy"/></article>
   <article className={styles.prepCard} data-reveal><span className={styles.eyebrow} data-piece>02 / PREPARATION</span><h3 data-piece>{c.prep}</h3><p data-piece>{c.prepText}</p><div className={styles.prepDemo} data-piece><span>English <BookOpen size={15}/></span><span>Math <span>∑</span></span><span>English <Check size={15}/></span><div><i/><i/><i/><i/></div></div><Link className="button button-primary" href={`/${locale}/sat/`}>{c.play}<ArrowUpRight size={17}/></Link></article>
  </div></section>
  <div id="how"><AdmissionQuiz locale={locale}/></div>
  <AdmissionResult locale={locale} onGate={()=>setGate(true)}/>
  <UniversityExplorer locale={locale} onGate={()=>setGate(true)}/>
  <section id="faq" className={`container ${styles.faq}`}><div><p className={styles.eyebrow}>GOOD QUESTIONS</p><h2>{old.faqTitle}</h2><span className={styles.faqArt} aria-hidden="true">?</span></div><div>{platformFaq[locale].map(([q,a])=><details key={q}><summary>{q}<Plus size={19}/></summary><p>{a}</p></details>)}</div></section>
  <section className={`container ${styles.final}`}><span className={styles.finalArrow} aria-hidden="true">↗</span><div><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h2>{old.finalTitle}</h2><p>{old.finalText}</p></div><RegistrationButton locale={locale} primary/></section>
  <ContinueDialog locale={locale} open={gate} onClose={()=>setGate(false)}/>
 </main>;
}
