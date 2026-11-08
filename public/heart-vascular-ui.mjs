import {heartQuestions, heartRegionLabels, heartDiagnosisQuestion, heartDiagnosisActive, heartSmokingFields, heartLegacySmoking, heartStartIssue, heartLimitations, heartModelForReport, heartSources, HEART_UNSPECIFIED_CVD, SCORE2_DIABETES, heartDiabetesTypeQuestion, heartDiabetesDamageQuestion, heartNeedsDiabetesType, heartNeedsDiabetesDamage, heartUsesDiabetesLabs, heartCanCompareArterialAge, arterialReference, FRAMINGHAM, heartFraminghamAge, heartNeedsBpTreatment, heartBpTreatmentQuestion, heartFraminghamMissing} from './heart-vascular.mjs';
import {arterialMeasurement, heartDecimal, heartMeasurements, reviewHeartMeasurements} from './heart-measurements.mjs';
import {setMeasurementUnit} from './lab-review.mjs';
import {measurementFeedbackMarkup, safetyMarkup} from './lab-feedback.mjs';
import {escapeHTML as esc, reportArtwork, screenHeading, uiIcon} from './ui-components.mjs';

const arrow = uiIcon('forward');
const [country, sex, smoking, conditions, treatment] = heartQuestions;
const age = {id:'age', label:'How old are you?'};
const aboutYou = [country, age, sex].map(field => ({id:field.id, phase:0, fields:[field]}));
const routine = heartMeasurements.filter(field => !field.group);
const specialist = heartMeasurements.filter(field => field.group === 'specialist');
const diabetesLabs = heartMeasurements.filter(field => field.group === 'diabetes');
const diagnosisAge = {id:'diagnosisAge', label:'Age at diabetes diagnosis'};
const diabetesFields = [diagnosisAge, ...diabetesLabs];
const pressures = heartMeasurements.filter(field => field.group === 'pressure');
const [topPressure, bottomPressure] = pressures;
const framinghamFields = [
  {id:'diabetesType', label:'Type of diabetes', step:'diabetes-type'},
  {id:'bpTreatment', label:'Blood pressure medicine', step:'bp-treatment'},
  {...topPressure, step:'blood-pressure'},
  ...routine.map(field => ({...field, step:'measurements'})),
];
const measurementSteps = [
  {id:'blood-pressure', phase:2, fields:pressures},
  {id:'measurements', phase:2, fields:[...routine, ...specialist]},
];

export function heartFraminghamStep(missing) {
  return framinghamFields.find(field => missing.includes(field.id))?.step;
}

function offerDiabetesLabs(inputs) {
  if (!heartUsesDiabetesLabs(inputs)) return false;
  const {highPressure, outsideCoverage} = reviewHeartMeasurements(inputs);
  return !highPressure && !outsideCoverage;
}

export function heartSteps(inputs) {
  const history = [
    {id:'smoking', fields:[smoking]},
    {id:'smoking-history', fields:heartSmokingFields(inputs)},
    {id:'conditions', fields:[conditions]},
    {id:'diagnoses', fields:heartDiagnosisActive(inputs) ? [heartDiagnosisQuestion] : []},
    {id:'diabetes-type', fields:heartNeedsDiabetesType(inputs) ? [heartDiabetesTypeQuestion] : []},
    {id:'treatment', fields:heartFraminghamAge(inputs.age) ? [] : [treatment]},
    {id:'bp-treatment', fields:heartNeedsBpTreatment(inputs) ? [heartBpTreatmentQuestion] : []},
    {id:'diabetes-damage', fields:heartNeedsDiabetesDamage(inputs) ? [heartDiabetesDamageQuestion] : []},
  ].filter(step => step.fields.length).map(step => ({...step, phase:1}));
  const steps = [...aboutYou, ...history, ...measurementSteps];
  if (offerDiabetesLabs(inputs)) steps.push({id:'diabetes-labs', phase:2, fields:diabetesFields});
  return steps;
}

const hasAnswer = value => Array.isArray(value) ? value.length > 0 : value != null && value !== '';
export function heartRoute(inputs, prefilled = []) {
  const steps = heartSteps(inputs);
  if (!prefilled.length) return steps;
  const reused = field => prefilled.includes(field.id) && hasAnswer(inputs[field.id]);
  if (!steps.some(step => step.fields.some(reused))) return steps;
  const remaining = steps.filter(step => step.phase === 2 || !step.fields.every(reused)
    || step.id === 'diagnoses' && inputs.diagnoses.includes(HEART_UNSPECIFIED_CVD));
  const fields = steps.filter(step => !remaining.includes(step)).flatMap(step => step.fields);
  return [{id:'review', phase:0, fields}, ...remaining];
}

export function readHeartForm(form, previous, step) {
  if (step === 'review') return previous;
  const inputs = {...previous};
  const valueOf = name => form.elements.namedItem(name).value;
  for (const {id, units, multiple, guide} of heartSteps(previous).find(item => item.id === step).fields) {
    if (multiple) {
      inputs[id] = [...form.querySelectorAll(`input[name="${id}"]:checked`)].map(input => input.value);
      continue;
    }
    const value = valueOf(id);
    if (units) {
      const unit = units.length === 1 ? units[0] : valueOf(`${id}Unit`);
      const entry = {value, unit};
      if (guide) {
        for (const key of ['referenceLow', 'referenceHigh']) {
          const limit = valueOf(id+key), exclusive = valueOf(id+key+'Exclusive') === 'exclusive';
          if (limit || exclusive) entry[key] = limit;
          if (exclusive) entry[key+'Exclusive'] = true;
        }
      }
      if (value || inputs[id] || unit !== units[0] || Object.keys(entry).length > 2) inputs[id] = entry;
    } else if (String(inputs[id] ?? '') !== value) inputs[id] = value;
  }
  return inputs;
}

