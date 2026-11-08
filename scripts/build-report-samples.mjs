import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {sampleFullReport} from '../lib/full-report.mjs';
import {renderFullReportPdf} from '../lib/report-pdf.mjs';

const folder = new URL('../public/assets/report-samples/',import.meta.url);
const fontBytes = await readFile(new URL('../public/assets/fonts/manrope-report.ttf',import.meta.url));
const content = sampleFullReport('phenoage');
await mkdir(folder,{recursive:true});
for (const language of ['en','bg']) {
  await writeFile(new URL(language+'.pdf',folder),await renderFullReportPdf(content,{language,fontBytes}));
}
