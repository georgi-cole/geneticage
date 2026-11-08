import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessHeartVascular, framinghamVascularAge, heartQuestions} from '../public/heart-vascular.mjs';
import {pdayCoronaryPoints} from '../public/heart-pday.mjs';
import {heartPrefill} from '../public/heart-prefill.mjs';
import {heartRoute} from '../public/heart-vascular-ui.mjs';
import {BG} from '../public/locales/bg.mjs';

const example = {
  age:50, country:'Germany', sex:'Male', smoking:'Yes', conditions:'No', treatment:'No',
  systolic:{value:'140', unit:'mmHg'}, total:{value:'5.5', unit:'mmol/L'}, hdl:{value:'1.3', unit:'mmol/L'},
};

test('SCORE2 uses the selected country and reproduces the publication example', () => {
  // SCORE2 original abstract (ehab309), age 50, current smoker, SBP 140, TC 5.5, HDL 1.3.
  for (const [country, region, male, female] of [
    ['France', 'low', '5.9', '4.2'],
    ['Germany', 'moderate', '7.6', '5.1'],
    ['Poland', 'high', '8.1', '6.9'],
    ['Bulgaria', 'veryHigh', '14.0', '13.7'],
  ]) {
    for (const [sex, expected] of [['Male', male], ['Female', female]]) {
      const {errors, result} = assessHeartVascular({...example, country, sex});
      assert.deepEqual(errors, {});
      assert.equal(result.method, 'SCORE2');
      assert.equal(result.region, region);
      assert.equal(result.risk.toFixed(1), expected);
    }
  }
  assert.ok(heartQuestions[0].options.every(country => Object.hasOwn(BG, country)), 'Translate every selectable country.');
});

test('SCORE2-OP agrees within one percentage point with whole-percent ESC HeartScore examples', () => {
  // ESC quick calculator, fictional profiles, birth month equal to calculation month.
  // https://heartscore.escardio.org/Calculate/quickcalculator.aspx?model=low
  const profiles = [
    ['France', 'Male', 75, 150, 5.9, 1.4, 'Every day', 20],
    ['France', 'Female', 75, 150, 5.9, 1.4, 'Every day', 17],
    ['Germany', 'Male', 73, 130, 5.5, 1.3, 'Never smoked', 13],
    ['Germany', 'Female', 76, 138, 5.4, 1.4, 'Never smoked', 13],
    ['Poland', 'Male', 80, 155, 6.1, 1.5, 'Never smoked', 32],
    ['Poland', 'Female', 82, 148, 6.1, 1.5, 'Every day', 45],
    ['Bulgaria', 'Male', 75, 150, 5.9, 1.4, 'Every day', 41],
    ['Bulgaria', 'Female', 75, 150, 5.9, 1.4, 'Every day', 48],
  ];
  for (const [country, sex, age, pressure, total, hdl, smoking, expected] of profiles) {
    const {errors, result} = assessHeartVascular({...example, country, sex, age, smoking,
      systolic:{value:pressure, unit:'mmHg'}, total:{value:total, unit:'mmol/L'}, hdl:{value:hdl, unit:'mmol/L'},
    });
    assert.deepEqual(errors, {});
    assert.equal(result.method, 'SCORE2-OP');
    assert.ok(Math.abs(result.risk - expected) < 1, `${country} ${sex} age ${age}: ${result.risk} vs ${expected}%`);
  }
});

test('routine cholesterol units convert and optional tests preserve their values and units', () => {
  const base = assessHeartVascular(example);
  const extended = assessHeartVascular({...example,
    total:{value:String(5.5 * 38.67), unit:'mg/dL'}, hdl:{value:'1,3', unit:'mmol/L'},
    apob:{value:'0,95', unit:'g/L'}, lpa:{value:'< 12', unit:'nmol/L'},
  });
  assert.deepEqual(extended.errors, {});
  assert.ok(Math.abs(extended.result.risk - base.result.risk) < 1e-12);
  assert.equal(extended.result.age, base.result.age);
  assert.deepEqual(extended.inputs.apob, {value:'0.95', unit:'g/L'});
  assert.deepEqual(extended.inputs.lpa, {value:'<12', unit:'nmol/L'});
  assert.equal(base.inputs.apob, undefined);
  assert.equal(base.inputs.lpa, undefined);
});

