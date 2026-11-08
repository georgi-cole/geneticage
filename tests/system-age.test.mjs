import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessSystem, systemPrefill, systemSteps} from '../public/system-assessments.mjs';
import {estimatedFitness, fitnessAge, gdrsPoints, gdrsRisk, kidneyAge, kidneyFiltration, youngAdultFitness, olderAdultFitness} from '../public/system-age-models.mjs';
import {systemRoute} from '../public/system-assessment-ui.mjs';

const reading = (value, unit) => ({value:String(value),unit});
const metabolic = {
  age:reading(25,'years'), diabetes:'No', pregnancy:'No', height:reading(180,'cm'), waist:reading(90,'cm'),
  hypertension:'No', smoking:'Never smoked', activity:reading(5,'hours/week'), coffee:reading(1,'cups/day'),
  wholeGrain:reading(100,'g/day'), redMeat:reading(0,'g/day'), parents:'Neither parent', siblings:'No',
};
const kidney = {
  age:reading(33,'years'), sex:'Male', kidneyHistory:'No known kidney disease', kidneyContext:'Stable health',
  creatinine:reading(88.4,'µmol/L'),
};
const fitness = {
  age:reading(33,'years'), sex:'Male', fitnessContext:'None of these', waist:reading(85,'cm'), pulse:reading(62,'beats/min'),
  moderate:reading(130,'min / week'), vigorous:reading(15,'min / week'),
};

test('GDRS matches the publication example and covers the young adult reference', () => {
  const points = gdrsPoints({age:56,height:180,waist:90,hypertension:'Yes',activity:4,smoking:'Current smoker',
    cigarettes:12,wholeGrain:100,coffee:150,redMeat:85.5,parents:'One parent',siblings:'No'});
  assert.equal(points.toFixed(2), '613.95');
  assert.equal((gdrsRisk(points)*100).toFixed(1), '9.4');
  for (const age of [18,19,25,29,79]) {
    const {result, errors} = assessSystem('metabolic', {...metabolic, age:reading(age,'years')});
    assert.deepEqual(errors, {});
    assert.equal(result.age, age);
  }
  assert.equal(assessSystem('metabolic', {...metabolic,age:reading(80,'years')}).result.issue, 'metabolic-age');
});

test('HbA1c selects the published extension and fasting glucose is checked independently', () => {
  const hba1c = {...metabolic,hba1c:reading(5.5,'%')};
  const withA1c = assessSystem('metabolic', hba1c);
  assert.equal(withA1c.result.method, 'GDRS with HbA1c');
  assert.notEqual(withA1c.result.age, 25);
  assert.equal(withA1c.review.fields.hba1c.comparison.high, 5.7);
  assert.equal(withA1c.review.fields.hba1c.comparison.highExclusive, true);
  const labBounds = assessSystem('metabolic', {...metabolic,glucose:{...reading(105,'mg/dL'),referenceHigh:'110'}});
  assert.equal(labBounds.review.fields.glucose.comparison.sourceKind, 'lab');
  assert.equal(labBounds.review.fields.glucose.direction, 'within');
  assert.equal(assessSystem('metabolic', {...metabolic,glucose:reading(105,'mg/dL')}).review.fields.glucose.direction, 'above');
  const ifcc = assessSystem('metabolic', {...hba1c,hba1c:reading((5.5-2.152)/0.09148,'mmol/mol')});
  assert.deepEqual(withA1c.result, ifcc.result);
  assert.equal(assessSystem('metabolic', {...metabolic,hba1c:reading(48,'mmol/mol')}).result.issue, 'glucose-review');
  assert.equal(assessSystem('metabolic', {...metabolic,glucose:reading(126,'mg/dL')}).result.issue, 'glucose-review');
  const critical = assessSystem('metabolic', {...metabolic,glucose:reading(50,'mg/dL')});
  assert.equal(critical.result.issue, 'glucose-critical');
  assert.equal(critical.review.fields.glucose.check.warning.code, 'critical-glucose');
  assert.deepEqual(assessSystem('metabolic', {...metabolic,smoking:'Former smoker'}).result.missing, ['cigarettes']);
  assert.equal(assessSystem('metabolic', {...metabolic,diabetes:'Yes',diabetesType:'Type 2 diabetes'}).result.issue, 'diabetes-known');
});

