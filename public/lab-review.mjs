import {labs} from './lab-definitions.mjs';
import {hsCrpGuide,referenceCatalog,referenceVersions,REFERENCE_CATALOG_VERSION} from './lab-reference-catalog.mjs';

const entered=value=>value!==undefined&&value!==null&&(typeof value!=='string'||value.trim()!=='');
export function validateReferenceLimits({referenceLow:low,referenceHigh:high}={}){
 if([low,high].some(value=>entered(value)&&(!['string','number'].includes(typeof value)||String(value).length>32||!Number.isFinite(Number(value))||Number(value)<0)))return 'Reference limits must be numbers at or above zero.';
 if(entered(low)&&entered(high)&&Number(low)>=Number(high))return 'The lower reference limit must be below the upper limit.';
 return null;
}

export function validateLabReferences(data){
 const errors={};
 for(const lab of labs){
  const error=validateReferenceLimits(data?.[lab.id]||{});
  if(error)errors[lab.id]=error;
 }
 return errors;
}
// The unit selector identifies the measurement as printed. Keep any previously
// entered reference bounds in the same physical units when that selector changes.
export function setLabEntryUnit(id,entry,unit){
 return setMeasurementUnit(labs.find(item=>item.id===id),entry,unit);
}

export function setMeasurementUnit(lab,entry,unit){
 const previous=entry.unit||lab?.units[0];
 if(!lab||!lab.units.includes(unit)||!lab.units.includes(previous))return entry;
 const next={...entry,unit};
 if(previous===unit)return next;
 for(const key of ['referenceLow','referenceHigh']){
  if(!lab.factor){delete next[key];delete next[key+'Exclusive'];}
  else if(entered(entry[key])&&Number.isFinite(Number(entry[key])))next[key]=String(Number((Number(entry[key])*lab.factor(previous)/lab.factor(unit)).toPrecision(12)));
 }
 return next;
}
export function compareLabReference(entry){
 if(!entered(entry?.value))return {status:'missing',label:'Not entered'};
 if(!Number.isFinite(Number(entry.value))||Number(entry.value)<=0)return {status:'invalid',label:'Check the value'};
 if([entry.referenceLow,entry.referenceHigh].some(value=>entered(value)&&!['string','number'].includes(typeof value)))return {status:'invalid',label:'Check the reference interval'};
 const low=entered(entry.referenceLow)?Number(entry.referenceLow):null,high=entered(entry.referenceHigh)?Number(entry.referenceHigh):null;
 if(low===null&&high===null)return {status:'unknown',label:'Reference not entered'};
 if([low,high].some(value=>value!==null&&(!Number.isFinite(value)||value<0))||low!==null&&high!==null&&low>=high)return {status:'invalid',label:'Check the reference interval'};
 const value=Number(entry.value);
 if(low!==null&&(value<low||entry.referenceLowExclusive===true&&value===low))return {status:'below',label:'Below your lab interval',low,high};
 if(high!==null&&(value>high||entry.referenceHighExclusive===true&&value===high))return {status:'above',label:'Above your lab interval',low,high};
 return {status:'within',label:'Within your lab interval',low,high};
}

export function labReferenceGroup({labReferenceGroup:chosen,answers}={}){
 return chosen??(answers?.sex==='Female'?'female':answers?.sex==='Male'?'male':'unspecified');
}

export function reviewLabReference(id,entry={},context={}){
 const lab=labs.find(item=>item.id===id),unit=entry.unit||lab?.units[0];
 const own=entered(entry.referenceLow)||entered(entry.referenceHigh);
 const basic=compareLabReference(entry);
 if(own||['missing','invalid'].includes(basic.status))return {...basic,sourceKind:own?'lab':null,unit,comparisonValue:Number(entry.value),lowExclusive:entry.referenceLowExclusive===true,highExclusive:entry.referenceHighExclusive===true};
 const unknown=(reason,label='No reference comparison')=>({status:'unknown',label,reason,unit,sourceKind:null});
 if(!lab||!lab.units.includes(unit))return {status:'invalid',label:'Check the unit'};
 // Missing metadata on earlier saved records intentionally leaves them lab-only.
 if(context.labReferenceMode!=='published')return unknown('Add the interval from your lab report.');
 if(!referenceVersions.includes(context.labReferenceVersion))return unknown('The reference guide version is unavailable. Add your laboratory interval.');
 if(!Number.isInteger(Number(context.labAge))||Number(context.labAge)<18)return unknown('The published guide is for adults. Confirm your age at the blood draw.');
 if(context.labContext!==true)return unknown('The collection context needs individual review. Add your laboratory interval.');
 const highSensitivity=id==='crp'&&entry.assay==='hs-crp'&&context.labReferenceVersion===REFERENCE_CATALOG_VERSION;
 const guide=highSensitivity?hsCrpGuide:referenceCatalog.intervals[id];
 const source=highSensitivity?hsCrpGuide:referenceCatalog;
 const group=labReferenceGroup(context);
 if(guide.fasting&&context.labFasting!=='Yes')return unknown('The published glucose interval requires confirmed fasting.');
 if(id==='creatinine'&&!['female','male'].includes(group))return unknown('Choose a reference group beside creatinine, or enter the interval from your lab.','Reference group needed');
 if(guide.assay&&entry.assay!==guide.assay)return unknown(entry.assay==='hs-crp'
  ? 'Use your laboratory’s hs-CRP interval with this reference guide.'
  : 'Select Standard CRP or hs-CRP beside the reading, or enter the interval from your lab.',entry.assay==='hs-crp'?'Lab interval needed':'CRP test type needed');
 const interval=id==='creatinine'?guide[group]:guide;
 // Compare in the source's original units so rounded converted limits cannot
 // misclassify a value at a boundary. The original entry is never rewritten.
 const comparisonValue=Number((Number(entry.value)*lab.factor(unit)/lab.factor(guide.unit)).toPrecision(12));
 const highExclusive=interval.highExclusive===true;
 const comparison=compareLabReference({value:comparisonValue,referenceLow:interval.low,referenceHigh:interval.high,referenceHighExclusive:highExclusive});
 const label=highSensitivity?(comparison.status==='above'?'At or above the hs-CRP threshold':'Below the hs-CRP threshold')
  :comparison.label.replace('your lab interval','published guide');
 return {...comparison,label,sourceKind:'published',sourceLabel:source.label,sourceUrl:guide.page?source.url+'#page='+guide.page:source.url,sourceVersion:source.version,unit:guide.unit,comparisonValue,lowExclusive:false,highExclusive,threshold:highSensitivity};
}
export const labDescriptions={
 albumin:'A protein in the blood, made by the liver.',
 creatinine:'A waste product filtered from the blood by the kidneys.',
 glucose:'The concentration of sugar in the blood.',
 crp:'A protein that can rise with inflammation.',
 lymphocytes:'The proportion of white blood cells that are lymphocytes.',
 mcv:'The average size of red blood cells.',
 rdw:'How much red blood cell sizes vary.',
 alp:'An enzyme found in several tissues, including liver and bone.',
 wbc:'The total number of white blood cells.'
};
export const LAB_REFERENCE_SOURCE='https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/';
