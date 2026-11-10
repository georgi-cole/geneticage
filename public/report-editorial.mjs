import {composeClinicalFolio} from './report-clinical.mjs';
import {CLINICAL_COPY} from './report-knowledge/clinical-copy.mjs';
import {KNOWLEDGE_MODULES,KNOWLEDGE_VERSION} from './report-knowledge/modules.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';
import {EVIDENCE_VERSION,evidenceSnapshot} from './report-knowledge/sources.mjs';
import {sections} from './model.mjs';
import {labs} from './lab-definitions.mjs';
import {systemField} from './system-assessments.mjs';
import {translateText} from './language-system.mjs';

export const EDITORIAL_VERSION='personal-science-v2';
export const REPORT_LAYOUT_VERSION='editorial-2026-11-10';
export const ASSESSMENT_SIGNATURES=Object.freeze({
 'clinical-phenoage':{key:'clinical',accent:'#803E4B',pale:'#F2E8E8',motif:'cells'},
 'health-profile':{key:'profile',accent:'#8A622B',pale:'#F4EEDF',motif:'paths'},
 'heart-vascular':{key:'heart',accent:'#9C4A38',pale:'#F5E9E4',motif:'branches'},
 metabolic:{key:'metabolic',accent:'#617244',pale:'#EDF0E4',motif:'bands'},
 kidney:{key:'kidney',accent:'#285D64',pale:'#E5EFED',motif:'layers'},
 fitness:{key:'fitness',accent:'#355B92',pale:'#E9EDF5',motif:'contours'},
});
const copy=value=>JSON.parse(JSON.stringify(value));
const exact=value=>typeof value==='number'?Number.isFinite(value):typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim());
const number=value=>exact(value)?Number(value):null;
const present=value=>value!==undefined&&value!==null&&value!=='';
const round=(value,digits=1)=>String(Number(value.toFixed(digits)));
const has=(value,item)=>Array.isArray(value)&&value.includes(item);
const uncertainty=value=>['Not sure','Prefer not to say','Not recorded'].includes(value);
const valueLabel=value=>Array.isArray(value)?value.map(v=>typeof v==='object'?JSON.stringify(v):v).join('; '):typeof value==='object'?JSON.stringify(value):String(value);

/** Enrich only a newly composed, validated document. Does not run an age model,
 * fetch evidence, change a stored edition or grant report access. */
