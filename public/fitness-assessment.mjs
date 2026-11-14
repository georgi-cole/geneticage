import {functionalSteps,functionalOutcome,functionalMethods} from './functional-assessment.mjs';

export const FITNESS_INTEGRATION_VERSION='fitness-integrated-v1';
export const physicalTestsIncluded=inputs=>inputs.physicalTests==='Include physical tests';
export const fitnessMethods=[
 'One fitness profile retains distinct published models. A complete compatible physical battery supplies the headline age. Otherwise a supported aerobic comparison supplies it. The ages are never averaged or adjusted using invented weights.',
 'HUNT estimates oxygen uptake from waist, resting pulse and activity at ages 20-89. Bradshaw (18-19) and BLSA (90-96) use their original inputs and FRIEND reference comparisons. A compatible supervised oxygen-uptake test uses FRIEND, within its supported groups.',
 'A routine aerobic estimate and a physical-battery estimate describe overlapping but different aspects of fitness. Agreement is not independent biological-age validation, and a difference is not a diagnosis. Changing the selected model can change the headline without establishing a change in fitness.',
 ...functionalMethods,
];

export function fitnessPhysicalSteps(inputs,baseline=[]){
 const age=Number(inputs.age?.value);
 if(age<20||age>94||!Number.isFinite(age))return [];
 const choice={id:'physical-tests',title:'Build your fitness picture',fields:['physicalTests'],skip:'Continue without physical tests',hint:'Optional physical tests add information about strength, endurance and movement. Complete what feels safe; you can skip any task.'};
 if(!physicalTestsIncluded(inputs))return [choice];
 const collected=new Set(baseline.flatMap(s=>s.fields));
 const tests=functionalSteps(inputs).filter(s=>s.id!=='age').map(s=>({...s,fields:s.fields.filter(id=>!collected.has(id))})).filter(s=>s.fields.length);
 return [choice,...tests];
}

export function integrateFitness(inputs,values,review,aerobicResult){
 const aerobic={result:aerobicResult,estimatedVo2:review.estimatedVo2??null,measuredVo2:aerobicResult.method==='FRIEND'?values.vo2peak:null};
 let physical=null;
 if(physicalTestsIncluded(inputs)){
  const physicalReview={};
  const result=functionalOutcome(inputs,values,physicalReview);
  physical={result,review:physicalReview};
 }
 const usePhysical=physical?.result.status==='ready';
 const bmi=Number.isFinite(values.height)&&Number.isFinite(values.weight)?values.weight/(values.height/100)**2:null;
 review.integrated={version:FITNESS_INTEGRATION_VERSION,primary:usePhysical?'physical':aerobicResult.status==='ready'?'aerobic':'none',aerobic,physical,bmi};
 return usePhysical?physical.result:aerobicResult;
}

