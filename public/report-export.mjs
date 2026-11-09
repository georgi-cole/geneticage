let savePdf;
export function configureReportExport(save) {
 savePdf=save;
}

const excluded='[data-pdf-exclude], .no-print, .report-next-cards, button, svg, [aria-hidden="true"]';
const inlineTags=new Set(['A','ABBR','B','BR','EM','I','LABEL','SMALL','SPAN','STRONG','SUB','SUP','TIME']);
const cleanText=value=>value.replace(/\s+/g,' ').replace(/\s*↗/g,'').trim();

function readableText(node) {
 if(node.nodeType===3)return node.textContent;
 if(node.nodeType!==1)return '';
 const separator=node.matches('sup,sub')?'':' ';
 return [...node.childNodes].map(readableText).join(separator);
}

function blocks(element) {
 if(element.matches(excluded))return [];
 const tag=element.tagName;
 if(element.matches('.premium-report-chapter')){
  const [header,first,...rest]=element.children;
  const opening=[...blocks(header),...[...first.children].flatMap(blocks)];
  return [{stack:opening,unbreakable:true,margin:[0,0,0,7]},...rest.flatMap(blocks)];
 }
 if(element.matches('.premium-report-card')){
  return [{stack:[...element.children].flatMap(blocks),unbreakable:true,margin:[0,4,0,7]}];
 }
 if(element.matches('.premium-report-stats')){
  const columns=[...element.children].map(pair=>({width:'*',stack:[
   {text:cleanText(readableText(pair.querySelector('dt'))),style:'eyebrow'},
   {text:cleanText(readableText(pair.querySelector('dd'))),style:'result'},
  ]}));
  return [{columns,columnGap:16,margin:[0,8,0,5]}];
 }
 if(element.matches('.premium-report-readings li')&&element.children.length){
  return [{stack:[
   {text:cleanText(readableText(element.firstElementChild)),bold:true},
   {text:cleanText(readableText(element.lastElementChild)),style:'body'},
  ]}];
 }
 if(tag==='LI'&&element.children.length===1&&element.firstElementChild.tagName==='A')return blocks(element.firstElementChild);
 if(tag==='UL'||tag==='OL'){
  const items=[...element.children].flatMap(blocks);
  return items.length?[{[tag.toLowerCase()]:items,margin:[0,0,0,6]}]:[];
 }
 if(tag==='DL'){
  const terms=[...element.querySelectorAll('dt')];
  return terms.flatMap(term=>{
   const label=cleanText(readableText(term)),value=term.nextElementSibling;
   if(!label||value?.tagName!=='DD')return [];
   return [{text:[{text:label+'  ',bold:true},cleanText(readableText(value))],margin:[0,0,0,4]}];
  });
 }
 if(['H1','H2','H3','H4','P','SUMMARY','A'].includes(tag)||[...element.children].every(child=>inlineTags.has(child.tagName))){
  const text=cleanText(readableText(element));
  if(!text)return [];
  if(tag==='A'&&/^https:\/\//i.test(element.href))return [{text,link:element.href,style:'link'}];
  const style=element.matches('.report-age-line')?'result':element.matches('.premium-report-cover h2')?'briefing'
   :element.matches('.premium-report-chapter h2')?'section':element.matches('.premium-report-next strong,.premium-report-cover .eyebrow')?'eyebrow'
   :tag==='H1'?'title':tag==='H2'?'heading':tag==='SUMMARY'||/^H[34]$/.test(tag)?'subheading':'body';
  return [{text,style}];
 }
 return [...element.children].flatMap(blocks);
}

export function reportDocument(screen) {
 const heading=screen.querySelector('.report-heading');
 const paper=screen.querySelector('.report-paper');
 if(!heading||!paper)throw Error('Open a report before exporting a PDF.');
 const title=cleanText(heading.querySelector('h1').textContent);
 const mode=cleanText(heading.querySelector('.eyebrow').textContent);
 const content=[{text:'GeneticAge',style:'brand'},{text:mode,style:'eyebrow'},{text:title,style:'title'}];
 content.push(...[...heading.querySelectorAll('p')].flatMap(blocks));
 const note=screen.querySelector('.report-mode-note');
 if(note){
  const copy=note.cloneNode(true);
  copy.querySelectorAll(excluded).forEach(node=>node.remove());
  content.push(...blocks(copy));
 }
 const panels=[...paper.querySelectorAll(':scope > .report-panel:not([data-pdf-exclude])')];
 const premium=panels[0]?.querySelector('.premium-report');
 for(const [index,panel] of panels.entries()){
  const copy=panel.cloneNode(true);
  copy.querySelectorAll(excluded).forEach(node=>node.remove());
  if(!premium||index>0)content.push({text:panel.getAttribute('aria-label'),style:'section',...(premium&&index===1?{pageBreak:'before'}:{})});
  content.push(...blocks(copy));
 }
 const footnote=paper.querySelector(':scope > .report-footnote');
 if(footnote)content.push({text:cleanText(readableText(footnote)),style:'footnote'});
 return {
  content,
  info:{title:'GeneticAge · '+title,author:'KoleQuant'},
  pageSize:'A4',pageMargins:[44,42,44,48],
  defaultStyle:{fontSize:10,color:'#241b1a',lineHeight:1.18},
  styles:{
   brand:{fontSize:12,bold:true,color:'#783b30',margin:[0,0,0,16]},
   eyebrow:{fontSize:9,color:'#783b30',characterSpacing:.4,margin:[0,0,0,4]},
   title:{fontSize:26,bold:true,margin:[0,0,0,8]},
   briefing:{fontSize:21,bold:true,color:'#783b30',margin:[0,5,0,8]},
   result:{fontSize:21,bold:true,margin:[0,0,0,4]},
   section:{fontSize:15,bold:true,color:'#783b30',margin:[0,16,0,6]},
   heading:{fontSize:12,bold:true,margin:[0,8,0,4]},
   subheading:{fontSize:10,bold:true,margin:[0,6,0,3]},
   body:{margin:[0,0,0,4]},
   link:{color:'#783b30',decoration:'underline',margin:[0,0,0,4]},
   footnote:{fontSize:9,color:'#605351',margin:[0,16,0,0]},
  },
  footer:(page,total)=>({text:page+' / '+total,alignment:'right',margin:[0,14,44,0],fontSize:9,color:'#605351'}),
 };
}

export function exportReport(screen) {
 if(savePdf)return savePdf(reportDocument(screen));
 const details=[...screen.querySelectorAll('.report-paper details')];
 const previous=details.map(item=>item.open);
 details.forEach(item=>item.open=true);
 window.addEventListener('afterprint',()=>details.forEach((item,index)=>item.open=previous[index]),{once:true});
 window.print();
}
