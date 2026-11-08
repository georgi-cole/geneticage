import {heartDecimal} from './heart-measurements.mjs';
import {labs} from './lab-definitions.mjs';
import {compareLabReference, validateReferenceLimits} from './lab-review.mjs';
import {reviewLabSafety} from './lab-safety.mjs';
import {metabolicAge, kidneyFiltration, kidneyAge, estimatedFitness, fitnessAge} from './system-age-models.mjs';

export const systemAssessments = {
  metabolic: {
    title:'Metabolic', icon:'metabolic', caption:'Diabetes risk age',
    readout:'APPROXIMATE METABOLIC AGE',
    sources:['gdrs', 'gdrs-coefficients', 'diabetes-diagnosis', 'hba1c-units', 'critical-mayo'],
  },
  kidney: {
    title:'Kidney', icon:'kidney', caption:'Filtration and urine albumin',
    readout:'APPROXIMATE KIDNEY FILTRATION AGE',
    sources:['ckd-epi-2021', 'egfr-europe', 'egfr-reference-table', 'kdigo-ckd'],
  },
  fitness: {
    title:'Fitness', icon:'fitness', caption:'Aerobic fitness',
    readout:'APPROXIMATE FITNESS AGE',
    sources:['hunt-nonexercise', 'hunt-activity', 'hunt-reference', 'friend-2022'],
  },
};

export const systemAssessment = type => typeof type === 'string' && Object.hasOwn(systemAssessments, type) ? systemAssessments[type] : null;

