const art = {
  'blood-moon':'/assets/blood-moon.webp',
  'royal-purple':'/assets/theme-royal.webp',
  silverbolt:'/assets/theme-silverbolt.webp',
  moonshine:'/assets/theme-moonshine.webp',
};
const symbols = [
  '<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  '<path d="M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
];
const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const arrow = '<span aria-hidden="true">→</span>';
const routes = [
  {label:'Questionnaire',title:'Health & lifestyle',description:'A personal profile of your habits and health history.',meta:'26 questions · No lab results needed',action:'start',button:'Start profile'},
  {label:'Clinical PhenoAge',title:'Blood-based age',description:'An age estimate from nine routine blood measurements.',meta:'Existing lab results · Published method',action:'start-labs',button:'Enter results'},
];

export function renderThemeHome({theme,value,gap,selection='clinical'}) {
  if(theme==='futuristic')return instrumentHome(value,gap,selection);
  return `<div class="wrap home-workspace themed-workspace">
    <section class="workspace-intro" aria-labelledby="home-title"><div><div class="theme-eyebrow">YOUR BIOLOGY. IN CONTEXT.</div><h1 id="home-title">Your health <em>workspace.</em></h1><p>Choose a health profile or a blood-based age estimate.</p></div></section>
    <div class="home-grid">
      <section class="start-panel panel" aria-labelledby="choose-title"><div class="panel-heading"><h2 id="choose-title">Start an assessment</h2><span class="quiet-label">2 options</span></div>
        ${routes.map((route,index)=>`<article class="choice-row"><span class="choice-symbol" aria-hidden="true">${theme==='silverbolt'?`<span class="choice-index">0${index+1}</span>`:svg(symbols[index])}</span><div class="choice-copy"><span class="choice-label">${route.label}</span><h3>${route.title}</h3><p>${route.description}</p><span class="choice-meta"><span class="choice-meta-desktop">${route.meta}</span><span class="choice-meta-compact">${index?'9 biomarkers · Lab report':'26 questions · No labs'}</span></span></div><button class="btn ${index?'secondary':''}" data-action="${route.action}">${route.button} ${arrow}</button></article>`).join('')}
        <div class="panel-note">Only the blood-based assessment calculates an age estimate.</div>
      </section>
      <section class="sample-panel panel" aria-labelledby="sample-title"><div class="theme-art" aria-hidden="true"><img src="${art[theme]}" alt="" width="${theme==='blood-moon'?480:800}" height="${theme==='blood-moon'?480:1000}" decoding="async"></div><div class="panel-heading"><h2 id="sample-title">A look at the result</h2><span class="sample-label">SAMPLE</span></div><div class="sample-readout"><div><span class="readout-label">Clinical PhenoAge</span><strong>${value??'—'}<small>years</small></strong></div><span class="sample-data-note">Illustrative data · Not your result</span></div><dl class="sample-baseline"><div><dt>Age at blood draw</dt><dd>45 <span>years</span></dd></div><div><dt>Simple difference</dt><dd>${gap} <span>years</span></dd></div></dl><button class="sample-open text-btn" data-action="sample">View sample assessment <span aria-hidden="true">↗</span></button></section>
    </div>
    <section class="support-row" aria-label="Help and next steps"><button class="support-link" data-action="method"><span><strong>Understand the methods</strong><small>What each assessment can tell you.</small></span><span aria-hidden="true">↗</span></button><button class="support-link" data-action="consult"><span><strong>Discuss your results</strong><small>Consultations and laboratory testing.</small></span><span aria-hidden="true">↗</span></button></section>
    <div class="home-footnote"><span>For adults 18+</span><span>Saving is optional</span><span>Your data choices stay yours</span></div>
  </div>`;
}