test('eligibility, incomplete data and out-of-range measurements cannot yield a risk estimate', () => {
  for (const change of [
    {age:39}, {age:90}, {country:'Other country'}, {conditions:'Yes'}, {conditions:'Not sure'},
    {treatment:'Yes'}, {sex:'Prefer not to say'}, {smoking:'Not sure'},
    {systolic:{value:'180', unit:'mmHg'}}, {total:{value:'8.1', unit:'mmol/L'}},
  ]) {
    const {errors, result} = assessHeartVascular({...example, ...change});
    assert.deepEqual(errors, {});
    assert.ok(result.reason);
    assert.equal(result.risk, undefined);
  }
  assert.ok(assessHeartVascular({...example, country:'constructor'}).errors.country);
  assert.ok(assessHeartVascular({...example, systolic:undefined}).errors.systolic);
  assert.ok(assessHeartVascular({...example, total:{value:'<5.5', unit:'mmol/L'}}).errors.total);
  assert.ok(assessHeartVascular({...example, hdl:{value:'240', unit:'mg/dL'}}).errors.hdl);
  assert.ok(assessHeartVascular({...example, lpa:{value:'20', unit:'mmol/L'}}).errors.lpa);
  assert.ok(assessHeartVascular({...example, smoking:['Yes']}).errors.smoking);
});

test('earlier measurement-only submissions stay supported and new younger drafts keep health history', () => {
  const systolic = {value:'150', unit:'mmHg'};
  const diastolic = {value:'90', unit:'mmHg'};
  for (const [country, age, issue] of [['Germany', 33, 'young'], ['Bulgaria', 91, 'older'], ['Other country', 50, 'region']]) {
    const {inputs, errors, result} = assessHeartVascular({country, age, systolic, diastolic});
    assert.deepEqual(errors, {});
    assert.deepEqual(inputs, {country, age, systolic, diastolic});
    assert.equal(result.issue, issue);
    assert.equal(result.risk, undefined);
  }
  assert.ok(assessHeartVascular({country:'Germany',age:33}, {requireHistory:true}).errors.smoking);
  const younger = assessHeartVascular({...example, age:33, conditions:'Yes', diagnoses:['Diabetes'], diabetesType:'Type 2 diabetes'}, {requireHistory:true});
  assert.deepEqual(younger.errors, {});
  assert.equal(younger.result.issue, 'framingham-data');
  assert.deepEqual(younger.result.missing, ['bpTreatment']);
  assert.equal(younger.result.risk, undefined);
  assert.deepEqual(younger.inputs.diagnoses, ['Diabetes']);
  assert.ok(heartRoute(younger.inputs).some(step => step.id === 'diagnoses'));
  assert.ok(heartRoute(younger.inputs).some(step => step.id === 'bp-treatment'));
  assert.ok(!heartRoute({...younger.inputs,country:'Bulgaria'}).some(step => step.id === 'diabetes-labs'));
});

test('Framingham reproduces the published male age example and uses the original reference for both sexes', () => {
  const reference = {systolic:125,total:180/38.67,hdl:45/38.67,smoking:false,diabetes:false,treated:false};
  for (const sex of ['Male', 'Female']) {
    assert.equal(framinghamVascularAge({...reference, sex, age:33}).age, 33);
  }
  // D’Agostino et al. 2008, Appendix case 2. The continuous equation gives 64.03.
  const example = {...reference, sex:'Male', age:53,total:161/38.67,hdl:55/38.67,treated:true,diabetes:true};
  assert.equal(framinghamVascularAge(example).age, 64);
  assert.equal(framinghamVascularAge({...reference, age:33, sex:'Female', systolic:100}).ageRange, 'below');
});