const yesNo = ['Yes', 'No'];
const contextAnswers = ['Yes', 'No', 'Not sure'];
const sexes = ['Female', 'Male'];
const question = (id, label, options, config = {}) => ({id, label, options, ...config});
const number = (id, label, units, range, config = {}) => ({id, label, units, range, ...config});
const age = label => number('age', label, ['years'], [18, 120], {integer:true});
const sex = question('sex', 'Sex used by the equation', sexes);
const centimetres = unit => unit === 'in' ? 2.54 : 1;
const waist = help => number('waist', 'Waist circumference', ['cm', 'in'], [45, 185], {factor:centimetres, help});
const fasting = labs.find(field => field.id === 'glucose');
const serum = labs.find(field => field.id === 'creatinine');
const fieldsets = {
  metabolic: {
    age:age('How old are you?'),
    diabetes:question('diabetes', 'Has a clinician diagnosed you with diabetes?', yesNo),
    diabetesType:question('diabetesType', 'Which type of diabetes was diagnosed?', ['Type 1 diabetes', 'Type 2 diabetes', 'Another type of diabetes', 'Not sure']),
    pregnancy:question('pregnancy', 'Are you pregnant now?', contextAnswers),
    height:number('height', 'Height', ['cm', 'in'], [100, 250], {factor:centimetres, help:'For feet and inches, enter the total in inches.'}),
    waist:waist('Measure halfway between your lowest rib and the top of your hip bone.'),
    hypertension:question('hypertension', 'Has a clinician diagnosed you with high blood pressure?', yesNo),
    smoking:question('smoking', 'Which describes your cigarette smoking?', ['Never smoked', 'Former smoker', 'Current smoker']),
    cigarettes:number('cigarettes', 'Average cigarettes per day', ['cigarettes/day'], [0.01, 200], {help:'If you used to smoke, use your usual amount before you quit. Include days without cigarettes in the average.'}),
    activity:number('activity', 'Exercise, cycling and gardening', ['hours/week'], [0, 112]),
    coffee:number('coffee', 'Coffee', ['cups/day'], [0, 3600], {factor:() => 150, help:'Count cups of about 150 mL.'}),
    wholeGrain:number('wholeGrain', 'Whole grain bread and muesli', ['g/day'], [0, 1000], {help:'Enter your average amount. A medium slice of bread is about 35 g.'}),
    redMeat:number('redMeat', 'Beef, pork and lamb', ['g/day'], [0, 1500], {help:'For example, two 150 g portions a week average about 43 g per day.'}),
    parents:question('parents', 'Parents with type 2 diabetes', ['Neither parent', 'One parent', 'Both parents'], {labels:{'Neither parent':'No known diagnosis'}}),
    siblings:question('siblings', 'Brothers or sisters with type 2 diabetes', yesNo, {labels:{No:'No known diagnosis'}}),
    hba1c:number('hba1c', 'HbA1c', ['%', 'mmol/mol'], [2.15, 25], {
      convert:(value, unit) => unit === '%' ? value : 2.152 + 0.09148 * value, lab:true, optional:true,
      help:'Enter the result from your lab. Fasting is unnecessary for HbA1c.',
    }),
    glucose:number('glucose', 'Fasting glucose', fasting.units, [0.1, 65], {
      factor:fasting.factor, lab:true, optional:true,
      help:'Use a lab result after at least 8 hours without calories.',
    }),
  },
  kidney: {
    age:age('How old were you at the blood draw?'),
    sex,
    kidneyHistory:question('kidneyHistory', 'Which applies to your kidney health?', ['No known kidney disease', 'Diagnosed kidney disease', 'Kidney transplant', 'Receiving dialysis', 'Not sure']),
    kidneyContext:question('kidneyContext', 'What applied at the time of this blood draw?', ['Stable health', 'Pregnancy', 'Acute illness or kidney injury', 'Not sure']),
    creatinine:number('creatinine', 'Blood creatinine', serum.units, [8.84, 2500], {
      factor:serum.factor, lab:true, help:'Use serum creatinine. Look for µmol/L or mg/dL on the report.',
    }),
    acr:number('acr', 'Urine albumin-to-creatinine ratio (ACR)', ['mg/g', 'mg/mmol'], [0, 10000], {
      factor:unit => unit === 'mg/mmol' ? 8.84 : 1, lab:true, optional:true, allowLimit:true,
      help:'Use the ratio printed on your report, sometimes called uACR.',
    }),
    cystatin:number('cystatin', 'Cystatin C', ['mg/L'], [0.2, 20], {
      lab:true, optional:true, help:'Use cystatin C from the same blood draw as your creatinine.',
    }),
  },
  fitness: {
    age:age('How old were you when these readings were taken?'),
    sex,
    fitnessContext:question('fitnessContext', 'Do any of these affect your resting pulse or exercise?', [
      'None of these', 'Heart or lung condition', 'Medicine that changes heart rate', 'Pregnancy or recent illness', 'Not sure',
    ]),
    waist:waist('Measure with the tape level, around your waist at your navel.'),
    pulse:number('pulse', 'Resting pulse', ['beats/min'], [30, 120], {help:'Use your usual pulse after sitting quietly for a few minutes.'}),
    moderate:number('moderate', 'Moderate activity', ['min / week'], [0, 10080], {help:'Activity that makes you breathe faster while you can still talk.'}),
    vigorous:number('vigorous', 'Vigorous activity', ['min / week'], [0, 10080], {help:'Activity that makes it hard to say more than a few words.'}),
    vo2peak:number('vo2peak', 'Measured VO₂peak', ['mL/kg/min'], [5, 100], {optional:true, help:'Use the relative value from a supervised gas exchange test.'}),
    testType:question('testType', 'Exercise test type', ['Treadmill test', 'Cycle test', 'Not sure'], {optional:true}),
    rer:number('rer', 'Peak respiratory exchange ratio (RER)', ['ratio'], [0.5, 2], {optional:true, help:'Look for peak RER in the same test report. For example, 1.12.'}),
  },
};

const step = (id, title, fields, hint = '') => ({id, title, fields, hint});
const metabolicHistory = [
  step('body', 'Body measurements', ['height', 'waist']),
  step('pressure', 'Blood pressure history', ['hypertension']),
  step('tobacco', 'Smoking history', ['smoking']),
];
const metabolicHabits = [
  step('habits', 'Usual activity and coffee', ['activity', 'coffee'], 'Enter 0 for any amount that does not apply.'),
  step('food', 'Usual food intake', ['wholeGrain', 'redMeat'], 'Use a typical week to estimate daily amounts.'),
  step('family', 'Family history', ['parents', 'siblings']),
];
const glucoseStep = {
  ...step('metabolic-labs', 'Glucose tests', ['hba1c', 'glucose'], 'HbA1c reflects blood sugar over the past few months and can refine this estimate.'),
  action:'Add glucose tests', change:'Edit glucose tests', skip:'Continue with profile',
};
const urineStep = {
  ...step('kidney-urine', 'Urine albumin', ['acr'], 'Urine ACR can reveal kidney damage even when filtration is preserved.'),
  action:'Add urine ACR', change:'Edit urine ACR', skip:'Continue with blood result',
};
const extraSteps = {
  metabolic:[glucoseStep],
  kidney:[urineStep, {
    ...step('kidney-cystatin', 'Cystatin C', ['cystatin'], 'This blood test helps estimate kidney filtration when creatinine alone is less reliable.'),
    action:'Add cystatin C', change:'Edit cystatin C', specialist:true, benefit:'Refines the filtration result',
  }],
  fitness:[{
    ...step('fitness-test', 'Supervised fitness test', ['testType', 'vo2peak', 'rer'], 'A supervised exercise test directly measures how much oxygen you can use.'),
    action:'Add supervised test', change:'Edit supervised test', specialist:true, benefit:'Uses a measured fitness result',
  }],
};

