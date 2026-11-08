import {assessmentReportType,reportTypeName} from '../public/report-products.mjs';
import {sections,legacySections,labs,sampleAnswers,sampleLabs,assessClinical,insights} from '../public/model.mjs';
import {CONTENT_VERSION,references} from '../public/evidence.mjs';
import {clinicalForDisplay} from '../public/lab-safety.mjs';
import {comparisonValueText,labDescriptions,reviewLabReference} from '../public/lab-review.mjs';
import {REFERENCE_CATALOG_VERSION} from '../public/lab-reference-catalog.mjs';
import {HEART_ASSESSMENT,arterialReference,assessHeartVascular,heartAgeReadout,heartLimitations,heartQuestions,heartSources,heartDiagnosisQuestion,heartBpTreatmentQuestion,heartDiabetesMedicineQuestion,heartDiabetesTypeQuestion,heartDiabetesDamageQuestion,heartSmokingFields} from '../public/heart-vascular.mjs';
import {heartMeasurements} from '../public/heart-measurements.mjs';
import {assessSystem,systemAssessment,systemField,systemSampleInputs} from '../public/system-assessments.mjs';
import {filtrationText,systemReviewSteps} from '../public/system-assessment-ui.mjs';

const ageText = (age, boundary, direction) => Number.isFinite(age) ? String(Math.round(age))
  : Number.isFinite(boundary) ? ({above:'>',below:'<','at-least':'≥','up-to':'≤'}[direction] || '≈') + boundary : '';
const readEntry = entry => entry && typeof entry === 'object' && 'value' in entry
  ? [entry.value, entry.unit].filter(Boolean).join(' ')
  : Array.isArray(entry) ? entry.map(item => typeof item === 'object' ? [item.type, item.count, item.ml && item.ml+' mL', item.abv && item.abv+'%'].filter(Boolean).join(' · ') : item).join(', ')
  : String(entry ?? '');
const item = (label, value, notes = [], urls = []) => ({label,value,notes:notes.filter(Boolean),urls:urls.filter(Boolean)});

function measurement(label, entry, {comparison, check, description} = {}) {
  const bounds = comparison?.sourceKind || comparison?.low != null || comparison?.high != null
    ? [comparison.low != null ? (comparison.lowExclusive ? '>' : '≥') + ' ' + comparison.low : '',
       comparison.high != null ? (comparison.highExclusive ? '<' : '≤') + ' ' + comparison.high : ''].filter(Boolean).join('  ·  ') : '';
  const converted = comparison?.unit !== entry.unit && Number.isFinite(comparison?.comparisonValue)
    ? 'Your value in the reference unit: '+comparisonValueText(comparison)+' '+comparison.unit : '';
  const source = comparison?.sourceUrl && {url:comparison.sourceUrl,label:comparison.sourceLabel};
  return {...item(label, readEntry(entry), [
    check?.warning?.message,check?.message,comparison?.label,comparison?.reason,
    bounds && [bounds,comparison.unit,comparison.sourceLabel].filter(Boolean).join('  ·  '),converted,description,
  ], [comparison?.sourceUrl,check?.warning?.url]),source};
}

const methodNotes = {
  phenoage: 'Clinical PhenoAge combines your age at the blood draw with nine routine blood measurements. It compares a pattern in the measurements with the published reference. Laboratory intervals provide separate context for individual readings.',
  profile: 'The health profile compares the answers you entered with selected adult health guidance. Each topic describes the answer or pattern that prompted it.',
  metabolic: 'The German Diabetes Risk Score uses the body measurements, habits and history entered for this assessment. When the HbA1c equation is used, that result contributes to the comparison. Fasting glucose provides separate context.',
  kidney: 'The age comparison uses estimated filtration from creatinine, age and sex. Cystatin C can add a combined filtration estimate. The urine albumin result is a separate check.',
  fitness: 'The comparison matches oxygen uptake to a reference group. For estimates, the equation uses the recorded measurements and activity. A qualifying exercise test uses the reference for its test type.',
};

const followUp = {
  phenoage: 'Were the collection conditions suitable for comparing this result with a future blood draw?',
  profile: 'Which of these topics is most relevant to my health history?',
  metabolic: 'Which parts of my history and readings are most relevant when discussing my metabolic health?',
  kidney: 'How should I interpret the filtration estimate alongside my urine results and previous readings?',
  fitness: 'Would a measured exercise test help answer the question I have about my aerobic fitness?',
  [HEART_ASSESSMENT]: 'How do my blood pressure and lipid results fit into a cardiovascular assessment for me?',
};

