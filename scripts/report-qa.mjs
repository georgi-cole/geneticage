import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {buildReportAssets} from './report-assets.mjs';
import {reportFixtures} from './report-fixtures.mjs';
import {reportPdfDefinition} from '../public/report-pdf.mjs';
import {renderEditorialDocument,renderEditorialSources} from '../public/report-editorial-ui.mjs';

// Synthetic inputs only. CI uploads these samples for visual review; no real
// account, login, payment, production secret or user record is used.
const output=new URL('../report-qa-output/',import.meta.url);
await mkdir(output,{recursive:true});
const runtime=await import(pathToFileURL(await buildReportAssets()).href);
const css=await readFile(new URL('../public/report-editorial.css',import.meta.url),'utf8');
const index=[];
for(const fixture of reportFixtures()){
 for(const language of ['en','bg']){
  for(const scope of ['report','technical']){
   const name=`${fixture.id}-${scope}-${language}.pdf`;
   const definition=reportPdfDefinition(fixture.document,{language,scope,logo:runtime.logo});
   const bytes=await runtime.createPdf(definition).getBuffer();
   if(bytes.length<2000||Buffer.from(bytes).subarray(0,4).toString()!=='%PDF')throw Error('Invalid generated PDF: '+name);
   await writeFile(new URL(name,output),bytes);
   index.push({file:name,bytes:bytes.length,assessment:fixture.id,language,scope});
  }
 }
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeneticAge review · ${fixture.id}</title><style>body{margin:0;background:#e8e7e2;padding:20px}main{max-width:900px;margin:auto}${css}</style><main>${renderEditorialDocument(fixture.document)}${renderEditorialSources(fixture.document)}</main></html>`;
 await writeFile(new URL(fixture.id+'.html',output),html);
}
await writeFile(new URL('index.json',output),JSON.stringify(index,null,2));
console.log('Generated '+index.length+' real PDF exports from '+reportFixtures().length+' fictional profiles in '+fileURLToPath(output));