const instrumentRoutes = {
  clinical:{title:'Blood-based age',description:'An age estimate from nine routine blood measurements, using Clinical PhenoAge.',meta:'9 BIOMARKERS<br>EXISTING LAB RESULTS',button:'Enter results',action:'start-labs'},
  profile:{title:'Health & lifestyle',description:'A profile of your habits and health history. It does not estimate age.',meta:'26 QUESTIONS<br>NO LAB RESULTS NEEDED',button:'Start profile',action:'start'},
};
function instrumentHome(value,gap,selection) {
  const route=instrumentRoutes[selection]||instrumentRoutes.clinical;
  return `<div class="wrap instrument-home">
    <section class="instrument-heading"><div><div class="theme-eyebrow">PERSONAL HEALTH / OVERVIEW</div><h1>Human data.<br>Clear perspective.</h1></div><span>YOUR BIOLOGY<br>IN CONTEXT.</span></section>
    <div class="instrument">
      <section class="instrument-selector" aria-label="Assessment selector"><div class="instrument-kicker">SELECT AN ASSESSMENT</div><div class="instrument-choices" role="group" aria-label="Assessment type"><button type="button" class="instrument-choice" data-action="choose-home-assessment" data-assessment="profile" aria-pressed="${selection==='profile'}"><span>01</span><span>Health & lifestyle</span></button><button type="button" class="instrument-choice" data-action="choose-home-assessment" data-assessment="clinical" aria-pressed="${selection==='clinical'}"><span>02</span><span>Blood-based age</span></button></div><div class="instrument-selected"><h2>${route.title}</h2><p>${route.description}</p><div class="instrument-meta">${route.meta}</div></div><button class="btn" data-action="${route.action}">${route.button} ${arrow}</button></section>
      <section class="instrument-monitor" aria-label="Sample Clinical PhenoAge readout"><div class="monitor-heading"><span>CLINICAL PHENOAGE</span><span>SAMPLE</span></div><div class="monitor-readout"><div class="monitor-value">${value??'—'}<small>YEARS</small></div><div class="monitor-field" aria-hidden="true"><canvas></canvas></div></div><div class="monitor-note">ILLUSTRATIVE DATA / NOT YOUR RESULT</div><dl class="monitor-stats"><div><dt>Age at blood draw</dt><dd>45 <span>years</span></dd></div><div><dt>Simple difference</dt><dd>${gap} <span>years</span></dd></div></dl><button class="monitor-open" data-action="sample">View sample assessment <span aria-hidden="true">↗</span></button></section>
    </div>
    <div class="instrument-keys"><div><button class="btn secondary" data-action="method">${svg('<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15"/>')}Methods</button><button class="btn secondary" data-action="consult">${svg('<path d="M21 11.5A8.5 8.5 0 0 1 12.5 20H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/>')}Consultation</button></div><span>ADULTS 18+<br>SAVING IS OPTIONAL</span></div>
  </div>`;
}

let fieldObserver=null;
export function renderThemeArtwork() {
  fieldObserver?.disconnect();
  const canvas=document.querySelector('.monitor-field canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  function draw(){
    const bounds=canvas.getBoundingClientRect();if(bounds.width<1||bounds.height<1)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(bounds.width*ratio);canvas.height=Math.round(bounds.height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,bounds.width,bounds.height);
    const columns=29,rows=30;
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
      const u=i/(columns-1),v=j/(rows-1);
      const wave=Math.sin(u*8.3+v*2.8)*.13+Math.sin(v*7.1-u*4.5)*.09;
      const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
      const x=8+u*(bounds.width-16)+Math.sin(v*6.28)*envelope*13;
      const y=7+(v+wave*envelope)*(bounds.height-14);
      const bright=(Math.sin(u*9+v*5)+1)/2;
      ctx.fillStyle=bright>.68?'#e29b64':'#c9dfad';ctx.globalAlpha=.25+envelope*.65;
      const size=bright>.7?2.1:1.2;ctx.fillRect(x,y,size,size);
    }
    ctx.globalAlpha=1;
  }
  fieldObserver=new ResizeObserver(draw);fieldObserver.observe(canvas);draw();
}
