import {references} from '../evidence.mjs';

// Versioned educational evidence, not a claim of clinician approval. Runtime
// composition never retrieves live literature or substitutes a missing source.
const additions = [
 ['lpa-nla-2024','NLA (2024) · Lipoprotein(a) risk categories','https://www.lipid.org/resource/a-focused-update-to-the-2019-nla-scientific-statement-on-use-of-lipoproteina-in-clinical-practice/','consensus'],
 ['lpa-repeat','NLA (2022) · Lipoprotein(a) measurement and repeat testing','https://doi.org/10.1016/j.jacl.2022.08.007','consensus'],
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
 ['pressure-basics','NHLBI · Understanding high blood pressure','https://www.nhlbi.nih.gov/health/high-blood-pressure','education'],
 ['home-pressure','AHA · Home blood-pressure monitoring','https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home','clinical-guidance'],
 ['lipid-tests','NHLBI · Understanding cholesterol tests','https://www.nhlbi.nih.gov/health/blood-cholesterol/diagnosis','education'],
 ['apob-consensus','NLA (2024) · ApoB and cardiovascular risk','https://pubmed.ncbi.nlm.nih.gov/39256087/','consensus'],
 ['cholesterol-treatment','NHLBI · Cholesterol treatment and food choices','https://www.nhlbi.nih.gov/health/blood-cholesterol/treatment','clinical-guidance'],
 ['heart-foods','NHLBI · Heart-healthy food choices','https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-foods','education'],
 ['dash-eating','NHLBI · DASH eating plan','https://www.nhlbi.nih.gov/health/dash-eating-plan','clinical-guidance'],
 ['insulin-resistance','NIDDK · Insulin resistance and prediabetes','https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-Insulin-resistance','education'],
 ['prediabetes-living','NIDDK · Preventing type 2 diabetes','https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-type-2-diabetes','clinical-guidance'],
 ['diabetes-food','NIDDK · Healthy living with diabetes','https://www.niddk.nih.gov/health-information/diabetes/overview/healthy-living-with-diabetes','clinical-guidance'],
 ['insulin-exercise','ADA · Insulin resistance and exercise','https://diabetes.org/health-wellness/insulin-resistance','education'],
 ['hypoglycemia','NIDDK · Low blood glucose and its causes','https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/low-blood-glucose-hypoglycemia','clinical-guidance'],
 ['fasting-trial','Liu et al. (2022) · Calorie restriction with or without time-restricted eating','https://www.nejm.org/doi/full/10.1056/NEJMoa2114833','randomized-trial'],
 ['diabetes-supplements','NCCIH · Diabetes and dietary supplements','https://www.nccih.nih.gov/health/diabetes-and-dietary-supplements-what-you-need-to-know','evidence-summary'],
 ['supplement-use','NCCIH · Using dietary supplements wisely','https://www.nccih.nih.gov/health/using-dietary-supplements-wisely','clinical-guidance'],
 ['kidney-physiology','NIDDK · Your kidneys and how they work','https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work','education'],
 ['kidney-tests','NIDDK · Kidney tests and diagnosis','https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis','clinical-guidance'],
 ['albumin-urine','NIDDK · Albumin in the urine','https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis/albuminuria-albumin-urine','education'],
 ['kidney-food','NIDDK · Healthy eating with chronic kidney disease','https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/healthy-eating-adults-chronic-kidney-disease','clinical-guidance'],
 ['kidney-management','NIDDK · Managing chronic kidney disease','https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/managing','clinical-guidance'],
 ['kidney-medicines','NIDDK · Keeping kidneys safe around medicines','https://www.niddk.nih.gov/health-information/kidney-disease/keeping-kidneys-safe','clinical-guidance'],
 ['exercise-benefits','NHLBI · Physical activity and the heart','https://www.nhlbi.nih.gov/health/heart/physical-activity/benefits','education'],
 ['exercise-safety','NHLBI · Physical activity and health precautions','https://www.nhlbi.nih.gov/health/heart/physical-activity/risks','clinical-guidance'],
 ['activity-intensity','CDC · Recognising activity intensity','https://www.cdc.gov/physical-activity-basics/measuring/','education'],
 ['adult-activity','CDC · Adult aerobic and strength activity','https://www.cdc.gov/physical-activity-basics/guidelines/adults.html','clinical-guidance'],
 ['sport-nutrition','NIH ODS · Exercise supplements and their evidence','https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/','evidence-summary'],
 ['sleep-physiology','NHLBI · How sleep works','https://www.nhlbi.nih.gov/health/sleep','education'],
 ['sleep-clock','NHLBI · The sleep and wake cycle','https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle','education'],
 ['healthy-eating-living','NIDDK · Food, activity and everyday wellbeing','https://www.niddk.nih.gov/health-information/weight-management/keep-active-eat-healthy-feel-great','education'],
 ['cpet-explained','Cambridge University Hospitals · Cardiopulmonary exercise testing','https://www.cuh.nhs.uk/patient-information/cardiopulmonary-exercise-test-cpet/','clinical-guidance'],
];
export const EVIDENCE_VERSION = '2026-11-11-evidence-v4';
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
