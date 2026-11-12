import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {composeReportDocument, REPORT_DOCUMENT_VERSION} from '../public/report-composer.mjs';
import {REPORT_COPY, REPORT_CONTENT_VERSION, reportPhrase} from '../public/report-content.mjs';
import {sampleAnswers, sampleLabs, assessClinical} from '../public/model.mjs';
import {CONTENT_VERSION, references} from '../public/evidence.mjs';
import {freshAssessment} from '../public/assessment-flow.mjs';
import {assessSystem, systemSampleInputs} from '../public/system-assessments.mjs';
import {assessHeartVascular} from '../public/heart-vascular.mjs';
import {translateText} from '../public/language-system.mjs';

const sampleState = () => ({...freshAssessment(), answers:structuredClone(sampleAnswers), lab:sampleLabs(), labAge:'45', labDate:'2026-11-01', labFasting:'Yes', labContext:true, labReferenceGroup:'male', labSubmitted:true});
const clinicalFor = state => assessClinical({age:Number(state.labAge), lab:state.lab, contextConfirmed:state.labContext, fasting:state.labFasting});
const prose = document => document.sections.map(section => section.title + '\n' + section.paragraphs.join('\n')).join('\n');
const section = (document, id) => document.sections.find(item => item.id === id);

test('sample report connects glucose, existing activity and sleep without a generic alcohol headline', () => {
  const state = sampleState(), document = composeReportDocument({state, clinical:clinicalFor(state)});
  assert.equal(document.version, REPORT_DOCUMENT_VERSION);
  assert.equal(document.type, 'clinical-phenoage');
  assert.equal(document.resultState, 'ready');
  assert.deepEqual(document.sections.filter(item => item.kind === 'priority').map(item => item.id), ['glucose', 'movement', 'sleep']);
  assert.match(prose(document), /6\.2 mmol\/L/);
  assert.match(section(document, 'movement').paragraphs.join(' '), /90 minutes/);
  assert.match(section(document, 'movement').paragraphs.join(' '), /one day a week/);
  assert.match(section(document, 'sleep').paragraphs.join(' '), /6\.5 hours/);
  assert.match(section(document, 'foundations').paragraphs.join(' '), /no current cigarette smoking/);
  assert.match(section(document, 'reference-context').paragraphs.join(' '), /absolute lymphocyte count/);
  assert.match(section(document, 'reference-context').paragraphs.join(' '), /assay type/);
  assert.doesNotMatch(prose(document), /withdrawal|1 days|reduce your.*age|years.*caused by/i);
  assert.equal(document.clinicalReview, false);
});

test('coverage counts come from one displayed schema and keep measurement comparisons distinct', () => {
  const state = sampleState(), document = composeReportDocument({state, clinical:clinicalFor(state)});
  const {questions, measurements} = document.coverage;
  assert.equal(questions.answered, 25);
  assert.equal(questions.total, 28);
  assert.equal(questions.answered, questions.groups.reduce((sum, group) => sum + group.answered, 0));
  assert.equal(questions.total, questions.groups.reduce((sum, group) => sum + group.total, 0));
  assert.deepEqual(measurements, {entered:9, required:9, compared:8});
  assert.ok(questions.groups.some(group => group.name === 'Body measurements' && group.answered === 0));
});

test('a mostly positive profile is shorter and does not invent priorities to meet a quota', () => {
  const state = {...freshAssessment(), answers:{...sampleAnswers, moderate:'180', strength:'2', sleep:'8', rested:'Usually', diet:'5 or more', alcohol:'No, I have never drunk alcohol regularly'}};
  const document = composeReportDocument({state});
  assert.equal(document.type, 'health-profile');
  assert.equal(document.resultState, 'profile');
  assert.equal(document.sections.filter(item => item.kind === 'priority').length, 0);
  assert.ok(section(document, 'foundations'));
  assert.match(prose(document), /does not calculate an age/);
  assert.match(prose(document), /No additional priority/);
  assert.doesNotMatch(prose(document), /need to lose weight|insulin resistance|low immunity/i);
});

