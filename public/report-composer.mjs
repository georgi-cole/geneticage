import {composeEditorialReport} from './report-editorial.mjs';
import {fitnessContext} from './fitness-assessment.mjs';
import {sections, profileSectionsV1, legacySections, ASSESSMENT_PROTOCOL, insights} from './model.mjs';
import {labs} from './lab-definitions.mjs';
import {CONTENT_VERSION, references} from './evidence.mjs';
import {provided} from './assessment-flow.mjs';
import {reviewLabReference, labReferenceGroup} from './lab-review.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {heartSources, heartLimitations, HEART_ASSESSMENT} from './heart-vascular.mjs';
import {systemAssessment, systemField, systemSteps} from './system-assessments.mjs';
import {reportPhrase as phrase, REPORT_CONTENT_VERSION} from './report-content.mjs';

export const REPORT_DOCUMENT_VERSION = 'personal-report-v1';

const sourceIds = new Set(references.map(reference => reference.id));
const compared = status => ['above', 'below', 'within'].includes(status);
const outside = status => ['above', 'below'].includes(status);
const known = value => provided(value) && !['Not sure', 'Prefer not to say'].includes(value);
const numeric = value => known(value) && Number.isFinite(Number(value));
const unique = values => [...new Set(values.filter(value => value !== undefined && value !== null && value !== ''))];
const copy = value => JSON.parse(JSON.stringify(value));

function questionnaireSections(state) {
  if (!state.savedReport) return sections;
  if ((state.contentVersion || state.savedReport.contentVersion) !== CONTENT_VERSION) return legacySections;
  return (state.assessmentProtocol || state.savedReport.assessmentProtocol) === ASSESSMENT_PROTOCOL ? sections : profileSectionsV1;
}

function questionCoverage(state) {
  const answers = state.answers || {};
  const groups = questionnaireSections(state).map(section => {
    const applicable = section.questions.filter(question => !question.show || question.show(answers));
    return {name:section.name, answered:applicable.filter(question => provided(answers[question.id])).length, total:applicable.length};
  });
  return {answered:groups.reduce((sum, group) => sum + group.answered, 0), total:groups.reduce((sum, group) => sum + group.total, 0), groups};
}

function documentBuilder(state, type, resultState, generatedAt, result = {}) {
  const facts = new Map();
  const sections = [];
  return {
    fact(id, value, unit = null, provenance = {}) {
      if (value !== undefined) facts.set(id, {id, value:copy(value), unit, provenance:{path:id, ...provenance}});
      return id;
    },
    section(id, kind, title, paragraphs, sources = [], factIds = []) {
      const content = unique(paragraphs.filter(paragraph => typeof paragraph === 'string' && paragraph.trim()));
      if (content.length) sections.push({id, kind, title, paragraphs:content, sources:unique(sources).filter(id => sourceIds.has(id)), factIds:unique(factIds).filter(id => facts.has(id))});
    },
    finish(coverage) {
      const usedSourceIds = unique(sections.flatMap(section => section.sources));
      return {
        version:REPORT_DOCUMENT_VERSION, type, generatedAt,
        modelVersion:state.model || state.modelVersion || state.savedReport?.model || result.version || null,
        contentVersion:REPORT_CONTENT_VERSION,
        assessmentContentVersion:state.contentVersion || state.savedReport?.contentVersion || CONTENT_VERSION,
        questionnaireVersion:state.assessmentProtocol || state.savedReport?.assessmentProtocol || (type === 'health-profile' || type === 'clinical-phenoage' ? ASSESSMENT_PROTOCOL : null),
        clinicalReview:false, resultState, sections, facts:[...facts.values()], coverage,
        sourceIds:usedSourceIds,
        citations:usedSourceIds.map(id => {const reference = references.find(item => item.id === id); return {id, label:reference.label, url:reference.url};}),
      };
    },
  };
}

