export function ageComparison(years, min, max) {
  if (years < min - 1e-9) return {ageRange:'below', boundary:min};
  if (years > max + 1e-9) return {ageRange:'above', boundary:max};
  return {age:Math.round(years)};
}

export function matchReference(value, ages, reference) {
  if (value > reference[0]) return {ageRange:'below', boundary:ages[0]};
  for (let i = 1; i < ages.length; i++) {
    if (value >= reference[i]) {
      const fraction = (reference[i - 1] - value) / (reference[i - 1] - reference[i]);
      return {age:Math.round(ages[i - 1] + fraction * (ages[i] - ages[i - 1]))};
    }
  }
  return {ageRange:'above', boundary:ages.at(-1)};
}

// Schiborn et al. (2022), supplement eResults 2. Anthropometry is in cm.
// The three diet quantities are average grams per day.
export function gdrsPoints({age, height, waist, hypertension, activity, smoking, cigarettes, wholeGrain, coffee, redMeat, parents, siblings}) {
  const smokingPoints = smoking === 'Current smoker' ? (cigarettes >= 20 ? 77 : 23)
    : smoking === 'Former smoker' ? (cigarettes >= 20 ? 45 : 15) : 0;
  const parentPoints = {'Neither parent':0, 'One parent':56, 'Both parents':106}[parents];
  return 5.1 * age - 2.7 * height + 7.6 * waist + (hypertension === 'Yes' ? 47 : 0)
    - 2 * activity + smokingPoints - 7 * wholeGrain / 50 - 5 * coffee / 150
    + 55 * redMeat / 150 + parentPoints + (siblings === 'Yes' ? 48 : 0);
}

function gdrsLogHazard(points, a1c) {
  if (a1c !== undefined) return Math.log(-Math.log(0.97854)) + (0.80 * points + 134.96 * a1c - 1112.63) / 100;
  return Math.log(-Math.log(0.96881)) + (0.8688 * points - 419.527) / 100;
}

export function gdrsRisk(points, a1c) {
  return -Math.expm1(-Math.exp(gdrsLogHazard(points, a1c)));
}

export function metabolicAge(factors, a1c) {
  // Compare both variants with the same app-defined, lower-risk base profile.
  const reference = gdrsPoints({
    age:0, height:factors.height, waist:factors.height / 2,
    hypertension:'No', activity:5, smoking:'Never smoked', wholeGrain:100,
    coffee:150, redMeat:0, parents:'Neither parent', siblings:'No',
  });
  const logHazard = gdrsLogHazard(gdrsPoints(factors), a1c);
  const years = (logHazard - gdrsLogHazard(reference)) / (0.8688 * 5.1 / 100);
  return ageComparison(years, 18, 79);
}

// 2021 CKD-EPI race-free adult equations, using standardized mg/dL and mg/L.
export function kidneyFiltration(age, sex, creatinine, cystatin) {
  const female = sex === 'Female';
  const cr = creatinine / (female ? 0.7 : 0.9);
  if (cystatin === undefined) {
    return 142 * Math.min(cr, 1) ** (female ? -0.241 : -0.302)
      * Math.max(cr, 1) ** -1.200 * 0.9938 ** age * (female ? 1.012 : 1);
  }
  const cys = cystatin / 0.8;
  return 135 * Math.min(cr, 1) ** (female ? -0.219 : -0.144) * Math.max(cr, 1) ** -0.544
    * Math.min(cys, 1) ** -0.323 * Math.max(cys, 1) ** -0.778 * 0.9961 ** age * (female ? 0.963 : 1);
}

// Astley et al., Table S10. CKD-EPI 2021 creatinine eGFR medians for the
// healthy European reference population. Use the same equation on both sides.
const kidneyAges = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 79];
const kidneyReference = {
  Male: [117, 113, 110, 107, 103, 99, 96, 94, 91, 89, 86, 82, 80],
  Female: [120, 116, 112, 109, 104, 100, 97, 94, 91, 88, 84, 81, 78],
};

export const kidneyAge = (egfr, sex) => matchReference(egfr, kidneyAges, kidneyReference[sex]);

// HUNT non-exercise equation using the published binary leisure activity term.
export function estimatedFitness({age, sex, waist, pulse, moderate, vigorous}) {
  const active = moderate + 2 * vigorous >= 150 ? 1 : 0;
  if (sex === 'Female') return 78 - 0.297 * age - 0.270 * waist - 0.110 * pulse + 2.674 * active;
  return 105.91 - 0.334 * age - 0.402 * waist - 0.144 * pulse + 3.102 * active;
}

// Bradshaw et al. (2005), using the sum of the two comfortable-pace ratings.
export function youngAdultFitness({age, sex, height, weight, milePace, threeMilePace, activityRating}) {
  const bmi = weight / (height / 100) ** 2;
  const perceivedAbility = Number(milePace) + Number(threeMilePace);
  return 48.073 + 6.178 * (sex === 'Male') - 0.246 * age - 0.619 * bmi
    + 0.712 * perceivedAbility + 0.671 * Number(activityRating);
}

// Baltimore Longitudinal Study of Aging, recalibrated Bradshaw equation, Table 2.
export function olderAdultFitness({age, sex, height, weight, selfRatedHealth, weeklyExercise}) {
  const bmi = weight / (height / 100) ** 2;
  const healthScore = {Poor:1, Fair:2, Good:3, 'Very good':4, Excellent:5}[selfRatedHealth];
  const exerciseScore = [30, 75, 150].filter(minutes => weeklyExercise >= minutes).length;
  return 46.61 + 4.82 * (sex === 'Male') - 0.31 * age - 0.46 * bmi + 1.58 * healthScore + 0.57 * exerciseScore;
}

// HUNT3 reference means (NTNU) for the no-exercise estimate. FRIEND 2022
// Table 3 medians (RER >= 1.0) are specific to the measured test modality.
const fitnessReference = {
  estimated: {
    Male: [54, 49, 47, 42, 39, 34],
    Female: [43, 40, 38, 34, 31, 27],
  },
  'Treadmill test': {
    Male: [46.5, 39.7, 35.3, 29.2, 24.6, 20.6, 17.6],
    Female: [36.6, 28.3, 25.7, 22.9, 19.6, 17.2, 15.4],
  },
  'Cycle test': {
    Male: [44, 30.2, 27.4, 24.5, 21.7, 18.3, 13.2],
    Female: [31.6, 21.6, 18.8, 16.9, 15.7, 14.5, 10.9],
  },
};

export function fitnessAge(vo2peak, sex, method = 'estimated') {
  const norms = fitnessReference[method][sex];
  const nearest = norms.reduce((best, value, index) =>
    Math.abs(vo2peak - value) < Math.abs(vo2peak - norms[best]) ? index : best, 0);
  const from = 20 + nearest * 10;
  if (method === 'estimated' && from === 70) return {ageRange:'at-least', boundary:70};
  return {age:from + 5, ageBand:{from, to:from + 9}};
}
