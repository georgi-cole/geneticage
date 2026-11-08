export const HEART_ASSESSMENT = 'heart-vascular';
export const HEART_MODEL = 'score2-2021-regional-v1';
export const HEART_SOURCES = ['score2', 'score2-coefficients', 'score2-regions', 'score2-scope', 'vascular-age'];

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
export const heartQuestions = [
  {id:'country', label:'Country of residence', options:[...countries, 'Other country'], hint:'SCORE2 selects the regional calibration using the country where you live.'},
  {id:'sex', label:'Sex used for SCORE2', options:['Female', 'Male', 'Prefer not to say'], hint:'SCORE2 uses separate equations for female and male participants.'},
  {id:'smoking', label:'Do you currently smoke cigarettes?', options:yesNo, hint:'Choose Yes if you smoke every day or on some days.'},
  {id:'conditions', label:'Do any of these diagnoses apply to you?', options:yesNo, hint:'Heart or blood vessel disease (including a previous heart attack or stroke), diabetes, chronic kidney disease, or an inherited or rare cholesterol or blood pressure disorder.'},
  {id:'treatment', label:'Are you taking cholesterol-lowering medicine?', options:yesNo},
];

export const heartMeasurements = [
  {id:'systolic', label:'Systolic blood pressure', units:['mmHg'], hint:'Use the top number from a recent resting measurement.'},
  {id:'total', label:'Total cholesterol', units:['mmol/L', 'mg/dL']},
  {id:'hdl', label:'HDL cholesterol', units:['mmol/L', 'mg/dL']},
  {id:'apob', label:'ApoB (apolipoprotein B)', units:['g/L', 'mg/dL'], optional:true},
  {id:'lpa', label:'Lp(a) (lipoprotein(a))', units:['nmol/L', 'mg/dL'], optional:true},
];

// SCORE2 authors' four-decimal coefficients (ehab761, Table 1).
const coefficients = {
  Male:{age:0.3742, smoking:0.6012, systolic:0.2777, total:0.1458, hdl:-0.2698,
    ageSmoking:-0.0755, ageSystolic:-0.0255, ageTotal:-0.0281, ageHdl:0.0426,
    survival:0.9605, calibration:{low:[-0.5699, 0.7476], moderate:[-0.1565, 0.8009], high:[0.3207, 0.9360], veryHigh:[0.5836, 0.8294]}},
  Female:{age:0.4648, smoking:0.7744, systolic:0.3131, total:0.1002, hdl:-0.2606,
    ageSmoking:-0.1088, ageSystolic:-0.0277, ageTotal:-0.0226, ageHdl:0.0613,
    survival:0.9776, calibration:{low:[-0.7380, 0.7019], moderate:[-0.3143, 0.7701], high:[0.5710, 0.9369], veryHigh:[0.9412, 0.8329]}},
};

function score2LogHazard({age, sex, region, smoking, systolic, total, hdl}) {
  const model = coefficients[sex];
  const ageTerm = (age - 60) / 5;
  const pressureTerm = (systolic - 120) / 20;
  const totalTerm = total - 6;
  const hdlTerm = (hdl - 1.3) / 0.5;
  const linear = model.age * ageTerm + model.smoking * smoking + model.systolic * pressureTerm
    + model.total * totalTerm + model.hdl * hdlTerm
    + ageTerm * (model.ageSmoking * smoking + model.ageSystolic * pressureTerm
      + model.ageTotal * totalTerm + model.ageHdl * hdlTerm);
  const [scale1, scale2] = model.calibration[region];
  return scale1 + scale2 * (Math.log(-Math.log(model.survival)) + linear);
}

