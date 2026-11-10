import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';
import {storedText,signatureSvg} from './report-editorial-ui.mjs';

// A pure document definition. Both reading and PDF use the accepted snapshot;
// no DOM scraping, live evidence fetch, medical recalculation or user HTML.
export function reportPdfDefinition(document,{scope='report',language='en',logo=null,serif=true}={}){
 const e=document?.editorial;
 if(e?.version!=='personal-science-v2')throw Error('This edition uses the legacy print export.');
 if(!['report','technical'].includes(scope)||!['en','bg'].includes(language))throw Error('Unsupported export selection.');
 const t=text=>storedText(e,String(text??''),language);
 const accent=/^#[a-f0-9]{6}$/i.test(e.signature?.accent)?e.signature.accent:'#803E4B';
 const pale=/^#[a-f0-9]{6}$/i.test(e.signature?.pale)?e.signature.pale:'#F2E8E8';
 const display=value=>Array.isArray(value)?value.join('; '):typeof value==='object'?JSON.stringify(value):String(value??'');
 const titleFont=serif&&language==='en'?'KQSerif':'Roboto';
 const sources=new Map(e.citations.map((s,i)=>[s.id,{...s,index:i+1}]));
 const safe=value=>{try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}};
 const citations=ids=>[...new Set(ids||[])].map(id=>sources.get(id)).filter(s=>s&&safe(s.url)).map(s=>({text:`[${s.index}] `,link:s.url,color:accent,fontSize:8}));
 const line=(text,style='body',more={})=>({text:t(text),style,...more});
 const blocks=(block)=>{
  const content=[];
  if(block.title)content.push(line(block.title,'subhead'));
  content.push(line(block.text));
  if(block.sources?.length)content.push({text:citations(block.sources),margin:[0,3,0,6]});
  if(['trial','treatment','derived','safety'].includes(block.kind)){
   return {unbreakable:true,table:{widths:['*'],body:[[{stack:content,fillColor:block.kind==='safety'?'#FFF0E4':pale,margin:[13,12,13,8]}]]},layout:{hLineWidth:()=>0,vLineWidth:i=>i===0?2:0,vLineColor:()=>accent,paddingLeft:()=>0,paddingRight:()=>0,paddingTop:()=>0,paddingBottom:()=>0},margin:[0,2,0,12]};
  }
  return {stack:content,unbreakable:true,margin:[0,0,0,10]};
 };
 const content=[];
 const metric=e.metric||{};
 const bounded=metric.ageRange&&Number.isFinite(metric.boundary);
 const boundLabels={below:language==='bg'?'Под':'Below',above:language==='bg'?'Над':'Above','at-least':language==='bg'?'Поне':'At least','up-to':language==='bg'?'До':'Up to'};
 const resultText=bounded?`${boundLabels[metric.ageRange]||''} ${metric.boundary}`:Number.isFinite(metric.age)?String(metric.age):null;
 content.push({stack:[
  {text:'GENETICAGE  /  KOLEQUANT',fontSize:10,characterSpacing:2,color:accent,margin:[0,6,0,45]},
  line(scope==='report'?C.report:C.data,'kicker'),
  {text:t(e.title),font:titleFont,fontSize:52,lineHeight:1.04,color:'#262E33',margin:[0,10,0,20]},
  {text:t(e.deck),font:titleFont,fontSize:23,color:'#565C5E',margin:[0,0,0,25]},
  {columns:[
   {width:'*',stack:[
    ...(resultText?[{text:resultText,fontSize:55,color:accent,bold:false,margin:[0,8,0,0]},line(C.years,'kicker')]:[line(C.notcalculated,'subhead')]),
    ...(metric.chronologicalAge!==null?[{text:`${t(e.type==='clinical-phenoage'?C.labage:C.recordedAge)}: ${metric.chronologicalAge}`,style:'small'}]:[]),
    ...(metric.gap!==null?[{text:`${t(C.gap)}: ${metric.gap>0?'+':''}${metric.gap}`,style:'small'}]:[]),
    ...(metric.method?[{text:metric.method,style:'small'}]:[]),
    ...(metric.ageBand?[{text:`${t(C.comparisonBand)}: ${metric.ageBand.from}–${metric.ageBand.to}`,style:'small'}]:[]),
    ...(resultText?[line(C.ageComparison,'small')]:[]),
   ]},
   {width:210,svg:signatureSvg(e.signature?.motif,accent).replace(' aria-hidden="true" focusable="false"',''),margin:[0,-15,0,10]},
  ],columnGap:20},
  {text:t(e.sample?C.sample:C.personal),fontSize:10,color:accent,margin:[0,28,0,7]},
  {text:e.drawDate||e.date?.slice(0,10)||'',fontSize:10,color:'#5E6668'},
  {canvas:[{type:'line',x1:0,y1:10,x2:499,y2:10,lineWidth:.7,lineColor:'#C9CCC6'}],margin:[0,15,0,20]},
  line(C.notice,'small'),
 ],pageBreak:'after'});
 if(scope==='report'){
  for(const [index,chapter] of e.chapters.entries()){
   const heading={id:'chapter-'+chapter.id,headlineLevel:1,stack:[
    {text:String(index+1).padStart(2,'0')+'  /  '+t(e.title),fontSize:8,characterSpacing:1.2,color:accent,margin:[0,14,0,10]},
    {text:t(chapter.title),font:titleFont,fontSize:29,lineHeight:1.08,color:'#262E33',margin:[0,0,0,10]},
    ...(chapter.deck?[{text:t(chapter.deck),font:titleFont,fontSize:16,lineHeight:1.2,color:'#626B6B',margin:[0,0,0,18]}]:[]),
   ],unbreakable:true,margin:[0,12,0,0]};
   const bodyNodes=[];
   let pending=[];
   const flush=()=>{if(pending.length)bodyNodes.push({columns:pending.map(blocks),columnGap:24,margin:[0,0,0,2]});pending=[];};
   for(const block of chapter.blocks){
    if(['context','recorded','derived','safety','plan','timing','editorial'].includes(block.kind)){
     flush();bodyNodes.push(blocks(block));
    }else {pending.push(block);if(pending.length===2)flush();}
   }
   flush();
   // Keep a feature heading with its first complete row, not merely its deck.
   content.push({stack:[heading,...bodyNodes.splice(0,1)],unbreakable:true});
   content.push(...bodyNodes);
   content.push({canvas:[{type:'line',x1:0,y1:7,x2:499,y2:7,lineWidth:.5,lineColor:'#D5D8D2'}],margin:[0,5,0,10]});
  }
 }else{
  content.push(line(C.record,'heading'));
  content.push(line(C.snapshot));
  const rows=e.record||[],groups=[...new Set(rows.map(row=>row.group))];
  for(const group of groups){
   content.push({text:t(group),style:'heading',headlineLevel:1,margin:[0,20,0,12]});
   const body=[[{text:t(C.input),style:'tableHead'},{text:t(C.value),style:'tableHead'}]];
   for(const row of rows.filter(r=>r.group===group)){
    const value=typeof row.value==='boolean'?(row.value?'Yes':'No'):display(row.value);
    const details=[];
    if(row.reference){
     const r=row.reference;
     const interval=[r.low===null?'':`${r.lowExclusive?'>':'≥'} ${r.low}`,r.high===null?'':`${r.highExclusive?'<':'≤'} ${r.high}`].filter(Boolean).join(' · ');
     details.push({text:interval+' '+row.unit,style:'small'});
    }
    if(row.comparison){
     const c=row.comparison;
     const p=c.provenance||{};
     details.push({text:t(c.value)+(p.sourceKind?' · '+t(p.sourceKind):''),style:'small'});
     if(p.comparisonValue!==null&&p.comparisonValue!==undefined)details.push({text:`${p.comparisonValue} ${c.unit||''}`,style:'small'});
     if(p.low!==null||p.high!==null)details.push({text:[p.low===null?'':`${p.lowExclusive?'>':'≥'} ${p.low}`,p.high===null?'':`${p.highExclusive?'<':'≤'} ${p.high}`].filter(Boolean).join(' · ')+' '+(c.unit||''),style:'small'});
     if(p.sourceUrl&&safe(p.sourceUrl))details.push({text:p.sourceVersion||t(C.evidence),link:p.sourceUrl,style:'small',color:accent});
    }
    if(row.assay)details.push({text:t(row.assay),style:'small'});
    body.push([{text:t(row.label),fontSize:9.5},{stack:[{text:t(value)+(row.unit?' '+row.unit:''),fontSize:10},...details]}]);
   }
   content.push({table:{headerRows:1,widths:['48%','52%'],body,dontBreakRows:true},layout:{hLineColor:()=>'#D8DBD5',hLineWidth:i=>i===1?1:.4,vLineWidth:()=>0,fillColor:i=>i===0?pale:null,paddingTop:()=>9,paddingBottom:()=>9,paddingLeft:()=>8,paddingRight:()=>8}});
  }
  if(e.derivedFacts?.length){
   content.push({text:t(C.derived),style:'heading',headlineLevel:1,margin:[0,25,0,12]});
   for(const fact of e.derivedFacts)content.push({stack:[line(fact.label,'subhead'),{text:`${fact.value} ${fact.unit}`,style:'body'},{text:t(C.calculation)+' · '+t(fact.formula),style:'small'},{text:fact.inputIds.join(' + '),style:'small'}],unbreakable:true,margin:[0,0,0,16]});
  }
  content.push({text:t(C.basis),style:'heading',headlineLevel:1,margin:[0,25,0,12]});
  for(const paragraph of e.methods)content.push(line(paragraph));
  const coverage=document.coverage?.questions;
  if(coverage?.total)content.push({text:t(C.coverageText).replace('{answered}',coverage.answered).replace('{total}',coverage.total),style:'body'});
  content.push(line(C.version,'heading',{margin:[0,25,0,12]}));
  content.push({text:[document.modelVersion,e.version,e.knowledgeVersion,e.evidenceVersion,e.layoutVersion].filter(Boolean).join('\n'),style:'small'});
 }
 content.push({text:t(C.evidence),style:'heading',pageBreak:'before'});
 content.push(line(C.notice,'small',{margin:[0,0,0,20]}));
 for(const [i,source] of e.citations.entries()){
  const stack=[{text:`${i+1}. ${t(source.label)}`,bold:true,fontSize:10,color:accent,...(safe(source.url)?{link:source.url}:{}),margin:[0,0,0,4]},line(source.kind,'small')];
  content.push({stack,unbreakable:true,margin:[0,0,0,13]});
 }
 return {
  info:{title:`GeneticAge · ${t(e.title)} · ${scope==='report'?t(C.report):t(C.data)}`,author:'KoleQuant',subject:'Automatically prepared educational assessment; not clinically reviewed',creator:'KoleQuant '+e.layoutVersion},
  pageSize:'A4',pageMargins:[48,50,48,64],compress:true,
  defaultStyle:{font:'Roboto',fontSize:10.3,lineHeight:1.3,color:'#303A40'},
  styles:{body:{fontSize:10.3,lineHeight:1.3,margin:[0,0,0,9]},small:{fontSize:8.1,lineHeight:1.25,color:'#606A6C',margin:[0,0,0,5]},kicker:{fontSize:9,characterSpacing:1.2,color:accent},subhead:{fontSize:11.5,bold:true,color:'#263137',margin:[0,0,0,7]},heading:{font:titleFont,fontSize:26,color:'#263137',margin:[0,0,0,16]},tableHead:{fontSize:9,bold:true,color:accent}},
  header:currentPage=>currentPage===1?null:{text:`GENETICAGE     /     ${t(e.title)}`,font:'Roboto',fontSize:8,color:'#747E7F',margin:[48,22,48,0]},
  footer:(page,pages)=>({margin:[48,15,48,0],stack:[{canvas:[{type:'line',x1:0,y1:0,x2:499,y2:0,lineWidth:.5,lineColor:'#D5D8D2'}]},{columns:[...(logo?[{image:logo,width:10,height:20,margin:[0,8,8,0]}]:[]),{text:'KoleQuant',bold:true,color:accent,fontSize:10,margin:[0,12,0,0]},{text:t(C.brand),fontSize:7,color:'#697271',alignment:'center',margin:[0,14,0,0]},{text:`${page} / ${pages}`,alignment:'right',fontSize:8,color:'#697271',width:40,margin:[0,13,0,0]}]}]}),
  pageBreakBefore:(node,container)=>node.headlineLevel===1&&container.getFollowingNodesOnPage().length===0,
  content,
 };
}