export const systemField = (type, id) => fieldsets[type]?.[id];
export const systemExtras = type => extraSteps[type];
const explicitAge = inputs => inputs.age ? Number(inputs.age.value) : null;

export function systemSteps(type, inputs = {}) {
  if (type === 'metabolic') {
    const basics = [
      step('age', 'About you', ['age']),
      step('diabetes', 'Diabetes history', ['diabetes']),
      step('pregnancy', 'Health context', ['pregnancy']),
    ];
    if (explicitAge(inputs) > 79) return basics.slice(0, 1);
    if (inputs.diabetes === 'Yes') return [...basics.slice(0, 2), step('diabetes-type', 'Diabetes history', ['diabetesType'])];
    if (inputs.pregnancy && inputs.pregnancy !== 'No') return basics;
    return [...basics, ...metabolicHistory,
      ...(['Former smoker','Current smoker'].includes(inputs.smoking) ? [step('amount', 'Cigarette amount', ['cigarettes'])] : []),
      ...metabolicHabits, glucoseStep];
  }
  if (type === 'kidney') return [
    step('age', 'Age at collection', ['age']),
    step('sex', 'Reference group', ['sex']),
    step('kidney-history', 'Kidney history', ['kidneyHistory']),
    step('collection', 'At the time of the test', ['kidneyContext']),
    step('creatinine', 'Routine blood test', ['creatinine']),
    urineStep,
  ];
  const basics = [step('age', 'About you', ['age']), step('sex', 'Reference group', ['sex'])];
  const age = explicitAge(inputs);
  if (age !== null && (age < 20 || age > 89)) return basics.slice(0, 1);
  const health = step('fitness-context', 'Health context', ['fitnessContext']);
  if (inputs.fitnessContext && inputs.fitnessContext !== 'None of these') return [...basics, health];
  return [...basics, health, step('resting', 'Resting measurements', ['waist', 'pulse']),
    step('training', 'Usual activity', ['moderate', 'vigorous'], 'Think of a typical week over the past year. Include leisure time and enter 0 when needed.')];
}

const present = value => value != null && (typeof value !== 'string' || value.trim() !== '');
const testRange = (value, range) => value >= range[0] && value <= range[1];
const stepFields = steps => steps.flatMap(({fields}) => fields);
const normalizedValue = (field, value, unit) => field.convert ? field.convert(value, unit) : value * (field.factor?.(unit) ?? 1);

function measurementEntry(field, raw, errors) {
  const {id, units, range, integer, allowLimit} = field;
  const value = heartDecimal(raw?.value, allowLimit);
  const amount = value === null ? NaN : Number(value.replace(/^[<>≤≥]/, ''));
  const normalized = normalizedValue(field, amount, raw?.unit);
  if (!units.includes(raw?.unit) || !testRange(normalized, range) || integer && !Number.isInteger(amount)) {
    errors[id] = 'Check the value and unit.';
    return null;
  }
  const entry = {value, unit:raw.unit};
  if (!field.lab) return entry;
  for (const key of ['referenceLow', 'referenceHigh']) {
    if (!present(raw[key])) continue;
    const bound = heartDecimal(raw[key]);
    if (bound === null || raw[key+'Exclusive'] !== undefined && typeof raw[key+'Exclusive'] !== 'boolean') {
      errors[id+'Reference'] = 'Check the laboratory reference limits.';
      break;
    }
    entry[key] = bound;
    if (raw[key+'Exclusive']) entry[key+'Exclusive'] = true;
  }
  const referenceError = validateReferenceLimits(entry);
  if (referenceError) errors[id+'Reference'] = referenceError;
  return entry;
}

function checkMeasurement(field, entry, errors) {
  const {id, lab} = field;
  const referenceError = errors[id+'Reference'];
  const warning = id === 'glucose' && entry ? reviewLabSafety(id, entry).warning : null;
  const exact = Number.isFinite(Number(entry?.value));
  const comparison = lab && exact && !referenceError
    ? {...compareLabReference(entry), unit:entry.unit, lowExclusive:entry.referenceLowExclusive, highExclusive:entry.referenceHighExclusive} : null;
  return {check:{status:errors[id] ? 'invalid' : 'ok', message:errors[id], warning},
    comparison, direction:comparison?.status || 'unknown', referenceError};
}