function heartMethodNote(method) {
  if (method === 'PDAY') return 'PDAY uses age, sex, blood pressure, cholesterol, smoking, body measurements and glucose or treatment history. Its comparison describes early coronary plaque risk factors.';
  if (method === 'Framingham') return 'The Framingham comparison uses age, sex, smoking, diabetes, blood pressure, blood pressure medicine and routine cholesterol. It matches the estimated risk to a reference profile.';
  return 'SCORE2 models use blood pressure, total and HDL cholesterol, smoking, age and sex. The selected country determines the regional calibration. SCORE2-Diabetes also accounts for diabetes onset, HbA1c and kidney filtration.';
}

function questionnaireRows(assessment, report) {
  const knownSections = (assessment.contentVersion || report.contentVersion) === CONTENT_VERSION ? sections : legacySections;
  return knownSections.flatMap(section => section.questions.flatMap(question => {
    const answer = assessment.answers?.[question.id];
    if (answer === undefined || answer === '' || (Array.isArray(answer) && !answer.length)) return [];
    return [item(question.label, [question.optionLabels?.[answer] || readEntry(answer), assessment.answers[question.id+'Unit'] || question.unit].filter(Boolean).join(' '))];
  }));
}

// Presentation only. A saved report keeps its original calculations and findings.
export function fullReportContent(assessment, report, savedAt) {
  const type = assessmentReportType(assessment), title = reportTypeName(type);
  let age = '', ageLabel = 'Approximate age', ageAtMeasurement, method, note = methodNotes[type], reason, band, comparison = [], inputRows = [], measurements = [];
  if (type === HEART_ASSESSMENT) {
    const {inputs, result, review} = report.heart || assessment.heart;
    const readout = heartAgeReadout(result);
    age = result.reason ? '' : ageText(readout.age,readout.boundary,readout.direction);
    band = readout.band;
    method = result.method;
    note = method && heartMethodNote(method);
    reason = result.reason;
    const arterial = review?.arterialAge;
    if (arterial) {
      const arterialAge = ageText(arterial.age,arterial.ageRange==='above'?arterialReference.maxAge:arterialReference.minAge,arterial.ageRange);
      const arterialNote = 'Your clinic pulse-wave measurement is compared with adult reference values for arterial stiffness.';
      if (age) comparison.push(item('Arterial stiffness age',arterialAge,[arterialNote]));
      else {
        age = arterialAge; ageLabel = 'Arterial stiffness age';
        method = 'LEAD'; note = arterialNote;
        if (reason) comparison.push(item('Vascular risk estimate',reason));
        reason = '';
      }
    }
    ageAtMeasurement = inputs.age;
    if (Number.isFinite(result.risk) && /^SCORE2/.test(method || '')) comparison.push(item('Estimated 10-year cardiovascular risk', result.risk.toFixed(1) + '%'));
    measurements = heartMeasurements.filter(field => inputs[field.id]).map(field => measurement(field.label, inputs[field.id], review?.fields?.[field.id]));
    const questions = [...heartQuestions,heartDiagnosisQuestion,heartBpTreatmentQuestion,heartDiabetesMedicineQuestion,
      heartDiabetesTypeQuestion,heartDiabetesDamageQuestion,...heartSmokingFields(inputs)];
    inputRows = questions.filter(field => inputs[field.id] !== undefined).map(field => item(field.label, readEntry(inputs[field.id])));
    if (result.reason && heartLimitations[result.issue]?.next) comparison.push(item('What you can do next', heartLimitations[result.issue].next));
  } else if (systemAssessment(type)) {
    const {inputs, result, review} = report.system || assessment.system;
    if (result.status === 'ready') age = ageText(result.age, result.boundary, result.ageRange);
    else if (result.missing?.length) reason = 'Add the remaining details to see your comparison. '+result.missing.map(id=>systemField(type,id)?.label).filter(Boolean).join(' · ');
    else reason = systemReviewSteps[result.issue]?.[0] || 'The available information does not support an age comparison.';
    band = result.ageBand;
    method = result.method;
    ageAtMeasurement = inputs.age?.value;
    if (Number.isFinite(review?.egfr)) comparison.push(item('eGFR from creatinine',filtrationText(review.egfr)));
    if (Number.isFinite(review?.egfrCombined)) comparison.push(item('eGFR from creatinine and cystatin C',filtrationText(review.egfrCombined)));
    if (Number.isFinite(review?.estimatedVo2)) comparison.push(item('Estimated VO₂peak', review.estimatedVo2.toFixed(1) + ' mL/kg/min'));
    for (const [id,entry] of Object.entries(inputs)) {
      const field = systemField(type,id);
      if (!field || id === 'age') continue;
      if (entry && typeof entry === 'object') measurements.push(measurement(field.label, entry, review?.fields?.[id]));
      else inputRows.push(item(field.label,field.labels?.[entry] || readEntry(entry)));
    }
  } else {
    const clinical = clinicalForDisplay(report.clinical, {stored:true});
    if (type === 'phenoage') {
      ageAtMeasurement = assessment.labAge;
      method = 'Clinical PhenoAge';
      age = clinical?.reason ? '' : ageText(clinical?.value);
      reason = clinical?.reason;
      if (age && Number.isFinite(clinical.gap)) {
        const difference = Math.round(clinical.gap);
        comparison.push(item('Simple difference', (difference > 0 ? '+' : '') + difference, ['Estimate minus age at the blood draw, in years.']));
      }
      comparison.push(item('Blood draw date', assessment.labDate),item('Fasting confirmed', assessment.labFasting || 'Not recorded'));
      measurements = labs.filter(lab => assessment.lab?.[lab.id]?.value).map(lab => measurement(lab.name, assessment.lab[lab.id], {
        comparison:reviewLabReference(lab.id, assessment.lab[lab.id], assessment),
        check:clinical?.checks?.find(check => check.id === lab.id), description:labDescriptions[lab.id],
      }));
    } else ageAtMeasurement = assessment.answers?.age;
    inputRows = questionnaireRows(assessment, report);
  }
  if (ageAtMeasurement) comparison.unshift(item(type === 'phenoage' || type === 'kidney' ? 'Age at blood draw' : 'Age at assessment', String(ageAtMeasurement)));
  if (band?.from != null && band?.to != null) comparison.push(item('Study age group', band.from + '-' + band.to));
  const priorities = (report.priorities || []).map(finding => item(finding.name, finding.text, [finding.action],
    references.filter(source => finding.sources?.includes(source.id)).map(source => source.url)));
  const referenceUrls = new Set([...measurements.flatMap(row => row.urls), ...priorities.flatMap(row => row.urls)]);
  const phenoReferences = references.filter(source => ['phenoage','validation'].includes(source.id)).map(source => source.url);
  const storedSources = report.sources || [];
  const relevant = type === 'phenoage' || type === 'profile'
    ? storedSources.filter(url => referenceUrls.has(url) || (type === 'phenoage' && phenoReferences.includes(url))) : storedSources;
  const names = new Map(measurements.flatMap(row=>row.source?.label?[[row.source.url,row.source.label]]:[]));
  const sources = [...new Set([...relevant,...referenceUrls])].filter(url => /^https:\/\//.test(url)).map(url => {
    const page = url.match(/#page=(\d+)$/)?.[1];
    const label = references.find(source => source.url === url)?.label || names.get(url) || 'Measurement reference';
    return {url,label:label+(page?' · '+page:'')};
  });
  return {type,title,sample:assessment.sample === true,savedAt,age,ageLabel,method,reason,comparison,measurements,inputRows,priorities,note,sources,followUp:followUp[type],version:report.model};
}

