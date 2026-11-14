// Birth year gives a suggestion, not an exact birthday-based age. New
// assessments show the suggestion for confirmation; saved snapshots stay fixed.
export function birthYearAge(year, date = new Date()) {
 const text=String(year??'');
 const age=date.getFullYear()-Number(text);
 return /^\d{4}$/.test(text)&&age>=18&&age<=120?String(age):null;
}
export function currentProfileAge(answers={}, date=new Date()) {
 const suggestion=birthYearAge(answers.birthYear,date);
 if(!suggestion)return answers.age;
 return Number(answers.ageRecordedYear)===date.getFullYear()&&answers.age
  ? answers.age : suggestion;
}
