import {inlineScriptJSON} from '../../public/script-data.mjs';
export const THEME_KEY = 'kq-theme-v2';
export const DEFAULT_THEME = 'black-metal';
export const THEMES = [
  {id:'black-metal',label:'Black Metal',scheme:'dark',icon:'diamond',description:'Polished graphite · jade',swatch:'#a6d3ba'},
  {id:'blood-moon',label:'Blood Moon',scheme:'dark',icon:'eclipse',description:'Oxblood · lunar copper',swatch:'#e7a18e'},
  {id:'royal-purple',label:'Royal Purple',scheme:'dark',icon:'royal',description:'Amethyst · champagne',swatch:'#d1adfa'},
  {id:'futuristic',label:'Futuristic',scheme:'light',icon:'scan',description:'A biological instrument',swatch:'#c54925'},
  {id:'silverbolt',label:'Silverbolt',scheme:'dark',icon:'bolt',description:'Graphite · platinum',swatch:'#c4e0ef'},
  {id:'moonshine',label:'Moonshine',scheme:'light',icon:'moonshine',description:'Pearl · lilac · plum',swatch:'#bba0d0'},
];

export function normalizeTheme(value, legacy = null) {
  if (THEMES.some(theme => theme.id === value)) return value;
  if (value === null && legacy === 'light') return 'moonshine';
  return DEFAULT_THEME;
}

// The server head and browser share the same list: a saved palette paints first.
export const themeBootstrap = `(()=>{const ids=${inlineScriptJSON(THEMES.map(t=>t.id))};let v=null,l=null;try{v=localStorage.getItem('${THEME_KEY}');l=localStorage.getItem('kq-appearance-v1')}catch{}const t=ids.includes(v)?v:v===null&&l==='light'?'moonshine':'${DEFAULT_THEME}';const r=document.documentElement;r.dataset.theme=t;r.dataset.appearance=t;r.style.colorScheme=['futuristic','moonshine'].includes(t)?'light':'dark'})()`;

export function currentTheme() {
  return THEMES.find(theme => theme.id === document.documentElement.dataset.theme) || THEMES[0];
}

async function prepareThemeSnapshot(id) {
  const fonts=id==='black-metal'?[]:id==='futuristic'
    ?['400 14px "Space Grotesk"','400 11px "IBM Plex Mono"']
    :['400 14px "Manrope"','400 60px "Space Grotesk"','400 11px "IBM Plex Mono"',...(id==='silverbolt'?[]:['500 32px "Cormorant Garamond"','italic 500 32px "Cormorant Garamond"'])];
  const jobs=fonts.map(font=>document.fonts?.load(font));
  document.querySelectorAll('.theme-art img').forEach(img=>{if(typeof img.decode==='function')jobs.push(img.decode());});
  // Capture the new typography and artwork, with a bounded wait on slow connections.
  await Promise.race([Promise.allSettled(jobs),new Promise(resolve=>setTimeout(resolve,400))]);
}

// Equal-length polygons interpolate into an organic front and finish beyond every corner.
export function liquidThemeFrames(x, y, width, height) {
  const reach = Math.max(Math.hypot(x,y),Math.hypot(width-x,y),Math.hypot(x,height-y),Math.hypot(width-x,height-y)) + 40;
  return [
    {offset:0,radius:3,ripple:0,phase:0},
    {offset:.22,radius:reach*.23,ripple:.12,phase:.8},
    {offset:.52,radius:reach*.62,ripple:.075,phase:1.7},
    {offset:.8,radius:reach*1.08,ripple:.035,phase:2.5},
    {offset:1,radius:reach*1.2,ripple:0,phase:3},
  ].map(frame => ({
    offset:frame.offset,
    clipPath:'polygon('+Array.from({length:80},(_,i)=>{
      const angle=i/80*Math.PI*2;
      const radius=frame.radius*(1+frame.ripple*(Math.sin(angle*3+frame.phase)*.7+Math.sin(angle*5-frame.phase)*.3));
      return `${(x+Math.cos(angle)*radius).toFixed(2)}px ${(y+Math.sin(angle)*radius).toFixed(2)}px`;
    }).join(',')+')',
  }));
}

