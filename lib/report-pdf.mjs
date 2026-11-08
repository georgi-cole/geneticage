import {PDFDocument, PDFString, rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {translateText} from '../public/language-system.mjs';

const [width,height] = [420,595];
const margin = 31;
const measure = width - margin * 2;
const ink = rgb(.1,.14,.19), muted = rgb(.29,.35,.42), accent = rgb(.04,.37,.38);
const line = rgb(.81,.86,.88), tint = rgb(.94,.97,.97);
const substitutions = new Map([['–','-'],['—','-'],['−','-'],['₂','2'],['₁','1'],['₀','0'],['′',"'"],[' ',' '],[' ',' ']]);

export async function renderFullReportPdf(content, {language='en',fontBytes}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontBytes,{subset:true});
  const glyphs = new Set(font.getCharacterSet());
  const localize = text => translateText(String(text ?? ''),language);
  const printable = value => Array.from(value, char => substitutions.get(char) ?? (glyphs.has(char.codePointAt(0)) ? char : '?')).join('');
  const title = localize('Instant Full Report');
  const date = new Date(content.savedAt);
  doc.setTitle(title);
  doc.setAuthor('KoleQuant');
  doc.setLanguage(language);
  doc.setCreationDate(date);
  doc.setModificationDate(date);
  const dateLabel = new Intl.DateTimeFormat(language === 'bg' ? 'bg-BG' : 'en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(date);
  let page, y;

  function write(value,x,top,size,color=ink) {
    page.drawText(value,{x,y:top-size,font,size,color});
  }
  function rule(top) {
    page.drawLine({start:{x:margin,y:top},end:{x:width-margin,y:top},thickness:.65,color:line});
  }
  function newPage() {
    page = doc.addPage([width,height]);
    y = height - margin;
    write('GeneticAge  /  KoleQuant',margin,y,10,accent);
    if (content.sample) {
      const label = printable(localize('Fictional sample'));
      write(label,width-margin-font.widthOfTextAtSize(label,10),y,10,accent);
    }
    y -= 24;
    rule(y);
    y -= 17;
  }
  function reserve(points) {
    if (y - points < 49) newPage();
  }
  function wrap(value,size,limit=measure) {
    const words = value.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const joined = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(joined,size) <= limit) {
        current = joined;
        continue;
      }
      if (current) lines.push(current);
      current = '';
      for (const char of word) {
        if (font.widthOfTextAtSize(current+char,size) > limit) { lines.push(current); current = ''; }
        current += char;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
  function paragraph(value,{size=11,color=ink,translate=true,after=6,url}={}) {
    const text = printable(translate ? localize(value) : value);
    for (const row of wrap(text,size)) {
      reserve(size+4);
      write(row,margin,y,size,color);
      if (url) {
        const link = doc.context.obj({
          Type:'Annot', Subtype:'Link', Rect:[margin,y-size-2,margin+font.widthOfTextAtSize(row,size),y+1], Border:[0,0,0],
          A:{Type:'Action',S:'URI',URI:PDFString.of(url)},
        });
        page.node.addAnnot(doc.context.register(link));
      }
      y -= size + 4;
    }
    y -= after;
  }
  function heading(label) {
    reserve(76);
    y -= 7;
    paragraph(label,{size:17,after:8});
  }
  const indexes = new Map(content.sources.map((source,index)=>[source.url,index+1]));
  function rows(label, entries) {
    if (!entries.length) return;
    heading(label);
    for (const {label,value,notes,urls} of entries) {
      reserve(41);
      const refs = urls.map(url=>indexes.get(url)).filter(Boolean);
      paragraph(localize(label) + (value ? '  ·  '+localize(value) : '') + (refs.length?'  ['+[...new Set(refs)].join(', ')+']':''),{size:11,translate:false,color:accent,after:3});
      for (const note of notes) paragraph(note,{size:10,color:muted,after:3});
      y -= 6;
    }
  }

  newPage();
  paragraph(title,{size:11,after:5,color:accent,translate:false});
  paragraph(content.title,{size:25,after:5});
  paragraph(localize('Saved assessment') + '  ·  ' + dateLabel,{size:10,color:muted,translate:false,after:13});
  if (content.sample) paragraph('This example uses fictional measurements and answers.',{color:muted,after:13});
  if (content.age) {
    page.drawRectangle({x:margin,y:y-76,width:measure,height:76,color:tint});
    write(printable(localize(content.ageLabel)),margin+13,y-10,10,accent);
    const value = printable(content.age);
    write(value,margin+13,y-25,33);
    write(printable(localize('years')),margin+20+font.widthOfTextAtSize(value,33),y-43,12,muted);
    y -= 88;
  } else if (content.reason) {
    paragraph('Estimate unavailable',{size:17,after:4});
    paragraph(content.reason,{color:muted,after:12});
  }
  rows('Result in context',content.comparison);
  if (content.note) {
    heading('How your inputs were used');
    if (content.method && content.method !== content.title) paragraph(content.method,{color:accent});
    paragraph(content.note);
  }
  rows('Measurement notes',content.measurements);
  rows('Topics from your questionnaire',content.priorities);
  rows('Recorded answers',content.inputRows);
  if (content.followUp) {
    heading('Question for a follow-up visit');
    paragraph(content.followUp);
  }
  if (content.sources.length) {
    heading('Sources');
    content.sources.forEach((source,index)=>{
      reserve(35);
      paragraph('['+(index+1)+']  '+localize(source.label),{url:source.url,size:10,color:accent,translate:false});
    });
  }
  paragraph('This automated report is for education. A healthcare professional can interpret the findings alongside your medical history.',{size:10,color:muted,after:0});

  const pages = doc.getPages();
  for (const [index,current] of pages.entries()) {
    page = current;
    rule(35);
    write(printable(title),margin,29,9,muted);
    const number = (index+1)+' / '+pages.length;
    write(number,width-margin-font.widthOfTextAtSize(number,9),29,9,muted);
  }
  return doc.save();
}
