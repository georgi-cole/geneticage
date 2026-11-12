import {heartDecimal,heartMeasurements} from './heart-measurements.mjs';
import {sleepReference} from './model.mjs';

export const RESULT_INTERPRETATION_VERSION='2026-11-11-personal-results-v1';

// Preserve limits as intervals. A result such as <12 is never replaced by 12.
export function measurementBounds(entry,factor=1){
 const value=heartDecimal(entry?.value,true);
 if(value===null)return null;
 const qualifier=/^[<>≤≥]/.test(value)?value[0]:'';
 const number=Number(qualifier?value.slice(1):value)*factor;
 if(!Number.isFinite(number)||number<0||number===0&&qualifier==='<')return null;
 return {low:['<','≤'].includes(qualifier)?0:number,high:['>','≥'].includes(qualifier)?Infinity:number,
  lowOpen:qualifier==='>',highOpen:qualifier==='<',qualifier};
}

export function boundedCategory(bounds,low,high,{highExclusive=false}={}){
 if(!bounds)return 'unknown';
 if(bounds.high<low||bounds.high===low&&bounds.highOpen)return 'low';
 const above=highExclusive?bounds.low>high||bounds.low===high&&bounds.lowOpen:bounds.low>=high;
 if(above)return 'high';
 const below=highExclusive?bounds.high<=high:bounds.high<high||bounds.high===high&&bounds.highOpen;
 return bounds.low>=low&&below?'middle':'unknown';
}

const exact=entry=>{
 const value=heartDecimal(entry?.value);
 return value===null?null:Number(value);
};

/** Add interpretations to a new, validated snapshot. Reference flags come from
 * the existing review. Clinical bands remain separately attributed comparisons. */
