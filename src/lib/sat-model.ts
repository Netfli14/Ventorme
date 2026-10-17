import {satLessons} from './sat-lessons';
export const SAT_LIVES=3, SAT_XP=20, SAT_LESSONS=10;
type Phase='learn'|'question'|'feedback'|'passed'|'failed';
export type SatAttempt={lesson:number;question:number;hp:number;phase:Phase;selected:number|null;correct:boolean|null};
export type SatGame={version:1;completed:number[];attempt:SatAttempt|null};
export const emptyGame=():SatGame=>({version:1,completed:[],attempt:null});
export const canOpenLesson=(s:SatGame,id:number)=>Number.isInteger(id)&&id>=1&&id<=SAT_LESSONS&&(id===1||s.completed.includes(id-1));
export const gameXp=(s:SatGame)=>s.completed.length*SAT_XP;
export function startLesson(s:SatGame,id:number):SatGame{
 if(!canOpenLesson(s,id))return s;
 // Closing a lesson does not replenish lives or skip the current question.
 if(s.attempt?.lesson===id&&s.attempt.phase!=='passed')return s;
 return {...s,attempt:{lesson:id,question:0,hp:SAT_LIVES,phase:'learn',selected:null,correct:null}};
}
export function beginQuestions(s:SatGame):SatGame{
 return s.attempt?.phase==='learn'?{...s,attempt:{...s.attempt,phase:'question'}}:s;
}
export function answerQuestion(s:SatGame,choice:number):SatGame{
 const a=s.attempt;
 if(!a||a.phase!=='question')return s;
 const q=satLessons[a.lesson-1]?.questions[a.question];
 if(!q||!Number.isInteger(choice)||choice<0||choice>=q.choices.length)return s;
 const correct=q.answer===choice, hp=a.hp-(correct?0:1);
 return {...s,attempt:{...a,hp,correct,selected:choice,phase:hp===0?'failed':'feedback'}};
}
export function continueLesson(s:SatGame):SatGame{
 const a=s.attempt;if(!a||a.phase!=='feedback')return s;
 if(!a.correct)return {...s,attempt:{...a,selected:null,correct:null,phase:'question'}};
 if(a.question===satLessons[a.lesson-1].questions.length-1)return {...s,completed:[...new Set([...s.completed,a.lesson])].sort((x,y)=>x-y),attempt:{...a,phase:'passed'}};
 return {...s,attempt:{...a,question:a.question+1,selected:null,correct:null,phase:'question'}};
}
export function restartLesson(s:SatGame):SatGame{
 return s.attempt?{...s,attempt:{...s.attempt,question:0,hp:SAT_LIVES,selected:null,correct:null,phase:'learn'}}:s;
}
export function restoreGame(value:unknown):SatGame|null{
 if(!value||typeof value!=='object')return null;
 const s=value as SatGame;
 if(s.version!==1||!Array.isArray(s.completed)||s.completed.length>10||s.completed.some((id,i)=>id!==i+1))return null;
 const a=s.attempt;
 if(a!==null){
  if(!a||!canOpenLesson(s,a.lesson)||!Number.isInteger(a.question)||a.question<0||a.question>2||!Number.isInteger(a.hp)||a.hp<0||a.hp>3||!['learn','question','feedback','passed','failed'].includes(a.phase))return null;
  if(a.selected!==null&&(!Number.isInteger(a.selected)||a.selected<0||a.selected>3))return null;
  if(a.correct!==null&&typeof a.correct!=='boolean')return null;
  if((a.phase==='failed')!==(a.hp===0))return null;
  if((a.phase==='feedback'||a.phase==='failed'||a.phase==='passed')&&(a.selected===null||a.correct!==(satLessons[a.lesson-1].questions[a.question].answer===a.selected)))return null;
  if(a.phase==='passed'&&(!s.completed.includes(a.lesson)||a.question!==2||!a.correct))return null;
  if((a.phase==='question'||a.phase==='learn')&&(a.selected!==null||a.correct!==null))return null;
 }
 return s;
}
