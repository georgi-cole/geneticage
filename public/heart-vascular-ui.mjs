import {heartQuestions, heartMeasurements, heartRegionLabels, HEART_SOURCES} from './heart-vascular.mjs';
import {escapeHTML as esc, reportArtwork, screenHeading, uiIcon, unmeasuredMark} from './ui-components.mjs';

const arrow = uiIcon('forward');
const prompts = [heartQuestions[0], {id:'age', label:'How old are you?', hint:'SCORE2 covers eligible adults aged 40–69.'}, ...heartQuestions.slice(1)];
export const HEART_MEASUREMENT_STEP = prompts.length;
const fieldsForStep = step => step === HEART_MEASUREMENT_STEP ? heartMeasurements : [prompts[step]];

export function heartErrorStep(errors) {
  const question = prompts.findIndex(({id}) => errors[id]);
  return question >= 0 ? question : Object.keys(errors).length ? HEART_MEASUREMENT_STEP : -1;
}

export function readHeartForm(form, previous, step) {
  const inputs = {...previous};
  const valueOf = name => form.elements.namedItem(name).value;
  for (const {id, units} of fieldsForStep(step)) {
    const value = valueOf(id);
    if (units) {
      const unit = units.length === 1 ? units[0] : valueOf(`${id}Unit`);
      if (value || inputs[id] || unit !== units[0]) inputs[id] = {value, unit};
    } else if (String(inputs[id] ?? '') !== value) inputs[id] = value;
  }
  return inputs;
}

function pulseMark() {
  return '<svg class="heart-pulse-mark" viewBox="0 0 112 36" fill="none" aria-hidden="true" focusable="false"><path class="pulse-guide" d="M1 18h110M81 4v28"/><path class="pulse-trace" d="M5 18h22l5-6 6 11 8-19 8 28 8-14h39"/><circle cx="5" cy="18" r="2.5"/><circle cx="101" cy="18" r="2.5"/></svg>';
}

const fieldError = (id, errors) => errors[id] ? `<p class="error" id="heart-${id}-error" role="alert">${esc(errors[id])}</p>` : '';
const invalid = (id, errors) => errors[id] ? ` aria-invalid="true" aria-describedby="heart-${id}-error"` : '';

function promptField({id, label, hint, options}, inputs, errors) {
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
    control = `<div class="options heart-choices">${options.map(option => `<label class="option"><input type="radio" name="${id}" value="${esc(option)}"${option === entry ? ' checked' : ''}${invalid(id, errors)}><span>${esc(option)}</span><i class="choice-mark" aria-hidden="true"></i></label>`).join('')}</div>`;
  }
  return `<fieldset class="question heart-prompt" data-theme-part${hint ? ` aria-describedby="heart-${id}-hint"` : ''}>
    <legend>${esc(title)}</legend>
    ${hint ? `<p class="hint" id="heart-${id}-hint">${esc(hint)}</p>` : ''}
    ${control}
    ${fieldError(id, errors)}
  </fieldset>`;
}

function measurementField({id, label, units, hint}, inputs, errors) {
  const entry = inputs[id];
  return `<div class="heart-measurement">
    <label for="heart-${id}">${esc(label)}</label>
    ${hint ? `<p class="hint" id="heart-${id}-hint">${esc(hint)}</p>` : ''}
    <div class="input-row">
      <input id="heart-${id}" name="${id}" type="text" inputmode="decimal" maxlength="24" autocomplete="off" placeholder="Value" value="${esc(entry?.value)}"${invalid(id, errors) || (hint ? ` aria-describedby="heart-${id}-hint"` : '')}>
      ${units.length === 1 ? `<span class="unit">${units[0]}</span>` : `<select name="${id}Unit" aria-label="${esc(label)} unit">${units.map(unit => `<option value="${unit}"${entry?.unit === unit ? ' selected' : ''}>${unit}</option>`).join('')}</select>`}
    </div>
    ${fieldError(id, errors)}
  </div>`;
}

