import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyStory,toggleStoryInterest,canAdvanceStory,moveStory,restoreStory,storyTaskOrder,type StoryState} from '../src/lib/story-model';
import {storyText} from '../src/lib/story-export';
import {storyCopy} from '../src/lib/story-copy';
import {locales} from '../src/lib/i18n';
import {parseCookieConsent} from '../src/lib/cookies';
import {eventNames} from '../src/lib/route-model';
import {buildFunnel} from '../src/lib/funnel';
const chosen=():StoryState=>({...emptyStory(),interests:['science','nature'],criterion:'budget',firstTask:'finance'});
test('three decisions complete the preview and later stages are inaccessible',()=>{
 let s=emptyStory(); assert.equal(canAdvanceStory(s),false); assert.equal(moveStory(s,1),s);
 s=toggleStoryInterest(s,'science'); assert.equal(canAdvanceStory(s),false);
 s=toggleStoryInterest(s,'nature'); assert.equal(canAdvanceStory(s),true);
 assert.equal(toggleStoryInterest(s,'people'),s);
 s=moveStory(s,1); assert.equal(canAdvanceStory(s),false);
 s={...s,criterion:'programme'};s=moveStory(s,2);assert.equal(canAdvanceStory(s),false);
 s={...s,firstTask:'direction'};
 for(let next=3;next<=3;next++){assert.equal(canAdvanceStory(s),true);s=moveStory(s,next);assert.equal(s.step,next);}
 assert.equal(s.furthest,3); assert.equal(s.interests.length,2);
 assert.equal(moveStory(s,4),s);assert.equal(moveStory(s,7),s);
});
test('backtracking and changed decisions change the final route without mutating answers',()=>{
 let s=chosen();for(let i=1;i<=3;i++)s=moveStory(s,i);
 const previous=structuredClone(s), initialText=storyText(s,'ru');
 s=moveStory(s,1);s={...s,criterion:'country'};s=moveStory(s,2);s={...s,firstTask:'requirements'};
 assert.deepEqual(storyTaskOrder(s.firstTask),['requirements','direction','finance']);
 assert.notEqual(storyText(s,'ru'),initialText);
 assert.deepEqual(previous.interests,['science','nature']);
 assert.equal(moveStory(emptyStory(),7).step,0);
 assert.equal(moveStory(s,8),s);assert.equal(moveStory(s,-1),s);
});
test('story restores valid progress across language changes and rejects corrupt states',()=>{
 let s=chosen();for(let i=1;i<=3;i++)s=moveStory(s,i);
 assert.deepEqual(restoreStory(JSON.parse(JSON.stringify(s))),s);
 for(const value of [null,{}, {...s,step:8},{...s,interests:['science','science']},{...s,firstTask:''},{...s,criterion:'made-up'}])assert.equal(restoreStory(value),null);
 for(const locale of locales){const text=storyText(s,locale);assert.ok(text.includes(storyCopy[locale].criteria[1]));assert.ok(text.includes(storyCopy[locale].actions[2]));assert.ok(text.includes(storyCopy[locale].transition));assert.ok(!/undefined|NaN/.test(text));}
});
test('all story languages have complete local copy and each stage has a tool, action and demo',()=>{
 for(const locale of locales){const c=storyCopy[locale];assert.deepEqual(Object.keys(c).sort(),Object.keys(storyCopy.ru).sort());for(const [key,value] of Object.entries(c)){assert.ok(value.length>0,`${locale}:${key}`);if(Array.isArray(value))assert.ok(value.every(v=>v.length>0));}for(const key of ['labels','titles','tasks','tools','toolActions'])assert.equal((c as unknown as Record<string,string[]>)[key].length,7);assert.equal(c.mascot.length,8);assert.equal(c.interests.length,6);assert.equal(c.actions.length,3);if(locale!=='en')assert.notEqual(c.transition,storyCopy.en.transition);}
});
test('optional route analytics defaults off, old consent does not authorize it',()=>{
 const now=Date.now(),base={version:1,preferences:true,updatedAt:now};
 assert.equal(parseCookieConsent(JSON.stringify(base),now)?.analytics,false);
 assert.equal(parseCookieConsent(JSON.stringify({...base,analytics:true}),now)?.analytics,true);
 assert.equal(parseCookieConsent(JSON.stringify({...base,analytics:'true'}),now)?.analytics,false);
 assert.equal(parseCookieConsent(null,now),null);
 const id='e1390d0f-64fb-4898-829b-2635410df42d';
 assert.ok(eventNames.includes('story_complete'));
 const funnel=buildFunnel([`route-events/story_start/${id}.json`,`route-events/story_complete/${id}.json`],[]);
 assert.equal(funnel.counts.story_complete,1);assert.equal(funnel.counts.story_start,1);
});

test('copy writes the complete route and handles denied or missing clipboard',async()=>{
 const {copyStoryText}=await import('../src/lib/story-export');
 const text=storyText(chosen(),'ru');let received='';
 assert.equal(await copyStoryText(text,{writeText:async value=>{received=value;}}),'done');
 assert.equal(received,text);assert.ok(received.includes('Бюджет'));
 assert.equal(await copyStoryText(text),'error');
 assert.equal(await copyStoryText(text,{writeText:async()=>{throw Error('Denied');}}),'error');
 assert.deepEqual(emptyStory(),{interests:[],criterion:'',firstTask:'',step:0,furthest:0});
});

test('old seven-stage sessions migrate to the three-stage result without exposing locked tools',()=>{
 const old={...chosen(),step:7,furthest:7};
 const migrated=restoreStory(old);assert.equal(migrated?.step,3);assert.equal(migrated?.furthest,3);
});
