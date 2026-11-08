import {heartMeasurements, heartDecimal as decimal, heartPressureMessage, reviewHeartMeasurements, hba1cMmol, cholesterolMgDlPerMmol, pdayBodyFields} from './heart-measurements.mjs';
import {pday, heartPdayAge, pdayHighPressure, pdayHighGlucose, pdayVascularAgeBand} from './heart-pday.mjs';

export const HEART_ASSESSMENT = 'heart-vascular';
const SCORE2 = 'SCORE2';
const SCORE2_OP = 'SCORE2-OP';
export const SCORE2_DIABETES = 'SCORE2-Diabetes';
export const FRAMINGHAM = 'Framingham';
const coverageSources = ['score2-regions', 'score2-scope'];
export const arterialReference = {minAge:18, maxAge:80, method:'direct-80'};

export function heartSources(result, review) {
  const labs = Object.values(review?.fields || {}).some(field => field.comparison?.sourceKind === 'published') ? ['adult-intervals'] : [];
  if (review?.pressureFollowUp || review?.pressureWarning) labs.push('esc-blood-pressure');
  if (review?.fields?.glucose?.check.warning) labs.push('critical-mayo');
  if (result.method === pday.name || result.issue?.startsWith('pday-')) return ['pday-coronary', 'pday-cardia-inputs', 'pday-cardia-events', 'arterial-reference', ...labs];
  if (result.method === FRAMINGHAM || result.issue === 'framingham-data') return ['framingham-vascular-age', 'framingham-equation', 'arterial-reference', ...labs];
  if (result.issue) {
    const extras = [result.issue === 'pressure' && !labs.includes('esc-blood-pressure') && 'esc-blood-pressure', result.issue === 'young' && 'life-cvd2',
      (result.issue.startsWith('diabetes') || result.historyIssue === 'diabetes') && 'score2-diabetes',
      result.dial2 && 'dial2', (result.issue === 'young' || review?.arterialAge) && 'arterial-reference'].filter(Boolean);
    return ['score2', 'score2-op', ...coverageSources, ...extras, ...labs];
  }
  if (result.method === SCORE2_DIABETES) return ['score2', 'score2-diabetes', 'score2-diabetes-coefficients', 'hba1c-units', ...coverageSources, 'vascular-age', ...labs];
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
export const heartBpTreatmentQuestion = {id:'bpTreatment', label:'Do you take medicine for high blood pressure?', options:yesNo};
export const heartDiabetesMedicineQuestion = {id:'diabetesMedicine', label:'Do you take medicine to treat diabetes?', options:yesNo};
export const heartDiabetesTypeQuestion = {id:'diabetesType', label:'Which type of diabetes were you diagnosed with?', options:['Type 2 diabetes', 'Type 1 diabetes', 'Another type or not sure']};
export const heartDiabetesDamageQuestion = {id:'diabetesDamage', label:'Has a clinician identified complications from diabetes?',
  hint:'For example, kidney disease, protein in your urine, diabetic eye disease, or nerve damage.', options:yesNo};

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
// SCORE2-Diabetes (ehad260), Supplementary Methods Table 1. The survival
// constants in the prediction equations reproduce the publication examples.
const score2Diabetes = {...score2, name:SCORE2_DIABETES, version:'score2-diabetes-2023-regional-v1', coefficients:{
  Male:{age:0.5368, smoking:0.4774, systolic:0.1322, total:0.1102, hdl:-0.1087,
    ageSmoking:-0.0672, ageSystolic:-0.0268, ageTotal:-0.0181, ageHdl:0.0095, survival:0.9605, calibration:score2Coefficients.Male.calibration,
    diabetes:0.6457, ageDiabetes:-0.0983, diagnosisAge:-0.0998, hba1c:0.0955, egfr:-0.0591, egfrSquared:0.0058, ageHba1c:-0.0134, ageEgfr:0.0115},
  Female:{age:0.6624, smoking:0.6139, systolic:0.1421, total:0.1127, hdl:-0.1568,
    ageSmoking:-0.1122, ageSystolic:-0.0167, ageTotal:-0.0200, ageHdl:0.0186, survival:0.9776, calibration:score2Coefficients.Female.calibration,
    diabetes:0.8096, ageDiabetes:-0.1272, diagnosisAge:-0.1180, hba1c:0.1173, egfr:-0.0640, egfrSquared:0.0062, ageHba1c:-0.0196, ageEgfr:0.0169},
}};
const models = [score2, score2Op];
const modelForAge = age => models.find(model => age >= model.minAge && age <= model.maxAge);
const framingham = {name:FRAMINGHAM, version:'framingham-2008-lipids-age-v1', minAge:30, maxAge:74};
// D'Agostino et al. (2008), Table 2, general CVD model with lipids.
const framinghamCoefficients = {
  Male:{age:3.06117, total:1.12370, hdl:-0.93263, untreated:1.93303, treated:1.99881, smoking:0.65451, diabetes:0.57367},
  Female:{age:2.32888, total:1.20904, hdl:-0.70833, untreated:2.76157, treated:2.82263, smoking:0.52873, diabetes:0.69154},
};
const knownSmoking = value => currentSmoking.includes(value) || ['No', 'Used to smoke', 'Never smoked'].includes(value);

export function heartFraminghamAge(value) {
  const age = Number(decimal(value));
  return Number.isInteger(age) && age >= framingham.minAge && age < score2.minAge;
}
export const heartRoutineAge = age => heartPdayAge(age) || heartFraminghamAge(age);

function reportedDiabetes(inputs) {
  return heartDiagnosisActive(inputs) && Array.isArray(inputs.diagnoses) && inputs.diagnoses.includes('Diabetes');
}

const onlyDiabetes = inputs => reportedDiabetes(inputs) && inputs.diagnoses.every(diagnosis => diagnosis === 'Diabetes');

export function heartNeedsBpTreatment(inputs) {
  return heartRoutineAge(inputs.age) && inputs.sex !== 'Prefer not to say' && !['Not sure', 'Prefer not to say'].includes(inputs.smoking) &&
    (!inputs.conditions || inputs.conditions === 'No' || onlyDiabetes(inputs) &&
      (heartPdayAge(inputs.age) || !inputs.diabetesType || inputs.diabetesType === 'Type 2 diabetes'));
}

function routineCandidate(inputs) {
  return heartNeedsBpTreatment(inputs) && ['Female', 'Male'].includes(inputs.sex) && knownSmoking(inputs.smoking) &&
    (inputs.conditions === 'No' || onlyDiabetes(inputs));
}

export const heartNeedsPdayMedicine = inputs => heartPdayAge(inputs.age) && heartNeedsBpTreatment(inputs) && onlyDiabetes(inputs);
export const heartNeedsPdayBody = inputs => heartPdayAge(inputs.age) && heartNeedsBpTreatment(inputs) && inputs.sex !== 'Female';
const pdayMedicine = inputs => heartNeedsPdayMedicine(inputs) && inputs.diabetesMedicine === 'Yes';
export const heartUsesPdayGlucose = inputs => heartPdayAge(inputs.age) && routineCandidate(inputs)
  && (!pdayMedicine(inputs) || inputs.glucose != null);

export function heartRoutineAgeMissing(inputs) {
  if (!routineCandidate(inputs)) return [];
  if (heartPdayAge(inputs.age)) return [
    ...(!pdayHighPressure(inputs.systolic, inputs.diastolic) && !['Yes','No'].includes(inputs.bpTreatment) ? ['bpTreatment'] : []),
    ...(heartNeedsPdayMedicine(inputs) && !pdayHighGlucose(inputs.glucose) && !['Yes','No'].includes(inputs.diabetesMedicine) ? ['diabetesMedicine'] : []),
    ...(inputs.sex === 'Male' ? ['height','weight'].filter(id => !inputs[id]?.value) : []),
    ...['systolic','diastolic','total','hdl'].filter(id => !inputs[id]?.value),
    ...(!pdayMedicine(inputs) && !inputs.glucose?.value ? ['glucose'] : []),
  ];
  return [
    ...(onlyDiabetes(inputs) && !inputs.diabetesType ? ['diabetesType'] : []),
    ...(!['Yes', 'No'].includes(inputs.bpTreatment) ? ['bpTreatment'] : []),
    ...['systolic', 'total', 'hdl'].filter(id => !inputs[id]?.value),
  ];
}

// Solve for the age at which the study's reference profile has the same
// linear predictor. Baseline survival and centering cancel in the match.
export function framinghamVascularAge({age, sex, smoking, diabetes, treated, systolic, total, hdl}) {
  const coefficients = framinghamCoefficients[sex];
  const pressure = coefficients[treated ? 'treated' : 'untreated'] * Math.log(systolic) - coefficients.untreated * Math.log(125);
  const difference = pressure
    + coefficients.total * Math.log(total / (180 / cholesterolMgDlPerMmol))
    + coefficients.hdl * Math.log(hdl / (45 / cholesterolMgDlPerMmol))
    + coefficients.smoking * Number(smoking) + coefficients.diabetes * Number(diabetes);
  const referenceAge = age * Math.exp(difference / coefficients.age);
  const ageRange = referenceAge < framingham.minAge ? 'below' : referenceAge > framingham.maxAge ? 'above' : null;
  return {method:framingham.name, version:framingham.version, age:ageRange ? null : Math.round(referenceAge), ageRange};
}

function dial2Scope(inputs) {
  return Number(inputs.age) >= 30 && Number(inputs.age) <= 85 && ['low', 'moderate'].includes(regionsByCountry.get(inputs.country))
    && inputs.diagnoses?.every(diagnosis => diagnosis === 'Diabetes');
}

export function heartDiabetesCandidate(inputs) {
  return onlyDiabetes(inputs) &&
    inputs.diabetesType === 'Type 2 diabetes' && modelForAge(Number(inputs.age)) === score2 && regionsByCountry.has(inputs.country);
}

export const heartNeedsDiabetesDamage = inputs => heartDiabetesCandidate(inputs) && inputs.treatment === 'No';

export function heartNeedsDiabetesType(inputs) {
  return onlyDiabetes(inputs) &&
    (heartFraminghamAge(inputs.age) || modelForAge(Number(inputs.age)) === score2 && regionsByCountry.has(inputs.country) || dial2Scope(inputs));
}

export function heartUsesDiabetesLabs(inputs) {
  return heartDiabetesCandidate(inputs) && inputs.diabetesDamage === 'No' && inputs.treatment === 'No' &&
    ['Female', 'Male'].includes(inputs.sex) && knownSmoking(inputs.smoking);
}

export function heartModelForReport(result) {
  if (result.reason) return null;
  const {name, minAge, maxAge} = result.method === pday.name ? pday : result.method === FRAMINGHAM ? framingham
    : result.method === SCORE2_DIABETES ? score2Diabetes : result.method === SCORE2_OP ? score2Op : score2;
  return {name, minAge, maxAge};
}
export const heartSavedMethod = version => [...models, score2Diabetes, framingham, pday].find(model => model.version === version)?.name || 'Needs review';

function scoreLogHazard({age, sex, region, smoking, systolic, total, hdl, diabetes}, {center, scale, coefficients}) {
  const model = coefficients[sex];
  const ageTerm = (age - center.age) / scale.age;
  const pressureTerm = (systolic - center.systolic) / scale.systolic;
  const totalTerm = total - 6;
  const hdlTerm = (hdl - center.hdl) / scale.hdl;
  let linear = model.age * ageTerm + model.smoking * smoking + model.systolic * pressureTerm
    + model.total * totalTerm + model.hdl * hdlTerm
    + ageTerm * (model.ageSmoking * smoking + model.ageSystolic * pressureTerm
      + model.ageTotal * totalTerm + model.ageHdl * hdlTerm);
  if (diabetes) {
    const hba1c = (diabetes.hba1c - 31) / 9.34;
    const egfr = (Math.log(diabetes.egfr) - 4.5) / 0.15;
    const diagnosisAge = (diabetes.diagnosisAge - 50) / 5;
    linear += model.diabetes + model.diagnosisAge * diagnosisAge + model.hba1c * hba1c +
      model.egfr * egfr + model.egfrSquared * egfr ** 2 +
      ageTerm * (model.ageDiabetes + model.ageHba1c * hba1c + model.ageEgfr * egfr);
  }
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
  'framingham-data':{reason:'Add the remaining details to calculate your vascular age.'},
  'framingham-diabetes':{reason:'This vascular age comparison covers adults without diabetes and adults with type 2 diabetes.', next:'Ask your diabetes care team which cardiovascular assessment fits your history.', edit:'diabetes-type'},
  'pday-data':{reason:'Add the remaining details to estimate your early vascular age.'},
  'pday-body':{reason:'Height or weight is outside the calculation range.', next:'Check the measurements and units you entered.', edit:'pday-body'},
  'glucose-alert':{reason:'The fasting glucose result needs attention before an age comparison.', edit:'pday-glucose'},
  older:{reason:'The European 10-year risk estimates in this assessment cover ages 40–89.', next:reviewMeasurements, edit:'age'},
  region:{reason:'The country selected is outside the SCORE2 regions covered here.', next:'Check your country of residence or ask a clinician which risk assessment is used where you live.', edit:'country'},
  cvd:{reason:'These equations estimate the chance of a first cardiovascular event. Risk with established disease uses a separate assessment.', next:'Ask the clinician who manages your heart or blood vessel condition about a follow-up risk assessment.'},
  diabetes:{reason:'A diabetes-specific assessment can account for blood sugar control, kidney function and how long you have had diabetes.', next:'Bring your latest HbA1c and kidney function results if available. Ask which cardiovascular assessment fits your age and medical history.'},
  'diabetes-complications':{reason:'Diabetes complications can change how cardiovascular risk is assessed.', next:'Review your kidney results and any eye or nerve complications with your diabetes care team.', edit:'diabetes-damage'},
  'diabetes-data':{reason:'SCORE2-Diabetes needs a few more details to calculate your estimate.', next:'Add the missing values from your records. An exact lab value is needed for the calculation.', edit:'diabetes-labs'},
  'diabetes-range':{reason:'A diabetes measurement is outside the range this assessment uses.', next:'Check the HbA1c and eGFR values and units. If they match the report, review them with your diabetes care team.', edit:'diabetes-labs'},
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

export function heartCanCompareArterialAge(inputs) {
  return heartStartIssue(inputs) === 'young' && ['Female', 'Male'].includes(inputs.sex) &&
    (inputs.conditions === 'No' || inputs.conditions === 'Yes' && inputs.diagnoses?.length > 0 &&
      !inputs.diagnoses.some(diagnosis => ['Currently pregnant', 'Not sure which'].includes(diagnosis)));
}
export const heartOffersArterialAge = (inputs, result) => !!result && !['pressure','glucose-alert'].includes(result.issue) && heartCanCompareArterialAge(inputs);

function compareArterialAge({sex, cfpwv}) {
  // Invert the sex-specific median curves in Table 3 of the Austrian LEAD study.
  const [intercept, slope] = sex === 'Female' ? [1.705, 0.0073] : [1.769, 0.0070];
  const {minAge, maxAge} = arterialReference;
  const value = Number(cfpwv.value);
  const ageRange = value < Math.exp(intercept + slope * minAge) ? 'below'
    : value > Math.exp(intercept + slope * maxAge) ? 'above' : null;
  return {version:'lead-cfpwv-2024-v1', age:ageRange ? null : Math.round((Math.log(value) - intercept) / slope), ageRange};
}

function historyIssue(inputs) {
  if (inputs.conditions !== 'No') {
    const issues = (inputs.diagnoses || []).map(diagnosis => diagnosesByIssue[diagnosis]);
    const known = ['pregnancy', 'cvd', 'diabetes', 'kidney', 'inherited'].find(issue => issues.includes(issue));
    if (known) return known;
  }
  if (!heartRoutineAge(inputs.age) && inputs.treatment === 'Yes') return 'treatment';
  return null;
}

function scopeIssue(inputs, region, history) {
  const startIssue = heartStartIssue(inputs);
  if (heartRoutineAge(inputs.age)) {
    if (history && history !== 'diabetes') return history;
    if (inputs.conditions === 'Not sure' || inputs.diagnoses?.includes('Not sure which')) return 'conditions';
    if (inputs.sex === 'Prefer not to say') return 'sex';
    if (['Not sure', 'Prefer not to say'].includes(inputs.smoking)) return 'smoking';
    if (heartFraminghamAge(inputs.age) && onlyDiabetes(inputs) && inputs.diabetesType && inputs.diabetesType !== 'Type 2 diabetes') return 'framingham-diabetes';
    if (history === 'diabetes' && !onlyDiabetes(inputs)) return 'diabetes';
  }
  if (startIssue) return startIssue;
  if (!region) return 'region';
  if (history === 'diabetes') {
    if (!heartDiabetesCandidate(inputs)) return 'diabetes';
    if (heartNeedsDiabetesDamage(inputs) && inputs.diabetesDamage !== 'No') return 'diabetes-complications';
  } else if (history) return history;
  else if (inputs.conditions !== 'No') return 'conditions';
  if (inputs.treatment === 'Yes') return 'treatment';
  if (inputs.treatment === 'Not sure') return 'treatmentUnknown';
  if (inputs.sex === 'Prefer not to say') return 'sex';
  if (['Not sure', 'Prefer not to say'].includes(inputs.smoking)) return 'smoking';
  return null;
}

const unavailable = issue => ({issue, reason:heartLimitations[issue].reason});

function readDiabetesInputs(inputs, raw, errors, required) {
  for (const [field, active] of [[heartDiabetesTypeQuestion, heartNeedsDiabetesType], [heartDiabetesDamageQuestion, heartNeedsDiabetesDamage]]) {
    if (!active(inputs)) continue;
    if (field.options.includes(raw[field.id])) inputs[field.id] = raw[field.id];
    else if (required || raw[field.id] !== undefined) errors[field.id] = 'Choose an answer.';
  }
  if (heartUsesDiabetesLabs(inputs) && raw.diagnosisAge != null && raw.diagnosisAge !== '') {
    const value = Number(decimal(raw.diagnosisAge));
    if (!Number.isInteger(value) || value < 1 || value > inputs.age) errors.diagnosisAge = 'Enter the age at diagnosis in whole years. It must be no greater than your current age.';
    else inputs.diagnosisAge = value;
  }
}

function diabetesValues(inputs) {
  return {diagnosisAge:inputs.diagnosisAge, hba1c:hba1cMmol(inputs.hba1c), egfr:Number(inputs.egfr?.value)};
}

function assessPday(inputs, total, hdl) {
  const [height, weight] = pdayBodyFields.map(field => {
    const entry = inputs[field.id];
    return Number(entry?.value) * field.factor(entry?.unit);
  });
  return pdayVascularAgeBand(inputs.age, {
    sex:inputs.sex, bmi:weight / (height / 100) ** 2,
    nonHdl:Number(((total - hdl) * cholesterolMgDlPerMmol).toPrecision(12)),
    hdl:Number((hdl * cholesterolMgDlPerMmol).toPrecision(12)),
    smoking:currentSmoking.includes(inputs.smoking),
    pressure:inputs.bpTreatment === 'Yes' || pdayHighPressure(inputs.systolic, inputs.diastolic),
    diabetes:pdayMedicine(inputs) || pdayHighGlucose(inputs.glucose),
  });
}

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
    if (id === 'treatment' && heartRoutineAge(inputs.age)) {
      if (options.includes(value)) inputs[id] = value;
      continue;
    }
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
  readDiabetesInputs(inputs, raw, errors, requireHistory);
  if (heartBpTreatmentQuestion.options.includes(raw.bpTreatment)) inputs.bpTreatment = raw.bpTreatment;
  else if (heartNeedsBpTreatment(inputs) && raw.bpTreatment != null && raw.bpTreatment !== '') errors.bpTreatment = 'Choose an answer.';
  if (heartNeedsPdayMedicine(inputs)) {
    if (heartDiabetesMedicineQuestion.options.includes(raw.diabetesMedicine)) inputs.diabetesMedicine = raw.diabetesMedicine;
    else if (raw.diabetesMedicine != null && raw.diabetesMedicine !== '') errors.diabetesMedicine = 'Choose an answer.';
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
  const includeDiabetes = heartUsesDiabetesLabs(inputs);
  const includeArterial = heartCanCompareArterialAge(inputs);
  const includePday = heartPdayAge(inputs.age) && routineCandidate(inputs);
  const measurements = reviewHeartMeasurements(raw, inputs, {includeDiabetes, includeArterial, includePday});
  Object.assign(inputs, measurements.inputs);
  Object.assign(errors, measurements.errors);
  const {review, highPressure, outsideCoverage, values:{systolic, total, hdl}} = measurements;
  const glucoseWarning = review.fields.glucose?.check.warning;
  if (inputs.cfpwv && !highPressure && !glucoseWarning) {
    if (raw.cfpwv.method !== arterialReference.method) errors.cfpwvMethod = 'Confirm that your report uses 80% of the direct carotid–femoral distance.';
    else if (review.fields.cfpwv.check.status === 'review') errors.cfpwv = 'Enter the pulse wave velocity in m/s, from 3 to 25.';
    else {
      inputs.cfpwv.method = arterialReference.method;
      review.arterialAge = compareArterialAge(inputs);
    }
  }
  if (highPressure || glucoseWarning) {
    delete inputs.cfpwv;
    delete errors.cfpwv;
    delete review.fields.cfpwv;
  }
  if (!issue && !highPressure) {
    for (const {id, optional} of heartMeasurements) {
      if (!optional && !inputs[id] && !errors[id]) errors[id] = 'Enter the measured value.';
    }
  }
  if (Object.keys(errors).length) return {inputs, errors, review, result:null};
  if (highPressure) return {inputs, errors, review, result:unavailable('pressure')};
  if (glucoseWarning) return {inputs, errors, review, result:unavailable('glucose-alert')};
  if (routineCandidate(inputs)) {
    if (outsideCoverage) return {inputs, errors, review, result:unavailable('measurements')};
    if (includePday && pdayBodyFields.some(({id}) => review.fields[id]?.check.status === 'review')) {
      return {inputs, errors, review, result:unavailable('pday-body')};
    }
    const missing = heartRoutineAgeMissing(inputs);
    if (includePday) {
      const result = missing.length ? {...unavailable('pday-data'), missing} : assessPday(inputs, total, hdl);
      return {inputs, errors, review, result};
    }
    const result = missing.length ? {...unavailable('framingham-data'), missing}
      : framinghamVascularAge({age:inputs.age, sex:inputs.sex, smoking:currentSmoking.includes(inputs.smoking),
        diabetes:onlyDiabetes(inputs), treated:inputs.bpTreatment === 'Yes', systolic, total, hdl});
    return {inputs, errors, review, result};
  }
  if (issue) return {inputs, errors, review, result:{...unavailable(issue), ...(issue === startIssue && history ? {historyIssue:history} : {}),
    ...(inputs.diabetesType === 'Type 2 diabetes' && dial2Scope(inputs) ? {dial2:true} : {})}};
  if (outsideCoverage) return {inputs, errors, review, result:unavailable('measurements')};

  let diabetes;
  if (includeDiabetes) {
    diabetes = diabetesValues(inputs);
    const missing = Object.keys(diabetes).filter(id => !Number.isFinite(diabetes[id]));
    if (missing.length) return {inputs, errors, review, result:{...unavailable('diabetes-data'), missing}};
    // The app uses a conservative range and directs known complications or lower
    // kidney function to clinical review before applying the published equation.
    const outside = ['hba1c','egfr'].filter(id => review.fields[id].check.status === 'review');
    if (outside.length) return {inputs, errors, review, result:{...unavailable('diabetes-range'), outside}};
  }
  const model = diabetes ? score2Diabetes : modelForAge(inputs.age);
  const logHazard = scoreLogHazard({age:inputs.age, sex:inputs.sex, region, smoking:Number(currentSmoking.includes(inputs.smoking)), systolic, total, hdl, diabetes}, model);
  const risk = -100 * Math.expm1(-Math.exp(logHazard));
  return {inputs, errors, review, result:{method:model.name, version:model.version, risk, region, ...riskEquivalentAge(logHazard, inputs.sex, region, diabetes ? score2 : model)}};
}