function measurementStep(inputs, errors, showOptional) {
  const fields = heartMeasurements.filter(field => !field.optional);
  const optional = heartMeasurements.filter(field => field.optional);
  const open = showOptional || optional.some(({id}) => errors[id] || inputs[id]?.value);
  return `<div class="lab-fields heart-measurements">
    <fieldset class="question" data-theme-part>
      <legend>Blood pressure & cholesterol</legend>
      <p class="hint">Use total and HDL cholesterol from the same lipid panel.</p>
      <div class="heart-measurement-list">${fields.map(field => measurementField(field, inputs, errors)).join('')}</div>
    </fieldset>
    <details class="reference-settings heart-specialist"${open ? ' open' : ''}>
      <summary><span>Add ApoB or Lp(a)</span><span>Optional</span></summary>
      <div class="reference-settings-content">
        <p class="hint">These results add context to your report. SCORE2 uses the routine measurements above.</p>
        <div class="heart-measurement-list">${optional.map(field => measurementField(field, inputs, errors)).join('')}</div>
      </div>
    </details>
  </div>`;
}

export function renderHeartForm({inputs = {}, errors = {}, step = 0, showOptional = false}) {
  const measures = step === HEART_MEASUREMENT_STEP;
  const count = HEART_MEASUREMENT_STEP + 1;
  return `<div class="wrap app-screen task-screen question-screen heart-entry${measures ? ' lab-screen' : ''}">
    ${screenHeading('CARDIOVASCULAR ASSESSMENT', 'Heart & Vascular', '', pulseMark())}
    <div class="task-caption"><span>${measures ? 'Your measurements' : step < 3 ? 'About you' : 'Health history'}</span><span>${step + 1} / ${count}</span></div>
    <div class="heart-progress" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="${count}" aria-valuenow="${step + 1}">
      ${Array.from({length:count}, (_, index) => `<i class="${index === step ? 'current' : index < step ? 'complete' : ''}"></i>`).join('')}
    </div>
    <form id="heart-form" novalidate>
      ${measures ? measurementStep(inputs, errors, showOptional) : promptField(prompts[step], inputs, errors)}
      <div class="form-nav">
        <button class="text-btn" type="button" data-action="heart-back">← Back</button>
        <button class="btn" type="submit">${measures ? 'View result' : 'Continue'} ${arrow}</button>
      </div>
    </form>
  </div>`;
}

function riskSummary({inputs, result}) {
  if (result.reason) return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <span class="eyebrow">SCORE2</span><h2>Estimate unavailable</h2>
    <div class="withheld-emblem">${unmeasuredMark()}</div><p>${esc(result.reason)}</p>
  </section>`;
  const age = result.ageRange === 'above' ? 'Above 69' : result.ageRange === 'below' ? 'Below 40' : esc(result.age);
  const risk = result.risk < 0.1 ? '&lt;0.1%' : `${result.risk.toFixed(1)}%`;
  return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <div class="heart-result-main">
      ${reportArtwork()}
      <span class="eyebrow">VASCULAR RISK AGE</span>
      <div class="report-age-line${result.ageRange ? ' heart-age-bound' : ''}"><strong>${age}</strong>${result.ageRange ? '' : '<span>years</span>'}</div>
      <p>Approximate age comparison</p>
    </div>
    <div class="heart-result-meta">
      <div><strong>${risk}</strong><span>10-year SCORE2 risk</span></div>
      <div><strong>${esc(inputs.country)}</strong><span>${esc(heartRegionLabels[result.region])}</span></div>
    </div>
  </section>`;
}

