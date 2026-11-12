let nativeDelivery=null;
export function registerNativePdfDelivery(deliver){
 if(typeof deliver!=='function')throw Error('A native PDF delivery function is required.');
 nativeDelivery=deliver;
}
export async function deliverReportPdf(blob,filename,{window,document}){
 if(window.Capacitor?.isNativePlatform?.()){
  if(!nativeDelivery)throw Error('Native PDF sharing is unavailable in this build.');
  return nativeDelivery(blob,filename);
 }
 const url=window.URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=filename;
 document.body.append(link);link.click();link.remove();
 window.setTimeout(()=>window.URL.revokeObjectURL(url),60000);
 return {delivered:true};
}
