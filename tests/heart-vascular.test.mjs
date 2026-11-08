import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessHeartVascular, heartQuestions} from '../public/heart-vascular.mjs';
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

test('early scope can produce a measurement-only report without unrelated answers', () => {
  const systolic = {value:'150', unit:'mmHg'};
  const diastolic = {value:'90', unit:'mmHg'};
  for (const [country, age, issue] of [['Germany', 33, 'young'], ['Bulgaria', 91, 'older'], ['Other country', 50, 'region']]) {
    const {inputs, errors, result} = assessHeartVascular({country, age, systolic, diastolic});
    assert.deepEqual(errors, {});
    assert.deepEqual(inputs, {country, age, systolic, diastolic});
    assert.equal(result.issue, issue);
    assert.equal(result.risk, undefined);
  }
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
