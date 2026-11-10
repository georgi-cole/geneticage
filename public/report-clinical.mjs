import {compareLabReference} from './lab-review.mjs';
import {CLINICAL_COPY as L} from './report-knowledge/clinical-copy.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';

export const CLINICAL_FOLIO_VERSION='clinical-folio-v1';

export function composeClinicalFolio({chapters,record,resultState},{phrase,paragraph,freezeText,prevention,highDiagnostic,knownDiabetes,critical,sleepConcern,established,limited,moderate,vigorous,strength,sleepHours,fasting,assay}){
 const chapter=id=>chapters.find(item=>item.id===id);
 const opening=chapter('perspective');
 const glucose=chapter('glucose');
 const interpretation=glucose?.blocks.find(block=>block.id==='glucose-interpretation');
 const plan=chapter('starting-plan');
 const routine=chapter('movement');
 const scheduled=plan?.blocks.some(block=>block.id==='baseline-step');
 const studyBoundary=chapter('prevention')?.blocks.find(block=>block.id==='purpose');
 if(studyBoundary)studyBoundary.text=phrase('clinicalStudyBoundary');
 const ready=resultState==='ready';
 const glucoseFirst=ready&&(prevention||highDiagnostic||knownDiabetes&&!!interpretation);
 const lead=critical?'clinicalLeadSafety':!ready?'clinicalLeadReview':prevention?'clinicalLeadGlucose':highDiagnostic?'clinicalLeadConfirmation':glucoseFirst?'clinicalLeadCare':sleepConcern?'clinicalLeadSleep':established?'clinicalLeadMaintain':'clinicalLeadContext';
 opening.title=phrase(lead);
 if(ready&&!critical){
  const reading=record.find(row=>row.id==='lab.glucose');
  const meaning=opening.blocks[0];
  const leadBlock=prevention?paragraph('lead',phrase('clinicalLeadGlucoseText',{value:reading.value,unit:reading.unit}),interpretation.sources):
   glucoseFirst?interpretation:paragraph('lead',phrase(sleepConcern?'clinicalLeadSleepText':established?'clinicalLeadMaintainText':'clinicalLeadContextText'));
  opening.blocks=[leadBlock];
  const activity=moderate!==null&&vigorous!==null&&strength!==null?[paragraph('routine-baseline',phrase('clinicalRoutineBaseline',{moderate,vigorous,days:strength}),[],'recorded')]:
   routine?.blocks.filter(block=>['baseline','strength'].includes(block.id))||[];
  const foundations=[...activity,...(chapter('foundations')?.blocks||[])];
  if(foundations.length)opening.blocks.push({...foundations[0],title:phrase('clinicalFoundation')},...foundations.slice(1));
  opening.blocks.push(paragraph('unknowns',phrase('clinicalMissingContext'),[],'boundary',phrase('clinicalUnknowns')));
  if(!assay&&record.some(row=>row.id==='lab.crp'))opening.blocks.push(paragraph('unknown-assay',phrase('clinicalUnknownAssay'),['crp-explained'],'boundary'));
  if(meaning)opening.blocks.push({...meaning,title:phrase('clinicalPerspectiveAge'),kind:'aside'});
 }
 if(plan){
  plan.title=phrase(!ready||highDiagnostic?'clinicalPlanClarify':limited?'clinicalPlanAdapt':established?'clinicalPlanMaintain':'clinicalPlan');
  const example=plan.blocks.find(block=>block.id==='example-not-prescription');
  if(example)example.text=phrase('clinicalPlanExample');
  if(resultState==='missing'&&plan.blocks.every(block=>block.id==='context-first')){
   plan.blocks=[paragraph('complete-record',phrase('clinicalMissingAgeText'),[],'plan',phrase('clinicalMissingAge'))];
  }
 }

 const highlights=ids=>ids.map(id=>record.find(row=>row.id==='lab.'+id)).filter(Boolean).map(({id,label,value,unit})=>({id,label,value,unit}));
 const glance=[];
 if(ready&&record.some(row=>row.id==='lab.glucose')){
  const [reading]=highlights(['glucose']);
  glance.push({...reading,label:freezeText(fasting==='Yes'?L.clinicalFastingGlucose:reading.label)});
 }
 if(ready&&moderate!==null)glance.push({label:phrase('clinicalActivity'),value:moderate,unit:phrase('clinicalActivityUnit')});
 if(ready&&sleepHours!==null)glance.push({label:phrase('clinicalSleep'),value:sleepHours,unit:phrase('clinicalSleepUnit')});

 const agenda=[];
 const row=(when,block,question)=>{if(block)agenda.push({when:phrase(when),review:block.text,question:phrase(question),sources:block.sources});};
 if(ready&&!critical){
  if(prevention||highDiagnostic)row('clinicalInitial',plan?.blocks.find(block=>block.id==='clarify-glucose'),'clinicalQuestionGlucose');
  if(!assay&&chapter('crp'))row('clinicalInitial',paragraph('assay-check',phrase('clinicalCheckAssay'),['crp-explained']),'clinicalQuestionAssay');
  row('clinicalTwoWeeks',plan?.blocks.find(block=>block.id==='sleep-review'),'clinicalQuestionSleep');
  if(scheduled||established)row(scheduled?'clinicalPlanReview':'clinicalNextCheck',plan?.blocks.find(block=>block.id===(scheduled?'review-step':'maintain-activity')),'clinicalQuestionRoutine');
  if(prevention)row('clinicalWhenRelevant',chapter('follow-up')?.blocks.find(block=>block.id==='glucose-timing'),'clinicalQuestionGlucose');
  row('clinicalWhenRelevant',chapter('follow-up')?.blocks.find(block=>block.id==='purposeful-repeat'),'clinicalQuestionRepeat');
 }

 const pages=[];
 const feature=(id,ids,options={})=>{
  const selected=ids.filter(name=>chapter(name));
  if(!selected.length)return;
  const title=options.title?phrase(options.title):chapter(selected[0]).title;
  const {label='clinicalFeatures',highlights,agenda}=options;
  pages.push({id,chapters:selected,title,eyebrow:phrase(label),...(highlights?{highlights}:{}),...(agenda?{agenda}:{})});
 };
 feature('perspective',['perspective'],{label:'clinicalPerspective',highlights:glance});
 const glucoseFeature=()=>feature('glucose',['glucose'],{highlights:highlights(['glucose'])});
 const sleepFeature=()=>feature('sleep',['sleep'],{label:'clinicalRoutine'});
 if(glucoseFirst)glucoseFeature();
 feature('prevention',['prevention'],{label:'clinicalEvidence'});
 if(!glucoseFirst&&sleepConcern)sleepFeature();
 feature('starting-plan',['starting-plan','movement','nutrition'],{label:'clinicalPlanLabel'});
 if(glucoseFirst||!sleepConcern)sleepFeature();
 if(!glucoseFirst)glucoseFeature();
 feature('immune',['immune'],{highlights:highlights(['wbc','lymphocytes'])});
 feature('crp',['crp'],{highlights:highlights(['crp'])});
 feature('proteins',['albumin','kidney'],{title:'clinicalProteins',highlights:highlights(['albumin','creatinine'])});
 feature('blood-count',['redcells','alp'],{title:'clinicalCells',highlights:highlights(['mcv','rdw','alp'])});
 feature('routine',['tobacco','alcohol','stress'],{label:'clinicalRoutine'});
 feature('follow-up',['follow-up'],{label:'clinicalFollowupLabel',title:'clinicalFollowup',agenda});
 for(const text of Object.values(L))freezeText(text);
 for(const text of ['Within your lab interval','Within published guide','Above published guide','Below published guide','CRP test type needed','Reference group needed','No reference comparison'])freezeText(text);
 const overview=pages.filter(page=>['perspective','starting-plan','follow-up'].includes(page.id)).map(({id,title})=>({id,title}));
 return {version:CLINICAL_FOLIO_VERSION,headline:phrase('clinicalCover'),deck:phrase('clinicalDeck'),overview,pages,urgent:critical};
}

