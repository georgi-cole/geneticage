import {buildReportLocale} from './report-locale.mjs';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--check'))throw Error('Use no arguments to build, or --check to verify without writing.');
const directory=new URL('../design/localization/',import.meta.url),files=(await readdir(directory)).filter(name=>name.endsWith('.tsv')).sort();
const text=(await Promise.all(files.map(name=>readFile(new URL(name,directory),'utf8')))).join('\n'),entries={};
for(const [index,line] of text.split(/\r?\n/).entries()){
 if(!line.trim()||line.startsWith('#'))continue;
 const tab=line.indexOf('\t');if(tab<1)throw Error('Missing translation at line '+(index+1));
 const source=line.slice(0,tab).trim(),target=line.slice(tab+1).trim();
 if(!target)throw Error('Empty translation: '+source);
 if(entries[source]&&entries[source]!==target)throw Error('Conflicting translation: '+source);
 entries[source]=target;
 const plainSource=source.replace(/[→←↗]/g,'').trim(),plainTarget=target.replace(/[→←↗]/g,'').trim();
 if(plainSource!==source&&!entries[plainSource])entries[plainSource]=plainTarget;
}
const output=new URL('../public/locales/bg.mjs',import.meta.url);
const generated='// Generated from design/localization/*.tsv. Run node scripts/build-locale.mjs.\nexport const BG=Object.freeze('+JSON.stringify(entries,null,2)+');\n';
if(args.includes('--check')){
 const existing=await readFile(output,'utf8');
 if(existing.replace(/\r\n/g,'\n')!==generated)throw Error('Bulgarian dictionary is out of date. Run npm run locale:build and commit the result.');
 console.log('Verified '+Object.keys(entries).length+' Bulgarian copy entries.');
}else{
 await mkdir(new URL('../public/locales/',import.meta.url),{recursive:true});
 await writeFile(output,generated);
 console.log('Built '+Object.keys(entries).length+' Bulgarian copy entries.');
}

await buildReportLocale({check:args.includes('--check')});
