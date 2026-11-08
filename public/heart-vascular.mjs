import {heartMeasurements, heartDecimal as decimal, heartPressureMessage, reviewHeartMeasurements} from './heart-measurements.mjs';

export const HEART_ASSESSMENT = 'heart-vascular';
const SCORE2 = 'SCORE2';
const SCORE2_OP = 'SCORE2-OP';
const coverageSources = ['score2-regions', 'score2-scope'];

export function heartSources(result, review) {
  const labs = Object.values(review?.fields || {}).some(field => field.comparison?.sourceKind === 'published') ? ['adult-intervals'] : [];
  if (result.issue) {
    const extras = [result.issue === 'pressure' && 'esc-blood-pressure', result.issue === 'young' && 'life-cvd2',
      (result.issue === 'diabetes' || result.historyIssue === 'diabetes') && 'score2-diabetes'].filter(Boolean);
    return ['score2', 'score2-op', ...coverageSources, ...extras, ...labs];
  }
  return result.method === SCORE2_OP
    ? ['score2-op', 'score2-calculators', ...coverageSources, 'vascular-age', ...labs]
    : ['score2', 'score2-coefficients', ...coverageSources, 'vascular-age', ...labs];
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
  {id:'smoking', label:'Which best describes your cigarette smoking?', options:['Every day', 'Some days', 'Used to smoke', 'Never smoked', 'Not sure', 'Prefer not to say']},
  {id:'conditions', label:'Does any of this health history apply to you?', options:yesNo, hint:'Heart or blood vessel disease, diabetes, chronic kidney disease, an inherited or rare cholesterol or blood pressure disorder, or current pregnancy.'},
  {id:'treatment', label:'Are you taking cholesterol-lowering medicine?', options:yesNo},
];

