import {assessSystem, systemAssessment, systemExtras, systemField, systemSteps} from './system-assessments.mjs';
import {measurementFeedbackMarkup} from './lab-feedback.mjs';
import {setMeasurementUnit} from './lab-review.mjs';
import {escapeHTML as esc, reportArtwork, screenHeading, specialistHelp, uiIcon} from './ui-components.mjs';

const arrow = ' ' + uiIcon('forward');

export function systemRoute(type, inputs, prefilled = []) {
  const steps = systemSteps(type, inputs);
  const fields = steps.flatMap(step => step.fields).filter(id => prefilled.includes(id) && inputs[id] !== undefined);
  const route = steps.map(step => ({...step, fields:step.fields.filter(id => !fields.includes(id))}))
    .filter(step => step.fields.length);
  return fields.length ? [{id:'review', title:'Review your details', fields}, ...route] : route;
}

export function systemStepFor(type, inputs, target) {
  return [...systemSteps(type, inputs), ...systemExtras(type)]
    .find(step => step.id === target || step.fields.includes(target));
}

const valueText = (field, entry) => field.options ? field.labels?.[entry] || entry : entry ? entry.value + ' ' + entry.unit : '';
const fieldError = (id, errors) => errors[id] ? `<p class="error" id="system-${id}-error" role="alert">${esc(errors[id])}</p>` : '';
const invalid = (id, errors) => errors[id] ? ` aria-invalid="true" aria-describedby="system-${id}-error"` : '';
const idFor = field => 'system-' + field.id;

function systemReferenceEditor({id}, entry, errors) {
  const errorKey = id+'Reference';
  return `<details class="reference-editor"${errors[errorKey] ? ' open' : ''}>
    <summary>Laboratory reference interval</summary>
    <p class="hint">Use the limits printed on your lab report, in the selected unit. Leave a limit blank if the report gives only one.</p>
    <div class="reference-bounds">${[['Low','Lower limit','≥','>'], ['High','Upper limit','≤','<']].map(([side, caption, inclusive, exclusive]) => {
      const key = 'reference'+side, name = id+key;
      return `<label><span>${caption}</span><span class="reference-bound-input">
        <select name="${name}Exclusive" aria-label="${side === 'Low' ? 'Lower limit rule' : 'Upper limit rule'}"><option value="inclusive">${inclusive}</option><option value="exclusive"${entry?.[key+'Exclusive'] ? ' selected' : ''}>${exclusive}</option></select>
        <input type="text" name="${name}" maxlength="24" inputmode="decimal" value="${esc(entry?.[key])}" aria-label="${caption}"${invalid(errorKey, errors)}>
      </span></label>`;
    }).join('')}</div>${fieldError(errorKey, errors)}
  </details>`;
}

function measurement(field, entry, errors, info, hideLabel) {
  const {id, label, units, integer, help, lab} = field;
  const name = idFor(field), description = [help && name+'-help', lab && name+'-feedback'].filter(Boolean).join(' ');
  return `<div class="heart-measurement ${lab ? 'lab-measurement' : ''}" data-system-field="${id}" data-reference-status="${info?.direction || 'untouched'}" data-entry-check="${errors[id] ? 'invalid' : info?.check.status || 'untouched'}">
    <label for="${name}"${hideLabel ? ' class="sr-only"' : ''}>${esc(label)}</label>
    ${help ? `<p class="hint" id="${name}-help">${esc(help)}</p>` : ''}
    <div class="input-row">
      <input id="${name}" name="${id}" type="text" inputmode="${integer ? 'numeric' : 'decimal'}" maxlength="24" autocomplete="off" value="${esc(entry?.value)}"${invalid(id, errors) || (description ? ` aria-describedby="${description}"` : '')}>
      ${units.length === 1 ? `<span class="unit">${esc(units[0])}</span>` : `<select name="${id}Unit" data-system-unit="${id}" aria-label="${esc(label)} unit">${units.map(unit => `<option value="${esc(unit)}"${entry?.unit === unit ? ' selected' : ''}>${esc(unit)}</option>`).join('')}</select>`}
    </div>
    ${fieldError(id, errors)}
    ${lab ? `<div class="lab-feedback" id="${name}-feedback" role="status" aria-live="polite">${info ? measurementFeedbackMarkup(field, entry || {}, info) : ''}</div>
    ${systemReferenceEditor(field, entry, errors)}` : ''}
  </div>`;
}