export function clinicalCoverArt(){
 return `<svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
 <defs>
  <radialGradient id="kq-cell-a" cx="35%" cy="30%" r="68%"><stop offset="0" stop-color="#d69b87"/><stop offset=".38" stop-color="#ab6a61"/><stop offset=".72" stop-color="#70404a"/><stop offset=".92" stop-color="#a16b62"/><stop offset="1" stop-color="#cba18c"/></radialGradient>
  <radialGradient id="kq-cell-b" cx="40%" cy="35%" r="66%"><stop offset="0" stop-color="#d6ae91"/><stop offset=".5" stop-color="#b5826d"/><stop offset=".87" stop-color="#855458"/><stop offset="1" stop-color="#b78777"/></radialGradient>
 </defs>
 <g fill="none" stroke="#bb9d8b" opacity=".52" stroke-width=".7"><ellipse cx="223" cy="191" rx="165" ry="101" transform="rotate(-30 223 191)"/><ellipse cx="202" cy="210" rx="115" ry="170" transform="rotate(35 202 210)"/><path d="M69 360 Q162 119 319 101"/></g>
 <ellipse cx="282" cy="152" rx="117" ry="121" transform="rotate(-22 282 152)" fill="url(#kq-cell-a)"/>
 <ellipse cx="139" cy="315" rx="59" ry="51" transform="rotate(-21 139 315)" fill="url(#kq-cell-b)"/>
 <ellipse cx="309" cy="289" rx="22" ry="20" fill="url(#kq-cell-b)" opacity=".78"/>
 </svg>`;
}