function baseFacts(builder, state, clinical) {
  const answers = state.answers || {};
  for (const key of Object.keys(answers).sort()) builder.fact('answers.' + key, answers[key], null, {kind:'self-reported'});
  for (const key of ['labAge', 'labDate', 'labFasting', 'labContext', 'labReferenceGroup', 'labReferenceVersion']) {
    if (state[key] !== undefined) builder.fact(key, state[key], key === 'labAge' ? 'years' : null, {kind:'collection-context'});
  }
  const comparisons = {};
  for (const lab of labs) {
    const entry = state.lab?.[lab.id];
    if (!provided(entry?.value)) continue;
    const id = 'lab.' + lab.id;
    builder.fact(id, entry.value, entry.unit || lab.units[0], {kind:'entered-measurement', sampleDate:state.labDate || null});
    const comparison = reviewLabReference(lab.id, entry, state);
    comparisons[lab.id] = comparison;
    builder.fact(id + '.reference', comparison.status, comparison.unit || null, {
      kind:'reference-comparison', inputFactId:id, label:comparison.label, reason:comparison.reason || null, threshold:comparison.threshold===true, sourceKind:comparison.sourceKind || null,
      sourceVersion:comparison.sourceVersion || null, sourceUrl:comparison.sourceUrl || null,
      comparisonValue:Number.isFinite(comparison.comparisonValue) ? comparison.comparisonValue : null,
      low:comparison.low ?? null, high:comparison.high ?? null,
      lowExclusive:comparison.lowExclusive === true, highExclusive:comparison.highExclusive === true,
      assay:entry.assay || null,
      referenceGroup:lab.id === 'creatinine' && comparison.sourceKind === 'published' ? labReferenceGroup(state) : null,
      referenceGroupSource:lab.id === 'creatinine' && comparison.sourceKind === 'published' ? state.labReferenceGroup != null ? 'labReferenceGroup' : 'answers.sex' : null,
    });
  }
  for (const key of ['value', 'gap']) if (Number.isFinite(clinical?.[key])) builder.fact('clinical.' + key, clinical[key], 'years', {kind:'supplied-result'});
  if (clinical?.reason) builder.fact('clinical.reason', clinical.reason, null, {kind:'supplied-result'});
  return comparisons;
}

function warningSections(builder, warnings) {
  for (const [index, item] of warnings.filter(item => item?.warning?.message).entries()) {
    const id = item.factId || 'review.warning.' + index;
    builder.fact(id, item.warning.message, null, {kind:'supplied-safety-review', sourceUrl:item.warning.url || null});
    builder.section('safety-' + index, 'context', phrase('safetyTitle'), [item.warning.message], item.sources || ['critical-mayo', 'critical-crouse'], [id]);
  }
}

function referenceContext(builder, state, comparisons) {
  const paragraphs = [], facts = [], sources = ['lab-intervals'];
  const lymph = comparisons.lymphocytes;
  if (outside(lymph?.status)) {
    paragraphs.push(phrase('lymphocytesContext', {value:state.lab.lymphocytes.value}), phrase('lymphocytesPlan'));
    facts.push('lab.lymphocytes', 'lab.lymphocytes.reference');
    if (lymph.sourceKind === 'published') sources.push('adult-intervals');
  }
  if (comparisons.crp?.status === 'unknown') {
    paragraphs.push(phrase('crpContext', {value:state.lab.crp.value, unit:state.lab.crp.unit || labs.find(lab => lab.id === 'crp').units[0]}));
    facts.push('lab.crp', 'lab.crp.reference');
  }
  if (comparisons.creatinine?.label === 'Reference group needed') {
    paragraphs.push(phrase('creatinineContext', {value:state.lab.creatinine.value, unit:state.lab.creatinine.unit || labs.find(lab => lab.id === 'creatinine').units[0]}));
    facts.push('lab.creatinine', 'lab.creatinine.reference');
  }
  if (Object.entries(comparisons).some(([id, item]) => item.status === 'unknown' && id !== 'crp' && !(id === 'creatinine' && item.label === 'Reference group needed'))) {
    paragraphs.push(phrase('referenceMissing'));
    facts.push(...Object.entries(comparisons).filter(([, item]) => item.status === 'unknown').map(([id]) => 'lab.' + id + '.reference'));
  }
  builder.section('reference-context', 'context', phrase('referenceTitle'), paragraphs, sources, facts);
}

