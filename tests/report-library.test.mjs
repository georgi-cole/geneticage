import assert from 'node:assert/strict';
import {test} from 'node:test';
import {historyMeasurement,comparableHistory} from '../public/assessment-history.mjs';
import {reportReadiness} from '../public/report-readiness.mjs';
import {reportSaveButton} from '../public/report-controls.mjs';
import {assessSystem,systemSampleInputs} from '../public/system-assessments.mjs';
import {sampleAnswers} from '../public/model.mjs';

test('progress compares matching methods on distinct dates and separates fictional samples',()=>{
 const record=(date,value,sample=false)=>({saved:date+'T12:00:00Z',labDate:date,model:'clinical-phenoage-2018-demo-v1',labFasting:'Yes',value,sample});
 const records=[record('2026-10-01',51),record('2026-11-01',49),{...record('2026-11-01',50),saved:'2026-11-01T18:00:00Z'},record('2026-11-02',60,true),{...record('2026-11-03',48),labFasting:'Not recorded'}];
 const [personal]=comparableHistory(records);
 assert.deepEqual(personal.points.map(point=>point.value),[51,50]);
 assert.deepEqual(comparableHistory(records,true)[0].points.map(point=>point.value),[60]);
 assert.equal(historyMeasurement({...record('2026-11-03',48),labFasting:'No'}),null);
});

test('readiness distinguishes missing health context from optional companion measurements',()=>{
 const system=assessSystem('kidney',systemSampleInputs('kidney'));
 const readiness=reportReadiness({assessmentType:'kidney',system},{answers:sampleAnswers,source:'saved',saved:'2026-11-01T12:00:00Z',id:'fictional-profile'});
 assert.equal(readiness.source,'saved');
 assert.equal(readiness.profileId,'fictional-profile');
 assert.ok(!readiness.measurements.includes('Urine albumin result'),'Companion testing is not made mandatory for a creatinine-based estimate.');
 assert.equal(reportReadiness({assessmentType:'kidney',system}).source,'missing');
});

test('saved reports have a disabled save control and static previews never offer cloud saving',()=>{
 assert.match(reportSaveButton(true),/disabled>Saved/);
 assert.match(reportSaveButton(false),/data-action="save"/);
 assert.equal(reportSaveButton(false,true),'');
});
