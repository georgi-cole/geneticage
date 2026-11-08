import {compareLabReference, validateReferenceLimits} from './lab-review.mjs';
import {referenceCatalog} from './lab-reference-catalog.mjs';

export const HEART_MEASUREMENT_REVIEW = 'heart-measurement-review-v1';
const cholesterolFactor = unit => unit === 'mg/dL' ? 1 / 38.67 : 1;
const upperGuide = (high, page) => ({high, highExclusive:true, unit:'mg/dL', page});
export const heartMeasurements = [
  {id:'systolic', label:'Systolic blood pressure', units:['mmHg'], group:'pressure', coverage:[100, 180]},
  {id:'diastolic', label:'Diastolic blood pressure', units:['mmHg'], group:'pressure', optional:true},
  {id:'total', label:'Total cholesterol', units:['mmol/L', 'mg/dL'], factor:cholesterolFactor, coverage:[2.5, 8], guide:upperGuide(200, 4)},
  {id:'hdl', label:'HDL cholesterol', units:['mmol/L', 'mg/dL'], factor:cholesterolFactor, coverage:[0.5, 3], guide:{unit:'mg/dL', page:4, lowBySex:{Female:50, Male:40}}},
  {id:'apob', label:'ApoB (apolipoprotein B)', units:['g/L', 'mg/dL'], factor:unit => unit === 'mg/dL' ? 0.01 : 1, group:'specialist', optional:true, guide:upperGuide(90, 2)},
  {id:'lpa', label:'Lp(a) (lipoprotein(a))', units:['nmol/L', 'mg/dL'], group:'specialist', optional:true, guide:upperGuide(30, 7)},
];

export const heartPressureMessage = 'Check the numbers against your reading. If this is a recent, confirmed reading, seek urgent medical advice.';
const pressureWarning = {
  source:'ESC (2024) · Blood pressure assessment',
  url:'https://doi.org/10.1093/eurheartj/ehae178',
  message:heartPressureMessage,
};

export function heartDecimal(value, allowQualifier = false) {
  if (!['number', 'string'].includes(typeof value) || String(value).length > 24) return null;
  const text = String(value).trim().replace(',', '.');
  const match = /^([<>≤≥])?\s*(\d+(?:\.\d+)?|\.\d+)$/.exec(text);
  if (!match || (match[1] && !allowQualifier) || !Number.isFinite(Number(match[2]))) return null;
  return (match[1] || '') + match[2];
}

const entered = value => value != null && (typeof value !== 'string' || value.trim() !== '');

function referenceLimits(entry) {
  const limits = {};
  for (const key of ['referenceLow', 'referenceHigh']) {
    if (!entered(entry[key])) continue;
    const value = heartDecimal(entry[key]);
    if (value === null) return {error:'Reference limits must be numbers at or above zero.'};
    const exclusive = entry[key+'Exclusive'];
    if (exclusive !== undefined && typeof exclusive !== 'boolean') return {error:'Check the laboratory reference limit rules.'};
    limits[key] = value;
    if (exclusive) limits[key+'Exclusive'] = true;
  }
  return {limits, error:validateReferenceLimits(limits)};
}