function profileCandidates(state, comparisons, existing) {
  const answers = state.answers || {}, candidates = [];
  const find = key => existing.find(item => item.key === key);
  const add = (id, title, paragraphs, plan, sources, factIds) => candidates.push({id, title, paragraphs, plan, sources, factIds});
  for (const key of ['tobacco', 'weight-change']) {
    const finding = find(key);
    if (finding) add(key, finding.name, [finding.text], finding.action, finding.sources || [], key === 'tobacco' ? ['answers.smoking', 'answers.nicotine'] : ['answers.weight', 'answers.weightYearAgo', 'answers.weightChangeIntent']);
  }
  if (comparisons.glucose?.status === 'above' && state.labFasting === 'Yes') {
    const entry = state.lab.glucose;
    add('glucose', phrase('glucoseTitle'), [phrase(comparisons.glucose.sourceKind === 'lab' ? 'glucoseOwn' : 'glucoseGuide', {value:entry.value, unit:entry.unit || labs.find(lab => lab.id === 'glucose').units[0]}), phrase('glucoseContext')], phrase('glucosePlan'), ['diabetes-diagnosis', 'lab-intervals', ...(comparisons.glucose.sourceKind === 'published' ? ['adult-intervals'] : [])], ['lab.glucose', 'lab.glucose.reference', 'labFasting']);
  }
  // Other outlying readings remain explicit without inventing a severity score.
  const other = labs.filter(lab => lab.id !== 'lymphocytes' && !(lab.id === 'glucose' && comparisons.glucose?.status === 'above' && state.labFasting === 'Yes') && outside(comparisons[lab.id]?.status) && !comparisons[lab.id]?.threshold);
  if (other.length) {
    const lab = other[0], entry = state.lab[lab.id], comparison = comparisons[lab.id];
    add('measurement-' + lab.id, lab.name, [phrase(comparison.sourceKind === 'lab' ? 'otherLabOwn' : 'otherLabGuide', {value:entry.value, unit:entry.unit || lab.units[0]}), phrase('otherLabContext')], phrase('otherLabContext'), ['lab-intervals', ...(comparison.sourceKind === 'published' ? ['adult-intervals'] : [])], ['lab.' + lab.id, 'lab.' + lab.id + '.reference']);
  }
  const movement = find('movement'), strength = find('strength');
  if (movement) {
    const adapted = movement.tag === 'Adapt activity to your health';
    const paragraphs = adapted ? [phrase('adaptedMovement')] : [phrase('movementBaseline', {minutes:answers.moderate, vigorous:answers.vigorous}), phrase('movementGuidance')];
    if (!adapted && comparisons.glucose?.status === 'above' && state.labFasting === 'Yes') paragraphs.push(phrase('movementGlucose'));
    if (!adapted && strength) paragraphs.push(phrase(Number(answers.strength) === 1 ? 'strengthOne' : 'strengthMany', {days:answers.strength}));
    add('movement', phrase(adapted ? 'adaptedTitle' : 'movementTitle'), paragraphs, phrase(adapted ? 'adaptedPlan' : 'movementPlan'), ['activity'], ['answers.moderate', 'answers.vigorous', 'answers.strength', 'answers.limitations', 'answers.context', 'answers.illness', 'lab.glucose']);
  } else if (strength) {
    add('strength', phrase('strengthTitle'), [phrase(Number(answers.strength) === 1 ? 'strengthOne' : 'strengthMany', {days:answers.strength})], phrase('strengthPlan'), ['activity'], ['answers.strength']);
  }
  if (find('sleep')) {
    const paragraphs = [];
    if (numeric(answers.sleep)) paragraphs.push(phrase('sleepDuration', {hours:answers.sleep}));
    if (answers.rested === 'Sometimes') paragraphs.push(phrase('sleepSometimes'));
    if (answers.rested === 'Rarely') paragraphs.push(phrase('sleepRarely'));
    if (answers.disrupted === 'Yes') paragraphs.push(phrase('sleepDisrupted'));
    add('sleep', phrase('sleepTitle'), paragraphs, phrase('sleepPlan'), ['sleep'], ['answers.sleep', 'answers.rested', 'answers.disrupted']);
  }
  if (find('diet')) add('diet', phrase('dietTitle'), [phrase('dietBaseline', {portions:answers.diet})], phrase('dietPlan'), ['diet'], ['answers.diet']);
  const stress = find('wellbeing');
  if (stress) add('wellbeing', stress.name, [stress.text], stress.action, stress.sources || [], ['answers.stress']);
  // Drinking is described from its amount/frequency, not just the yes/no flag.
  // It is an optional contextual priority, never a generic withdrawal headline.
  if (find('alcohol')) {
    const paragraphs = [];
    if (numeric(answers.alcoholDays)) paragraphs.push(phrase(Number(answers.alcoholDays) === 1 ? 'alcoholDay' : 'alcoholDays', {days:answers.alcoholDays}));
    const drinks = answers.drinks || [];
    const completeAmounts = drinks.length > 0 && drinks.every(drink => ['count', 'ml', 'abv'].every(key => numeric(drink[key])));
    if (drinks.length === 1 && completeAmounts) {
      const drink = drinks[0];
      paragraphs.push(phrase(Number(drink.count) === 1 ? 'alcoholServingOne' : 'alcoholServingMany', {count:drink.count, volume:drink.ml, strength:drink.abv}));
    } else if (completeAmounts) paragraphs.push(phrase('alcoholRecorded'));
    if (!completeAmounts || !numeric(answers.alcoholDays)) paragraphs.push(phrase('alcoholIncomplete'));
    paragraphs.push(phrase('alcoholContext'));
    add('alcohol', phrase('alcoholTitle'), paragraphs, phrase('alcoholPlan'), ['alcohol'], ['answers.alcohol', 'answers.alcoholDays', 'answers.drinks']);
  }
  return candidates;
}

