import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateLabReferences,compareLabReference,reviewLabReference,setLabEntryUnit} from '../public/lab-review.mjs';
import {referenceCatalog,REFERENCE_CATALOG_VERSION} from '../public/lab-reference-catalog.mjs';
import {freshAssessment,continueAssessment,assessmentProgress} from '../public/assessment-flow.mjs';
import {sampleLabs,assessClinical} from '../public/model.mjs';
import {validateSnapshot} from '../lib/account-api.mjs';

const context={labReferenceMode:'published',labReferenceVersion:REFERENCE_CATALOG_VERSION,labReferenceGroup:'female',labAge:'45',labFasting:'Yes',labContext:true};
const review=(id,entry,overrides={})=>reviewLabReference(id,entry,{...context,...overrides});

test('own lab bounds take complete precedence, including one-sided and exclusive limits',()=>{
 const entry={value:'5.5',unit:'mmol/L',referenceHigh:'5.5'};
 assert.equal(review('glucose',entry).status,'within');
 assert.equal(review('glucose',entry).sourceKind,'lab');
 assert.equal(review('glucose',{...entry,referenceHighExclusive:true}).status,'above');
 assert.equal(review('glucose',{value:'1',unit:'mmol/L',referenceHigh:'5.5'}).status,'within','Do not fill the missing lower lab limit from a different source.');
 assert.equal(compareLabReference({value:'2',referenceLow:'2',referenceLowExclusive:true}).status,'below');
 assert.equal(review('glucose',{...entry,referenceLow:'6'}).status,'invalid','An invalid custom range cannot silently fall back to the guide.');
 assert.equal(review('glucose',entry,{labContext:false,labReferenceMode:'lab-only'}).sourceKind,'lab');
 for(const value of [{},[],true,'NaN',-1])assert.ok(validateLabReferences({albumin:{referenceLow:value}}).albumin);
 assert.ok(validateLabReferences({albumin:{referenceLow:'5',referenceHigh:'5'}}).albumin);
 assert.deepEqual(validateLabReferences({crp:{referenceLow:'0',referenceHigh:'5'}}),{});
});

