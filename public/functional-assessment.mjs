// Reference comparisons, not a validated biological clock. No missing result is imputed.
export const FUNCTIONAL_VERSION='functional-yoon-2024-older-v2';
export const functionalSources=[
 {id:'functional-oak',label:'Oak et al. (2012): multivariable physical fitness age, DOI 10.15758/jkak.2012.14.3.81',url:'https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART001684777'},
 {id:'functional-yoon',label:'Yoon et al. (2024): National Fitness Award fitness-age equations',url:'https://doi.org/10.1186/s12889-024-19922-8'},
 {id:'functional-sts',label:'Strassmann et al. (2013): one-minute chair stand references',url:'https://doi.org/10.1007/s00038-013-0504-z'},
 {id:'functional-balance',label:'Springer et al. (2007): unipedal stance references',url:'https://pubmed.ncbi.nlm.nih.gov/19839175/'},
 {id:'functional-sppb',label:'NIA: Short Physical Performance Battery',url:'https://www.nia.nih.gov/research/resource/short-physical-performance-battery-sppb'},
 {id:'functional-strength',label:'Tomkinson et al.: international handgrip references',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11863340/'},
 {id:'functional-activity',label:'WHO: physical activity recommendations',url:'https://www.who.int/news-room/fact-sheets/detail/physical-activity'},
 {id:'functional-bmi',label:'CDC: what BMI can and cannot tell you',url:'https://www.cdc.gov/bmi/about/index.html'},
];
const choice=(id,label,options)=>({id,label,options});
const numeric=(id,label,unit,range,help,optional=false)=>({id,label,units:unit==='cm'?['cm','in']:unit==='kg'?['kg','lb']:[unit],factor:selected=>selected==='in'?2.54:selected==='lb'?0.45359237:1,range,help,optional,signed:range[0]<0,integer:unit==='repetitions'||unit==='right-knee lifts'||unit==='completed shuttles'||unit==='years'});
const statuses=['Completed as instructed','Unable without assistance','Stopped because of symptoms','Not attempted'];
export const functionalTests=[
 {id:'chair5',title:'Five chair rises',unit:'seconds',range:[1,120],domain:'Lower-body function',help:'Use a stable armless chair against a wall. Record seat height. Fold your arms across your chest. First check you can rise once safely without your arms. Then time five controlled rises as quickly as safely possible, ending fully upright on rise five.',plan:'Build lower-body strength with controlled chair rises and gradually increased resistance. Pain or inability to rise deserves individual assessment.'},
 {id:'chair60',title:'One-minute chair stand',unit:'repetitions',range:[0,120],domain:'Lower-body endurance',help:'Use a 46 cm armless chair against a wall, feet hip-width apart, hands on hips or arms loose without pushing. Count complete stand-and-sit cycles in 60 seconds. Fully straighten your knees and touch the seat each time. Rest as needed while the timer continues; do not count incomplete cycles.',plan:'Use progressive chair-rise and lower-body resistance exercises. Compare repetitions using the same chair and technique on your next assessment.'},
 {id:'pushups',title:'Consecutive push-ups',unit:'repetitions',range:[0,200],domain:'Upper-body endurance',help:'Choose standard toes or modified knees and record the variant. Keep the trunk straight, fully extend the elbows and lower to the same marked depth each time. Count correct consecutive repetitions without resting. Stop when technique fails or symptoms occur.',plan:'Choose an appropriate incline or modified push-up for training and gradually increase difficulty. Keep the recorded test variant unchanged when comparing progress.'},
 {id:'plank',title:'Forearm plank',unit:'seconds',range:[0,600],domain:'Trunk endurance',help:'On a mat, elbows under shoulders, forearms and toes supporting the body. Keep head, trunk and hips aligned and breathe normally. Record seconds until you cannot maintain the position; stop for pain or dizziness. Do not hold your breath.',plan:'Practise short, controlled trunk-stability exercises with normal breathing and progress only while technique remains comfortable.'},
 {id:'balance',title:'Single-leg balance',unit:'seconds',range:[0,45],domain:'Static balance',help:'Have a helper beside you and a stable support within reach. Barefoot, choose one leg and record it. Cross arms over chest, look at a fixed point and lift the other foot near the ankle without touching it. Stop if arms uncross, either foot moves, support is used, or 45 seconds elapse. Record three trials with five minutes seated rest between trials; enter the best time.',plan:'Practise progressively challenging balance near a stable support. Falls, dizziness or substantial difficulty warrant a professional assessment.'},
 {id:'walk',title:'Usual four-metre walk',unit:'seconds',range:[1,120],domain:'Walking mobility',help:'Mark a clear, flat four-metre path with room to stop. A helper times from the start of walking until one foot is completely beyond the finish. Walk at your usual pace, not a sprint. Complete two trials and enter the shorter time. Record any walking aid.',plan:'Build comfortable walking activity gradually. Record the same path, start method and walking aid for a meaningful repeat comparison.'},
 {id:'tug',title:'Timed Up and Go',unit:'seconds',range:[1,180],domain:'Dynamic mobility',help:'Place a stable chair three metres from a marked turning point. With a helper, time from the start cue through standing, walking at your normal safe pace, turning, returning and sitting. Use usual footwear and any usual walking aid. Do not race.',plan:'Controlled sit-to-stand, turning and walking practice can address this combined task. A marked difference from straight walking may justify reviewing transitions with a physiotherapist.'},
 {id:'reach',title:'Seated reach',unit:'cm',range:[-60,60],domain:'Lower-body flexibility',help:'Sit near the front of a stable chair with one leg extended, heel on floor and toes up. Reach slowly toward the toes without bouncing or forcing. Record the gap as negative centimetres or reach beyond toes as positive. Use the same leg each time.',plan:'Use comfortable, gradual flexibility work. Do not force a painful stretch; this measurement is not a diagnosis of joint or nerve disease.'},
 {id:'shoulder',title:'Behind-back reach',unit:'cm',range:[-80,40],domain:'Shoulder flexibility',help:'Standing comfortably, reach one hand over the shoulder and the other up the back. Without pulling or forcing, measure the gap between middle fingertips as negative centimetres, or overlap as positive. Record which arm is uppermost.',plan:'Gentle shoulder mobility may help maintain comfortable reach. Pain, a sudden loss of movement or a major side difference needs individual review.'},
 {id:'grip',title:'Handgrip strength',unit:'kg',range:[0,120],domain:'Maximum grip strength',help:'Optional: use a checked grip dynamometer, seated with elbow bent at 90 degrees, forearm neutral and handle fitted to your hand. Perform three attempts per hand, alternating hands with at least 60 seconds between attempts on the same hand. Record the maximum across both hands and the device model.',plan:'Progressive resistance training can improve overall strength. Record the same dynamometer and position; wrist or hand pain can limit grip independently of general fitness.'},
 {id:'march',title:'Two-minute march in place',unit:'right-knee lifts',range:[0,250],domain:'Exercise endurance',help:'Only attempt if your readiness check permits exercise. Have support nearby. Mark halfway between the kneecap and top of the hip bone. March for two minutes, counting only right-knee lifts reaching that height. The timer continues during rests. This is not a direct VO2 measurement.',plan:'Build suitable aerobic activity progressively. Low performance can reflect leg fatigue or balance as well as aerobic capacity; review these alongside the other tasks.'},
];
const scoredTests=[
 {...functionalTests.find(t=>t.id==='chair60'),id:'chair30',title:'Thirty-second chair stand',help:'Use a stable standard chair against a wall and record its height. Sit centrally with feet flat and arms crossed over the chest. Count full stands in 30 seconds. Count a final stand more than halfway completed at the time limit. Stop for pain, dizziness or unsafe technique.'},
 {...functionalTests.find(t=>t.id==='grip'),help:'Use a checked Takei-compatible grip dynamometer. Stand upright, arm straight and about 15 degrees away from the body. Fit the handle to the middle finger phalanx. Squeeze for five seconds, twice on each hand. Record the maximum in kg. Do not substitute the seated three-attempt reference protocol.'},
 {...functionalTests.find(t=>t.id==='march')},
 {...functionalTests.find(t=>t.id==='reach'),title:'Floor sit-and-reach',help:'Use a standard sit-and-reach measuring setup, not a chair reach. Sit on the floor with knees straight and soles against the measuring surface. Reach forward with both hands slowly without bouncing. Record the maximum of two attempts in cm using the published setup. If you cannot reproduce this measurement protocol, mark the task not attempted.'},
 {...functionalTests.find(t=>t.id==='tug'),help:'Use a stable chair and a marked turning point three metres away. With a helper, time from the cue through standing, walking as fast as safely possible, turning, returning and sitting. Do two trials and record the longer time, as reported in the source protocol. Use the same setup; stop for symptoms.'},
];
const youngTests=[
 {id:'pacer',title:'PACER shuttle run',unit:'completed shuttles',range:[0,250],domain:'Aerobic endurance',help:'Use a measured flat 20-metre course with safe stopping space and the original standardized PACER recording and scoring protocol. Record fully completed one-way shuttles, not levels or metres. This is a demanding run: only use a result obtained with appropriate exercise screening and supervision. A 15-metre run or marching cannot replace it.',plan:'Build suitable aerobic activity gradually. Repeat using exactly the same 20-metre course and recording. Do not undertake maximal running when exercise symptoms or restrictions apply.'},
 {id:'jump',title:'Sargent vertical jump',unit:'cm',range:[0,150],domain:'Lower-body power',help:'Use the Sargent vertical-jump protocol with a measured standing reach and jump reach; enter their difference in cm. Use a clear nonslip landing area and a qualified helper. Do not jump with joint pain, instability or exercise restrictions. Do not substitute a standing broad jump.',plan:'Progress strength, movement control and appropriate power training within your capabilities. A safe landing matters more than chasing a maximal jump.'},
 {...scoredTests.find(t=>t.id==='reach')},
 {id:'situps',title:'Sit-up endurance',unit:'repetitions',range:[0,150],domain:'Trunk endurance',help:'Enter the sit-up count obtained using the original Oak study protocol, including its timing and technique. A plank, curl-up or differently timed sit-up test is not interchangeable. Have a qualified assessor confirm protocol compatibility before accepting the combined age.',plan:'Use comfortable progressive trunk exercise. Pain-limited sit-ups should be stopped and reviewed, not scored as low fitness.'},
];
const selectedTests=inputs=>Number(inputs.age?.value)<65?youngTests:scoredTests;
export const functionalFields={
 height:numeric('height','Height','cm',[100,250],'Measure without shoes.'),
 weight:numeric('weight','Weight','kg',[25,400],'Use a recent measured body weight.'),
 compositionMethod:{...choice('compositionMethod','Body composition measurement',['Smart scale or bioimpedance','DXA scan','Other measurement']),optional:true},
 bodyFat:numeric('bodyFat','Body fat','%',[0.1,100],'Optional: use a measured percentage from your scale or scan, not an estimate.',true),
 skeletalMuscle:numeric('skeletalMuscle','Skeletal muscle','%',[0.1,100],'Optional: use skeletal muscle percentage, not lean mass.',true),
 vigorousReady:choice('vigorousReady','Has a qualified exercise professional confirmed that the run and jump are appropriate and the original measurement protocols can be reproduced?',['Yes','No','Not sure']),
 age:numeric('age','How old are you?','years',[18,120],'Use your age when performing these tests.'),
 sex:choice('sex','Reference group',['Female','Male']),
 readiness:choice('readiness','Is it safe for you to attempt physical tests today?',['No symptoms or exercise restrictions','Symptoms, recent illness or exercise restrictions','Not sure']),
 setup:choice('setup','Can you follow the instructions with a stable chair, clear floor and a helper for balance and timing?',['Yes','Not yet']),
 chairHeight:numeric('chairHeight','Chair seat height','cm',[25,65],'Measure from floor to top of the seat.'),
 pushVariant:choice('pushVariant','Push-up variant',['Standard toes','Modified knees','Incline']),
 balanceLeg:choice('balanceLeg','Balance test standing leg',['Left','Right']),
 aids:choice('aids','Walking support',['No walking aid','Usual walking aid']),
 daily:choice('daily','Do everyday activities such as stairs, carrying shopping or getting dressed feel limited?',['No limitation','Some limitation','Substantial limitation']),
 pain:choice('pain','Did pain limit any completed test?',['No','Yes']),
 protocol:choice('protocol','Did you follow the instructions for the tests you completed?',['Yes','No']),
};
for(const test of [...scoredTests,...youngTests]){
 functionalFields[test.id+'Status']={...choice(test.id+'Status',test.title+' - completion',statuses),optional:true};
 functionalFields[test.id]=numeric(test.id,test.title,test.unit,test.range,test.help,true);
}
export function functionalSteps(inputs={}){
 const steps=[{id:'age',title:'About you',fields:['age','sex'],hint:'The current published combined equation covers older adults. Ages 20–64 use the Oak field-test model with a 20-metre running course. Ages 65–94 use the Yoon five-test model. Both are research comparisons with population and protocol limitations.'},{id:'readiness',title:'Before physical testing',fields:['readiness'],hint:'Do not test with chest discomfort, unusual breathlessness, dizziness, acute illness or exercise restrictions. Seek appropriate advice first. Stop any task for symptoms; never push through pain.'}];
 if(inputs.age&&(Number(inputs.age.value)<20||Number(inputs.age.value)>94))return steps.slice(0,1);
 if(inputs.readiness&&inputs.readiness!=='No symptoms or exercise restrictions')return steps;
 steps.push({id:'setup',title:'Prepare your space',fields:['setup'],hint:'Plan two blocks with recovery between demanding tests. You may return to this draft. Use a helper for timing and fall prevention; do not perform unsupported balance if unsafe.'});
 if(inputs.setup==='Not yet')return steps;
 if(Number(inputs.age?.value)<65){
 steps.push({id:'vigorous-ready',title:'Field-test readiness',fields:['vigorousReady'],hint:'The younger-adult battery requires a safe 20-metre running course, a jump assessment and verified original protocols. It is not an unsupervised indoor exercise challenge.'});
 if(inputs.vigorousReady&&inputs.vigorousReady!=='Yes')return steps;
 }
 steps.push({id:'context',title:'Your daily function',fields:Number(inputs.age?.value)<65?['daily','height','weight']:['daily','chairHeight','aids']});
 steps.push({id:'composition',title:'Body composition (optional)',fields:['compositionMethod','bodyFat','skeletalMuscle'],skip:'Skip this step',hint:'Add an existing scale or scan reading if you have one. These details help explain your body measurements; they do not change the published fitness-age calculation.'});
 for(const test of selectedTests(inputs)){
  steps.push({id:test.id,title:test.title,testId:test.id,fields:[test.id+'Status',test.id],skip:'Skip this test',hint:test.help+' Only attempt this if it feels safe. You can skip it without giving a reason.'});
 }
 steps.push({id:'quality',title:'Check your testing conditions',fields:['pain','protocol']});
 return steps;
}
// Published multivariable equation: Yoon et al., BMC Public Health 2024, older-adult branch.
// Every required physical metric has its original coefficient. No replacement values or extrapolation.
export function functionalOutcome(inputs,values,review){
 const tests=selectedTests(inputs),young=Number(inputs.age?.value)<65;
 review.domains=tests.map(t=>({id:t.id,title:t.title,domain:t.domain,status:inputs[t.id+'Status']||'Not attempted',value:values[t.id]??null,unit:t.unit,plan:t.plan}));
 if(inputs.readiness&&inputs.readiness!=='No symptoms or exercise restrictions')return {status:'review',issue:'functional-readiness'};
 if(inputs.setup==='Not yet')return {status:'review',issue:'functional-setup'};
 if(values.age<20||values.age>94)return {status:'review',issue:'functional-coverage'};
 if(young&&inputs.vigorousReady&&inputs.vigorousReady!=='Yes')return {status:'review',issue:'functional-vigorous'};
 const missing=functionalSteps(inputs).flatMap(s=>s.fields).filter(id=>!functionalFields[id].optional&&inputs[id]===undefined);
 if(missing.length)return {status:'missing',missing};
 if(inputs.pain!=='No'||inputs.protocol!=='Yes'||(!young&&inputs.aids!=='No walking aid')||tests.some(t=>inputs[t.id+'Status']!=='Completed as instructed'||!Number.isFinite(values[t.id])))return {status:'review',issue:'functional-protocol'};
 if(young)return youngOutcome(inputs,values,review,tests);
 const coefficients={march:-0.017,grip:-0.203,chair30:-0.031,reach:-0.052,tug:0.985};
 review.contributions=scoredTests.map(t=>({id:t.id,title:t.title,value:values[t.id],coefficient:coefficients[t.id],term:values[t.id]*coefficients[t.id],unit:t.unit}));
 const sex=inputs.sex==='Male'?1:2;
 const estimate=79.807-3.468*sex+review.contributions.reduce((sum,t)=>sum+t.term,0);
 review.unroundedAge=estimate;
 if(estimate<1||estimate>120)return {status:'review',issue:'functional-values'};
 review.completed=5;
 return {status:'ready',version:FUNCTIONAL_VERSION,method:'Yoon 2024 multivariable functional fitness age',age:Math.round(estimate),gap:Math.round(estimate)-values.age};
}
export const functionalSample={age:{value:'70',unit:'years'},sex:'Male',readiness:'No symptoms or exercise restrictions',setup:'Yes',daily:'Some limitation',chairHeight:{value:'43',unit:'cm'},aids:'No walking aid',pain:'No',protocol:'Yes',...Object.fromEntries(scoredTests.flatMap(t=>[[t.id+'Status','Completed as instructed'],[t.id,{value:String({chair30:14,grip:35,march:90,reach:3,tug:9}[t.id]),unit:t.unit}]]))};
export const functionalMethods=[
 'Ages 20–64 use Oak et al. (2012): BMI, PACER shuttle count, Sargent jump cm, floor sit-and-reach cm and sit-up count. All five terms contribute, using the original sex-specific under-40 or 40-plus coefficients. BMI is calculated from recorded height and weight. This field-test battery requires a 20-metre course and screened vigorous exercise; it is not a no-space indoor substitute.',
 'The English and Korean abstracts disagree on sample size (646 versus 645) and upper age (69 versus 65). The app therefore uses the younger equation only through 64. Reported R-squared values concern the study composite target, not proven accuracy in predicting an individual biological age. Separate equations can change the result abruptly at age 40 or at the switch to the older model; do not interpret these transitions as actual aging.',
 'Protocol compatibility and independent home validation remain prerequisites for a reliable service. The original source must confirm PACER cadence, sit-up timing, jump scoring and reach zero point. The local trial requires a qualified assessor confirmation rather than guessing these details. There is no invented age-specific normal interval for measurements whose compatible reference table has not been verified.',
 'For ages 65–94, the age uses all five physical tests together: grip strength, 30-second chair rises, two-minute marching, floor sit-and-reach and Timed Up and Go. Yoon et al. (2024), older-adult equation: 79.807 - 0.017 × steps - 0.203 × grip kg - 0.031 × chair rises - 0.052 × reach cm + 0.985 × TUG seconds - 3.468 × sex (male 1, female 2).',
 'The Korean study included 142,471 older participants. Adjusted R-squared was 0.243 and reported standard error of estimate was 4.793 years. These describe the study, not a personal confidence interval or proven accuracy in home users or other countries.',
 'The older branch conservatively supports ages 65–94. The upper application boundary is a product restriction, not a validated study boundary. Younger adults are not assigned an age from this older-adult equation. The separate adult equation requires a graded treadmill test and is not substituted with a questionnaire or a home step estimate.',
 'Every required test must be completed using the recorded protocol without pain limitation. Missing, symptom-limited or adapted tests withhold the combined age rather than silently dropping a metric. The combined age is rounded only after all original equation terms have been summed.',
 'Published coefficients are reproduced unchanged. This is a research fitness-age comparison, not a diagnosis, biological-aging rate or validated universal home aging clock. Scientific support for a test does not establish clinical accuracy of this combined equation.',
];

function youngOutcome(inputs,values,review,tests){
 const male=inputs.sex==='Male',middle=values.age>=40;
 const [intercept,bmi,pacer,jump,reach,situps]=male?(middle?[75.123,0.090,-0.095,-0.382,-0.009,-0.233]:[45.054,0.324,-0.089,-0.142,-0.153,-0.228]):(middle?[76.004,0.026,-0.150,-0.651,-0.010,-0.271]:[49.031,0.328,-0.121,-0.423,-0.260,-0.144]);
 const coefficients={pacer,jump,reach,situps};
 const bodyMassIndex=values.weight/(values.height/100)**2;
 review.bmi=bodyMassIndex;
 review.contributions=[{id:'bmi',title:'Body mass index',value:bodyMassIndex,unit:'kg/m2',coefficient:bmi,term:bodyMassIndex*bmi},...tests.map(t=>({id:t.id,title:t.title,value:values[t.id],unit:t.unit,coefficient:coefficients[t.id],term:values[t.id]*coefficients[t.id]}))];
 const estimate=intercept+review.contributions.reduce((sum,t)=>sum+t.term,0);
 review.unroundedAge=estimate;
 if(estimate<1||estimate>120)return {status:'review',issue:'functional-values'};
 return {status:'ready',version:'functional-oak-2012-'+(male?'male':'female')+'-'+(middle?'40plus':'under40')+'-v1',method:'Oak 2012 combined field-test fitness age',age:Math.round(estimate),gap:Math.round(estimate)-values.age};
}