function profileStrengths(builder, state, selected, existing) {
  const answers = state.answers || {}, paragraphs = [], sources = [], facts = [];
  if (answers.smoking === 'Not at all') {
    const noNicotine = Array.isArray(answers.nicotine) && answers.nicotine.length === 1 && answers.nicotine[0] === 'None';
    paragraphs.push(phrase(noNicotine ? 'strengthNoSmoking' : 'strengthNoCigarettes'));
    sources.push('tobacco'); facts.push('answers.smoking', 'answers.nicotine');
  }
  const weightUnit = answers.weightUnit || 'kg', previousUnit = answers.weightYearAgoUnit || 'kg';
  if (numeric(answers.weight) && numeric(answers.weightYearAgo) && weightUnit === previousUnit && Number(answers.weight) === Number(answers.weightYearAgo)) {
    paragraphs.push(phrase('strengthWeight')); facts.push('answers.weight', 'answers.weightYearAgo');
  }
  if (!selected.some(item => item.id === 'movement') && numeric(answers.moderate) && numeric(answers.vigorous) && Number(answers.moderate) + Number(answers.vigorous) > 0) {
    paragraphs.push(phrase('strengthActivity', {minutes:answers.moderate, vigorous:answers.vigorous}));
    sources.push('activity'); facts.push('answers.moderate', 'answers.vigorous');
  }
  if (!paragraphs.length && numeric(answers.moderate) && numeric(answers.vigorous) && numeric(answers.sleep) && known(answers.rested) && !existing.some(item => ['movement', 'sleep'].includes(item.key))) {
    paragraphs.push(phrase('strengthRoutine')); sources.push('activity', 'sleep');
    facts.push('answers.moderate', 'answers.vigorous', 'answers.sleep', 'answers.rested');
  }
  builder.section('foundations', 'strength', phrase('strengthsTitle'), paragraphs.slice(0, 2), sources, facts);
}

