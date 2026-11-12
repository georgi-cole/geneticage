// KoleQuant / Paired v3. Four cells, paired read tracks, an evidence folio,
// and a membrane profile. Continuous silhouettes, with no attached DNA badges.
export const iconPaths=Object.freeze({
  metabolic:'<path d="m12 3 7.5 4.5v9L12 21l-7.5-4.5v-9L12 3Zm0 5v8m-4-4h8"/>',
  kidney:'<path d="M9.5 5C6.5 2.5 2.8 6 3 11c.1 4.4 2.6 7.8 5.6 6.1 2.2-1.2.4-3.5 2-5.2m3.9-6.9C17.5 2.5 21.2 6 21 11c-.1 4.4-2.6 7.8-5.6 6.1-2.2-1.2-.4-3.5-2-5.2M10.6 11.9c.8 1.7 1.4 4.8 1.4 8.1m1.4-8.1c-.8 1.7-1.4 4.8-1.4 8.1"/>',
  fitness:'<path d="M4 16a8 8 0 0 1 16 0M4 16h3m10 0h3M12 8v2m-5.7 1.1 1.5 1.3m9.9-1.3-1.5 1.3M12 16l3-3"/><circle cx="12" cy="16" r="1.25"/>',
  home:'<path d="M11 3H7a4 4 0 0 0-4 4v4h4a4 4 0 0 0 4-4ZM13 3h4a4 4 0 0 1 4 4v4h-4a4 4 0 0 1-4-4ZM3 13v4a4 4 0 0 0 4 4h4v-4a4 4 0 0 0-4-4ZM13 21h4a4 4 0 0 0 4-4v-4h-4a4 4 0 0 0-4 4Z"/>',
  history:'<path d="M7 3c0 6 10 12 10 18M17 3c0 6-10 12-10 18M7 3h10M7 21h10M8 6h8M10 9h4M10 15h4M8 18h8"/>',
  report:'<path d="M12 5.5C9 3.4 5.6 3.1 3 4.4v15c2.8-1.2 6.2-.8 9 1.1 2.8-1.9 6.2-2.3 9-1.1v-15c-2.6-1.3-6-1-9 1.1ZM12 5.5v15M6.5 9c1.1 0 2.1.3 3 .8M14.5 9.8c.9-.5 1.9-.8 3-.8M6.5 13c1.1 0 2.1.3 3 .8M14.5 13.8c.9-.5 1.9-.8 3-.8"/>',
  person:'<circle cx="12" cy="7" r="3.25"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8c-4.5-2-11.5-2-16 0Z"/>',
  pulse:'<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  drop:'<path d="M12 3C10 7 5 10 5 15a7 7 0 0 0 14 0c0-5-5-8-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  consult:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M7 9h9M7 13h6"/>',
  science:'<path d="M7 3c0 6 10 12 10 18M17 3c0 6-10 12-10 18M8 6h8M10 9h4M10 15h4M8 18h8"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  diamond:'<path d="m12 3 9 7-9 11L3 10Z"/><path d="M3 10h18M8 6l4 15 4-15"/>',
  eclipse:'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
  bionic:'<circle cx="7" cy="7" r="4"/><circle cx="17" cy="17" r="4"/><path d="m10 10 4 4"/>',
  forward:'<path d="M3 10.5c3 0 3 1.5 6 1.5h11.5M3 13.5c3 0 3-1.5 6-1.5m5.5-5.5 6 5.5-6 5.5"/>',
  reset:'<path d="M4 5v5h5M4.5 9a8 8 0 1 1-.2 6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  remove:'<path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3M10 10v6m4-6v6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  'status-complete':'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5 5-5"/>',
  'status-partial':'<circle cx="12" cy="12" r="9"/><path d="M12 6a6 6 0 0 1 0 12Z" fill="currentColor" stroke="none"/>',
  'status-incomplete':'<circle cx="12" cy="12" r="9"/>',
  spark:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
});

export function icon(name){
 let shape=iconPaths[name],transform='';
 if(name==='arrow')shape=iconPaths.forward;
 if(name==='back'){shape=iconPaths.forward;transform='translate(24 0) scale(-1 1)';}
 if(name==='external'){shape=iconPaths.forward;transform='rotate(-45 12 12)';}
 if(name==='down')shape='<path d="m6 9 6 6 6-6"/>';
 if(!shape)throw new Error('Unknown KoleQuant icon: '+name);
 return `<svg class="kq-icon" data-kq-icon="${name}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${transform?`<g transform="${transform}">${shape}</g>`:shape}</svg>`;
}

// Legacy action strings share the same vector arrows as newly composed controls.
// Only directional glyphs in buttons/links are replaced; content and labels stay text.
export function decorateDirectionalSymbols(root){
 if(!root)return;
 const controls=root.matches?.('button,a')?[root]:[...root.querySelectorAll('button,a')];
 const glyphs={'→':'forward','←':'back','↗':'external','×':'close'};
 for(const control of controls){
  const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT),nodes=[];let node;
  while((node=walker.nextNode()))if(/[→←↗×]/.test(node.textContent)&&!node.parentElement.closest('svg'))nodes.push(node);
  for(const text of nodes){
   const fragment=document.createDocumentFragment();
   for(const part of text.textContent.split(/([→←↗×])/)){if(glyphs[part]){const template=document.createElement('template');template.innerHTML=icon(glyphs[part]);fragment.append(template.content);}else if(part)fragment.append(document.createTextNode(part));}
   const parent=text.parentElement;if(parent.tagName==='SPAN'&&parent.getAttribute('aria-hidden')==='true')parent.classList.add('action-symbol');
   text.replaceWith(fragment);control.classList.add('has-action-symbol');
  }
 }
}
