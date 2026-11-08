export const pday = {name:'PDAY', version:'pday-2006-coronary-age-band-v1', minAge:15, maxAge:34};

export function heartPdayAge(age) {
  const years = Number(age);
  return Number.isInteger(years) && years >= 18 && years <= 29;
}

export const pdayHighPressure = (systolic, diastolic) => Number(systolic?.value) >= 130 || Number(diastolic?.value) >= 85;
export const pdayHighGlucose = entry => Number(entry?.value) >= (entry?.unit === 'mg/dL' ? 126 : 7);

export function pdayCoronaryPoints({sex, nonHdl, hdl, smoking, pressure, diabetes, bmi}) {
  // Coronary points from CARDIA's implementation of PDAY (Gidding et al., 2006, Table 1).
  const nonHdlPoints = 2 * [130, 160, 190, 220].filter(limit => nonHdl >= limit).length;
  const hdlPoints = hdl < 40 ? 1 : hdl >= 60 ? -1 : 0;
  const bodyPoints = sex === 'Male' && bmi >= 30 ? 6 : 0;
  return nonHdlPoints + hdlPoints + bodyPoints + Number(smoking) + 4 * Number(pressure) + 5 * Number(diabetes);
}

export function pdayVascularAgeBand(age, factors) {
  // The same-sex reference cancels the sex term. The study's five-year age
  // bands have five points between them, so shift the band by the other points.
  const from = Math.floor(age / 5) * 5 + pdayCoronaryPoints(factors);
  const to = from + 4;
  const ageRange = from > pday.maxAge ? 'above' : to < pday.minAge ? 'below' : null;
  const ageBand = ageRange ? null : {from:from < pday.minAge ? null : from, to:to > pday.maxAge ? null : to};
  return {method:pday.name, version:pday.version, ageBand, ageRange};
}