function composeBase(state, suppliedClinical, priorities, generatedAt) {
  const clinical = clinicalForDisplay(suppliedClinical || state.clinical || state.savedReport?.clinical || null, {stored:!!state.savedReport});
  const entered = labs.filter(lab => provided(state.lab?.[lab.id]?.value)).length;
  const questions = questionCoverage(state);
  const clinicalType = !!clinical || state.labSubmitted || entered > 0;
  const warnings = (clinical?.checks || []).filter(check => check.warning).map(check => ({warning:check.warning, factId:'clinical.checks.' + check.id, sources:check.warning.code === 'critical-wbc-low' ? ['critical-crouse'] : ['critical-mayo']}));
  const resultState = clinical?.reason || warnings.length ? 'withheld' : Number.isFinite(clinical?.value) ? 'ready' : clinicalType || !questions.answered ? 'missing' : 'profile';
  const builder = documentBuilder(state, clinicalType ? 'clinical-phenoage' : 'health-profile', resultState, generatedAt);
  const comparisons = baseFacts(builder, state, clinical);
  const intro = [], introFacts = [], introSources = [];
  let title = 'introProfile';
  if (resultState === 'ready') {
    title = 'introClinical';
    if (numeric(state.labAge)) {
      intro.push(phrase('phenoResult', {age:state.labAge, value:Math.round(clinical.value)}));
      introFacts.push('labAge', 'clinical.value');
    } else intro.push(phrase('phenoMeaning'));
    if (Number.isFinite(clinical.gap)) {
      const gap = Math.round(clinical.gap);
      intro.push(phrase(gap > 0 ? 'gapHigher' : gap < 0 ? 'gapLower' : 'gapSimilar', {difference:Math.abs(gap)}));
      introFacts.push('clinical.gap');
    }
    intro.push(phrase('phenoHabits')); introSources.push('phenoage', 'validation');
  } else if (resultState === 'withheld') {
    title = 'introWithheld'; intro.push(phrase('withheldIntro'), clinical?.reason);
    introFacts.push('clinical.reason'); introSources.push('phenoage', 'validation');
  } else if (clinicalType) {
    title = 'introMissing'; intro.push(phrase('missingClinical'));
  } else if (!questions.answered) {
    title = 'introMissing'; intro.push(phrase('emptyIntro'));
  } else intro.push(phrase('profileIntro'), phrase('profileLimit'));
  builder.section('introduction', 'intro', phrase(title), intro, introSources, introFacts);
  warningSections(builder, warnings);
  const existing = Array.isArray(priorities) ? priorities : insights(state.answers || {});
  const candidates = warnings.length ? [] : profileCandidates(state, comparisons, existing);
  const selected = candidates.slice(0, 3);
  for (const item of selected) builder.section(item.id, 'priority', item.title, item.paragraphs, item.sources, item.factIds);
  if (!warnings.length) profileStrengths(builder, state, selected, existing);
  if (!warnings.length && !selected.length && questions.answered && resultState !== 'withheld') {
    builder.section('profile-scope', 'context', phrase('referenceTitle'), [phrase('noPriorities')]);
  }
  referenceContext(builder, state, comparisons);
  const uncertain = Object.values(state.answers || {}).some(value => ['Not sure', 'Prefer not to say'].includes(value) || Array.isArray(value) && value.some(item => ['Not sure', 'Prefer not to say'].includes(item)));
  if (questions.answered < questions.total || uncertain) builder.section('profile-coverage', 'context', phrase('partialTitle'), [phrase('partialProfile')]);
  const plans = selected.map(item => item.plan);
  if (!plans.length && !warnings.length) plans.push(phrase(resultState === 'missing' ? 'planMissing' : 'planNoPriority'));
  if (plans.length) builder.section('next-steps', 'plan', phrase('planTitle'), plans, selected.flatMap(item => item.sources), selected.flatMap(item => item.factIds));
  return builder.finish({questions, measurements:{entered, required:clinicalType ? 9 : 0, compared:Object.values(comparisons).filter(item => compared(item.status)).length}});
}

const systemReviewCopy = {
  'metabolic-age':'The age equation was tested through age 79. If you have an HbA1c or fasting glucose result, you can review it here and discuss any follow-up with your clinician.',
  'diabetes-known':'The model estimates the chance of developing type 2 diabetes. If you already have diabetes, ask your care team which HbA1c target fits your situation.',
  'metabolic-pregnancy':'Pregnancy changes how blood sugar is assessed. Ask your care team about the glucose testing that applies during pregnancy.',
  'glucose-review':'A reading reaches a diabetes testing threshold. Check the units and ask your clinician whether to repeat the test before using a risk age.',
  'glucose-critical':'This fasting glucose result needs attention before an age comparison.',
  'kidney-collection':'Pregnancy or a recent illness or kidney injury can make creatinine-based estimates unreliable. A result from a stable time may be more informative.',
  'kidney-treatment':'Dialysis and transplant care need a separate interpretation of kidney function. Review your lab results with your kidney care team.',
  'kidney-filtration':'The filtration estimate is below 60. Ask your clinician about repeat eGFR and urine ACR to understand what is causing the change.',
  'kidney-albumin':'The urine ACR reaches the threshold for raised urine albumin. Ask your clinician whether to repeat it.',
  'kidney-history':'A filtration age can hide the significance of known kidney disease. Repeat filtration and urine albumin results help your clinician assess changes over time.',
  'fitness-age':'The questionnaire equations were studied through age 96. If you have a supervised fitness result, you can compare it with the adult study groups.',
  'fitness-context':'A health condition or medicine can change resting pulse and the estimate. A compatible supervised test can provide a comparison if you have one.',
  'fitness-values':'The estimated oxygen uptake is outside the calculation range. Check your measurements and units.',
};