export function initializeAppearance() {
  const root = document.documentElement;
  const menu = document.querySelector('#appearance-control');
  const control = menu?.querySelector('summary');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transition = null;

  function apply(value, {persist=false,notify=true}={}) {
    const id = normalizeTheme(value);
    const theme = THEMES.find(item=>item.id===id);
    root.dataset.theme = id;
    root.dataset.appearance = id;
    root.style.colorScheme = theme.scheme;
    const label = document.querySelector('#appearance-label');
    if (label) label.textContent = theme.label;
    document.querySelectorAll('[data-theme-preference]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.themePreference===id));
    });
    const icon = document.querySelector(`[data-theme-preference="${id}"] svg`);
    const slot = document.querySelector('.current-theme-icon');
    if (icon && slot) slot.replaceChildren(icon.cloneNode(true));
    control?.setAttribute('aria-label',`Theme: ${theme.label}. Change theme`);
    if (persist) { try { localStorage.setItem(THEME_KEY,id); } catch { /* Selection also works when storage is blocked. */ } }
    if (notify) window.dispatchEvent(new CustomEvent('kq:theme-change',{detail:{theme:id}}));
    return theme;
  }

  async function select(value) {
    const id = normalizeTheme(value);
    if (menu) menu.open = false;
    control?.focus({preventScroll:true});
    if (id === currentTheme().id) return;
    transition?.skipTransition();
    const rect = control?.getBoundingClientRect();
    const x = rect ? rect.left+rect.width/2 : innerWidth/2;
    const y = rect ? rect.top+rect.height/2 : 25;
    let applied = false;
    const update = () => {
      applied = true;
      const theme=apply(id,{persist:true});
      const live=document.querySelector('#live');
      if(live) live.textContent=`${theme.label} theme selected.`;
    };
    if (reducedMotion.matches || typeof document.startViewTransition !== 'function') {
      update();
      if (!reducedMotion.matches) root.animate?.([{opacity:.86},{opacity:1}],{duration:240,easing:'ease-out'});
      return;
    }
    root.dataset.themeTransition='liquid';
    const next=document.startViewTransition(async()=>{update();await prepareThemeSnapshot(id);});
    transition=next;
    try {
      await next.ready;
      const animation=root.animate(liquidThemeFrames(x,y,innerWidth,innerHeight),{
        duration:760,easing:'cubic-bezier(.22,.75,.22,1)',fill:'both',pseudoElement:'::view-transition-new(root)',
      });
      await animation.finished.catch(()=>{});
      animation.cancel();
      await next.finished;
    } catch {
      next.skipTransition();
      if(!applied) update();
    } finally {
      if(transition===next) {transition=null;delete root.dataset.themeTransition;}
    }
  }

  apply(root.dataset.theme,{notify:false});
  document.addEventListener('click',event=>{
    const choice=event.target.closest('[data-theme-preference]');
    if(choice) { void select(choice.dataset.themePreference); }
    else if(menu && !menu.contains(event.target)) menu.open=false;
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && menu?.open) {menu.open=false;control?.focus();}
    if(menu?.open && ['ArrowDown','ArrowUp','Home','End'].includes(event.key) && menu.contains(event.target)) {
      const choices=Array.from(menu.querySelectorAll('[data-theme-preference]'));
      let index=choices.indexOf(document.activeElement);
      if(event.key==='Home')index=0;
      else if(event.key==='End')index=choices.length-1;
      else index=(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
      event.preventDefault();choices[index]?.focus();
    }
  });
  window.addEventListener('storage',event=>{
    if(event.key===THEME_KEY || event.key===null) {transition?.skipTransition();apply(event.newValue);}
  });
}