export function clinicalPageContent(editorial,page){
 const chapters=page.chapters.map(id=>editorial.chapters.find(chapter=>chapter.id===id));
 const all=chapters.flatMap(chapter=>chapter.blocks);
 const aside=all.filter(block=>block.kind==='aside');
 const heading=chapters[0];
 if(page.id==='perspective')return {lead:all.slice(0,1),columns:[all.slice(1).filter(block=>block.kind!=='aside'),[]],aside};
 if(page.id==='follow-up'&&page.agenda?.length)return {lead:[],columns:[[],[]],aside,agenda:page.agenda};
 if(page.id==='starting-plan'){
  const [plan,movement,nutrition]=['starting-plan','movement','nutrition'].map(id=>chapters.find(chapter=>chapter.id===id));
  const steps=plan.blocks.filter(block=>['baseline-step','build-step','review-step'].includes(block.id));
  const lead=plan.blocks.filter(block=>!steps.includes(block)&&block.id!=='sleep-review');
  const food=nutrition?.blocks.filter(block=>['diet-baseline','weight'].includes(block.id))||[];
  const move=movement?.blocks.filter(block=>block.id==='strength')||[];
  return {lead,steps,columns:[[...move,...food.slice(0,1)],food.slice(1)],aside};
 }
 const readings=new Set(page.highlights?.map(item=>'reading-'+item.id?.slice(4)));
 if(page.id==='prevention'){
  const blocks=Object.fromEntries(all.map(block=>[block.id,block]));
  return {lead:[blocks['study-fit']].filter(Boolean),
   columns:[[blocks.dpp,blocks['body-context']].filter(Boolean),[blocks.strride].filter(Boolean)],
   aside:[blocks.medicines,blocks.purpose?{...blocks.purpose,kind:'aside'}:null].filter(Boolean)};
 }
 const lead=heading.blocks.filter(block=>['recorded','context'].includes(block.kind)&&!readings.has(block.id));
 const groups=chapters.map(chapter=>chapter.blocks.filter(block=>!lead.includes(block)&&!readings.has(block.id)&&block.kind!=='aside'));
 if(chapters.length>1)return {lead,columns:[groups[0],groups.slice(1).flat()],aside};
 const blocks=groups[0];
 const weights=blocks.map(block=>block.text.length+block.title.length+45+(['trial','treatment','derived'].includes(block.kind)?80:0));
 const total=weights.reduce((sum,weight)=>sum+weight,0);
 let leftWeight=0,split=0,gap=total;
 for(const [index,weight] of weights.entries()){
  leftWeight+=weight;
  if(Math.abs(total-2*leftWeight)<gap){gap=Math.abs(total-2*leftWeight);split=index+1;}
 }
 if(!split)split=blocks.length;
 return {lead,columns:[blocks.slice(0,split),blocks.slice(split)],aside};
}

export function clinicalRecordGroups(editorial){
 const rows=editorial.record;
 return {
  blood:rows.filter(row=>row.id.startsWith('lab.')),
  collection:rows.filter(row=>row.id.startsWith('lab')&&!row.id.startsWith('lab.')),
  answers:rows.filter(row=>row.id.startsWith('answers.')),
  outputs:rows.filter(row=>row.id.startsWith('clinical.')),
  alerts:rows.filter(row=>row.id.startsWith('safety-')),
 };
}

export function clinicalComparison(row){
 const p=row.comparison?.provenance;
 const interval=row.reference||p;
 const limits=interval?[interval.low==null?'':(interval.lowExclusive?'>':'≥')+' '+interval.low,interval.high==null?'':(interval.highExclusive?'<':'≤')+' '+interval.high].filter(Boolean):[];
 const range=limits.length?limits.join(' · ')+' '+(row.reference?row.unit:row.comparison.unit):'';
 let normalized='';
 if(!row.reference&&p?.comparisonValue!=null&&row.comparison.unit!==row.unit){
  let value=p.comparisonValue;
  if(!p.threshold){
   for(let digits=4;digits<=12;digits++){
    const candidate=Number(value.toPrecision(digits));
    if(compareLabReference({value:candidate,referenceLow:p.low,referenceHigh:p.high,referenceLowExclusive:p.lowExclusive,referenceHighExclusive:p.highExclusive}).status===row.comparison.value){
     value=candidate;
     break;
    }
   }
  }
  normalized=value+' '+row.comparison.unit;
 }
 return {label:p?.label||C.unknown,range,normalized,source:p?.sourceVersion,url:p?.sourceUrl,assay:['standard-crp','hs-crp'].includes(row.assay)?row.assay:row.id==='lab.crp'?C.unknown:null};
}