const answerText = (id, value) => id === 'smoking' ? heartLegacySmoking[value] || value : value;

function prefillReview(inputs, errors, prefilled) {
  const groups = heartSteps(inputs).filter(step => step.fields.some(field => prefilled.includes(field.id) && hasAnswer(inputs[field.id])));
  const labels = {country:'Country of residence', age:'Age in years', smoking:'Cigarette smoking', 'smoking-history':'Smoking history',
    conditions:'Health history', diagnoses:'Reported health history', treatment:'Cholesterol-lowering medicine', 'bp-treatment':'Blood pressure medicine'};
  return `<fieldset class="question heart-prompt heart-prefill" data-theme-part>
    <legend>Review your answers</legend>
    <p class="hint">We started with your Health & lifestyle answers. Update anything that has changed.</p>
    <div class="heart-prefill-list">${groups.map(step => {
      const fields = step.fields.filter(field => prefilled.includes(field.id) && hasAnswer(inputs[field.id]));
      const value = step.id === 'diagnoses' ? inputs.diagnoses.map(item => `<span>${esc(item)}</span>`).join(' · ')
        : step.id === 'smoking-history' ? fields.map(field => `<span>${esc(smokingLabel(field, inputs))}</span> <strong>${esc(inputs[field.id])}</strong>`).join('<br>')
        : esc(answerText(step.id, inputs[step.id]));
      return `<div class="heart-prefill-row"><div><span id="heart-review-${step.id}" class="small muted">${esc(labels[step.id])}</span><div>${value}</div>
        ${fields.map(field => fieldError(field.id, errors)).join('')}</div>
        <button type="button" class="text-btn" data-action="heart-review-edit" data-part="${step.id}" aria-labelledby="heart-review-edit-${step.id} heart-review-${step.id}"><span id="heart-review-edit-${step.id}">Edit</span></button>
      </div>`;
    }).join('')}</div>
  </fieldset>`;
}

function pulseMark() {
  return '<svg class="heart-pulse-mark" viewBox="0 0 112 36" fill="none" aria-hidden="true" focusable="false"><path class="pulse-guide" d="M1 18h110M81 4v28"/><path class="pulse-trace" d="M5 18h22l5-6 6 11 8-19 8 28 8-14h39"/><circle cx="5" cy="18" r="2.5"/><circle cx="101" cy="18" r="2.5"/></svg>';
}

const fieldError = (id, errors) => errors[id] ? `<p class="error" id="heart-${id}-error" role="alert">${esc(errors[id])}</p>` : '';
const invalid = (id, errors) => errors[id] ? ` aria-invalid="true" aria-describedby="heart-${id}-error"` : '';

function promptField({id, label, hint, options, multiple}, inputs, errors) {
  const title = id === 'country' ? 'Where do you live?' : label;
  const entry = inputs[id];
  let control;
  if (id === 'country') {
    control = `<select id="heart-country" name="country" aria-label="${esc(label)}"${invalid(id, errors)}>
      <option value="">Choose a country</option>${options.map(option => `<option value="${esc(option)}"${option === entry ? ' selected' : ''}>${esc(option)}</option>`).join('')}
    </select>`;
  } else if (id === 'age') {
    control = `<input id="heart-age" name="age" aria-label="Age in years" type="number" min="18" max="120" step="1" inputmode="numeric" placeholder="Years" value="${esc(entry)}"${invalid(id, errors)}>`;
  } else {
    let choices = options;
    if (id === 'smoking' && Object.hasOwn(heartLegacySmoking, entry)) choices = [...options, entry];
    if (id === 'diagnoses' && !entry?.includes(HEART_UNSPECIFIED_CVD)) choices = options.filter(option => option !== HEART_UNSPECIFIED_CVD);
    control = `<div class="options heart-choices${multiple ? ' heart-diagnoses' : ''}">${choices.map(option => {
      const checked = multiple ? entry?.includes(option) : entry === option;
      const text = id === 'smoking' && Object.hasOwn(heartLegacySmoking, option) ? heartLegacySmoking[option] : option;
      const compact = multiple && ['Diabetes','Chronic kidney disease','Currently pregnant','Not sure which'].includes(option);
      return `<label class="option${compact ? ' heart-compact-choice' : ''}"><input type="${multiple ? 'checkbox' : 'radio'}" name="${id}" value="${esc(option)}"${checked ? ' checked' : ''}${invalid(id, errors)}><span>${esc(text)}</span><i class="choice-mark" aria-hidden="true"></i></label>`;
    }).join('')}</div>`;
  }
  return `<fieldset class="question heart-prompt" data-theme-part${hint ? ` aria-describedby="heart-${id}-hint"` : ''}>
    <legend>${esc(title)}</legend>
    ${hint ? `<p class="hint" id="heart-${id}-hint">${esc(hint)}</p>` : ''}
    ${control}
    ${fieldError(id, errors)}
  </fieldset>`;
}

const smokingLabel = (field, inputs) => inputs.smoking === 'Used to smoke' && field.formerLabel ? field.formerLabel : field.label;

