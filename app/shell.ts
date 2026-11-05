import {THEMES} from '../public/theme-system.mjs';
import {icon} from '../public/icons.mjs';
const brand = `<button class="brand" data-action="home" aria-label="KoleQuant Age home"><img src="/assets/kolequant-mark.webp" width="19" height="28" alt=""/><span>KoleQuant <em>AGE</em></span></button>`;
const accountDestination = `<button class="workspace-link" data-action="account" data-route="settings">${icon('person')}<span>Account</span></button>`;
const destinations = `<button class="workspace-link" data-action="home" data-route="home">${icon('home')}<span>Overview</span></button><button class="workspace-link" data-action="account-area" data-tab="history" data-route="history">${icon('history')}<span>Assessments</span></button><button class="workspace-link" data-action="account-area" data-tab="reports" data-route="reports">${icon('report')}<span>Reports</span></button>`;
export const shell = `
<a class="skip" href="#main">Skip to content</a>
<div class="app-frame">
  <aside class="app-sidebar" aria-label="Workspace sidebar">
    ${brand}
    <span class="rail-label">WORKSPACE</span>
    <nav class="sidebar-nav" aria-label="Workspace navigation">${destinations}${accountDestination}<button class="workspace-link" data-action="consult" data-route="consult">${icon('consult')}<span>Consultation</span></button></nav>
    <div class="sidebar-bottom"><button class="workspace-link" data-action="method">${icon('science')}<span>The science</span></button></div>
  </aside>
  <div class="workspace-body">
    <header class="header">
      <div class="mobile-brand">${brand}</div>
      <div class="workspace-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong id="workspace-current">Overview</strong></div>
      <nav class="header-actions" id="account-actions" aria-label="Account and appearance">
        <details class="appearance-control" id="appearance-control">
          <summary aria-label="Theme: Black Metal. Change theme"><span class="current-theme-icon">${icon('diamond')}</span><span id="appearance-label">Black Metal</span><span class="theme-chevron" aria-hidden="true">${icon('down')}</span></summary>
          <div class="appearance-menu" role="group" aria-label="Choose a theme">${THEMES.map(theme=>`<button type="button" data-theme-preference="${theme.id}" aria-pressed="${theme.id==='black-metal'}"><span class="theme-choice-symbol" aria-hidden="true">${icon(theme.icon)}</span><span>${theme.label}</span><span class="theme-check" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div>
        </details>
        <button id="account-nav" class="nav-link account-nav" data-action="account" aria-label="Account">${icon('person')}</button>
      </nav>
    </header>
    <nav class="mobile-nav" aria-label="Main navigation">${destinations}${accountDestination}</nav>
    <main id="main" tabindex="-1"></main>

  </div>
</div>
<div id="modal-root"></div><div class="sr-only" id="live" aria-live="polite"></div>`;