function familyFacts(builder, type, inputs, result, review) {
  for (const key of Object.keys(inputs).sort()) {
    const entry = inputs[key], measurement = entry && typeof entry === 'object' && !Array.isArray(entry) && Object.hasOwn(entry, 'value');
    builder.fact(type + '.inputs.' + key, measurement ? entry.value : entry, measurement ? entry.unit || null : null, {kind:measurement ? 'entered-measurement' : 'self-reported'});
  }
  for (const key of ['age', 'ageBand', 'ageRange', 'boundary', 'risk', 'region', 'method', 'version', 'issue', 'reason', 'missing']) {
    if (result[key] !== undefined) builder.fact(type + '.result.' + key, result[key], ['age', 'boundary'].includes(key) ? 'years' : key === 'risk' ? '%' : null, {kind:'supplied-result'});
  }
  for (const key of ['egfr', 'egfrCombined', 'estimatedVo2']) if (Number.isFinite(review[key])) builder.fact(type + '.review.' + key, review[key], key === 'estimatedVo2' ? 'mL/kg/min' : 'mL/min/1.73 m²', {kind:'supplied-result'});
}

function familyCoverage(type, inputs, result, review) {
  const measurements = Object.entries(inputs).filter(([, entry]) => entry && typeof entry === 'object' && !Array.isArray(entry) && provided(entry.value));
  // These families do not use the health-profile questionnaire. Do not invent
  // an overall questionnaire-completeness denominator for a conditional route.
  const questions = {answered:0, total:0, groups:[]};
  let required = null;
  if (systemAssessment(type)) {
    const fields = unique(systemSteps(type, inputs).flatMap(step => step.fields));
    required = fields.filter(id => {const field = systemField(type, id); return field && !field.options && !field.optional;}).length;
  }
  return {questions, measurements:{entered:measurements.length, required, compared:Object.values(review.fields || {}).filter(field => compared(field.comparison?.status)).length}, missingInputs:copy(result.missing || [])};
}

