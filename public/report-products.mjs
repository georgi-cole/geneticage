import {HEART_ASSESSMENT,heartAgeReadout} from './heart-vascular.mjs';
import {systemAssessment} from './system-assessments.mjs';
import {clinicalForDisplay,isReportableAge} from './lab-safety.mjs';

export const SPECIALIST_CONSENT_VERSION = 'specialist-assessment-sharing-v1';
export const reportLanguage = value => value === 'bg' ? 'bg' : 'en';
export const assessmentReportType = assessment => assessment.assessmentType === HEART_ASSESSMENT || systemAssessment(assessment.assessmentType)
  ? assessment.assessmentType : assessment.labSubmitted ? 'phenoage' : 'profile';
export const reportTypeName = type => systemAssessment(type)?.title ||
  (type === HEART_ASSESSMENT ? 'Heart & Vascular' : type === 'phenoage' ? 'Clinical PhenoAge' : 'Health & lifestyle');

export function instantReportEligible(assessment, report) {
  if (assessment.sample) return false;
  const type = assessmentReportType(assessment);
  if (type === HEART_ASSESSMENT) {
    const heart = report?.heart || assessment.heart;
    if (heart?.review?.arterialAge) return true;
    const result = heart?.result;
    if (!result || result.reason) return false;
    const readout = heartAgeReadout(result);
    return Number.isFinite(readout.age) || Number.isFinite(readout.boundary);
  }
  if (systemAssessment(type)) return (report?.system?.result || assessment.system?.result)?.status === 'ready';
  if (type === 'phenoage') {
    const clinical = clinicalForDisplay(report?.clinical || assessment.clinical);
    return !clinical?.reason && isReportableAge(clinical?.value);
  }
  return Object.keys(assessment.answers || {}).some(id => !['age','sex','country'].includes(id));
}