const row = (label, value) => `<div class="answer-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const measurementRow = ({id, label}, inputs) => row(label, inputs[id] ? `${inputs[id].value} ${inputs[id].unit}` : 'Not entered');

function measurementsPanel(inputs) {
  const routine = heartMeasurements.filter(field => !field.optional);
  const optional = heartMeasurements.filter(field => field.optional && inputs[field.id]);
  return `<div class="report-section-heading"><h2>Your measurements</h2><button class="text-btn" data-action="heart-edit" data-part="measurements">Edit ${arrow}</button></div>
    <section class="heart-reading"><h3>Routine measurements</h3><dl>${routine.map(field => measurementRow(field, inputs)).join('')}</dl></section>
    <section class="heart-reading"><h3>Optional results</h3>
      ${optional.length ? `<dl>${optional.map(field => measurementRow(field, inputs)).join('')}</dl><p class="report-intro">These results are listed separately from the SCORE2 calculation.</p>` : '<p class="report-intro">You can add ApoB or Lp(a) if you have the results.</p>'}
      <button class="text-btn" data-action="heart-edit" data-part="specialist">${optional.length ? 'Edit optional results' : 'Add optional results'} ${arrow}</button>
    </section>`;
}

function methodsPanel(inputs, sourceLinks) {
  return `<h2>Details & methods</h2>
    <details class="report-answer-group" open><summary>How the estimate works</summary>
      <p>SCORE2 uses age, sex, current cigarette smoking, systolic blood pressure, total cholesterol and HDL cholesterol. The country of residence selects the regional calibration.</p>
      <p>This educational estimate uses an app-specific comparison based on continuous SCORE2 risk. Calculation coverage is systolic blood pressure from 100 to under 180 mmHg, total cholesterol 2.5–8 mmol/L and HDL cholesterol 0.5–3 mmol/L.</p>
    </details>
    <details class="report-answer-group"><summary>The reference age</summary>
      <p>Vascular risk age matches the estimated risk to a reference person of the same sex and region who does not smoke, with systolic blood pressure of 110 mmHg, total cholesterol of 4.75 mmol/L and HDL cholesterol of 1.3 mmol/L. The comparison covers reference ages 40–69.</p>
    </details>
    <details class="report-answer-group"><summary>Your answers</summary>
      <dl>${row('Age in years', inputs.age)}${heartQuestions.map(({id, label}) => row(label, inputs[id])).join('')}</dl>
      <button class="text-btn" data-action="heart-edit" data-part="answers">Edit answers ${arrow}</button>
    </details>
    <details class="report-answer-group"><summary>Evidence and sources</summary>${sourceLinks(HEART_SOURCES)}</details>`;
}

const reportTabs = [['summary', 'Summary'], ['measurements', 'Measurements'], ['methods', 'Methods']];

export function renderHeartReport({heart, saved, pagesPreview, sourceLinks, tab = 'summary'}) {
  const {inputs, result} = heart;
  const selected = reportTabs.some(([id]) => id === tab) ? tab : 'summary';
  const panels = {
    summary: `${riskSummary(heart)}
      ${result.reason ? '<div class="actions"><button class="btn secondary" data-action="heart-edit" data-part="answers">Review answers</button></div>' : `<section class="report-explanation">
        <h2>What this tells you</h2>
        <p>SCORE2 estimates the chance of a first heart attack, stroke, or cardiovascular death over 10 years. The age expresses that risk as a comparison with a reference profile.</p>
      </section>`}`,
    measurements: measurementsPanel(inputs),
    methods: methodsPanel(inputs, sourceLinks),
  };
  return `<div class="wrap app-screen report-workspace heart-report-screen">
    <header class="report-heading" data-theme-part>
      <div><span class="eyebrow">ASSESSMENT REPORT</span><h1>Heart & Vascular</h1>${saved ? '<p>Saved assessment</p>' : ''}</div>
      <div class="report-tools no-print">${!saved && !pagesPreview ? '<button class="text-btn" data-action="save">Save</button>' : ''}<button class="text-btn" data-action="print">${uiIcon('report')}<span>PDF</span></button></div>
    </header>
    <nav class="report-tabs heart-report-tabs no-print" aria-label="Report sections">${reportTabs.map(([id, label]) => `<button type="button" data-action="report-tab" data-tab="${id}"${id === selected ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
    <article class="report-paper">${reportTabs.map(([id, label]) => `<section class="report-panel" data-report-panel="${id}" aria-label="${label}"${id === selected ? '' : ' hidden'}>${panels[id]}</section>`).join('')}
      <p class="print-only report-footnote">Educational report. Prepared automatically; not clinically reviewed.</p>
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