export function addResultInterpretations(document,context,{add,pages,reading,paragraph,phrase,freezeText,joinText}){
 const {type}=document;
 const {inputs,answers,result,review,critical,limited,specialContext,knownDiabetes,derivedFacts}=context;
 if(critical)return;
 const text=(id,key,values={},sources=[],title)=>paragraph(id,phrase(key,values),sources,'context',title?phrase(title):'');
 const reference=id=>{
  const row=reading(id),comparison=row?.comparison,p=comparison?.provenance;
  if(!row)return [];
  const recorded=phrase('resultReading',{label:row.label,value:row.value,unit:row.unit});
  const status=comparison?.value;
  if(!['above','below','within'].includes(status)||p?.low==null&&p?.high==null){
   const explanation=phrase(measurementBounds(inputs[id])?.qualifier?'resultRefLimit':'resultRefUnknown');
   return [paragraph('result-'+id,joinText([recorded,explanation]),[])];
  }
  const unit=comparison.unit||p.unit||row.unit;
  const range=p.low!=null&&p.high!=null?phrase('resultRangeBoth',{low:p.low,high:p.high,unit,lowOp:p.lowExclusive?'>':'≥',highOp:p.highExclusive?'<':'≤'}):
   p.low!=null?phrase('resultRangeLower',{low:p.low,unit,op:p.lowExclusive?'>':'≥'}):phrase('resultRangeUpper',{high:p.high,unit,op:p.highExclusive?'<':'≤'});
  const origin=phrase(row.reference||p.sourceKind==='lab'?'resultLabOrigin':'resultGuideOrigin');
  const parts=[recorded];
  if(unit!==row.unit){
   const amount=exact(inputs[id]),field=heartMeasurements.find(field=>field.id===id);
   const converted=Number.isFinite(p.comparisonValue)?p.comparisonValue:
    amount!==null&&field?.factor?amount*field.factor(row.unit)/field.factor(unit):null;
   if(Number.isFinite(converted))parts.push(phrase('resultComparisonUnits',{value:Number(converted.toPrecision(6)),unit}));
  }
  const guide={hba1c:'a1c',acr:'kdigo-ckd',cystatin:'cystatin-reference'}[id]||'adult-intervals';
  const explanation=phrase({above:'resultRefAbove',below:'resultRefBelow',within:'resultRefWithin'}[status],{range,origin});
  return [paragraph('result-'+id,joinText([...parts,explanation]),p.sourceKind==='published'?[guide]:[])];
 };
 const section=(id,title,blocks,markers=[])=>{
  const selected=blocks.filter(Boolean);
  if(!selected.length)return;
  const factIds=markers.map(marker=>reading(marker)?.id).filter(Boolean);
  add('case-'+id,title,{eyebrow:'resultEyebrow',lead:selected.map(block=>({...block,factIds})),highlights:[]});
  pages.at(-1).lesson=true;
  pages.at(-1).interpretation=true;
 };
 const derived=(id,label,value,unit,formula,inputIds)=>{
  if(!derivedFacts.some(fact=>fact.id===id))derivedFacts.push({id,label:phrase(label),value,unit,formula:phrase(formula),inputIds,kind:'calculated'});
 };
 const lipidRepeat=()=>text('lipid-repeat','resultLipidRepeat',{},['lipid-followup'],'resultTiming');

 if(type==='heart-vascular'){
  if(reading('systolic')){
   const systolic=exact(inputs.systolic),diastolic=exact(inputs.diastolic);
   const elevated=systolic>=120||diastolic!==null&&diastolic>=70;
   section('pressure','resultPressureTitle',[
    text('pressure-value','resultReading',{label:reading('systolic').label,value:reading('systolic').value,unit:'mmHg'}),
    reading('diastolic')?text('diastolic-value','resultReading',{label:reading('diastolic').label,value:reading('diastolic').value,unit:'mmHg'}):null,
    text('pressure-meaning',systolic===null?'resultDataCheck':review.pressureFollowUp?'resultPressureRaised':elevated?'resultPressureElevated':'resultPressureLower',{},['esc-blood-pressure'],'resultMeaning'),
    text('pressure-setting','resultPressureSetting',{},['bp-confirmation']),
    text('pressure-context','resultPressureCare',{},['esc-blood-pressure'],'resultTogether'),
    text('pressure-action','resultPressureAction',{},['dash-eating','bp-confirmation'],'resultAction'),
   ],['systolic','diastolic']);
  }
  if(reading('total')||reading('hdl')){
   const lipidBlocks=[...reference('total'),...reference('hdl')];
   const normalise=id=>{
    const value=exact(inputs[id]);
    return value===null?null:value*heartMeasurements.find(field=>field.id===id).factor(inputs[id].unit);
   };
   const total=normalise('total'),hdl=normalise('hdl');
   if(total!==null&&hdl!==null&&total>hdl){
    const value=Number((total-hdl).toFixed(2));
    derived('derived.non-hdl','resultDerivedNonHdl',value,'mmol/L','resultNonHdlFormula',[reading('total').id,reading('hdl').id]);
    lipidBlocks.push(text('non-hdl','resultNonHdl',{value},['lipid-tests']));
   }
   section('lipids','resultLipidTitle',[...lipidBlocks,
    text('lipid-goal','resultLipidContext',{},['lipid-followup'],'resultMeaning'),
    text('lipid-action','resultLipidAction',{},['cholesterol-treatment','lipid-followup'],'resultAction'),lipidRepeat(),
   ],['total','hdl']);
  }
  if(reading('apob')){
   const entry=inputs.apob,bounds=['g/L','mg/dL'].includes(entry.unit)?measurementBounds(entry,entry.unit==='g/L'?100:1):null;
   const valid=bounds&&!(bounds.low===0&&bounds.high===0);
   const below=valid&&(bounds.high<90||bounds.high===90&&bounds.highOpen);
   const key=!valid?'resultDataCheck':bounds.low>=90?'resultApoBHigher':below?'resultApoBLower':'resultApoBUncertain';
   const amount=exact(entry);
   section('apob','resultApoBTitle',[...reference('apob'),
    valid&&amount!==null&&entry.unit==='g/L'&&reading('apob').comparison?.unit!=='mg/dL'?text('apob-units','resultApoBUnits',{value:Number((amount*100).toPrecision(12))}):null,
    text('apob-goal',key,{},['apob-consensus'],'resultMeaning'),
    ...(valid?[
     text('apob-context','resultApoBTogether',{},['apob-consensus'],'resultTogether'),
     text('apob-action','resultApoBAction',{},['cholesterol-treatment','apob-consensus'],'resultAction'),lipidRepeat(),
    ]:[]),
   ],['apob','total','hdl']);
  }
  if(reading('lpa')){
   const entry=inputs.lpa,units={'mg/dL':[30,50],'nmol/L':[75,125]},thresholds=units[entry.unit];
   const bounds=thresholds?measurementBounds(entry):null;
   const valid=bounds&&!(bounds.low===0&&bounds.high===0);
   const category=valid?boundedCategory(bounds,...thresholds):'unknown';
   const [low,high]=thresholds||['?','?'];
   const apo=inputs.apob,apoBounds=apo&&['g/L','mg/dL'].includes(apo.unit)?measurementBounds(apo,apo.unit==='g/L'?100:1):null;
   const apoHigher=apoBounds?.low>=90,apoLower=apoBounds&&(apoBounds.high<90||apoBounds.high===90&&apoBounds.highOpen);
   const bridge=category==='low'&&apoHigher?'resultLpaApoBHigher':category==='high'&&apoHigher?'resultLpaApoBBoth':category==='high'&&apoLower?'resultLpaApoBLower':null;
   section('lpa','resultLpaTitle',[...reference('lpa'),
    text('lpa-meaning',!valid?'resultDataCheck':{low:'resultLpaLow',middle:'resultLpaMiddle',high:'resultLpaHigh',unknown:'resultLpaUncertain'}[category],{low,high,unit:entry.unit},['lpa-nla-2024'],'resultMeaning'),
    valid&&bounds.qualifier?text('lpa-bound','resultLpaBound',{value:entry.value,unit:entry.unit},['lpa-nla-2024']):null,
    bridge?text('lpa-apo-context',bridge,{},['apob-consensus','lpa-nla-2024'],'resultTogether'):null,
    ...(valid?[
     text('lpa-action','resultLpaAction',{},['lpa-nla-2024','lpa-consensus'],'resultAction'),
     text('lpa-repeat','resultLpaRepeat',{},['lpa-repeat'],'resultTiming'),
    ]:[]),
   ],['lpa','apob']);
  }
  if(reading('cfpwv'))section('arterial','resultArterialTitle',[
   text('arterial-result','resultArterial',{value:inputs.cfpwv.value},['arterial-reference'],'resultMeaning'),
   text('arterial-follow','resultArterialFollow',{},['arterial-reference'],'resultTiming'),
  ],['cfpwv']);
 }

 const glucoseRows=['glucose','hba1c'].filter(id=>reading(id));
 if(glucoseRows.length){
  const blocks=[];let raised=false,clarify=false,care=false,previousKey;
  for(const id of glucoseRows){
   const entry=inputs[id],value=exact(entry);
   const percent=entry.unit==='%',mmol=entry.unit==='mmol/L';
   const lower=id==='hba1c'?(percent?5.7:39):(mmol?5.6:100);
   const upper=id==='hba1c'?(percent?6.5:48):(mmol?7:126);
   const low=id==='hba1c'?(percent?4:(4-2.152)/.09148):(mmol?3.9:70);
   const known=knownDiabetes||specialContext;
   care ||= known;
   const key=value===null?'resultDataCheck':known?'resultGlucoseKnown':value<low?(id==='hba1c'?'resultA1cLow':'resultGlucoseLow'):
    value>=upper?'resultGlucoseReview':value>=lower?'resultGlucoseRaised':'resultGlucoseLower';
   raised ||= !known&&value!==null&&value>=lower;
   clarify ||= known||value===null||value<low||value>=upper;
   const agrees=previousKey===key&&['resultGlucoseLower','resultGlucoseRaised','resultGlucoseReview'].includes(key);
   blocks.push(...reference(id),text('meaning-'+id,agrees?'resultGlucoseAgreement':key,{lower,upper,unit:entry.unit},['a1c','glucose-diagnosis',...(value<low?['hypoglycemia']:[])],agrees?null:'resultMeaning'));
   previousKey=key;
  }
  blocks.push(text('glucose-context','resultGlucoseTogether',{},['a1c','glucose-followup'],'resultTogether'));
  if(!clarify){
   if(raised)blocks.push(text('glucose-action','resultGlucoseAction',{},['insulin-exercise','prediabetes-living'],'resultAction'));
   blocks.push(text('glucose-repeat',raised?'resultGlucoseRepeat':'resultGlucoseMaintainRepeat',{},['glucose-followup','a1c'],'resultTiming'));
  }
  // A diagnostic-range or low result already calls for clarification above.
  if(care)blocks.push(text('glucose-care-repeat','resultGlucoseCareRepeat',{},['a1c'],'resultTiming'));
  section('glucose','resultGlucoseTitle',blocks,glucoseRows);
 }

 if(type==='metabolic'&&reading('waist')&&reading('activity'))section('metabolic-inputs','resultMetabolicInputsTitle',[
  text('metabolic-inputs','resultMetabolicInputs',{waist:inputs.waist.value,unit:inputs.waist.unit,hours:inputs.activity.value},['gdrs']),
  text('metabolic-direction','resultMetabolicDirection',{},['gdrs','gdrs-coefficients'],'resultMeaning'),
 ],['waist','activity']);

 const egfr=type==='kidney'?review.egfr:exact(inputs.egfr);
 if(type==='kidney'||reading('egfr')){
  const blocks=[...reference('creatinine'),...reference('cystatin')];
  const stable=type!=='kidney'||inputs.kidneyContext==='Stable health'&&!['Kidney transplant','Receiving dialysis'].includes(inputs.kidneyHistory);
  if(type==='heart-vascular'&&Number.isFinite(egfr))blocks.push(text('reported-egfr','resultHeartEgfr',{value:egfr},['kidney-context']));
  if(!stable)blocks.push(text('filtration-context','resultKidneyContextReview',{label:inputs.kidneyContext||''},['kdigo-ckd','kidney-context'],'resultMeaning'));
  if(stable&&Number.isFinite(egfr))blocks.push(text('filtration',egfr>=90?'resultKidneyPreserved':egfr>=60?'resultKidneyMild':'resultKidneyLower',{value:Number(egfr.toFixed(1))},['kdigo-ckd'],'resultMeaning'));
  if(reading('creatinine'))blocks.push(text('creatinine-context','resultCreatinineContext',{},['creatinine-explained','kidney-context'],'resultTogether'));
  if(stable&&Number.isFinite(review.egfrCombined))blocks.push(text('combined-estimate','resultCystatinContext',{value:Number(review.egfrCombined.toFixed(1))},['ckd-epi-2021']));
  if(blocks.length){
   if(stable)blocks.push(text('kidney-action','resultKidneyAction',{},['kidney-management','kidney-food'],'resultAction'));
   blocks.push(text('kidney-repeat','resultKidneyRepeat',{},['kdigo-ckd'],'resultTiming'));
   section('kidney','resultKidneyTitle',blocks,['creatinine','cystatin','egfr']);
  }
 }
 if(type==='kidney'&&reading('acr')){
  const entry=inputs.acr,thresholds=entry.unit==='mg/g'?[30,300]:[3,30];
  const category=boundedCategory(measurementBounds(entry),...thresholds,{highExclusive:true});
  section('urine','resultUrineTitle',[...reference('acr'),
   text('urine-meaning',{low:'resultAcrLow',middle:'resultAcrMiddle',high:'resultAcrHigh',unknown:'resultAcrUncertain'}[category],{low:thresholds[0],high:thresholds[1],unit:entry.unit},['kdigo-ckd'],'resultMeaning'),
   category==='low'?null:text('urine-repeat','resultAcrRepeat',{},['kidney-tests','albumin-urine'],'resultTiming'),
  ],['acr']);
 }

 if(type==='fitness'||type==='health-profile'){
  const moderate=exact({value:answers.moderate??inputs.moderate?.value});
  const vigorous=exact({value:answers.vigorous??inputs.vigorous?.value});
  const blocks=[];
  if(type==='fitness'){
   const capacity=result.method==='FRIEND'?exact(inputs.vo2peak):review.estimatedVo2;
   blocks.push(text('fitness-value',Number.isFinite(capacity)?'resultFitnessMeasure':'resultFitnessUnknown',{value:Number.isFinite(capacity)?Number(capacity.toFixed(1)):'',method:result.method||''},document.sourceIds,'resultMeaning'));
  }
  if(moderate!==null&&vigorous!==null){
   const equivalent=moderate+2*vigorous;
   const prefix=type==='health-profile'?'answers.':'fitness.inputs.';
   derived('derived.aerobic-equivalent','resultDerivedActivity',equivalent,'min / week','resultActivityFormula',[prefix+'moderate',prefix+'vigorous']);
   blocks.push(text('activity-value','resultActivityNumbers',{moderate,vigorous,equivalent},['activity']));
   const adapted=limited||specialContext||type==='fitness'&&inputs.fitnessContext!=='None of these';
   blocks.push(text('activity-direction',adapted?'resultActivityAdapt':equivalent>=150?'resultActivityMet':'resultActivityBelow',{},['activity'],'resultAction'));
  }
  if(blocks.length){
   blocks.push(text('activity-repeat',type==='fitness'?'resultFitnessRepeat':'resultHabitsRepeat',{},['activity'],'resultTiming'));
   section('activity',type==='fitness'?'resultFitnessTitle':'resultActivityTitle',blocks);
  }
  const habitBlocks=[];
  if(type==='health-profile'){
   const hours=exact({value:answers.sleep});
   if(hours!==null)habitBlocks.push(text('sleep-value',hours<7?'resultSleepShort':'resultSleepRested',{hours,reference:sleepReference(answers.age)},['sleep'],'resultMeaning'));
   if(['Sometimes','Rarely'].includes(answers.rested))habitBlocks.push(text('restedness','resultSleepUnrested',{},['sleep','apnea']));
   const days=exact({value:answers.strength});
   if(days!==null&&!limited&&!specialContext)habitBlocks.push(text('strength-value',days>=2?'resultStrengthMet':'resultStrengthBelow',{days},['activity']));
   if(['0','1–2','3–4','5 or more'].includes(answers.diet))habitBlocks.push(text('diet-value',answers.diet==='5 or more'?'resultDietMet':'resultDietBelow',{portions:answers.diet},['diet']));
  }
  if(habitBlocks.length){
   habitBlocks.push(text('routine-repeat','resultHabitsRepeat',{},['activity','sleep'],'resultTiming'));
   section('habits','resultHabitsTitle',habitBlocks);
  }
 }
 // Labels/formulas added here also belong to the frozen translation record.
 for(const fact of derivedFacts){freezeText(fact.label);freezeText(fact.formula);}
}