export const HEART_UNSPECIFIED_CVD = 'Heart or blood vessel disease (type unsure)';
const diagnosesByIssue = {
  'Heart attack or coronary heart disease':'cvd',
  'Stroke or mini-stroke (TIA)':'cvd',
  'Other heart or blood vessel disease':'cvd',
  [HEART_UNSPECIFIED_CVD]:'cvd',
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

const reviewMeasurements = 'Review your blood pressure and cholesterol with a clinician to find the assessment that fits your situation.';
export const heartLimitations = {
  young:{reason:'The European 10-year risk estimates in this assessment start at age 40.', next:'Review your blood pressure, cholesterol and family history with a clinician to discuss risk at your age.', edit:'age'},
  older:{reason:'The European 10-year risk estimates in this assessment cover ages 40–89.', next:reviewMeasurements, edit:'age'},
  region:{reason:'The country selected is outside the SCORE2 regions covered here.', next:'Check your country of residence or ask a clinician which risk assessment is used where you live.', edit:'country'},
  cvd:{reason:'These equations estimate the chance of a first cardiovascular event. Risk with established disease uses a separate assessment.', next:'Ask the clinician who manages your heart or blood vessel condition about a follow-up risk assessment.'},
  diabetes:{reason:'A diabetes-specific assessment can account for blood sugar control, kidney function and how long you have had diabetes.', next:'Bring your latest HbA1c and kidney function results if available. Ask which cardiovascular assessment fits your age and medical history.'},
  kidney:{reason:'Kidney function can change the way cardiovascular risk is assessed.', next:'Ask how your kidney function results factor into your cardiovascular risk.'},
  inherited:{reason:'Inherited lipid or blood pressure disorders can affect risk beyond the measurements these equations use.', next:reviewMeasurements},
  pregnancy:{reason:'Pregnancy changes how blood pressure and cholesterol are interpreted.', next:'Share your measurements with your maternity care team.'},
  conditions:{reason:'Your diagnosis history needs clarification before using this estimate.', next:'Check which diagnoses apply to you, or discuss your history and measurements with a clinician.', edit:'conditions'},
  treatment:{reason:'This assessment uses cholesterol measurements from people who are not taking cholesterol-lowering medicine.', next:'Discuss your results and treatment history with the clinician who manages your cholesterol.'},
  treatmentUnknown:{reason:'Your cholesterol medication history needs clarification before using this estimate.', next:'Check your medication list, or review it with a clinician.', edit:'treatment'},
  sex:{reason:'The estimate uses a sex-specific equation.', next:'Review the sex input or view your measurements on their own.', edit:'sex'},
  smoking:{reason:'The estimate needs your current smoking status.', next:'Review your smoking answer or view your measurements on their own.', edit:'smoking'},
  pressure:{reason:'A very high blood pressure reading needs attention before a long-term risk estimate.', next:heartPressureMessage, edit:'blood-pressure'},
  measurements:{reason:'A blood pressure or cholesterol value falls outside this assessment’s calculation range.', next:'Check the values and units. If they match your measurements, discuss them with a clinician.', edit:'measurements'},
};

export function heartStartIssue(inputs) {
  const age = Number(decimal(inputs.age));
  if (Number.isInteger(age) && age >= 18 && age < score2.minAge) return 'young';
  if (Number.isInteger(age) && age > score2Op.maxAge && age <= 120) return 'older';
  if (inputs.country === 'Other country') return 'region';
  return null;
}

function historyIssue(inputs) {
  if (inputs.conditions !== 'No') {
    const issues = (inputs.diagnoses || []).map(diagnosis => diagnosesByIssue[diagnosis]);
    const known = ['pregnancy', 'cvd', 'diabetes', 'kidney', 'inherited'].find(issue => issues.includes(issue));
    if (known) return known;
  }
  if (inputs.treatment === 'Yes') return 'treatment';
  return null;
}

function scopeIssue(inputs, region, history) {
  const startIssue = heartStartIssue(inputs);
  if (startIssue) return startIssue;
  if (!region) return 'region';
  if (history) return history;
  if (inputs.conditions !== 'No') return 'conditions';
  if (inputs.treatment === 'Not sure') return 'treatmentUnknown';
  if (inputs.sex === 'Prefer not to say') return 'sex';
  if (['Not sure', 'Prefer not to say'].includes(inputs.smoking)) return 'smoking';
  return null;
}

const unavailable = issue => ({issue, reason:heartLimitations[issue].reason});

export function assessHeartVascular(raw = {}, {requireHistory = false} = {}) {
  const inputs = {};
  const errors = {};
  const age = decimal(raw?.age);
  if (age === null || !Number.isInteger(Number(age)) || Number(age) < 18 || Number(age) > 120) {
    errors.age = 'Enter a whole-year age from 18 to 120.';
  } else inputs.age = Number(age);

  const startIssue = heartStartIssue({age:inputs.age, country:raw?.country});
  for (const {id, options} of heartQuestions) {
    const value = raw?.[id];
    // Earlier clients could send only age, country and measurements outside model coverage.
    if (startIssue && !requireHistory && id !== 'country' && value === undefined) continue;
    if (options.includes(value) || (id === 'smoking' && typeof value === 'string' && Object.hasOwn(heartLegacySmoking, value))) inputs[id] = value;
    else errors[id] = 'Choose an answer.';
  }

  if (heartDiagnosisActive(inputs) && (requireHistory || raw.diagnoses !== undefined)) {
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
  const history = historyIssue(inputs), issue = scopeIssue(inputs, region, history);
  const measurements = reviewHeartMeasurements(raw, inputs);
  Object.assign(inputs, measurements.inputs);
  Object.assign(errors, measurements.errors);
  const {review, highPressure, outsideCoverage, values:{systolic, total, hdl}} = measurements;
  if (!issue && !highPressure) {
    for (const {id, optional} of heartMeasurements) {
      if (!optional && !inputs[id] && !errors[id]) errors[id] = 'Enter the measured value.';
    }
  }
  if (Object.keys(errors).length) return {inputs, errors, review, result:null};
  if (highPressure) return {inputs, errors, review, result:unavailable('pressure')};
  if (issue) return {inputs, errors, review, result:{...unavailable(issue), ...(startIssue && history ? {historyIssue:history} : {})}};
  if (outsideCoverage) return {inputs, errors, review, result:unavailable('measurements')};

  const model = modelForAge(inputs.age);
  const logHazard = scoreLogHazard({age:inputs.age, sex:inputs.sex, region, smoking:Number(currentSmoking.includes(inputs.smoking)), systolic, total, hdl}, model);
  const risk = -100 * Math.expm1(-Math.exp(logHazard));
  return {inputs, errors, review, result:{method:model.name, version:model.version, risk, region, ...riskEquivalentAge(logHazard, inputs.sex, region, model)}};
}
