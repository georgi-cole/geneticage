/**
 * Refine the reader's chapters after the existing interpretation and safety rules
 * select them. Keep the selected claims' sources and recorded inputs attached.
 */
export function refineClinicalChapters(chapter,{phrase,paragraph,record,derivedFacts,fasting,assay,glucoseQuiet,sleepConcern,rested,moderate,vigorous,strength,portions,limited}){
 const read=id=>record.find(row=>row.id==='lab.'+id);
 const inside=id=>read(id)?.comparison?.value==='within';
 const edit=(id,blockId,key,{title,values,sources}={})=>{
  const block=chapter(id)?.blocks.find(item=>item.id===blockId);
  if(!block)return;
  block.text=phrase(key,values);
  if(title)block.title=phrase(title);
  if(sources)block.sources=sources;
 };
 const omit=(id,...ids)=>{
  const item=chapter(id);
  if(item)item.blocks=item.blocks.filter(block=>!ids.includes(block.id));
 };

 if(fasting==='Yes')edit('glucose','biology','clinicalGlucoseFasting');
 edit('glucose','wellbeing','clinicalGlucoseRelevance');
 edit('glucose','a1c','clinicalGlucoseA1c',{title:'clinicalGlucoseOverTime',sources:['a1c','glucose-followup']});
 omit('glucose','companions');
 if(glucoseQuiet)omit('glucose','wellbeing','a1c');

 edit('prevention','study-fit','clinicalStudyFit');
 edit('prevention','dpp','clinicalDpp');
 edit('prevention','strride','clinicalStrride');
 edit('prevention','purpose','clinicalProgramQuestion');
 const bmi=derivedFacts.find(fact=>fact.id==='derived.bmi');
 if(bmi){
  edit('prevention','medicines','clinicalMedicationBmi',{title:'clinicalMedicationContext',values:{bmi:bmi.value}});
  omit('prevention','body-context');
 }

 const plan=chapter('starting-plan');
 if(chapter('prevention'))edit('starting-plan','clarify-glucose','clinicalPlanPriority',{title:'clinicalPlanPriorityTitle'});
 if(plan?.blocks.some(block=>block.id==='baseline-step')&&moderate>0){
  const extra=Math.min(30,Math.max(0,150-moderate-2*vigorous));
  edit('starting-plan','baseline-step','clinicalPlanStart',{values:{baseline:moderate,extra:Number(extra.toFixed(2)),next:Number((moderate+extra).toFixed(2))}});
 }
 edit('starting-plan','example-not-prescription','clinicalPlanExample');
 edit('starting-plan','review-step','clinicalPlanReviewText');
 if(strength===null||strength<2)edit('starting-plan','build-step','clinicalPlanBuild');
 edit('starting-plan','adapt',limited?'clinicalPlanLimit':'movementUnknown');
 if(limited)omit('starting-plan','maintain-activity');
 else edit('starting-plan','maintain-activity','clinicalPlanKeep');
 if(portions&&portions!=='Not sure')edit('nutrition','diet-baseline','clinicalMealText',{title:'clinicalMeal',values:{portions}});
 if(record.some(row=>row.id==='answers.height'&&row.unit)&&record.some(row=>row.id==='answers.weight'&&row.unit)){
  edit('nutrition','weight','clinicalWeightText');
 }else omit('nutrition','weight');

 if(sleepConcern){
  edit('sleep','meaning','clinicalSleepMeaning');
  edit('sleep','diary','clinicalSleepDiary');
  edit('sleep','cbti','clinicalSleepTreatment',{sources:['insomnia','apnea']});
  omit('sleep','apnea');
 }else if(rested==='Usually'){
  edit('sleep','meaning','clinicalSleepWell',{title:'clinicalSleepMaintain'});
  omit('sleep','sleep-baseline');
 }

 edit('immune','biology','clinicalImmuneBiology');
 edit('immune','context','clinicalImmuneContext');
 const count=derivedFacts.find(fact=>fact.id==='derived.absolute-lymphocytes');
 if(count)edit('immune','absolute-count','clinicalImmuneCalculation',{values:{count:count.value}});
 omit('immune','action');

 if(!assay)edit('crp','assay','clinicalCrpNoAssay');
 edit('crp','biology','clinicalCrpMeaning');
 edit('crp','companions','clinicalCrpNext');
 omit('crp','action','timing');

 edit('albumin','biology','clinicalAlbuminMeaning');
 if(inside('albumin')){
  edit('albumin','action','clinicalAlbuminQuiet');
  omit('albumin','companions');
 }
 edit('kidney','biology','clinicalCreatinineMeaning');
 edit('kidney','companions','clinicalCreatinineNext');
 omit('kidney','chronicity');

 edit('redcells','meaning','clinicalRedCellMeaning');
 edit('redcells','companions','clinicalRedCellNext');
 omit('redcells','action');
 edit('alp','biology','clinicalAlpMeaning');
 if(inside('alp'))edit('alp','action','clinicalAlpQuiet');
 omit('alp','companions');

 // The table carries the next actions. The callout gives the conversation a goal.
 const follow=chapter('follow-up');
 if(follow){
  const withGlucose=plan?.blocks.some(block=>block.id==='clarify-glucose');
  follow.blocks.push(paragraph('visit-question',phrase(withGlucose?'clinicalVisitGlucose':'clinicalVisitOther'),[],'aside',phrase('clinicalVisitPrompt')));
 }
}