function composeFamily(state, generatedAt) {
  const type = state.assessmentType, family = type === HEART_ASSESSMENT ? state.heart || {} : state.system || {};
  const {inputs = {}, result = {}, review = {}} = family;
  const warnings = Object.entries(review.fields || {}).filter(([, field]) => field.check?.warning).map(([id, field]) => ({warning:field.check.warning, factId:type + '.review.' + id + '.warning', sources:['critical-mayo']}));
  if (review.pressureWarning) warnings.unshift({warning:review.pressureWarning, factId:type + '.review.pressureWarning', sources:['esc-blood-pressure']});
  const missing = result.status === 'missing' || Array.isArray(result.missing) && result.missing.length > 0;
  const ready = !warnings.length && !result.reason && !result.issue && (result.status === 'ready' || type === HEART_ASSESSMENT && !!result.method);
  const resultState = warnings.length ? 'withheld' : ready ? 'ready' : missing || !Object.keys(result).length ? 'missing' : 'withheld';
  const builder = documentBuilder(state, type, resultState, generatedAt, result);
  familyFacts(builder, type, inputs, result, review);
  const sources = type === HEART_ASSESSMENT ? heartSources(result, review) : systemAssessment(type).sources;
  const facts = [], intro = [];
  let title = type === HEART_ASSESSMENT ? 'heartTitle' : type + 'Title';
  if (!ready) {
    title = resultState === 'missing' ? 'introMissing' : 'introWithheld';
    intro.push(phrase(resultState === 'missing' ? 'familyMissing' : 'familyReview'));
    if (result.reason) intro.push(result.reason);
    else if (systemReviewCopy[result.issue]) intro.push(systemReviewCopy[result.issue]);
    facts.push(type + '.result.reason', type + '.result.issue', type + '.result.missing');
  } else if (type === HEART_ASSESSMENT) {
    intro.push(phrase('heartMethod', {method:result.method})); facts.push(type + '.result.method');
    if (result.method === 'Framingham') intro.push(phrase('heartFramingham'));
    else if (result.method === 'PDAY') intro.push(phrase('heartPday'));
    else if (['SCORE2', 'SCORE2-OP', 'SCORE2-Diabetes'].includes(result.method) && Number.isFinite(result.risk)) {
      intro.push(result.risk < 0.1 ? phrase('heartRiskSmall') : phrase('heartRisk', {risk:result.risk.toFixed(1)})); facts.push(type + '.result.risk');
    }
  } else if (type === 'metabolic') {
    intro.push(phrase('metabolicMeaning', {method:result.method === 'GDRS with HbA1c' ? 'GDRS + HbA1c' : result.method})); facts.push(type + '.result.method');
    if (result.method === 'GDRS with HbA1c' && inputs.hba1c) {
      intro.push(phrase('metabolicA1c', {value:inputs.hba1c.value, unit:inputs.hba1c.unit})); facts.push(type + '.inputs.hba1c');
    } else intro.push(phrase('metabolicProfile'));
  } else if (type === 'kidney') {
    intro.push(phrase('kidneyMeaning'));
    if (Number.isFinite(review.egfr)) {intro.push(phrase('kidneyEgfr', {value:review.egfr.toFixed(1)})); facts.push(type + '.review.egfr', type + '.inputs.creatinine');}
    if (Number.isFinite(review.egfrCombined)) {intro.push(phrase('kidneyCombined', {value:review.egfrCombined.toFixed(1)})); facts.push(type + '.review.egfrCombined', type + '.inputs.cystatin');}
  } else if (type === 'fitness') {
    if (result.method === 'FRIEND' && inputs.vo2peak) {
      intro.push(phrase('fitnessMeasured', {value:inputs.vo2peak.value})); facts.push(type + '.inputs.vo2peak', type + '.inputs.testType');
    } else if (Number.isFinite(review.estimatedVo2)) {
      intro.push(phrase('fitnessEstimated', {value:review.estimatedVo2.toFixed(1), method:result.method})); facts.push(type + '.review.estimatedVo2', type + '.result.method');
    }
    if (result.ageBand) {intro.push(phrase('fitnessBand', result.ageBand)); facts.push(type + '.result.ageBand');}
    intro.push(phrase('fitnessMeaning'));
  }
  if (ready && result.ageRange) {intro.push(phrase('familyBound')); facts.push(type + '.result.ageRange', type + '.result.boundary');}
  builder.section('introduction', 'intro', phrase(title), intro, sources, facts);
  warningSections(builder, warnings);
  if (ready && type === HEART_ASSESSMENT && inputs.systolic) {
    builder.section('pressure-context', 'context', phrase('referenceTitle'), [inputs.diastolic ? phrase('heartPressure', {systolic:inputs.systolic.value, diastolic:inputs.diastolic.value}) : phrase('heartSystolic', {value:inputs.systolic.value}), review.pressureFollowUp], ['esc-blood-pressure'], [type + '.inputs.systolic', type + '.inputs.diastolic']);
  }
  if (ready && type === 'kidney' && !inputs.acr) builder.section('kidney-context', 'context', phrase('partialTitle'), [phrase('kidneyNoAcr')], ['kdigo-ckd']);
  if (!warnings.length) {
    const plan = ready ? phrase(type === HEART_ASSESSMENT ? 'heartPlan' : type + 'Plan')
      : resultState === 'missing' ? phrase('planMissing') : type === HEART_ASSESSMENT ? heartLimitations[result.issue]?.next : null;
    if (plan) builder.section('next-steps', 'plan', phrase('planTitle'), [plan], sources, facts);
  }
  return builder.finish(familyCoverage(type, inputs, result, review));
}

/** Compose explanations around supplied results. Never runs an age/risk model. */
export function composeReportDocument({state = {}, clinical = null, priorities, generatedAt = null} = {}) {
  if(state.assessmentType==='fitness'&&state.system?.review?.integrated)return composeFitness(state,generatedAt);
  if(state.assessmentType==='functional')return composeFunctional(state,generatedAt);
  const base = state.assessmentType === HEART_ASSESSMENT || systemAssessment(state.assessmentType)
    ? composeFamily(state, generatedAt) : composeBase(state, clinical, priorities, generatedAt);
  return composeEditorialReport(base, state);
}

