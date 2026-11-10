import {composeReportDocument} from '../public/report-composer.mjs';
import {freshAssessment} from '../public/assessment-flow.mjs';
import {sampleAnswers,sampleLabs,assessClinical} from '../public/model.mjs';
import {assessSystem,systemSampleInputs} from '../public/system-assessments.mjs';
import {assessHeartVascular} from '../public/heart-vascular.mjs';
export function reportFixtures(){
 const clinicalState={...freshAssessment(),answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labFasting:'Yes',labContext:true,labSubmitted:true,sample:true};
 const clinical=state=>assessClinical({age:Number(state.labAge),lab:state.lab,contextConfirmed:state.labContext,fasting:state.labFasting});
 const critical=structuredClone(clinicalState);critical.lab.glucose={value:'400',unit:'mg/dL'};
 const sparse={...freshAssessment(),answers:{age:'45'},sample:true};
 const good={...freshAssessment(),sample:true,answers:{...sampleAnswers,moderate:'180',strength:'2',sleep:'8',rested:'Usually',diet:'5 or more',alcohol:'No, I have never drunk alcohol regularly'}};
 const cases=[
  ['clinical-phenoage',clinicalState,clinical(clinicalState)],
  ['health-profile',good,null],
  ['sparse-profile',sparse,null],
  ['critical',critical,clinical(critical)],
  ['heart-vascular',{assessmentType:'heart-vascular',sample:true,heart:assessHeartVascular({age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',systolic:{value:'140',unit:'mmHg'},diastolic:{value:'85',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'}})},null],
  ...['metabolic','kidney','fitness'].map(type=>[type,{assessmentType:type,sample:true,system:assessSystem(type,systemSampleInputs(type))},null]),
 ];
 return cases.map(([id,state,result])=>({id,state,clinical:result,document:composeReportDocument({state,clinical:result,generatedAt:'2026-11-10T00:00:00.000Z'})}));
}
