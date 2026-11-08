import {heartQuestions, heartMeasurements, heartRegionLabels, HEART_SOURCES} from './heart-vascular.mjs';
import {escapeHTML as esc, screenHeading, uiIcon} from './ui-components.mjs';

const arrow = uiIcon('forward');

function field({id, label, hint}, errors, control) {
  const descriptions = [hint && `heart-${id}-hint`, errors[id] && `heart-${id}-error`].filter(Boolean);
  const attributes = `id="heart-${id}" name="${id}"${descriptions.length ? ` aria-describedby="${descriptions.join(' ')}"` : ''}${errors[id] ? ' aria-invalid="true"' : ''}`;
  return `<div class="heart-field"><label for="heart-${id}">${label}</label>${control(attributes)}
    ${hint ? `<p class="small muted" id="heart-${id}-hint">${hint}</p>` : ''}
    ${errors[id] ? `<p class="error" id="heart-${id}-error" role="alert">${esc(errors[id])}</p>` : ''}</div>`;
}

function measurementField(measurement, inputs, errors) {
  const {id, label, units} = measurement;
  const entry = inputs[id];
  return field(measurement, errors, attributes => `<div class="input-row">
    <input ${attributes} type="text" inputmode="decimal" maxlength="24" autocomplete="off" value="${esc(entry?.value)}">
    ${units.length === 1 ? `<span class="unit">${units[0]}</span>` : `<select name="${id}Unit" aria-label="${label} unit">${units.map(unit => `<option value="${unit}"${entry?.unit === unit ? ' selected' : ''}>${unit}</option>`).join('')}</select>`}
  </div>`);
}

export function readHeartForm(form) {
  const value = name => form.elements.namedItem(name).value;
  return {
    age:value('age'),
    ...Object.fromEntries(heartQuestions.map(({id}) => [id, value(id)])),
    ...Object.fromEntries(heartMeasurements.map(({id, units}) => [id, {value:value(id), unit:units.length === 1 ? units[0] : value(`${id}Unit`)}])),
  };
}

export function renderHeartForm({inputs = {}, errors = {}}) {
  return `<div class="wrap app-screen heart-assessment-screen">
    <button class="text-btn task-back" data-action="assessments">← My assessments</button>
    ${screenHeading('CARDIOVASCULAR ASSESSMENT', 'Heart & Vascular', 'Estimate your 10-year cardiovascular risk and compare it with a reference age.')}
    <form id="heart-form" class="heart-form" novalidate>
      <section class="card" aria-labelledby="heart-questions-heading"><h2 id="heart-questions-heading">About you</h2>
        <p class="small muted">SCORE2 covers eligible adults aged 40–69. You can still review your measurements if the estimate falls outside this assessment’s scope.</p>
        <div class="heart-fields">
          ${field({id:'age', label:'Age in years'}, errors, attributes => `<input ${attributes} type="number" min="18" max="120" step="1" inputmode="numeric" value="${esc(inputs.age)}">`)}
          ${heartQuestions.map(question => field(question, errors, attributes => `<select ${attributes}>
            <option value="">Choose an answer</option>${question.options.map(option => `<option value="${esc(option)}"${option === inputs[question.id] ? ' selected' : ''}>${esc(option)}</option>`).join('')}
          </select>`)).join('')}
        </div>
      </section>
      <section class="card" aria-labelledby="heart-routine-heading"><h2 id="heart-routine-heading">Routine measurements</h2>
        <p class="small muted">Use recent measured values and the units printed on your report. Enter total and HDL cholesterol from the same lipid panel.</p>
        <div class="heart-fields">${heartMeasurements.filter(field => !field.optional).map(field => measurementField(field, inputs, errors)).join('')}</div>
      </section>
      <section class="card" aria-labelledby="heart-optional-heading"><h2 id="heart-optional-heading">Optional specialist results</h2>
        <p class="small muted">ApoB and Lp(a) appear in your report as additional information. Use the units printed on the lab report.</p>
        <div class="heart-fields">${heartMeasurements.filter(field => field.optional).map(field => measurementField(field, inputs, errors)).join('')}</div>
      </section>
      <div class="actions"><button class="btn" type="submit">View Heart & Vascular report ${arrow}</button></div>
    </form>
  </div>`;
}

