// A brand animation, not a DNA analysis or a calculated personal result.
import {translateText} from './language-system.mjs';
export const LAUNCH_DURATION=2200;
export const CODONS=['ATG','CAG','GGC','TCC','AAC','GCT'];
export const complement=sequence=>sequence.replace(/[ATGC]/g,base=>({A:'T',T:'A',G:'C',C:'G'}[base]));
export const launchBootstrap="document.documentElement.dataset.launch='pending'";

const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
const interpolate=(from,to,t)=>from+(to-from)*t;

export function launchFrame(milliseconds){
 const time=Math.max(0,milliseconds),unfold=ease((time-580)/880);
 const codons=Array.from({length:12},(_,index)=>{
  const strand=Math.floor(index/6),row=index%6,y=-53+row*21;
  const x=Math.sin((y+53)/105*Math.PI*2)*24*(strand?-1:1);
  const angle=(-150+index*30)*Math.PI/180;
  const progress=ease((time-620-row*22)/760);
  const rotation=-60+index*30;
  return {text:strand?complement(CODONS[row]):CODONS[row],x:interpolate(x,Math.cos(angle)*104,progress),y:interpolate(y,Math.sin(angle)*104,progress),rotation:interpolate(0,rotation>90?rotation-180:rotation,progress),opacity:ease((time-610-row*22)/230)};
 });
 const ribbons=[0,1].map(strand=>Array.from({length:33},(_,index)=>{
  const fraction=index/32,y=-59+fraction*118,x=Math.sin(fraction*Math.PI*2)*26*(strand?-1:1);
  const angle=(-150+strand*180+fraction*180)*Math.PI/180;
  return `${index?'L':'M'}${interpolate(x,Math.cos(angle)*85,unfold).toFixed(2)} ${interpolate(y,Math.sin(angle)*85,unfold).toFixed(2)}`;
 }).join(' '));
 return {phase:time<610?'mark':time<1510?'code':'time',codons,ribbons,ribbonOpacity:.48*ease((time-590)/280),markOpacity:1-ease((time-580)/480),ringOpacity:ease((time-1190)/400),pointer:-108+ease((time-1380)/520)*156,exit:ease((time-1840)/360)};
}

export const launchMarkup=`<section id="launch-screen" class="launch-screen" hidden aria-hidden="true" aria-labelledby="launch-title" data-no-translate>
 <div class="launch-composition">
  <svg class="launch-scene" viewBox="-170 -170 340 340" aria-hidden="true" focusable="false">
   <defs><linearGradient id="launch-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--launch-shade)"/><stop offset=".35" stop-color="var(--launch-ink)"/><stop offset=".52" stop-color="var(--launch-accent)"/><stop offset=".7" stop-color="var(--launch-ink)"/><stop offset="1" stop-color="var(--launch-shade)"/></linearGradient></defs>
   <g class="launch-calibration" data-launch-ring opacity="0"><circle r="136"/><circle r="127" stroke-dasharray="1 21.16" stroke-width="4"/><path d="M0 -144v7M144 0h-7M0 144v-7M-144 0h7"/><path class="launch-pointer" data-launch-pointer d="M0 0L0 -69M-3 -64L0 -72L3 -64"/><circle r="2" class="launch-pivot"/></g>
   <g class="launch-ribbons" stroke="url(#launch-metal)" opacity="0"><path data-launch-ribbon/><path data-launch-ribbon/></g>
   <image data-launch-mark href="/assets/kolequant-mark.webp" x="-32" y="-58" width="64" height="116"/>
   <g class="launch-codons">${Array.from({length:12},(_,index)=>`<text data-launch-codon="${index}" text-anchor="middle" dominant-baseline="middle" opacity="0">${index<6?CODONS[index]:complement(CODONS[index-6])}</text>`).join('')}</g>
   <g data-launch-centre opacity="0"><path class="launch-crosshair" d="M-7 0H7M0 -7V7"/><text class="launch-age" y="28" text-anchor="middle">AGE</text></g>
  </svg>
  <div class="launch-wordmark"><h1 id="launch-title">KoleQuant<span>AGE</span></h1><p data-launch-caption>Biology, in time.</p></div>
 </div>
 <div class="launch-footer" aria-hidden="true"><span>ATG</span><i></i><span data-launch-phase-label>CODE INTO CONTEXT</span></div>
</section>`;

