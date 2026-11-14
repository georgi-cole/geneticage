import {labs,normalizeLab} from './lab-definitions.mjs';
import {reviewLabSafety,clinicalForDisplay,LAB_SAFETY_VERSION} from './lab-safety.mjs';
export {labs,normalizeLab} from './lab-definitions.mjs';
export const DECLINED_ANSWER='Prefer not to say';
export const EXCLUSIVE_ANSWERS=['None','Not sure',DECLINED_ANSWER];
const compositionMethods=['Smart scale or bioimpedance','DXA scan','Other measurement'];
const hasCompositionReading=answers=>compositionMethods.includes(answers.compositionMethod);
const centimetres=(value,unit)=>Number(value)*(unit==='in'?2.54:1);
const weightKg=(value,unit)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value)*(unit==='lb'?0.45359237:1):null;
const weightChangeKg=a=>{
 const current=weightKg(a.weight,a.weightUnit||'kg'),yearAgo=weightKg(a.weightYearAgo,a.weightYearAgoUnit||'kg');
 return current!==null&&yearAgo!==null?{loss:yearAgo-current,previous:yearAgo}:null;
};
export const hasLargeRecentWeightLoss=a=>{
 const change=weightChangeKg(a);
 return change!==null&&change.loss>=Math.min(4.5359237,change.previous*0.05)-1e-9;
};
export const profileSectionsV1=[
 {name:'About you',title:'About you',intro:'Enter your age, height and weight to complete your health profile.',questions:[
  {id:'age',label:'How old are you?',type:'number',unit:'years',required:true,min:18,max:120,step:1},
  {id:'sex',label:'Which sex should we use for health comparisons?',options:['Female','Male','Prefer not to say'],hint:'Some reference equations use separate values for female and male adults.'},
  {id:'country',label:'Which country do you live in?',type:'country',hint:'Helps KoleQuant check consultation availability. It does not affect your age estimate.'},
  {id:'height',label:'What is your height?',type:'measure',units:['cm','in'],required:true,requiredMessage:'Enter your height.',hint:'For feet and inches, enter the total in inches. We use your height and weight to calculate BMI.'},
  {id:'weight',label:'What is your weight?',type:'measure',units:['kg','lb'],required:true,requiredMessage:'Enter your weight.'},
  {id:'weightYearAgo',label:'About how much did you weigh 12 months ago?',type:'measure',units:['kg','lb'],hint:'Use your best estimate. If you are pregnant, enter your weight before pregnancy.'},
  {id:'weightChangeIntent',label:'Was this weight loss intentional?',options:['Yes','No','Not sure','Prefer not to say'],show:hasLargeRecentWeightLoss},
  {id:'health',label:'How would you describe your overall health today?',options:['Excellent','Very good','Good','Fair','Poor','Not sure']} ]},
 {name:'Tobacco',title:'Smoking and nicotine',intro:'Include occasional smoking as well as daily use.',questions:[
  {id:'smokingEver100',label:'Have you smoked at least 100 cigarettes in your life?',hint:'That is about five standard packs. This question is about cigarettes, not cigars, shisha or vaping.',options:['Yes','No','Not sure','Prefer not to say']},
  {id:'smoking',label:'Do you currently smoke cigarettes?',hint:'Choose “Some days” if you smoke occasionally.',options:['Every day','Some days','Not at all','Prefer not to say']},
  {id:'smokingRegular',label:'Have you ever smoked cigarettes fairly regularly?',hint:'“Regularly” means when you consider regular smoking to have begun.',options:['Yes','No','Not sure','Prefer not to say'],show:a=>a.smokingEver100==='Yes'||['Every day','Some days'].includes(a.smoking)},
  {id:'smokingStartAge',label:'How old were you when you first began smoking cigarettes regularly?',hint:'If you started before age 6, enter 6. Skip if you are unsure.',type:'number',min:6,max:120,step:1,show:a=>a.smokingRegular==='Yes'},
  {id:'smokingDays30',label:'On how many of the past 30 days did you smoke a cigarette?',type:'number',unit:'days',min:1,max:30,step:1,show:a=>a.smoking==='Some days'},
  {id:'cigarettes',label:'On a day when you smoke, how many cigarettes do you usually have?',hint:'If you smoke only on some days, think of the past 30 days.',type:'number',min:0.1,max:200,show:a=>['Every day','Some days','Smoke now'].includes(a.smoking)},
  {id:'quit',label:'How long ago did you stop smoking regularly?',options:['Less than 1 year','1–4 years','5–9 years','10–19 years','20–49 years','50 or more years','Not sure'],show:a=>a.smokingRegular==='Yes'&&a.smoking==='Not at all'},
  {id:'nicotine',label:'Do you currently use any of these other tobacco or nicotine products?',hint:'Answer separately from cigarettes.',type:'multi',options:['Cigars or pipe','Shisha or waterpipe','Heated tobacco','Vape or e-cigarette','Oral tobacco','Nicotine replacement used to stop smoking','None','Prefer not to say']} ]},
 {name:'Alcohol',title:'Alcohol use',intro:'For the amount and frequency questions, think about the past four weeks.',questions:[
  {id:'alcohol',label:'Do you currently drink alcohol?',options:['No, I have never drunk alcohol regularly','No, I used to drink','Yes','Prefer not to say'],hint:'If you usually drink but had none in the past four weeks, you can enter 0 drinking days.'},
  {id:'alcoholDays',label:'In a typical week, on how many days did you drink alcohol?',options:['0','1','2','3','4','5','6','7','My pattern varies'],show:a=>a.alcohol==='Yes'},
  {id:'drinks',label:'On a day when you drank, what did you usually have?',type:'drinks',show:a=>a.alcohol==='Yes',hint:'Add each drink type with its serving size and alcohol percentage. For example: 1 glass of wine, 150 mL, 12%. Leave amounts blank if you are unsure.'} ]},
 {name:'Movement',title:'Physical activity',intro:'Think about a typical week in the past four weeks. Include activity at work, at home and while travelling. Enter each activity once.',questions:[
  {id:'moderate',label:'About how many minutes of moderate activity do you do each week?',type:'number',min:0,max:10080,unit:'min / week',hint:'You breathe faster but can still talk, for example during brisk walking.'},
  {id:'vigorous',label:'About how many minutes of vigorous activity do you do each week?',type:'number',min:0,max:10080,unit:'min / week',hint:'Activity that makes conversation difficult, for example running.'},
  {id:'strength',label:'On how many days each week do you do activities that strengthen your muscles?',options:['0','1','2','3','4','5','6','7','Not sure']},
  {id:'limitations',label:'Does a health condition, disability, pain or recovery from illness limit your activity?',options:['No','Sometimes','Often','Prefer not to say']} ]},
 {name:'Sleep',title:'Sleep and stress',intro:'These questions refer to the past four weeks.',questions:[
  {id:'sleep',label:'During the past four weeks, how many hours did you usually sleep in a 24-hour period, including naps?',type:'number',unit:'hours',min:0,max:24,step:0.25},
  {id:'rested',label:'How often did you feel rested after sleep?',options:['Usually','Sometimes','Rarely','Not sure']},
  {id:'disrupted',label:'Do your work or caring responsibilities regularly disrupt your sleep schedule?',options:['No','Yes','Prefer not to say']},
  {id:'stress',label:'During the past four weeks, how often did stress feel difficult to manage?',options:['Never','Occasionally','Often','Almost every day','Prefer not to say']} ]},
 {name:'Health history',title:'Diet and health history',intro:'Include conditions diagnosed by a healthcare professional and treatments you currently receive.',questions:[
  {id:'diet',label:'On a typical day, how many portions of vegetables and fruit do you eat?',options:['0','1–2','3–4','5 or more','Not sure'],hint:'One portion is roughly 80 g, such as a medium apple or a serving of vegetables. Do not count potatoes or fruit juice here. This question covers one part of your diet.'},
  {id:'conditions',label:'Has a healthcare professional told you that you have any of the following?',type:'multi',options:['High blood pressure','Diabetes','Heart or blood-vessel disease','Kidney disease','Liver disease','Long-term lung disease','Cancer','Another long-term condition','None','Not sure','Prefer not to say']},
  {id:'medicines',label:'Are you currently taking any of these prescribed treatments?',type:'multi',options:['Blood-pressure medicine','Diabetes medicine','Cholesterol-lowering medicine','Cancer treatment','Immune-suppressing treatment','Another regular prescription','None','Not sure','Prefer not to say']},
  {id:'context',label:'Does any of the following apply to you now?',type:'multi',options:['Pregnant','Recently gave birth','Receiving dialysis','Recovering from major surgery','None','Prefer not to say'],optionLabels:{'Recently gave birth':'Recovering after childbirth'}},
  {id:'illness',label:'Have you had a fever, infection or other short-term illness during the past two weeks?',options:['No','Yes','Not sure','Prefer not to say']} ]}
];
export const sections=[
 ...profileSectionsV1,
 {name:'Body measurements',questions:[
  {id:'waist',label:'What is your waist circumference?',type:'measure',units:['cm','in'],min:1,max:300,hint:'Measure midway between your lowest rib and the top of your hip after breathing out normally. Skip if you don’t have a measurement.'},
  {id:'compositionMethod',label:'How was your body composition measured?',options:compositionMethods,hint:'Use an existing scale or scan reading. Skip if you don’t have one.'},
  {id:'bodyFat',label:'What body fat percentage was reported?',type:'number',unit:'%',min:0.1,max:100,show:hasCompositionReading},
  {id:'skeletalMuscle',label:'What skeletal muscle percentage was reported?',type:'number',unit:'%',min:0.1,max:100,show:hasCompositionReading,hint:'Use the value labeled skeletal muscle percentage. Skip if your report lists only lean mass.'},
  {id:'bodyWater',label:'What total body water percentage was reported?',type:'number',unit:'%',min:0.1,max:100,show:hasCompositionReading,hint:'Use the reported percentage from the same reading if available.'}
 ]}
];
export const legacySections=profileSectionsV1.map(section=>{
 if(section.name==='About you')return {...section,questions:section.questions.filter(q=>!['weightYearAgo','weightChangeIntent'].includes(q.id))};
 if(section.name==='Tobacco')return {...section,questions:[
  {id:'smoking',label:'Which best describes your cigarette smoking?',options:['Never smoked regularly','Used to smoke regularly','Smoke now','Prefer not to say'],optionLabels:{'Never smoked regularly':'I do not smoke and have never smoked regularly','Used to smoke regularly':'I used to smoke, but no longer do','Smoke now':'I smoke now, daily or occasionally'}},
  {id:'cigarettes',label:'On a day when you smoke, how many cigarettes do you usually have?',type:'number',min:0.1,max:200,show:a=>a.smoking==='Smoke now'},
  {id:'smokingYears',label:'For approximately how many years have you smoked cigarettes regularly?',type:'number',min:0,max:100,show:a=>['Smoke now','Used to smoke regularly'].includes(a.smoking)},
  {id:'quit',label:'How long ago did you stop smoking regularly?',options:['Less than 1 year','1–4 years','5–9 years','10 years or more','Not sure'],show:a=>a.smoking==='Used to smoke regularly'},
  {id:'nicotine',label:'Do you use tobacco or nicotine in any of these forms?',type:'multi',options:['Cigars or pipe','Shisha or waterpipe','Heated tobacco','Vape or e-cigarette','Oral tobacco','Nicotine replacement used to stop smoking','None','Prefer not to say']}
 ]};
 return section;
});
export function calculatePhenoAge(age,x){
 const xb=-19.907-0.0336*x.albumin+0.0095*x.creatinine+0.1953*x.glucose+0.0954*Math.log(x.crp)-0.012*x.lymphocytes+0.0268*x.mcv+0.3306*x.rdw+0.00188*x.alp+0.0554*x.wbc+0.0804*age;
 // Algebraically equivalent to the published Gompertz mortality transformation;
 // work in log space to avoid cancellation. Mortality itself is never displayed.
 return 141.50225+(Math.log(0.0055305)+xb+Math.log(Math.expm1(120*0.0076927)/0.0076927))/0.090165;
}
export function validateLabs(data){
 const errors={};
 for(const l of labs){const d=data[l.id];if(d?.value==null||d.value==='')errors[l.id]='Enter the value from your report. All nine measurements are required.';else if(!Number.isFinite(Number(d.value))||Number(d.value)<=0)errors[l.id]='Enter a value above zero. If the report says “less than”, leave this calculation for professional review.';else if(!l.units.includes(d.unit||l.units[0]))errors[l.id]='Select the unit printed on your report.';}
 const x=normalizeLab(data);if(x.lymphocytes>100)errors.lymphocytes='A percentage cannot exceed 100. Check the measurement type.';
 return errors;
}
export function eligibility(a,age){
 if(!Number.isInteger(Number(age))||age<20||age>84)return 'This version provides a blood-based age estimate for ages 20–84. You can still use the health and lifestyle assessment.';
 return null;
}
export const ASSESSMENT_PROTOCOL='questionnaire-context-2026-11-09-v2';
export function assessClinical({age,lab,contextConfirmed,fasting}){
 const checks=labs.map(({id})=>({id,...reviewLabSafety(id,lab?.[id])})).filter(check=>!['ok','missing'].includes(check.status)||check.warning);
 const metadata={checks,safetyVersion:LAB_SAFETY_VERSION};
 if(checks.some(check=>check.warning))return {...metadata,withheld:'critical-values',reason:'A blood entry meets a published critical-result alert threshold. Check the value and unit. For a recent or unreviewed result, seek urgent medical advice. If seriously unwell, seek emergency care. No age is calculated.'};
 const reason=eligibility({},Number(age));if(reason)return {...metadata,reason};
 if(!contextConfirmed)return {...metadata,reason:'Your health or treatment at the time of the blood draw needs individual review. We have not calculated an age estimate.'};
 if(fasting!=='Yes')return {...metadata,reason:'Fasting for at least eight hours has not been confirmed. This version uses fasting samples to match the conditions of the validation study. Your blood values can still be saved for review.'};
 if(Object.keys(validateLabs(lab)).length)return {...metadata,reason:'The calculation needs all nine blood values in the correct units. Check your entries against the laboratory report.'};
 if(checks.some(check=>['invalid','review'].includes(check.status)))return {...metadata,withheld:'input-coverage',reason:'Some readings need checking or fall outside the range used to estimate age. Review the values, units and test types with your laboratory or clinician.'};
 const x=normalizeLab(lab),value=calculatePhenoAge(Number(age),x);
 return clinicalForDisplay({...metadata,x,value,gap:value-Number(age)});
}
export function validateQuestionnaire(a,{requireAge=true,requireMeasurements=false}={}){
 const errors={};
 if(a.birthYear&&(!/^\d{4}$/.test(String(a.birthYear))||Number(a.birthYear)<new Date().getFullYear()-121||Number(a.birthYear)>new Date().getFullYear()-18))errors.birthYear='Check your four-digit birth year.';
 for(const q of sections.flatMap(s=>s.questions).filter(q=>!q.show||q.show(a))){
  if(q.type!=='number'&&q.type!=='measure')continue;
  const value=a[q.id];
  if(value==null||value===''){
   if(q.id==='age'&&requireAge)errors.age='Enter your age in whole years.';
   else if(requireMeasurements&&q.requiredMessage)errors[q.id]=q.requiredMessage;
   continue;
  }
  const n=Number(value),unit=a[q.id+'Unit'];
  if(!['number','string'].includes(typeof value)||!Number.isFinite(n)||n<(q.min??0.1)||n>(q.max??1000)||
     (q.id==='age'&&!Number.isInteger(n))||(q.units&&unit&&!q.units.includes(unit))){
   errors[q.id]=q.id==='age'?'This assessment is for adults aged 18 or over. Enter your age in whole years.':'Check this number and the selected unit.';
  }
 }
 if(a.smokingStartAge!==undefined&&a.smokingStartAge!==''&&(!Number.isInteger(Number(a.smokingStartAge))||Number(a.smokingStartAge)>Number(a.age)))errors.smokingStartAge='Starting age must be a whole number no greater than your current age.';
 if(a.smokingDays30!==undefined&&a.smokingDays30!==''&&!Number.isInteger(Number(a.smokingDays30)))errors.smokingDays30='Enter a whole number of days.';
 if(a.smokingYears!==undefined&&a.smokingYears!==''&&a.age&&Number(a.smokingYears)>Number(a.age))errors.smokingYears='The number of years smoked cannot be greater than your age.';
 for(const q of sections.flatMap(s=>s.questions).filter(q=>q.type==='multi')){const v=a[q.id];if(Array.isArray(v)&&v.length>1&&v.some(x=>EXCLUSIVE_ANSWERS.includes(x)))errors[q.id]='Choose an exclusive answer on its own.';}
 if(a.moderate!==undefined&&a.vigorous!==undefined&&Number(a.moderate)+Number(a.vigorous)>10080)errors.vigorous='Together, these activity totals exceed the number of minutes in a week. Check that you entered weekly minutes.';
 for(const d of a.drinks||[])if([d.count,d.ml,d.abv].some(v=>v!==''&&(!Number.isFinite(Number(v))||Number(v)<=0))||Number(d.abv)>100)errors.drinks='Check the serving count, size and alcohol percentage. Leave an amount blank if you do not know it.';
 return errors;
}