function riskEquivalentAge(logHazard, sex, region) {
  // Continuous SCORE2 implementation of the reference-profile comparison.
  // Cuende and Guijarro use non-smoking, SBP 110 and non-HDL 3.45 mmol/L.
  const reference = {sex, region, smoking:0, systolic:110, total:4.75, hdl:1.3};
  const first = score2LogHazard({...reference, age:40});
  const last = score2LogHazard({...reference, age:69});
  if (logHazard < first) return {age:null, ageRange:'below'};
  if (logHazard > last) return {age:null, ageRange:'above'};
  // With the reference factors fixed, log cumulative hazard is linear in age.
  return {age:Math.round(40 + 29 * (logHazard - first) / (last - first)), ageRange:null};
}

function decimal(value, allowQualifier = false) {
  if (!['number', 'string'].includes(typeof value) || String(value).length > 24) return null;
  const text = String(value).trim().replace(',', '.');
  const match = /^([<>≤≥])?\s*(\d+(?:\.\d+)?|\.\d+)$/.exec(text);
  if (!match || (match[1] && !allowQualifier) || !Number.isFinite(Number(match[2]))) return null;
  return (match[1] || '') + match[2];
}

function scopeReason(inputs, region) {
  if (!region) return 'The country selected is outside the SCORE2 regions covered here.';
  if (inputs.age < 40 || inputs.age > 69) return 'This assessment estimates SCORE2 risk for ages 40–69.';
  if (inputs.conditions !== 'No') return 'The health history entered here needs a different approach to cardiovascular risk assessment.';
  if (inputs.treatment !== 'No') return 'This assessment uses cholesterol measurements from people who are not taking cholesterol-lowering medicine.';
  if (inputs.sex === 'Prefer not to say' || inputs.smoking === 'Not sure') return 'SCORE2 needs a supported sex input and a known current smoking status.';
  return null;
}

const mmol = entry => Number(entry.value) / (entry.unit === 'mg/dL' ? 38.67 : 1);

export function assessHeartVascular(raw = {}) {
  const inputs = {};
  const errors = {};
  const age = decimal(raw?.age);
  if (age === null || !Number.isInteger(Number(age)) || Number(age) < 18 || Number(age) > 120) {
    errors.age = 'Enter a whole-year age from 18 to 120.';
  } else inputs.age = Number(age);

  for (const {id, options} of heartQuestions) {
    if (options.includes(raw?.[id])) inputs[id] = raw[id];
    else errors[id] = 'Choose an answer.';
  }

  const region = regionsByCountry.get(inputs.country);
  const reason = scopeReason(inputs, region);
  for (const {id, units, optional} of heartMeasurements) {
    const entry = raw?.[id];
    if (entry == null || (typeof entry === 'object' && String(entry.value ?? '').trim() === '')) {
      if (!optional && !reason) errors[id] = 'Enter the measured value.';
      continue;
    }
    const value = decimal(entry.value, optional);
    if (value === null || (!optional && Number(value) <= 0) || !units.includes(entry.unit)) {
      errors[id] = 'Check the measured value and unit.';
    } else inputs[id] = {value, unit:entry.unit};
  }

  const total = inputs.total ? mmol(inputs.total) : null;
  const hdl = inputs.hdl ? mmol(inputs.hdl) : null;
  if (total !== null && hdl !== null && hdl >= total) errors.hdl = 'HDL cholesterol must be lower than total cholesterol. Check both values and units.';
  if (Object.keys(errors).length) return {inputs, errors, result:null};
  if (reason) return {inputs, errors, result:{reason}};

  const systolic = Number(inputs.systolic.value);
  if (systolic < 100 || systolic >= 180 || total < 2.5 || total > 8 || hdl < 0.5 || hdl > 3) {
    return {inputs, errors, result:{reason:'A blood pressure or cholesterol value falls outside this assessment’s calculation range. Check the entries and discuss the measurements with a clinician.'}};
  }

  const logHazard = score2LogHazard({age:inputs.age, sex:inputs.sex, region, smoking:Number(inputs.smoking === 'Yes'), systolic, total, hdl});
  const risk = -100 * Math.expm1(-Math.exp(logHazard));
  return {inputs, errors, result:{risk, region, ...riskEquivalentAge(logHazard, inputs.sex, region)}};
}
