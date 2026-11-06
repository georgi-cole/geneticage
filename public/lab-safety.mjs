import {labs} from './lab-definitions.mjs';

export const LAB_SAFETY_VERSION='lab-review-2026-11-06-v1';
export const MAYO_CRITICAL_SOURCE='https://www.mayocliniclabs.com/-/media/it-mmfiles/Special-Instructions/4/2/A/critical-values-semi-urgent-results-list.pdf';
export const CROUSE_CRITICAL_SOURCE='https://laboratory.crouse.org/healthcare-providers/laboratory-services/reporting-documents/critical-value-chart/';
export const COHORT_SOURCE='https://github.com/dayoonkwon/BioAge/tree/b1f9fc02f086cd4aa74185f2335ab1366082e7fe';

// Conservative prototype coverage, derived from the cleaned BioAge NHANES III
// data, ages 20–84. Not normal ranges, critical limits or validated model bounds.
// CRP has no cohort lower gate: the historical assay's floor is not a modern
// analytical lower limit. Derivation and limitations: docs/LAB_SAFETY_POLICY.md.
export const INPUT_COVERAGE=Object.freeze({
 albumin:[22,61],creatinine:[9,247],glucose:[2,16.8],crp:[0,4.9],
 lymphocytes:[3.2,76.5],mcv:[59.7,117.6],rdw:[10.9,19.6],alp:[17,264],wbc:[2.1,18.6]
});
export const CRITICAL_MESSAGE='Potentially critical if confirmed. Check the value and unit. For a recent or unreviewed result, seek urgent medical advice. If seriously unwell, seek emergency care.';
export const COVERAGE_MESSAGE='Check the value, unit and test type against your report. This entry is outside the data coverage used by this prototype; a correct result can still be outside it. The age estimate will be withheld. Review it with your laboratory or clinician.';
export const DISPLAY_RANGE_REASON='The calculated estimate falls outside this prototype’s reporting range. No age is shown. Check the entries with your laboratory or clinician; the app cannot establish a reliable personal age from this result.';

const entered=value=>value!==undefined&&value!==null&&String(value).trim()!=='';
export function reviewLabSafety(id,entry={}){
 const lab=labs.find(item=>item.id===id);
 if(!lab)return {status:'invalid',message:'Check the measurement type.',warning:null};
 if(!entered(entry.value))return {status:'missing',message:'',warning:null};
 const unit=entry.unit||lab.units[0],raw=Number(entry.value);
 if(!['string','number'].includes(typeof entry.value)||!Number.isFinite(raw)||raw<=0)return {status:'invalid',message:'Enter an exact number above zero. Do not replace a “less than” result with zero or its detection limit.',warning:null};
 if(!lab.units.includes(unit))return {status:'invalid',message:'Select the unit printed on your report.',warning:null};
 const value=Number((raw*lab.factor(unit)).toPrecision(12));
 if(!Number.isFinite(value))return {status:'invalid',message:'Check this number and the selected unit.',warning:null};
 if(id==='lymphocytes'&&value>100)return {status:'invalid',message:'Lymphocytes must be a percentage, from above zero to 100. Do not enter an absolute cell count.',warning:null};
 let warning=null;
 // Compare in each source's original unit, preserving inclusive boundaries.
 const glucoseMg=id==='glucose'?Number((value*18.0182).toPrecision(12)):null;
 if(id==='glucose'&&(glucoseMg<=50||glucoseMg>=400))warning={code:'critical-glucose',source:'Mayo Clinic Laboratories · October 2026',url:MAYO_CRITICAL_SOURCE+'#page=2',threshold:'≤50 or ≥400 mg/dL',message:CRITICAL_MESSAGE};
 if(id==='wbc'&&value>=100)warning={code:'critical-wbc-high',source:'Mayo Clinic Laboratories · October 2026',url:MAYO_CRITICAL_SOURCE+'#page=1',threshold:'≥100 × 10⁹/L',message:CRITICAL_MESSAGE};
 if(id==='wbc'&&value<2)warning={code:'critical-wbc-low',source:'Crouse Health · Critical value chart',url:CROUSE_CRITICAL_SOURCE,threshold:'<2 × 10⁹/L',message:CRITICAL_MESSAGE};
 const [low,high]=INPUT_COVERAGE[id],outside=value<low||value>high;
 return {status:outside?'review':'ok',message:outside?COVERAGE_MESSAGE:'',warning,value,coverage:outside?{low,high,unit:lab.unit,url:COHORT_SOURCE}:null};
}

// A product reporting limit, not a biological validity threshold. Never clamp.
export function isReportableAge(value){return typeof value==='number'&&Number.isFinite(value)&&Math.round(value)>=1&&Math.round(value)<=99;}
export function clinicalForDisplay(clinical,{stored=false}={}){
 if(!clinical||clinical.reason||isReportableAge(clinical.value))return clinical;
 // Preserve immutable historical records; only their current presentation changes.
 return {reason:DISPLAY_RANGE_REASON,withheld:'reporting-range',safetyVersion:clinical.safetyVersion,earlierValueHidden:stored};
}
