// Capture atomic surfaces, including their artwork. Transparent images are never
// isolated or sent through SVG filters, which can produce black capture rectangles.
function visible(element){const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
export function captureThemeElements(){
 const items=[],used=[];
 const candidates=[...document.querySelectorAll('.header,.app-sidebar,.mobile-nav,main [data-theme-part],main .saved-records,main .result-tabs,main .result-actions,main .report-paper,main .report-reader-select,main .report-reader-nav,main .notice,main .card,main .form-nav')];
 for(const element of candidates){if(!visible(element)||used.some(parent=>parent.contains(element)))continue;used.push(element);const previous=element.style.viewTransitionName,name='kq-part-'+items.length,r=element.getBoundingClientRect();element.style.viewTransitionName=name;items.push({element,name,previous,x:r.x,y:r.y,width:r.width,height:r.height});}
 return {items,cleanup(){items.forEach(({element,previous})=>element.style.viewTransitionName=previous);}};
}

// The two masks share a slightly overlapping liquid edge. Incoming material paints
// over existing material at full opacity: no flash/fade, blur, scale or translation.
export function liquidPaintPolygon(progress,incoming=true,seed=0){
 const front=Array.from({length:13},(_,i)=>{const y=-8+i*116/12,t=i/12;const wave=Math.sin(progress*Math.PI)*(Math.sin(t*Math.PI*2+seed)*7+Math.cos(t*Math.PI+seed*.3)*5);const x=-26+152*progress+wave+(incoming?.6:-.6);return [x.toFixed(3)+'%',y.toFixed(3)+'%'];});
 const points=incoming?[['-8%','-8%'],...front,['-8%','108%']]:[front[0],['108%','-8%'],['108%','108%'],...front.slice(1).reverse()];
 return 'polygon('+points.map(p=>p.join(' ')).join(',')+')';
}
export function liquidElementFrames(kind,incoming,seed=0){return Array.from({length:9},(_,i)=>({offset:i/8,opacity:1,filter:'none',transform:'none',clipPath:liquidPaintPolygon(i/8,incoming,seed)}));}

export async function animateThemeElements(root,before,after,interrupted){
 const animations=[],duration=980,easing='cubic-bezier(.35,0,.2,1)';
 const names=['root',...after.items.map(item=>item.name)];
 try{
  names.forEach((name,index)=>{
   const seed=(index%5)*.47,delay=name==='root'?0:(index%4)*24;
   if(name!=='root'){const item=after.items[index-1];animations.push(root.animate([{transform:`translate(${item.x}px, ${item.y}px)`,width:`${item.width}px`,height:`${item.height}px`},{transform:`translate(${item.x}px, ${item.y}px)`,width:`${item.width}px`,height:`${item.height}px`}],{duration:duration+delay,fill:'both',pseudoElement:`::view-transition-group(${name})`}));}
   for(const incoming of [false,true])animations.push(root.animate(liquidElementFrames('surface',incoming,seed),{duration,delay,easing,fill:'both',pseudoElement:`::view-transition-${incoming?'new':'old'}(${name})`}));
  });
  const finished=Promise.allSettled(animations.map(a=>a.finished));await(interrupted?Promise.race([finished,interrupted]):finished);
 }finally{animations.forEach(a=>a.cancel());}
}
// Native colour interpolation is the quiet fallback when snapshot transitions are absent.
export async function settleThemeElements(){return;}