const missingResult = missing => ({status:'missing', missing});
const reviewResult = issue => ({status:'review', issue});
const readyResult = (method, version, age) => ({status:'ready', method, version, ...age});
const hasDiagnosisReading = (inputs, values) =>
  inputs.hba1c && (inputs.hba1c.unit === '%' ? values.hba1c >= 6.5 : Number(inputs.hba1c.value) >= 48)
  || inputs.glucose && (inputs.glucose.unit === 'mg/dL' ? Number(inputs.glucose.value) >= 126 : values.glucose >= 7);

function assessMetabolic(inputs, values, review) {
  if (review.fields.glucose?.check.warning) return reviewResult('glucose-critical');
  if (values.age > 79) return reviewResult('metabolic-age');
  if (!inputs.diabetes) return missingResult(['diabetes']);
  if (inputs.diabetes === 'Yes') return inputs.diabetesType ? reviewResult('diabetes-known') : missingResult(['diabetesType']);
  if (!inputs.pregnancy) return missingResult(['pregnancy']);
  if (inputs.pregnancy !== 'No') return reviewResult('metabolic-pregnancy');
  if (hasDiagnosisReading(inputs, values)) return reviewResult('glucose-review');
  const missing = stepFields(systemSteps('metabolic', inputs)).filter(id => !fieldsetOptional('metabolic', id) && inputs[id] === undefined);
  if (missing.length) return missingResult(missing);
  const a1c = values.hba1c;
  const includeA1c = a1c >= 4;
  if (inputs.hba1c && !includeA1c) review.a1cOutside = true;
  return readyResult(includeA1c ? 'GDRS with HbA1c' : 'GDRS', includeA1c ? 'gdrs-2022-a1c-age-v1' : 'gdrs-2022-age-v1',
    metabolicAge({...inputs, ...values}, includeA1c ? a1c : undefined));
}

function highAcr(entry) {
  if (!entry || /^[<≤]/.test(entry.value)) return false;
  return Number(entry.value.replace(/^[>≥]/, '')) >= (entry.unit === 'mg/mmol' ? 3 : 30);
}

function assessKidney(inputs, values, review) {
  const missing = ['age','sex','kidneyHistory','kidneyContext','creatinine'].filter(id => inputs[id] === undefined);
  if (inputs.kidneyContext && inputs.kidneyContext !== 'Stable health') return reviewResult('kidney-collection');
  if (['Kidney transplant','Receiving dialysis'].includes(inputs.kidneyHistory)) return reviewResult('kidney-treatment');
  if (missing.length) return missingResult(missing);
  const creatinine = values.creatinine / 88.4;
  review.egfr = kidneyFiltration(values.age, inputs.sex, creatinine);
  if (inputs.cystatin) review.egfrCombined = kidneyFiltration(values.age, inputs.sex, creatinine, values.cystatin);
  if (review.egfr < 60 || review.egfrCombined < 60) {
    return {...reviewResult('kidney-filtration'), edit:review.egfr < 60 ? 'creatinine' : 'kidney-cystatin'};
  }
  if (highAcr(inputs.acr)) return reviewResult('kidney-albumin');
  if (inputs.kidneyHistory !== 'No known kidney disease') return reviewResult('kidney-history');
  return readyResult('CKD-EPI 2021', 'ckd-epi-2021-europe-age-v1', kidneyAge(review.egfr, inputs.sex));
}

function assessFitness(inputs, values, review) {
  if (!inputs.age) return missingResult(['age']);
  if (values.age < 20 || values.age > 89) return reviewResult('fitness-age');
  if (!inputs.sex) return missingResult(['sex']);
  const test = ['Treadmill test','Cycle test'].includes(inputs.testType) && values.vo2peak && values.rer >= 1;
  if (test) return readyResult('FRIEND', 'friend-2022-fitness-age-v1', fitnessAge(values.vo2peak, inputs.sex, inputs.testType));
  if (inputs.vo2peak || inputs.testType || inputs.rer) review.testIncomplete = true;
  if (inputs.fitnessContext && inputs.fitnessContext !== 'None of these') return reviewResult('fitness-context');
  const missing = ['fitnessContext','waist','pulse','moderate','vigorous'].filter(id => inputs[id] === undefined);
  if (missing.length) return missingResult(missing);
  review.estimatedVo2 = estimatedFitness({...values, sex:inputs.sex});
  if (review.estimatedVo2 < 5 || review.estimatedVo2 > 100) return reviewResult('fitness-values');
  return readyResult('HUNT', 'hunt-nonexercise-fitness-age-v1', fitnessAge(review.estimatedVo2, inputs.sex));
}

