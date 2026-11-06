import {paintSignature,settleSignature,signatureOutline} from './signature-motion.mjs';
// A brand animation, not a DNA analysis or a calculated personal result.
import {translateText} from './language-system.mjs';
import {APP_NAME,PUBLISHER_NAME} from './brand.mjs';
export const LAUNCH_DURATION=3000;
export const LAUNCH_TRANSFORM_SPEED=1.3*1.15;
export const LAUNCH_BRAND_HOLD=LAUNCH_DURATION-2200/LAUNCH_TRANSFORM_SPEED;
export const launchTime=milliseconds=>Math.max(0,milliseconds-LAUNCH_BRAND_HOLD)*LAUNCH_TRANSFORM_SPEED;
export const CODONS=['ATG','CAG','GGC','TCC','AAC','GCT'];
export const complement=sequence=>sequence.replace(/[ATGC]/g,base=>({A:'T',T:'A',G:'C',C:'G'}[base]));
export const launchBootstrap="document.documentElement.dataset.launch='pending'";

const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
const interpolate=(from,to,t)=>from+(to-from)*t;

export function launchFrame(milliseconds){
 const time=launchTime(milliseconds),unfold=ease((time-580)/880);
 const codons=Array.from({length:12},(_,index)=>{
  const strand=Math.floor(index/6),row=index%6,y=-53+row*21;
  const x=Math.sin((y+53)/105*Math.PI*2)*24*(strand?-1:1);
  const degrees=150+index*240/11,angle=degrees*Math.PI/180;
  const progress=ease((time-620-row*22)/760);
  const rotation=(degrees+90)%360;
  return {text:strand?complement(CODONS[row]):CODONS[row],x:interpolate(x,Math.cos(angle)*104,progress),y:interpolate(y,Math.sin(angle)*104,progress),rotation:interpolate(0,rotation>90&&rotation<270?rotation-180:rotation>270?rotation-360:rotation,progress),opacity:ease((time-610-row*22)/230)*(1-ease((time-1330)/350))};
 });
 const ribbons=[0,1].map(strand=>Array.from({length:33},(_,index)=>{
  const fraction=index/32,y=-59+fraction*118,x=Math.sin(fraction*Math.PI*2)*26*(strand?-1:1);
  const angle=(150+strand*120+fraction*120)*Math.PI/180;
  return `${index?'L':'M'}${interpolate(x,Math.cos(angle)*120,unfold).toFixed(2)} ${interpolate(y,Math.sin(angle)*120,unfold).toFixed(2)}`;
 }).join(' '));
 return {phase:time<610?'mark':time<1510?'code':'time',codons,ribbons,ribbonOpacity:.48*ease((time-590)/280)*(1-ease((time-1330)/350)),markOpacity:1-ease((time-580)/480),clockOpacity:ease((time-1080)/400),readoutOpacity:ease((time-1740)/380),travel:ease((time-1420)/750),brandingOpacity:1-ease((time-1330)/350),exit:ease((time-1680)/520)};
}

export const launchMarkup=`<section id="launch-screen" class="launch-screen" hidden aria-hidden="true" aria-labelledby="launch-title" data-no-translate>
 <div class="launch-backdrop" aria-hidden="true"></div>
 <div class="launch-clock-layer" aria-hidden="true"></div>
 <div class="launch-composition">
  <svg class="launch-scene" viewBox="-170 -170 340 340" aria-hidden="true" focusable="false">
   <defs><linearGradient id="launch-brand" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#258bca"/><stop offset=".5" stop-color="#39a676"/><stop offset="1" stop-color="#8335a3"/></linearGradient><linearGradient id="launch-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--launch-shade)"/><stop offset=".35" stop-color="var(--launch-ink)"/><stop offset=".52" stop-color="var(--launch-accent)"/><stop offset=".7" stop-color="var(--launch-ink)"/><stop offset="1" stop-color="var(--launch-shade)"/></linearGradient></defs>
   <g class="launch-ribbons" stroke="url(#launch-metal)" opacity="0"><path data-launch-ribbon/><path data-launch-ribbon/></g>
   <path data-launch-mark d="${signatureOutline(0)}" fill="url(#launch-brand)" fill-rule="evenodd" transform="translate(-32 -58) scale(.64 1.38095238)"/>
   <g class="launch-codons">${Array.from({length:12},(_,index)=>`<text data-launch-codon="${index}" text-anchor="middle" dominant-baseline="middle" opacity="0">${index<6?CODONS[index]:complement(CODONS[index-6])}</text>`).join('')}</g>
  </svg>
  <div class="launch-wordmark"><h1 id="launch-title">${PUBLISHER_NAME}</h1><p class="launch-product">${APP_NAME}</p></div>
 </div>
 <div class="launch-footer" aria-hidden="true"><span>ATG</span><i></i><span data-launch-phase-label>CODE INTO CONTEXT</span></div>
</section>`;