test('missing and declined information never becomes a favourable finding or an age', () => {
  const empty = composeReportDocument({state:freshAssessment()});
  assert.equal(empty.resultState, 'missing');
  assert.equal(empty.sections.filter(item => item.kind === 'priority').length, 0);
  assert.equal(section(empty, 'foundations'), undefined);
  assert.match(prose(empty), /not enough information/);
  const partial = composeReportDocument({state:{...freshAssessment(), answers:{age:'45', smoking:'Prefer not to say', rested:'Not sure'}}});
  assert.equal(section(partial, 'foundations'), undefined);
  assert.match(prose(partial), /missing or uncertain/);
  assert.doesNotMatch(prose(partial), /no current cigarette smoking|adequate sleep/);
  const missingBlood = composeReportDocument({state:{...freshAssessment(), lab:{glucose:{value:'6.2', unit:'mmol/L'}}}});
  assert.equal(missingBlood.type, 'clinical-phenoage');
  assert.equal(missingBlood.resultState, 'missing');
  assert.doesNotMatch(prose(missingBlood), /estimate is about/);
});

test('critical supplied review takes precedence over ordinary lifestyle priorities', () => {
  const state = sampleState(); state.lab.glucose = {value:'400', unit:'mg/dL'};
  const clinical = clinicalFor(state), document = composeReportDocument({state, clinical});
  assert.equal(clinical.withheld, 'critical-values');
  assert.equal(document.resultState, 'withheld');
  assert.match(prose(document), /seek urgent medical advice/);
  assert.equal(document.sections.filter(item => item.kind === 'priority').length, 0);
  assert.equal(section(document, 'next-steps'), undefined);
  assert.doesNotMatch(prose(document), /estimate is about/);
});

test('composer preserves caller-supplied results, is deterministic and does not mutate inputs', () => {
  const state = sampleState(), before = structuredClone(state);
  const supplied = {value:63.2, gap:18.2};
  const options = {state, clinical:supplied, generatedAt:'2026-11-09T22:00:00.000Z'};
  const first = composeReportDocument(options), second = composeReportDocument(options);
  assert.deepEqual(first, second);
  assert.deepEqual(state, before);
  assert.deepEqual(supplied, {value:63.2, gap:18.2});
  assert.match(prose(first), /estimate is about 63 years/);
  assert.equal(first.facts.find(fact => fact.id === 'clinical.value').value, 63.2);
  assert.equal(first.generatedAt, options.generatedAt);
  assert.equal(composeReportDocument({state, clinical:supplied}).generatedAt, null);
  assert.doesNotMatch(prose(first), /50 years/);
});

test('units and exact reference provenance survive composition without a false hs-CRP interval claim', () => {
  const state = sampleState();
  state.lab.glucose = {value:'111.71284', unit:'mg/dL'};
  state.lab.crp.assay = 'hs-crp';
  const document = composeReportDocument({state, clinical:clinicalFor(state)});
  assert.match(section(document, 'glucose').paragraphs.join(' '), /111\.71284 mg\/dL/);
  assert.equal(document.facts.find(fact => fact.id === 'lab.glucose').unit, 'mg/dL');
  const crp = document.facts.find(fact => fact.id === 'lab.crp.reference');
  assert.equal(crp.provenance.high, 2);
  assert.equal(crp.provenance.highExclusive, true);
  assert.match(crp.provenance.sourceUrl, /800024/);
  assert.equal(section(document, 'measurement-crp'), undefined);
  const creatinine = document.facts.find(fact => fact.id === 'lab.creatinine.reference');
  assert.equal(creatinine.provenance.referenceGroup, 'male');
  assert.equal(creatinine.provenance.referenceGroupSource, 'labReferenceGroup');
  state.labReferenceGroup = 'unspecified'; state.answers.sex = 'Male';
  const unknown = composeReportDocument({state, clinical:clinicalFor(state)}).facts.find(fact => fact.id === 'lab.creatinine.reference');
  assert.equal(unknown.value, 'unknown');
  assert.equal(unknown.provenance.referenceGroup, null);
  assert.equal(unknown.provenance.referenceGroupSource, null);
});

