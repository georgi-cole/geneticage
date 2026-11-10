// Versioned educational modules. Clinical approval is a separate release gate.
export const KNOWLEDGE_VERSION = '2026-11-10-editorial-v2';
export const KNOWLEDGE_MODULES = {
  "glucose": {
    "id": "glucose",
    "title": "A signal worth understanding. Not a verdict to fear.",
    "deck": "Glucose is more useful as a pattern to understand than a number to push down at any cost.",
    "blocks": [
      {
        "id": "biology",
        "title": "What glucose actually tells you",
        "text": "Glucose is a major fuel. Insulin, made by the pancreas, helps move it from blood into cells. A fasting test samples the system after a period without calories. It is a snapshot, not a three-month average or a direct measurement of insulin resistance.",
        "sources": [
          "glucose-diagnosis",
          "diabetes-explained"
        ],
        "kind": "education"
      },
      {
        "id": "wellbeing",
        "title": "Why prevention matters before symptoms",
        "text": "Diabetes can develop without obvious symptoms and increases the risk of damage to the eyes, kidneys, nerves and heart. An isolated elevated result does not establish any such damage or explain fatigue on its own. Good energy levels do not make an elevated result irrelevant; poor energy levels do not establish its cause.",
        "sources": [
          "diabetes-explained",
          "diabetes-symptoms"
        ],
        "kind": "education"
      },
      {
        "id": "a1c",
        "title": "HbA1c: a longer view",
        "text": "HbA1c reflects average glucose exposure over roughly three months. It can help distinguish an isolated fasting reading from a broader pattern. Altered red-cell turnover, recent blood loss or transfusion, and some hemoglobin variants can make it misleading. A result that disagrees with glucose needs interpretation, not a simple average of the two.",
        "sources": [
          "a1c"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "Other context that earns its place",
        "text": "Repeat fasting glucose addresses reproducibility. A 75-g oral glucose tolerance test may help when fasting glucose and HbA1c do not tell a consistent story. Blood pressure, lipids, waist circumference, family history and medicines inform the wider metabolic discussion. Each test should answer a question; this is not a request to order every test.",
        "sources": [
          "glucose-diagnosis",
          "glucose-followup",
          "prevention-guideline"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "prevention": {
    "id": "prevention",
    "title": "What works—and what the evidence does not promise.",
    "deck": "Study results explain why a strategy is reasonable. They are not forecasts of your personal response.",
    "blocks": [
      {
        "id": "dpp",
        "title": "The Diabetes Prevention Program",
        "text": "In a randomized trial of 3,234 adults at high risk of type 2 diabetes, intensive lifestyle support reduced diabetes incidence by 58% relative to placebo over an average 2.8 years. Metformin reduced it by 31%. Lifestyle goals included 7% weight loss and at least 150 minutes of activity weekly. Participants had elevated fasting and post-load glucose; a single fasting result does not establish that you match that population.",
        "sources": [
          "dpp"
        ],
        "kind": "trial"
      },
      {
        "id": "strride",
        "title": "What STRRIDE-PD adds",
        "text": "Among sedentary adults aged 45–75 with elevated fasting glucose, the combined diet-and-moderate-exercise arm lowered fasting glucose by an average 0.32 mmol/L after six months (95% confidence interval: 0.18–0.46 lower). Exercise-only arms did not show a significant fasting-glucose reduction, although substantial moderate exercise improved glucose tolerance. Supervision, adherence and the combination of changes matter; the study did not isolate the effect of adding a short walk.",
        "sources": [
          "strride"
        ],
        "kind": "trial"
      },
      {
        "id": "medicines",
        "title": "When metformin enters the discussion",
        "text": "ADA guidance considers metformin for selected adults with higher-risk prediabetes, especially with features such as age 25–59, BMI at least 35, higher fasting glucose or HbA1c, or previous gestational diabetes. A discussion includes renal function, digestive tolerance and vitamin B12 monitoring during long-term use. Guideline support is not regulatory approval for every indication in every country. This report does not establish medication eligibility or prescribe a dose.",
        "sources": [
          "prevention-guideline"
        ],
        "kind": "treatment"
      },
      {
        "id": "purpose",
        "title": "Do not subtract a study average from your result",
        "text": "The useful endpoints are a clearer glucose pattern, appropriate prevention and habits you can sustain. A percentage reduction in diabetes incidence is not a percentage reduction in your glucose. Neither trial establishes how many years a particular person will gain or how much their age estimate will change.",
        "sources": [
          "dpp",
          "strride"
        ],
        "kind": "boundary"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "movement": {
    "id": "movement",
    "title": "Make the next step small enough to repeat.",
    "deck": "A starting plan should fit the routine and constraints you actually reported.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Capacity, not just minutes",
        "text": "Aerobic activity supports cardiovascular and metabolic health; strength work supports muscle function and everyday tasks. General adult guidance recommends 150–300 moderate minutes or 75–150 vigorous minutes weekly, or a combination, plus muscle-strengthening activity on at least two days. Some activity is better than none. These are population recommendations, not instructions to push through pain or an acute illness.",
        "sources": [
          "activity"
        ],
        "kind": "education"
      },
      {
        "id": "progress",
        "title": "Choose a progression you can tolerate",
        "text": "A useful experiment is to change one part of the routine, observe tolerance, then decide whether another step is reasonable. Track consistency, recovery and daily function, not only exercise volume. Exercise-professional guidance can help with technique, and someone familiar with your care should adapt the plan when a condition, disability or medicine affects exercise.",
        "sources": [
          "activity"
        ],
        "kind": "education"
      },
      {
        "id": "duration",
        "title": "A review window is not a deadline for recovery",
        "text": "The staged weeks in this report are editorial planning examples, not a clinically validated exercise prescription or a promise of a biomarker response. Reassess the routine after a few weeks and keep helpful habits beyond the initial plan. Chest discomfort, fainting or unusual breathlessness during exertion should not be treated as a normal progression challenge.",
        "sources": [
          "activity"
        ],
        "kind": "editorial"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "nutrition": {
    "id": "nutrition",
    "title": "Improve the pattern, not one isolated ingredient.",
    "deck": "Nutrition should support wellbeing and a sustainable routine, not simply a lower model output.",
    "blocks": [
      {
        "id": "variety",
        "title": "Build around familiar meals",
        "text": "A varied pattern with vegetables, whole fruit, legumes and whole grains provides a practical foundation. WHO guidance includes at least 400 g of fruit and vegetables daily for adults. An existing meal is often the easiest place to add variety. Preferences, allergies, budget and any prescribed dietary restrictions should shape the choice rather than being assumed.",
        "sources": [
          "diet"
        ],
        "kind": "education"
      },
      {
        "id": "weight",
        "title": "Weight is a context, not an automatic target",
        "text": "BMI relates weight to height; it does not directly measure fat distribution or muscle. Waist measurements, weight history and the clinical situation can change its interpretation. A higher age estimate alone is not a reason to lose weight, eat excessive protein or start a supplement. A dietitian can turn an appropriate clinical goal into meals that fit your life.",
        "sources": [
          "bmi",
          "diet"
        ],
        "kind": "education"
      },
      {
        "id": "review",
        "title": "What would show that the change helped?",
        "text": "Look first for a change you can sustain: food variety, tolerability, meal regularity and a relevant agreed outcome. Laboratory follow-up depends on the clinical question, not the day a meal plan ends. Unintentional weight loss, restrictive eating or a condition requiring a specialist diet needs a different plan from routine prevention advice.",
        "sources": [
          "diet",
          "weight-change"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "sleep": {
    "id": "sleep",
    "title": "Not just more hours. More useful rest.",
    "deck": "Duration, sleep opportunity and how restored you feel are different parts of the picture.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Hours and restoration are different questions",
        "text": "Sleep supports alertness, concentration and general wellbeing. Duration alone does not diagnose insomnia or sleep apnea, and this report does not promise that extending sleep will lower glucose or reverse an age difference. Persistent tiredness deserves its own assessment rather than being automatically attributed to a blood marker.",
        "sources": [
          "sleep"
        ],
        "kind": "education"
      },
      {
        "id": "diary",
        "title": "A practical two-week observation",
        "text": "Record bedtime, waking, prolonged awakenings, naps and morning refreshment. Note caffeine or alcohol near bedtime. A consistent wake time and enough sleep opportunity can be useful starting points. Two weeks is an observation example, not an average recovery time. When work or caring duties disrupt sleep, the plan has to accommodate that constraint.",
        "sources": [
          "sleep"
        ],
        "kind": "editorial"
      },
      {
        "id": "cbti",
        "title": "CBT-I, when insomnia is present",
        "text": "Cognitive behavioral therapy for insomnia (CBT-I) is commonly recommended first for long-term insomnia. A typical course lasts six to eight weeks and works on sleep-related habits and beliefs; it is more than generic sleep-hygiene advice. The questionnaire does not establish that you need it. Persistent difficulty falling or staying asleep makes this an option to discuss, rather than simply spending ever more time in bed.",
        "sources": [
          "insomnia"
        ],
        "kind": "treatment"
      },
      {
        "id": "apnea",
        "title": "When a different assessment is more useful",
        "text": "Loud snoring, witnessed breathing pauses or gasping, and significant daytime sleepiness can justify assessment for sleep apnea. These symptoms have not been collected in this assessment. Better daytime function and more restorative sleep are useful outcomes; neither a wearable score nor a blood-age estimate substitutes for them.",
        "sources": [
          "apnea",
          "sleep"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "immune": {
    "id": "immune",
    "title": "The percentage is not the whole immune story.",
    "deck": "A total count and a differential answer related, but different, questions.",
    "blocks": [
      {
        "id": "biology",
        "title": "The whole count and the proportion",
        "text": "White blood cells include several cell types with different roles in responding to infection and other challenges. A total count shows how many white cells are present; a differential shows their amounts or proportions. Neither result alone measures how well your entire immune system works. A percentage can change because another white-cell population changes.",
        "sources": [
          "wbc",
          "lymphocytes"
        ],
        "kind": "education"
      },
      {
        "id": "context",
        "title": "Which additional information matters?",
        "text": "The laboratory-reported absolute lymphocyte and neutrophil counts, hemoglobin and platelets add context. Earlier results, symptoms, recent infection and medicines can change the interpretation. Repeated unusual infections, rather than a percentage alone, may justify targeted immune testing. The laboratory absolute count and its own reference interval take precedence over a calculated estimate.",
        "sources": [
          "wbc",
          "lymphocytes"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "Treat a cause, not an immune-score label",
        "text": "An isolated percentage flag does not establish a need for an immune-boosting treatment. A genuinely low or high count is interpreted with its cause and clinical context. Persistence, symptoms and the wider blood count determine follow-up; a satisfactory absolute count in a well person does not acquire a short retest deadline simply because its percentage is flagged.",
        "sources": [
          "lymphocytes"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "crp": {
    "id": "crp",
    "title": "Understand the signal before trying to lower it.",
    "deck": "CRP identifies an inflammatory signal. It does not locate its cause.",
    "blocks": [
      {
        "id": "biology",
        "title": "What this protein represents",
        "text": "C-reactive protein is made by the liver in response to inflammation. It may rise with infection, injury or inflammatory illness, but does not identify the cause or location. Inflammation can be a normal short-term response; one result is not evidence of chronic inflammaging. Standard CRP and hs-CRP measure the same protein but have different intended uses.",
        "sources": [
          "crp-explained"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "What to check together",
        "text": "Check the assay name and the laboratory interval, how you felt around the draw, recent injury and relevant medicines. For a cardiovascular question, blood pressure, lipids and the broader risk profile belong in the same discussion. CRP alone is not a stand-alone reason to start a drug.",
        "sources": [
          "crp-explained",
          "hscrp"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "What optimization means here",
        "text": "The objective is to identify and address a relevant underlying problem, not suppress the marker indiscriminately. This assessment alone does not justify steroids, antibiotics or an anti-inflammatory supplement program. A lower CRP is not proof that a longevity treatment worked.",
        "sources": [
          "crp-explained"
        ],
        "kind": "boundary"
      },
      {
        "id": "timing",
        "title": "Let the purpose determine the timing",
        "text": "There is no universal retest date. A clinician may repeat after recovery from a temporary inflammatory episode. When hs-CRP is being used to estimate a stable cardiovascular baseline, repeat measurement can help because levels vary. New symptoms require assessment on their own merits rather than waiting for a routine report review.",
        "sources": [
          "hscrp"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "albumin": {
    "id": "albumin",
    "title": "Support the physiology. Do not chase the coefficient.",
    "deck": "Albumin connects fluid balance, transport, inflammation and clinical nutrition.",
    "blocks": [
      {
        "id": "biology",
        "title": "More than a protein-intake score",
        "text": "Albumin is a liver-made protein that helps keep fluid in the circulation and carries substances through the blood. Low values may accompany inflammation, liver disease, urinary protein loss or inadequate nutrition; dehydration can raise the concentration. It is not a direct score of how much protein you eat.",
        "sources": [
          "albumin-explained"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "When another marker changes the meaning",
        "text": "When albumin is low, urine albumin-to-creatinine ratio can investigate urinary loss, while liver tests and a nutrition history address different possibilities. CRP provides inflammatory context. These investigations answer different questions; they should not be ordered as an indiscriminate bundle.",
        "sources": [
          "albumin-explained",
          "kidney-context"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "Treatment follows the explanation",
        "text": "A value within an applicable interval is not a reason to raise albumin further. Protein supplements or albumin treatment require a separate clinical indication. A persistent low result, swelling or relevant illness changes the review; there is no universal albumin-optimization course or repeat interval for an otherwise unremarkable result.",
        "sources": [
          "albumin-explained"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "kidney": {
    "id": "kidney",
    "title": "A filtration clue, not a complete kidney-health score.",
    "deck": "Filtration, urine albumin and change over time provide different parts of the explanation.",
    "blocks": [
      {
        "id": "biology",
        "title": "Why creatinine needs context",
        "text": "Creatinine comes from muscle metabolism and is cleared by the kidneys. Its concentration also depends on muscle mass, diet and other factors. Estimated glomerular filtration rate (eGFR) uses an equation to estimate filtration; it is not a direct measurement. Do not try to improve a score by losing muscle, manipulating hydration or stopping prescribed treatment.",
        "sources": [
          "creatinine-explained",
          "kidney-context"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "Two complementary questions",
        "text": "Urine albumin-to-creatinine ratio (ACR) looks for albumin leakage, which may be present even when filtration is preserved. When greater precision matters or creatinine is hard to interpret, a creatinine-and-cystatin-C estimate can add information. Blood pressure, medicines and earlier results help explain the pattern. The app does not infer an unreported cystatin C, ACR or eGFR.",
        "sources": [
          "kidney-context",
          "kdigo-ckd"
        ],
        "kind": "education"
      },
      {
        "id": "chronicity",
        "title": "Persistence is different from an acute change",
        "text": "Chronic kidney disease requires evidence of chronicity, generally at least three months, alongside the relevant kidney abnormalities. That does not mean a new low eGFR or acute illness should wait three months for assessment. Repeat timing depends on the size and speed of change, symptoms, urine findings and medication changes.",
        "sources": [
          "kdigo-ckd"
        ],
        "kind": "education"
      },
      {
        "id": "treatment",
        "title": "What a kidney-protection discussion involves",
        "text": "For people with confirmed kidney disease, treatment may include blood-pressure management and, in appropriate clinical groups, ACE inhibitors or ARBs and SGLT2 inhibitors. Selection depends on diagnosis, filtration, albuminuria, potassium and other conditions, not a kidney-age label. These are conditional discussion topics, not recommendations to start or stop medicines. Monitoring is tied to the actual treatment and clinical risk.",
        "sources": [
          "kdigo-ckd"
        ],
        "kind": "treatment"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "redcells": {
    "id": "redcells",
    "title": "Two ways of describing your red blood cells.",
    "deck": "Cell size and variation help interpret a blood count. They do not diagnose anemia on their own.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Size is not oxygen-carrying capacity",
        "text": "MCV measures average red-cell size. RDW describes how much that size varies. Hemoglobin is a key companion when the question is whether oxygen-carrying capacity is reduced. Normal MCV or RDW does not prove that iron, vitamin B12 or folate status is optimal, and does not rule out a cause of fatigue.",
        "sources": [
          "mcv-explained",
          "rdw-explained"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "What would make extra tests useful?",
        "text": "An abnormal hemoglobin, changing indices, symptoms or a relevant dietary or bleeding history can justify targeted testing. Depending on the pattern, ferritin and other iron studies, vitamin B12, folate or a reticulocyte count may help. A normal MCV alone does not rule out anemia.",
        "sources": [
          "mcv-explained",
          "rdw-explained"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "Treat the deficiency, not the score",
        "text": "Demonstrated deficiency may justify replacement and investigation of its cause. These indices alone do not provide a basis for an iron, B12 or folate prescription. The response period and retesting depend on the condition and treatment selected; there is no meaningful RDW-optimization course to assign from an isolated index.",
        "sources": [
          "rdw-explained"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "alp": {
    "id": "alp",
    "title": "Not every result needs an intervention.",
    "deck": "The origin of an enzyme signal matters more than a universal ambition to lower it.",
    "blocks": [
      {
        "id": "biology",
        "title": "Liver, bile ducts and bone",
        "text": "Alkaline phosphatase (ALP) is an enzyme found especially in liver, bile ducts and bone. An increased blood value can therefore have different origins. A lower result is not universally better, and an isolated reading cannot identify the tissue responsible.",
        "sources": [
          "alp-explained"
        ],
        "kind": "education"
      },
      {
        "id": "companions",
        "title": "Which other markers help?",
        "text": "When ALP is elevated, other liver tests such as GGT, ALT/AST and bilirubin, or ALP isoenzymes, may help investigate its source. A bone-focused evaluation is selected when the history or pattern warrants it, not simply because ALP appears in an age formula.",
        "sources": [
          "alp-explained"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "When would the plan change?",
        "text": "A persistent abnormality or symptoms such as jaundice, dark urine or unexplained bone pain warrants assessment. Without such context, an isolated result within the relevant laboratory interval does not justify ALP-lowering treatment or an accelerated repeat schedule. Treatment and its duration follow the identified cause.",
        "sources": [
          "alp-explained"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "pressure": {
    "id": "pressure",
    "title": "Make the measurement representative of your life.",
    "deck": "One blood-pressure reading is context, not the whole diagnosis or a treatment target chosen in isolation.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Two pressures, one circulation",
        "text": "Systolic pressure is the pressure when the heart contracts; diastolic pressure is the pressure between beats. Sustained high pressure increases cardiovascular and kidney risk even without symptoms. Technique, cuff fit, rest and repeated readings matter when deciding whether a result represents your usual pressure.",
        "sources": [
          "esc-blood-pressure",
          "bp-confirmation"
        ],
        "kind": "education"
      },
      {
        "id": "confirmation",
        "title": "A useful home record, when requested",
        "text": "For diagnostic home monitoring, NICE describes two seated readings at least one minute apart, twice daily, for at least four days and ideally seven. The first day is discarded when averaging the remaining readings. This is a confirmation protocol to agree with a clinician, not a substitute for urgent evaluation of a concerning reading or symptoms.",
        "sources": [
          "bp-confirmation"
        ],
        "kind": "education"
      },
      {
        "id": "options",
        "title": "What changes the treatment discussion?",
        "text": "A representative pressure pattern, overall cardiovascular risk, kidney function, electrolytes and existing medicines guide the decision. Lifestyle support and antihypertensive treatment can both be relevant when indicated. The report does not choose a drug, dose or personal pressure target; age, tolerability and coexisting conditions matter. Ask which outcome and follow-up would show that the selected approach is working safely.",
        "sources": [
          "esc-blood-pressure"
        ],
        "kind": "treatment"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "lipids": {
    "id": "lipids",
    "title": "Understand the particles behind the cholesterol result.",
    "deck": "Different lipid measurements answer different questions. More detail is useful when it changes a decision.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Total cholesterol is only an opening view",
        "text": "Cholesterol travels in lipoprotein particles. LDL-related measures help describe atherogenic burden, while HDL cholesterol is part of risk assessment but is not a standalone treatment goal to raise. Non-HDL cholesterol is total minus HDL when both come from a comparable panel. ApoB can add information about the number of atherogenic particles; it is not interchangeable with their cholesterol content.",
        "sources": [
          "score2-scope"
        ],
        "kind": "education"
      },
      {
        "id": "lpa",
        "title": "Lp(a) is a separate question",
        "text": "Lipoprotein(a) can contribute to inherited cardiovascular risk and is not captured fully by an ordinary total/HDL panel. Its mass and particle-concentration units must not be converted with one universal factor. An entered Lp(a) result should be reviewed in its reported unit alongside family history and the wider risk profile, not interpreted as a new personal event forecast.",
        "sources": [
          "lpa-consensus"
        ],
        "kind": "education"
      },
      {
        "id": "options",
        "title": "Where lipid-lowering therapy fits",
        "text": "When treatment is indicated, statins are a common starting option; other therapies may be considered according to response, tolerability and overall risk. A clinician needs the complete lipid profile, relevant history and current treatment before choosing a target or medicine. This report does not infer an LDL value or medication eligibility from total cholesterol alone.",
        "sources": [
          "score2-scope",
          "lipid-followup"
        ],
        "kind": "treatment"
      },
      {
        "id": "timing",
        "title": "Follow the treatment, not a generic countdown",
        "text": "NICE recommends a full lipid profile and liver transaminases two to three months after starting or changing lipid-lowering treatment. That interval applies to that treatment context; it is not a universal instruction for every user. Before treatment, the purpose may instead be to clarify the baseline or obtain missing measurements. Agree the next test around the actual decision.",
        "sources": [
          "lipid-followup"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "fitness": {
    "id": "fitness",
    "title": "Capacity you can use. A comparison you can understand.",
    "deck": "Fitness comparisons are useful when their measurement method and limitations stay visible.",
    "blocks": [
      {
        "id": "meaning",
        "title": "What oxygen uptake represents",
        "text": "VO₂peak describes the highest oxygen uptake reached during the test. A value relative to body weight helps comparisons, but also changes with body weight. It reflects one aspect of aerobic capacity, not an overall biological age. A questionnaire estimate and a supervised gas-exchange measurement are different kinds of evidence.",
        "sources": [
          "hunt-nonexercise",
          "friend-2022"
        ],
        "kind": "education"
      },
      {
        "id": "context",
        "title": "What makes comparisons fair?",
        "text": "Test type, effort, protocol, medicines and current health can affect the result. Treadmill and cycle reference groups are not automatically interchangeable. Resting pulse can be influenced by medicines, so the app preserves eligibility checks instead of assuming that a lower pulse always means better fitness. A supervised test may answer a precision question, but is not required simply because a questionnaire estimate exists.",
        "sources": [
          "hunt-nonexercise",
          "friend-2022"
        ],
        "kind": "education"
      },
      {
        "id": "action",
        "title": "Choose an endpoint beyond the age label",
        "text": "A sustainable exercise routine, better tolerance of everyday tasks and an appropriate repeat measurement are more informative goals than forcing a fitness-age number down. The same method and comparable conditions are important for follow-up. An eight-to-twelve-week routine review can be a planning example; it is not a promised time to improve VO₂peak or a mandatory interval for another supervised test.",
        "sources": [
          "activity",
          "friend-2022"
        ],
        "kind": "editorial"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "metabolic": {
    "id": "metabolic",
    "title": "A risk comparison is not a diagnosis.",
    "deck": "The metabolic reference describes a model and its inputs, not the measured age of an organ.",
    "blocks": [
      {
        "id": "model",
        "title": "What the German Diabetes Risk Score adds",
        "text": "This assessment uses a model developed from German cohorts to estimate type 2 diabetes risk and compares it with a defined reference profile. The model includes recorded body measurements, habits and family history. If an applicable HbA1c result is provided, the app can use the corresponding published equation. Risk factors and a model comparison do not diagnose diabetes or directly measure insulin resistance.",
        "sources": [
          "gdrs"
        ],
        "kind": "education"
      },
      {
        "id": "strategy",
        "title": "Separate a model input from a treatment recommendation",
        "text": "A variable appearing in a prediction equation is not automatically a causal intervention target. For example, the presence of coffee in an equation is not a reason to start drinking it. The useful next step is to review the modifiable pattern, confirm glucose status when appropriate and choose changes supported by intervention evidence rather than manipulate the reference comparison.",
        "sources": [
          "gdrs",
          "prevention-guideline"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "tobacco": {
    "id": "tobacco",
    "title": "Make support part of the plan.",
    "deck": "The useful question is what helps a person change or maintain their actual pattern.",
    "blocks": [
      {
        "id": "why",
        "title": "Why tobacco deserves its own attention",
        "text": "Smoking is a major modifiable cardiovascular risk factor. A questionnaire does not quantify all tobacco or nicotine exposure, and different products should not be treated as interchangeable. Current use, previous use and nicotine replacement used to stop smoking need different conversations.",
        "sources": [
          "tobacco"
        ],
        "kind": "education"
      },
      {
        "id": "options",
        "title": "Support can be practical and specific",
        "text": "For someone who smokes, a cessation service can combine behavioral support with an appropriate discussion of licensed cessation medicines. The choice depends on medical history, prior attempts and availability. For someone who does not currently smoke, maintenance and avoiding relapse may be the relevant goal; the report should not assign a cessation course automatically.",
        "sources": [
          "cessation"
        ],
        "kind": "treatment"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "alcohol": {
    "id": "alcohol",
    "title": "Keep the actual pattern in view.",
    "deck": "Amount and frequency are more informative than a yes-or-no label.",
    "blocks": [
      {
        "id": "meaning",
        "title": "Risk is not the same as dependence",
        "text": "Alcohol carries health risks, including at low levels; a recorded pattern is not proof of a safe personal limit or a diagnosis of dependence. Drinking is not a health intervention. A relevant conversation uses actual amounts and frequency, medication interactions and individual circumstances rather than assuming heavy use from a yes answer.",
        "sources": [
          "alcohol"
        ],
        "kind": "education"
      },
      {
        "id": "review",
        "title": "Review the question that matters to you",
        "text": "When intake varies, a short diary can make the pattern clearer. Someone concerned about dependence or withdrawal needs a separate clinical assessment; these questions do not establish either. The report does not attach a detoxification plan or a generic withdrawal warning to every person who reports a drink.",
        "sources": [
          "alcohol"
        ],
        "kind": "boundary"
      }
    ],
    "reviewStatus": "clinical-review-required"
  },
  "stress": {
    "id": "stress",
    "title": "Wellbeing is part of the interpretation.",
    "deck": "A reported difficulty deserves attention without being made into an invented diagnosis.",
    "blocks": [
      {
        "id": "context",
        "title": "Use your experience as a starting point",
        "text": "The questionnaire records perceived stress and overall health, not a diagnosis or a cortisol measurement. Notice whether difficulty is brief or persistent and whether it affects sleep, work or everyday functioning. This information can make a clinical conversation more useful than treating a general stress answer as the cause of every blood result.",
        "sources": [
          "stress-guide"
        ],
        "kind": "education"
      },
      {
        "id": "support",
        "title": "Choose a manageable form of support",
        "text": "A regular routine, appropriate physical activity, social support and practical stress-management skills may be useful. Persistent distress or impaired functioning warrants discussion of professional support. The report cannot determine whether a particular psychological treatment is indicated or specify a recovery deadline from these answers alone.",
        "sources": [
          "stress-guide"
        ],
        "kind": "education"
      }
    ],
    "reviewStatus": "clinical-review-required"
  }
};
