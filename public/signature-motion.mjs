import {signatureContours} from './signature-contours.mjs';

// One silhouette throughout: outer boundary and both genetic-strand openings.
export function signatureOutline(progress){
 const t=Math.max(0,Math.min(1,progress));
 return signatureContours.map(([from,to])=>from.map((p,i)=>(i?'L':'M')+(p[0]+(to[i][0]-p[0])*t).toFixed(3)+' '+(p[1]+(to[i][1]-p[1])*t).toFixed(3)).join('')+'Z').join('');
}
export function paintSignature(node,progress,material=0){
 const document=node.ownerDocument,ns='http://www.w3.org/2000/svg';
 let shape=node.querySelector('.signature-morph');
 if(!shape){
  const gradient=document.createElementNS(ns,'linearGradient');gradient.id='signature-brand-morph';
  gradient.setAttribute('x1','0');gradient.setAttribute('y1','0');gradient.setAttribute('x2','0');gradient.setAttribute('y2','1');
  ['#258bca','#39a676','#8335a3'].forEach((color,i)=>{const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',String(i/2));stop.dataset.brandColor=color;gradient.append(stop);});
  node.querySelector('defs').append(gradient);
  shape=document.createElementNS(ns,'path');shape.setAttribute('class','signature-morph');shape.setAttribute('fill-rule','evenodd');shape.setAttribute('fill','url(#signature-brand-morph)');node.querySelector('.signature-surface').append(shape);
 }
 node.dataset.launchMorph='true';shape.setAttribute('d',signatureOutline(progress));shape.style.opacity=String(1-material);node.style.setProperty('--signature-material',String(material));
 node.querySelectorAll('[data-brand-color]').forEach(stop=>stop.setAttribute('stop-color','color-mix(in srgb,'+stop.dataset.brandColor+' '+((1-progress)*100)+'%,var(--result-ink))'));
}
export function settleSignature(node){
 node.querySelector('.signature-morph')?.remove();node.querySelector('#signature-brand-morph')?.remove();delete node.dataset.launchMorph;node.style.removeProperty('--signature-material');
}