test('age 33 uses routine values without pulse-wave data and asks for only the missing inputs', () => {
  const profile = {...example,age:33,country:'Bulgaria',sex:'Male',smoking:'No',conditions:'Yes',diagnoses:['Diabetes'],diabetesType:'Type 2 diabetes',bpTreatment:'No'};
  const {errors, result, review} = assessHeartVascular(profile, {requireHistory:true});
  assert.deepEqual(errors, {});
  assert.deepEqual(result, {method:'Framingham', version:'framingham-2008-lipids-age-v1', age:44, ageRange:null});
  assert.equal(review.arterialAge, undefined);
  assert.deepEqual(assessHeartVascular({...profile,country:'Germany'}).result, result);
  assert.equal(assessHeartVascular({...profile,bpTreatment:'Yes'}).result.age, 49);
  assert.equal(assessHeartVascular({...profile,sex:'Female',smoking:'Some days',
    systolic:{value:150,unit:'mmHg'},hdl:{value:1.4,unit:'mmol/L'}}).result.age, 71);
  assert.deepEqual(assessHeartVascular({...profile,total:{value:5.5*38.67,unit:'mg/dL'}}).result, result);
  assert.deepEqual(assessHeartVascular({...profile,bpTreatment:'Not sure',hdl:undefined}).result.missing, ['bpTreatment','hdl']);
  assert.deepEqual(assessHeartVascular({...profile,diabetesType:undefined,bpTreatment:undefined}).result.missing, ['diabetesType','bpTreatment']);
  assert.equal(assessHeartVascular({...profile,diabetesType:'Type 1 diabetes'}).result.issue, 'framingham-diabetes');
  assert.equal(assessHeartVascular({...profile,age:29}).result.issue, 'pday-data');
  assert.equal(assessHeartVascular({...profile,systolic:{value:180,unit:'mmHg'}}).result.issue, 'pressure');
});

const pdayExample = {...example,age:19,sex:'Female',smoking:'Never smoked',bpTreatment:'No',
  systolic:{value:125,unit:'mmHg'},diastolic:{value:80,unit:'mmHg'},total:{value:200,unit:'mg/dL'},hdl:{value:50,unit:'mg/dL'},
  glucose:{value:5,unit:'mmol/L'}};

test('PDAY reproduces the published coronary points and gives an age band at 18 and 19', () => {
  // McMahan et al. 2005 example. The modifiable factors sum to 11.
  assert.equal(pdayCoronaryPoints({sex:'Male',nonHdl:160,hdl:50,smoking:true,pressure:false,diabetes:false,bmi:31}),11);
  for (const age of [18,19]) {
    const {errors,result,review} = assessHeartVascular({...pdayExample,age},{requireHistory:true});
    assert.deepEqual(errors,{});
    assert.deepEqual(result,{method:'PDAY',version:'pday-2006-coronary-age-band-v1',ageBand:{from:17,to:21},ageRange:null});
    assert.equal(review.arterialAge,undefined);
  }
  const elevated = {...pdayExample,diastolic:{value:85,unit:'mmHg'},bpTreatment:'Not sure'};
  assert.deepEqual(assessHeartVascular(elevated).result.ageBand,{from:21,to:25});
  assert.deepEqual(assessHeartVascular({...pdayExample,glucose:{value:126,unit:'mg/dL'}}).result.ageBand,{from:22,to:26});
  assert.deepEqual(assessHeartVascular({...pdayExample,glucose:{value:7,unit:'mmol/L'}}).result.ageBand,{from:22,to:26});
  const male = {...pdayExample,sex:'Male',height:{value:180,unit:'cm'},weight:{value:98,unit:'kg'}};
  assert.deepEqual(assessHeartVascular(male).result.ageBand,{from:23,to:27});
  assert.equal(assessHeartVascular({...male,age:29,diastolic:{value:85,unit:'mmHg'}}).result.ageRange,'above');
});

test('PDAY asks for missing inputs and keeps critical readings out of the age comparison', () => {
  assert.deepEqual(assessHeartVascular({...pdayExample,bpTreatment:'Not sure',diastolic:undefined,glucose:undefined}).result.missing,
    ['bpTreatment','diastolic','glucose']);
  assert.deepEqual(assessHeartVascular({...pdayExample,sex:'Male'}).result.missing,['height','weight']);
  const treated = {...pdayExample,conditions:'Yes',diagnoses:['Diabetes'],diabetesMedicine:'Yes',glucose:undefined};
  assert.deepEqual(assessHeartVascular(treated).result.ageBand,{from:22,to:26});
  assert.ok(!heartRoute(treated).some(step=>step.id==='pday-glucose'));
  const critical = assessHeartVascular({...pdayExample,glucose:{value:50,unit:'mg/dL'},cfpwv:{value:'8.3',unit:'m/s',method:'direct-80'}});
  assert.equal(critical.result.issue,'glucose-alert');
  assert.ok(critical.review.fields.glucose.check.warning);
  assert.equal(critical.review.arterialAge,undefined);
  assert.ok(assessHeartVascular({...pdayExample,age:17}).errors.age);
});