const sampleDate = '2026-11-01T12:00:00Z';
export function sampleFullReport(type) {
  const spec = systemAssessment(type);
  if (spec || type === HEART_ASSESSMENT) {
    const heart = type === HEART_ASSESSMENT;
    const computed = heart ? assessHeartVascular({
      age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',
      systolic:{value:'140',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'},
    }) : assessSystem(type, systemSampleInputs(type));
    const {inputs,result,review} = computed;
    const assessment = {assessmentType:type,sample:true,[heart?'heart':'system']:{inputs,result,review}};
    const ids = heart ? heartSources(result,review) : spec.sources;
    return fullReportContent(assessment,{...assessment,model:result.version,sources:references.filter(source => ids.includes(source.id)).map(source => source.url)},sampleDate);
  }
  const lab = sampleLabs(), labSubmitted = type === 'phenoage';
  lab.crp.assay = 'standard-crp';
  const assessment = {
    sample:true, answers:sampleAnswers, lab:labSubmitted?lab:{}, labAge:'45', labDate:sampleDate.slice(0,10),
    labSubmitted, labContext:true, labFasting:'Yes',labReferenceMode:'published',labReferenceGroup:'male',labReferenceVersion:REFERENCE_CATALOG_VERSION,
  };
  return fullReportContent(assessment,{
    model:labSubmitted?'clinical-phenoage-2018-demo-v1':'health-profile',contentVersion:CONTENT_VERSION,priorities:insights(sampleAnswers),
    clinical:labSubmitted?assessClinical({age:45,lab,contextConfirmed:true,fasting:'Yes'}):null,sources:references.map(source => source.url),
  },sampleDate);
}