function compareHeartLipid(field, entry, context) {
  const unknown = reason => ({status:'unknown', unit:entry.unit, reason});
  if (!Number.isFinite(Number(entry.value))) return unknown('This result is reported as a limit. Use the interpretation printed on your lab report.');
  if (Number(entry.value) === 0) return unknown('Check how this value is reported by your laboratory.');
  if (entry.referenceLow !== undefined || entry.referenceHigh !== undefined) {
    return {...compareLabReference(entry), unit:entry.unit, lowExclusive:entry.referenceLowExclusive, highExclusive:entry.referenceHighExclusive};
  }
  const {guide, factor} = field;
  if (!factor && entry.unit !== guide.unit) return unknown('Add the laboratory interval in the same Lp(a) unit as your result.');
  const healthKnown = context.conditions === 'No' || (context.conditions === 'Yes' && context.diagnoses?.length
    && !context.diagnoses.some(value => ['Currently pregnant', 'Not sure which'].includes(value)));
  if (Number(context.age) < 18 || !Number.isFinite(Number(context.age)) || !healthKnown) return unknown('Use the laboratory interval for your situation.');
  const low = guide.lowBySex?.[context.sex];
  if (guide.lowBySex && low === undefined) return unknown('Add the interval from your lab report or review your sex input.');
  const value = Number(entry.value);
  const converted = entry.unit === guide.unit ? value : value * factor(entry.unit) / factor(guide.unit);
  const comparison = compareLabReference({value:Number(converted.toPrecision(12)), referenceLow:low, referenceHigh:guide.high, referenceHighExclusive:guide.highExclusive});
  return {...comparison, label:comparison.label.replace('your lab interval', 'published guide'), unit:guide.unit,
    highExclusive:guide.highExclusive, sourceKind:'published', sourceLabel:referenceCatalog.label, sourceUrl:referenceCatalog.url+'#page='+guide.page};
}

const mmol = entry => entry ? Number(entry.value) / (entry.unit === 'mg/dL' ? 38.67 : 1) : null;

export function reviewHeartMeasurements(raw = {}, context = raw) {
  const inputs = {}, errors = {}, fields = {};
  for (const field of heartMeasurements) {
    const {id, units, group} = field;
    const entry = raw?.[id];
    if (entry == null || typeof entry === 'object' && !entered(entry.value)) continue;
    const value = heartDecimal(entry.value, group === 'specialist');
    if (value === null || group !== 'specialist' && Number(value) <= 0 || !units.includes(entry.unit)) {
      errors[id] = 'Check the measured value and unit.';
      continue;
    }
    inputs[id] = {value, unit:entry.unit};
    if (group !== 'pressure') {
      const {limits, error} = referenceLimits(entry);
      if (error) errors[id+'Reference'] = error;
      else Object.assign(inputs[id], limits);
    }
  }
  const total = mmol(inputs.total), hdl = mmol(inputs.hdl);
  const systolic = Number(inputs.systolic?.value), diastolic = Number(inputs.diastolic?.value);
  const highPressureFields = [systolic >= 180 && 'systolic', diastolic >= 110 && 'diastolic'].filter(Boolean);
  const highPressure = highPressureFields.length > 0;
  if (total !== null && hdl !== null && hdl >= total) errors.hdl = 'HDL cholesterol must be lower than total cholesterol. Check both values and units.';
  if (inputs.diastolic && !inputs.systolic && !errors.systolic) errors.systolic = 'Enter the top number for this blood pressure reading.';
  if (diastolic >= systolic) errors.diastolic = 'The bottom number must be lower than the top number.';

  let outsideCoverage = false;
  for (const field of heartMeasurements) {
    const {id, group, coverage} = field;
    const entry = inputs[id], error = errors[id], referenceError = errors[id+'Reference'];
    if (!entry && !error) continue;
    const value = id === 'total' ? total : id === 'hdl' ? hdl : Number(entry?.value);
    const outside = coverage && !highPressureFields.includes(id) && (value < coverage[0] || value > coverage[1]);
    const status = error ? 'invalid' : outside ? 'review' : 'ok';
    outsideCoverage ||= status === 'review';
    const comparison = error || referenceError || group === 'pressure' ? null : compareHeartLipid(field, entry, context);
    fields[id] = {check:{status, ...(error ? {message:error} : {})}, comparison, direction:comparison?.status || 'unknown', referenceError};
  }
  return {inputs, errors, review:{version:HEART_MEASUREMENT_REVIEW, fields,
      ...(highPressure ? {pressureWarning:{...pressureWarning, fields:highPressureFields}} : {})},
    values:{systolic,total,hdl}, highPressure, outsideCoverage};
}