function choice(field, entry, errors, alone) {
  const {id, label, options, labels = {}} = field;
  const name = idFor(field);
  if (alone) return `<fieldset class="question heart-prompt">
    <legend>${esc(label)}</legend>
    <div class="options heart-choices">${options.map((option, i) => `<label class="option" for="${name}-${i}">
      <input id="${name}-${i}" name="${id}" value="${esc(option)}" type="radio"${entry === option ? ' checked' : ''}${invalid(id, errors)}>
      <span>${esc(labels[option] || option)}</span><i class="choice-mark" aria-hidden="true"></i>
    </label>`).join('')}</div>${fieldError(id, errors)}
  </fieldset>`;
  return `<div class="heart-measurement"><label for="${name}">${esc(label)}</label>
    <select id="${name}" name="${id}"${invalid(id, errors)}>
      <option value="">Choose an answer</option>${options.map(option => `<option value="${esc(option)}"${entry === option ? ' selected' : ''}>${esc(labels[option] || option)}</option>`).join('')}
    </select>${fieldError(id, errors)}
  </div>`;
}

function reviewPrefill(type, inputs, fields) {
  return `<div class="heart-prefill-list">
    <p class="hint">${type === 'kidney' && fields.includes('age') ? 'Check that the age matches the day of your blood draw.' : 'We’ve filled in details you shared earlier. Update anything that has changed.'}</p>
    ${fields.map(id => {
      const field = systemField(type, id);
      const key = esc(field.id);
      return `<div class="heart-prefill-row"><div><span id="system-prefill-${key}">${esc(field.label)}</span><br><strong>${esc(valueText(field, inputs[id]))}</strong></div>
        <button type="button" class="text-btn" data-action="system-review-edit" data-part="${key}" aria-describedby="system-prefill-${key}">Edit</button></div>`;
    }).join('')}
  </div>`;
}

export function renderSystemForm({type, inputs, step, prefilled, errors, mode, touched, prefillUnavailable}) {
  const spec = systemAssessment(type);
  const route = systemRoute(type, inputs, prefilled);
  const current = (mode ? step : route.find(item => item.id === step?.id)) || route[0];
  const review = current.id === 'review';
  const {review:measurements} = assessSystem(type, inputs);
  const last = mode || current === route.at(-1);
  const skip = !mode && current.skip;
  const next = last ? 'View report' : 'Continue';
  const entered = current.fields.some(id => inputs[id]?.value || typeof inputs[id] === 'string' && inputs[id]);
  const index = route.findIndex(item => item.id === current.id);
  return `<div class="wrap app-screen task-screen question-screen heart-entry system-entry">
    <div class="system-heading">${screenHeading(current.specialist ? 'SPECIALIST TEST' : 'ASSESSMENT', spec.title)}<span aria-hidden="true">${uiIcon(spec.icon)}</span></div>
    ${!mode ? `<div class="task-caption"><span>${esc(current.title)}</span><span>${index + 1} / ${route.length}</span></div>
    <div class="heart-progress" aria-hidden="true">${route.map((_, i) => `<i class="${i < index ? 'complete' : i === index ? 'current' : ''}"></i>`).join('')}</div>` : ''}
    <form id="system-form" novalidate>
      ${review ? reviewPrefill(type, inputs, current.fields) : `<div class="heart-measurements system-fields" data-theme-part>
        ${mode ? `<h2>${esc(current.title)}</h2>` : ''}
        ${current.hint ? `<p class="hint">${esc(current.hint)}</p>` : ''}
        ${current.fields.map(id => {
          const field = systemField(type, id);
          return field.options ? choice(field, inputs[id], errors, current.fields.length === 1 && !field.select)
            : measurement(field, inputs[id], errors, touched[id] === false || errors[id] || errors[id+'Reference'] ? null : measurements.fields[id], mode && field.label === current.title);
        }).join('')}
      </div>`}
      ${prefillUnavailable && current.id === 'age' ? '<p class="hint">Earlier answers could not be loaded. You can enter them here.</p>' : ''}
      ${current.specialist ? specialistHelp() : ''}
      ${current.id === 'creatinine' && !mode ? '<button class="text-btn system-alternate" type="button" data-action="system-partial">I don’t have this result yet</button>' : ''}
      ${type === 'fitness' && index === 0 && !mode ? '<button class="text-btn system-alternate" type="button" data-action="sample" data-type="fitness">Try a Fitness sample</button>' : ''}
      <div class="form-nav">
        <button class="text-btn" type="button" data-action="system-back">${mode === 'report' ? 'Keep current results' : '← Back'}</button>
        <button class="btn" type="submit"><span${skip ? ' data-system-skip="'+esc(skip)+'"' : ''}>${mode === 'review' ? 'Save changes' : skip && !entered ? skip : next}</span>${arrow}</button>
      </div>
    </form>
  </div>`;
}

