import {isReportableAge} from './lab-safety.mjs';

const recordedDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

// Band midpoints and withheld or bounded ages are not trend points.
export function historyMeasurement(assessment, saved) {
 const make=(key,label,metric,value,unit,date=saved?.slice(0,10),precision=1)=>
  Number.isFinite(value)&&recordedDate(date)?{key,label,metric,value,unit,date,precision}:null;
 if(assessment.model==='clinical-phenoage-2018-demo-v1'&&assessment.labFasting==='Yes'&&isReportableAge(assessment.value)&&recordedDate(assessment.labDate)){
  return make(assessment.model,'Clinical PhenoAge','Age estimate',assessment.value,'years',assessment.labDate,0);
 }
 const heart=assessment.heart;
 if(heart?.result&&!heart.result.reason&&heart.result.version&&heart.result.region){
  const {version,method,region,risk}=heart.result;
  return make([version,region,heart.inputs?.sex].join('|'),method,'10-year cardiovascular risk',risk,'%');
 }
 const system=assessment.system;
 if(system?.result?.status!=='ready'||!system.result.version)return null;
 const {result,inputs,review}=system;
 if(assessment.assessmentType==='kidney'){
  return make(result.version+'|'+inputs.sex,result.method,'Estimated kidney filtration',review?.egfr,'mL/min/1.73 m²');
 }
 if(assessment.assessmentType==='fitness'){
  const measured=result.method==='FRIEND';
  return make([result.version,inputs.sex,measured?inputs.testType:'estimated'].join('|'),result.method,
   measured?'Measured VO₂peak':'Estimated VO₂peak',measured?Number(inputs.vo2peak?.value):review?.estimatedVo2,'mL/kg/min');
 }
 if(assessment.assessmentType==='metabolic'&&!result.ageRange&&!result.ageBand&&isReportableAge(result.age)){
  return make(result.version,result.method,'Age comparison',result.age,'years',undefined,0);
 }
 return null;
}

export function comparableHistory(history, sample=false) {
 const grouped=new Map();
 for(const entry of history){
  if(Boolean(entry.sample)!==sample)continue;
  const point=entry.trend||historyMeasurement(entry,entry.saved);
  if(!point||!Number.isFinite(point.value)||!recordedDate(point.date))continue;
  if(!grouped.has(point.key))grouped.set(point.key,{...point,dates:new Map()});
  const series=grouped.get(point.key),previous=series.dates.get(point.date);
  if(!previous||entry.saved>=previous.saved)series.dates.set(point.date,{...point,saved:entry.saved});
 }
 return [...grouped.values()].map(({dates,...series})=>({...series,points:[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date))}))
  .sort((a,b)=>b.points.length-a.points.length||a.label.localeCompare(b.label));
}