function composeFitness(state,generatedAt){
 const {inputs={},result={},review={}}=state.system;
 const builder=documentBuilder(state,'fitness',result.status==='ready'?'ready':result.status==='missing'?'missing':'withheld',generatedAt,result);
 familyFacts(builder,'fitness',inputs,result,review);
 const sources=systemAssessment('fitness').sources;
 for(const section of fitnessContext(inputs,review.integrated))builder.section(section.id,section.id==='fitness-plan'?'plan':'context',section.title,section.paragraphs,sources);
 const domains=review.integrated.physical?.review.domains||[];
 return composeEditorialReport(builder.finish({completed:domains.filter(d=>d.value!==null).length,total:domains.length}),state);
}

function composeFunctional(state,generatedAt){
 const {inputs={},result={},review={}}=state.system||{};
 const builder=documentBuilder(state,'functional',result.status==='ready'?'ready':result.status==='missing'?'missing':'withheld',generatedAt,result);
 familyFacts(builder,'functional',inputs,result,review);
 const sources=systemAssessment('functional').sources;
 builder.section('opening','intro','Your functional profile',[
  result.status==='ready'?`Your estimated functional fitness age is ${result.age} years. Your age today is ${inputs.age.value}. This is a research comparison, so it should not be read as an exact measure of your health or how quickly you are aging.`:'Your completed tests are shown below. A combined fitness age needs the full set of tests; skipped tests are left unscored.',
  'Your results bring together several aspects of physical fitness. Read each test below to see what it measures and how you can work on it.'
 ],sources);
 if(review.expectedChair)builder.section('reference','context','Your chair reference',[
  `Your age-group median: ${review.expectedChair[0]} repetitions. Central 50%: ${review.expectedChair[1]}–${review.expectedChair[2]} repetitions.`,
  ...(review.chairBand?[`Your chair result is closest to the median for ages ${review.chairBand.from}–${review.chairBand.to}. This describes this task, not your whole-body age.`]:[])
 ],['functional-sts']);
 const rounded=value=>Number(Number(value).toFixed(1));
 if(review.bmi!==undefined||inputs.compositionMethod||inputs.bodyFat||inputs.skeletalMuscle)builder.section('body-context','context','Your body measurements',[
  ...(review.bmi===undefined?[]:[`Your BMI is ${rounded(review.bmi)}. BMI compares weight with height. It cannot tell how much of your weight comes from muscle, fat or bone.`,
  'This fitness-age calculation includes BMI because the published model requires it. A higher BMI alone does not show that you have excess body fat or that you should lose weight.']),
  ...(inputs.compositionMethod?[`Your body composition reading was taken using: ${inputs.compositionMethod}.`]:[]),
  ...(inputs.bodyFat?[`Your recorded body fat is ${rounded(inputs.bodyFat.value)}%.`]:[]),
  ...(inputs.skeletalMuscle?[`Your recorded skeletal muscle is ${rounded(inputs.skeletalMuscle.value)}%.`]:[]),
  'Body composition readings add context to BMI. Compare readings from the same method under similar conditions; they do not add or subtract years from this model.'
 ],['functional-bmi']);
 for(const d of review.domains||[]){
  const entry=inputs[d.id];
  const paragraphs=d.value===null
   ? ['You skipped this test. It has not been treated as a score of zero.']
   : [`Your result: ${rounded(entry?.value??d.value)} ${entry?.unit??d.unit}. This helps describe your ${d.domain.toLowerCase()}.`,d.plan];
  builder.section(d.id,'context',d.title,paragraphs,sources,['functional.inputs.'+d.id]);
 }
 builder.section('plan','plan','Your next assessment',[
  'Choose two practical priorities from the completed tasks. Build activity gradually within your capabilities; review pain, falls or exercise symptoms before increasing demands.',
  'Repeat under comparable conditions after a period of practice. Record the same chair, path, test variant, equipment and recovery. A changing comparison is not proof of reversed biological aging.'
 ],['functional-activity']);
 return builder.finish({completed:(review.domains||[]).filter(d=>d.value!==null).length,total:review.domains?.length||5});
}