test('measured arterial stiffness gives a separate age comparison at 33', () => {
  const profile = {...example, age:33, country:'Bulgaria', conditions:'Yes', diagnoses:['Diabetes'], diabetesType:'Type 2 diabetes', bpTreatment:'No'};
  const cfpwv = {value:'8.3', unit:'m/s', method:'direct-80'};
  for (const [sex, age] of [['Male',50], ['Female',56]]) {
    const {inputs, errors, result, review} = assessHeartVascular({...profile, sex, cfpwv});
    assert.deepEqual(errors, {});
    assert.deepEqual(inputs.cfpwv, cfpwv);
    assert.equal(result.method, 'Framingham');
    assert.equal(result.risk, undefined);
    assert.deepEqual(review.arterialAge, {version:'lead-cfpwv-2024-v1', age, ageRange:null});
  }
  for (const [value, range] of [['5.5','below'], ['12','above']]) {
    const {review} = assessHeartVascular({...profile, cfpwv:{...cfpwv,value}});
    assert.equal(review.arterialAge.age, null);
    assert.equal(review.arterialAge.ageRange, range);
  }
  assert.ok(assessHeartVascular({...profile, cfpwv:{...cfpwv,method:'unknown'}}).errors.cfpwvMethod);
  assert.ok(assessHeartVascular({...profile, cfpwv:{...cfpwv,value:'830'}}).errors.cfpwv);
  for (const change of [{age:40}, {sex:'Prefer not to say'}, {diagnoses:['Currently pregnant']}, {systolic:{value:'180',unit:'mmHg'}}]) {
    assert.equal(assessHeartVascular({...profile, cfpwv, ...change}).review.arterialAge, undefined);
  }
});

const type2 = {...example, age:60, smoking:'No', conditions:'Yes', diagnoses:['Diabetes'],
  diabetesType:'Type 2 diabetes', diabetesDamage:'No'};

test('SCORE2-Diabetes matches the paper’s moderate-risk examples for both sexes', () => {
  for (const [sex, diagnosisAge, hba1c, egfr, expected] of [
    ['Male',60,50,90,'11.0'], ['Female',60,50,90,'7.6'],
    ['Male',50,70,60,'17.2'], ['Female',50,70,60,'12.7'],
  ]) {
    const profile = {...type2, sex, diagnosisAge, hba1c:{value:hba1c,unit:'mmol/mol'}, egfr:{value:egfr,unit:'mL/min/1.73 m²'}};
    const {errors,result} = assessHeartVascular(profile);
    assert.deepEqual(errors,{});
    assert.equal(result.method,'SCORE2-Diabetes');
    assert.equal(result.risk.toFixed(1),expected);
    const percent = assessHeartVascular({...profile,hba1c:{value:0.09148*hba1c+2.152,unit:'%'}}).result;
    assert.ok(Math.abs(percent.risk-result.risk) < 1e-10);
  }
});

