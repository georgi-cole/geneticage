import assert from 'node:assert/strict';
import {sections,sampleAnswers,profileMeasurementErrors,profileBmi,profileWaistRatio,validateQuestionnaire} from './public/model.mjs';
import {accountEntry} from './public/account-entry.mjs';
import {questionContext,questionDestination,renderQuestionnaire,labErrorStep,renderLabForm} from './public/flow-ui.mjs';
import {renderAssessments,renderReportLibrary,renderRecordLibrary,renderAccount,pageSlice,resultInstrument} from './public/ui-components.mjs';
import {previousAssessment,profileProgress,profileSectionProgress} from './public/assessment-flow.mjs';
import {comparableHistory} from './public/assessment-history.mjs';

// Every applicable question is visited once, including conditional follow-ups.
for(const answers of [{age:'45'},sampleAnswers,{...sampleAnswers,smoking:'Used to smoke regularly',alcohol:'Yes'},{...sampleAnswers,smoking:'Smoke now',alcohol:'Yes'}]){
 const expected=sections.flatMap(s=>s.questions.filter(q=>!q.show||q.show(answers)).map(q=>q.id));
 const state={step:0,questionIndex:0,answers,view:'questionnaire'},visited=[];
 while(state.view==='questionnaire'){visited.push(questionContext(state).question.id);Object.assign(state,questionDestination(state));assert.ok(visited.length<=40);}
 assert.equal(state.view,'review');assert.deepEqual(visited,expected);
 state.view='questionnaire';const reverse=[];
 while(state.view==='questionnaire'){reverse.push(questionContext(state).question.id);Object.assign(state,questionDestination(state,-1));assert.ok(reverse.length<=40);}
 assert.equal(state.view,'consent');assert.deepEqual(reverse,[...expected].reverse());
}
assert.equal(labErrorStep({age:'Invalid'}),0);
assert.equal(labErrorStep({glucose:'Missing'}),1);
assert.equal(labErrorStep({crp:'Unit'}),2);
assert.equal(labErrorStep({wbc:'Missing'}),3);
assert.equal(labErrorStep({confirm:'Required'}),4);
const choiceState={step:5,questionIndex:1,answers:{},errors:{}};
const longQuestion=renderQuestionnaire(choiceState,question=>{
 assert.deepEqual(question.options,sections[5].questions[1].options.filter(answer=>answer!=='Prefer not to say'));
 assert.ok(question.options.includes('None'));
 return '';
});
assert.doesNotMatch(longQuestion,/More choices|Prefer not to say/);
assert.match(longQuestion,/data-action="skip"/);
const progress=profileProgress({age:'45',sex:'Prefer not to say',height:'175',conditions:['None'],nicotine:[],country:' '});
assert.equal(progress.answered,3);
assert.equal(profileSectionProgress({nicotine:['None']})[1].answered,1);
const entryState={answers:{},lab:{},errors:{},labAge:'45',labDate:'2026-11-01'};
const labMarkup=[1,2,3].map(labStep=>renderLabForm({...entryState,labStep},{})).join('');
assert.equal((labMarkup.match(/data-lab="/g)||[]).length,9,'All nine blood inputs appear exactly once across the entry steps.');
assert.match(resultInstrument({value:50,illustrative:true}),/>SAMPLE</,'Sample values never receive a personal-result badge.');
assert.deepEqual(pageSlice([1,2,3,4,5,6,7,8,9,10],99),{items:[9,10],page:1,pages:2});
assert.deepEqual(pageSlice([],0),{items:[],page:0,pages:1});
assert.equal(pageSlice([1,2,3],-1).page,0);
const guest={profile:null,history:[],loading:false,error:''};
assert.match(renderAssessments(guest),/data-action="start-labs"/);
assert.match(renderAssessments(guest),/data-action="start"/);
const history=[
 {id:'blood-fixture',saved:'2026-11-01T08:00:00Z',labSubmitted:true,value:45},
 {id:'fitness-fixture',saved:'2026-11-02T08:00:00Z',assessmentType:'fitness',method:'HUNT',value:null},
 {id:'heart-fixture',saved:'2026-11-03T08:00:00Z',assessmentType:'heart-vascular',model:'score2-v1',value:null},
];
const assessmentHistory=renderRecordLibrary({history});
assert.match(assessmentHistory,/Fitness/);
assert.match(assessmentHistory,/Heart & Vascular/);
assert.doesNotMatch(assessmentHistory,/data-action="offer-report"/,'Full reports are offered in Reports.');
assert.match(renderRecordLibrary({history,page:1}),/data-action="open-saved" data-id="blood-fixture">View result/);
const savedReports=renderRecordLibrary({history,reports:true});
assert.match(savedReports,/data-action="offer-report" data-id="fitness-fixture"><span>Full report/);
assert.match(savedReports,/data-action="offer-report" data-id="heart-fixture"><span>Full report/);
assert.match(savedReports,/data-action="offer-report" data-id="blood-fixture"><span>Full report/);
assert.doesNotMatch(savedReports,/data-action="library-page"/,'Three saved reports fit on one page.');
const estimate={model:'clinical-phenoage-2018-demo-v1',labFasting:'Yes',sample:false};
const comparisons=comparableHistory([
 {...estimate,value:48,labDate:'2026-09-01',saved:'2026-09-03T10:00:00Z'},
 {...estimate,value:49,labDate:'2026-09-01',saved:'2026-09-04T10:00:00Z'},
 {...estimate,value:55,labDate:'2026-10-01',saved:'2026-10-02T10:00:00Z',labFasting:'No'},
 {...estimate,value:44,labDate:'2026-10-01',saved:'2026-10-02T10:00:00Z',sample:true},
 {...estimate,value:47,labDate:'2026-11-01',saved:'2026-11-03T10:00:00Z'},
]);
assert.equal(comparisons.length,1);
assert.deepEqual(comparisons[0].points.map(({date,value})=>[date,value]),[['2026-09-01',49],['2026-11-01',47]]);
assert.match(renderReportLibrary(guest),/data-action="sample-report"/,'Reports are useful before an account exists.');
assert.match(renderReportLibrary({...guest,draft:{labSubmitted:true}}),/data-action="report"/,'The current assessment report stays reachable without saving.');
assert.match(renderReportLibrary({...guest,latest:history.at(-1)}),/data-action="offer-report" data-id="heart-fixture"[^>]*>.*>LATEST ASSESSMENT<.*>Heart & Vascular</s);
const kidneySample={id:'kidney-sample',assessmentType:'kidney',sample:true};
const kidneyPersonal={id:'kidney-personal',assessmentType:'kidney',sample:false};
assert.equal(previousAssessment([kidneySample],'kidney'),kidneySample,'A saved sample can open the restart choice.');
assert.equal(previousAssessment([kidneyPersonal,kidneySample],'kidney'),kidneyPersonal,'The personal assessment takes priority.');
assert.match(renderAccount(guest),/Sign in \/ Create account/);
assert.match(renderAccount({...guest,profile:{name:'Fictional user'}}),/Signed in/);
assert.match(renderAccount({...guest,profile:{name:'Fictional user'},needsHealthProfile:true,healthProfileProgress:34}),/Complete your health profile.*34%.*value="34"/s);
assert.doesNotMatch(renderAccount({...guest,profile:{name:'Fictional user'},needsHealthProfile:false}),/Complete your health profile/);
assert.doesNotMatch(accountEntry().body,/Continue with Apple|Continue with Google/);
const signIn=accountEntry({providers:['apple','google'],keepDraft:true}).body;
assert.match(signIn,/oauth\/apple\/start" target="_blank"/);
assert.match(signIn,/oauth\/google\/start" target="_blank"/);
assert.match(signIn,/<button[^>]+disabled>Send sign-in code/);
assert.match(accountEntry({stage:'social-register'}).body,/You’ll enter your health details separately/);
assert.doesNotMatch(accountEntry({stage:'social-register'}).body,/Start sign-in again/);
assert.deepEqual(Object.keys(profileMeasurementErrors({age:'45'})),['height','weight']);
assert.deepEqual(Object.keys(profileMeasurementErrors({age:'45',height:'175',weight:'-1'})),['weight']);
assert.equal(profileBmi({age:'45',height:'175',weight:'77'}).toFixed(1),'25.1');
assert.equal(profileBmi({age:'45',height:'70',heightUnit:'in',weight:'175',weightUnit:'lb'}).toFixed(1),'25.1');
const body={age:'45',height:'175',weight:'77',waist:'35',waistUnit:'in',compositionMethod:'Smart scale or bioimpedance',bodyFat:'23.5',skeletalMuscle:'40',bodyWater:'58'};
assert.equal(profileWaistRatio(body,profileBmi(body)).toFixed(2),'0.51');
assert.equal(profileWaistRatio({...body,context:['Pregnant']},profileBmi(body)),null);
assert.equal(profileWaistRatio({...body,weight:'110'},profileBmi({...body,weight:'110'})),null);
assert.deepEqual(validateQuestionnaire(body),{});
assert.ok(validateQuestionnaire({...body,bodyFat:'101'}).bodyFat);
assert.equal(profileProgress({...body,compositionMethod:undefined}).answered,4,'Unshown composition fields do not count.');
assert.match(renderAccount({...guest,error:'Connection timed out'}),/data-action="refresh-account"/);
assert.match(renderAccount({...guest,profile:{name:'<img onerror=alert(1)>'}}),/&lt;img/);
console.log('Passed: forward/back conditional question traversal, lab error routing, record pagination, distinct report/account screens and safe profile rendering.');
