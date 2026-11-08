import {heartFraminghamAge, heartQuestions, HEART_UNSPECIFIED_CVD} from './heart-vascular.mjs';
import {heartDecimal} from './heart-measurements.mjs';
import {BG} from './locales/bg.mjs';

const countryOptions = heartQuestions[0].options.filter(country => country !== 'Other country');
const countryKey = value => String(value ?? '').trim().toLowerCase();
const countries = new Map(countryOptions.flatMap(country => [[countryKey(country), country], [countryKey(BG[country] || country), country]]));
countries.set('deutschland', 'Germany');
countries.set('uk', 'United Kingdom');

export function heartPrefill(answers = {}) {
  const inputs = {};
  const age = Number(heartDecimal(answers.age));
  if (Number.isInteger(age) && age >= 18 && age <= 120) inputs.age = age;
  const country = countries.get(countryKey(answers.country));
  if (country) inputs.country = country;

  const smoking = answers.smoking;
  if (['Every day', 'Some days', 'Prefer not to say'].includes(smoking)) inputs.smoking = smoking;
  else if (smoking === 'Smoke now') inputs.smoking = 'Yes';
  else if (smoking === 'Used to smoke regularly' || (smoking === 'Not at all' && (answers.smokingRegular === 'Yes' || answers.smokingEver100 === 'Yes'))) inputs.smoking = 'Used to smoke';
  else if (['Not at all', 'Never smoked regularly'].includes(smoking)) inputs.smoking = 'No';
  if (['Every day', 'Some days', 'Yes'].includes(inputs.smoking)) {
    const cigarettes = Number(heartDecimal(answers.cigarettes));
    if (cigarettes >= 0.1 && cigarettes <= 200) inputs.cigarettes = cigarettes;
    const days = Number(heartDecimal(answers.smokingDays30));
    if (inputs.smoking === 'Some days' && Number.isInteger(days) && days >= 1 && days <= 30) inputs.smokingDays30 = days;
  }

  const diagnoses = [];
  const conditions = Array.isArray(answers.conditions) ? answers.conditions : [];
  if (conditions.includes('Diabetes')) diagnoses.push('Diabetes');
  if (conditions.includes('Heart or blood-vessel disease')) diagnoses.push(HEART_UNSPECIFIED_CVD);
  if (Array.isArray(answers.context) && answers.context.includes('Pregnant')) diagnoses.push('Currently pregnant');
  if (diagnoses.length) Object.assign(inputs, {conditions:'Yes', diagnoses});
  // The lifestyle list omits some exclusions, so an empty list cannot answer the heart question.
  const medicines = Array.isArray(answers.medicines) ? answers.medicines : [];
  if (medicines.includes('Cholesterol-lowering medicine')) inputs.treatment = 'Yes';
  else if (medicines.includes('None')) inputs.treatment = 'No';
  if (heartFraminghamAge(inputs.age)) {
    if (medicines.includes('Blood-pressure medicine')) inputs.bpTreatment = 'Yes';
    else if (medicines.includes('None')) inputs.bpTreatment = 'No';
  }
  return inputs;
}
