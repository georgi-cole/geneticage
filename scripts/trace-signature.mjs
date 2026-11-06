// Vector contour preparation only. The original brand bitmap is never modified.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),width=1000,height=840;
const bitmap=await readFile(new URL('public/assets/kolequant-mark.webp',root));
const ui=await readFile(new URL('public/ui-components.mjs',root),'utf8');
const paths=[...ui.matchAll(/class="signature-(?:rear|front)" d="([^"]+)"/g)].map(m=>m[1]);
const target=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="840" viewBox="0 0 100 84">${paths.map(d=>`<path d="${d}" fill="white"/>`).join('')}</svg>`);
const original=await sharp(bitmap).resize(891,840,{fit:'fill'}).extend({left:54,right:55,top:0,bottom:0,background:'#00000000'}).ensureAlpha().raw().toBuffer();
const final=await sharp(target).ensureAlpha().raw().toBuffer();
function contours(bytes){
 const edges=new Map(),inside=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&bytes[(y*width+x)*4+3]>=128;
 const edge=(a,b)=>{if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);};
 const key=(x,y)=>y*(width+1)+x,point=k=>[k%(width+1),Math.floor(k/(width+1))];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(inside(x,y)){
  if(!inside(x,y-1))edge(key(x,y),key(x+1,y));
  if(!inside(x+1,y))edge(key(x+1,y),key(x+1,y+1));
  if(!inside(x,y+1))edge(key(x+1,y+1),key(x,y+1));
  if(!inside(x-1,y))edge(key(x,y+1),key(x,y));
 }
 const loops=[];
 while(edges.size){const start=edges.keys().next().value;let k=start;const loop=[];
  do{loop.push(point(k));const list=edges.get(k);if(!list)break;const next=list.pop();if(!list.length)edges.delete(k);k=next;}while(k!==start);
  const area=loop.reduce((a,p,i)=>{const q=loop[(i+1)%loop.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2;
  if(Math.abs(area)>150)loops.push({points:loop,area});
 }
 const outer=loops.filter(l=>l.area>0).sort((a,b)=>b.area-a.area)[0];
 const holes=loops.filter(l=>l.area<0).sort((a,b)=>a.points.reduce((s,p)=>s+p[1],0)/a.points.length-b.points.reduce((s,p)=>s+p[1],0)/b.points.length);
 return [outer,...holes];
}
function sample(loop,n){
 const p=loop.points,lengths=p.map((v,i)=>Math.hypot(v[0]-p[(i+1)%p.length][0],v[1]-p[(i+1)%p.length][1]));
 const total=lengths.reduce((a,b)=>a+b,0),out=[];let j=0,base=0;
 for(let i=0;i<n;i++){const d=total*i/n;while(base+lengths[j]<d){base+=lengths[j++];}const t=(d-base)/lengths[j],q=p[(j+1)%p.length];out.push([+(p[j][0]+(q[0]-p[j][0])*t).toFixed(2)/10,+(p[j][1]+(q[1]-p[j][1])*t).toFixed(2)/10]);}return out;
}
const a=contours(original),b=contours(final);
if(a.length!==b.length)throw Error(`Review topology: source ${a.length}, target ${b.length}`);
const pairs=a.map((loop,i)=>{const count=i?96:256,from=sample(loop,count),to=sample(b[i],count);let best=Infinity,shift=0;
 for(let k=0;k<count;k++){let error=0;for(let j=0;j<count;j++){const q=to[(j+k)%count];error+=(from[j][0]-q[0])**2+(from[j][1]-q[1])**2;}if(error<best){best=error;shift=k;}}
 return [from,to.map((_,j)=>to[(j+shift)%count])];
});
await writeFile(new URL('public/signature-contours.mjs',root),`// Derived from the unchanged KoleQuant mark (SHA-256 ${createHash('sha256').update(bitmap).digest('hex')}).\n// Rebuild with node scripts/trace-signature.mjs. Outer contour and holes stay paired.\nexport const signatureContours=${JSON.stringify(pairs)};\n`);
console.log(`Prepared ${pairs.length} paired contours; no raster replacement or clipping required.`);
