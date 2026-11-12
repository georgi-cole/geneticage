import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Build a lazy local ESM wrapper. No engine, font file or logo is fetched from a
// CDN when a user opens/exports a report. These generated assets stay out of Git.
export async function buildReportAssets(){
 const root=new URL('../',import.meta.url),vendor=new URL('report-engine/node_modules/pdfmake/build/',root);
 const [engine,fonts,times,logo,sourceSerif]=await Promise.all([
  readFile(new URL('pdfmake.min.js',vendor),'utf8'),
  readFile(new URL('vfs_fonts.js',vendor),'utf8'),
  readFile(new URL('standard-fonts/Times.js',vendor),'utf8'),
  readFile(new URL('public/assets/kolequant-report-mark.png',root)),
  readFile(new URL('public/assets/fonts/source-serif-4-regular.ttf',root)),
 ]);
 const output=new URL('public/assets/report-pdf-runtime.js',root);
 const wrap=text=>`(()=>{const module={exports:{}};const exports=module.exports;\n${text}\nreturn module.exports;})()`;
 const text=`// Generated from pinned pdfmake 0.3.14 and repository-owned brand assets.\nconst engine=${wrap(engine)};\nconst fonts=${wrap(fonts)};\nengine.addVirtualFileSystem(fonts);\nengine.addFontContainer(${wrap(times)});\nengine.addFonts({KQSerif:{normal:'Times-Roman',bold:'Times-Bold',italics:'Times-Italic',bolditalics:'Times-BoldItalic'}});\nengine.addVirtualFileSystem({'SourceSerif4-Regular.ttf':${JSON.stringify(sourceSerif.toString('base64'))}});\nengine.addFonts({KQSourceSerif:{normal:'SourceSerif4-Regular.ttf'}});\nengine.setUrlAccessPolicy(()=>false);\nengine.urlResourceCaching=false;\nexport const logo=${JSON.stringify('data:image/png;base64,'+logo.toString('base64'))};\nexport const createPdf=definition=>engine.createPdf(definition);\n`;
 await mkdir(new URL('public/assets/',root),{recursive:true});
 await writeFile(output,text);
 return fileURLToPath(output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(await buildReportAssets());