test('every section points to known facts and frozen citation metadata with independent editorial versioning', () => {
  const state = sampleState(), document = composeReportDocument({state, clinical:clinicalFor(state)});
  const ids = new Set(document.facts.map(fact => fact.id));
  for (const item of document.sections) for (const id of item.factIds) assert.ok(ids.has(id), id);
  assert.equal(document.contentVersion, REPORT_CONTENT_VERSION);
  assert.equal(document.assessmentContentVersion, CONTENT_VERSION);
  assert.deepEqual(document.citations.map(citation => citation.id), document.sourceIds);
  for (const citation of document.citations) {
    const current = references.find(reference => reference.id === citation.id);
    assert.deepEqual(citation, {id:current.id, label:current.label, url:current.url});
    assert.match(citation.url, /^https?:\/\//);
  }
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(document)));
});

test('when alcohol is the selected topic its actual amount is retained without a withdrawal inference', () => {
  const answers = {...sampleAnswers, moderate:'180', strength:'2', sleep:'8', rested:'Usually', diet:'5 or more'};
  const document = composeReportDocument({state:{...freshAssessment(), answers}});
  const alcohol = section(document, 'alcohol');
  assert.ok(alcohol);
  assert.match(alcohol.paragraphs.join(' '), /2 days/);
  assert.match(alcohol.paragraphs.join(' '), /one 150 mL serving at 12%/);
  assert.doesNotMatch(alcohol.paragraphs.join(' '), /withdrawal|dependence diagnosis|safe personal limit is/);
  answers.alcoholDays = '1';
  answers.drinks = [...answers.drinks, {type:'Beer', count:1, ml:330, abv:5}];
  const several = section(composeReportDocument({state:{...freshAssessment(), answers}}), 'alcohol');
  assert.match(several.paragraphs.join(' '), /on one day/);
  assert.match(several.paragraphs.join(' '), /for each drink/);
  assert.doesNotMatch(several.paragraphs.join(' '), /not fully recorded|1 days/);
});

test('family reports preserve their own meaning and supplied outputs', () => {
  for (const type of ['metabolic', 'kidney', 'fitness']) {
    const system = assessSystem(type, systemSampleInputs(type));
    assert.equal(system.result.status, 'ready');
    const state = {assessmentType:type, system}, before = structuredClone(state);
    const document = composeReportDocument({state});
    assert.equal(document.type, type); assert.equal(document.resultState, 'ready');
    assert.deepEqual(state, before);
    assert.equal(document.modelVersion, system.result.version);
    assert.ok(document.sections.every(item => item.kind !== 'priority'));
    if (type === 'metabolic') assert.match(prose(document), /does not directly measure the age of your metabolism/);
    if (type === 'kidney') {
      assert.match(prose(document), /creatinine-based eGFR/);
      assert.match(prose(document), /No urine albumin-to-creatinine ratio/);
      assert.equal(document.facts.find(fact => fact.id === 'kidney.review.egfr').value, system.review.egfr);
    }
    if (type === 'fitness') assert.match(prose(document), /not a directly measured exercise-test result/);
  }
  const heart = assessHeartVascular({age:50, country:'Germany', sex:'Male', smoking:'Yes', conditions:'No', treatment:'No', systolic:{value:'140', unit:'mmHg'}, total:{value:'5.5', unit:'mmol/L'}, hdl:{value:'1.3', unit:'mmol/L'}});
  const document = composeReportDocument({state:{assessmentType:'heart-vascular', heart}});
  assert.equal(document.resultState, 'ready');
  assert.match(prose(document), /7\.6% over 10 years/);
  assert.match(prose(document), /first heart attack, stroke or cardiovascular death/);
  assert.equal(document.facts.find(fact => fact.id === 'heart-vascular.result.risk').value, heart.result.risk);
});