function smokingHistory(fields, inputs, errors) {
  return `<fieldset class="question heart-prompt" data-theme-part>
    <legend>Smoking history</legend>
    <p class="hint">Add any details you know. These details appear in your report.</p>
    <div class="heart-measurement-list">${fields.map(field => `<div class="heart-measurement">
      <label for="heart-${field.id}">${esc(smokingLabel(field, inputs))}</label>
      <div class="input-row"><input id="heart-${field.id}" name="${field.id}" type="text" inputmode="${field.integer ? 'numeric' : 'decimal'}" maxlength="8" placeholder="Optional" value="${esc(inputs[field.id])}"${invalid(field.id, errors)}></div>
      ${fieldError(field.id, errors)}
    </div>`).join('')}</div>
  </fieldset>`;
}

function heartFeedback(field, entry, info, showSource = false) {
  return info ? measurementFeedbackMarkup(field, entry || {}, info, {
    showSource, reviewTitle:'Outside calculation range',
    reviewText:field.group === 'pressure' ? 'Check the numbers against your reading.' : undefined,
  }) : '';
}

function referenceEditor({id}, entry, errors) {
  const errorKey = id+'Reference';
  return `<details class="reference-editor"${errors[errorKey] ? ' open' : ''}>
    <summary>Laboratory reference interval <span>Optional</span></summary>
    <p class="hint">Use the limits printed on your lab report, in the selected unit. Leave a limit blank if the report gives only one.</p>
    <div class="reference-bounds">${[['Low','Lower limit','≥','>'], ['High','Upper limit','≤','<']].map(([side, caption, inclusive, exclusive]) => {
      const key = 'reference'+side, name = id+key;
      return `<label><span>${caption}</span><span class="reference-bound-input">
        <select name="${name}Exclusive" data-heart-reference="${id}" aria-label="${side === 'Low' ? 'Lower limit rule' : 'Upper limit rule'}"><option value="inclusive">${inclusive}</option><option value="exclusive"${entry?.[key+'Exclusive'] ? ' selected' : ''}>${exclusive}</option></select>
        <input type="text" name="${name}" data-heart-reference="${id}" maxlength="24" inputmode="decimal" value="${esc(entry?.[key])}" aria-label="${caption}" placeholder="Optional"${invalid(errorKey, errors)}>
      </span></label>`;
    }).join('')}</div>${fieldError(errorKey, errors)}
  </details>`;
}

function measurementField(field, inputs, errors, review, touched, placeholder = 'Value') {
  const {id, label, units} = field;
  const entry = inputs[id];
  const info = touched[id] === false || errors[id] || errors[id+'Reference'] ? null : review.fields[id];
  return `<div class="heart-measurement lab-measurement" role="group" aria-labelledby="heart-${id}-label" data-heart-measurement="${id}" data-reference-status="${info?.direction || 'untouched'}" data-entry-check="${errors[id] ? 'invalid' : info?.check.status || 'untouched'}">
    <label id="heart-${id}-label" for="heart-${id}">${esc(label)}</label>
    <div class="input-row">
      <input id="heart-${id}" name="${id}" data-heart-value="${id}" type="text" inputmode="decimal" maxlength="24" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(entry?.value)}"${invalid(id, errors) || ` aria-describedby="heart-${id}-feedback"`}>
      ${units.length === 1 ? `<span class="unit">${units[0]}</span>` : `<select name="${id}Unit" data-heart-unit="${id}" aria-label="${esc(label)} unit">${units.map(unit => `<option value="${unit}"${entry?.unit === unit ? ' selected' : ''}>${unit}</option>`).join('')}</select>`}
    </div>
    ${fieldError(id, errors)}
    <div class="lab-feedback" id="heart-${id}-feedback" role="status" aria-live="polite">${heartFeedback(field, entry, info)}</div>
    ${field.guide ? referenceEditor(field, entry, errors) : ''}
  </div>`;
}

export function renderHeartArterialForm(inputs, errors = {}, editing = !!inputs.cfpwv) {
  const {review} = reviewHeartMeasurements(inputs, inputs, {includeArterial:true});
  return `<form id="heart-arterial-form" novalidate>
    <p>Use a clinic measurement of pulse wave velocity from the neck to the groin. The report may call it cfPWV.</p>
    ${measurementField(arterialMeasurement, inputs, errors, review, {}, '8.3')}
    <label class="checkline"><input name="cfpwvMethod" type="checkbox" value="${arterialReference.method}"${inputs.cfpwv?.method === arterialReference.method ? ' checked' : ''}${invalid('cfpwvMethod', errors)}>
      <span>My report confirms 80% of the direct carotid–femoral distance.</span></label>
    ${fieldError('cfpwvMethod', errors)}
    ${fieldError('arterial', errors)}
    <div class="actions">
      <button class="btn" type="submit">Compare arterial stiffness ${arrow}</button>
      ${editing ? '<button class="text-btn" type="submit" value="remove">Remove result</button>' : ''}
    </div>
  </form>`;
}

export function readHeartArterialForm(form) {
  const {cfpwv, cfpwvMethod} = form.elements;
  return {value:cfpwv.value, unit:'m/s', method:cfpwvMethod.checked ? cfpwvMethod.value : ''};
}

function pressureFeedback(review, touched = {}) {
  if (!review?.pressureWarning?.fields.some(id => touched[id] !== false)) return '';
  return safetyMarkup({status:'ok', warning:review.pressureWarning});
}