const fieldsetOptional = (type, id) => systemField(type, id)?.optional;
const assess = {metabolic:assessMetabolic, kidney:assessKidney, fitness:assessFitness};

export function assessSystem(type, raw = {}) {
  const inputs = {}, values = {}, errors = {}, fields = {};
  const available = new Set(stepFields([...systemSteps(type, raw), ...extraSteps[type]]));
  for (const field of Object.values(fieldsets[type])) {
    const {id, options} = field;
    const value = raw[id];
    if (!available.has(id) || value == null || value === '') continue;
    if (options) {
      if (options.includes(value)) inputs[id] = value;
      else errors[id] = 'Choose an answer from the list.';
    } else if (present(value?.value) || typeof value !== 'object' || Array.isArray(value)) {
      const entry = measurementEntry(field, value, errors);
      if (entry) {
        inputs[id] = entry;
        values[id] = normalizedValue(field, Number(entry.value), entry.unit);
      }
      fields[id] = checkMeasurement(field, entry, errors);
    }
  }
  if (type === 'fitness' && values.moderate + values.vigorous > 10080) errors.vigorous = 'The activity minutes add up to more than a week.';
  const review = {fields};
  const result = !inputs.age ? missingResult(['age']) : assess[type](inputs, values, review);
  return {inputs, result, review, errors};
}

// Only transfer answers whose meaning matches the new model's input.
export function systemPrefill(type, answers = {}, heart = {}, blood = {}) {
  const draft = {};
  const reportedAge = heartDecimal(type === 'kidney' ? (blood.labSubmitted ? blood.labAge : undefined) : answers.age ?? heart.age);
  if (reportedAge && Number.isInteger(Number(reportedAge)) && testRange(Number(reportedAge), [18, 120])) {
    draft.age = {value:reportedAge, unit:'years'};
  }
  if (type !== 'metabolic' && sexes.includes(heart.sex)) draft.sex = heart.sex;
  const conditions = Array.isArray(answers.conditions) ? answers.conditions : [];
  if (type === 'kidney') {
    if (answers.context?.includes('Receiving dialysis')) draft.kidneyHistory = 'Receiving dialysis';
    else if (conditions.includes('Kidney disease')) draft.kidneyHistory = 'Diagnosed kidney disease';
    else if (conditions.includes('None')) draft.kidneyHistory = 'No known kidney disease';
    const creatinine = measurementEntry(fieldsets.kidney.creatinine, blood.lab?.creatinine, {});
    if (blood.labSubmitted && draft.age && creatinine) draft.creatinine = creatinine;
  }
  if (type === 'fitness') {
    if (conditions.includes('Heart or blood-vessel disease') || conditions.includes('Long-term lung disease')) draft.fitnessContext = 'Heart or lung condition';
  }
  if (type === 'metabolic') {
    if (conditions.includes('High blood pressure')) draft.hypertension = 'Yes';
    else if (conditions.includes('None')) draft.hypertension = 'No';
    if (conditions.includes('None')) draft.diabetes = 'No';
    if (conditions.includes('Diabetes')) draft.diabetes = 'Yes';
    if (answers.context?.includes('Pregnant')) draft.pregnancy = 'Yes';
    else if (answers.context?.includes('None')) draft.pregnancy = 'No';
    if (['Type 2 diabetes','Type 1 diabetes'].includes(heart.diabetesType)) {
      draft.diabetes = 'Yes';
      draft.diabetesType = heart.diabetesType;
    }
    const height = {value:answers.height, unit:answers.heightUnit};
    if (measurementEntry(fieldsets.metabolic.height, height, {})) draft.height = height;
    if (['Every day','Some days'].includes(answers.smoking)) draft.smoking = 'Current smoker';
    if (answers.smoking === 'Used to smoke regularly' || answers.smoking === 'Not at all' && answers.smokingRegular === 'Yes') draft.smoking = 'Former smoker';
    const daily = heartDecimal(answers.cigarettes);
    if (answers.smoking === 'Every day' && daily && testRange(Number(daily), [0.01, 200])) {
      draft.cigarettes = {value:daily, unit:'cigarettes/day'};
    }
  }
  return draft;
}