test('published guide preserves original source units and compares converted values at boundaries',()=>{
 const entry={value:'55',unit:'g/L'},original=structuredClone(entry),albumin=review('albumin',entry);
 assert.equal(albumin.status,'within');assert.equal(albumin.unit,'g/dL');assert.equal(albumin.comparisonValue,5.5);
 assert.equal(albumin.sourceVersion,referenceCatalog.version);assert.match(albumin.sourceUrl,/#page=1$/);assert.deepEqual(entry,original);
 assert.equal(review('glucose',{value:'99',unit:'mg/dL'}).status,'within');
 assert.equal(review('glucose',{value:'5.5',unit:'mmol/L'}).status,'above','The published upper limit is 99 mg/dL, not a rounded 5.5 mmol/L.');
 assert.equal(review('glucose',{value:String(99/18.0182),unit:'mmol/L'}).status,'within');
 assert.equal(review('wbc',{value:'11',unit:'10⁹/L'}).comparisonValue,11000);
 assert.equal(review('wbc',{value:'11',unit:'10³/µL'}).status,'within');
 assert.equal(review('crp',{value:'8',unit:'mg/L',assay:'standard-crp'}).status,'within');
 assert.equal(review('creatinine',{value:'97.24',unit:'µmol/L'}).status,'within');
 assert.equal(review('albumin',{value:'42',unit:'wrong'}).status,'invalid');
 const own={value:'4.2',unit:'g/L',referenceLow:'35',referenceHigh:'50',referenceHighExclusive:true};
 assert.deepEqual(setLabEntryUnit('albumin',own,'g/dL'),{...own,unit:'g/dL',referenceLow:'3.5',referenceHigh:'5'});
 assert.equal(own.unit,'g/L','Changing the entry unit never mutates the previous snapshot.');
});

test('fallback requires explicit version, adult collection context and marker-specific information',()=>{
 const entry={value:'42',unit:'g/L'};
 for(const overrides of [{labReferenceMode:'lab-only'},{labReferenceVersion:'future-version'},{labAge:''},{labAge:'17'},{labContext:false}])assert.equal(review('albumin',entry,overrides).status,'unknown');
 assert.equal(reviewLabReference('albumin',entry,{}).status,'unknown','Earlier saved records do not gain new comparisons.');
 assert.equal(review('creatinine',{value:'1.2',unit:'mg/dL'},{labReferenceGroup:'unspecified'}).status,'unknown');
 assert.equal(review('creatinine',{value:'1.2',unit:'mg/dL'}).status,'above');
 assert.equal(review('creatinine',{value:'1.2',unit:'mg/dL'},{labReferenceGroup:'male'}).status,'within');
 assert.equal(review('glucose',{value:'90',unit:'mg/dL'},{labFasting:'Not sure'}).status,'unknown');
 for(const assay of ['unspecified',undefined])assert.equal(review('crp',{value:'2',unit:'mg/L',assay}).status,'unknown');
 assert.equal(review('albumin',{value:'',unit:'g/L'}).status,'missing');
});

test('profile creatinine group and identified hs-CRP get separate published comparisons',()=>{
 const creatinine={value:'1.2',unit:'mg/dL'},profile={labReferenceGroup:undefined,answers:{sex:'Male'}};
 assert.equal(review('creatinine',creatinine,profile).status,'within');
 assert.equal(review('creatinine',creatinine,{...profile,labReferenceGroup:'unspecified'}).label,'Reference group needed');
 const hs={value:'0.2',unit:'mg/dL',assay:'hs-crp'},threshold=review('crp',hs);
 assert.equal(threshold.comparisonValue,2);
 assert.equal(threshold.status,'above');
 assert.equal(threshold.threshold,true);
 assert.equal(threshold.highExclusive,true);
 assert.equal(review('crp',{...hs,value:'0.199'}).status,'within');
 assert.equal(review('crp',{...hs,referenceHigh:'0.3'}).sourceKind,'lab');
 assert.equal(review('crp',hs,{labReferenceVersion:referenceCatalog.version}).status,'unknown');
 assert.equal(review('crp',hs,{labContext:false}).status,'unknown');
});

test('reference settings are validated metadata and cannot alter the clinical formula',()=>{
 const raw={answers:{age:'45'},lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labSubmitted:true,labContext:true,labFasting:'Yes'};
 const legacy=validateSnapshot(raw),withGuide=validateSnapshot({...raw,...context});
 assert.equal(legacy.labReferenceMode,'lab-only');assert.equal(legacy.labReferenceVersion,null);
 assert.deepEqual(withGuide.clinical,legacy.clinical);
 const custom=structuredClone(raw);custom.lab.crp={...custom.lab.crp,assay:'hs-crp',referenceLow:'0',referenceHigh:'4.5',referenceHighExclusive:true};
 assert.deepEqual(validateSnapshot(custom).clinical,legacy.clinical);
 assert.deepEqual(assessClinical({age:45,lab:custom.lab,contextConfirmed:true,fasting:'Yes'}),legacy.clinical);
 for(const bad of [{labReferenceMode:'FDA-approved'},{...context,labReferenceVersion:'future'},{labReferenceGroup:'combined'}])assert.throws(()=>validateSnapshot({...raw,...bad}));
 for(const bad of [{referenceHigh:{}},{referenceLow:'5',referenceHigh:'4'},{referenceHigh:'5',referenceHighExclusive:'false'},{assay:'anything'}]){
  const input=structuredClone(raw);Object.assign(input.lab.crp,bad);assert.throws(()=>validateSnapshot(input));
 }
});

test('switching assessment routes preserves one draft; only explicit fresh assessment clears it',()=>{
 const state={...freshAssessment(),view:'review',consent:true,answers:{age:'52',country:'Fictional test country',smoking:'Never smoked regularly'},lab:{albumin:{value:'44',unit:'g/L'}},labDate:'2026-11-01',profileCompleted:true};
 const blood=continueAssessment(state,'labs'),profile=continueAssessment(blood,'profile');
 assert.equal(blood.view,'labs');assert.equal(profile.view,'review');assert.deepEqual(profile.answers,state.answers);assert.deepEqual(profile.lab,state.lab);
 assert.equal(assessmentProgress(profile).answered,3);assert.equal(assessmentProgress(profile).measurements,1);
 assert.deepEqual(freshAssessment().answers,{});assert.deepEqual(freshAssessment().lab,{});
});
