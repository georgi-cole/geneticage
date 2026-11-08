import assert from 'node:assert/strict';
import {counterText,dialFrame,initializeResultMotion,RESULT_MOTION_DURATION} from './public/result-motion.mjs';
import {overviewChoices,overviewPresentation,renderThemeHome} from './public/theme-home.mjs';
import {resultInstrument,libraryMotif} from './public/ui-components.mjs';

// No guest, questionnaire or withheld estimate can silently become a sample age.
const welcome=overviewPresentation(null),markup=renderThemeHome(welcome);
assert.equal(welcome.empty,true);
assert.match(markup,/No assessment yet/);assert.match(markup,/Explore a sample/);
assert.ok(!markup.includes('data-count-to'));assert.ok(!markup.includes('YOUR RESULT'));
assert.match(renderThemeHome(overviewPresentation(null,{hasProfile:true})),/Your workspace is ready/);
for(const record of [{clinical:null},{clinical:{value:50,reason:'Collection needs review'}},{clinical:{value:NaN}}]){
 const presentation=overviewPresentation(record);
 assert.equal(presentation.value,null);
 assert.ok(!renderThemeHome(presentation).includes('data-count-to'));
}
const frozen=Object.freeze({clinical:Object.freeze({value:41.99,gap:-3.01}),labAge:'45',labDate:'2026-11-01',id:'saved-one',overviewSaved:true,sample:false});
const saved=overviewPresentation(frozen);
assert.equal(saved.value,42);assert.equal(saved.gap,'-3');assert.equal(saved.action,'open-saved');assert.equal(saved.recordId,'saved-one');
assert.equal(frozen.clinical.value,41.99,'Presentation must not mutate or recalculate a stored estimate.');
const sample=renderThemeHome(overviewPresentation({...frozen,sample:true}));
assert.match(sample,/>SAMPLE</);assert.match(sample,/Not your result/);
const fitness={assessmentType:'fitness',system:{inputs:{age:{value:'33',unit:'years'}},result:{status:'ready',method:'HUNT',age:25,ageBand:{from:20,to:29}}}};
const savedSample={...frozen,id:'saved-sample',labSubmitted:true,sample:true};
const choices=overviewChoices([], [savedSample,fitness]);
assert.deepEqual(choices.map(({type,label})=>[type,label]),[['fitness','Fitness'],['phenoage','PhenoAge · Sample']]);
assert.match(renderThemeHome(overviewPresentation(savedSample),{choices,selected:'phenoage'}),/id="overview-result".*PhenoAge · Sample.*>SAMPLE</s);
assert.match(renderThemeHome(welcome,{choices,selected:'phenoage',loadStatus:'loading',loadingTitle:'Clinical PhenoAge',loadingSample:true}),/>SAMPLE</);
const personal={...frozen,labSubmitted:true};
assert.equal(overviewChoices([], [personal,savedSample,fitness]).find(item=>item.type==='phenoage').saved,personal,'A newer sample cannot replace the personal result.');
assert.equal(overviewChoices([{...savedSample,assessment:true}], []).length,0,'An unsaved sample is still a preview.');
assert.deepEqual(overviewChoices([], [savedSample,{...fitness,sample:true}]).map(item=>item.label),['Fitness · Sample','PhenoAge · Sample']);
const fitnessHome=renderThemeHome(overviewPresentation(fitness));
assert.match(fitnessHome,/home-workspace.*result-instrument.*APPROXIMATE FITNESS AGE/s);
assert.match(fitnessHome,/Study age group.*20–29.*Open your report/s);
assert.doesNotMatch(fitnessHome,/Simple difference/);
const bound=renderThemeHome(overviewPresentation({...fitness,system:{...fitness.system,result:{status:'ready',method:'HUNT',ageRange:'at-least',boundary:70}}}));
assert.match(bound,/age-bound-label">At least<\/small>70/);
assert.doesNotMatch(bound,/ESTIMATE UNAVAILABLE/);
const vascular=overviewPresentation({assessmentType:'heart-vascular',heart:{inputs:{age:19},result:{method:'PDAY',ageBand:{from:24,to:28}}}});
assert.equal(vascular.value,26);
assert.equal(vascular.comparison.value,'24–28');
assert.ok(!libraryMotif().includes('<span'),'The unlabelled decorative dot is removed.');
assert.match(resultInstrument({value:50}),/class="sr-only">50<\/span><span aria-hidden="true" data-count-to="50"/);

assert.equal(counterText(50,0,{digits:2}),'00');assert.equal(counterText(50,1,{digits:2}),'50');
assert.equal(counterText(-5,1,{signed:true}),'-5');assert.equal(counterText(5,1,{signed:true}),'+5');
assert.equal(counterText(0,1,{signed:true}),'0');assert.equal(counterText(null,.5),'—');
assert.equal(counterText(50,-1,{digits:2}),'00');assert.equal(counterText(50,2),'50');
assert.notEqual(dialFrame(0).transform,dialFrame(1).transform);assert.equal(dialFrame(1).offset,'0');

// Exercise cancellation, reduced motion, theme holds and reopening with a deterministic clock.
const windowEvents=new EventTarget(),documentEvents=new EventTarget(),motionEvents=new EventTarget();
let sequence=0,frames=new Map(),instruments=[];
const preference={matches:false,addEventListener:motionEvents.addEventListener.bind(motionEvents)};
globalThis.window={matchMedia:()=>preference,addEventListener:windowEvents.addEventListener.bind(windowEvents)};
globalThis.document={hidden:false,documentElement:{dataset:{}},querySelectorAll:()=>instruments,addEventListener:documentEvents.addEventListener.bind(documentEvents)};
globalThis.requestAnimationFrame=fn=>{const id=++sequence;frames.set(id,fn);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
function instrument(){
 const node={textContent:'50',dataset:{countTo:'50',countFinal:'50',countDigits:'2',countSigned:'false'}};
 const pointer={transform:'',setAttribute(_,value){this.transform=value;}},arc={style:{}};
 return {node,pointer,arc,dataset:{},isConnected:true,querySelectorAll:()=>[node],querySelector:selector=>selector==='.dial-pointer'?pointer:arc};
}
function advance(time){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));}
function complete(){advance(0);advance(RESULT_MOTION_DURATION);}
const current=instrument();instruments=[current];
const motion=initializeResultMotion();motion.refresh();assert.equal(current.node.textContent,'00');
advance(0);advance(400);assert.ok(Number(current.node.textContent)>0&&Number(current.node.textContent)<50);
advance(RESULT_MOTION_DURATION);assert.equal(current.node.textContent,'50');assert.equal(frames.size,0);
document.documentElement.dataset.themeTransition='elements';windowEvents.dispatchEvent(new Event('kq:theme-change'));
assert.equal(current.node.textContent,'00');assert.equal(frames.size,0);
motion.refresh();assert.equal(frames.size,0,'Painting holds the incoming value at 00 instead of animating behind a frozen snapshot.');
delete document.documentElement.dataset.themeTransition;
windowEvents.dispatchEvent(new Event('kq:theme-settled'));complete();assert.equal(current.node.textContent,'50');
windowEvents.dispatchEvent(new Event('kq:theme-change'));windowEvents.dispatchEvent(new Event('kq:theme-change'));
windowEvents.dispatchEvent(new Event('kq:theme-settled'));complete();assert.equal(current.node.textContent,'50');
motion.refresh();preference.matches=true;motionEvents.dispatchEvent(new Event('change'));
assert.equal(current.node.textContent,'50');assert.equal(frames.size,0);
motion.refresh();assert.equal(current.node.textContent,'50');assert.equal(frames.size,0);
preference.matches=false;motion.refresh();document.hidden=true;documentEvents.dispatchEvent(new Event('visibilitychange'));
assert.equal(current.node.textContent,'50');assert.equal(frames.size,0);
document.hidden=false;documentEvents.dispatchEvent(new Event('visibilitychange'));assert.equal(current.node.textContent,'00');complete();
assert.equal(current.node.textContent,'50');
motion.refresh();windowEvents.dispatchEvent(new Event('beforeprint'));assert.equal(current.node.textContent,'50');assert.equal(frames.size,0);
console.log('Passed: truthful first-open/saved/sample/withheld states, immutable results, 00-to-age and pointer motion, theme holds, repeated selection, reduced motion, reopening and print completion.');
