import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import {BG} from './public/locales/bg.mjs';
import {LANGUAGE_KEY,languageBootstrap,translateText} from './public/language-system.mjs';
import {sections,labs,insights,sampleAnswers,validateQuestionnaire,validateLabs,assessClinical,sampleLabs} from './public/model.mjs';

// The checked-in runtime must match every editable copy source.
for(const file of (await readdir('design/localization')).filter(file=>file.endsWith('.tsv'))){
 for(const line of (await readFile('design/localization/'+file,'utf8')).split(/\r?\n/)){
  if(!line.trim()||line.startsWith('#'))continue;
  const [source,...target]=line.split('\t');
  assert.equal(BG[source.trim()],target.join('\t').trim(),file+': '+source);
 }
}

const copy=[];
for(const section of sections){
 copy.push(section.name,section.title,section.intro);
 for(const question of section.questions)copy.push(question.label,question.hint,...(question.options||[]),...Object.values(question.optionLabels||{}));
}
copy.push(...labs.map(lab=>lab.name));
const exampleInputs=[sampleAnswers,{...sampleAnswers,smoking:'Smoke now',nicotine:['Vape or e-cigarette'],rested:'Rarely',disrupted:'Yes',stress:'Often'},{...sampleAnswers,limitations:'Often'},{}];
for(const answers of exampleInputs)for(const item of insights(answers))copy.push(item.name,item.tag,item.text,item.action);
copy.push(...Object.values(validateQuestionnaire({age:17,smokingYears:100,moderate:10080,vigorous:10080,context:['None','Pregnant']})));
copy.push(...Object.values(validateLabs({})),...Object.values(validateLabs({crp:{value:0}})));
for(const input of [{age:18,fasting:'Yes',context:true},{age:45,fasting:'No',context:true},{age:45,fasting:'Yes',context:false}]){
 const result=assessClinical({...input,lab:sampleLabs()});if(result.reason)copy.push(result.reason);
}
for(const source of copy.filter(source=>source&&/[A-Za-z]/.test(source))){
 const translated=translateText(source,'bg');
 assert.match(translated,/[А-Яа-я]/,'Missing Bulgarian copy: '+source);
 assert.equal(translateText(source,'en'),source,'English remains the canonical source.');
 assert.doesNotMatch(translated,/\b(?:Your|You|Choose|Enter|years|hours|provided|assessment|measurements|guidance|weekly|smoking)\b/,'Untranslated fragment: '+source);
}

assert.equal(translateText('1 saved assessments','bg'),'1 запазен анализ');
assert.equal(translateText('2 saved assessments','bg'),'2 запазени анализа');
assert.equal(translateText('1 saved reports','bg'),'1 запазен доклад');
assert.equal(translateText('12 saved reports','bg'),'12 запазени доклада');
assert.equal(translateText('1 dated record','bg'),'1 запис с дата');
assert.equal(translateText('12 dated records','bg'),'12 записа с дата');
assert.equal(translateText('The estimate is about 5 years higher than your age at the blood draw.','bg'),'Оценката е с около 5 години по-висока от възрастта ви при вземане на пробата.');
assert.equal(translateText('. Your age at the blood draw was 45 years.','bg'),'. Възрастта ви при вземане на пробата е била 45 години.');
assert.equal(translateText('  New assessment  ','bg'),'  Нов анализ  ');
assert.equal(translateText('Fair (2 assessments)','bg',{protectedPrefix:'Fair'}),'Fair (2 анализа)','A profile nickname is never translated, including in an import option.');
assert.equal(translateText('Unit for What is your height?','bg'),'Мерна единица за ръста');
for(const identifier of ['GeneticAge','KoleQuant','PhenoAgeAccel','DNAm PhenoAge','DunedinPACE','GrimAge','mg/dL','mmol/L','% (RDW-CV)','DELETE','demo@example.com'])assert.equal(translateText(identifier,'bg'),identifier);
assert.match(translateText('When you explicitly save, your questionnaire, blood entries, results and educational report are sent over HTTPS and stored in the hosted account database. Health records are encrypted by the application before database storage. Authorized service operators can administer the service; this is not end-to-end encryption.','bg'),/не е криптиране от край до край/);

function boot(value,blocked=false){
 const root={dataset:{}};
 vm.runInNewContext(languageBootstrap,{document:{documentElement:root},localStorage:{getItem(key){assert.equal(key,LANGUAGE_KEY);if(blocked)throw Error('blocked');return value;}}});
 return root;
}
assert.equal(boot(null).lang,'en');assert.equal(boot('bg').lang,'bg');
assert.equal(boot('bg').dataset.language,'bg');assert.equal(boot('invalid').lang,'en');assert.equal(boot(null,true).lang,'en');
console.log('Passed: editable/runtime copy parity, questionnaire choices and hints, laboratory labels, conditional findings, errors, composed scientific sentences, Bulgarian counts, untouched identifiers, and persisted/blocked language bootstrap.');