export function readSystemForm(type, form, previous) {
  const inputs = {...previous};
  const data = new form.ownerDocument.defaultView.FormData(form);
  for (const control of form.querySelectorAll('[data-system-field]')) {
    const id = control.dataset.systemField;
    const field = systemField(type, id);
    const unit = data.get(id+'Unit') || field.units[0];
    const old = previous[id] || {unit};
    const entry = {value:data.get(id), unit:old.unit};
    for (const key of ['referenceLow', 'referenceHigh']) {
      if (!data.has(id+key)) continue;
      entry[key] = data.get(id+key);
      entry[key+'Exclusive'] = data.get(id+key+'Exclusive') === 'exclusive';
    }
    inputs[id] = setMeasurementUnit(field, entry, unit);
    if (old.unit !== unit) {
      for (const key of ['referenceLow', 'referenceHigh']) {
        const bound = form.elements[id+key];
        if (!bound) continue;
        bound.value = inputs[id][key] ?? '';
        form.elements[id+key+'Exclusive'].value = inputs[id][key+'Exclusive'] ? 'exclusive' : 'inclusive';
      }
    }
  }
  for (const element of form.querySelectorAll('input[type=radio], select')) {
    if (systemField(type, element.name)?.options) inputs[element.name] = data.get(element.name) || '';
  }
  return inputs;
}

export function refreshSystemFeedback(type, form, inputs, touched) {
  const {review} = assessSystem(type, inputs);
  for (const element of form.querySelectorAll('.lab-measurement[data-system-field]')) {
    const id = element.dataset.systemField;
    const info = touched[id] ? review.fields[id] : null;
    element.dataset.referenceStatus = info?.direction || 'untouched';
    element.dataset.entryCheck = info?.check.status || 'untouched';
    const feedback = element.querySelector('.lab-feedback');
    const markup = info ? measurementFeedbackMarkup(systemField(type, id), inputs[id], info) : '';
    if(feedback.innerHTML !== markup)feedback.innerHTML = markup;
    element.querySelector('#system-'+id).setAttribute('aria-invalid', String(info?.check.status === 'invalid' || !!element.querySelector('#system-'+id+'-error')));
  }
}

const resultCopy = {
  'gdrs-2022-age-v1': ['Questionnaire and body measurements', 'This is the age at which the reference profile has a similar modeled 10-year risk of type 2 diabetes.'],
  'gdrs-2022-a1c-age-v1': ['HbA1c included', 'This is the age at which the reference profile has a similar modeled 10-year risk of type 2 diabetes.'],
  'ckd-epi-2021-europe-age-v1': ['Creatinine-based filtration', 'Your estimated filtration is matched to typical values from healthy European adults.'],
  'hunt-nonexercise-fitness-age-v1': ['Estimated oxygen uptake', 'Your estimated oxygen uptake is closest to the average for this age group in the Norwegian HUNT study.'],
  'bradshaw-fitness-age-v1': ['Estimated oxygen uptake', 'Your movement and body measurements estimate oxygen uptake. The age compares that estimate with adult treadmill reference values.'],
  'blsa-fitness-age-v1': ['Estimated oxygen uptake', 'Your activity, health and body measurements estimate oxygen uptake. The age compares that estimate with adult treadmill reference values.'],
  'friend-2022-fitness-age-v1': ['Measured oxygen uptake', 'Your result is closest to the typical oxygen uptake for this age group and exercise test in the FRIEND registry.'],
};

