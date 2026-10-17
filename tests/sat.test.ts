import {test} from 'node:test';
import assert from 'node:assert/strict';
import {satLessons} from '../src/lib/sat-lessons';
import {answerQuestion,beginQuestions,canOpenLesson,continueLesson,emptyGame,gameXp,restartLesson,restoreGame,startLesson,type SatGame} from '../src/lib/sat-model';
function complete(s:SatGame,id:number){let next=beginQuestions(startLesson(s,id));for(const q of satLessons[id-1].questions){next=continueLesson(answerQuestion(next,q.answer));}return next;}
test('all ten lessons alternate English and Math and have three valid original questions',()=>{
 assert.equal(satLessons.length,10);for(const [i,l] of satLessons.entries()){assert.equal(l.id,i+1);assert.equal(l.subject,i%2?'math':'english');assert.equal(l.questions.length,3);for(const q of l.questions){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.explanation.trim().length>0);}}
});
test('lessons unlock sequentially, all ten are playable, and there is no eleventh demo lesson',()=>{
 let s=emptyGame();assert.equal(canOpenLesson(s,2),false);assert.strictEqual(startLesson(s,2),s);
 for(let i=1;i<=10;i++){assert.equal(canOpenLesson(s,i),true);s=complete(s,i);assert.equal(s.completed.length,i);assert.equal(gameXp(s),20*i);assert.equal(s.attempt?.phase,'passed');}
 assert.equal(canOpenLesson(s,11),false);assert.strictEqual(startLesson(s,11),s);assert.ok(restoreGame(JSON.parse(JSON.stringify(s))));
});
test('wrong answers spend exactly one life, cannot double-submit, and zero lives require a restart',()=>{
 let s=beginQuestions(startLesson(emptyGame(),1));const wrong=(satLessons[0].questions[0].answer+1)%4;
 for(let hp=2;hp>=0;hp--){s=answerQuestion(s,wrong);assert.equal(s.attempt?.hp,hp);assert.strictEqual(answerQuestion(s,wrong),s);if(hp>0){s=continueLesson(s);assert.equal(s.attempt?.question,0);}}
 assert.equal(s.attempt?.phase,'failed');assert.equal(gameXp(s),0);assert.equal(canOpenLesson(s,2),false);assert.strictEqual(startLesson(s,1),s);
 s=restartLesson(s);assert.equal(s.attempt?.hp,3);assert.equal(s.attempt?.question,0);assert.equal(s.attempt?.phase,'learn');
});
test('reopening and restoring a lesson preserve lives and the current question',()=>{
 let s=beginQuestions(startLesson(emptyGame(),1));s=continueLesson(answerQuestion(s,1));s=continueLesson(answerQuestion(s,0));assert.equal(s.attempt?.question,1);assert.equal(s.attempt?.hp,2);
 const restored=restoreGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);assert.strictEqual(startLesson(s,1),s);
});
test('replaying a passed lesson never grants duplicate XP',()=>{
 const s=complete(emptyGame(),1);assert.equal(gameXp(s),20);assert.equal(gameXp(complete(s,1)),20);assert.deepEqual(complete(s,1).completed,[1]);
});
test('invalid storage and answer indexes cannot skip lessons or break life limits',()=>{
 assert.equal(restoreGame({version:1,completed:[1,3],attempt:null}),null);
 const s=beginQuestions(startLesson(emptyGame(),1));assert.strictEqual(answerQuestion(s,-1),s);assert.strictEqual(answerQuestion(s,4),s);
 assert.equal(restoreGame({...s,attempt:{...s.attempt,hp:4}}),null);
 assert.equal(restoreGame({...s,attempt:{...s.attempt,hp:0,phase:'question'}}),null);
});
