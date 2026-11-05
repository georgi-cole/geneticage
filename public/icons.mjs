// KoleQuant / Paired v2. Recognizable continuous silhouettes first.
// Pairing and sequence cues stay in the methods/readout details, without cut outlines.
export const iconPaths=Object.freeze({
  home:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  history:'<path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 12h8M8 16h8"/>',
  report:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  person:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pulse:'<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  drop:'<path d="M12 3C10 7 5 10 5 15a7 7 0 0 0 14 0c0-5-5-8-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  consult:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M7 9h9M7 13h6"/>',
  science:'<path d="M7 3c0 6 10 12 10 18M17 3c0 6-10 12-10 18M8 6h8M10 9h4M10 15h4M8 18h8"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  diamond:'<path d="m12 3 9 7-9 11L3 10Z"/><path d="M3 10h18M8 6l4 15 4-15"/>',
  eclipse:'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
  bionic:'<circle cx="7" cy="7" r="4"/><circle cx="17" cy="17" r="4"/><path d="m10 10 4 4"/>',
  forward:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  reset:'<path d="M4 5v5h5M4.5 9a8 8 0 1 1-.2 6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  spark:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
});

export function icon(name){
 let shape=iconPaths[name],transform='';
 if(name==='arrow')shape=iconPaths.forward;
 if(name==='back'){shape=iconPaths.forward;transform='translate(24 0) scale(-1 1)';}
 if(name==='external'){shape=iconPaths.forward;transform='rotate(-45 12 12)';}
 if(name==='down')shape='<path d="m6 9 6 6 6-6"/>';
 if(!shape)throw new Error('Unknown KoleQuant icon: '+name);
 return `<svg class="kq-icon" data-kq-icon="${name}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${transform?`<g transform="${transform}">${shape}</g>`:shape}</svg>`;
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
