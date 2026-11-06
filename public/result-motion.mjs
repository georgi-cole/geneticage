// Decorative readout motion never alters a calculation or its accessible value.
export const RESULT_MOTION_DURATION=1200;
const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export const resultProgress=progress=>1-(1-clamp(progress))**3;

export function counterText(target,progress,{signed=false,digits=0}={}){
 if(typeof target!=='number'||!Number.isFinite(target))return '—';
 const value=Math.trunc(Math.round(target)*resultProgress(progress));
 const magnitude=String(Math.abs(value)).padStart(digits,'0');
 return (value<0?'-':signed&&value>0?'+':'')+magnitude;
}

export function dialFrame(progress){
 const eased=resultProgress(progress),degrees=150+180*eased,radians=degrees*Math.PI/180;
 return {transform:`translate(${(140+Math.cos(radians)*106).toFixed(3)} ${(140+Math.sin(radians)*106).toFixed(3)}) rotate(${(degrees+90).toFixed(3)})`,offset:String(1-eased)};
}

export function initializeResultMotion(){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),active=new Map();
 function paint(element,progress){
  element.querySelectorAll('[data-count-to]').forEach(node=>{
   node.textContent=progress===1?node.dataset.countFinal:counterText(Number(node.dataset.countTo),progress,{signed:node.dataset.countSigned==='true',digits:Number(node.dataset.countDigits)||0});
  });
  const frame=dialFrame(progress);
  element.querySelector('.dial-pointer')?.setAttribute('transform',frame.transform);
  const arc=element.querySelector('.dial-highlight');if(arc)arc.style.strokeDashoffset=frame.offset;
 }
 function finish(){
  active.forEach((animation,element)=>{cancelAnimationFrame(animation.frame);paint(element,1);delete element.dataset.resultAnimating;});
  active.clear();
 }
 function prepare(){
  finish();
  document.querySelectorAll('[data-result-motion]').forEach(element=>{
   if(reduced.matches||document.hidden){paint(element,1);return;}
   paint(element,0);active.set(element,{frame:0,start:null});
  });
 }
 function refresh(){
  prepare();
  if(document.documentElement.dataset.themeTransition||document.documentElement.dataset.launch)return;
  active.forEach((animation,element)=>{
   element.dataset.resultAnimating='true';
   const tick=time=>{
    if(!element.isConnected){active.delete(element);return;}
    animation.start??=time;
    const progress=clamp((time-animation.start)/RESULT_MOTION_DURATION);paint(element,progress);
    if(progress<1)animation.frame=requestAnimationFrame(tick);
    else{active.delete(element);delete element.dataset.resultAnimating;}
   };
   animation.frame=requestAnimationFrame(tick);
  });
 }
 window.addEventListener('kq:theme-change',prepare);
 window.addEventListener('kq:theme-settled',refresh);
 window.addEventListener('kq:launch-start',prepare);
 window.addEventListener('kq:launch-settled',refresh);
 window.addEventListener('beforeprint',finish);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)finish();
  else if(!document.documentElement.dataset.themeTransition)refresh();
 });
 reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
 return {refresh,finish};
}