// Describe relationships supported by the supplied measurements. No domain
// scores, normal ranges or additional age coefficients are invented here.
export function fitnessContext(inputs,integrated){
 const {aerobic,physical,primary,bmi}=integrated;
 const tasks=physical?.review.domains||[];
 const completed=tasks.filter(t=>t.value!==null);
 const has=id=>completed.some(t=>t.id===id);
 const readings=ids=>completed.filter(t=>ids.includes(t.id)).map(t=>`${t.title}: ${Number(Number(inputs[t.id]?.value??t.value).toFixed(1))} ${inputs[t.id]?.unit??t.unit}`).join('; ');
 const ready=aerobic.result.status==='ready';
 const sections=[];
 const add=(id,title,paragraphs)=>sections.push({id,title,paragraphs});
 add('fitness-picture','How your results fit together',[
  primary==='physical'?'Your headline fitness age combines the complete physical-test battery. It brings several aspects of fitness into one estimate; your aerobic information helps explain that wider picture.'
   :primary==='aerobic'?(completed.length?'Your headline fitness age describes aerobic capacity: how well your body can support sustained activity. Your physical-test results add context about tasks this aerobic estimate cannot describe on its own.':'Your headline fitness age describes aerobic capacity: how well your body can support sustained activity. Optional physical tests can add strength and movement context; those areas have not been inferred from this age.')
    :'There is not enough compatible information for a fitness age yet. The results you did provide still help describe your fitness; missing measurements have not been treated as zero.',
  ready?(aerobic.result.method==='FRIEND'?'Your oxygen uptake was measured during a supervised exercise test. This provides aerobic context alongside the movement tasks.':'Your aerobic capacity was estimated from the questionnaire and measurements. Activity used in that calculation is part of the estimate, not independent proof that it is accurate.'):'An aerobic comparison is not available from the current information. Physical tasks cannot be substituted for a measured oxygen-uptake test.',
 ]);
 if(primary==='physical'&&ready){
  const main=physical.result,other=aerobic.result,age=Number(inputs.age.value);
  if(!main.ageRange&&!other.ageRange&&Number.isFinite(other.age)){
   const same=Math.sign(main.age-age)===Math.sign(other.age-age);
   add('fitness-pattern','Reading the overall pattern',[
    same?'The physical-battery and aerobic age comparisons point in the same direction relative to your age. They use different measurements and study populations, so agreement does not establish an exact biological age.'
     :'The physical-battery and aerobic age comparisons point in different directions relative to your age. They describe different aspects of fitness and use different study populations. One result does not cancel the other out.',
    'The headline uses the physical battery. The aerobic comparison remains supporting context; the two ages are not averaged.'
   ]);
  }
 }
 if(completed.length){
  const paragraphs=[];
  if(has('pacer')||has('jump')||has('situps'))paragraphs.push(`Across the tasks you completed: ${readings(['pacer','jump','situps'])}. Running endurance, explosive leg power and repeated trunk effort describe different demands. Performance in one task does not establish your capacity in the others.`);
  if(has('chair30')||has('march')||has('tug'))paragraphs.push(`Across the movement tasks you completed: ${readings(['chair30','march','tug'])}. Chair rises reflect repeated standing effort; marching adds sustained leg activity. Timed Up and Go combines rising, walking and turning. Together they give context for everyday movement, rather than identifying one muscle or one cause of difficulty.`);
  if(has('grip'))paragraphs.push(`Your strength context: ${readings(['grip'])}. Grip complements the leg and walking tasks. It does not measure whole-body muscle mass, so it cannot by itself explain your BMI or body composition.`);
  if(has('reach'))paragraphs.push(`Your flexibility context: ${readings(['reach'])}. Endurance or strength can be well developed while flexibility remains a different training consideration; a reach result alone does not explain pain or mobility limitations.`);
  add('fitness-capacity','Endurance, strength and movement',paragraphs);
 }
 if(inputs.daily)add('fitness-daily','What this means for everyday activity',[
  inputs.daily==='No limitation'?'You did not report everyday limitations. The test results add information about specific demands; that answer does not establish that every area of fitness is equally developed.'
   :'You reported limitations in everyday activity. Read these alongside the standing, endurance and movement tasks you completed. The results can guide a discussion about difficult activities, but cannot identify the cause of a limitation.',
 ]);
 if(bmi!==null||inputs.bodyFat||inputs.skeletalMuscle)add('fitness-body','Body composition in context',[
  ...(bmi===null?[]:[`Your BMI is ${Number(bmi.toFixed(1))}. It compares weight with height and cannot distinguish muscle from fat. Read it alongside performance and any measured composition readings, rather than using it alone to judge fitness.`]),
  ...(inputs.bodyFat?[`Your recorded body fat is ${Number(Number(inputs.bodyFat.value).toFixed(1))}%.`]:[]),
  ...(inputs.skeletalMuscle?[`Your recorded skeletal muscle is ${Number(Number(inputs.skeletalMuscle.value).toFixed(1))}%.`]:[]),
  ...(inputs.compositionMethod?[`Measurement method: ${inputs.compositionMethod}. Compare readings from the same method under similar conditions.`]:[]),
  primary==='physical'&&physical.review.bmi!==undefined?'BMI is a required input in this published physical-battery equation. Composition readings help interpret that limitation; they do not change its coefficients.':'Body composition is context here; it has not been given extra years or used to adjust the published age equation.',
 ]);
 if(physical)add('fitness-coverage','How complete is this picture?',[
  `${completed.length} of ${tasks.length} physical tasks have a recorded result. Skipped tasks remain unknown; they are not failures or scores of zero.`,
  physical.result.status==='ready'?'The physical battery meets the app’s current calculation rules. Its age is still a research comparison with population and protocol limitations.'
   :'The physical battery cannot supply a combined age under the current testing conditions. Any available aerobic estimate keeps its own meaning and is not a replacement strength or mobility score.',
 ]);
 const limited=inputs.pain==='Yes'||physical?.result.issue==='functional-readiness'||Boolean(inputs.fitnessContext&&inputs.fitnessContext!=='None of these');
 add('fitness-plan','Your next steps',limited?[
  'Review pain or exercise symptoms before repeating demanding tests. Bring the everyday limitations and completed results together when discussing suitable activity with a qualified professional.',
 ]:[
  has('chair30')||has('tug')?'Combine suitable aerobic activity with controlled chair rises, strength work and comfortable turning or walking practice. This addresses stamina and everyday movement together.':'Combine suitable aerobic activity with progressive strength work. Add comfortable mobility practice; improving one task does not automatically improve every part of the profile.',
  'Choose a manageable routine based on your goals and any everyday difficulties. Repeat comparable measurements after a period of practice using the same setup. A different model or testing method can change the age comparison without demonstrating a real change in fitness.',
 ]);
 return sections;
}