export function profileMeasurementErrors(answers={}){
 const errors=validateQuestionnaire(answers,{requireMeasurements:true});
 return Object.fromEntries(['age','height','weight'].filter(id=>errors[id]).map(id=>[id,errors[id]]));
}

export function profileBmi(answers){
 if(Object.keys(profileMeasurementErrors(answers)).length)return null;
 const heightMetres=centimetres(answers.height,answers.heightUnit)/100;
 return weightKg(answers.weight,answers.weightUnit)/heightMetres**2;
}
export function profileWaistRatio(answers,bmi){
 if(bmi===null||bmi>=35||!answers.waist||validateQuestionnaire(answers).waist)return null;
 if(answers.context?.some(value=>['Pregnant','Recently gave birth'].includes(value)))return null;
 return centimetres(answers.waist,answers.waistUnit)/centimetres(answers.height,answers.heightUnit);
}
const known=v=>v!==undefined&&v!==null&&v!==''&&v!=='Not sure'&&v!=='Prefer not to say';
export function sleepReference(age){return Number(age)>=65?'7–8 hours a day':Number(age)>=61?'7–9 hours a day':'at least 7 hours a day';}
export function insights(a){
 const i=[];
 if(['Every day','Some days','Smoke now'].includes(a.smoking))i.push({key:'tobacco',name:'Smoking',tag:'Stopping smoking',text:`You currently smoke cigarettes${a.smoking==='Every day'?' every day':a.smoking==='Some days'?' on some days':''}. Stopping smoking reduces health risks, including the risk of heart disease.`,action:'A clinician or stop-smoking service can help you choose support, including suitable medicines if needed.',sources:['tobacco']});
 else if(a.nicotine?.some(x=>!['None','Prefer not to say','Nicotine replacement used to stop smoking'].includes(x)))i.push({key:'tobacco',name:'Tobacco and nicotine',tag:'Product-specific advice',text:'You use a tobacco or nicotine product. The risks and suitable cessation support depend on the product.',action:'Ask a clinician or pharmacist about options for reducing harm or stopping.',sources:['tobacco']});
 const weightChange=weightChangeKg(a);
 if(hasLargeRecentWeightLoss(a)&&a.weightChangeIntent==='No')i.push({key:'weight-change',name:'Recent weight change',tag:'Unintentional change',text:weightChange.loss/weightChange.previous>=0.05?'You reported losing at least 5% of your previous weight over the past year without intending to.':'You reported losing 10 lb (about 4.5 kg) or more over the past year without intending to.',action:'Consider discussing this change with a healthcare professional.',sources:['weight-change']});
 const adapted=(known(a.limitations)&&a.limitations!=='No')||a.illness==='Yes'||a.context?.some(x=>!['None','Prefer not to say'].includes(x));
 if(adapted)i.push({key:'movement',name:'Physical activity',tag:'Adapt activity to your health',text:'Your answers describe a health limitation, recent illness or recovery. A standard activity target may not suit you at present.',action:'Ask someone familiar with your care which activities and amounts are appropriate, and how to build up safely.',sources:['activity']});
 else if(known(a.moderate)&&known(a.vigorous)&&Number(a.moderate)+2*Number(a.vigorous)<150)i.push({key:'movement',name:'Physical activity',tag:'Aerobic activity',text:`Your entries add up to ${Number(a.moderate)+2*Number(a.vigorous)} moderate-equivalent minutes a week. General adult guidance starts at 150 minutes of moderate activity, 75 minutes of vigorous activity, or a mixture.`,action:'If suitable for your health, add an amount you can manage and increase gradually. Even a small increase can be useful.',sources:['activity']});
 if(!adapted&&known(a.strength)&&Number(a.strength)<2)i.push({key:'strength',name:'Muscle-strengthening activity',tag:'Strength and function',text:`You reported muscle-strengthening activity on ${a.strength} ${Number(a.strength)===1?'day':'days'} a week. General adult guidance recommends at least two days, alongside aerobic activity.`,action:'Consider an activity you can do safely, such as suitable resistance exercises. Seek individual advice if a condition or injury affects what you can do.',sources:['activity']});
 if((known(a.sleep)&&Number(a.sleep)<7)||a.rested==='Rarely')i.push({key:'sleep',name:'Sleep',tag:'Duration and quality',text:a.rested==='Rarely'?`You rarely feel rested after sleep.${known(a.sleep)?` You reported ${a.sleep} hours a day.`:''} Duration alone does not describe sleep quality.`:`You reported ${a.sleep} hours of sleep a day. CDC guidance for your age group is ${sleepReference(a.age)}.`,action:a.disrupted==='Yes'?'Your work or caring schedule disrupts sleep. Identify any practical support that could protect rest time; discuss persistent tiredness or sleep problems with a clinician.':'Keep a consistent sleep schedule where possible. Speak with a clinician if sleep difficulties or daytime tiredness persist.',sources:['sleep']});
 if(a.alcohol==='Yes')i.push({key:'alcohol',name:'Alcohol',tag:'Amount and frequency',text:'Alcohol carries health risks even at low levels. Your answers describe drinking habits; they do not establish a safe personal limit or diagnose dependence.',action:'Review how much you drink and how often. If you drink heavily or have withdrawal symptoms, seek medical advice before making a sudden change.',sources:['alcohol']});
 if(['0','1–2','3–4'].includes(a.diet))i.push({key:'diet',name:'Fruit and vegetables',tag:'Part of your diet',text:`You reported ${a.diet} portions a day. WHO guidance is at least 400 g—roughly five portions—for adults. This question does not assess your whole diet.`,action:'Consider a serving you could add to a usual meal, using foods you enjoy and can afford. Follow any dietary advice given for your medical conditions.',sources:['diet']});
 if(['Often','Almost every day'].includes(a.stress))i.push({key:'wellbeing',name:'Stress',tag:'Effect on daily life',text:'You often find stress difficult to manage. The questionnaire does not assess a mental-health condition.',action:'Identify the pressures affecting you and any support available. If stress is interfering with daily life, discuss it with a healthcare professional.',sources:[]});
 if(!i.length)i.push({key:'context',name:'Review your answers',tag:'No specific priority identified',text:'The information provided has not identified a priority under this assessment’s rules. That does not establish that your health risks are low.',action:'Check any unanswered questions and raise health concerns through your usual care. This short profile does not cover every aspect of health.',sources:[]});
 return i;
}
export function domainCards(a){return [
 ['Smoking',a.smoking||'Not provided',a.smoking==='Smoke now'],
 ['Physical activity',known(a.moderate)&&known(a.vigorous)?`${Number(a.moderate)} min moderate + ${Number(a.vigorous)} min vigorous / week`:'Weekly activity not fully provided',false],
 ['Sleep',known(a.sleep)?`${a.sleep} hours / day`:'Not provided',false],
 ['Alcohol',a.alcohol||'Not provided',false],
 ['Fruit and vegetables',a.diet&&a.diet!=='Not sure'?`${a.diet} portions / day`:'Not provided',false],
 ['Stress',a.stress||'Not provided',false]
 ];}
export function alcoholGrams(drinks=[]){if(!drinks.length||drinks.some(d=>![d.count,d.ml,d.abv].every(v=>known(v)&&Number(v)>0)))return null;return drinks.reduce((t,d)=>t+Number(d.count)*Number(d.ml)*Number(d.abv)/100*0.789,0);}
export const sampleAnswers={age:'45',country:'Bulgaria',height:'175',heightUnit:'cm',weight:'78',weightUnit:'kg',weightYearAgo:'78',weightYearAgoUnit:'kg',health:'Good',smokingEver100:'No',smoking:'Not at all',nicotine:['None'],alcohol:'Yes',alcoholDays:'2',drinks:[{type:'Wine',count:1,ml:150,abv:12}],moderate:'90',vigorous:'0',strength:'1',limitations:'No',sleep:'6.5',rested:'Sometimes',disrupted:'No',stress:'Occasionally',diet:'3–4',conditions:['None'],medicines:['None'],context:['None'],illness:'No'};
export function sampleLabs(){return Object.fromEntries(labs.map(l=>[l.id,{value:String(l.example),unit:l.units[0]}]));}