test('CKD-EPI uses exact units and age-matched European reference medians', () => {
  assert.equal(Math.round(kidneyFiltration(90,'Male',1.5)), 44); // NKF laboratory implementation example
  assert.deepEqual(kidneyAge(103,'Male'), {age:40});
  assert.deepEqual(kidneyAge(97,'Female'), {age:50});
  const basic = assessSystem('kidney', kidney);
  assert.equal(basic.result.age, 41);
  assert.deepEqual(assessSystem('kidney', {...kidney,creatinine:reading(1,'mg/dL')}).result,basic.result);
  const combined = assessSystem('kidney', {...kidney,cystatin:reading(0.8,'mg/L')});
  assert.deepEqual(combined.result, basic.result);
  assert.equal(combined.review.egfrCombined.toFixed(1),'112.1');
  assert.equal(combined.review.fields.creatinine.comparison.sourceVersion, 'abim-2026-01-v1');
  assert.equal(combined.review.fields.cystatin.comparison.high, 1.03);
  assert.equal(assessSystem('kidney', {...kidney,age:reading(50,'years'),cystatin:reading(0.8,'mg/L')}).review.fields.cystatin.comparison.high, 1.21);
  const elevated = assessSystem('kidney', {...kidney,acr:reading(3,'mg/mmol')});
  assert.equal(elevated.result.issue, 'kidney-albumin');
  assert.equal(elevated.review.fields.acr.comparison.high, 3);
  assert.equal(elevated.review.fields.acr.direction, 'above');
  assert.equal(assessSystem('kidney', {...kidney,acr:reading('<3','mg/mmol')}).result.status, 'ready');
  assert.equal(assessSystem('kidney', {...kidney,creatinine:undefined}).result.missing[0], 'creatinine');
  assert.equal(assessSystem('kidney', {...kidney,kidneyContext:'Acute illness or kidney injury'}).review.egfr,undefined);
  assert.ok(assessSystem('kidney', {...kidney,creatinine:reading(1,'mmol/L')}).errors.creatinine);
});

test('fitness uses the published activity term and the reference matching the test', () => {
  const value = estimatedFitness({age:33,sex:'Male',waist:85,pulse:62,moderate:130,vigorous:15});
  assert.equal(value.toFixed(3), '54.892');
  const baseline = assessSystem('fitness', fitness);
  assert.equal(baseline.result.method, 'HUNT');
  assert.deepEqual(baseline.result.ageBand, {from:20,to:29});
  const measured = {vo2peak:reading(29.2,'mL/kg/min'),rer:reading(1.12,'ratio'),testType:'Treadmill test'};
  assert.equal(assessSystem('fitness',{age:fitness.age,sex:fitness.sex,...measured}).result.age,55);
  assert.equal(fitnessAge(29.2,'Male','Cycle test').age,35);
  const missingRer = assessSystem('fitness', {...fitness,...measured,rer:undefined});
  assert.equal(missingRer.result.method, 'HUNT');
  assert.equal(missingRer.review.testIncomplete,true);
  assert.equal(assessSystem('fitness', {...fitness,age:reading(19,'years')}).result.status, 'missing');
  assert.equal(assessSystem('fitness', {...fitness,age:reading(97,'years'),...measured}).result.age, 55);
});

test('fitness offers nonexercise methods at the younger and older age boundaries', () => {
  const body = {sex:'Female', height:reading(160,'cm'), weight:reading(64,'kg'), fitnessContext:'None of these'};
  const young = {milePace:'5',threeMilePace:'3',activityRating:'3'};
  assert.equal(youngAdultFitness({age:18,sex:'Female',height:160,weight:64,...young}).toFixed(3), '35.879');
  for (const age of [18,19]) {
    const {result,errors} = assessSystem('fitness', {age:reading(age,'years'), ...body, ...young});
    assert.deepEqual(errors, {});
    assert.equal(result.version, 'bradshaw-fitness-age-v1');
    assert.equal(result.age, 25);
  }
  const senior = {selfRatedHealth:'Very good',weeklyExercise:reading(75,'min / week')};
  assert.equal(olderAdultFitness({age:90,sex:'Female',height:160,weight:64,selfRatedHealth:'Very good',weeklyExercise:75}).toFixed(2), '14.67');
  for (const age of [90,96]) {
    const {result,errors} = assessSystem('fitness', {age:reading(age,'years'), ...body, ...senior});
    assert.deepEqual(errors, {});
    assert.equal(result.version, 'blsa-fitness-age-v1');
    assert.equal(result.age, 85);
  }
  assert.equal(assessSystem('fitness', {age:reading(97,'years'),...body,...senior}).result.issue, 'fitness-age');
});

test('prefill keeps the age at the blood draw and skips only matching confirmed fields', () => {
  const answers = {age:'50',sex:'Female',height:'180',heightUnit:'cm',smoking:'Every day',cigarettes:'10',conditions:['None']};
  const blood = {labSubmitted:true,labAge:'48',lab:{creatinine:kidney.creatinine}};
  const carried = systemPrefill('kidney', answers, {sex:'Male'}, blood);
  assert.deepEqual(carried.age,reading(48,'years'));
  assert.equal(carried.sex, 'Female');
  assert.equal(systemRoute('kidney', carried, Object.keys(carried))[0].id, 'review');
  assert.deepEqual(systemRoute('kidney', {...carried,'<extra>':'value'}, ['<extra>','age'])[0].fields, ['age']);
  assert.ok(!systemRoute('kidney',carried,Object.keys(carried)).some(step => step.id === 'creatinine'));
  assert.deepEqual(systemPrefill('kidney', answers).age, reading(50,'years'));
  assert.equal(systemPrefill('fitness', {sex:'Prefer not to say'}, {sex:'Male'}).sex, undefined);
  const habits = systemPrefill('metabolic', answers);
  assert.deepEqual(habits.cigarettes,reading(10,'cigarettes/day'));
  assert.equal(habits.activity,undefined);
  assert.ok(systemSteps('metabolic', habits).some(step=>step.id==='amount'));
});