export function initializeLaunch({root=document,host=window,duration=LAUNCH_DURATION}={}){
 const element=root.querySelector('#launch-screen');
 if(!element)return {finish(){}};
 const documentRoot=root.documentElement,workspace=root.querySelector('.app-frame'),reduced=host.matchMedia('(prefers-reduced-motion: reduce)');
 const mark=element.querySelector('[data-launch-mark]'),ribbons=[...element.querySelectorAll('[data-launch-ribbon]')],codons=[...element.querySelectorAll('[data-launch-codon]')];
 const ring=element.querySelector('[data-launch-ring]'),pointer=element.querySelector('[data-launch-pointer]'),centre=element.querySelector('[data-launch-centre]');
 const skipLink=root.querySelector('a.skip');
 let active=false,frame=0,start=null,guard=null,previousInert=false,previousSkipInert=false;
 function copy(){
  const language=documentRoot.lang;
  element.querySelector('[data-launch-caption]').textContent=translateText('Biology, in time.',language);
  element.querySelector('[data-launch-phase-label]').textContent=translateText('CODE INTO CONTEXT',language);
 }
 function paint(milliseconds){
  const state=launchFrame(milliseconds);
  element.dataset.launchPhase=state.phase;
  mark.setAttribute('opacity',String(state.markOpacity));
  element.querySelector('.launch-ribbons').setAttribute('opacity',String(state.ribbonOpacity));
  ribbons.forEach((path,index)=>path.setAttribute('d',state.ribbons[index]));
  codons.forEach((codon,index)=>{const item=state.codons[index];codon.setAttribute('transform',`translate(${item.x.toFixed(2)} ${item.y.toFixed(2)}) rotate(${item.rotation.toFixed(2)})`);codon.setAttribute('opacity',String(item.opacity));});
  ring.setAttribute('opacity',String(state.ringOpacity));centre.setAttribute('opacity',String(state.ringOpacity));pointer.setAttribute('transform',`rotate(${state.pointer.toFixed(2)})`);
  element.style.setProperty('--launch-exit',String(state.exit));
 }
 function finish({notify=true}={}){
  const wasActive=active;active=false;
  host.cancelAnimationFrame(frame);host.clearTimeout(guard);frame=0;guard=null;start=null;
  element.hidden=true;element.setAttribute('aria-hidden','true');element.removeAttribute('role');delete element.dataset.launchPhase;delete documentRoot.dataset.launch;
  if(workspace&&wasActive)workspace.inert=previousInert;
  if(skipLink&&wasActive)skipLink.inert=previousSkipInert;
  if(wasActive&&notify)host.dispatchEvent(new host.CustomEvent('kq:launch-settled'));
 }
 function play(){
  if(active||root.hidden)return;
  copy();previousInert=workspace?.inert??false;previousSkipInert=skipLink?.inert??false;
  active=true;start=null;paint(0);
  element.hidden=false;element.setAttribute('aria-hidden','false');element.setAttribute('role','status');
  documentRoot.dataset.launch='playing';if(workspace)workspace.inert=true;
  if(skipLink)skipLink.inert=true;
  host.dispatchEvent(new host.CustomEvent('kq:launch-start'));
  if(reduced.matches){guard=host.setTimeout(finish,duration);return;}
  // A slow/missing frame can never leave the workspace blocked.
  guard=host.setTimeout(finish,duration+650);
  const tick=time=>{if(!active)return;start??=time;const elapsed=time-start;paint(elapsed*LAUNCH_DURATION/duration);if(elapsed>=duration)finish();else frame=host.requestAnimationFrame(tick);};
  frame=host.requestAnimationFrame(tick);
 }
 root.addEventListener('visibilitychange',()=>{if(root.hidden&&active)finish();else if(!root.hidden&&documentRoot.dataset.launch==='pending')play();});
 host.addEventListener('beforeprint',()=>finish({notify:false}));
 reduced.addEventListener('change',()=>{if(reduced.matches&&active){host.cancelAnimationFrame(frame);frame=0;paint(0);}});
 if(documentRoot.dataset.launch==='pending')play();
 else finish();
 return {finish};
}
