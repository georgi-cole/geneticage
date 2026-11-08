import assert from 'node:assert/strict';
import {sections,sampleAnswers} from './public/model.mjs';
import {questionContext,questionChoices,questionDestination,labErrorStep,renderLabForm} from './public/flow-ui.mjs';
import {renderAssessments,renderReportLibrary,renderRecordLibrary,renderAccount,pageSlice,resultInstrument} from './public/ui-components.mjs';

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
const choiceState={step:5,questionIndex:1,answers:{},optionPage:0,choiceCapacity:6};
const first=questionChoices(choiceState),second=questionChoices({...choiceState,optionPage:1});
assert.equal(first.pages,2);assert.equal(first.question.options.length,6);
assert.deepEqual([...first.question.options,...second.question.options],sections[5].questions[1].options,'Paging must preserve every answer option, including exclusive responses.');
assert.equal(questionChoices({...choiceState,optionPage:99}).page,1);
assert.equal(questionChoices({...choiceState,choiceCapacity:undefined}).pages,1,'Show all choices when the viewport can hold them.');
const entryState={answers:{},lab:{},errors:{},labAge:'45',labDate:'2026-11-01'};
const labMarkup=[1,2,3].map(labStep=>renderLabForm({...entryState,labStep},{})).join('');
assert.equal((labMarkup.match(/data-lab="/g)||[]).length,9,'All nine blood inputs appear exactly once across the entry steps.');
assert.match(resultInstrument({value:50,illustrative:true}),/>SAMPLE</,'Sample values never receive a personal-result badge.');
assert.deepEqual(pageSlice([1,2,3,4,5],99),{items:[5],page:2,pages:3});
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
assert.doesNotMatch(assessmentHistory,/data-action="open-(report|saved)"/,'System histories show summaries, with detailed reports in Reports.');
assert.match(renderRecordLibrary({history,page:1}),/data-action="open-saved" data-id="blood-fixture">View result/);
const savedReports=renderRecordLibrary({history,reports:true});
assert.match(savedReports,/data-action="open-report" data-id="fitness-fixture">Read report/);
assert.match(savedReports,/data-action="open-report" data-id="heart-fixture">Read report/);
assert.match(renderReportLibrary(guest),/data-action="sample-report"/,'Reports are useful before an account exists.');
assert.match(renderReportLibrary({...guest,assessment:true}),/data-action="report"/,'The current assessment report stays reachable without saving.');
assert.match(renderAccount(guest),/Sign in \/ Create account/);
assert.match(renderAccount({...guest,profile:{name:'Fictional user'}}),/Signed in with email/);
assert.match(renderAccount({...guest,error:'Connection timed out'}),/data-action="refresh-account"/);
assert.match(renderAccount({...guest,profile:{name:'<img onerror=alert(1)>'}}),/&lt;img/);
console.log('Passed: forward/back conditional question traversal, lab error routing, record pagination, distinct report/account screens and safe profile rendering.');