function measurementStep(step, inputs, errors, showOptional, touched) {
  const {review} = reviewHeartMeasurements(inputs, inputs, {includeDiabetes:heartUsesDiabetesLabs(inputs)});
  const field = (definition, placeholder) => measurementField(definition, inputs, errors, review, touched, placeholder);
  if (step === 'diabetes-labs') return `<div class="lab-fields heart-measurements">
    <fieldset class="question" data-theme-part>
      <legend>Complete your diabetes measurements</legend>
      <p class="hint">SCORE2-Diabetes uses your age at diagnosis and these two lab results. You can review your other readings while you look for them.</p>
      <div class="heart-measurement-list">
        <div class="heart-measurement"><label for="heart-diagnosisAge">Age at diabetes diagnosis</label>
          <input id="heart-diagnosisAge" name="diagnosisAge" type="number" inputmode="numeric" min="1" step="1" value="${esc(inputs.diagnosisAge)}"${invalid('diagnosisAge', errors)}>
          ${fieldError('diagnosisAge', errors)}</div>
        ${diabetesLabs.map(definition => field(definition)).join('')}
      </div>
    </fieldset>
  </div>`;
  if (step === 'blood-pressure') {
    const issue = heartStartIssue(inputs);
    return `<div class="lab-fields heart-measurements">
      ${heartNeedsBpTreatment(inputs) ? '<aside class="heart-scope-note"><p>Blood pressure and a routine cholesterol panel can give you a vascular age comparison.</p></aside>'
        : issue ? `<aside class="heart-scope-note"><p>${heartFraminghamAge(inputs.age) ? '' : `<span>${esc(heartLimitations[issue].reason)}</span> `}<span>Your readings will appear in a prevention review.</span></p></aside>` : ''}
      <fieldset class="question heart-pressure" data-theme-part aria-describedby="heart-bp-hint">
        <legend>Blood pressure</legend>
        <p id="heart-bp-hint" class="hint">For 150/90, enter 150 in the first box and 90 in the second. The estimate uses the top number.</p>
        <div class="heart-pressure-inputs">
          ${field({...topPressure, label:'Top number (systolic)'}, '150')}
          ${field({...bottomPressure, label:'Bottom number (optional)'}, '90')}
        </div>
        <div class="lab-feedback" data-heart-pressure-feedback role="status" aria-live="polite">${pressureFeedback(review, touched)}</div>
      </fieldset>
    </div>`;
  }
  const open = showOptional || specialist.some(({id}) => errors[id] || errors[id+'Reference'] || inputs[id]?.value);
  return `<div class="lab-fields heart-measurements">
    <fieldset class="question" data-theme-part>
      <legend>Cholesterol</legend>
      <p class="hint">Use total and HDL cholesterol from the same lipid panel.</p>
      <div class="heart-measurement-list">${routine.map(definition => field(definition)).join('')}</div>
    </fieldset>
    <details class="reference-settings heart-specialist"${open ? ' open' : ''}>
      <summary><span>Add ApoB or Lp(a)</span><span>Optional</span></summary>
      <div class="reference-settings-content">
        <p class="hint">These results add context to your report. The estimate uses the routine measurements above.</p>
        <div class="heart-measurement-list">${specialist.map(definition => field(definition)).join('')}</div>
      </div>
    </details>
  </div>`;
}

export function refreshHeartFeedback(form, inputs, touched) {
  const {review} = reviewHeartMeasurements(inputs, inputs, {includeDiabetes:heartUsesDiabetesLabs(inputs), includeArterial:form.id === 'heart-arterial-form'});
  for (const container of form.querySelectorAll('[data-heart-measurement]')) {
    const id = container.dataset.heartMeasurement;
    const field = heartMeasurements.find(item => item.id === id);
    const info = touched[id] === false ? null : review.fields[id];
    const control = container.querySelector('[data-heart-value]');
    const feedback = container.querySelector('.lab-feedback');
    const error = container.querySelector(`#heart-${id}-error`);
    const markup = error || container.querySelector(`#heart-${id}Reference-error`) ? '' : heartFeedback(field, inputs[id], info);
    container.dataset.referenceStatus = info?.direction || 'untouched';
    container.dataset.entryCheck = info?.check.status || 'untouched';
    control.setAttribute('aria-invalid', String(info?.check.status === 'invalid' || !!error));
    control.setAttribute('aria-describedby', error ? `${error.id} ${feedback.id}` : feedback.id);
    if (feedback.innerHTML !== markup) feedback.innerHTML = markup;
  }
  const pressure = form.querySelector('[data-heart-pressure-feedback]');
  if (pressure) {
    const markup = pressureFeedback(review, touched);
    if (pressure.innerHTML !== markup) pressure.innerHTML = markup;
  }
}

function arterialSummary({inputs, result, review}, secondary) {
  if (result.issue === 'pressure' || !heartCanCompareArterialAge(inputs)) return '';
  const comparison = review?.arterialAge;
  if (secondary) return `<details class="report-answer-group"${comparison ? ' open' : ''}>
    <summary>Optional pulse-wave comparison</summary>
    ${comparison ? arterialAgeReading(comparison) : `<p>A clinic pulse-wave measurement can give you a separate arterial stiffness age.</p>
      <button class="text-btn no-print" data-action="heart-arterial">Add pulse-wave result ${arrow}</button>`}
  </details>`;
  if (!comparison) return `<section class="report-explanation heart-arterial">
    <h2>Compare your arterial stiffness</h2>
    <p><span>If you have a pulse-wave result, you can use it for a separate age comparison.</span></p>
    <button class="btn no-print" data-action="heart-arterial">Add pulse-wave result ${arrow}</button>
  </section>`;
  return arterialAgeReading(comparison);
}

