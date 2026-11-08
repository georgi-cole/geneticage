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
      assert.equal(result.region, region);
      assert.equal(result.risk.toFixed(1), expected);
    }
  }
  assert.ok(heartQuestions[0].options.every(country => Object.hasOwn(BG, country)), 'Translate every selectable country.');
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
    {age:39}, {age:70}, {country:'Other country'}, {conditions:'Yes'}, {conditions:'Not sure'},
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
});

test('vascular age matches the reference profile and reports its comparison limits', () => {
  const reference = {...example, smoking:'No', systolic:{value:'110', unit:'mmHg'}, total:{value:'4.75', unit:'mmol/L'}};
  for (const age of [40, 55, 69]) assert.equal(assessHeartVascular({...reference, age}).result.age, age);
  const older = assessHeartVascular({...example, age:69}).result;
  assert.equal(older.age, null);
  assert.equal(older.ageRange, 'above');
  const younger = assessHeartVascular({...reference, age:40, systolic:{value:'100', unit:'mmHg'}}).result;
  assert.equal(younger.age, null);
  assert.equal(younger.ageRange, 'below');
});
