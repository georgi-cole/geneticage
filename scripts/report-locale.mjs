import {readFile,writeFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function buildReportLocale({check=false}={}){
 const root=new URL('../design/localization/editorial/',import.meta.url),entries={};
 const names=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map(m=>m[1]).sort().join(',');
 for(const name of (await readdir(root)).filter(x=>x.endsWith('.tsv')).sort()){
  for(const line of (await readFile(new URL(name,root),'utf8')).split(/\r?\n/)){
   if(!line.trim()||line.startsWith('#'))continue;
   const tab=line.indexOf('\t'),en=line.slice(0,tab),bg=line.slice(tab+1);
   if(tab<1||!bg.trim()||names(en)!==names(bg)||entries[en]&&entries[en]!==bg)throw Error('Invalid editorial translation: '+en);
   entries[en]=bg;
  }
 }
 const text='// Generated from design/localization/editorial/*.tsv. Do not hand-edit.\nexport const REPORT_BG = Object.freeze('+JSON.stringify(entries,null,2)+');\n';
 const output=new URL('../public/report-knowledge/bg.mjs',import.meta.url);
 if(check){if(await readFile(output,'utf8')!==text)throw Error('Editorial dictionary is stale; run npm run locale:build.');}
 else await writeFile(output,text);
 console.log((check?'Verified ':'Built ')+Object.keys(entries).length+' editorial translations.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildReportLocale({check:process.argv.includes('--check')});
