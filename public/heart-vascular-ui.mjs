import {heartQuestions, heartMeasurements, heartRegionLabels, heartDiagnosisQuestion, heartDiagnosisActive, heartSmokingFields, heartLegacySmoking, heartStartIssue, heartLimitations, heartModelForReport, heartSources} from './heart-vascular.mjs';
import {escapeHTML as esc, reportArtwork, screenHeading, uiIcon, unmeasuredMark} from './ui-components.mjs';

const arrow = uiIcon('forward');
const [country, sex, smoking, conditions, treatment] = heartQuestions;
const age = {id:'age', label:'How old are you?'};
const aboutYou = [country, age, sex].map(field => ({id:field.id, phase:0, fields:[field]}));
const measurementStepInfo = {id:'measurements', phase:2, fields:heartMeasurements};

export function heartSteps(inputs) {
  if (heartStartIssue(inputs)) return [...aboutYou.slice(0, 2), measurementStepInfo];
  const history = [
    {id:'smoking', fields:[smoking]},
    {id:'smoking-history', fields:heartSmokingFields(inputs)},
    {id:'conditions', fields:[conditions]},
    {id:'diagnoses', fields:heartDiagnosisActive(inputs) ? [heartDiagnosisQuestion] : []},
    {id:'treatment', fields:[treatment]},
  ].filter(step => step.fields.length).map(step => ({...step, phase:1}));
  return [...aboutYou, ...history, measurementStepInfo];
}

