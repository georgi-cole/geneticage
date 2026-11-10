import {references} from '../evidence.mjs';

// Versioned educational evidence, not a claim of clinician approval. Runtime
// composition never retrieves live literature or substitutes a missing source.
const additions = [
 ['lpa-consensus','EAS · Lipoprotein(a) consensus, 2022','https://academic.oup.com/eurheartj/article/43/39/3925/6670882','consensus'],
 ['glucose-diagnosis','ADA · Diagnosis and classification, 2026','https://diabetesjournals.org/care/article/49/Supplement_1/S27/163926/2-Diagnosis-and-Classification-of-Diabetes','guideline'],
 ['glucose-followup','NIDDK · Diabetes and prediabetes testing','https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/diabetes/diabetes-prediabetes','clinical-guidance'],
 ['diabetes-explained','NIDDK · What is diabetes?','https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes','education'],
 ['diabetes-symptoms','NIDDK · Diabetes symptoms and causes','https://www.niddk.nih.gov/health-information/diabetes/overview/symptoms-causes','education'],
 ['a1c','NIDDK · The A1C test','https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test','clinical-guidance'],
 ['dpp','Diabetes Prevention Program · Randomized trial, 2002','https://www.nejm.org/doi/10.1056/NEJMoa012512','randomized-trial'],
 ['strride','STRRIDE-PD · Exercise, diet and glucose, 2016','https://pubmed.ncbi.nlm.nih.gov/27421729/','randomized-trial'],
 ['prevention-guideline','ADA · Prevention or delay of diabetes, 2026','https://diabetesjournals.org/care/article/49/Supplement_1/S50/163924/3-Prevention-or-Delay-of-Diabetes-and-Associated','guideline'],
 ['insomnia','NHLBI · Treatment of insomnia','https://www.nhlbi.nih.gov/health/insomnia/treatment','clinical-guidance'],
 ['apnea','NHLBI · Sleep apnea symptoms','https://www.nhlbi.nih.gov/health/sleep-apnea/symptoms','education'],
 ['lymphocytes','NHLBI · Lymphopenia diagnosis and absolute counts','https://www.nhlbi.nih.gov/health/lymphopenia/diagnosis','clinical-guidance'],
 ['wbc','MedlinePlus · White blood cell count','https://medlineplus.gov/lab-tests/white-blood-count-wbc/','laboratory-guidance'],
 ['crp-explained','MedlinePlus · C-reactive protein','https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/','laboratory-guidance'],
 ['hscrp','Mayo Clinic Laboratories · High-sensitivity CRP','https://www.mayocliniclabs.com/test-catalog/Overview/800024','laboratory-guidance'],
 ['albumin-explained','MedlinePlus · Albumin blood test','https://medlineplus.gov/lab-tests/albumin-blood-test/','laboratory-guidance'],
 ['creatinine-explained','MedlinePlus · Creatinine test','https://medlineplus.gov/lab-tests/creatinine-test/','laboratory-guidance'],
 ['kidney-context','NIDDK · Estimated GFR calculators and interpretation','https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/kidney-disease/laboratory-evaluation/estimated-gfr-calculators','clinical-guidance'],
 ['mcv-explained','MedlinePlus · Mean corpuscular volume','https://medlineplus.gov/lab-tests/mcv-mean-corpuscular-volume/','laboratory-guidance'],
 ['rdw-explained','MedlinePlus · Red-cell distribution width','https://medlineplus.gov/lab-tests/rdw-red-cell-distribution-width/','laboratory-guidance'],
 ['alp-explained','MedlinePlus · Alkaline phosphatase','https://medlineplus.gov/lab-tests/alkaline-phosphatase/','laboratory-guidance'],
 ['bp-confirmation','NICE NG136 · Confirming and monitoring hypertension','https://www.nice.org.uk/guidance/ng136/chapter/recommendations','guideline'],
 ['lipid-followup','NICE NG238 · Lipid modification and follow-up','https://www.nice.org.uk/guidance/ng238/chapter/recommendations','guideline'],
 ['cessation','WHO · Tobacco cessation in adults, 2024','https://www.who.int/publications/i/item/9789240096431','guideline'],
 ['stress-guide','WHO · Doing what matters in times of stress','https://www.who.int/publications/i/item/9789240003927','education'],
 ['bmi','CDC · About body mass index','https://www.cdc.gov/bmi/about/index.html','education'],
];
export const EVIDENCE_VERSION = '2026-11-10-evidence-v2';
export const REPORT_EVIDENCE = Object.freeze(Object.fromEntries([
 ...references.map(item=>[item.id,{...item,kind:'assessment-source',reviewStatus:'clinical-review-required'}]),
 ...additions.map(([id,label,url,kind])=>[id,{id,label,url,kind,reviewStatus:'clinical-review-required'}]),
]));
export function evidenceSnapshot(ids){
 return [...new Set(ids)].map(id=>{
  const source=REPORT_EVIDENCE[id];
  if(!source||!/^https:\/\//.test(source.url))throw Error('Unknown or unsafe editorial evidence: '+id);
  return {id:source.id,label:source.label,url:source.url,kind:source.kind,reviewStatus:source.reviewStatus};
 });
}
