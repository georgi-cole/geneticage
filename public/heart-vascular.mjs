export const HEART_ASSESSMENT = 'heart-vascular';
const SCORE2 = 'SCORE2';
const SCORE2_OP = 'SCORE2-OP';
const coverageSources = ['score2-regions', 'score2-scope'];

export function heartSources(result) {
  if (result.issue) {
    const extra = {pressure:'esc-blood-pressure', diabetes:'score2-diabetes', young:'life-cvd2'}[result.issue];
    return ['score2', 'score2-op', ...coverageSources, ...(extra ? [extra] : [])];
  }
  return result.method === SCORE2_OP
    ? ['score2-op', 'score2-calculators', ...coverageSources, 'vascular-age']
    : ['score2', 'score2-coefficients', ...coverageSources, 'vascular-age'];
}

// ESC HeartScore's assignment of countries to the four SCORE2 calibrations.
const regionCountries = {
  low:['Belgium', 'Denmark', 'France', 'Israel', 'Luxembourg', 'Netherlands', 'Norway', 'Spain', 'Switzerland', 'United Kingdom'],
  moderate:['Austria', 'Cyprus', 'Finland', 'Germany', 'Greece', 'Iceland', 'Ireland', 'Italy', 'Malta', 'Portugal', 'San Marino', 'Slovenia', 'Sweden'],
  high:['Albania', 'Bosnia and Herzegovina', 'Croatia', 'Czechia', 'Estonia', 'Hungary', 'Kazakhstan', 'Poland', 'Slovakia', 'Türkiye'],
  veryHigh:['Algeria', 'Armenia', 'Azerbaijan', 'Belarus', 'Bulgaria', 'Egypt', 'Georgia', 'Kyrgyzstan', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Moldova', 'Montenegro', 'Morocco', 'North Macedonia', 'Romania', 'Russia', 'Serbia', 'Syria', 'Tunisia', 'Ukraine', 'Uzbekistan'],
};
const regionsByCountry = new Map(Object.entries(regionCountries).flatMap(([region, countries]) => countries.map(country => [country, region])));
const countries = [...regionsByCountry.keys()].sort();
export const heartRegionLabels = {low:'Low-risk region', moderate:'Moderate-risk region', high:'High-risk region', veryHigh:'Very-high-risk region'};

const yesNo = ['Yes', 'No', 'Not sure'];
const currentSmoking = ['Yes', 'Every day', 'Some days'];
export const heartQuestions = [
  {id:'country', label:'Country of residence', options:[...countries, 'Other country'], hint:'Your country of residence determines which regional estimate applies.'},
  {id:'sex', label:'Sex used for the risk estimate', options:['Female', 'Male', 'Prefer not to say'], hint:'The models use separate equations for female and male participants.'},
  {id:'smoking', label:'Which best describes your cigarette smoking?', options:['Every day', 'Some days', 'Used to smoke', 'Never smoked', 'Not sure']},
  {id:'conditions', label:'Does any of this health history apply to you?', options:yesNo, hint:'Heart or blood vessel disease, diabetes, chronic kidney disease, an inherited or rare cholesterol or blood pressure disorder, or current pregnancy.'},
  {id:'treatment', label:'Are you taking cholesterol-lowering medicine?', options:yesNo},
];

const diagnosesByIssue = {
  'Heart attack or coronary heart disease':'cvd',
  'Stroke or mini-stroke (TIA)':'cvd',
  'Other heart or blood vessel disease':'cvd',
  Diabetes:'diabetes',
  'Chronic kidney disease':'kidney',
  'Inherited or rare cholesterol or blood pressure disorder':'inherited',
  'Currently pregnant':'pregnancy',
};
export const heartDiagnosisQuestion = {id:'diagnoses', label:'Which apply to you?', hint:'Select all that apply.', options:[...Object.keys(diagnosesByIssue), 'Not sure which'], multiple:true};
export const heartDiagnosisActive = inputs => inputs.conditions === 'Yes';

const smokingDetails = [
  {id:'smokingDays30', label:'Days you smoked in the past 30 days', min:1, max:30, integer:true},
  {id:'cigarettes', label:'Cigarettes on a day you smoke', formerLabel:'Cigarettes on a day you smoked', min:0.1, max:200},
  {id:'smokingYears', label:'Years you smoked cigarettes', min:0, max:120},
];

export function heartSmokingFields(inputs) {
  if (!currentSmoking.includes(inputs.smoking) && inputs.smoking !== 'Used to smoke') return [];
  return inputs.smoking === 'Some days' ? smokingDetails : smokingDetails.slice(1);
}

export const heartLegacySmoking = {Yes:'Current smoker', No:'Not currently smoking'};

export const heartMeasurements = [
  {id:'systolic', label:'Systolic blood pressure', units:['mmHg'], group:'pressure'},
  {id:'diastolic', label:'Diastolic blood pressure', units:['mmHg'], group:'pressure', optional:true},
  {id:'total', label:'Total cholesterol', units:['mmol/L', 'mg/dL']},
  {id:'hdl', label:'HDL cholesterol', units:['mmol/L', 'mg/dL']},
  {id:'apob', label:'ApoB (apolipoprotein B)', units:['g/L', 'mg/dL'], group:'specialist', optional:true},
  {id:'lpa', label:'Lp(a) (lipoprotein(a))', units:['nmol/L', 'mg/dL'], group:'specialist', optional:true},
];

// SCORE2 authors' four-decimal coefficients (ehab761, Table 1).
const score2Coefficients = {
  Male:{age:0.3742, smoking:0.6012, systolic:0.2777, total:0.1458, hdl:-0.2698,
    ageSmoking:-0.0755, ageSystolic:-0.0255, ageTotal:-0.0281, ageHdl:0.0426,
    survival:0.9605, calibration:{low:[-0.5699, 0.7476], moderate:[-0.1565, 0.8009], high:[0.3207, 0.9360], veryHigh:[0.5836, 0.8294]}},
  Female:{age:0.4648, smoking:0.7744, systolic:0.3131, total:0.1002, hdl:-0.2606,
    ageSmoking:-0.1088, ageSystolic:-0.0277, ageTotal:-0.0226, ageHdl:0.0613,
    survival:0.9776, calibration:{low:[-0.7380, 0.7019], moderate:[-0.3143, 0.7701], high:[0.5710, 0.9369], veryHigh:[0.9412, 0.8329]}},
};

// SCORE2-OP (ehab312). The four-decimal terms and regional scales follow
// RiskScorescvd R/11_SCORE2_func.R and were checked against ESC HeartScore.
// Diabetes terms are zero in this assessment's eligible population.
const score2OpCoefficients = {
  Male:{age:0.0634, smoking:0.3524, systolic:0.0094, total:0.0850, hdl:-0.3564,
    ageSmoking:-0.0247, ageSystolic:-0.0005, ageTotal:0.0073, ageHdl:0.0091,
    survival:0.7576, mean:0.0929, calibration:{low:[-0.34, 1.19], moderate:[0.01, 1.25], high:[0.08, 1.15], veryHigh:[0.05, 0.70]}},
  Female:{age:0.0789, smoking:0.4921, systolic:0.0102, total:0.0605, hdl:-0.3040,
    ageSmoking:-0.0255, ageSystolic:-0.0004, ageTotal:-0.0009, ageHdl:0.0154,
    survival:0.8082, mean:0.229, calibration:{low:[-0.52, 1.01], moderate:[-0.10, 1.10], high:[0.38, 1.09], veryHigh:[0.38, 0.69]}},
};

const score2 = {name:SCORE2, version:'score2-2021-regional-v1', minAge:40, maxAge:69,
  center:{age:60, systolic:120, hdl:1.3}, scale:{age:5, systolic:20, hdl:0.5}, coefficients:score2Coefficients};
const score2Op = {name:SCORE2_OP, version:'score2-op-2021-regional-v1', minAge:70, maxAge:89,
  center:{age:73, systolic:150, hdl:1.4}, scale:{age:1, systolic:1, hdl:1}, coefficients:score2OpCoefficients};
const models = [score2, score2Op];
const modelForAge = age => models.find(model => age >= model.minAge && age <= model.maxAge);

export function heartModelForReport(result) {
  if (result.reason) return null;
  const {name, minAge, maxAge} = result.method === SCORE2_OP ? score2Op : score2;
  return {name, minAge, maxAge};
}

function scoreLogHazard({age, sex, region, smoking, systolic, total, hdl}, {center, scale, coefficients}) {
  const model = coefficients[sex];
  const ageTerm = (age - center.age) / scale.age;
  const pressureTerm = (systolic - center.systolic) / scale.systolic;
  const totalTerm = total - 6;
  const hdlTerm = (hdl - center.hdl) / scale.hdl;
  const linear = model.age * ageTerm + model.smoking * smoking + model.systolic * pressureTerm
    + model.total * totalTerm + model.hdl * hdlTerm
    + ageTerm * (model.ageSmoking * smoking + model.ageSystolic * pressureTerm
      + model.ageTotal * totalTerm + model.ageHdl * hdlTerm);
  const [scale1, scale2] = model.calibration[region];
  return scale1 + scale2 * (Math.log(-Math.log(model.survival)) + linear - (model.mean ?? 0));
}

function riskEquivalentAge(logHazard, sex, region, model) {
  // Continuous implementation of the reference-profile comparison.
  // Cuende and Guijarro use non-smoking, SBP 110 and non-HDL 3.45 mmol/L.
  const reference = {sex, region, smoking:0, systolic:110, total:4.75, hdl:1.3};
  const {minAge, maxAge} = model;
  const first = scoreLogHazard({...reference, age:minAge}, model);
  const last = scoreLogHazard({...reference, age:maxAge}, model);
  if (logHazard < first) return {age:null, ageRange:'below'};
  if (logHazard > last) return {age:null, ageRange:'above'};
  // With the reference factors fixed, log cumulative hazard is linear in age.
  return {age:Math.round(minAge + (maxAge - minAge) * (logHazard - first) / (last - first)), ageRange:null};
}

function decimal(value, allowQualifier = false) {
  if (!['number', 'string'].includes(typeof value) || String(value).length > 24) return null;
  const text = String(value).trim().replace(',', '.');
  const match = /^([<>≤≥])?\s*(\d+(?:\.\d+)?|\.\d+)$/.exec(text);
  if (!match || (match[1] && !allowQualifier) || !Number.isFinite(Number(match[2]))) return null;
  return (match[1] || '') + match[2];
}

const reviewMeasurements = 'Review your blood pressure and cholesterol with a clinician to find the assessment that fits your situation.';
export const heartLimitations = {
  young:{reason:'The European 10-year risk estimates in this assessment start at age 40.', next:'Review your blood pressure, cholesterol and family history with a clinician to discuss risk at your age.', edit:'age'},
  older:{reason:'The European 10-year risk estimates in this assessment cover ages 40–89.', next:reviewMeasurements, edit:'age'},
  region:{reason:'The country selected is outside the SCORE2 regions covered here.', next:'Check your country of residence or ask a clinician which risk assessment is used where you live.', edit:'country'},
  cvd:{reason:'These models estimate the risk of a first event. Your answers include a history of cardiovascular disease.', next:'Ask the clinician who manages your heart or blood vessel condition about a follow-up risk assessment.'},
  diabetes:{reason:'Your answers include a diabetes diagnosis. Cardiovascular risk in diabetes uses a separate assessment.', next:'Ask your clinician about a diabetes-specific cardiovascular risk assessment.'},
  kidney:{reason:'Your answers include chronic kidney disease. Kidney function changes how cardiovascular risk is assessed.', next:reviewMeasurements},
  inherited:{reason:'Your answers include an inherited or rare cholesterol or blood pressure disorder. This requires a different approach to risk assessment.', next:reviewMeasurements},
  pregnancy:{reason:'Current pregnancy requires a separate approach to cardiovascular assessment.', next:'Share your measurements with your maternity care team.'},
  conditions:{reason:'Your diagnosis history needs clarification before using this estimate.', next:'Check which diagnoses apply to you, or discuss your history and measurements with a clinician.', edit:'conditions'},
  treatment:{reason:'This assessment uses cholesterol measurements from people who are not taking cholesterol-lowering medicine.', next:'Discuss your results and treatment history with the clinician who manages your cholesterol.'},
  treatmentUnknown:{reason:'Your cholesterol medication history needs clarification before using this estimate.', next:'Check your medication list, or review it with a clinician.', edit:'treatment'},
  sex:{reason:'The estimate uses a sex-specific equation.', next:'Review the sex input or view your measurements on their own.', edit:'sex'},
  smoking:{reason:'The estimate needs your current smoking status.', next:'Review your smoking answer or view your measurements on their own.', edit:'smoking'},
  pressure:{reason:'This blood pressure is outside the range for the risk estimate.', next:'Check the numbers against your reading. If this is a recent, confirmed reading, seek prompt medical advice.', edit:'measurements'},
  measurements:{reason:'A blood pressure or cholesterol value falls outside this assessment’s calculation range.', next:'Check the values and units. If they match your measurements, discuss them with a clinician.', edit:'measurements'},
};

export function heartStartIssue(inputs) {
  const age = Number(decimal(inputs.age));
  if (Number.isInteger(age) && age >= 18 && age < score2.minAge) return 'young';
  if (Number.isInteger(age) && age > score2Op.maxAge && age <= 120) return 'older';
  if (inputs.country === 'Other country') return 'region';
  return null;
}

function scopeIssue(inputs, region) {
  const startIssue = heartStartIssue(inputs);
  if (startIssue) return startIssue;
  if (!region) return 'region';
  if (inputs.conditions !== 'No') {
    const issues = (inputs.diagnoses || []).map(diagnosis => diagnosesByIssue[diagnosis]);
    return ['pregnancy', 'cvd', 'diabetes', 'kidney', 'inherited'].find(issue => issues.includes(issue)) || 'conditions';
  }
  if (inputs.treatment === 'Yes') return 'treatment';
  if (inputs.treatment === 'Not sure') return 'treatmentUnknown';
  if (inputs.sex === 'Prefer not to say') return 'sex';
  if (inputs.smoking === 'Not sure') return 'smoking';
  return null;
}

const mmol = entry => Number(entry.value) / (entry.unit === 'mg/dL' ? 38.67 : 1);
const unavailable = issue => ({issue, reason:heartLimitations[issue].reason});

export function assessHeartVascular(raw = {}) {
  const inputs = {};
  const errors = {};
  const age = decimal(raw?.age);
  if (age === null || !Number.isInteger(Number(age)) || Number(age) < 18 || Number(age) > 120) {
    errors.age = 'Enter a whole-year age from 18 to 120.';
  } else inputs.age = Number(age);

  const startIssue = heartStartIssue({age:inputs.age, country:raw?.country});
  for (const {id, options} of heartQuestions) {
    if (startIssue && id !== 'country') continue;
    const value = raw?.[id];
    if (options.includes(value) || (id === 'smoking' && typeof value === 'string' && Object.hasOwn(heartLegacySmoking, value))) inputs[id] = value;
    else errors[id] = 'Choose an answer.';
  }

  if (heartDiagnosisActive(inputs) && raw.diagnoses !== undefined) {
    const choices = Array.isArray(raw.diagnoses) ? [...new Set(raw.diagnoses)] : [];
    if (!choices.length || choices.some(choice => !heartDiagnosisQuestion.options.includes(choice))) errors.diagnoses = 'Select the conditions that apply or choose Not sure which.';
    else if (choices.includes('Not sure which') && choices.length > 1) errors.diagnoses = 'Choose Not sure which on its own.';
    else inputs.diagnoses = choices;
  }

  for (const {id, min, max, integer} of heartSmokingFields(inputs)) {
    const entry = raw?.[id];
    if (entry === '' || entry == null) continue;
    const value = decimal(entry);
    const amount = Number(value);
    if (value === null || amount < min || amount > max || (integer && !Number.isInteger(amount))) errors[id] = 'Check the smoking history value.';
    else if (id === 'smokingYears' && amount > inputs.age) errors[id] = 'The number of years smoked cannot be greater than your age.';
    else inputs[id] = amount;
  }

  const region = regionsByCountry.get(inputs.country);
  const issue = scopeIssue(inputs, region);
  const missing = [];
  for (const {id, units, optional, group} of heartMeasurements) {
    const entry = raw?.[id];
    if (entry == null || (typeof entry === 'object' && (entry.value == null || typeof entry.value === 'string' && !entry.value.trim()))) {
      if (!optional) missing.push(id);
      continue;
    }
    const value = decimal(entry.value, group === 'specialist');
    if (value === null || (group !== 'specialist' && Number(value) <= 0) || !units.includes(entry.unit)) {
      errors[id] = 'Check the measured value and unit.';
    } else inputs[id] = {value, unit:entry.unit};
  }

  const total = inputs.total ? mmol(inputs.total) : null;
  const hdl = inputs.hdl ? mmol(inputs.hdl) : null;
  const systolic = Number(inputs.systolic?.value);
  const diastolic = Number(inputs.diastolic?.value);
  const highPressure = systolic >= 180 || diastolic >= 110;
  if (!issue && !highPressure) for (const id of missing) errors[id] = 'Enter the measured value.';
  if (total !== null && hdl !== null && hdl >= total) errors.hdl = 'HDL cholesterol must be lower than total cholesterol. Check both values and units.';
  if (inputs.diastolic && !inputs.systolic && !errors.systolic) errors.systolic = 'Enter the top number for this blood pressure reading.';
  if (diastolic >= systolic) errors.diastolic = 'The bottom number must be lower than the top number.';
  if (Object.keys(errors).length) return {inputs, errors, result:null};
  if (highPressure) return {inputs, errors, result:unavailable('pressure')};
  if (issue) return {inputs, errors, result:unavailable(issue)};

  if (systolic < 100 || total < 2.5 || total > 8 || hdl < 0.5 || hdl > 3) {
    return {inputs, errors, result:unavailable('measurements')};
  }

  const model = modelForAge(inputs.age);
  const logHazard = scoreLogHazard({age:inputs.age, sex:inputs.sex, region, smoking:Number(currentSmoking.includes(inputs.smoking)), systolic, total, hdl}, model);
  const risk = -100 * Math.expm1(-Math.exp(logHazard));
  return {inputs, errors, result:{method:model.name, version:model.version, risk, region, ...riskEquivalentAge(logHazard, inputs.sex, region, model)}};
}