export function initializeLaunch({root=document,host=window,duration=LAUNCH_DURATION}={}){
 const element=root.querySelector('#launch-screen');
 if(!element)return {finish(){}};
 const documentRoot=root.documentElement,workspace=root.querySelector('.app-frame'),reduced=host.matchMedia('(prefers-reduced-motion: reduce)');
 const mark=element.querySelector('[data-launch-mark]'),ribbons=[...element.querySelectorAll('[data-launch-ribbon]')],codons=[...element.querySelectorAll('[data-launch-codon]')];
 const clockLayer=element.querySelector('.launch-clock-layer'),scene=element.querySelector('.launch-scene');
 const skipLink=root.querySelector('a.skip');
 let active=false,frame=0,start=null,guard=null,previousInert=false,previousSkipInert=false,clock=null;
 function borrowClock(){
  if(clock&&!clock.placeholder.isConnected)returnClock();
  if(clock)return;
  // Move the real home dial, including its readout. No clone or second clock.
  const dial=root.querySelector('#main .instrument-dial');
  if(!dial)return;
  const destination=dial.getBoundingClientRect(),source=scene.getBoundingClientRect();
  if(!destination.width||!source.width)return;
  const placeholder=root.createElement('div');placeholder.className='instrument-dial launch-dial-placeholder';placeholder.setAttribute('aria-hidden','true');
  placeholder.style.width=destination.width+'px';placeholder.style.height=destination.height+'px';
  const classes=dial.closest('.result-instrument')?.classList;
  clockLayer.classList.toggle('welcome-instrument',!!classes?.contains('welcome-instrument'));
  const computed=host.getComputedStyle(dial);
  const colors={accent:computed.getPropertyValue('--result-accent').trim()||'#cbd1dc',ink:computed.getPropertyValue('--result-ink').trim()||'#f2f4f8',muted:computed.getPropertyValue('--result-muted').trim()||'#bcc1ca'};
  const signature=dial.querySelector('.unmeasured-mark'),signatureDestination=signature?.getBoundingClientRect();
  let signatureState=null;
  if(signature&&signatureDestination.width){
   const slot=root.createElement('span');slot.className='signature-placeholder';slot.style.width='100%';slot.style.height='100%';
   const layer=root.createElement('div');layer.className='launch-signature-layer';layer.setAttribute('aria-hidden','true');
   for(const [key,value]of Object.entries(colors))layer.style.setProperty('--result-'+key,value);
   signature.replaceWith(slot);layer.append(signature);element.append(layer);signature.setAttribute('preserveAspectRatio','none');
   signatureState={node:signature,slot,layer,destination:signatureDestination};
  }
  clock={dial,placeholder,destination,source,colors,signature:signatureState};dial.replaceWith(placeholder);clockLayer.append(dial);
 }
 function returnClock(){
  if(!clock)return;
  const {dial,placeholder,signature}=clock;
  if(signature){settleSignature(signature.node);signature.node.removeAttribute('preserveAspectRatio');if(signature.slot.isConnected)signature.slot.replaceWith(signature.node);signature.layer.remove();}
  if(placeholder.isConnected)placeholder.replaceWith(dial);else dial.remove();
  clock=null;
 }
 function copy(){
  const language=documentRoot.lang;
  element.querySelector('[data-launch-phase-label]').textContent=translateText('CODE INTO CONTEXT',language);
 }
 function paint(milliseconds){
  const state=launchFrame(milliseconds);
  element.dataset.launchPhase=state.phase;
  mark.setAttribute('opacity',String(1-ease((launchTime(milliseconds)-1530)/220)));
  mark.setAttribute('d',signatureOutline(ease((launchTime(milliseconds)-580)/950)));
  element.querySelector('.launch-ribbons').setAttribute('opacity',String(state.ribbonOpacity));
  ribbons.forEach((path,index)=>path.setAttribute('d',state.ribbons[index]));
  codons.forEach((codon,index)=>{const item=state.codons[index];codon.setAttribute('transform',`translate(${item.x.toFixed(2)} ${item.y.toFixed(2)}) rotate(${item.rotation.toFixed(2)})`);codon.setAttribute('opacity',String(item.opacity));});
  if(clock){
   const {source,destination,colors,signature}=clock,sourceSize=Math.min(source.width,source.height)*280/340;
   const size=interpolate(sourceSize,destination.width,state.travel);
   const left=interpolate(source.left+source.width/2-sourceSize/2,destination.left,state.travel);
   const top=interpolate(source.top+source.height/2-sourceSize*destination.height/destination.width/2,destination.top,state.travel);
   clockLayer.style.width=destination.width+'px';clockLayer.style.height=destination.height+'px';
   clockLayer.style.transform=`translate(${left.toFixed(3)}px,${top.toFixed(3)}px) scale(${size/destination.width})`;
   clockLayer.style.opacity=String(state.clockOpacity);
   if(signature){
    const t=ease((launchTime(milliseconds)-580)/950),target=signature.destination;
    const sourceWidth=source.width*64/340,sourceHeight=source.height*116/340;
    const x=interpolate(source.left+source.width/2-sourceWidth/2,target.left,state.travel),y=interpolate(source.top+source.height/2-sourceHeight/2,target.top,state.travel);
    signature.layer.style.width=interpolate(sourceWidth,target.width,state.travel)+'px';signature.layer.style.height=interpolate(sourceHeight,target.height,state.travel)+'px';
    signature.layer.style.transform=`translate(${x}px,${y}px)`;
    mark.setAttribute('opacity','0');signature.layer.style.opacity='1';
    element.querySelector('.launch-ribbons').setAttribute('opacity','0');
    paintSignature(signature.node,t,ease((launchTime(milliseconds)-1530)/250));
   }
   clockLayer.style.setProperty('--launch-readout',String(state.readoutOpacity));
   for(const [token,intro]of [['accent','accent'],['ink','ink'],['muted','muted']])clockLayer.style.setProperty('--result-'+token,`color-mix(in srgb,var(--launch-${intro}) ${(100-state.travel*100).toFixed(2)}%,${colors[token]})`);
  }
  element.style.setProperty('--launch-branding',String(state.brandingOpacity));
  element.style.setProperty('--launch-exit',String(state.exit));
 }
 function finish({notify=true}={}){
  const wasActive=active;active=false;
  host.cancelAnimationFrame(frame);host.clearTimeout(guard);frame=0;guard=null;start=null;
  returnClock();
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
  const tick=time=>{if(!active)return;start??=time;const elapsed=time-start;borrowClock();paint(elapsed*LAUNCH_DURATION/duration);if(elapsed>=duration)finish();else frame=host.requestAnimationFrame(tick);};
  frame=host.requestAnimationFrame(tick);
 }
 root.addEventListener('visibilitychange',()=>{if(root.hidden&&active)finish();else if(!root.hidden&&documentRoot.dataset.launch==='pending')play();});
 host.addEventListener('beforeprint',()=>{finish({notify:false});host.dispatchEvent(new host.CustomEvent('kq:launch-print'));});
 host.addEventListener('resize',()=>{if(active)finish();});
 reduced.addEventListener('change',()=>{if(reduced.matches&&active){host.cancelAnimationFrame(frame);frame=0;returnClock();paint(0);}});
 if(documentRoot.dataset.launch==='pending')play();
 else finish();
 return {finish};
}