export function composeEditorialReport(document,state={}){
 const type=document.type,signature=ASSESSMENT_SIGNATURES[type];
 if(!signature)throw Error('Unsupported editorial assessment: '+type);
 const family=type==='heart-vascular'?state.heart:state.system;
 const inputs=family?.inputs||{},answers=state.answers||{},blood=state.lab||{};
 const result=family?.result||{},review=family?.review||{};
 const translations={},used=new Set(),chapters=[],derivedFacts=[],decisions=[];
 const freezeText=text=>{
  if(typeof text!=='string')return '';
  if(!Object.hasOwn(translations,text))translations[text]=translateText(text,'bg');return text;
 };
 const phrase=(key,values={})=>{
  const template=C[key]||CLINICAL_COPY[key];
  if(!template)throw Error('Unknown editorial copy: '+key);
  const bind=(text,language='en')=>text.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g,(_,key)=>{
   if(values[key]===undefined||values[key]===null)throw Error('Missing editorial fact: '+key);
   return language==='bg'&&['label','fasting','rested','assay','portions'].includes(key)?translateText(String(values[key]),'bg'):String(values[key]);
  });
  const en=bind(template);translations[en]=bind(translateText(template,'bg'),'bg');return en;
 };
 const source=ids=>{for(const id of ids||[])used.add(id);return ids||[];};
 const paragraph=(id,text,sources=[],kind='context',title='')=>({id,title:freezeText(title),text:freezeText(text),sources:source(sources),kind});
 const addModule=(id,{context=[],omit=[]}={})=>{
  const item=KNOWLEDGE_MODULES[id];if(!item)throw Error('Unknown knowledge module: '+id);
  const blocks=item.blocks.filter(b=>!omit.includes(b.id)).map(b=>paragraph(b.id,b.text,b.sources,b.kind,b.title));
  chapters.push({id,title:freezeText(item.title),deck:freezeText(item.deck),kind:'feature',blocks:[...context,...blocks]});
  decisions.push({module:id,omittedBlocks:omit});
 };
 const plain=(id,title,blocks,kind='context',deck='')=>chapters.push({id,title:phrase(title),deck:freezeText(deck),kind,blocks});
 const labNumber=id=>{
  const entry=blood[id],definition=labs.find(l=>l.id===id);
  if(!entry||!definition||!exact(entry.value)||!definition.units.includes(entry.unit||definition.units[0]))return null;
  return Number(entry.value)*definition.factor(entry.unit||definition.units[0]);
 };
 const reading=(label,entry)=>entry&&present(entry.value)?phrase('reading',{label:freezeText(label),value:entry.value,unit:entry.unit||''}):'';
 const labReadings=ids=>ids.filter(id=>present(blood[id]?.value)).map(id=>paragraph('reading-'+id,reading(labs.find(l=>l.id===id).name,blood[id]),[],'recorded'));
 const familyReadings=ids=>ids.filter(id=>present(inputs[id]?.value)).map(id=>paragraph('reading-'+id,reading(systemField(type,id)?.label||id,inputs[id]),[],'recorded'));
 const ready=document.resultState==='ready';
 const safety=document.sections.filter(s=>s.id.startsWith('safety-'));
 const critical=safety.length>0;
 const knownDiabetes=has(answers.conditions,'Diabetes')||has(answers.medicines,'Diabetes medicine')||inputs.diabetes==='Yes'||['Type 1 diabetes','Type 2 diabetes'].includes(inputs.diabetesType);
 const specialContext=has(answers.context,'Pregnant')||has(answers.context,'Recently gave birth')||has(answers.context,'Receiving dialysis')||inputs.pregnancy==='Yes';
 const intro=[];
 if(critical)intro.push(paragraph('urgent',phrase('critical'),[],'safety'));
 if(type==='clinical-phenoage'&&ready){
  const value=document.facts.find(f=>f.id==='clinical.value')?.value;
  if(exact(value)&&present(state.labAge))intro.push(paragraph('meaning',phrase('introClinical',{age:state.labAge,value:Math.round(value)}),['phenoage','validation']));
 }else if(type==='health-profile'&&document.resultState==='profile')intro.push(paragraph('meaning',phrase('introProfile')));
 else if(!ready)intro.push(paragraph('meaning',phrase('introReview')));
 if(family){
  for(const text of document.sections.find(s=>s.id==='introduction')?.paragraphs||[])intro.push(paragraph('family-meaning-'+intro.length,text,document.sections.find(s=>s.id==='introduction').sources));
 }else if(!ready&&document.resultState!=='profile'){
  const reason=document.facts.find(f=>f.id==='clinical.reason')?.value;
  if(reason)intro.push(paragraph('withheld-reason',reason,[],'safety'));
 }
 for(const s of safety)for(const text of s.paragraphs)intro.push(paragraph(s.id,text,s.sources,'safety'));
 plain('perspective','context',intro,'intro');

 let glucose=labNumber('glucose'),glucoseEntry=blood.glucose,fasting=state.labFasting;
 if(type==='metabolic'&&inputs.fastingGlucose){
  glucoseEntry=inputs.fastingGlucose;
  glucose=exact(glucoseEntry.value)?Number(glucoseEntry.value)*(glucoseEntry.unit==='mg/dL'?1/18.0182:1):null;
  // This input is explicitly named fasting glucose by the family intake.
  fasting='Yes';
 }
 const glucoseMg=glucose===null?null:glucose*18.0182;
 // Compare in the entered unit. Conventional mmol/L and mg/dL boundaries have
 // independent rounding; converting 100 mg/dL and comparing it with 5.6 is wrong.
 const glucoseAt=(mmol,mg)=>glucoseEntry?.unit==='mg/dL'?number(glucoseEntry.value)>=mg:glucose>=mmol;
 const hasGlucose=glucose!==null&&glucose>=0;
 const highDiagnostic=hasGlucose&&fasting==='Yes'&&glucoseAt(7,126);
 const prevention=hasGlucose&&fasting==='Yes'&&glucoseAt(5.6,100)&&!highDiagnostic&&!knownDiabetes&&!specialContext&&!critical&&ready;
 const safeRoutine=!critical&&!highDiagnostic&&document.resultState!=='withheld';

 if(!critical){
  if(hasGlucose){
   const context=[paragraph('your-glucose',phrase('glucoseEntered',{value:glucoseEntry.value,unit:glucoseEntry.unit||'mmol/L',fasting:freezeText(fasting||C.unknown)}),[],'recorded')];
   const stateKey=knownDiabetes?'diabetesKnown':fasting!=='Yes'?'glucoseNoFast':highDiagnostic?'glucoseDiabetes':prevention?'glucoseIFG':'glucoseLower';
   context.push(paragraph('glucose-interpretation',phrase(stateKey),['glucose-diagnosis','glucose-followup'],'context'));
   addModule('glucose',{context});
  }
  if(prevention){
   const context=[paragraph('study-fit',phrase('studyFit'),['dpp','strride'])];
   const height=number(answers.height),weight=number(answers.weight);
   const h=height===null?null:height*(answers.heightUnit==='in'?2.54:1)/100;
   const w=weight===null?null:weight*(answers.weightUnit==='lb'?0.45359237:1);
   if(h>0&&w>0){
    const bmi=w/h**2;
    derivedFacts.push({id:'derived.bmi',label:'BMI',value:Number(bmi.toFixed(1)),unit:'kg/m²',formula:'weight in kg / (height in m)²',inputIds:['answers.height','answers.weight'],kind:'calculated'});
    context.push(paragraph('body-context',phrase('bmi',{bmi:round(bmi)}),['bmi'],'derived'));
   }
   addModule('prevention',{context});
  }
  if(type==='heart-vascular'){
   if(inputs.systolic||inputs.diastolic)addModule('pressure',{context:['systolic','diastolic'].filter(id=>inputs[id]).map(id=>paragraph(id,reading(id==='systolic'?'Systolic blood pressure':'Diastolic blood pressure',inputs[id]),[],'recorded'))});
   if(['total','hdl','apob','lpa'].some(id=>inputs[id]))addModule('lipids',{context:[['total','Total cholesterol'],['hdl','HDL cholesterol'],['apob','ApoB'],['lpa','Lp(a)']].filter(([id])=>inputs[id]).map(([id,label])=>paragraph(id,reading(label,inputs[id]),[],'recorded'))});
  }
  if(type==='metabolic'){
   addModule('metabolic',{context:inputs.hba1c?[paragraph('a1c',phrase('a1cValue',{value:inputs.hba1c.value,unit:inputs.hba1c.unit}),['a1c'],'recorded')]:[]});
   if(inputs.hba1c&&!hasGlucose)addModule('glucose',{context:[paragraph('a1c-only',phrase('a1cValue',{value:inputs.hba1c.value,unit:inputs.hba1c.unit}),['a1c'],'recorded')],omit:['companions']});
  }
  if(type==='kidney'){
   const context=familyReadings(['creatinine','cystatin','acr']);
   if(Number.isFinite(review.egfr))context.push(paragraph('egfr',phrase('kidneyNumber',{value:round(review.egfr)}),['kidney-context'],'recorded'));
   if(Number.isFinite(review.egfrCombined))context.push(paragraph('egfr-combined',phrase('kidneyCombined',{value:round(review.egfrCombined)}),['kidney-context'],'recorded'));
   if(!present(inputs.acr?.value))context.push(paragraph('acr-missing',phrase('kidneyNoAcr'),['kdigo-ckd']));
   const kidneyTreatment=inputs.kidneyHistory&&inputs.kidneyHistory!=='No known kidney disease'&&!uncertainty(inputs.kidneyHistory);
   addModule('kidney',{context,omit:kidneyTreatment?[]:['treatment']});
  }
  if(type==='fitness'){
   const context=[];
   if(result.method==='FRIEND'&&present(inputs.vo2peak?.value))context.push(paragraph('measured',phrase('fitMeasured',{value:inputs.vo2peak.value}),['friend-2022'],'recorded'));
   else if(Number.isFinite(review.estimatedVo2))context.push(paragraph('estimated',phrase('fitEstimated',{value:round(review.estimatedVo2)}),document.sourceIds,'recorded'));
   addModule('fitness',{context});
  }
  // Full coverage of the entered clinical panel. No fixed three-insight quota.
  if(type==='clinical-phenoage'){
   if(present(blood.wbc?.value)||present(blood.lymphocytes?.value)){
    const context=labReadings(['wbc','lymphocytes']);
    const wbc=labNumber('wbc'),percent=labNumber('lymphocytes');
    if(wbc!==null&&wbc>=0&&percent!==null&&percent>=0&&percent<=100){
     const count=wbc*percent/100;
     derivedFacts.push({id:'derived.absolute-lymphocytes',label:'Estimated absolute lymphocytes',value:Number(count.toFixed(3)),unit:'10⁹/L',formula:'normalized WBC × lymphocyte percentage / 100',inputIds:['lab.wbc','lab.lymphocytes'],sampleDate:state.labDate||null,kind:'calculated'});
     context.push(paragraph('absolute-count',phrase('immuneDerived',{wbc:round(wbc,3),percent:round(percent,3),count:round(count,3)}),['lymphocytes'],'derived'));
     // NHLBI's broad adult range is educational, not a replacement lab interval.
     context.push(paragraph('absolute-context',phrase(count>=1&&count<=4.8?'immuneWithin':'immuneOutside'),['lymphocytes']));
    }else context.push(paragraph('absolute-missing',phrase('immuneMissing')));
    addModule('immune',{context});
   }
   if(present(blood.crp?.value))addModule('crp',{context:[paragraph('assay',phrase(['standard-crp','hs-crp'].includes(blood.crp.assay)?'crpKnown':'crpUnknown',{value:blood.crp.value,unit:blood.crp.unit||'mg/L',assay:blood.crp.assay||C.unknown}),['crp-explained','hscrp'])]});
   if(present(blood.albumin?.value))addModule('albumin',{context:labReadings(['albumin'])});
   if(present(blood.creatinine?.value))addModule('kidney',{context:labReadings(['creatinine']),omit:['treatment']});
   if(present(blood.mcv?.value)||present(blood.rdw?.value))addModule('redcells',{context:labReadings(['mcv','rdw'])});
   if(present(blood.alp?.value))addModule('alp',{context:labReadings(['alp'])});
  }
 }

 const moderate=number(answers.moderate??inputs.moderate?.value),vigorous=number(answers.vigorous??inputs.vigorous?.value),strength=number(answers.strength);
 const routineKnown=answers.limitations==='No'&&answers.illness==='No'&&has(answers.context,'None')&&has(answers.conditions,'None')&&has(answers.medicines,'None');
 const limited=['Sometimes','Often'].includes(answers.limitations)||answers.illness==='Yes'||specialContext||(Array.isArray(answers.context)&&answers.context.some(c=>!['None','Prefer not to say'].includes(c)));
 const established=moderate!==null&&vigorous!==null&&moderate+2*vigorous>=150;
 const sleepHours=number(answers.sleep),sleepConcern=answers.rested==='Sometimes'||answers.rested==='Rarely'||(sleepHours!==null&&sleepHours<7);
 if(safeRoutine){
  if(moderate!==null||vigorous!==null||strength!==null||type==='fitness'){
   const context=[];
   if(moderate!==null&&vigorous!==null)context.push(paragraph('baseline',phrase('activityBaseline',{moderate,vigorous}),[],'recorded'));
   if(strength!==null)context.push(paragraph('strength',phrase(strength===1?'strengthOne':'strengthBaseline',{days:strength}),[],'recorded'));
   context.push(paragraph('suitability',phrase(limited?'movementLimited':!routineKnown?'movementUnknown':established?'movementMaintain':'planExample'),['activity']));
   addModule('movement',{context,omit:limited||!routineKnown?['progress']:[]});
  }
  if(present(answers.diet)||type==='metabolic')addModule('nutrition',{context:present(answers.diet)&&!uncertainty(answers.diet)?[paragraph('diet-baseline',phrase('planDiet',{portions:answers.diet}),['diet'],'recorded')]:[]});
  if(sleepHours!==null||present(answers.rested)){
   const context=[];
   if(sleepHours!==null)context.push(paragraph('sleep-baseline',phrase('sleepBaseline',{hours:sleepHours,rested:freezeText(answers.rested||C.unknown)}),[],'recorded'));
   if(answers.disrupted==='Yes')context.push(paragraph('sleep-constraint',phrase('sleepConstraint'),[],'recorded'));
   addModule('sleep',{context,omit:sleepConcern?[]:['diary','cbti','apnea']});
  }
  const smoking=answers.smoking||inputs.smoking;
  if(['Every day','Some days','Yes','Current smoker','Smoke now'].includes(smoking))addModule('tobacco');
  else if(['Not at all','Never smoked','No','Former smoker'].includes(smoking))plain('foundations','maintain',[paragraph('tobacco-foundation',phrase('noTobacco'),['tobacco'])],'strength');
  if(answers.alcohol==='Yes')addModule('alcohol',{context:exact(answers.alcoholDays)?[paragraph('alcohol-pattern',phrase(Number(answers.alcoholDays)===1?'alcoholOne':'alcoholBaseline',{days:answers.alcoholDays}),[],'recorded')]:[]});
  if(['Often','Almost every day'].includes(answers.stress))addModule('stress');
 }
 if(!critical){
  const plan=[];
  if(prevention||highDiagnostic)plan.push(paragraph('clarify-glucose',phrase('glucoseConfirm'),['glucose-diagnosis'],'plan',phrase('first')));
  if(safeRoutine&&routineKnown&&moderate!==null&&vigorous!==null&&!established){
   plan.push(paragraph('example-not-prescription',phrase('planExample'),[],'editorial'));
   plan.push(paragraph('baseline-step',phrase('planMove',{baseline:moderate,next:moderate+Math.min(30,Math.max(0,150-moderate-2*vigorous))}),['activity'],'editorial',phrase('week12')));
   plan.push(paragraph('build-step',phrase(strength!==null&&strength>=2?'planStrengthKeep':'planBuild'),['activity'],'editorial',phrase('week36')));
   plan.push(paragraph('review-step',phrase('planReview'),[],'editorial',phrase('week712')));
  }else if(safeRoutine&&(limited||!routineKnown)&&(moderate!==null||vigorous!==null))plan.push(paragraph('adapt',phrase(limited?'movementLimited':'movementUnknown'),['activity'],'plan'));
  if(safeRoutine&&established)plan.push(paragraph('maintain-activity',phrase('movementMaintain'),['activity'],'plan'));
  if(safeRoutine&&sleepConcern)plan.push(paragraph('sleep-review',phrase('sleepPlan'),['sleep'],'editorial'));
  if(family&&ready)plan.push(paragraph('family-plan',phrase(type==='heart-vascular'?'heartPlan':type+'Plan'),document.sourceIds,'plan'));
  if(!plan.length)plan.push(paragraph('context-first',phrase('partial'),[],'plan'));
  plain('starting-plan','plan',plan,'plan');
  const follow=[];
  if(prevention)follow.push(paragraph('glucose-timing',phrase('retestGlucose'),['glucose-followup','a1c'],'timing'));
  follow.push(paragraph('purposeful-repeat',phrase('noUniversalRetest'),['lab-intervals'],'timing'));
  follow.push(paragraph('companions-not-recorded',phrase('notMeasured'),[],'boundary'));
  if(document.coverage?.questions?.answered<document.coverage?.questions?.total)follow.push(paragraph('incomplete',phrase('partial')));
  plain('follow-up','followup',follow,'context');
 }

 const record=[];
 const addRow=(group,label,value,unit='',extra={})=>record.push({group:freezeText(group),label:freezeText(label),value:present(value)?copy(value):C.notanswered,unit,...extra});
 const labelValue=(value,q)=>{
  if(!present(value))return C.notanswered;
  if(q?.type==='drinks')return value.map(d=>`${d.type}: ${d.count||'?'} × ${d.ml||'?'} mL · ${d.abv||'?'}%`).join('; ');
  if(Array.isArray(value))return value.map(v=>q?.optionLabels?.[v]||v).join('; ');
  return q?.optionLabels?.[value]||String(value);
 };
 if(family){
  for(const [key,value] of Object.entries(inputs)){
   const field=type==='heart-vascular'?null:systemField(type,key);
   const labels={age:'Age',sex:'Sex used by the model',country:'Country',systolic:'Systolic blood pressure',diastolic:'Diastolic blood pressure',total:'Total cholesterol',hdl:'HDL cholesterol',apob:'ApoB',lpa:'Lp(a)',smoking:'Current smoking',smokingDays30:'Days you smoked in the past 30 days',cigarettes:'Cigarettes on a smoking day',smokingYears:'Years you smoked cigarettes',diagnoses:'Recorded diagnoses',diabetesType:'Type of diabetes',diabetesMedicine:'Diabetes medicine',diabetesDamage:'Reported diabetes complications',bpTreatment:'Blood pressure medicine',diagnosisAge:'Age at diabetes diagnosis',hba1c:'HbA1c',egfr:'eGFR',glucose:'Fasting glucose',height:'Height',weight:'Weight',conditions:'Known conditions',treatment:'Current treatment',cfpwv:'Carotid–femoral pulse-wave velocity',cfpwvMethod:'Pulse-wave measurement method'};
   const object=value&&typeof value==='object'&&!Array.isArray(value)&&'value' in value;
   const comparison=review.fields?.[key]?.comparison;
   addRow(C.questions,field?.label||labels[key]||key,object?value.value:valueLabel(value),object?value.unit||'':'',{id:`${type}.inputs.${key}`,reference:object?referenceRecord(value):null,comparison:comparison?{value:comparison.status,unit:comparison.unit||'',provenance:copy(comparison)}:null});
  }
 }else{
  for(const s of sections)for(const q of s.questions){
   if(q.show&&!q.show(answers))continue;
   addRow(s.name,q.label,labelValue(answers[q.id],q),present(answers[q.id])?answers[q.id+'Unit']||q.units?.[0]||q.unit||'':'',{id:'answers.'+q.id});
  }
  for(const definition of labs){
   const entry=blood[definition.id];if(!entry)continue;
   const ref=document.facts.find(f=>f.id===`lab.${definition.id}.reference`);
   addRow(C.blood,definition.name,entry.value,entry.unit||definition.units[0],{id:'lab.'+definition.id,reference:referenceRecord(entry),comparison:ref?copy(ref):null,assay:entry.assay||null});
  }
  for(const [key,label] of [['labAge',C.labage],['labDate',C.draw],['labFasting','Fasted for at least eight hours?'],['labContext','Collection history'],['labReferenceGroup','Reference group'],['labReferenceMode','Reference comparison mode']])if(present(state[key]))addRow('Collection details',label,state[key],key==='labAge'?'years':'',{id:key});
 }
 for(const warning of safety)for(const [index,text] of warning.paragraphs.entries())addRow('Clinical review','Safety alert',text,'',{id:warning.id+'-'+index});
 const outputLabels={age:'Reference age',ageBand:'Study comparison band',ageRange:'Comparison boundary direction',boundary:'Comparison boundary',risk:'Modelled risk',method:'Method',egfr:'eGFR from creatinine',egfrCombined:'eGFR from creatinine and cystatin C',estimatedVo2:'Estimated VO₂peak',value:'Clinical PhenoAge',gap:'Simple difference'};
 for(const fact of document.facts){
  if(fact.provenance.kind!=='supplied-result'||!/(?:\.result\.|\.review\.|^clinical\.)/.test(fact.id))continue;
  const key=fact.id.split('.').at(-1);
  if(outputLabels[key])addRow('Calculated model outputs',outputLabels[key],fact.value,fact.unit||'',{id:fact.id});
 }
 for(const row of record){
  freezeText(typeof row.value==='boolean'?(row.value?'Yes':'No'):valueLabel(row.value));
  for(const text of [row.assay,row.comparison?.provenance?.label,row.comparison?.provenance?.reason])if(text)freezeText(text);
 }
 for(const fact of derivedFacts){freezeText(fact.label);freezeText(fact.formula);}
 const facts=new Map(document.facts.map(f=>[f.id,f.value]));
 const age=ready?(type==='clinical-phenoage'?facts.get('clinical.value'):result.age):null;
 const metric={age:Number.isFinite(age)?Math.round(age):null,chronologicalAge:type==='clinical-phenoage'?number(state.labAge):number(typeof inputs.age==='object'?inputs.age?.value:inputs.age),gap:ready&&Number.isFinite(facts.get('clinical.gap'))?Math.round(facts.get('clinical.gap')):null,risk:ready&&Number.isFinite(result.risk)?result.risk:null,method:result.method||null,boundary:ready?result.boundary??null:null,ageRange:ready?result.ageRange||null:null,ageBand:ready?result.ageBand||null:null};
 const methods=[phrase(type==='clinical-phenoage'?'methodClinical':type==='health-profile'?'introProfile':'methodFamily'),phrase('snapshot')];
 source(document.sourceIds);
 if(type==='clinical-phenoage')source(['phenoage','validation']);
 const folio=type==='clinical-phenoage'?composeClinicalFolio({chapters,record,metric,resultState:document.resultState},{phrase,paragraph,freezeText,prevention,highDiagnostic,knownDiabetes,critical,sleepConcern,established,limited,moderate,vigorous,strength,sleepHours,fasting,assay:['standard-crp','hs-crp'].includes(blood.crp?.assay)?blood.crp.assay:null}):null;
 const citations=evidenceSnapshot([...used]);
 for(const s of citations){freezeText(s.label);freezeText(s.kind);}
 for(const text of Object.values(C))freezeText(text);
 const order=['perspective','glucose','metabolic','prevention','pressure','lipids','fitness','starting-plan','movement','sleep','immune','crp','albumin','kidney','redcells','alp','nutrition','foundations','tobacco','alcohol','stress','follow-up'];
 chapters.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 const editorial={version:EDITORIAL_VERSION,knowledgeVersion:KNOWLEDGE_VERSION,evidenceVersion:EVIDENCE_VERSION,layoutVersion:folio?.version||REPORT_LAYOUT_VERSION,reviewStatus:'clinical-review-required',type,signature:copy(signature),title:phrase(signature.key+'-title'),deck:phrase(signature.key+'-deck'),date:document.generatedAt||state.savedReport?.generatedAt||state.labDate||null,drawDate:state.labDate||null,sample:state.sample===true,resultState:document.resultState,metric,chapters,record,derivedFacts,methods,citations,decisions,translations,...(folio?{folio}:{})};
 // Never retain implementation-only normalized glucose as a personal lab result.
 if(glucoseMg!==null&&!Number.isFinite(glucoseMg))throw Error('Non-finite normalized glucose.');
 return {...document,editorial};
}
function referenceRecord(entry){
 const low=entry.referenceLow,high=entry.referenceHigh;
 if(!present(low)&&!present(high))return null;
 return {low:present(low)?String(low):null,high:present(high)?String(high):null,lowExclusive:entry.referenceLowExclusive===true,highExclusive:entry.referenceHighExclusive===true};
}