function arterialAgeReading(comparison) {
  const {minAge, maxAge} = arterialReference;
  const age = comparison.ageRange === 'above' ? `<span>Above</span> ${maxAge}`
    : comparison.ageRange === 'below' ? `<span>Below</span> ${minAge}` : esc(comparison.age);
  return `<section class="report-estimate result-surface heart-arterial" data-theme-part>
    <span class="eyebrow">ARTERIAL STIFFNESS AGE</span>
    <div class="report-age-line"><strong>${age}</strong>${comparison.ageRange ? '' : '<span>years</span>'}</div>
    <p>Your clinic pulse-wave measurement is compared with adult reference values for arterial stiffness.</p>
    <button class="text-btn no-print" data-action="heart-arterial">Edit pulse-wave result ${arrow}</button>
  </section>`;
}

export function changeHeartUnit(control, entry = {}) {
  const field = heartMeasurements.find(item => item.id === control.dataset.heartUnit);
  if ((!entry.referenceLow && !entry.referenceHigh) || entry.unit === control.value) return;
  const limits = {...entry, referenceLow:heartDecimal(entry.referenceLow) ?? entry.referenceLow, referenceHigh:heartDecimal(entry.referenceHigh) ?? entry.referenceHigh};
  const updated = setMeasurementUnit(field, limits, control.value);
  const editor = control.closest('[data-heart-measurement]').querySelector('.reference-editor');
  for (const key of ['referenceLow', 'referenceHigh']) {
    control.form.elements.namedItem(field.id+key).value = updated[key] ?? '';
    control.form.elements.namedItem(field.id+key+'Exclusive').value = updated[key+'Exclusive'] ? 'exclusive' : 'inclusive';
  }
  let note = editor.querySelector('.reference-unit-note');
  if (!note) {
    note = control.ownerDocument.createElement('p');
    note.className = 'hint reference-unit-note';
    note.setAttribute('role', 'status');
    editor.append(note);
  }
  note.textContent = field.factor ? 'Reference limits were converted to the selected unit. Check them against your report.'
    : 'Enter the Lp(a) value and limits printed in the selected unit.';
  editor.open = true;
}

export function renderHeartForm({inputs = {}, errors = {}, step = 'country', showOptional = false, prefilled = [], touched = {}, prefillUnavailable = false}) {
  const steps = heartSteps(inputs);
  const {phase, fields} = step === 'review' ? {phase:0} : steps.find(item => item.id === step) || steps[0];
  const phases = ['About you', 'Health history', 'Your measurements'];
  const measures = phase === 2;
  const last = steps.at(-1).id === step;
  return `<div class="wrap app-screen task-screen question-screen heart-entry${measures ? ' lab-screen' : ''}">
    ${screenHeading('CARDIOVASCULAR ASSESSMENT', 'Heart & Vascular', '', pulseMark())}
    <div class="task-caption"><span>${phases[phase]}</span><span>${phase + 1} / ${phases.length}</span></div>
    <div class="heart-progress" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="${phases.length}" aria-valuenow="${phase + 1}">
      ${phases.map((_, index) => `<i class="${index === phase ? 'current' : index < phase ? 'complete' : ''}"></i>`).join('')}
    </div>
    <form id="heart-form" novalidate>
      ${step === 'country' && prefillUnavailable ? '<p class="hint" role="status">Saved answers were unavailable. Enter your current answers.</p>' : ''}
      ${measures ? measurementStep(step, inputs, errors, showOptional, touched)
        : step === 'review' ? prefillReview(inputs, errors, prefilled)
        : step === 'smoking-history' ? smokingHistory(fields, inputs, errors) : promptField(fields[0], inputs, errors)}
      <div class="form-nav">
        <button class="text-btn" type="button" data-action="heart-back">← Back</button>
        <button class="btn" type="submit">${last ? 'View report' : 'Continue'} ${arrow}</button>
      </div>
    </form>
  </div>`;
}

