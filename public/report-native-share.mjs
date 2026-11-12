// Dependency-injected so persistence, cleanup and cancel behavior are testable
// without a device or an account. The app supplies Capacitor's official APIs.
export function nativePdfDelivery({filesystem,share,now=Date.now,randomId=()=>globalThis.crypto.randomUUID(),encode=globalThis.btoa}){
 const directory='CACHE',folder='kq-report-exports';
 async function cleanup(){
  try{
   const listing=await filesystem.readdir({directory,path:folder});
   for(const entry of listing.files){
    if(!/^[a-f0-9-]{36}-GeneticAge-[a-z-]+\.pdf$/.test(entry.name))continue;
    if(Number.isFinite(entry.mtime)&&now()-entry.mtime>86400000){
     try{await filesystem.deleteFile({directory,path:folder+'/'+entry.name});}catch{/* The OS can purge its cache at any time. */}
    }
   }
  }catch{/* A first export has no cache folder. */}
 }
 return async(blob,filename)=>{
  if(!/^GeneticAge-[a-z-]+\.pdf$/.test(filename))throw Error('Invalid PDF filename.');
  await cleanup();
  const bytes=new Uint8Array(await blob.arrayBuffer());
  if(bytes.length<5||bytes.length>20*1024*1024||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Invalid PDF output.');
  let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  const path=folder+'/'+randomId()+'-'+filename;
  const file=await filesystem.writeFile({directory,path,data:encode(binary),recursive:true});
  try{
   await share.share({title:'GeneticAge report',dialogTitle:'Save or share your report',files:[file.uri]});
   return {delivered:true};
  }catch(error){
   // A cancelled sheet is not a failed report. Do not log private file paths,
   // report contents or the platform exception.
   try{await filesystem.deleteFile({directory,path});}catch{/* Cleanup can race the OS cache purge. */}
   if(/cancel|dismiss/i.test(String(error?.message||'')))return {delivered:false,cancelled:true};
   throw Error('The native share sheet could not deliver the PDF.');
  }
 };
}