test('measured fitness, missing families and withheld families retain their distinctions', () => {
  const fitness = {inputs:{vo2peak:{value:'42', unit:'mL/kg/min'}, testType:'Treadmill test'}, result:{status:'ready', method:'FRIEND', version:'friend-2022-fitness-age-v1', age:35, ageBand:{from:30, to:39}}, review:{fields:{}}};
  const measured = composeReportDocument({state:{assessmentType:'fitness', system:fitness}});
  assert.match(prose(measured), /supervised VO₂peak is 42/);
  assert.match(prose(measured), /30–39 years/);
  assert.doesNotMatch(prose(measured), /not a directly measured exercise-test result/);
  for (const type of ['metabolic', 'kidney', 'fitness']) {
    const document = composeReportDocument({state:{assessmentType:type, system:assessSystem(type, {})}});
    assert.equal(document.resultState, 'missing');
    assert.match(prose(document), /needs more information/);
  }
  const kidney = assessSystem('kidney', {...systemSampleInputs('kidney'), kidneyContext:'Pregnancy'});
  const withheld = composeReportDocument({state:{assessmentType:'kidney', system:kidney}});
  assert.equal(withheld.resultState, 'withheld');
  assert.match(prose(withheld), /Pregnancy or a recent illness/);
  assert.doesNotMatch(prose(withheld), /supplied creatinine-based eGFR/);
});

test('all new editorial templates have Bulgarian translations with the same bindings', () => {
  const rows = readFileSync(new URL('../design/localization/bg-report-composer.tsv', import.meta.url), 'utf8').trim().split('\n');
  const translations = new Map(rows.map(row => {const index = row.indexOf('\t'); return [row.slice(0, index), row.slice(index + 1)];}));
  const bindings = text => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort();
  for (const [key, source] of Object.entries(REPORT_COPY)) {
    const translated = translations.get(source);
    assert.ok(translated, key); assert.match(translated, /[А-Яа-я]/, key);
    assert.deepEqual(bindings(translated), bindings(source), key);
    const values = Object.fromEntries(bindings(source).map(name => [name, '42']));
    assert.doesNotMatch(reportPhrase(key, values), /\{[a-zA-Z]/, key);
  }
  assert.throws(() => reportPhrase('not-a-template'), /Unknown report template/);
  assert.throws(() => reportPhrase('phenoResult', {age:45}), /Missing report binding/);
});

test('runtime translation preserves real report values and units in every editorial template', () => {
  const rows = readFileSync(new URL('../design/localization/bg-report-composer.tsv', import.meta.url), 'utf8').trim().split('\n');
  const translations = new Map(rows.map(row => {const index = row.indexOf('\t'); return [row.slice(0, index), row.slice(index + 1)];}));
  const common = {age:'45', value:'6.2', unit:'mmol/L', difference:'5', minutes:'90', vigorous:'0', days:'2', hours:'6.5', portions:'3–4', count:'2', volume:'150', strength:'12', method:'HUNT', risk:'7.6', systolic:'130', diastolic:'80', from:'30', to:'39'};
  const overrides = {
    phenoResult:{value:'50'}, lymphocytesContext:{value:'25'}, crpContext:{value:'3', unit:'mg/L'},
    creatinineContext:{value:'90', unit:'µmol/L'}, heartMethod:{method:'SCORE2'}, heartSystolic:{value:'130'},
    metabolicMeaning:{method:'GDRS + HbA1c'}, metabolicA1c:{value:'5.7', unit:'%'},
    kidneyEgfr:{value:'104.4'}, kidneyCombined:{value:'108.2'}, fitnessMeasured:{value:'42'}, fitnessEstimated:{value:'39.6'},
  };
  for (const [key, source] of Object.entries(REPORT_COPY)) {
    const values = {...common, ...overrides[key]};
    const english = reportPhrase(key, values);
    const bulgarian = translations.get(source).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => values[name]);
    assert.equal(translateText(english, 'bg'), bulgarian, key);
    assert.equal(translateText(english, 'en'), english, key);
  }
});
