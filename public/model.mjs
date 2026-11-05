export const sections=[
 {name:'About you',title:'About you',intro:'Enter your age to begin. The other questions are optional.',questions:[
  {id:'age',label:'How old are you?',type:'number',unit:'years',required:true,min:18,max:120,step:1},
  {id:'country',label:'Which country do you live in?',type:'country',hint:'Helps KoleQuant check consultation availability. It does not affect your age estimate.'},
  {id:'height',label:'What is your height?',type:'measure',units:['cm','in'],hint:'For feet and inches, enter the total in inches. Height and weight are recorded for reference; they are not used in the blood-based age calculation.'},
  {id:'weight',label:'What is your weight?',type:'measure',units:['kg','lb']},
  {id:'health',label:'How would you describe your overall health today?',options:['Excellent','Very good','Good','Fair','Poor','Not sure']} ]},
 {name:'Tobacco',title:'Smoking and nicotine',intro:'Include occasional smoking as well as daily use.',questions:[
  {id:'smoking',label:'Which best describes your cigarette smoking?',options:['Never smoked regularly','Used to smoke regularly','Smoke now','Prefer not to say'],optionLabels:{'Never smoked regularly':'I have never smoked regularly','Used to smoke regularly':'I used to smoke regularly','Smoke now':'I smoke now, daily or occasionally'}},
  {id:'cigarettes',label:'On a day when you smoke, how many cigarettes do you usually have?',type:'number',min:0.1,max:200,show:a=>a.smoking==='Smoke now'},
  {id:'smokingYears',label:'For approximately how many years have you smoked cigarettes regularly?',type:'number',min:0,max:100,show:a=>['Smoke now','Used to smoke regularly'].includes(a.smoking)},
  {id:'quit',label:'How long ago did you stop smoking regularly?',options:['Less than 1 year','1–4 years','5–9 years','10 years or more','Not sure'],show:a=>a.smoking==='Used to smoke regularly'},
  {id:'nicotine',label:'Do you currently use any other tobacco or nicotine products?',type:'multi',options:['Cigars or pipe','Shisha or waterpipe','Heated tobacco','Vape or e-cigarette','Oral tobacco','Nicotine replacement used to stop smoking','None','Prefer not to say']} ]},
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
export const labs=[
 {id:'albumin',name:'Albumin',unit:'g/L',units:['g/L','g/dL'],factor:u=>u==='g/dL'?10:1,example:42},
 {id:'creatinine',name:'Creatinine',unit:'µmol/L',units:['µmol/L','mg/dL'],factor:u=>u==='mg/dL'?88.4:1,example:90},
 {id:'glucose',name:'Glucose',unit:'mmol/L',units:['mmol/L','mg/dL'],factor:u=>u==='mg/dL'?1/18.0182:1,example:6.2},
 {id:'crp',name:'C-reactive protein',unit:'mg/dL',units:['mg/L','mg/dL'],factor:u=>u==='mg/L'?0.1:1,example:3},
 {id:'lymphocytes',name:'Lymphocytes',unit:'%',units:['%'],factor:()=>1,example:25},
 {id:'mcv',name:'Mean corpuscular volume',unit:'fL',units:['fL'],factor:()=>1,example:94},
 {id:'rdw',name:'Red cell distribution width',unit:'% (RDW-CV)',units:['% (RDW-CV)'],factor:()=>1,example:14},
 {id:'alp',name:'Alkaline phosphatase',unit:'U/L',units:['U/L'],factor:()=>1,example:85},
 {id:'wbc',name:'White blood cell count',unit:'10⁹/L',units:['10⁹/L','10³/µL','cells/µL'],factor:u=>u==='cells/µL'?0.001:1,example:7.6}
];
export function normalizeLab(data){return Object.fromEntries(labs.map(l=>[l.id,Number(data[l.id]?.value)*l.factor(data[l.id]?.unit||l.units[0])]));}
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
export const ASSESSMENT_PROTOCOL='clinical-inputs-2026-11-04-v2';
export function assessClinical({age,lab,contextConfirmed,fasting}){
 const reason=eligibility({},Number(age));if(reason)return {reason};
 if(!contextConfirmed)return {reason:'Your health or treatment at the time of the blood draw needs individual review. We have not calculated an age estimate.'};
 if(fasting!=='Yes')return {reason:'Fasting for at least eight hours has not been confirmed. This version uses fasting samples to match the conditions of the validation study. Your blood values can still be saved for review.'};
 if(Object.keys(validateLabs(lab)).length)return {reason:'The calculation needs all nine blood values in the correct units. Check your entries against the laboratory report.'};
 const x=normalizeLab(lab),value=calculatePhenoAge(Number(age),x);
 if(!Number.isFinite(value)||value<0||value>120)return {reason:'These entries produce a result outside the display range used by this version. Check the values and units with your laboratory or clinician.'};
 return {x,value,gap:value-Number(age)};
}
export function validateQuestionnaire(a,{requireAge=true}={}){
 const errors={};
 for(const q of sections.flatMap(s=>s.questions).filter(q=>!q.show||q.show(a))){const v=a[q.id];if(q.id==='age'&&requireAge&&(v===undefined||v===''))errors.age='Enter your age in whole years.';if((q.type==='number'||q.type==='measure')&&v!==undefined&&v!==''){const n=Number(v);if(!Number.isFinite(n)||n<(q.min??0.1)||n>(q.max??1000)||(q.id==='age'&&!Number.isInteger(n)))errors[q.id]=q.id==='age'?'This assessment is for adults aged 18 or over. Enter your age in whole years.':'Check this number and the selected unit.';}}
 if(a.smokingYears!==undefined&&a.smokingYears!==''&&a.age&&Number(a.smokingYears)>Number(a.age))errors.smokingYears='The number of years smoked cannot be greater than your age.';
 for(const q of sections.flatMap(s=>s.questions).filter(q=>q.type==='multi')){const v=a[q.id];if(Array.isArray(v)&&v.length>1&&v.some(x=>['None','Not sure','Prefer not to say'].includes(x)))errors[q.id]='Choose either the applicable answers or one of “None”, “Not sure” and “Prefer not to say”.';}
 if(a.moderate!==undefined&&a.vigorous!==undefined&&Number(a.moderate)+Number(a.vigorous)>10080)errors.vigorous='Together, these activity totals exceed the number of minutes in a week. Check that you entered weekly minutes.';
 for(const d of a.drinks||[])if([d.count,d.ml,d.abv].some(v=>v!==''&&(!Number.isFinite(Number(v))||Number(v)<=0))||Number(d.abv)>100)errors.drinks='Check the serving count, size and alcohol percentage. Leave an amount blank if you do not know it.';
 return errors;
}
const known=v=>v!==undefined&&v!==null&&v!==''&&v!=='Not sure'&&v!=='Prefer not to say';
export function sleepReference(age){return Number(age)>=65?'7–8 hours a day':Number(age)>=61?'7–9 hours a day':'at least 7 hours a day';}
export function insights(a){
 const i=[];
 if(a.smoking==='Smoke now')i.push({key:'tobacco',name:'Smoking',tag:'Stopping smoking',text:'You currently smoke cigarettes. Stopping smoking reduces health risks, including the risk of heart disease.',action:'A clinician or stop-smoking service can help you choose support, including suitable medicines if needed.',sources:['tobacco']});
 else if(a.nicotine?.some(x=>!['None','Prefer not to say','Nicotine replacement used to stop smoking'].includes(x)))i.push({key:'tobacco',name:'Tobacco and nicotine',tag:'Product-specific advice',text:'You use a tobacco or nicotine product. The risks and suitable cessation support depend on the product.',action:'Ask a clinician or pharmacist about options for reducing harm or stopping.',sources:['tobacco']});
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
export const sampleAnswers={age:'45',country:'Bulgaria',height:'175',heightUnit:'cm',weight:'78',weightUnit:'kg',health:'Good',smoking:'Never smoked regularly',nicotine:['None'],alcohol:'Yes',alcoholDays:'2',drinks:[{type:'Wine',count:1,ml:150,abv:12}],moderate:'90',vigorous:'0',strength:'1',limitations:'No',sleep:'6.5',rested:'Sometimes',disrupted:'No',stress:'Occasionally',diet:'3–4',conditions:['None'],medicines:['None'],context:['None'],illness:'No'};
export function sampleLabs(){return Object.fromEntries(labs.map(l=>[l.id,{value:String(l.example),unit:l.units[0]}]));}