function riskSummary({inputs, result, review}) {
  if (result.reason) {
    const priority = diabetesLabs.filter(field => result.outside?.includes(field.id));
    const measurements = [...priority, ...routine].filter(field => inputs[field.id]);
    if (!inputs.systolic && !measurements.length) measurements.push(...specialist.filter(field => inputs[field.id]));
    const hasReadings = !!inputs.systolic || measurements.length > 0;
    return `<section class="heart-reading heart-prevention" data-theme-part>
      <h2>Your prevention review</h2>
      ${pressureFeedback(review)}
      ${hasReadings ? `<dl>${inputs.systolic ? pressureRow(inputs, review) : ''}${measurements.map(field => measurementRow(field, inputs, review, false)).join('')}</dl>`
        : '<p class="report-intro">Add blood pressure or cholesterol readings to see them here.</p>'}
    </section>`;
  }
  const model = heartModelForReport(result);
  const age = result.ageRange === 'above' ? `<span>Above</span> ${model.maxAge}`
    : result.ageRange === 'below' ? `<span>Below</span> ${model.minAge}` : esc(result.age);
  const isFramingham = result.method === FRAMINGHAM;
  const risk = isFramingham ? '' : result.risk < 0.1 ? '&lt;0.1%' : `${result.risk.toFixed(1)}%`;
  return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <div class="heart-result-main">
      ${reportArtwork()}
      <span class="eyebrow">${isFramingham ? 'VASCULAR AGE' : 'VASCULAR RISK AGE'}</span>
      <div class="report-age-line${result.ageRange ? ' heart-age-bound' : ''}"><strong>${age}</strong>${result.ageRange ? '' : '<span>years</span>'}</div>
      <p>${isFramingham ? 'Framingham reference · U.S. study' : 'Approximate age comparison'}</p>
    </div>
    ${isFramingham ? '' : `<div class="heart-result-meta">
      <div><strong>${risk}</strong><span>${model.name === SCORE2_DIABETES ? '10-year SCORE2-Diabetes risk' : model.name === 'SCORE2-OP' ? '10-year SCORE2-OP risk' : '10-year SCORE2 risk'}</span></div>
      <div><strong>${esc(inputs.country)}</strong><span>${esc(heartRegionLabels[result.region])}</span></div>
    </div>`}
  </section>`;
}

const row = (label, value) => `<div class="answer-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
function measurementRow(field, inputs, review, showSource = true) {
  const {id, label} = field, entry = inputs[id];
  const feedback = heartFeedback(field, entry, review?.fields[id], showSource);
  return `<div class="answer-row heart-measurement-row"><dt>${esc(label)}</dt><dd>${esc(entry ? `${entry.value} ${entry.unit}` : 'Not entered')}</dd>
    ${feedback ? `<dd class="heart-measurement-review">${feedback}</dd>` : ''}</div>`;
}

function pressureRow(inputs, review) {
  if (!inputs.systolic) return row('Blood pressure', 'Not entered');
  const reading = inputs.diastolic ? `${inputs.systolic.value}/${inputs.diastolic.value}` : inputs.systolic.value;
  const feedback = heartFeedback(topPressure, inputs.systolic, review?.fields.systolic);
  const followUp = review?.pressureFollowUp ? `<p class="heart-reading-context">${esc(review.pressureFollowUp)}</p>` : '';
  return `<div class="answer-row heart-measurement-row"><dt>${inputs.diastolic ? 'Blood pressure' : 'Systolic blood pressure'}</dt><dd>${esc(reading)} mmHg</dd>
    ${feedback || followUp ? `<dd class="heart-measurement-review">${feedback}${followUp}</dd>` : ''}</div>`;
}

function measurementsPanel(inputs, review) {
  const optional = specialist.filter(field => inputs[field.id]);
  const diabetes = diabetesLabs.filter(field => inputs[field.id]);
  return `<div class="report-section-heading"><h2>Your measurements</h2><button class="text-btn" data-action="heart-edit" data-part="measurements">Edit ${arrow}</button></div>
    <section class="heart-reading"><dl>${pressureRow(inputs, review)}</dl>${pressureFeedback(review)}
      <button class="text-btn" data-action="heart-edit" data-part="blood-pressure">Edit blood pressure ${arrow}</button></section>
    <section class="heart-reading"><h3>Cholesterol</h3><dl>${routine.map(field => measurementRow(field, inputs, review)).join('')}</dl></section>
    ${diabetes.length ? `<section class="heart-reading"><h3>Diabetes measurements</h3><dl>${diabetes.map(field => measurementRow(field, inputs, review)).join('')}</dl>
      ${offerDiabetesLabs(inputs) ? `<button class="text-btn" data-action="heart-edit" data-part="diabetes-labs">Edit diabetes measurements ${arrow}</button>` : ''}</section>` : ''}
    ${inputs.cfpwv ? `<section class="heart-reading"><h3>Arterial stiffness</h3><dl>${measurementRow(arterialMeasurement, inputs, review)}</dl>
      <button class="text-btn" data-action="heart-arterial">Edit pulse-wave result ${arrow}</button></section>` : ''}
    <section class="heart-reading"><h3>Optional results</h3>
      ${optional.length ? `<dl>${optional.map(field => measurementRow(field, inputs, review)).join('')}</dl>` : '<p class="report-intro">You can add ApoB or Lp(a) if you have the results.</p>'}
      <button class="text-btn" data-action="heart-edit" data-part="specialist">${optional.length ? 'Edit optional results' : 'Add optional results'} ${arrow}</button>
    </section>`;
}

function methodsPanel(inputs, result, review, sourceLinks) {
  const model = heartModelForReport(result);
  const isFramingham = model?.name === FRAMINGHAM || result.issue === 'framingham-data';
  const coverage = isFramingham
    ? 'For ages 30–39, this assessment uses the Framingham general cardiovascular model with routine cholesterol results.'
    : model?.name === SCORE2_DIABETES
    ? 'SCORE2-Diabetes estimates 10-year risk for eligible adults aged 40–69 with type 2 diabetes.'
    : model?.name === 'SCORE2-OP'
    ? 'SCORE2-OP estimates 10-year risk for eligible adults aged 70–89.'
    : model ? 'SCORE2 estimates 10-year risk for eligible adults aged 40–69.'
    : 'The assessment uses SCORE2 for ages 40–69 and SCORE2-OP for ages 70–89, when eligible.';
  return `<h2>Details & methods</h2>
    <details class="report-answer-group" open><summary>How the estimate works</summary>
      <p>${esc(coverage)}</p>
      <p>${isFramingham ? 'The model uses age, sex, smoking, systolic blood pressure, blood pressure medicine, diabetes, and total and HDL cholesterol. Its outcome includes coronary disease, stroke, peripheral artery disease and heart failure.'
        : 'The risk models use age, sex, current cigarette smoking, systolic blood pressure, total cholesterol and HDL cholesterol. The country of residence selects the regional calibration.'}</p>
      ${model?.name === SCORE2_DIABETES ? '<p>SCORE2-Diabetes also uses age at diagnosis, HbA1c and eGFR. This assessment uses exact HbA1c from 20 to 140 mmol/mol and eGFR from 60 to 150 mL/min/1.73 m². The study used the CKD-EPI 2009 equation for eGFR.</p>' : ''}
      <p>Health history helps determine eligibility. Smoking frequency and history, diastolic blood pressure, ApoB and Lp(a) appear in the report for context.</p>
      <p>Calculation coverage is systolic blood pressure from 100 to under 180 mmHg, total cholesterol 2.5–8 mmol/L and HDL cholesterol 0.5–3 mmol/L.</p>
    </details>
    ${review ? `<details class="report-answer-group"><summary>How measurements are checked</summary>
      <p>Your laboratory limits take precedence. When applicable, a published lipid guide supplies a general comparison. Individual treatment targets depend on overall risk.</p>
      <p>The published HDL comparison uses the sex entered for the estimate. Lp(a) stays in the unit printed on your report.</p>
      <p>Reference comparisons describe the measurement. Eligibility and calculation checks determine whether the risk estimate can be shown.</p>
    </details>` : ''}
    ${isFramingham ? `<details class="report-answer-group"><summary>The reference age</summary>
      <p>The comparison matches your modeled risk to a nonsmoker of the same sex with no diabetes, untreated systolic pressure of 125 mmHg, total cholesterol of 180 mg/dL and HDL cholesterol of 45 mg/dL. Reference ages span 30–74.</p>
      <p>The model was developed in the United States. The report shows the comparison age. SCORE2 provides country-calibrated percentages for eligible adults starting at age 40.</p>
    </details>` : model ? `<details class="report-answer-group"><summary>The reference age</summary>
      <p>Vascular risk age is an app comparison. It matches your risk to a nonsmoker of the same sex and region with systolic blood pressure of 110 mmHg, total cholesterol of 4.75 mmol/L and HDL cholesterol of 1.3 mmol/L. Reference ages stay within the model’s age range.</p>
      ${model.name === SCORE2_DIABETES ? '<p>The comparison matches the SCORE2-Diabetes risk to the standard SCORE2 reference profile.</p>' : ''}
    </details>` : ''}
    ${result.issue !== 'pressure' && heartCanCompareArterialAge(inputs) ? `<details class="report-answer-group"><summary>Arterial stiffness age</summary>
      <p>The comparison finds the age at which the median carotid–femoral pulse wave velocity in the Austrian LEAD study matches your result. It uses the reference curve for your sex and stays within ages 18–80.</p>
      <p>The measurement uses 80% of the direct carotid–femoral distance. Blood pressure at the time of the test can affect the reading. This age describes arterial stiffness. A 10-year event risk uses a separate calculation.</p>
    </details>` : ''}
    <details class="report-answer-group"><summary>Your answers</summary>
      <dl>${row('Age in years', inputs.age)}
        ${heartQuestions.filter(({id}) => inputs[id]).map(({id, label}) => row(label, id === 'smoking' && Object.hasOwn(heartLegacySmoking, inputs[id]) ? heartLegacySmoking[inputs[id]] : inputs[id])).join('')}
        ${heartDiagnosisActive(inputs) && inputs.diagnoses?.length ? inputs.diagnoses.map(diagnosis => row('Reported health history', diagnosis)).join('') : ''}
        ${inputs.bpTreatment ? row('Blood pressure medicine', inputs.bpTreatment) : ''}
        ${[heartDiabetesTypeQuestion, heartDiabetesDamageQuestion, diagnosisAge].filter(field => inputs[field.id] !== undefined).map(field => row(field.label, inputs[field.id])).join('')}
        ${heartSmokingFields(inputs).filter(field => inputs[field.id] !== undefined).map(field => row(smokingLabel(field, inputs), inputs[field.id])).join('')}
      </dl>
      <button class="text-btn" data-action="heart-edit" data-part="answers">Edit answers ${arrow}</button>
    </details>
    <details class="report-answer-group"><summary>Evidence and sources</summary>${sourceLinks(heartSources(result, review))}</details>`;
}

const reportTabs = [['summary', 'Summary'], ['measurements', 'Measurements'], ['methods', 'Methods']];

function nextStep(result, inputs, review) {
  if (result.issue === 'diabetes-data') return `<section class="report-explanation heart-missing">
    <h2>Finish your risk estimate</h2>
    <p>${esc(result.reason)}</p>
    <ul>${diabetesFields.filter(field => result.missing.includes(field.id)).map(field => `<li>${esc(field.label)}</li>`).join('')}</ul>
    <p>${esc(heartLimitations['diabetes-data'].next)}</p>
    <button class="btn no-print" data-action="heart-edit" data-part="diabetes-labs">Add missing details ${arrow}</button>
  </section>`;
  const issue = heartLimitations[result.issue];
  const needsType = (result.issue === 'diabetes' || result.historyIssue === 'diabetes') && heartNeedsDiabetesType(inputs) && !inputs.diabetesType;
  const pressureOutsideRange = result.issue === 'measurements' && review?.fields.systolic?.check.status === 'review';
  const edit = needsType ? 'diabetes-type' : pressureOutsideRange ? 'blood-pressure' : result.issue === 'young' ? null : issue?.edit;
  const label = {age:'Edit age', measurements:'Edit measurements', 'blood-pressure':'Edit blood pressure',
    'diabetes-type':'Add diabetes type', 'diabetes-labs':'Edit diabetes measurements'}[edit] || 'Review answers';
  const history = heartLimitations[result.historyIssue];
  let next = history?.next || issue?.next || 'Review your measurements and health history with a clinician.';
  if (result.dial2 && result.issue !== 'diabetes-complications') {
    next = 'A clinician can check whether DIAL2, a longer-term risk model for type 2 diabetes, fits your situation.';
  } else if (!history && result.issue === 'young' && inputs.age >= 35) {
    next = 'Ask a clinician whether a longer-term risk assessment such as LIFE-CVD2 is appropriate for you.';
  } else if (result.issue === 'diabetes' && inputs.age >= 40 && inputs.age <= 69 && inputs.diabetesType !== 'Type 1 diabetes') {
    next = 'If you have type 2 diabetes, ask whether SCORE2-Diabetes fits your history. Bring your latest HbA1c and eGFR results and your age at diagnosis if available.';
  }
  return `<section class="report-explanation">
    <h2>What you can do next</h2>
    <p class="heart-limit-reason">${esc(result.reason)}</p>
    ${history && !result.dial2 ? `<p>${esc(history.reason)}</p>` : ''}
    ${review?.pressureWarning ? '' : `<p>${esc(next)}</p>`}
    <div class="actions no-print">
      ${!inputs.systolic && !inputs.total && !inputs.hdl
        ? `<button class="text-btn" data-action="heart-edit" data-part="blood-pressure">Add readings ${arrow}</button>`
        : `<button class="text-btn" data-action="report-tab" data-tab="measurements">Review measurements ${arrow}</button>`}
      ${edit && heartSteps(inputs).some(step => step.id === edit) ? `<button class="text-btn" data-action="heart-edit" data-part="${edit}">${label} ${arrow}</button>` : ''}
    </div>
  </section>`;
}

function finishVascularAge(missing) {
  return `<section class="report-explanation heart-missing">
    <h2>Finish your vascular age estimate</h2>
    <ul>${framinghamFields.filter(field => missing.includes(field.id)).map(field => `<li>${esc(field.label)}</li>`).join('')}</ul>
    <button class="btn no-print" data-action="heart-edit" data-part="${heartFraminghamStep(missing)}" data-complete-age>Add missing details ${arrow}</button>
  </section>`;
}

export function renderHeartReport({heart, saved, pagesPreview, sourceLinks, tab = 'summary'}) {
  const {inputs, result, review} = heart;
  const selected = reportTabs.some(([id]) => id === tab) ? tab : 'summary';
  const summary = riskSummary(heart);
  const next = result.reason ? nextStep(result, inputs, review) : '';
  const isFramingham = result.method === FRAMINGHAM;
  const missing = result.issue === 'framingham-data' ? result.missing : result.issue === 'young' ? heartFraminghamMissing(inputs) : [];
  const arterial = arterialSummary(heart, isFramingham || missing.length > 0);
  const panels = {
    summary: result.reason ? (missing.length ? finishVascularAge(missing) + summary + arterial
      : result.issue === 'diabetes-data' ? next + summary : arterial + summary + next)
      : `${summary}<section class="report-explanation">
        <h2>What this tells you</h2>
        <p>${isFramingham ? 'Your answers and readings match the modeled risk of someone this age with the study’s reference readings.'
          : 'The percentage estimates the chance of a first heart attack, stroke, or cardiovascular death over 10 years. Vascular risk age expresses that risk as a comparison with a reference profile.'}</p>
      </section>${isFramingham && review?.pressureFollowUp ? `<section class="heart-reading"><dl>${pressureRow(inputs, review)}</dl></section>` : ''}${arterial}`,
    measurements: measurementsPanel(inputs, review),
    methods: methodsPanel(inputs, result, review, sourceLinks),
  };
  return `<div class="wrap app-screen report-workspace heart-report-screen">
    <header class="report-heading" data-theme-part>
      <div><span class="eyebrow">ASSESSMENT REPORT</span><h1>Heart & Vascular</h1>${saved ? '<p>Saved assessment</p>' : ''}</div>
      <div class="report-tools no-print">${!saved && !pagesPreview ? '<button class="text-btn" data-action="save">Save</button>' : ''}<button class="text-btn" data-action="print">${uiIcon('report')}<span>PDF</span></button></div>
    </header>
    <nav class="report-tabs heart-report-tabs no-print" aria-label="Report sections">${reportTabs.map(([id, label]) => `<button type="button" data-action="report-tab" data-tab="${id}"${id === selected ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
    <article class="report-paper">${reportTabs.map(([id, label]) => `<section class="report-panel" data-report-panel="${id}" aria-label="${label}"${id === selected ? '' : ' hidden'}>${panels[id]}</section>`).join('')}
      <p class="print-only report-footnote">Educational report. Prepared automatically.</p>
    </article>
    <p class="report-footnote">Educational estimates · Not clinically reviewed.</p>
  </div>`;
}

export function renderHeartOverview(heart, recordId) {
  return `<div class="wrap app-screen heart-overview">${screenHeading('YOUR ASSESSMENT', 'Heart & Vascular')}
    ${riskSummary(heart)}
    <div class="actions"><button class="btn" ${recordId ? `data-action="open-report" data-id="${esc(recordId)}"` : 'data-action="report"'}>Open your report ${arrow}</button></div>
  </div>`;
}
