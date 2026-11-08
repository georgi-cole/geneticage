// Browser entries carry an opaque position. Screen context stays in page memory.
export function createNavigationHistory({read, restore, back}){
 const session=crypto.getRandomValues(new Uint32Array(2)).join('-');
 const entries=[];
 let cursor=0, backingFrom, expected, moveTimer;

 function marker(index){
  return {...window.history.state,geneticAgeNavigation:[session,index]};
 }

 function visit({replace=false,returnTo,backward=false}={}){
  const point=read();
  if(backward||backingFrom!==undefined){
   const from=backingFrom??cursor;
   // A completed flow can return directly to its opener. A resumed form may
   // have earlier steps that were never separate browser entries in this visit.
   const match=returnTo??entries.findLastIndex((entry,index)=>index<from&&index>=(point.parent??0)&&entry?.key===point.key);
   const index=match>=0&&match<=from?match:from;
   entries[index]=point;
   if(index!==cursor){
    expected=index;
    window.history.go(index-cursor);
    moveTimer=window.setTimeout(()=>{
     expected=undefined;
     entries[cursor]=read();
    },750);
   }
   return;
  }
  if(replace||entries[cursor]?.key===point.key||!entries[cursor]){
   entries[cursor]=point;
   if(window.history.state?.geneticAgeNavigation?.[0]!==session)window.history.replaceState(marker(cursor),'');
  }else{
   window.history.pushState(marker(cursor+1),'');
   cursor++;
   entries.splice(cursor,entries.length-cursor,point);
  }
 }

 window.addEventListener('popstate',event=>{
  const state=event.state?.geneticAgeNavigation;
  if(!Array.isArray(state))return;
  const [id,index]=state;
  if(id!==session||!Number.isInteger(index)||index<0||index>=entries.length)return;
  const previous=cursor;
  cursor=index;
  window.clearTimeout(moveTimer);
  if(expected!==undefined){
   const reached=index===expected;
   expected=undefined;
   if(!reached)restore(entries[index]);
   return;
  }
  if(index===previous-1){
   backingFrom=previous;
   try{if(back())return;}
   finally{backingFrom=undefined;}
  }
  restore(entries[index]);
 });

 return {
  visit,
  get position(){return cursor;},
  get moving(){return expected!==undefined;},
  update(point){if(entries[cursor])Object.assign(entries[cursor],point);},
  forget(test){entries.forEach((entry,index)=>{if(entry&&test(entry))entries[index]=undefined;});},
  clear(){entries.fill(undefined);},
 };
}
