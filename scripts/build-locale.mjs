import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
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
await mkdir(new URL('../public/locales/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/locales/bg.mjs',import.meta.url),'// Generated from design/localization/*.tsv. Run node scripts/build-locale.mjs.\nexport const BG=Object.freeze('+JSON.stringify(entries,null,2)+');\n');
console.log('Built '+Object.keys(entries).length+' Bulgarian copy entries.');