const nextSteps = {
  'metabolic-age':['The age equation was tested through age 79. If you have an HbA1c or fasting glucose result, you can review it here and discuss any follow-up with your clinician.', 'Review glucose tests', 'metabolic-labs'],
  'diabetes-known':['The model estimates the chance of developing type 2 diabetes. If you already have diabetes, ask your care team which HbA1c target fits your situation.', 'Review diabetes history', 'diabetes'],
  'metabolic-pregnancy':['Pregnancy changes how blood sugar is assessed. Ask your care team about the glucose testing that applies during pregnancy.', 'Review health context', 'pregnancy'],
  'glucose-review':['A reading reaches a diabetes testing threshold. Check the units and ask your clinician whether to repeat the test before using a risk age.', 'Review glucose tests', 'metabolic-labs'],
  'glucose-critical':['This fasting glucose result needs attention before an age comparison.', 'Review glucose tests', 'metabolic-labs'],
  'kidney-collection':['Pregnancy or a recent illness or kidney injury can make creatinine-based estimates unreliable. A result from a stable time may be more informative.', 'Review collection details', 'collection'],
  'kidney-treatment':['Dialysis and transplant care need a separate interpretation of kidney function. Review your lab results with your kidney care team.', 'Review kidney history', 'kidney-history'],
  'kidney-filtration':['The filtration estimate is below 60. Ask your clinician about repeat eGFR and urine ACR to understand what is causing the change.', 'Review kidney results', 'creatinine'],
  'kidney-albumin':['The urine ACR reaches the threshold for raised urine albumin. Ask your clinician whether to repeat it.', 'Review urine ACR', 'kidney-urine'],
  'kidney-history':['A filtration age can hide the significance of known kidney disease. Repeat filtration and urine albumin results help your clinician assess changes over time.', 'Review kidney history', 'kidney-history'],
  'fitness-age':['The questionnaire equations were studied through age 96. If you have a supervised fitness result, you can compare it with the adult study groups.', 'Add supervised test', 'fitness-test'],
  'fitness-context':['A health condition or medicine can change resting pulse and the estimate. A compatible supervised test can provide a comparison if you have one.', 'Review health context', 'fitness-context'],
  'fitness-values':['The estimated oxygen uptake is outside the calculation range. Check your measurements and units.', 'Review measurements', 'resting'],
};

function ageReadout(type, result) {
  const spec = systemAssessment(type);
  const [method] = resultCopy[result.version] || [result.method];
  const band = result.ageBand;
  const age = result.ageRange === 'at-least' ? esc(result.boundary) + '+'
    : result.ageRange === 'below' ? `<span>Below</span> ${esc(result.boundary)}`
    : result.ageRange === 'above' ? `<span>Above</span> ${esc(result.boundary)}` : esc(result.age);
  return `<section class="report-estimate result-surface heart-estimate" data-theme-part>
    <div class="heart-result-main">${reportArtwork()}<span class="eyebrow">${esc(spec.readout)}</span>
      <div class="report-age-line${['below','above'].includes(result.ageRange) ? ' heart-age-bound' : ''}"><strong>${age}</strong><span>years</span></div>
      <p>${esc(method)}</p>
      ${band ? `<p><span>Study comparison band</span> <span>${band.from}–${band.to}</span></p>` : ''}
    </div>
  </section>`;
}