test('diabetes requires exact data and never falls through to the standard SCORE2 equation', () => {
  const missing = assessHeartVascular(type2);
  assert.deepEqual(missing.errors,{});
  assert.equal(missing.result.issue,'diabetes-data');
  assert.deepEqual(missing.result.missing,['diagnosisAge','hba1c','egfr']);
  assert.ok(heartRoute(type2).some(step => step.id === 'diabetes-labs'));
  const ready = {...type2, diagnosisAge:60,hba1c:{value:50,unit:'mmol/mol'},egfr:{value:'>90',unit:'mL/min/1.73 m²'}};
  assert.deepEqual(assessHeartVascular(ready).result.missing,['egfr']);
  assert.equal(assessHeartVascular({...ready,egfr:{...ready.egfr,value:50}}).result.issue,'diabetes-range');
  assert.equal(assessHeartVascular({...ready,diagnosisAge:61}).errors.diagnosisAge,'Enter the age at diagnosis in whole years. It must be no greater than your current age.');
  for (const variant of [{diabetesType:'Type 1 diabetes'},{treatment:'Yes'},{diabetesDamage:'Not sure'},{age:33},{age:70},{diagnoses:['Diabetes','Chronic kidney disease']}]) {
    const {result} = assessHeartVascular({...ready,...variant});
    assert.ok(result.reason);
    assert.equal(result.risk,undefined);
    assert.notEqual(result.issue,'diabetes-data');
  }
  const high = {...type2,systolic:{value:180,unit:'mmHg'}};
  assert.equal(assessHeartVascular(high).result.issue,'pressure');
  assert.ok(!heartRoute(high).some(step => step.id === 'diabetes-labs'));
});

test('lifestyle prefill carries matching facts forward and leaves narrower heart questions open', () => {
  const overlap = heartPrefill({age:'33', country:' Германия ', smoking:'Some days', smokingDays30:'8', cigarettes:'3,5',
    conditions:['Diabetes', 'Kidney disease', 'Heart or blood-vessel disease'], context:['None'], medicines:['None'],
  });
  assert.deepEqual(overlap, {age:33, country:'Germany', smoking:'Some days', cigarettes:3.5, smokingDays30:8,
    conditions:'Yes', diagnoses:['Diabetes','Heart or blood vessel disease (type unsure)'], treatment:'No', bpTreatment:'No'});
  assert.deepEqual(heartRoute(overlap,Object.keys(overlap)).map(step=>step.id),
    ['review','sex','smoking-history','diagnoses','blood-pressure','measurements']);
  assert.deepEqual(heartPrefill({country:'Unrecognized country', smoking:'Not at all', smokingEver100:'No',
    conditions:['None'], medicines:['Another regular prescription']}), {smoking:'No'});
  assert.deepEqual(heartPrefill({smoking:'Not at all', smokingRegular:'Yes', context:['Pregnant']}), {
    smoking:'Used to smoke', conditions:'Yes', diagnoses:['Currently pregnant'],
  });
  assert.deepEqual(heartPrefill({age:'33',medicines:['Blood-pressure medicine']}), {age:33,bpTreatment:'Yes'});
  const younger = heartPrefill({age:'19',height:'70',heightUnit:'in',weight:'170',weightUnit:'lb',medicines:['None']});
  assert.deepEqual(younger.height,{value:'70',unit:'in'});
  assert.ok(heartRoute({...younger,sex:'Male'},Object.keys(younger))[0].fields.some(field=>field.id==='weight'));
  assert.ok(!heartRoute({...younger,sex:'Male'},Object.keys(younger)).some(step=>step.id==='pday-body'));
});

test('lipid reviews separate own intervals, educational guides and calculation coverage', () => {
  const lab = {...example, total:{value:'200',unit:'mg/dL'}, hdl:{value:'40',unit:'mg/dL'},
    apob:{value:'0.90',unit:'g/L'}, lpa:{value:'125',unit:'nmol/L'},
  };
  const fields = assessHeartVascular(lab).review.fields;
  assert.equal(fields.total.direction, 'above');
  assert.equal(fields.hdl.direction, 'within');
  assert.equal(fields.apob.direction, 'above');
  assert.equal(fields.lpa.direction, 'unknown');
  assert.equal(fields.total.comparison.sourceKind, 'published');
  assert.equal(fields.total.comparison.unit, 'mg/dL');
  const own = assessHeartVascular({...lab, total:{...lab.total, referenceHigh:'220'}, lpa:{...lab.lpa, referenceHigh:'125', referenceHighExclusive:true}});
  assert.equal(own.review.fields.total.comparison.label, 'Within your lab interval');
  assert.equal(own.review.fields.lpa.comparison.label, 'Above your lab interval');
  assert.deepEqual(own.result, assessHeartVascular(lab).result);
  assert.equal(assessHeartVascular({...lab, lpa:{value:'30',unit:'mg/dL'}}).review.fields.lpa.direction, 'above');
  assert.equal(assessHeartVascular({...lab, lpa:{value:'<30',unit:'mg/dL'}}).review.fields.lpa.direction, 'unknown');
  assert.equal(assessHeartVascular({...lab, conditions:'Yes', diagnoses:['Currently pregnant']}).review.fields.total.direction, 'unknown');
  assert.ok(assessHeartVascular({...lab, total:{...lab.total, referenceLow:'220',referenceHigh:'200'}}).errors.totalReference);
  const outside = assessHeartVascular({...example, total:{value:'8.1',unit:'mmol/L',referenceHigh:'9'}});
  assert.equal(outside.review.fields.total.direction, 'within');
  assert.equal(outside.review.fields.total.check.status, 'review');
  assert.equal(outside.result.issue, 'measurements');
});

