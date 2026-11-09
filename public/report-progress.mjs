import {comparableHistory} from './assessment-history.mjs';
import {escapeHTML as esc} from './ui-components.mjs';

export function renderProgress(history,{sample=false,selected}={}) {
 const series=comparableHistory(history,sample).filter(item=>item.points.length>=2);
 if(!series.length)return '<div class="notice">Save results from the same assessment and method on two or more dates to compare them here.</div>';
 const current=series.find(item=>item.key===selected)||series[0];
 const {points,label,metric,unit,precision}=current;
 const first=points[0],last=points.at(-1);
 const low=Math.min(...points.map(point=>point.value)),high=Math.max(...points.map(point=>point.value));
 const padding=Math.max((high-low)*.15,10**-precision);
 const start=Date.parse(first.date),span=Date.parse(last.date)-start;
 const positions=points.map(point=>({
  x:32+(Date.parse(point.date)-start)/span*496,
  y:138-(point.value-low+padding)/(high-low+padding*2)*120,
 }));
 const values=points.map(point=>`<dt>${esc(point.date)}</dt><dd>${point.value.toFixed(precision)} ${esc(unit)}</dd>`).join('');
 const picker=series.length>1?`<label class="trend-filter">Assessment method<select id="trend-series">${series.map(item=>`<option value="${esc(item.key)}"${item===current?' selected':''}>${esc(item.label)} · ${esc(item.metric)}</option>`).join('')}</select></label>`:'';
 return `<section class="card trend">
  ${picker}<h3>${esc(metric)}</h3><p class="small muted">${esc(label)} · ${esc(unit)}</p>
  <svg viewBox="0 0 560 170" aria-hidden="true">
   <path d="M32 143H528M32 15V143" stroke="var(--line)" fill="none"/>
   <polyline points="${positions.map(({x,y})=>`${x},${y}`).join(' ')}" stroke="var(--accent)" stroke-width="2" fill="none"/>
   ${positions.map(({x,y})=>`<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`).join('')}
   <text x="32" y="164" fill="var(--muted)" font-size="13">${esc(first.date)}</text>
   <text x="528" y="164" text-anchor="end" fill="var(--muted)" font-size="13">${esc(last.date)}</text>
  </svg>
  <details><summary>View dated results</summary><dl class="trend-values">${values}</dl></details>
  <p class="small muted">Collection conditions, health and measurement variation can affect the comparison. Clinical PhenoAge uses blood draw dates. Other comparisons use saved dates.</p>
 </section>`;
}
