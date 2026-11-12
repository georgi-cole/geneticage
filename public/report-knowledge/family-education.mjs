// Curated educational features. New reports freeze the selected text and evidence.
export const FAMILY_EDUCATION_VERSION='2026-11-11-education-v1';
export const FAMILY_EDUCATION = {
  "pressure": {
    "title": "Understand the two numbers in a blood-pressure reading.",
    "blocks": [
      {
        "id": "pressure-1",
        "title": "The pressure when the heart contracts",
        "text": "Blood pressure is the force of blood against artery walls. Systolic pressure is the upper number, measured when the heart contracts and pushes blood into the arteries. Diastolic pressure is the lower number, measured between beats while the heart relaxes. Both are recorded in millimetres of mercury, written mmHg. A pulse reading answers a different question, counting heartbeats per minute. Someone can have a usual pulse and still have raised blood pressure.",
        "sources": [
          "pressure-basics"
        ],
        "kind": "education"
      },
      {
        "id": "pressure-2",
        "title": "Why a persistent elevation matters",
        "text": "Arteries need to accommodate blood with each beat. Over time, persistently high pressure increases the workload on the heart and can damage blood vessels, including the small vessels in the kidneys. This helps explain why blood-pressure care belongs in both cardiovascular and kidney prevention. People often feel well while pressure is high. Symptoms are therefore a poor way to decide whether a reading deserves attention.",
        "sources": [
          "pressure-basics",
          "kidney-management"
        ],
        "kind": "education"
      },
      {
        "id": "pressure-3",
        "title": "A reading has a setting",
        "text": "Pressure changes with activity, stress and the measurement conditions. A single clinic reading and an average collected at home are interpreted differently. The original result is a starting point for finding the usual pattern. Keep the date, device, setting and medicine list with it. If treatment is already in place, the useful question is whether the average and tolerability support the current plan. Individual targets depend on the guideline used and the person’s health.",
        "sources": [
          "esc-blood-pressure"
        ],
        "kind": "education"
      }
    ]
  },
  "home-pressure": {
    "title": "Collect readings that can guide a decision.",
    "blocks": [
      {
        "id": "home-pressure-1",
        "title": "Prepare the measurement",
        "text": "Use a validated automatic upper-arm monitor with a cuff that fits your arm. For 30 minutes beforehand, avoid smoking, caffeine and exercise. Empty your bladder, then sit quietly for at least five minutes. Support your back, place your feet flat on the floor and rest the bare arm at heart level. Keep still and avoid talking during the measurement. These details reduce avoidable variation and make it easier to compare one day with another.",
        "sources": [
          "home-pressure"
        ],
        "kind": "education"
      },
      {
        "id": "home-pressure-2",
        "title": "Keep the series",
        "text": "Take two readings one minute apart and record both, together with the time. Ask your clinician which days and times they want, how long to collect the series and how they will calculate the average. Keep the full record instead of selecting the lowest readings. Bring the monitor to a visit so its fit and accuracy can be checked. A clear series can help distinguish a usual elevation from a result influenced by the clinic setting.",
        "sources": [
          "home-pressure",
          "esc-blood-pressure"
        ],
        "kind": "education"
      },
      {
        "id": "home-pressure-3",
        "title": "Agree on what would change the plan",
        "text": "Before starting the log, ask what result should prompt contact and when the series will be reviewed. An unexpectedly high or low value deserves the instructions agreed with your clinician. New chest pain, fainting or severe breathing difficulty needs urgent medical assessment. A home record is most valuable when it leads to a decision about confirmation, treatment or maintenance. Repeatedly checking without a review plan can make the numbers harder to live with without answering a new question.",
        "sources": [
          "home-pressure",
          "exercise-safety"
        ],
        "kind": "education"
      }
    ]
  },
  "lipids": {
    "title": "Read the lipid panel as a connected picture.",
    "blocks": [
      {
        "id": "lipids-1",
        "title": "What travels in the blood",
        "text": "Cholesterol is used to build cells and make hormones. Because it cannot travel freely in watery blood, it moves inside particles called lipoproteins. LDL carries cholesterol in particles that can contribute to plaque in artery walls. HDL takes part in cholesterol transport, but its concentration alone cannot tell you how well that transport works. Total cholesterol combines several types. Triglycerides are another blood fat, used for energy. A full panel separates these measurements so the prevention discussion can be more specific.",
        "sources": [
          "lipid-tests"
        ],
        "kind": "education"
      },
      {
        "id": "lipids-2",
        "title": "Why pressure and cholesterol belong together",
        "text": "Blood pressure describes a mechanical load on the circulation. Cholesterol measurements describe part of the material carried through it. Smoking, diabetes, age and family history add further information about future cardiovascular risk. A reassuring value in one area can coexist with a reason to act in another. This is why your clinician considers the combination when deciding how much benefit a prevention treatment might offer. The reference comparison on the cover translates that combination into a model result.",
        "sources": [
          "score2-scope",
          "lipid-followup"
        ],
        "kind": "education"
      },
      {
        "id": "lipids-3",
        "title": "A result worth bringing to the conversation",
        "text": "Bring the original panel with its units and any earlier values. LDL or non-HDL cholesterol can help frame treatment goals. Non-HDL cholesterol means total cholesterol minus HDL and includes cholesterol in several potentially harmful particle types. Your clinician may consider ApoB or Lp(a) when they answer an additional question about risk. A target depends on the whole risk picture and current care. The most useful follow-up asks whether a sustainable change or treatment has improved the relevant marker.",
        "sources": [
          "lipid-tests",
          "lipid-followup"
        ],
        "kind": "education"
      }
    ]
  },
  "advanced-lipids": {
    "title": "Understand what ApoB and Lp(a) add.",
    "blocks": [
      {
        "id": "advanced-lipids-1",
        "title": "Particle number and cholesterol content",
        "text": "ApoB is a protein on several particles that can enter artery walls. Its concentration helps estimate the number of these particles. LDL cholesterol describes the cholesterol carried in one particle group. Those are related measurements, but the amount of cholesterol in each particle can vary. ApoB can therefore add context when cholesterol content and particle number appear to disagree, including in some people with metabolic problems. Its usefulness depends on whether it changes the prevention decision.",
        "sources": [
          "apob-consensus"
        ],
        "kind": "education"
      },
      {
        "id": "advanced-lipids-2",
        "title": "An inherited part of the picture",
        "text": "Lipoprotein(a), usually written Lp(a), is a separate type of particle with a strongly inherited concentration. Higher levels can add cardiovascular risk even when other cholesterol values look satisfactory. Lifestyle changes remain useful for the wider risk picture, although they usually have little effect on Lp(a) itself. If it is raised, the discussion often focuses on managing other risk factors carefully and considering family history. This is different from interpreting the result as evidence that a person has eaten badly.",
        "sources": [
          "lpa-consensus"
        ],
        "kind": "education"
      },
      {
        "id": "advanced-lipids-3",
        "title": "Keep the units and the question",
        "text": "Lp(a) may be reported in mg/dL or nmol/L. The units describe different properties and there is no single exact conversion suitable for every person. Keep a result with a less-than sign exactly as the laboratory reported it. The extra measurements can refine a conversation, but they do not replace the inputs used by the risk equation on the cover. Ask whether the added information changes a treatment goal, a family discussion or a decision to keep the current plan.",
        "sources": [
          "lpa-consensus"
        ],
        "kind": "education"
      }
    ]
  },
  "heart-food": {
    "title": "Change a meal in ways that support the circulation.",
    "blocks": [
      {
        "id": "heart-food-1",
        "title": "A practical pattern for pressure",
        "text": "The DASH eating pattern was developed to help lower blood pressure. It brings together vegetables, fruit, whole grains, beans, nuts and suitable sources of protein and dairy, while limiting foods high in saturated fat and sodium. Sodium helps regulate fluid balance. Larger habitual intakes can make blood-pressure control harder. Much of it can come from bread, processed meat, ready meals and sauces, so comparing labels can be more informative than watching the saltshaker alone.",
        "sources": [
          "dash-eating",
          "heart-foods"
        ],
        "kind": "education"
      },
      {
        "id": "heart-food-2",
        "title": "Connect the choice to cholesterol",
        "text": "For LDL cholesterol, the replacement matters. Using olive or another unsaturated oil in place of butter, or beans and fish in place of some fatty processed meats, changes the type of fat in the meal. Oats, beans and other fibre-rich foods can also support cholesterol management. A useful first experiment might be a different breakfast or one familiar evening meal. These are examples to adapt to taste, budget and allergies. Regular meals that fit your life are easier to sustain than a completely unfamiliar menu.",
        "sources": [
          "cholesterol-treatment",
          "heart-foods"
        ],
        "kind": "education"
      },
      {
        "id": "heart-food-3",
        "title": "Give a supplement a specific job",
        "text": "A supplement needs a reason, such as a demonstrated deficiency or an agreed clinical indication. The age comparison does not identify such a need. Take the product name, ingredient amounts and medicine list to a pharmacist before combining products. Potassium-containing salt substitutes also need individual advice when kidney disease or certain medicines affect potassium balance. Food choices can support prevention alongside prescribed treatment. A useful review asks about the blood-pressure average, the relevant lipid marker and whether the routine was manageable.",
        "sources": [
          "supplement-use",
          "kidney-food"
        ],
        "kind": "education"
      }
    ]
  },
  "metabolic-biology": {
    "title": "Follow glucose from a meal to the cells.",
    "blocks": [
      {
        "id": "metabolic-biology-1",
        "title": "Fuel, storage and the role of insulin",
        "text": "Carbohydrate in food is broken down into sugars, including glucose, which enters the bloodstream. The pancreas releases insulin, a hormone that helps muscle and other tissues take up glucose and use or store it. The liver also stores and releases glucose between meals. These organs work together, which is why glucose is affected by more than the amount of sugar eaten at the last meal. Illness, medicines and the time of sampling can change the picture.",
        "sources": [
          "diabetes-explained"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-biology-2",
        "title": "What insulin resistance means",
        "text": "With insulin resistance, cells respond less effectively to insulin. The pancreas may compensate by releasing more, so blood glucose can remain within its usual range for a time. If compensation becomes insufficient, glucose rises. Body-fat distribution, activity, inherited susceptibility and other circumstances can contribute. A waist measurement and family history help a risk model identify patterns across populations. Establishing your current glucose status requires appropriate testing. The questionnaire cannot show how much insulin your pancreas is making.",
        "sources": [
          "insulin-resistance"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-biology-3",
        "title": "Why several systems appear in one discussion",
        "text": "Glucose regulation, blood pressure and blood fats often need to be considered together. Each has a different measurement, and each can change the prevention plan. Over time, diabetes can affect the heart, kidneys, eyes and nerves. This is a reason to clarify an abnormal pattern early, including when someone feels well. It does not mean that this questionnaire has found damage. The next useful question is whether a blood result or an existing diagnosis changes the type of support that is appropriate.",
        "sources": [
          "diabetes-explained",
          "glucose-followup"
        ],
        "kind": "education"
      }
    ]
  },
  "glucose-tests": {
    "title": "Choose the blood test that answers the question.",
    "blocks": [
      {
        "id": "glucose-tests-1",
        "title": "A snapshot and a longer exposure",
        "text": "Fasting glucose measures the concentration at one moment after the required fasting period. HbA1c, also called glycated haemoglobin, measures how much glucose has attached to the oxygen-carrying protein in red blood cells. It reflects roughly the preceding three months, with more influence from recent weeks. Its two common units are percent and mmol/mol. The result should always travel with its units. HbA1c can be useful when the question concerns a sustained pattern rather than one morning’s value.",
        "sources": [
          "a1c"
        ],
        "kind": "education"
      },
      {
        "id": "glucose-tests-2",
        "title": "When results need to be read differently",
        "text": "Red blood cells have a life cycle. Anaemia, blood loss or transfusion and some haemoglobin variants can change the relationship between HbA1c and actual glucose exposure. Kidney disease and pregnancy can also affect the choice of test. If symptoms or glucose readings disagree with HbA1c, that disagreement is information to investigate. A clinician may repeat a test or use another method. The original laboratory report helps establish which assay and interpretation apply.",
        "sources": [
          "a1c",
          "glucose-diagnosis"
        ],
        "kind": "education"
      },
      {
        "id": "glucose-tests-3",
        "title": "What a repeat is meant to establish",
        "text": "A repeat can confirm whether an unexpected value persists. An oral glucose tolerance test examines the response after a measured glucose drink and may answer a question that fasting glucose and HbA1c leave open. Tests and diagnostic thresholds have to be interpreted with symptoms and clinical context. Before arranging more testing, agree on the question and what each possible result would change. A habit review after a few weeks can happen earlier than a laboratory review of longer-term glucose exposure.",
        "sources": [
          "glucose-followup",
          "glucose-diagnosis"
        ],
        "kind": "education"
      }
    ]
  },
  "metabolic-food": {
    "title": "Build meals that support glucose regulation.",
    "blocks": [
      {
        "id": "metabolic-food-1",
        "title": "Think about the whole meal",
        "text": "Carbohydrate foods differ in their fibre content, portion size and the foods eaten with them. Whole grains, beans, vegetables and whole fruit bring nutrients and fibre. Sweet drinks make it easy to consume a large amount of sugar quickly. An ordinary meal can combine vegetables, a suitable protein source and a portion of whole-grain or another starchy food. Water or an unsweetened drink is a practical companion. The portion and combination should fit appetite, preferences and any existing care plan.",
        "sources": [
          "diabetes-food",
          "diet"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-food-2",
        "title": "Use a familiar choice as the experiment",
        "text": "For example, keep the meal time and replace a sweet drink with water, or include beans and vegetables in a lunch that previously left you hungry. Choose one change and notice hunger, enjoyment and how easy it is to repeat. If you use glucose-lowering medicines, a change in food amount or timing may need an agreed monitoring plan. Consistency gives you something interpretable to discuss. Several large changes made together make it harder to identify what was helpful.",
        "sources": [
          "diabetes-food",
          "hypoglycemia"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-food-3",
        "title": "Weight and waist require context",
        "text": "Waist circumference describes body-fat distribution imperfectly, while BMI relates weight to height and does not directly measure body fat. A weight-loss goal is most useful when it is appropriate to the person’s health and nutritional state. In people with higher-risk prediabetes and excess weight, a structured prevention programme may include modest sustained weight loss and activity support. The model’s food and coffee inputs describe statistical associations. They do not establish a personal requirement to consume a particular food or drink.",
        "sources": [
          "bmi",
          "prediabetes-living",
          "gdrs"
        ],
        "kind": "education"
      }
    ]
  },
  "metabolic-movement": {
    "title": "Give the muscles a regular role in glucose control.",
    "blocks": [
      {
        "id": "metabolic-movement-1",
        "title": "Why movement matters beyond calories",
        "text": "Working muscles use glucose for energy. Muscle contraction helps glucose enter cells, and regular activity can improve the response to insulin. Strength work supports the muscle used in everyday movement, while aerobic activity trains the heart and circulation to support sustained effort. These effects explain why activity belongs in metabolic care even when the bathroom scale changes little. The outcome to notice first can be a walk becoming easier, more consistent movement or improved ability to do ordinary tasks.",
        "sources": [
          "insulin-exercise",
          "exercise-benefits"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-movement-2",
        "title": "Find an intensity you can recognise",
        "text": "At a moderate effort, breathing is faster but conversation is still possible. At vigorous effort, speaking more than a few words becomes difficult. This talk test is often more practical than guessing a heart-rate zone. Adult guidance combines regular aerobic activity with strength work on at least two days, adapted to ability. Start from a typical week and build gradually. A short walk linked to an existing daily routine is one possible starting point when walking is appropriate for you.",
        "sources": [
          "activity-intensity",
          "adult-activity"
        ],
        "kind": "education"
      },
      {
        "id": "metabolic-movement-3",
        "title": "Keep activity compatible with care",
        "text": "Someone taking insulin or certain other diabetes medicines may need guidance about food, glucose checks and activity because exercise can lower glucose. Pain, a recent illness or a condition affecting exertion can change the starting point. Discuss these details before increasing intensity. The hours recorded by this questionnaire combine several activities and do not prove that every hour was moderate exercise. A useful next record describes the actual activity, effort and recovery, which makes the plan easier to adapt.",
        "sources": [
          "hypoglycemia",
          "exercise-safety",
          "gdrs"
        ],
        "kind": "education"
      }
    ]
  },
  "fasting": {
    "title": "Put fasting and supplements in their proper context.",
    "blocks": [
      {
        "id": "fasting-1",
        "title": "What an eating window changes",
        "text": "Time-restricted eating limits the hours in which food is eaten. It may help some people organise meals or reduce overall intake. In a 12-month randomised trial of adults with obesity, adding an eight-hour eating window to calorie restriction did not produce a statistically significant additional weight-loss benefit over calorie restriction alone. The result concerns that study population and comparison. It does not establish a fasting schedule for you or show that longer fasting improves an age estimate.",
        "sources": [
          "fasting-trial"
        ],
        "kind": "education"
      },
      {
        "id": "fasting-2",
        "title": "The practical question is suitability",
        "text": "Before restricting meal times, consider medicines, pregnancy, a history of eating difficulties, nutritional needs and the demands of work or training. Fasting while taking insulin or some other glucose-lowering medicines can cause low glucose. A clinician can help decide whether any change is suitable and how medicines and monitoring should be managed. A regular, adequate eating pattern is a reasonable starting point while those questions remain open. Fasting for a laboratory sample is a separate instruction with a specific testing purpose.",
        "sources": [
          "hypoglycemia",
          "diabetes-food"
        ],
        "kind": "education"
      },
      {
        "id": "fasting-3",
        "title": "Check the reason before buying a product",
        "text": "Products marketed for glucose control may contain herbs, vitamins or several ingredients together. Evidence for common products such as cinnamon, chromium or berberine is limited and varies between formulations. Interactions and quality also matter. If you are considering one, ask which outcome it is meant to improve, whether a deficiency has been demonstrated and how benefit and adverse effects would be assessed. Bring the actual label. A clear nutritional need or clinical indication is a stronger basis for a discussion than the promise of a younger score.",
        "sources": [
          "diabetes-supplements"
        ],
        "kind": "education"
      }
    ]
  },
  "kidney-work": {
    "title": "The kidneys do more than make urine.",
    "blocks": [
      {
        "id": "kidney-work-1",
        "title": "Filtration and the return of useful substances",
        "text": "Blood passes through tiny filtering units in the kidneys. These allow water and small substances into a filtered fluid. The kidney tubules then return much of the water and useful material to the blood, while wastes and surplus substances leave in urine. This continuous adjustment helps regulate fluid, salts and the body’s chemical balance. The amount of urine you pass and the estimated filtration rate answer different questions. Producing urine can continue even when kidney function has fallen.",
        "sources": [
          "kidney-physiology"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-work-2",
        "title": "Connections with the rest of the body",
        "text": "The kidneys also participate in blood-pressure regulation and produce signals involved in making red blood cells and maintaining bone health. That is why established kidney disease may require a wider review than creatinine alone. Your health team may consider blood counts, mineral balance and medicines when the stage and clinical situation make them relevant. These functions help explain the importance of kidney care, but an isolated filtration comparison cannot establish that any of them is impaired.",
        "sources": [
          "kidney-physiology",
          "kidney-management"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-work-3",
        "title": "Read the laboratory information as a pair",
        "text": "A blood-based estimate asks how well the kidneys are filtering. Urine albumin asks whether an important protein is leaking through. Both need dates and context, and changes over time can matter more than a comparison with an age-group average. For someone without known disease, the practical aim is to understand whether the pattern is stable and whether further assessment is useful. For someone receiving kidney care, the existing plan and clinical measurements take priority over an age comparison.",
        "sources": [
          "kidney-tests",
          "kdigo-ckd"
        ],
        "kind": "education"
      }
    ]
  },
  "filtration": {
    "title": "Understand creatinine, cystatin C and eGFR.",
    "blocks": [
      {
        "id": "filtration-1",
        "title": "An estimate from a blood concentration",
        "text": "Creatinine is a waste product related to muscle metabolism. The kidneys clear it from blood. The CKD-EPI equation combines its concentration with age and the sex variable used by the equation to estimate glomerular filtration rate, abbreviated eGFR. The units mL/min/1.73 m² describe estimated millilitres filtered per minute after standardising to a reference body surface area. The number is an estimate with biological and measurement variation. Its usefulness comes from the clinical setting and the pattern over time.",
        "sources": [
          "ckd-epi-2021",
          "kidney-context"
        ],
        "kind": "education"
      },
      {
        "id": "filtration-2",
        "title": "Why muscle and sampling conditions matter",
        "text": "Muscle mass, recent strenuous exercise, a meat-heavy meal and creatine products can affect creatinine independently of filtration. Some medicines also alter its interpretation. A lower concentration can occur with less muscle, so a lower creatinine is not automatically a healthier result. Keep unusual exercise, dietary changes, supplements and medicines with the record. Comparing similar sampling conditions helps a clinician decide whether a change probably reflects kidney function or another influence.",
        "sources": [
          "creatinine-explained",
          "kidney-context"
        ],
        "kind": "education"
      },
      {
        "id": "filtration-3",
        "title": "When cystatin C can add clarity",
        "text": "Cystatin C is another blood marker used to estimate filtration. It is affected by different influences from creatinine, and combining both can improve estimation in appropriate circumstances. It still needs clinical interpretation. If a treatment or drug dose depends on filtration, disagreement between estimates may justify a closer assessment. The age comparison in this app follows the creatinine-based reference, even when a combined eGFR is also available. Keep both estimates labelled so their different roles remain clear.",
        "sources": [
          "ckd-epi-2021",
          "kdigo-ckd"
        ],
        "kind": "education"
      }
    ]
  },
  "urine": {
    "title": "Understand what urine albumin can reveal.",
    "blocks": [
      {
        "id": "urine-1",
        "title": "Leakage is a separate question",
        "text": "Albumin is a protein normally retained in the blood. A urine albumin-to-creatinine ratio, called ACR or uACR, measures albumin relative to creatinine in the same urine sample. The ratio helps account for how dilute the sample is. Blood creatinine and urine creatinine therefore have different roles in these tests. An increased ACR can provide information about kidney damage and future risk even when estimated filtration is preserved. An ordinary urine dipstick may not provide the same quantitative information.",
        "sources": [
          "kidney-tests",
          "albumin-urine"
        ],
        "kind": "education"
      },
      {
        "id": "urine-2",
        "title": "Persistence changes interpretation",
        "text": "A temporary rise can occur around strenuous exercise, illness or other sampling circumstances. An unexpected result may need confirmation using the collection method your clinician recommends. Chronic kidney disease involves abnormalities that persist for at least three months, or other established evidence of chronicity. That duration is part of defining a chronic condition, and an important new abnormal result can need attention sooner. A missing urine value leaves this part of the assessment open.",
        "sources": [
          "kdigo-ckd",
          "albumin-urine"
        ],
        "kind": "education"
      },
      {
        "id": "urine-3",
        "title": "Bring the pair and the trend",
        "text": "Ask how the filtration estimate and urine result fit together, whether either needs repeating and what would change care. The original ACR units, usually mg/g or mg/mmol, matter. Bring earlier dates and values rather than just the most recent flag. Blood pressure, diabetes history and medicines help explain why two people with similar eGFR may receive different advice. A careful comparison can support reassurance, further investigation or a specific kidney-protection discussion.",
        "sources": [
          "kdigo-ckd",
          "kidney-management"
        ],
        "kind": "education"
      }
    ]
  },
  "kidney-food": {
    "title": "Match food and fluids to the actual kidney question.",
    "blocks": [
      {
        "id": "kidney-food-1",
        "title": "Start with what is known",
        "text": "A kidney comparison age by itself does not specify a renal diet. For someone with stable function and no established kidney disease, a varied eating pattern and attention to blood pressure can be a useful foundation. In confirmed kidney disease, the stage, blood potassium and phosphorus, medicines and nutritional state can change the advice. This distinction matters because unnecessary restriction can make meals harder to manage and reduce nutritional adequacy. A kidney dietitian can translate relevant laboratory findings into an individual plan.",
        "sources": [
          "kidney-food"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-food-2",
        "title": "Protein, sodium and potassium have different roles",
        "text": "Protein supports tissue repair and muscle, while its metabolism produces wastes cleared by the kidneys. The appropriate amount can change with kidney disease and dialysis. Sodium affects fluid balance and blood pressure. Potassium is essential for nerve and muscle function, but blood levels may require adjustment in some kidney conditions. Restricting all fruit, vegetables or protein from this result alone would miss these distinctions. Ask which nutrient needs attention, which result supports that decision and what foods can still be enjoyed.",
        "sources": [
          "kidney-food",
          "kidney-management"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-food-3",
        "title": "Use fluids for an agreed purpose",
        "text": "Avoiding dehydration matters, but deliberately forcing large amounts of water is not a treatment for a filtration estimate. Fluid needs vary with heat, activity, illness, heart function and kidney care. Some people need a prescribed fluid limit. If you have vomiting, diarrhoea or difficulty drinking, seek advice about hydration and the medicines you take. Keep any existing fluid plan with the report. A useful meal change might be comparing sodium on two familiar foods, while leaving specialised restrictions to an individual assessment.",
        "sources": [
          "kidney-food",
          "kidney-medicines"
        ],
        "kind": "education"
      }
    ]
  },
  "kidney-care": {
    "title": "Protect kidney function in the wider health plan.",
    "blocks": [
      {
        "id": "kidney-care-1",
        "title": "Pressure and glucose are connected to filtration",
        "text": "High blood pressure and diabetes are important causes of kidney disease. The kidneys also help regulate blood pressure, so problems can reinforce one another. If either condition is established, an agreed treatment plan can protect more than one organ system. Bring the home-pressure record or relevant glucose results to the kidney discussion. A clinician may consider kidney-protective medicines when a diagnosis and its indications are established. The decision depends on filtration, urine albumin, tolerability and the existing treatment.",
        "sources": [
          "kidney-management",
          "kdigo-ckd"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-care-2",
        "title": "Review everyday medicines and products",
        "text": "Some anti-inflammatory painkillers, including ibuprofen and naproxen, can harm the kidneys in susceptible circumstances, particularly around dehydration or low blood pressure. A pharmacist can check prescription medicines, cold remedies, painkillers and supplements together. Bring the names and doses, including products used only occasionally. If you become unwell, ask for an individual plan for fluids, medicines and when to seek care. Changes to prescribed medicines should follow that plan rather than an assumption based on the comparison age.",
        "sources": [
          "kidney-medicines"
        ],
        "kind": "education"
      },
      {
        "id": "kidney-care-3",
        "title": "Support function without chasing a lower creatinine",
        "text": "Appropriate activity supports daily function and cardiovascular health. Preserve useful muscle and adequate nutrition, especially when appetite or strength has declined. A change in muscle mass can change creatinine without an equivalent change in kidney filtration, so the number needs context. Discuss a suitable activity pattern when a condition limits exertion. The goals are a stable clinical picture, manageable blood pressure and glucose when relevant, and the ability to live well. These outcomes are more informative than an age comparison alone.",
        "sources": [
          "kidney-management",
          "creatinine-explained",
          "activity"
        ],
        "kind": "education"
      }
    ]
  },
  "aerobic": {
    "title": "Understand what aerobic activity trains.",
    "blocks": [
      {
        "id": "aerobic-1",
        "title": "A connected oxygen-delivery system",
        "text": "During sustained movement, the lungs bring oxygen into the blood, the heart pumps it through the circulation and muscles use it to release energy. Regular aerobic activity challenges this connected system and can make a familiar effort easier. Walking, cycling, swimming and dancing can all contribute when suited to your ability. Benefits include support for blood pressure, glucose regulation and everyday stamina. The activity does not have to look like competitive sport to be useful.",
        "sources": [
          "exercise-benefits"
        ],
        "kind": "education"
      },
      {
        "id": "aerobic-2",
        "title": "Give intensity an everyday meaning",
        "text": "Moderate effort usually allows conversation while making singing difficult. Vigorous effort makes sustained conversation harder. A pace that is easy for one person may be demanding for another, which is why perceived effort matters. General adult guidance is 150–300 minutes of moderate aerobic activity a week, or 75–150 vigorous minutes, or an equivalent combination. A minute of vigorous activity counts roughly as two moderate minutes for that guideline. Short bouts can count, and the total can be spread across the week.",
        "sources": [
          "activity-intensity",
          "activity"
        ],
        "kind": "education"
      },
      {
        "id": "aerobic-3",
        "title": "Build a repeatable dose",
        "text": "Choose a familiar activity and observe how it feels during the session and the following day. Add duration or frequency gradually before making several parts harder at once. Warm up with easier movement and ease down at the end. Chest discomfort, fainting or unusual breathlessness calls for medical assessment. Someone with a condition affecting exercise can work with their care team on a suitable starting point. An established routine may need protection and variety more than extra minutes.",
        "sources": [
          "exercise-safety",
          "adult-activity"
        ],
        "kind": "education"
      }
    ]
  },
  "fitness-oxygen": {
    "title": "Make sense of VO₂peak and the comparison age.",
    "blocks": [
      {
        "id": "fitness-oxygen-1",
        "title": "Oxygen use at a demanding effort",
        "text": "VO₂peak describes the highest oxygen uptake reached during a test. The relative units mL/kg/min mean millilitres of oxygen per kilogram of body weight per minute. This lets researchers compare people of different sizes, although body composition and the test conditions still matter. Aerobic capacity reflects contributions from the heart, lungs, blood and working muscles. Everyday performance also depends on strength, technique, balance and the task. A single oxygen figure therefore answers only part of the question of physical function.",
        "sources": [
          "friend-2022",
          "exercise-benefits"
        ],
        "kind": "education"
      },
      {
        "id": "fitness-oxygen-2",
        "title": "What an estimate uses",
        "text": "A nonexercise equation estimates capacity from the inputs required by that study, such as age, body measurements, resting pulse or reported activity. Those relationships describe groups and leave individual variation. Resting pulse can be influenced by fitness, medicines, illness and measurement conditions. A lower pulse alone does not establish better capacity. The method printed on the cover identifies which comparison was available for your age and inputs. Keep that method with the result when looking back.",
        "sources": [
          "hunt-nonexercise",
          "bradshaw-fitness",
          "blsa-fitness"
        ],
        "kind": "education"
      },
      {
        "id": "fitness-oxygen-3",
        "title": "Translate the comparison back into daily life",
        "text": "The comparison age places the model result against a study reference. An age band reflects the reference groups available in that study. It gives no exact age for the heart or lungs. Choose a practical companion outcome, such as an easier familiar hill, less effort carrying shopping or completing a usual session with comfortable recovery. Record the activity and conditions. Progress in function can be worthwhile even when a model estimate or age band changes little.",
        "sources": [
          "hunt-reference",
          "friend-2022"
        ],
        "kind": "education"
      }
    ]
  },
  "fitness-test": {
    "title": "Know what a supervised test adds.",
    "blocks": [
      {
        "id": "fitness-test-1",
        "title": "Measuring the exercise response",
        "text": "A cardiopulmonary exercise test measures gas exchange while the workload rises, commonly on a treadmill or cycle. It observes oxygen uptake during actual effort. The test can provide more detail about the exercise response when that information would change care or training advice. Treadmill and cycle results have different reference values. A questionnaire estimate, a watch estimate and a supervised gas-exchange result should each keep their own label and method.",
        "sources": [
          "cpet-explained"
        ],
        "kind": "education"
      },
      {
        "id": "fitness-test-2",
        "title": "Effort is part of the result",
        "text": "Peak respiratory exchange ratio, abbreviated RER, relates carbon dioxide output to oxygen uptake. It is one piece of information about the effort reached and the physiological response. It is interpreted alongside the protocol, symptoms and the test team’s findings. Keep the original report with peak RER and the test type. If these details are missing, ask for them rather than trying to convert the comparison age into a training zone.",
        "sources": [
          "friend-2022"
        ],
        "kind": "education"
      },
      {
        "id": "fitness-test-3",
        "title": "Choose measurement according to its purpose",
        "text": "A person who wants a repeatable walking habit may gain more initially from a simple activity record. A person with unexplained exercise limitation may need clinical assessment, with testing chosen by the clinician. If a supervised test is repeated, use a comparable protocol and record changes in medicines, body weight, illness and training. A difference can reflect several influences. Ask what decision the additional measurement would support before making testing itself the goal.",
        "sources": [
          "exercise-safety",
          "friend-2022"
        ],
        "kind": "education"
      }
    ]
  },
  "strength": {
    "title": "Give strength a place alongside aerobic fitness.",
    "blocks": [
      {
        "id": "strength-1",
        "title": "What strength supports",
        "text": "Strength makes everyday tasks possible, including rising from a chair, climbing steps and carrying objects. Muscle-strengthening work asks muscles to work against a load. The load can come from body weight, resistance bands, machines or weights. General adult guidance includes work for the major muscle groups on at least two days a week. An aerobic estimate does not measure this part of function, so a satisfactory comparison age can still leave strength as a useful area to understand.",
        "sources": [
          "adult-activity"
        ],
        "kind": "education"
      },
      {
        "id": "strength-2",
        "title": "Make the first session teach you something",
        "text": "A qualified exercise professional can help select movements and demonstrate technique. For a suitable beginner, examples might include a supported sit-to-stand, a light pulling movement and a wall push-up. Start with a load and range that can be controlled comfortably. The example is a conversation starter, and an injury or medical limitation can require different movements. Notice technique, breathing and next-day tolerance before increasing difficulty. A record of what felt manageable makes the next session easier to judge.",
        "sources": [
          "adult-activity",
          "exercise-safety"
        ],
        "kind": "education"
      },
      {
        "id": "strength-3",
        "title": "Review ability as well as attendance",
        "text": "A useful progression preserves control and recovery. When a familiar task feels easier, discuss whether to add a small amount of resistance or another manageable session. Strength work, adequate food and rest support one another. If appetite is poor, weight is falling unintentionally or pain persists, the plan needs a different conversation. Someone already training regularly can review balance between muscle groups and recovery. More sessions are helpful only when they serve a goal and remain tolerable.",
        "sources": [
          "adult-activity",
          "weight-change",
          "exercise-safety"
        ],
        "kind": "education"
      }
    ]
  },
  "fuel": {
    "title": "Support training with food and recovery.",
    "blocks": [
      {
        "id": "fuel-1",
        "title": "Give the session enough fuel",
        "text": "A varied diet provides carbohydrate for working muscles, protein for repair and the vitamins and minerals needed for normal function. For most ordinary activity, regular meals and access to water are a practical foundation. Longer or harder exercise can change fuel and fluid needs. Consider the whole day, including appetite after exercise and the next meal. Restricting food to make a relative fitness number look better can undermine the strength and recovery the plan is meant to support.",
        "sources": [
          "sport-nutrition",
          "diet"
        ],
        "kind": "education"
      },
      {
        "id": "fuel-2",
        "title": "Protein powder and creatine answer different questions",
        "text": "Protein powder is one way to meet a protein need when ordinary meals are insufficient or inconvenient. It has to be considered within total intake. Creatine has evidence for some repeated high-intensity and strength tasks, with variable individual responses. It is not a direct treatment for a low aerobic estimate. Before using a product, clarify the activity goal and relevant medical context. Kidney disease, pregnancy, medicines or unexplained symptoms call for individual advice about suitability.",
        "sources": [
          "sport-nutrition",
          "supplement-use"
        ],
        "kind": "education"
      },
      {
        "id": "fuel-3",
        "title": "Look for a reason to add something",
        "text": "Tiredness alone does not establish iron, vitamin B12 or another nutrient deficiency. Persistent fatigue, unexpected breathlessness, declining performance or unintentional weight loss deserves assessment of possible causes. Bring any products already used, including stimulant-containing pre-workouts. Ingredients can overlap and interactions may matter. A useful nutritional change should improve adequacy, tolerability or an agreed clinical outcome. The first review can ask whether sessions feel adequately fuelled and whether recovery is comfortable.",
        "sources": [
          "sport-nutrition",
          "supplement-use",
          "weight-change"
        ],
        "kind": "education"
      }
    ]
  },
  "recovery": {
    "title": "Let sleep and recovery support the next day.",
    "blocks": [
      {
        "id": "recovery-1",
        "title": "Sleep has a rhythm and a quality",
        "text": "Sleep is an active biological process. The body cycles through stages, while an internal daily clock helps coordinate sleep and wakefulness with light and other cues. Enough sleep opportunity and a reasonably regular schedule support alertness and daily function. Time in bed, time asleep and feeling restored are different measurements. A wearable can offer a rough pattern, while your ability to stay alert and function during the day adds information the score may miss.",
        "sources": [
          "sleep-physiology",
          "sleep-clock"
        ],
        "kind": "education"
      },
      {
        "id": "recovery-2",
        "title": "Observe the response to the routine",
        "text": "Notice whether a session leaves you comfortably tired, unusually depleted or limited the following day. Keep harder and easier activity in a pattern that allows recovery. A brief note about sleep, effort and next-day function can show when work, caring duties or illness make the usual plan harder. Change one part of the routine at a time where practical. A lighter week can preserve consistency while the reason for a change in tolerance is clarified.",
        "sources": [
          "exercise-safety",
          "adult-activity"
        ],
        "kind": "education"
      },
      {
        "id": "recovery-3",
        "title": "When more sleep advice leaves a question unanswered",
        "text": "Persistent difficulty falling or staying asleep can justify a discussion about insomnia and treatments such as cognitive behavioural therapy for insomnia. Loud snoring, breathing pauses or gasping and marked daytime sleepiness can point toward a different assessment, including sleep apnoea. These are questions to raise when relevant. New or persistent exercise intolerance also deserves its own review. A better daily routine can support wellbeing while the cause of a symptom is being assessed.",
        "sources": [
          "insomnia",
          "apnea",
          "exercise-safety"
        ],
        "kind": "education"
      }
    ]
  },
  "daily-food": {
    "title": "Use everyday food choices to support several systems.",
    "blocks": [
      {
        "id": "daily-food-1",
        "title": "What the food question can tell you",
        "text": "Fruit and vegetable intake describes one useful part of an eating pattern. A full picture also includes grains, protein sources, fats, drinks, portions and regularity. Carbohydrate provides energy, protein supports tissues and fat has structural and energy roles. Fibre supports digestive health and comes from foods such as vegetables, whole fruit, beans and whole grains. Variety helps cover nutritional needs. The recorded portion answer can suggest a place to explore, while leaving the rest of the diet open.",
        "sources": [
          "diet",
          "healthy-eating-living"
        ],
        "kind": "education"
      },
      {
        "id": "daily-food-2",
        "title": "Connect the meal to a purpose",
        "text": "A meal with vegetables, a suitable protein source and a fibre-rich carbohydrate can support fullness and nutritional adequacy. Replacing some saturated fat with unsaturated fat can support cholesterol management. Comparing sodium on familiar packaged foods can help with blood-pressure care. The same meal can therefore serve more than one goal. Choose a change that is relevant to your situation, such as adding vegetables to a lunch or planning an affordable protein source for an evening meal.",
        "sources": [
          "heart-foods",
          "cholesterol-treatment",
          "healthy-eating-living"
        ],
        "kind": "education"
      },
      {
        "id": "daily-food-3",
        "title": "Review adequacy before restriction",
        "text": "Before fasting, cutting out a food group or buying supplements, consider whether the current pattern meets your needs. Allergies, kidney disease, diabetes medicines, pregnancy and a history of eating difficulties can require a different approach. A dietitian can work with these circumstances and personal preferences. Track the change through appetite, energy, enjoyment and the ability to keep it. If a laboratory outcome is relevant, decide separately which test would answer a clinical question and when it should be reviewed.",
        "sources": [
          "healthy-eating-living",
          "supplement-use"
        ],
        "kind": "education"
      }
    ]
  },
  "sleep-routine": {
    "title": "Turn a sleep concern into a useful observation.",
    "blocks": [
      {
        "id": "sleep-routine-1",
        "title": "Separate opportunity, timing and restoration",
        "text": "When sleep feels unsatisfactory, first ask whether there is enough opportunity to sleep, whether the timing changes greatly and whether you feel restored after a reasonable night. These lead to different next steps. Work and caring duties can limit opportunity. Trouble falling asleep despite opportunity raises another question. Consistently feeling unrefreshed can deserve assessment even with sufficient hours. Record what actually happens before deciding that an earlier bedtime is the whole answer.",
        "sources": [
          "sleep",
          "sleep-physiology"
        ],
        "kind": "education"
      },
      {
        "id": "sleep-routine-2",
        "title": "Try a short diary",
        "text": "For a practical two-week observation, note bedtime, approximate time asleep, waking, prolonged awakenings, naps and how you feel in the morning and afternoon. Include caffeine, alcohol, late work and caring interruptions when relevant. Choose one manageable adjustment, such as a more consistent wake time or protecting a wind-down period. The two weeks are an editorial check-in example. They help reveal a pattern and barriers, without promising a recovery deadline.",
        "sources": [
          "sleep",
          "sleep-clock"
        ],
        "kind": "editorial"
      },
      {
        "id": "sleep-routine-3",
        "title": "Decide what the diary changes",
        "text": "If opportunity is the difficulty, discuss practical changes to the schedule or support available. If persistent insomnia is the difficulty, ask about cognitive behavioural therapy for insomnia and whether assessment is needed. Breathing pauses, gasping or significant daytime sleepiness deserve a separate conversation about possible sleep apnoea. The questionnaire has not collected those symptoms. The outcome to review is daytime function and more restorative sleep, with further investigation chosen for the actual concern.",
        "sources": [
          "insomnia",
          "apnea"
        ],
        "kind": "education"
      }
    ]
  },
  "everyday-measures": {
    "title": "Understand the measurements behind common health advice.",
    "blocks": [
      {
        "id": "everyday-measures-1",
        "title": "Body size is one part of the picture",
        "text": "Body mass index, or BMI, relates weight to the square of height. It is a screening measure that cannot distinguish muscle from fat or describe where fat is carried. Waist circumference adds information about distribution but also depends on the measurement method. Weight history, appetite, muscle function and health conditions matter when interpreting either. A questionnaire answer alone cannot establish the best personal weight. An appropriate goal may be stability, improved function or a clinically supported change.",
        "sources": [
          "bmi",
          "healthy-eating-living"
        ],
        "kind": "education"
      },
      {
        "id": "everyday-measures-2",
        "title": "Blood pressure and blood results measure different things",
        "text": "Blood pressure records the force on artery walls, with systolic pressure during a heartbeat and diastolic pressure between beats. A lipid panel separates cholesterol and other blood fats. Glucose and HbA1c examine sugar regulation over different time periods. These measurements can inform prevention when a clinical question makes them useful. The lifestyle profile records habits and reported history. It leaves an unmeasured marker unknown, even when the recorded routine appears reassuring.",
        "sources": [
          "pressure-basics",
          "lipid-tests",
          "a1c"
        ],
        "kind": "education"
      },
      {
        "id": "everyday-measures-3",
        "title": "Give an additional test a purpose",
        "text": "When you next discuss health screening, bring your age, family history, symptoms, medicines and any prior results. Ask which question a proposed measurement would answer and how the answer would change care. If an earlier result is being followed, comparable conditions and a clear review plan help. Regularly tracking a habit is a separate task from repeatedly testing blood. Both can be useful, but they should each earn their place in the plan.",
        "sources": [
          "lab-intervals"
        ],
        "kind": "editorial"
      }
    ]
  },
  "stress-routine": {
    "title": "Make room for the pressures around the routine.",
    "blocks": [
      {
        "id": "stress-routine-1",
        "title": "Describe the difficulty in daily terms",
        "text": "Stress can make it harder to sleep, prepare meals or keep a routine. The useful starting point is what happens and how much it affects your day. Notice whether the difficulty is temporary, recurring or persistent, and which demands are involved. A stress answer records your experience. It does not measure cortisol or establish the cause of a symptom or laboratory result. That distinction leaves room to address the actual difficulty without forcing every concern into a biomarker explanation.",
        "sources": [
          "stress-guide"
        ],
        "kind": "education"
      },
      {
        "id": "stress-routine-2",
        "title": "Choose one form of support",
        "text": "A practical first step may be asking for help with one recurring task, protecting a short break or keeping a regular conversation with someone supportive. Brief grounding skills can help bring attention back to the present when thoughts are overwhelming. Choose an option that is realistic in your circumstances and practise it consistently. If distress persists or daily function is affected, discuss professional support. The appropriate treatment depends on an assessment of the problem.",
        "sources": [
          "stress-guide"
        ],
        "kind": "education"
      },
      {
        "id": "stress-routine-3",
        "title": "Make the plan survive an ordinary week",
        "text": "A plan that requires extra time every day may fail during a busy week even when the idea is sound. Identify a smaller version that can be maintained, such as a shorter familiar walk or an easy meal prepared in advance. Keep a note of the barrier and the support that helped. At the next review, ask whether the routine became more manageable. Adjusting the size of a step is useful information about the plan rather than evidence of poor motivation.",
        "sources": [],
        "kind": "editorial"
      }
    ]
  },
  "habit-plan": {
    "title": "Turn the information into one workable experiment.",
    "blocks": [
      {
        "id": "habit-plan-1",
        "title": "Choose a change and a reason",
        "text": "Start with the question that matters most in this case. Choose one action that serves it and fits the routine you already have. Write down what you will do, when it fits and what might get in the way. A meal change can be attached to a regular shopping trip. A suitable activity can be linked to a familiar part of the day. If clarification of a result comes first, arranging that review is the useful action.",
        "sources": [],
        "kind": "editorial"
      },
      {
        "id": "habit-plan-2",
        "title": "Keep the first record small",
        "text": "For the next two weeks, keep a brief note of whether the action happened, how it felt and any barrier. This is an editorial planning example, not a validated treatment schedule. A busy day may need a smaller version of the action. At the end, decide what to keep, adapt or stop. If a change causes persistent pain, dizziness, unexpected symptoms or difficulties with eating, seek advice rather than simply pushing the target higher.",
        "sources": [
          "exercise-safety"
        ],
        "kind": "editorial"
      },
      {
        "id": "habit-plan-3",
        "title": "Separate the habit review from the clinical review",
        "text": "Consistency, tolerability and daily function can be reviewed before a blood test is repeated. A laboratory review needs its own question and appropriate interval. Ask which marker would change a decision, which conditions should be kept comparable and who will interpret it. An age comparison is one summary of the available inputs. The more useful longer-term record contains the original results, the relevant context and the changes you were actually able to maintain.",
        "sources": [
          "lab-intervals"
        ],
        "kind": "editorial"
      }
    ]
  },
  "arterial-wave": {
    "title": "Understand the arterial stiffness measurement.",
    "blocks": [
      {
        "id": "arterial-wave-1",
        "title": "A wave travelling through the arteries",
        "text": "Each heartbeat creates a pressure wave. Carotid–femoral pulse-wave velocity, written cfPWV, estimates how fast the wave travels along a defined arterial path and is reported in metres per second. It is used as a measure of arterial stiffness. It answers a different question from cholesterol concentration or the number of heartbeats per minute.",
        "sources": [
          "arterial-reference"
        ],
        "kind": "education"
      },
      {
        "id": "arterial-wave-2",
        "title": "The method and the pressure matter",
        "text": "The device, distance method, age and blood pressure affect the interpretation. Keep the original test report and the conditions under which it was measured. A reference comparison can place the result against a study population. It cannot establish the amount of plaque in an artery or substitute for assessment of symptoms.",
        "sources": [
          "arterial-reference"
        ],
        "kind": "education"
      },
      {
        "id": "arterial-wave-3",
        "title": "Use the additional information in the wider plan",
        "text": "Ask whether this result changes the prevention decision after blood pressure, lipids and clinical history are considered. If repeating the test would be useful, agree on a comparable method and purpose. The practical plan can still focus on the relevant risk factors, while an isolated stiffness comparison is interpreted in its measurement context.",
        "sources": [
          "arterial-reference",
          "score2-scope"
        ],
        "kind": "education"
      }
    ]
  }
};
export const FAMILY_EDUCATION_COPY = {
  "educationHeartRaised": "Your recorded pressure makes a useful measurement series the first practical step. The explanation below gives the two numbers a meaning, then shows how to collect a series worth reviewing. Food and movement can support prevention while your clinician decides whether the usual pressure needs treatment.",
  "educationHeartMaintain": "The recorded pressure does not trigger the app’s pressure follow-up note. Understanding the measurement still helps you maintain a useful baseline. The wider prevention discussion includes your lipid results, smoking history, medicines and any changes over time.",
  "educationNoGlucose": "There is no glucose or HbA1c result in this assessment. The model comparison comes from the questionnaire and body measurements. Read the blood-test chapter as an explanation of what could clarify current glucose status if testing is appropriate, while keeping unmeasured values unknown.",
  "educationGlucosePresent": "You supplied a glucose or HbA1c result, so the original value and units belong beside the risk discussion. A test can answer a question about current glucose exposure that the questionnaire alone leaves open. Whether the model uses a result and whether that result needs clinical follow-up are separate decisions.",
  "educationKidneyUrineMissing": "Your report includes a creatinine-based filtration estimate and no urine ACR result. The next chapters explain the information each would provide. If the purpose is a broader kidney assessment, ask whether urine albumin would change the interpretation given your history and earlier results.",
  "educationKidneyUrineKnown": "You supplied urine ACR as well as creatinine. Keep these results together when you discuss kidney health. The explanation below shows why filtration and leakage can lead to different questions, and why an unexpected result sometimes needs confirmation.",
  "educationFitnessEstimate": "This case uses an estimated aerobic comparison. The chapters below explain the inputs and the oxygen units so you can use the result sensibly. A practical activity record gives you an additional way to notice progress without treating a small change in the estimate as a measured training effect.",
  "educationFitnessMeasured": "This case uses a supervised exercise result. Keep the original test type and effort information with it. Understanding what was measured makes a later comparison more useful, while the practical plan can focus on the daily capacity you want to maintain or improve.",
  "educationActive": "Your recorded activity already reaches the general weekly aerobic minimum when moderate and vigorous minutes are combined. Preserve the routine that makes this possible. The useful next question is whether strength, recovery or a specific daily task deserves attention. Extra volume is an option to consider in context rather than the default response to an age comparison.",
  "educationStarter": "Your recorded aerobic minutes leave room to build toward the general adult guideline. If your usual activity is comfortable and your health permits, choose one small addition you can repeat. A short extra walk is one example. Keep the first review focused on consistency and recovery before increasing several parts of the week.",
  "educationAdapt": "The recorded health context calls for an adapted starting point. Bring the activity you would like to do, what currently limits it and your medicine list to someone familiar with your care. Ask which effort is appropriate and what symptoms should change the plan. The general explanations below can support that discussion.",
  "educationUnknownActivity": "This assessment does not provide a complete exercise-safety or training history. Use the movement chapter to understand the options, then choose a starting point that fits your current ability and any care plan. Recording a typical week first can make a more specific plan possible.",
  "educationHeartPlan": "For this case, begin with the prevention question on the opening page. If blood pressure needs confirmation, arrange the series and review first. If you currently smoke, access to cessation support can be a substantial part of the plan. Choose one food or movement adjustment that can fit alongside this work, then review its practicality before adding another.",
  "educationMetabolicPlan": "For this case, separate the current-glucose question from the longer-term prevention question. A relevant blood result may clarify the first. For the second, choose a meal pattern or suitable activity you can maintain and keep the recorded family history in view. If prediabetes or diabetes is confirmed, ask which structured support fits the diagnosis and your existing care.",
  "educationKidneyPlan": "For this case, start with the original creatinine and eGFR, any earlier results and the urine question explained above. Keep existing medicines and fluid advice with the record. A practical change can support blood-pressure care or an appropriate activity routine. Specialist nutrient restrictions or product changes need a specific clinical reason before becoming part of the plan.",
  "educationFitnessPlan": "For this case, choose one ordinary activity as the companion to the aerobic comparison. Keep the route or task comparable and note effort and recovery. If you already meet the aerobic guideline, protect that routine and consider whether strength or recovery is the more useful focus. If you are starting, aim first for a session that can be repeated comfortably.",
  "educationProfileSleepPlan": "In this case, begin with how restored you feel after sleep. Keep a short diary and choose one realistic change to sleep opportunity or timing. Keep existing activity at a tolerable level while you observe the pattern. At the review, decide whether the difficulty is improving or whether a symptom deserves its own assessment.",
  "educationProfilePlan": "In this case, select one of the habits explained above and write down a small, specific action. Keep routines that already work. Choose a day to review whether the action was realistic and useful. The questionnaire gives a starting point for that conversation, while personal goals and practical barriers still need your input.",
  "educationClinicalReview": "Prepare a short agenda for the next conversation. Bring the original results with dates and units, the medicines and supplements you use, and any change in symptoms or daily function. The questions below are selected for the recorded information. A new symptom or a substantial change in a result can change the priority and timing.",
  "educationReviewPurpose": "Agree on what happens after the review. That might be keeping an effective routine, clarifying a measurement, adapting the plan or arranging a test with a specific purpose. Ask who will review the result and how you will hear the decision. This closes the gap between collecting information and using it in your care.",
  "educationTrialTitle": "What prevention research can and cannot tell you.",
  "educationTrialContext": "The following trial studied adults already at high risk, including raised fasting and post-load glucose. Your questionnaire alone does not establish the same starting point. The research explains why structured support is worth discussing when testing and clinical history show it is relevant.",
  "educationTobaccoTitle": "Make quitting support practical.",
  "educationAlcoholTitle": "Understand the drinking pattern you recorded.",
  "educationEvidenceChecked": "Educational evidence checked 11 November 2026. Clinical review is pending.",
  "educationBeginnerExample": "One optional starting example, if ordinary walking is comfortable and your health permits it, is a short easy walk on three days you choose. Keep the first sessions easy enough to repeat and observe the following day. If this fits well, add a little time to one session before increasing both pace and frequency. Adapt or pause the example if symptoms or recovery make it unsuitable.",
  "educationMaintainExample": "For an established routine, keep the aerobic days that already fit your week. Choose one familiar task to observe under comparable conditions. Review whether strength work is already represented and whether sleep and food support comfortable recovery. Make any added challenge serve that specific gap. A busy week can use a smaller version of the existing routine while preserving its regular place in the day.",
  "educationHeartKidneyTitle": "Understand why kidney function can refine heart risk.",
  "educationHeartKidneyText": "You entered an eGFR from a laboratory report. Keep the laboratory’s method, date and units with the result. Some cardiovascular equations for people with type 2 diabetes use eGFR alongside HbA1c and other risk factors because kidney and cardiovascular health are connected. The blood-pressure and glucose care plans may therefore matter to both systems. Ask whether the original filtration result is stable and whether urine albumin adds useful information for your care."
};