test('smoking history adds context while current status determines the published smoking input', () => {
  const baseline = assessHeartVascular(example).result;
  const {inputs, errors, result} = assessHeartVascular({...example, smoking:'Some days', smokingDays30:'6', cigarettes:'3', smokingYears:'10',
    diastolic:{value:'92', unit:'mmHg'},
  });
  assert.deepEqual(errors, {});
  assert.deepEqual(result, baseline);
  assert.equal(inputs.smokingDays30, 6);
  assert.equal(inputs.cigarettes, 3);
  assert.equal(inputs.smokingYears, 10);
  assert.equal(assessHeartVascular({...example, smoking:'Used to smoke', smokingDays30:'6'}).inputs.smokingDays30, undefined);
  assert.ok(assessHeartVascular({...example, smoking:'Some days', smokingDays30:'31'}).errors.smokingDays30);
  assert.ok(assessHeartVascular({...example, smokingYears:'51'}).errors.smokingYears);
});

test('health history and blood pressure can withhold the estimate for specific reasons', () => {
  const diagnosis = {...example, conditions:'Yes', diagnoses:['Diabetes', 'Chronic kidney disease']};
  const reviewed = assessHeartVascular(diagnosis);
  assert.deepEqual(reviewed.inputs.diagnoses, diagnosis.diagnoses);
  assert.equal(reviewed.result.issue, 'diabetes');
  assert.equal(reviewed.result.risk, undefined);
  assert.equal(assessHeartVascular({...diagnosis, diagnoses:['Currently pregnant']}).result.issue, 'pregnancy');
  assert.equal(assessHeartVascular({...diagnosis, conditions:'No'}).inputs.diagnoses, undefined);
  assert.ok(assessHeartVascular({...diagnosis, diagnoses:['Not sure which', 'Diabetes']}).errors.diagnoses);
  const high = assessHeartVascular({...example, total:undefined, hdl:undefined, diastolic:{value:'110', unit:'mmHg'}});
  assert.deepEqual(high.errors, {});
  assert.equal(high.result.issue, 'pressure');
  assert.equal(high.result.risk, undefined);
  assert.deepEqual(high.review.pressureWarning.fields, ['diastolic']);
  const highYounger = assessHeartVascular({...example, age:33, systolic:{value:'180',unit:'mmHg'}});
  assert.equal(highYounger.result.issue, 'pressure');
  assert.deepEqual(highYounger.review.pressureWarning.fields, ['systolic']);
  assert.ok(assessHeartVascular({...example, diastolic:{value:'141', unit:'mmHg'}}).errors.diastolic);
});

test('vascular age matches the reference profile and reports its comparison limits', () => {
  const reference = {...example, smoking:'No', systolic:{value:'110', unit:'mmHg'}, total:{value:'4.75', unit:'mmol/L'}};
  for (const age of [40, 55, 69, 70, 77, 89]) {
    const {result} = assessHeartVascular({...reference, age});
    assert.equal(result.age, age);
    assert.equal(result.method, age < 70 ? 'SCORE2' : 'SCORE2-OP');
  }
  const older = assessHeartVascular({...example, age:69}).result;
  assert.equal(older.age, null);
  assert.equal(older.ageRange, 'above');
  const younger = assessHeartVascular({...reference, age:40, systolic:{value:'100', unit:'mmHg'}}).result;
  assert.equal(younger.age, null);
  assert.equal(younger.ageRange, 'below');
});
