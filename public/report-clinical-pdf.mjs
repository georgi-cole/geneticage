import {CLINICAL_COPY as L} from './report-knowledge/clinical-copy.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';
import {clinicalCoverArt,clinicalPageContent,clinicalRecordGroups,clinicalComparison} from './report-clinical.mjs';

const burgundy='#843D3F', ink='#252526', paper='#FBF8F2', coverPaper='#F4EEE5', soft='#EEE7DF', lineColor='#D7CDC3', muted='#65645F';
const safe=url=>typeof url==='string'&&/^https:\/\//i.test(url);
const rule=(width=505,color=lineColor,weight=.6)=>({canvas:[{type:'line',x1:0,y1:0,x2:width,y2:0,lineWidth:weight,lineColor:color}]});
const rowsByGroup=rows=>[...new Set(rows.map(row=>row.group))].map(name=>[name,rows.filter(row=>row.group===name)]);

export function clinicalPdfDefinition(document,{scope,logo,t,titleFont}){
 const e=document.editorial, f=e.folio, m=e.metric;
 const content=[];
 const text=(value,style='body',more={})=>({text:t(value),style,...more});
 const refs=new Map(e.citations.map((source,i)=>[source.id,{...source,number:i+1}]));
 const refRuns=ids=>[...new Set(ids||[])].map(id=>refs.get(id)).filter(source=>source&&safe(source.url)).map(source=>({
  text:' '+String(source.number).padStart(2,'0'),link:source.url,color:burgundy,fontSize:7.5,
 }));
 const paragraph=(value,ids,style='body')=>({text:[t(value),...refRuns(ids)],style});
 const brand=()=>({columns:[...(logo?[{image:logo,width:8,height:16}]:[]),{text:'KOLEQUANT',bold:true,fontSize:9,characterSpacing:1.7,margin:[0,4,0,0]}],columnGap:6});
 const band=(items)=>items.length?{
  table:{widths:items.map(()=>'*'),body:[items.map(({label,value,unit})=>({stack:[text(label,'small'),{text:String(value),font:titleFont,fontSize:24,color:ink,margin:[0,0,0,0]},text(unit,'small')]}))]},
  layout:{hLineWidth:()=>.6,vLineWidth:i=>i>0&&i<items.length?.6:0,hLineColor:()=>lineColor,vLineColor:()=>lineColor,paddingTop:()=>8,paddingBottom:()=>7,paddingLeft:i=>i===0?0:12,paddingRight:()=>8},margin:[0,4,0,16],
 }:null;
 const title=(eyebrow,heading,deck='')=>({stack:[text(eyebrow,'kicker'),text(heading,'heading'),...(deck?[text(deck,'deck')]:[])],unbreakable:true});
 const box=(stack,fill=soft)=>({table:{widths:['*'],body:[[{stack,fillColor:fill}]],dontBreakRows:true},
  layout:{hLineWidth:()=>0,vLineWidth:i=>i===0?1.4:0,vLineColor:()=>burgundy,paddingLeft:()=>12,paddingRight:()=>12,paddingTop:()=>6,paddingBottom:()=>4},margin:[0,0,0,6]});
 const block=b=>{
  const body=[...(b.title?[text(b.title,'subhead')]:[]),paragraph(b.text,b.sources)];
  return ['trial','treatment','derived','safety','aside'].includes(b.kind)?box(body,b.kind==='safety'?'#FFF0E4':soft):{stack:body,unbreakable:true};
 };
 const measure=m.age===null?[]:[
  {label:C['clinical-title'],value:m.age,unit:C.years},
  ...(m.chronologicalAge===null?[]:[{label:C.labage,value:m.chronologicalAge,unit:C.years}]),
  ...(m.gap===null?[]:[{label:C.gap,value:(m.gap>0?'+':'')+m.gap,unit:C.years}]),
 ];
 const showCover=scope==='report';
 if(showCover){
  content.push({stack:[
   {columns:[brand(),text(C.report,'small',{alignment:'right',margin:[0,4,0,0]})],margin:[0,-24,0,37]},
   text(L.clinicalFamily,'kicker'),
   text(f.headline,'coverTitle'),
   text(f.deck,'coverDeck'),
   {stack:measure.length?[
    rule(309,'#BFA99C'),
    {columns:[
     {width:168,stack:[text(C['clinical-title'],'small'),{text:[{text:String(m.age),font:titleFont,fontSize:56},{text:' '+t(C.years),font:'Roboto',fontSize:11}],color:burgundy,margin:[0,0,0,0]},text(C.ageComparison,'small',{margin:[0,0,18,0]})]},
     {width:129,stack:[...measure.slice(1).flatMap(item=>[text(item.label,'small'),{text:String(item.value)+' '+t(item.unit),font:titleFont,fontSize:18,margin:[0,0,0,6]}])]},
    ],columnGap:12,margin:[0,13,0,14]},
    rule(309,'#BFA99C'),
   ]:[text(C.notcalculated,'heading',{fontSize:24})],margin:[0,34,0,0]},
   ...(f.urgent?[box([text(C.critical)],'#FFF0E4')]:[]),
   {stack:[
    text(L.clinicalInside,'subhead'),
    ...f.overview.map(item=>text(item.title,'small',{linkToDestination:'clinical-'+item.id,color:burgundy,margin:[0,0,0,4]})),
    text(e.sample?C.sample:C.personal,'small',{margin:[0,13,0,4]}),
    ...(e.drawDate?[text(t(C.draw)+' · '+e.drawDate,'small')]:[]),
   ],margin:[0,78,0,0]},
  ]});
  e.folio.pages.forEach(page=>{
   const view=clinicalPageContent(e,page);
   const chapter=e.chapters.find(ch=>ch.id===page.chapters[0]);
   const pageBand=band(page.highlights||[]);
   const start={id:'clinical-'+page.id,pageBreak:'before',stack:[title(page.eyebrow,page.title,page.id==='prevention'?'':chapter.deck),...(pageBand?[pageBand]:[])]};
   content.push(start,...view.lead.map(block));
   if(view.steps?.length){
    for(const [index,b] of view.steps.entries())content.push({stack:[rule(),{columns:[{text:String(index+1).padStart(2,'0'),width:27,font:titleFont,fontSize:23,color:burgundy},block(b)],columnGap:11,margin:[0,6,0,0]}],unbreakable:true});
   }
   if(view.agenda?.length){
    content.push(table([L.clinicalWhen,L.clinicalWhat,L.clinicalQuestion],view.agenda.map(r=>[text(r.when,'cell',{bold:true,color:burgundy}),paragraph(r.review,r.sources,'cell'),text(r.question,'cell')]),['20%','46%','34%'],5));
   }
   const [left,right]=view.columns;
   if(page.id==='perspective'&&e.resultState==='ready'){
    content.push({columns:[
     {width:'*',stack:left.map(block)},
     {width:'*',stack:[box([text(L.clinicalInside,'kicker'),...f.pages.slice(1).filter(item=>['glucose','prevention','starting-plan','sleep','follow-up'].includes(item.id)).map(item=>text(item.title,'small',{linkToDestination:'clinical-'+item.id,margin:[0,0,0,5]}))])]},
    ],columnGap:23,margin:[0,6,0,4]});
   }else if(left.length||right.length){
    content.push({columns:[left,right].filter(col=>col.length).map(col=>({width:'*',stack:col.map(block)})),columnGap:23,margin:[0,4,0,0]});
   }
   content.push(...view.aside.map(block));
  });
 }else{
  const {blood,collection,answers,outputs,alerts}=clinicalRecordGroups(e);
  content.push(title(L.clinicalRecordLabel,L.clinicalRecord,L.clinicalRecordDeck));
  const resultBand=band(measure);
  if(resultBand)content.push(resultBand);
  if(blood.length)content.push(table([C.input,C.value,C.comparison],blood.map(row=>{
   const detail=clinicalComparison(row);
   return [text(row.label,'cell'),text(t(row.value)+' '+row.unit,'cell',{bold:true}),{stack:[
    text(detail.label,'cell'),
    {text:[
     [detail.range,detail.normalized,t(detail.assay)].filter(Boolean).join(' · '),
     ...(safe(detail.url)?[{text:' · '+t(detail.source||C.evidence),link:detail.url,color:burgundy}]:[]),
    ],style:'micro'},
   ]}];
  }),['32%','20%','48%'],4));
  else content.push(text(L.clinicalNoMeasurement));
  if(collection.length){
   const half=Math.ceil(collection.length/2);
   content.push({stack:[text('Collection details','subhead'),
    {columns:[collection.slice(0,half),collection.slice(half)].map(rows=>({width:'*',stack:rows.map(row=>{
     const [label,value]=recordPair(row);
     return {text:[label.text+': ',{text:value.text,bold:true}],style:'small'};
    })})),columnGap:15},
   ],unbreakable:true,margin:[0,4,0,5]});
  }
  if(alerts.length)content.push(...alerts.map(row=>box([text(row.value)])));
  if(answers.length){
   content.push({stack:[title(L.clinicalAnswersLabel,L.clinicalAnswers)],pageBreak:'before'});
   for(const [name,rows] of rowsByGroup(answers)){
    const group=document.coverage?.questions?.groups?.find(item=>item.name===name);
    const count=group?'  '+group.answered+' / '+group.total:'';
    content.push(table([t(name)+count,C.value],rows.map(row=>recordPair(row)),['71%','29%'],4));
   }
  }
  content.push({stack:[title(L.clinicalMethodsLabel,L.clinicalMethods),...e.methods.map(value=>text(value))],pageBreak:'before'});
  if(outputs.length)content.push(text(L.clinicalResultPrecision,'small'),table([C.input,C.value],outputs.map(row=>recordPair(row)),['55%','45%'],4));
  if(e.derivedFacts.length)content.push(text(C.derived,'subhead'),...e.derivedFacts.map(fact=>box([
   text(t(fact.label)+' · '+fact.value+' '+fact.unit,'subhead'),
   text(C.calculation,'small'),text(fact.formula,'small'),text(fact.inputIds.join(' + '),'small'),
  ])));
  content.push(text(L.clinicalBloodNote,'small'),text(C.version,'subhead'),
   text([document.modelVersion,document.questionnaireVersion,e.knowledgeVersion,e.evidenceVersion,e.layoutVersion].filter(Boolean).join(' · '),'small'));
 }
 if(e.citations.length){
  const sources=e.citations.map((source,index)=>({source,index}));
  for(let start=0;start<sources.length;start+=20){
   const section=sources.slice(start,start+20),middle=Math.ceil(section.length/2);
   content.push({pageBreak:'before',stack:[title(C.evidence,L.clinicalSourceLibrary,start?'':L.clinicalSourcesLead)]});
   content.push({columns:[section.slice(0,middle),section.slice(middle)].filter(col=>col.length).map(col=>({width:'*',stack:col.map(({source,index})=>({unbreakable:true,stack:[
    {columns:[{text:String(index+1).padStart(2,'0'),style:'micro',color:burgundy,width:17},{stack:[text(source.label,'source',{...(safe(source.url)?{link:source.url}:{})}),text(source.kind,'micro')]}],columnGap:5,margin:[0,0,0,9]},
   ]}))})),columnGap:22});
  }
 }

 function recordPair(row){
  const value=typeof row.value==='boolean'?(row.value?'Yes':'No'):String(row.value);
  return [text(row.label,'cell'),text(t(value)+(row.unit?' '+t(row.unit):''),'cell',{bold:true})];
 }
 function table(labels,rows,widths,padding=7){
  return {table:{headerRows:1,keepWithHeaderRows:1,dontBreakRows:true,widths,body:[labels.map(label=>text(label,'tableHead')),...rows]},
   layout:{hLineWidth:i=>i>0?.6:0,vLineWidth:()=>0,hLineColor:()=>lineColor,fillColor:i=>i===0?soft:null,paddingTop:()=>padding,paddingBottom:()=>padding,paddingLeft:()=>8,paddingRight:()=>8},margin:[0,0,0,11]};
 }
 return {
  info:{title:'KoleQuant · '+t(scope==='report'?f.headline:C.data),author:'KoleQuant',creator:'KoleQuant '+e.layoutVersion,subject:t(L.clinicalSourcesNotice)},
  pageSize:'A4',pageMargins:[45,71,45,62],
  defaultStyle:{font:'Roboto',fontSize:10.4,color:ink,lineHeight:1.23},
  styles:{
   body:{fontSize:10.1,lineHeight:1.17,margin:[0,0,0,7]},
   small:{fontSize:8.5,lineHeight:1.22,color:muted,margin:[0,0,0,4]},
   micro:{fontSize:7.8,lineHeight:1.15,color:muted,margin:[0,0,0,2]},
   kicker:{fontSize:8,bold:true,color:burgundy,characterSpacing:1.4,margin:[0,0,0,11]},
   heading:{font:titleFont,fontSize:28,lineHeight:1.04,margin:[0,0,0,11]},
   deck:{fontSize:11,color:muted,lineHeight:1.25,margin:[0,0,0,12]},
   coverTitle:{font:titleFont,fontSize:42,lineHeight:1.01,margin:[0,0,60,14]},
   coverDeck:{fontSize:13,color:muted,lineHeight:1.25,margin:[0,0,140,8]},
   subhead:{fontSize:11.1,bold:true,lineHeight:1.15,margin:[0,0,0,5]},
   cell:{fontSize:9.2,lineHeight:1.15},tableHead:{fontSize:8.1,bold:true,characterSpacing:.45},
   source:{fontSize:9.3,bold:true,color:burgundy,lineHeight:1.16,margin:[0,0,0,3]},
  },
  background:(page,size)=>{
   const fill={canvas:[{type:'rect',x:0,y:0,w:size.width,h:size.height,color:showCover&&page===1?coverPaper:paper}]};
   return showCover&&page===1?[fill,{svg:clinicalCoverArt().replace(' aria-hidden="true" focusable="false"',''),width:272,absolutePosition:{x:323,y:235}}]:fill;
  },
  header:page=>({margin:[45,39,45,0],stack:[rule(505,burgundy,2),...(page===1&&showCover?[]:[{columns:[text(L.clinicalFamily,'micro'),text(e.sample?C.sample:C.personal,'micro',{alignment:'right'})],margin:[0,7,0,0]}])]}),
  footer:page=>({margin:[45,16,45,0],stack:[rule(),{columns:[{width:108,stack:[brand()]},text(L.clinicalSourcesNotice,'micro',{alignment:'center',margin:[0,5,0,0]}),{text:(scope==='technical'?'D':'')+String(page).padStart(2,'0'),width:30,bold:true,fontSize:9,color:burgundy,alignment:'right',margin:[0,4,0,0]}],margin:[0,5,0,0]}]}),
  content,
 };
}
