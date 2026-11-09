import {Capacitor} from '@capacitor/core';
import {Directory,Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';

const filename='GeneticAge-report.pdf';
const cachePrefix='geneticage-report-';

async function clearExpiredPdfs() {
 const {files}=await Filesystem.readdir({path:'',directory:Directory.Cache});
 const cutoff=Date.now()-24*60*60*1000;
 await Promise.all(files.filter(file=>file.type==='file'&&file.name.startsWith(cachePrefix)&&file.name.endsWith('.pdf')&&file.mtime<cutoff)
  .map(file=>Filesystem.deleteFile({path:file.name,directory:Directory.Cache})));
}

export async function saveReportPdf(definition) {
 const [{default:pdfMake},{default:fonts}]=await Promise.all([
  import('pdfmake/build/pdfmake.js'),
  import('pdfmake/build/vfs_fonts.js'),
 ]);
 pdfMake.addVirtualFileSystem(fonts);
 const pdf=pdfMake.createPdf(definition);
 if(!Capacitor.isNativePlatform()){
  const url=URL.createObjectURL(await pdf.getBlob());
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  return;
 }

 // Share from app-private cache, which the OS can reclaim. Android recipients may read the file after the chooser returns.
 await clearExpiredPdfs().catch(()=>{});
 const path=cachePrefix+crypto.randomUUID()+'.pdf';
 const {uri}=await Filesystem.writeFile({path,directory:Directory.Cache,data:await pdf.getBase64()});
 try{
  await Share.share({title:'GeneticAge report',files:[uri]});
 }catch(error){
  if(error.message!=='Share canceled')throw error;
 }finally{
  if(Capacitor.getPlatform()==='ios')await Filesystem.deleteFile({path,directory:Directory.Cache}).catch(()=>{});
 }
}