function riskSummary({inputs, result}) {
  if (result.reason) return `<div class="card"><h2>Estimate unavailable</h2><p>${esc(result.reason)}</p></div>`;
  const age = result.ageRange === 'above' ? 'Above 69' : result.ageRange === 'below' ? 'Below 40' : esc(result.age);
  const risk = result.risk < 0.1 ? '&lt;0.1%' : `${result.risk.toFixed(1)}%`;
  return `<section class="report-estimate heart-estimate" data-theme-part>
    <div class="heart-estimates"><div><span class="eyebrow">VASCULAR RISK AGE</span><strong>${age}</strong></div>
    <div><span class="eyebrow">10-YEAR SCORE2 RISK</span><strong>${risk}</strong></div></div>
    <p>Risk of a first heart attack, stroke, or cardiovascular death over the next 10 years.</p>
    <p class="small"><span>${esc(inputs.country)}</span> · <span>${esc(heartRegionLabels[result.region])}</span></p>
  </section>`;
}

const row = (label, value) => `<div class="answer-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const measurementRows = (inputs, optional) => heartMeasurements.filter(field => !!field.optional === optional)
  .map(({id, label}) => row(label, inputs[id] ? `${inputs[id].value} ${inputs[id].unit}` : 'Not entered')).join('');

export function renderHeartReport({heart, saved, pagesPreview, sourceLinks}) {
  const {inputs} = heart;
  return `<div class="wrap app-screen heart-assessment-screen heart-report-screen">
    <button class="text-btn task-back no-print" data-action="assessments">← My assessments</button>
    ${screenHeading('ASSESSMENT REPORT', 'Heart & Vascular', 'SCORE2 and your measurements')}
    ${riskSummary(heart)}
    <section class="card"><h2>Routine measurements</h2><dl>${measurementRows(inputs, false)}</dl></section>
    <section class="card"><h2>Optional specialist results</h2><p class="small muted">These results are listed separately from the SCORE2 calculation.</p><dl>${measurementRows(inputs, true)}</dl></section>
    <section class="card"><h2>Details & methods</h2>
      <dl>${row('Age in years', inputs.age)}${heartQuestions.map(({id, label}) => row(label, inputs[id])).join('')}</dl>
      <p>SCORE2 uses age, sex, current cigarette smoking, systolic blood pressure, total cholesterol and HDL cholesterol. The country of residence selects the regional calibration.</p>
      <p>Vascular risk age matches the estimated risk to a reference person of the same sex and region who does not smoke, with systolic blood pressure of 110 mmHg, total cholesterol of 4.75 mmol/L and HDL cholesterol of 1.3 mmol/L. The comparison covers reference ages 40–69.</p>
      <p class="small muted">This educational estimate uses an app-specific comparison based on continuous SCORE2 risk. Calculation coverage is systolic blood pressure from 100 to under 180 mmHg, total cholesterol 2.5–8 mmol/L and HDL cholesterol 0.5–3 mmol/L.</p>
      ${sourceLinks(HEART_SOURCES)}
    </section>
    <div class="actions no-print">
      <button class="btn secondary" data-action="start-heart">Edit inputs</button>
      <button class="text-btn" data-action="print">Print / PDF</button>
      ${saved ? '<span class="pill">Saved assessment</span>' : pagesPreview ? '' : '<button class="btn" data-action="save">Save assessment</button>'}
    </div>
  </div>`;
}

export function renderHeartOverview(heart, recordId) {
  return `<div class="wrap app-screen heart-assessment-screen">${screenHeading('YOUR ASSESSMENT', 'Heart & Vascular')}
    ${riskSummary(heart)}
    <div class="actions"><button class="btn" ${recordId ? `data-action="open-report" data-id="${esc(recordId)}"` : 'data-action="report"'}>Open your report ${arrow}</button></div>
  </div>`;
}