export function readHeartForm(form, previous, step) {
  const inputs = {...previous};
  const valueOf = name => form.elements.namedItem(name).value;
  for (const {id, units, multiple} of heartSteps(previous).find(item => item.id === step).fields) {
    if (multiple) {
      inputs[id] = [...form.querySelectorAll(`input[name="${id}"]:checked`)].map(input => input.value);
      continue;
    }
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
    const choices = id === 'smoking' && Object.hasOwn(heartLegacySmoking, entry) ? [...options, entry] : options;
    control = `<div class="options heart-choices${multiple ? ' heart-diagnoses' : ''}">${choices.map(option => {
      const checked = multiple ? entry?.includes(option) : entry === option;
      const text = id === 'smoking' && Object.hasOwn(heartLegacySmoking, option) ? heartLegacySmoking[option] : option;
      return `<label class="option"><input type="${multiple ? 'checkbox' : 'radio'}" name="${id}" value="${esc(option)}"${checked ? ' checked' : ''}${invalid(id, errors)}><span>${esc(text)}</span><i class="choice-mark" aria-hidden="true"></i></label>`;
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

function measurementField({id, label, units}, inputs, errors, placeholder = 'Value') {
  const entry = inputs[id];
  return `<div class="heart-measurement">
    <label for="heart-${id}">${esc(label)}</label>
    <div class="input-row">
      <input id="heart-${id}" name="${id}" type="text" inputmode="decimal" maxlength="24" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(entry?.value)}"${invalid(id, errors)}>
      ${units.length === 1 ? `<span class="unit">${units[0]}</span>` : `<select name="${id}Unit" aria-label="${esc(label)} unit">${units.map(unit => `<option value="${unit}"${entry?.unit === unit ? ' selected' : ''}>${unit}</option>`).join('')}</select>`}
    </div>
    ${fieldError(id, errors)}
  </div>`;
}

const routine = heartMeasurements.filter(field => !field.group);
const specialist = heartMeasurements.filter(field => field.group === 'specialist');
const [topPressure, bottomPressure] = heartMeasurements.filter(field => field.group === 'pressure');

function enteredAge(inputs) {
  return `<span class="heart-entered-age"><span>Your age</span> <strong>${esc(inputs.age)}</strong> <span>years</span></span>`;
}

function measurementStep(inputs, errors, showOptional) {
  const issue = heartStartIssue(inputs);
  const open = showOptional || specialist.some(({id}) => errors[id] || inputs[id]?.value);
  return `<div class="lab-fields heart-measurements">
    ${issue ? `<aside class="heart-scope-note">${enteredAge(inputs)}<p><span>${esc(heartLimitations[issue].reason)}</span> <span>You can still record the measurements you have.</span></p></aside>` : ''}
    <fieldset class="question" data-theme-part>
      <legend>Blood pressure & cholesterol</legend>
      <div class="heart-measurement-list">
        <div class="heart-pressure" role="group" aria-label="Blood pressure" aria-describedby="heart-bp-hint">
          <p id="heart-bp-hint" class="hint">For 150/90, enter 150 in the first box and 90 in the second. The estimate uses the top number.</p>
          <div class="heart-pressure-inputs">
            ${measurementField({...topPressure, label:'Top number (systolic)'}, inputs, errors, '150')}
            ${measurementField({...bottomPressure, label:'Bottom number (optional)'}, inputs, errors, '90')}
          </div>
        </div>
        <div>
          <p class="hint">Use total and HDL cholesterol from the same lipid panel.</p>
          <div class="heart-lipid-inputs">${routine.map(field => measurementField(field, inputs, errors)).join('')}</div>
        </div>
      </div>
    </fieldset>
    <details class="reference-settings heart-specialist"${open ? ' open' : ''}>
      <summary><span>Add ApoB or Lp(a)</span><span>Optional</span></summary>
      <div class="reference-settings-content">
        <p class="hint">These results add context to your report. The estimate uses the routine measurements above.</p>
        <div class="heart-measurement-list">${specialist.map(field => measurementField(field, inputs, errors)).join('')}</div>
      </div>
    </details>
  </div>`;
}

export function renderHeartForm({inputs = {}, errors = {}, step = 'country', showOptional = false}) {
  const steps = heartSteps(inputs);
  const {phase, fields} = steps.find(item => item.id === step) || steps[0];
  const phases = ['About you', 'Health history', 'Your measurements'];
  const measures = step === 'measurements';
  return `<div class="wrap app-screen task-screen question-screen heart-entry${measures ? ' lab-screen' : ''}">
    ${screenHeading('CARDIOVASCULAR ASSESSMENT', 'Heart & Vascular', '', pulseMark())}
    <div class="task-caption"><span>${phases[phase]}</span><span>${phase + 1} / ${phases.length}</span></div>
    <div class="heart-progress" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="${phases.length}" aria-valuenow="${phase + 1}">
      ${phases.map((_, index) => `<i class="${index === phase ? 'current' : index < phase ? 'complete' : ''}"></i>`).join('')}
    </div>
    <form id="heart-form" novalidate>
      ${measures ? measurementStep(inputs, errors, showOptional) : step === 'smoking-history' ? smokingHistory(fields, inputs, errors) : promptField(fields[0], inputs, errors)}
      <div class="form-nav">
        <button class="text-btn" type="button" data-action="heart-back">← Back</button>
        <button class="btn" type="submit">${measures ? 'View report' : 'Continue'} ${arrow}</button>
      </div>
    </form>
  </div>`;
}

function riskSummary({inputs, result}) {
  if (result.reason) return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <span class="eyebrow">VASCULAR RISK</span><h2>Estimate unavailable</h2>
    <div class="withheld-emblem">${unmeasuredMark()}</div>${enteredAge(inputs)}<p>${esc(result.reason)}</p>
  </section>`;
  const model = heartModelForReport(result);
  const age = result.ageRange === 'above' ? `<span>Above</span> ${model.maxAge}`
    : result.ageRange === 'below' ? `<span>Below</span> ${model.minAge}` : esc(result.age);
  const risk = result.risk < 0.1 ? '&lt;0.1%' : `${result.risk.toFixed(1)}%`;
  return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <div class="heart-result-main">
      ${reportArtwork()}
      <span class="eyebrow">VASCULAR RISK AGE</span>
      <div class="report-age-line${result.ageRange ? ' heart-age-bound' : ''}"><strong>${age}</strong>${result.ageRange ? '' : '<span>years</span>'}</div>
      <p>Approximate age comparison</p>
    </div>
    <div class="heart-result-meta">
      <div><strong>${risk}</strong><span>${model.name === 'SCORE2-OP' ? '10-year SCORE2-OP risk' : '10-year SCORE2 risk'}</span></div>
      <div><strong>${esc(inputs.country)}</strong><span>${esc(heartRegionLabels[result.region])}</span></div>
    </div>
  </section>`;
}

const row = (label, value) => `<div class="answer-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const measurementRow = ({id, label}, inputs) => row(label, inputs[id] ? `${inputs[id].value} ${inputs[id].unit}` : 'Not entered');

function measurementsPanel(inputs) {
  const optional = specialist.filter(field => inputs[field.id]);
  const pressure = inputs.diastolic
    ? row('Blood pressure', `${inputs.systolic.value}/${inputs.diastolic.value} mmHg`)
    : measurementRow(topPressure, inputs);
  return `<div class="report-section-heading"><h2>Your measurements</h2><button class="text-btn" data-action="heart-edit" data-part="measurements">Edit ${arrow}</button></div>
    <section class="heart-reading"><h3>Routine measurements</h3><dl>${pressure}${routine.map(field => measurementRow(field, inputs)).join('')}</dl></section>
    <section class="heart-reading"><h3>Optional results</h3>
      ${optional.length ? `<dl>${optional.map(field => measurementRow(field, inputs)).join('')}</dl><p class="report-intro">These results add context to your report.</p>` : '<p class="report-intro">You can add ApoB or Lp(a) if you have the results.</p>'}
      <button class="text-btn" data-action="heart-edit" data-part="specialist">${optional.length ? 'Edit optional results' : 'Add optional results'} ${arrow}</button>
    </section>`;
}

function methodsPanel(inputs, result, sourceLinks) {
  const model = heartModelForReport(result);
  const coverage = model?.name === 'SCORE2-OP'
    ? 'SCORE2-OP estimates 10-year risk for eligible adults aged 70–89.'
    : model ? 'SCORE2 estimates 10-year risk for eligible adults aged 40–69.'
    : 'The assessment uses SCORE2 for ages 40–69 and SCORE2-OP for ages 70–89, when eligible.';
  return `<h2>Details & methods</h2>
    <details class="report-answer-group" open><summary>How the estimate works</summary>
      <p>${esc(coverage)}</p>
      <p>The risk models use age, sex, current cigarette smoking, systolic blood pressure, total cholesterol and HDL cholesterol. The country of residence selects the regional calibration.</p>
      <p>Health history helps determine eligibility. Smoking frequency and history, diastolic blood pressure, ApoB and Lp(a) appear in the report for context.</p>
      <p>Calculation coverage is systolic blood pressure from 100 to under 180 mmHg, total cholesterol 2.5–8 mmol/L and HDL cholesterol 0.5–3 mmol/L.</p>
    </details>
    ${model ? `<details class="report-answer-group"><summary>The reference age</summary>
      <p>Vascular risk age is an app comparison. It matches your risk to a nonsmoker of the same sex and region with systolic blood pressure of 110 mmHg, total cholesterol of 4.75 mmol/L and HDL cholesterol of 1.3 mmol/L. Reference ages stay within the model’s age range.</p>
    </details>` : ''}
    <details class="report-answer-group"><summary>Your answers</summary>
      <dl>${row('Age in years', inputs.age)}
        ${heartQuestions.filter(({id}) => inputs[id]).map(({id, label}) => row(label, id === 'smoking' && Object.hasOwn(heartLegacySmoking, inputs[id]) ? heartLegacySmoking[inputs[id]] : inputs[id])).join('')}
        ${heartDiagnosisActive(inputs) && inputs.diagnoses?.length ? inputs.diagnoses.map(diagnosis => row('Reported health history', diagnosis)).join('') : ''}
        ${heartSmokingFields(inputs).filter(field => inputs[field.id] !== undefined).map(field => row(smokingLabel(field, inputs), inputs[field.id])).join('')}
      </dl>
      <button class="text-btn" data-action="heart-edit" data-part="answers">Edit answers ${arrow}</button>
    </details>
    <details class="report-answer-group"><summary>Evidence and sources</summary>${sourceLinks(heartSources(result))}</details>`;
}

const reportTabs = [['summary', 'Summary'], ['measurements', 'Measurements'], ['methods', 'Methods']];

function nextStep(result, inputs) {
  const issue = heartLimitations[result.issue];
  const edit = issue?.edit;
  const label = edit === 'age' ? 'Edit age' : edit === 'measurements' ? 'Edit measurements' : 'Review answers';
  let next = issue?.next || 'Review your measurements and health history with a clinician.';
  if (result.issue === 'young' && inputs.age >= 35) {
    next = 'Ask a clinician whether a longer-term risk assessment such as LIFE-CVD2 is appropriate for you.';
  } else if (result.issue === 'diabetes' && inputs.age <= 69) {
    next = 'If you have type 2 diabetes, ask a clinician whether SCORE2-Diabetes fits your history. It uses HbA1c, kidney function and age at diagnosis.';
  }
  return `<section class="report-explanation">
    <h2>What you can do next</h2><p>${esc(next)}</p>
    <div class="actions no-print">
      <button class="text-btn" data-action="report-tab" data-tab="measurements">Review measurements ${arrow}</button>
      ${edit && heartSteps(inputs).some(step => step.id === edit) ? `<button class="text-btn" data-action="heart-edit" data-part="${edit}">${label} ${arrow}</button>` : ''}
    </div>
  </section>`;
}

export function renderHeartReport({heart, saved, pagesPreview, sourceLinks, tab = 'summary'}) {
  const {inputs, result} = heart;
  const selected = reportTabs.some(([id]) => id === tab) ? tab : 'summary';
  const panels = {
    summary: `${riskSummary(heart)}
      ${result.reason ? nextStep(result, inputs) : `<section class="report-explanation">
        <h2>What this tells you</h2>
        <p>The percentage estimates the chance of a first heart attack, stroke, or cardiovascular death over 10 years. Vascular risk age expresses that risk as a comparison with a reference profile.</p>
      </section>`}`,
    measurements: measurementsPanel(inputs),
    methods: methodsPanel(inputs, result, sourceLinks),
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
