import {FAMILY_EDUCATION,FAMILY_EDUCATION_VERSION} from './report-knowledge/family-education.mjs';
import {KNOWLEDGE_MODULES} from './report-knowledge/modules.mjs';
import {addResultInterpretations,RESULT_INTERPRETATION_VERSION} from './report-result-interpretation.mjs';

// Select education from facts already validated by the assessment. This layer
// supplies explanations and planning examples, without setting clinical cutoffs.
export function expandFamilyEducation(document,context,{add,pages,existing,reading,block,paragraph,phrase,freezeText,joinText}){
 const {type,resultState}=document;
 const {inputs,answers,critical,established,limited,sleepConcern,routineKnown,knownDiabetes,specialContext}=context;
 if(critical)return;
 const ready=resultState==='ready',profile=type==='health-profile';
 const completeProfile=profile&&document.coverage?.questions?.answered>=8;
 const activityLimited=limited||specialContext||type==='fitness'&&inputs.fitnessContext!=='None of these';
 const activityMinutesKnown=type==='fitness'?!!reading('moderate')&&!!reading('vigorous'):answers.moderate!==undefined&&answers.vigorous!==undefined;
 const entry=(id,key,sources=[])=>block(id,key,sources);
 const feature=(id,{intro=[],highlights=[]}={})=>{
  const item=FAMILY_EDUCATION[id];
  add('learn-'+id,item.title,{literal:true,lead:[...intro,...item.blocks.map(b=>paragraph(b.id,b.text,b.sources,b.kind,b.title))],highlights});
  pages.at(-1).lesson=true;
 };
 const addModule=(id,title,blocks)=>{
  add(id,title,{lead:blocks});
  pages.at(-1).lesson=true;
 };
 const activityKey=activityLimited?'educationAdapt':
  established?'educationActive':activityMinutesKnown&&(routineKnown||type==='fitness')?'educationStarter':'educationUnknownActivity';
 const activityIntro=()=>[entry('activity-context',activityKey,['activity'])];
 const smoker=['Yes','Every day','Some days','Current smoker','Smoke now'].includes(inputs.smoking||answers.smoking);
 // Replace the short v1 summaries with complete features. The original opening
 // retains the case priority, recorded values and any eligibility explanation.
 pages.splice(1);
 addResultInterpretations(document,context,{add,pages,reading,paragraph,phrase,freezeText,joinText});

 if(!ready&&!profile){
  const explanations={
   'heart-vascular':['pressure','lipids'],metabolic:['metabolic-biology','glucose-tests'],
   kidney:['kidney-work','filtration','urine'],fitness:['fitness-oxygen','fitness-test'],
  };
  for(const id of explanations[type])feature(id);
  return;
 }

 if(type==='heart-vascular'){
  if(reading('systolic')){
   feature('pressure',{intro:[entry('pressure-context',context.review.pressureFollowUp?'educationHeartRaised':'educationHeartMaintain',['esc-blood-pressure'])]});
   feature('home-pressure');
  }
  if(['total','hdl','apob','lpa'].some(reading))feature('lipids');
  if(reading('apob')||reading('lpa'))feature('advanced-lipids');
  if(reading('cfpwv'))feature('arterial-wave');
  if(reading('hba1c')||reading('glucose'))feature('glucose-tests');
  if(reading('egfr'))addModule('heart-kidney-context','educationHeartKidneyTitle',[
   entry('heart-kidney','educationHeartKidneyText',['score2-diabetes','kidney-tests']),
   paragraph('egfr-meaning',FAMILY_EDUCATION.filtration.blocks[0].text,['ckd-epi-2021','kidney-context']),
  ]);
  feature('heart-food');
  feature('aerobic',{intro:activityIntro()});
 }else if(type==='metabolic'){
  addModule('model-context','metabolicShape',[
   block('model-inputs','metabolicShapeText',['gdrs']),
   ...existing('metabolic').blocks,
  ]);
  feature('metabolic-biology');
  feature('glucose-tests',{
   intro:[entry('glucose-context',reading('glucose')||reading('hba1c')?'educationGlucosePresent':'educationNoGlucose',['glucose-followup'])],
  });
  feature('metabolic-food');
  feature('metabolic-movement');
  if(!knownDiabetes&&!specialContext){
   addModule('prevention-research','educationTrialTitle',[
    entry('trial-fit','educationTrialContext',['dpp']),
    ...KNOWLEDGE_MODULES.prevention.blocks.filter(b=>['dpp','purpose'].includes(b.id)).map(b=>paragraph(b.id,b.text,b.sources,b.kind,b.title)),
   ]);
   feature('fasting');
  }
 }else if(type==='kidney'){
  feature('kidney-work');
  feature('filtration',{
   intro:reading('cystatin')?[entry('combined-context','kidneyCystatinText',['ckd-epi-2021'])]:[],
  });
  feature('urine',{intro:[entry('urine-context',reading('acr')?'educationKidneyUrineKnown':'educationKidneyUrineMissing',['kidney-tests'])]});
  feature('kidney-care');
  feature('kidney-food');
  feature('aerobic',{intro:activityIntro()});
 }else if(type==='fitness'){
  feature('fitness-oxygen',{intro:[entry('capacity-context',context.result.method==='FRIEND'?'educationFitnessMeasured':'educationFitnessEstimate',document.sourceIds)]});
  feature('fitness-test');
  if(activityLimited)addModule('adapted-movement','fitnessRoutineFeature',[entry('adapt','educationAdapt',['activity'])]);
  else{
   feature('aerobic',{intro:activityIntro()});
   feature('strength');
  }
  feature('fuel');
  feature('recovery');
 }else{
  feature('recovery');
  if(sleepConcern)feature('sleep-routine');
  if(completeProfile){
   feature('daily-food');
   if(context.safeRoutine&&!limited&&!specialContext){
    feature('aerobic',{intro:activityIntro()});
    feature('strength');
   }
   if(limited)addModule('adapted-movement','fitnessRoutineFeature',[
    entry('adapt','educationAdapt',['activity']),
    ...KNOWLEDGE_MODULES.movement.blocks.filter(b=>b.id!=='progress').map(b=>paragraph(b.id,b.text,b.sources,b.kind,b.title)),
   ]);
   if(['Often','Almost every day'].includes(answers.stress))feature('stress-routine');
  }
  feature('everyday-measures');
 }
 if(smoker){
  const tobacco=existing('tobacco');
  if(tobacco)addModule('tobacco-support','educationTobaccoTitle',tobacco.blocks);
 }
 if(profile&&answers.alcohol==='Yes'){
  const alcohol=existing('alcohol');
  if(alcohol)addModule('alcohol-pattern','educationAlcoholTitle',alcohol.blocks);
 }
 if(ready||completeProfile){
  const plan=activityLimited?'educationAdapt':type==='health-profile'?(sleepConcern?'educationProfileSleepPlan':smoker?'educationHeartPlan':
   established?'educationActive':'educationProfilePlan'):
   { 'heart-vascular':'educationHeartPlan',metabolic:'educationMetabolicPlan',kidney:'educationKidneyPlan',fitness:'educationFitnessPlan'}[type];
  const activityPlan=type==='fitness'||profile&&routineKnown&&!sleepConcern&&!smoker;
  const example=activityPlan&&activityMinutesKnown&&!activityLimited?entry('routine-example',established?'educationMaintainExample':'educationBeginnerExample',['adult-activity']):null;
  feature('habit-plan',{intro:[entry('case-plan',plan,[]),...(example?[example]:[])]});
 }
}

export {FAMILY_EDUCATION_VERSION,RESULT_INTERPRETATION_VERSION};