const row = (label, value) => `<div class="answer-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const filtrationText = value => (value < 60 && value >= 59.95 ? '<60' : value.toFixed(1)) + ' mL/min/1.73 m²';
function derivedRows(type, inputs, result, review) {
  if (type === 'kidney') return [
    review.egfr !== undefined ? row('eGFR from creatinine', filtrationText(review.egfr)) : '',
    review.egfrCombined !== undefined ? row('eGFR from creatinine and cystatin C', filtrationText(review.egfrCombined)) : '',
  ].join('');
  if (type === 'fitness' && result.status === 'ready' && review.estimatedVo2 !== undefined) return row('Estimated VO₂peak', review.estimatedVo2.toFixed(1) + ' mL/kg/min');
  if (type === 'fitness' && result.method === 'FRIEND') return row('Measured VO₂peak', inputs.vo2peak.value + ' mL/kg/min');
  if (type === 'metabolic' && result.method === 'GDRS with HbA1c') return row('HbA1c used', valueText(systemField(type, 'hba1c'), inputs.hba1c));
  return '';
}

function measurementRows(type, inputs, review) {
  return Object.entries(inputs).map(([id, entry]) => {
    const field = systemField(type, id);
    if (!field) return '';
    const info = review.fields[id];
    const feedback = field.lab && info ? measurementFeedbackMarkup(field, entry, info, {showSource:true}) : '';
    return `<div class="answer-row heart-measurement-row"><dt>${esc(field.label)}</dt><dd>${esc(valueText(field, entry))}</dd>
      ${feedback ? `<dd class="heart-measurement-review">${feedback}</dd>` : ''}</div>`;
  }).join('');
}

function extraActions(type, inputs) {
  return `<div class="system-extras no-print">${systemExtras(type).map(extra => {
    const entered = extra.fields.some(id => inputs[id] !== undefined);
    return `<button class="record-summary" type="button" data-action="system-extra" data-part="${extra.id}">
      <span class="record-icon">${uiIcon(extra.specialist ? 'science' : 'drop')}</span>
      <span><strong>${esc(entered ? extra.change : extra.action)}</strong>
      ${extra.specialist ? `<small><span>Specialist test</span> · <span>${esc(extra.benefit)}</span></small>` : ''}</span>${uiIcon('arrow')}
    </button>`;
  }).join('')}</div>`;
}

function followUp(type, result, saved) {
  if (result.status === 'missing') return `<section class="report-explanation heart-missing">
    <h2>Finish your age estimate</h2><p>Add the remaining details to see your comparison.</p>
    <ul>${result.missing.map(id => `<li>${esc(systemField(type, id).label)}</li>`).join('')}</ul>
    ${saved ? '' : '<button class="btn no-print" data-action="system-finish">Add missing details ↗</button>'}
  </section>`;
  const [message, action, part] = nextSteps[result.issue];
  return `<section class="report-explanation"><h2>What you can do next</h2><p>${esc(message)}</p>
    ${saved ? '' : `<button class="text-btn no-print" data-action="system-edit" data-part="${esc(result.edit || part)}">${esc(action)} ↗</button>`}
  </section>`;
}

const methodCopy = {
  metabolic:[
    'The German Diabetes Risk Score estimates the 10-year chance of developing type 2 diabetes in adults aged 18–79. The published HbA1c equation uses the same outcome. Blood sugar readings at diabetes testing thresholds prompt review.',
    'The app matches the predicted risk to the same lower-risk reference at different ages. The reference uses your height, waist equal to half that height, no known hypertension or family history, no smoking, five hours of activity per week, 100 g of whole grain bread or muesli, one coffee and no red meat per day.',
    'The equations come from German cohorts. The age is a comparison using that reference. A laboratory HbA1c can change the estimate. Fasting glucose adds context, and recent blood loss, transfusion or some blood conditions can affect HbA1c.',
    'Your lab interval comes first. If it is missing, the app uses the ADA HbA1c screening threshold and the ABIM fasting glucose guide when applicable.',
  ],
  kidney:[
    'CKD-EPI 2021 uses blood creatinine, age at the draw and sex to estimate filtration (eGFR). The app matches it to same-sex European reference medians from ages 20–79 using the same equation.',
    'This age describes a filtration comparison. A single result cannot establish whether a change is persistent. Estimated filtration is less precise at higher values, and a clinician may use more than one equation for ages 18–25.',
    'Cystatin C from the same draw adds a combined CKD-EPI estimate. The age comparison stays on the creatinine reference. Urine ACR helps check for kidney damage and can prompt review at any eGFR.',
    'Your lab interval comes first. Published comparisons use ABIM for creatinine, Mayo Clinic Laboratories for cystatin C and KDIGO for urine ACR.',
  ],
  fitness:[
    'For ages 20–89, HUNT estimates oxygen uptake from waist, resting pulse and activity. The app matches the estimate to HUNT age-group averages.',
    'Ages 18–19 use Bradshaw’s equation with body measurements, comfortable pace and activity. Ages 90–96 use the equation recalibrated in the Baltimore Longitudinal Study of Aging. Both estimates are matched to FRIEND treadmill references. Evidence is thinner at the oldest ages.',
    'A supervised treadmill or cycle test can be matched to the adult FRIEND comparison groups aged 20–89. We use typical values for the same test and sex when peak RER is at least 1.0.',
    'The age describes aerobic fitness. Estimated and measured oxygen uptake use different reference groups, so adding a test can move the comparison.',
  ],
};

export const systemMethods = type => methodCopy[type].map(paragraph => `<p>${esc(paragraph)}</p>`).join('');

export function renderSystemReport({type, system, saved, sample, hasDraftBackup, pagesPreview, sourceLinks, tab = 'summary'}) {
  const spec = systemAssessment(type);
  const {inputs, result, review} = system;
  const ready = result.status === 'ready';
  const derived = derivedRows(type, inputs, result, review);
  const readings = derived+measurementRows(type, Object.fromEntries(Object.entries(inputs).filter(([id]) => systemField(type, id).lab || id === 'vo2peak')), review);
  const panels = {
    summary:`${ready ? ageReadout(type, result) : followUp(type, result, saved)}
      ${ready ? `<section class="report-explanation"><h2>What this tells you</h2><p>${esc(resultCopy[result.version][1])}</p>${derived ? `<dl>${derived}</dl>` : ''}</section>` : ''}
      ${review.a1cOutside ? '<p class="heart-reading-context">HbA1c is below the app’s calculation range. The age uses your questionnaire and body measurements.</p>' : ''}
      ${review.testIncomplete ? '<p class="heart-reading-context">For a measured comparison, check the test type and peak RER on your report.</p>' : ''}
      ${!ready && readings ? `<section class="heart-reading"><h2>Readings to review</h2><dl>${readings}</dl></section>` : ''}
      ${sample ? '' : saved ? '<button class="text-btn no-print" data-action="system-copy">Update from this report ↗</button>' : result.issue === 'fitness-age' ? '' : extraActions(type, inputs)}`,
    measurements:`<section class="heart-reading"><h2>Your answers and measurements</h2><dl>${derived}${measurementRows(type, inputs, review)}</dl>
      ${saved || sample ? '' : '<button class="text-btn no-print" data-action="system-edit" data-part="age" data-review-all>Review answers ↗</button>'}</section>`,
    methods:`<section class="report-explanation"><h2>How this comparison works</h2>${systemMethods(type)}${sourceLinks(spec.sources)}</section>`,
  };
  const tabs = [['summary','Summary'], ['measurements','Measurements'], ['methods','Methods']];
  const selected = Object.hasOwn(panels, tab) ? tab : 'summary';
  return `<div class="wrap app-screen report-workspace system-report">
    <header class="report-heading" data-theme-part><div><span class="eyebrow">${sample ? 'ILLUSTRATIVE SAMPLE' : 'ASSESSMENT REPORT'}</span><h1>${esc(spec.title)}</h1>${saved ? '<p>Saved assessment</p>' : ''}</div>
    <div class="report-tools no-print">${!saved && !pagesPreview ? '<button class="text-btn" data-action="save">Save</button>' : ''}<button class="text-btn" data-action="print">${uiIcon('report')}<span>PDF</span></button></div></header>
    ${sample && hasDraftBackup ? '<button class="text-link no-print" data-action="restore-draft">Return to your assessment</button>' : ''}
    <nav class="report-tabs heart-report-tabs no-print" aria-label="Report sections">${tabs.map(([id, label]) => `<button type="button" data-action="report-tab" data-tab="${id}"${id === selected ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
    <article class="report-paper">${tabs.map(([id, label]) => `<section class="report-panel" data-report-panel="${id}" aria-label="${label}"${id === selected ? '' : ' hidden'}>${panels[id]}</section>`).join('')}
      <p class="print-only report-footnote">Educational report. Prepared automatically.</p>
    </article>
    <p class="report-footnote">Educational estimates · Not clinically reviewed.</p>
  </div>`;
}
