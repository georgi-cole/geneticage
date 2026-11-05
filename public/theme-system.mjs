import {captureThemeElements,animateThemeElements,settleThemeElements} from './theme-motion.mjs';

export const THEME_KEY = 'kq-theme-v2';
export const DEFAULT_THEME = 'black-metal';
export const THEMES = [
  {id:'black-metal',label:'Black Metal',scheme:'dark',icon:'diamond'},
  {id:'blood-moon',label:'Blood Moon',scheme:'dark',icon:'eclipse'},
  {id:'bionic',label:'Bionic',scheme:'light',icon:'bionic'},
];

export function normalizeTheme(value) {
  if (value === 'futuristic') return 'bionic';
  if (THEMES.some(theme => theme.id === value)) return value;
  return DEFAULT_THEME;
}

// The server head and browser share the same list: a saved palette paints first.
export const themeBootstrap = `(()=>{const themes=${JSON.stringify(THEMES.map(({id,scheme})=>({id,scheme})))};let v=null;try{v=localStorage.getItem('${THEME_KEY}')}catch{}if(v==='futuristic')v='bionic';const t=themes.find(t=>t.id===v)||themes[0];const r=document.documentElement;r.dataset.theme=t.id;r.dataset.appearance=t.id;r.style.colorScheme=t.scheme})()`;

export function currentTheme() {
  return THEMES.find(theme => theme.id === document.documentElement.dataset.theme) || THEMES[0];
}

async function prepareThemeSnapshot(id){
 const jobs=[document.fonts?.ready];
 document.querySelectorAll('[data-theme-asset="'+id+'"]').forEach(img=>{if(typeof img.decode==='function')jobs.push(img.decode());});
 await Promise.race([Promise.allSettled(jobs),new Promise(resolve=>setTimeout(resolve,400))]);
}

export function initializeAppearance() {
  const root = document.documentElement;
  const menu = document.querySelector('#appearance-control');
  const control = menu?.querySelector('summary');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transition = null;
  let selection=Promise.resolve(),revision=0;

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

  async function morph(id,{persist,motion,announce}) {
    let applied = false;
    const update = () => {
      applied = true;
      const theme=apply(id,{persist});
      const live=document.querySelector('#live');
      if(live && announce) live.textContent=`${theme.label} theme selected.`;
    };
    if (!motion || reducedMotion.matches || typeof document.startViewTransition !== 'function') {
      update();
      if(motion && !reducedMotion.matches)await settleThemeElements();
      return;
    }
    root.dataset.themeTransition='elements';
    const before=captureThemeElements();
    let after,next,deadline;
    try {
      next=document.startViewTransition(async()=>{
        update();await prepareThemeSnapshot(id);after=captureThemeElements();
      });
      transition=next;
      // A backgrounded or heavily throttled renderer must never hold the UI open.
      deadline=setTimeout(()=>next.skipTransition(),1800);
      await next.ready;
      await animateThemeElements(root,before,after,next.finished);
      await next.finished;
    } catch {
      next?.skipTransition();
      await next?.finished.catch(()=>{});
      if(!applied) update();
    } finally {
      clearTimeout(deadline);
      after?.cleanup();before.cleanup();
      if(!next || transition===next) {transition=null;delete root.dataset.themeTransition;}
    }
  }

  function select(value,{persist=true,motion=true,announce=true}={}) {
    const id=normalizeTheme(value),ticket=++revision;
    if(menu)menu.open=false;
    if(announce)control?.focus({preventScroll:true});
    transition?.skipTransition();
    // Finish the previous update callback before applying the latest requested theme.
    selection=selection.catch(()=>{}).then(async()=>{
      if(ticket!==revision)return;
      if(id!==currentTheme().id)await morph(id,{persist,motion,announce});
      if(ticket===revision)window.dispatchEvent(new CustomEvent('kq:theme-settled',{detail:{theme:id}}));
    });
    return selection;
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
      else if(index<0)index=event.key==='ArrowDown'?0:choices.length-1;
      else index=(index+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
      event.preventDefault();choices[index]?.focus();
    }
  });
  window.addEventListener('storage',event=>{
    if(event.key===THEME_KEY || event.key===null) {void select(event.newValue,{persist:false,motion:false,announce:false});}
  });
  // Orientation and keyboard changes invalidate snapshot bounds. Release the
  // paint layer immediately rather than stretching a stale captured surface.
  window.addEventListener('resize',()=>transition?.skipTransition(),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)transition?.skipTransition();});
}
