import { PROJECTS, ZONES, FILTERS, CONTACT, STACK_LABEL, label, matches, tileUrl } from './data.js';
import { WorkGrid, hasWebGL2 } from './grid.js';
import * as pages from './pages.js';
import { sound } from './sound.js';
import { loaderIntro } from './loader.js';
import { applySeo } from './seo.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const body = document.body;
const pageEl = $('#page');

// ------------------------------------------------------------------ state
const state = {
  view: 'grid',
  filters: { zones: [], features: [], stack: [], clients: [] },
  route: null,
  lastNonContact: '/',
};
const filtered = () => PROJECTS.filter((p) => matches(p, state.filters));
const filterCount = () => Object.values(state.filters).reduce((n, a) => n + a.length, 0);

// ------------------------------------------------------------------ toggles (sliding highlight)
function syncToggle(root) {
  const hl = $('.hl', root); if (!hl) return;
  const active = $$(':scope > a, :scope > button', root).find((el) => el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-pressed') === 'true');
  if (!active) { hl.style.opacity = '0'; return; }
  hl.style.opacity = '1';
  const vertical = getComputedStyle(root).gridAutoFlow.startsWith('row');
  if (vertical) { hl.style.translate = `0 ${active.offsetTop - 4}px`; hl.style.width = ''; }
  else { hl.style.width = active.offsetWidth + 'px'; hl.style.translate = `${active.offsetLeft - 5}px 0`; }
}
const syncAllToggles = () => $$('.toggle').forEach(syncToggle);
addEventListener('resize', syncAllToggles);

// ------------------------------------------------------------------ grid
let grid = null;
const stage = $('#stage');
async function initGrid() {
  if (!hasWebGL2()) { setView('list'); return null; }
  grid = new WorkGrid(stage, {
    projects: PROJECTS, tileUrl, reduced,
    onOpen: (p) => { sound.play('project'); navigate(`/projects/${p.slug}`); },
    onHover: (p) => { if (p) { sound.play('grid', 0.35); if (grid?.keyboard) $('#live').textContent = `${p.title}, ${p.type}. Press Enter to open.`; } },
  });
  stage.addEventListener('grid:dragstart', () => sound.play('swipe', 0.5));
  await grid.load();
  return grid;
}

// ------------------------------------------------------------------ list view
function renderList() {
  const list = filtered();
  $('#lv-count').textContent = `${list.length} project${list.length === 1 ? '' : 's'}`;
  const years = [...new Set(list.map((p) => p.year))].sort((a, b) => b - a);
  $('#lv-groups').innerHTML = years.length ? years.map((y) => `
    <div class="lv-group"><p>${y}</p><ul>${list.filter((p) => p.year === y).map((p, i) => `
      <li class="lv-row" style="--i:${i}">
        <a class="lv-link" href="/projects/${p.slug}" data-link>
          <div><h3>${esc(p.title)}</h3><p class="sr-only">${esc(p.statement)}</p></div>
          <div class="lv-meta"><ul class="pills mono"><li class="pill pill--zone">${ZONES[p.zone].name}</li>${p.features.slice(0, 3).map((f) => `<li class="pill">${esc(label(f))}</li>`).join('')}</ul><span class="lv-client">${esc(p.client)}</span></div>
        </a>
      </li>`).join('')}</ul></div>`).join('')
    : `<p class="lv-empty">Nothing matches those filters. <button class="mono" type="button" data-clear style="text-decoration:underline">Clear filters</button></p>`;
  $('#lv-groups').insertAdjacentHTML('beforeend', `<p class="lv-foot mono">A recreation of the Phantom Studios site, built by FF Dev Studio with its own work. Not affiliated.</p>`);
}

function setView(v, push = true) {
  state.view = v;
  const lv = $('#listview');
  lv.classList.toggle('is-open', v === 'list');
  lv.inert = v !== 'list';
  $$('#viewtoggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  syncToggle($('#viewtoggle'));
  if (grid) grid.active = v === 'grid' && state.route?.name === 'home' && $('#filter').hidden;
  if (push) syncQuery();
}
$$('#viewtoggle button').forEach((b) => b.addEventListener('click', () => { sound.play('click'); setView(b.dataset.view); }));

// ------------------------------------------------------------------ filter
const groups = { zones: '#f-zones', features: '#f-features', stack: '#f-stack', clients: '#f-clients' };
function renderFilter() {
  const z = state.filters.zones;
  $('#f-zones').innerHTML = [`<button type="button" data-g="zones" data-v="" aria-pressed="${z.length === 0}">All</button>`,
    ...FILTERS.zones.map((k) => `<button type="button" data-g="zones" data-v="${k}" aria-pressed="${z.includes(k)}">${ZONES[k].name}</button>`)]
    .join(' ').replace(/<\/button> <button type="button" data-g="zones" data-v="(?!client)/g, '</button><span class="sep">,</span> <button type="button" data-g="zones" data-v="');
  for (const g of ['features', 'stack', 'clients']) {
    $(groups[g]).innerHTML = FILTERS[g].map((k) => `<li><button type="button" data-g="${g}" data-v="${esc(k)}" aria-pressed="${state.filters[g].includes(k)}">${esc(g === 'stack' ? label(k, STACK_LABEL) : g === 'clients' ? k : label(k))}</button></li>`).join('');
  }
  const n = filterCount();
  $('#filterbtn p').innerHTML = $('#filter').hidden ? `Filter${n ? `<span class="count">${n}</span>` : ''}` : 'Close';
}
$('#filter').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-g]'); if (!b) return;
  const { g, v } = b.dataset; sound.play('click');
  if (g === 'zones') state.filters.zones = v ? (state.filters.zones.includes(v) ? [] : [v]) : [];
  else { const a = state.filters[g]; state.filters[g] = a.includes(v) ? a.filter((x) => x !== v) : [...a, v]; }
  applyFilters();
});
$('#f-reset').addEventListener('click', () => { clearFilters(); sound.play('click'); });
function clearFilters() { for (const k in state.filters) state.filters[k] = []; applyFilters(); }
document.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) clearFilters(); });
function applyFilters(push = true) {
  renderFilter(); renderList();
  grid?.setProjects(filtered());
  if (push) syncQuery();
}
function setFilterOpen(open) {
  $('#filter').hidden = !open;
  $('#filterbtn').setAttribute('aria-expanded', String(open));
  if (grid) grid.active = !open && state.view === 'grid' && state.route?.name === 'home';
  renderFilter();
  if (open) $('#f-zones button')?.focus({ preventScroll: true });
}
$('#filterbtn').addEventListener('click', () => { sound.play(open() ? 'other' : 'whoosh', 0.6); setFilterOpen(!open()); });
const open = () => !$('#filter').hidden;
$('#filter').addEventListener('pointerdown', (e) => { if (e.target === $('#filter')) setFilterOpen(false); });

// query string mirrors view + filters so a filtered view can be linked (/?zone=study&feature=webgl&view=list)
function syncQuery() {
  if (state.route?.name !== 'home' || location.pathname !== '/') return;
  const q = new URLSearchParams();
  if (state.view === 'list') q.set('view', 'list');
  state.filters.zones.forEach((v) => q.append('zone', v));
  state.filters.features.forEach((v) => q.append('feature', v));
  state.filters.stack.forEach((v) => q.append('stack', v));
  state.filters.clients.forEach((v) => q.append('client', v));
  const url = '/' + (q.toString() ? '?' + q : '');
  if (url !== location.pathname + location.search) history.replaceState(history.state, '', url);
}
function readQuery() {
  const q = new URLSearchParams(location.search);
  const keep = (vals, allowed) => vals.filter((v) => allowed.includes(v));
  state.filters = {
    zones: keep(q.getAll('zone'), FILTERS.zones).slice(0, 1),
    features: keep(q.getAll('feature'), FILTERS.features),
    stack: keep(q.getAll('stack'), FILTERS.stack),
    clients: keep(q.getAll('client'), FILTERS.clients),
  };
  return q.get('view') === 'list' ? 'list' : 'grid';
}

// ------------------------------------------------------------------ router
function match(path) {
  if (path === '/' || path === '/index.html') return { name: 'home' };
  let m;
  if ((m = path.match(/^\/projects\/([\w-]+)\/?$/))) return { name: 'project', slug: m[1] };
  if (path === '/about' || path === '/about/') return { name: 'about', tab: 'studio' };
  if (path === '/about/approach') return { name: 'about', tab: 'approach' };
  if (path === '/pricing' || path === '/pricing/') return { name: 'pricing' };
  if (path === '/contact' || path === '/contact/') return { name: 'contact' };
  return { name: '404' };
}

let revealObs;
function wireReveals() {
  revealObs?.disconnect();
  revealObs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal', pageEl).forEach((el) => revealObs.observe(el));
}

async function render(first = false, forcePath = null) {
  const r = match(forcePath || location.pathname);
  if (r.name === 'contact') {
    // the contact page is an overlay on whatever was underneath (home, on a cold load)
    if (!state.route) await render(first, '/');
    applySeo(r);
    openContact();
    return;
  }
  closeContact(false);
  const same = state.route && state.route.name === r.name && state.route.slug === r.slug && state.route.tab === r.tab;
  state.route = r;
  const page = r.name === 'home' ? pages.homeSeo() : r.name === 'project' ? pages.project(r.slug) : r.name === 'about' ? pages.about(r.tab) : r.name === 'pricing' ? pages.pricing() : pages.notFound();
  if (r.name === 'project' && page.status === 404) r.name = '404';
  applySeo(r);
  body.dataset.theme = page.theme;
  body.dataset.route = r.name;
  $('meta[name="theme-color"]').content = page.theme === 'light' ? '#f3efe4' : r.name === 'about' ? '#242421' : '#000000';
  $('.logo-client').textContent = page.client && page.client !== 'FF Dev Studio' ? page.client : '';
  $$('#navtoggle a').forEach((a) => a.toggleAttribute('aria-current', false));
  const nav = { home: 'home', project: 'home', about: 'about', pricing: 'pricing' }[r.name];
  if (nav) $(`#navtoggle a[data-nav="${nav}"]`).setAttribute('aria-current', 'page');
  syncToggle($('#navtoggle'));

  if (!same) {
    if (!first && !reduced) { pageEl.classList.add('is-leaving'); await new Promise((res) => setTimeout(res, 300)); }
    pageEl.innerHTML = page.html;
    pageEl.classList.remove('is-leaving');
    if (!first && r.name !== 'home') { pageEl.classList.add('is-entering'); setTimeout(() => pageEl.classList.remove('is-entering'), 1000); }
    window.scrollTo(0, 0);
    wireReveals();
    syncAllToggles();
    if (!first) pageEl.focus({ preventScroll: true });
  }
  if (r.name === 'home') {
    const v = readQuery(); renderFilter(); renderList(); grid?.setProjects(filtered());
    setView(v, false);
    grid?.setActive(state.view === 'grid' && !open());
  } else {
    setFilterOpen(false);
    setView('grid', false);
    grid?.setActive(false);
  }
  if (!forcePath) state.lastNonContact = location.pathname + location.search;
}

function navigate(url, { replace = false } = {}) {
  if (url === location.pathname + location.search) return;
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  render();
}
addEventListener('popstate', () => render());
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin) return;
  e.preventDefault();
  sound.play('click');
  if (u.pathname === '/contact') { history.pushState({}, '', '/contact'); applySeo({ name: 'contact' }); openContact(); return; }
  navigate(u.pathname + u.search);
});

// about page toggle (Studio / Approach) — routes, so each tab is linkable
pageEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-about-toggle] button'); if (!b) return;
  sound.play('click');
  navigate(b.dataset.tab === 'approach' ? '/about/approach' : '/about');
});

// keyboard: Tab walks the grid on home when nothing else has focus, Escape closes overlays
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#contact').hidden) { e.preventDefault(); leaveContact(); return; }
    if (open()) { setFilterOpen(false); $('#filterbtn').focus(); return; }
    if (state.view === 'list' && state.route?.name === 'home') setView('grid');
  }
});

// ------------------------------------------------------------------ contact overlay
const ARROW = '<svg viewBox="0 0 12 12"><path d="M1 6h10M6.5 1.5 11 6l-4.5 4.5"/></svg>';
const KICKOFF = ['We’d like to get to know each other.', 'We have some ideas floating around.', 'We have something specific in mind.'];
const WORK = ['Landing page', 'Brand website', 'E-commerce', 'Portfolio', 'Campaign', 'Booking', 'CMS', 'Motion', '3D', 'WebGL', 'SEO', 'Care plan'];
function contactHome() {
  return `
  <div class="c-inner">
    <p class="mono label-dot">Let’s talk</p>
    <h2 id="contact-title">Welcome! It’s great to meet you.</h2>
    <div class="c-cards">
      <button class="c-card" type="button" data-c="form"><div><p class="mono label-dot">Start a project</p><p class="t">I’m interested in working together.</p></div><span class="go" aria-hidden="true">${ARROW}</span></button>
      <a class="c-card" href="/pricing" data-link><div><p class="mono label-dot">Pricing</p><p class="t">I’d like to know what it costs first.</p></div><span class="go" aria-hidden="true">${ARROW}</span></a>
      <div class="c-card"><div><p class="mono label-dot">Anything else</p><p class="t">Just saying hi.</p></div>
        <div class="chips"><a class="chip" href="mailto:${CONTACT.email}"><span>Email</span><span>${CONTACT.email}</span></a><a class="chip" href="${CONTACT.wa}" target="_blank" rel="noopener"><span>WhatsApp</span><span>${esc(CONTACT.whatsapp)}</span></a></div></div>
    </div>
    <p class="c-privacy">FF Dev Studio sets no cookies and runs no analytics on this site. Whatever you send goes to ${CONTACT.email} and nowhere else.</p>
  </div>`;
}
function contactForm() {
  return `
  <div class="c-inner">
    <button class="c-back mono" type="button" data-c="home">← Back</button>
    <p class="mono label-dot">Start a project</p>
    <h2 id="contact-title">Tell me about it.</h2>
    <form class="c-form" novalidate>
      <div class="q"><span class="mono">01</span><fieldset><legend>How shall we kick things off?</legend><div class="opts">${KICKOFF.map((t, i) => `<label class="opt"><input type="radio" name="kickoff" value="${esc(t)}" ${i === 0 ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset></div>
      <div class="q"><span class="mono">02</span><div><label class="l" for="f-name">Full name*</label><input id="f-name" name="name" type="text" autocomplete="name" required><p class="err" data-for="name"></p></div></div>
      <div class="q"><span class="mono">03</span><div><label class="l" for="f-email">Email address*</label><input id="f-email" name="email" type="email" autocomplete="email" required><p class="err" data-for="email"></p></div></div>
      <div class="q"><span class="mono">04</span><div><label class="l" for="f-company">Company*</label><input id="f-company" name="company" type="text" autocomplete="organization" required><p class="err" data-for="company"></p></div></div>
      <div class="q"><span class="mono">05</span><div><label class="l" for="f-note">Drop a note — what should the site do for you?</label><textarea id="f-note" name="note"></textarea></div></div>
      <div class="q"><span class="mono">06</span><div><label class="l" for="f-refs">Any links or references you like? One per line.</label><textarea id="f-refs" name="refs" placeholder="https://"></textarea></div></div>
      <div class="q"><span class="mono">07</span><fieldset><legend>If there are specific kinds of work you have in mind, select them here.</legend><div class="opts opts--small">${WORK.map((t) => `<label class="opt"><input type="checkbox" name="work" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('')}</div></fieldset></div>
      <button class="c-submit" type="submit">Submit</button>
    </form>
  </div>`;
}
function contactDone(d) {
  const lines = [`${d.kickoff}`, '', `Name: ${d.name}`, `Email: ${d.email}`, `Company: ${d.company}`];
  if (d.work.length) lines.push(`Interested in: ${d.work.join(', ')}`);
  if (d.note) lines.push('', d.note);
  if (d.refs) lines.push('', 'References:', d.refs);
  const text = lines.join('\n');
  const mail = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`New project — ${d.company}`)}&body=${encodeURIComponent(text)}`;
  const wa = `${CONTACT.wa}?text=${encodeURIComponent(text)}`;
  return `
  <div class="c-inner">
    <p class="mono label-dot">Complete</p>
    <div class="c-done">
      <h2 id="contact-title">Nice one!</h2>
      <p>Thank you for sharing. Your brief is ready — send it whichever way suits you and it lands with the person who will build it.</p>
      <p style="opacity:.6">Nothing has been sent yet. This site has no server of its own, so the message goes from your email or WhatsApp, where you can read it first.</p>
      <div class="row"><a href="${mail}">Send by email</a><a href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a><button type="button" data-c="finish">Finish</button></div>
    </div>
  </div>`;
}
const CLOSE = '<button class="c-close" type="button" data-c="close" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M2 2l12 12M14 2 2 14"/></svg></button>';
let returnFocus = null;
function openContact(view = 'home') {
  const c = $('#contact');
  if (c.hidden) { returnFocus = document.activeElement; sound.play('whoosh', 0.6); }
  c.innerHTML = CLOSE + (view === 'form' ? contactForm() : contactHome());
  c.hidden = false; body.classList.add('overlay-open');
  if (grid) grid.active = false;
  c.scrollTop = 0;
  ($('[data-c="form"]', c) || $('input, button:not(.c-close)', c))?.focus({ preventScroll: true });
}
function closeContact(restore = true) {
  const c = $('#contact'); if (c.hidden) return;
  c.hidden = true; c.innerHTML = ''; body.classList.remove('overlay-open');
  if (grid && state.route?.name === 'home') grid.active = state.view === 'grid' && !open();
  if (restore) returnFocus?.focus?.({ preventScroll: true });
}
function leaveContact() {
  closeContact();
  if (location.pathname === '/contact') { history.pushState({}, '', state.lastNonContact || '/'); if (state.route) applySeo(state.route); }
}
$('#contact').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]'); if (!b) return;
  sound.play('click');
  const c = b.dataset.c;
  if (c === 'close' || c === 'finish') leaveContact();
  else openContact(c);
});
$('#contact').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target; const fd = new FormData(f);
  const d = { kickoff: fd.get('kickoff'), name: String(fd.get('name') || '').trim(), email: String(fd.get('email') || '').trim(), company: String(fd.get('company') || '').trim(), note: String(fd.get('note') || '').trim(), refs: String(fd.get('refs') || '').trim(), work: fd.getAll('work') };
  const errs = {};
  if (!d.name) errs.name = 'Please add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Please add an email address that works.';
  if (!d.company) errs.company = 'Please add a company — your own name is fine.';
  $$('.err', f).forEach((p) => { p.textContent = errs[p.dataset.for] || ''; });
  $$('input[name="name"], input[name="email"], input[name="company"]', f).forEach((i) => i.setAttribute('aria-invalid', String(!!errs[i.name])));
  const first = Object.keys(errs)[0];
  if (first) { $(`[name="${first}"]`, f).focus(); sound.play('other', 0.5); return; }
  sound.play('project');
  $('#contact').innerHTML = CLOSE + contactDone(d);
  $('#contact').scrollTop = 0;
  $('#contact h2').setAttribute('tabindex', '-1'); $('#contact h2').focus();
});
// focus trap inside the dialog
$('#contact').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = $$('a[href], button, input, textarea', $('#contact')).filter((el) => !el.disabled && el.offsetParent !== null);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});

// ------------------------------------------------------------------ header: sound + clocks
$('.sound-dots').innerHTML = '<i></i>'.repeat(24);
$$('.sound-dots i').forEach((i, k) => { i.style.animationDelay = `${(k % 8) * 0.11 + Math.floor(k / 8) * 0.07}s`; });
$('#sound').addEventListener('click', () => {
  const on = !sound.enabled; sound.setEnabled(on);
  $('#sound').setAttribute('aria-pressed', String(on));
  $('#sound b').textContent = on ? 'On' : 'Off';
  if (on) sound.play('click');
});
function fmt(tz) {
  const d = new Date();
  const t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d);
  const off = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || '';
  return `${t} ${off.replace('GMT', 'GMT').replace(/^UTC/, 'GMT')}`;
}
function tick() {
  $('#clock-kl').textContent = fmt(CONTACT.tz);
  $('#clock-you').textContent = fmt(Intl.DateTimeFormat().resolvedOptions().timeZone);
}
tick(); setInterval(tick, 10000);

// ------------------------------------------------------------------ boot
(async function boot() {
  const first = location.pathname;
  const isHome = match(first).name === 'home';
  // inner pages run the same intro, faster: they only wait for the fonts
  const intro = loaderIntro({ reduced, titles: PROJECTS.map((p) => p.title), quick: !isHome });
  await render(true);
  intro.progress(0.1);
  let creep = 0.1;
  const creeper = setInterval(() => { creep = Math.min(0.85, creep + 0.035); intro.progress(creep); }, 120);
  const fonts = document.fonts.ready;
  const T = (window.__ffTimings = { start: Math.round(performance.now()) });
  const g = initGrid().then((x) => { T.gridReady = Math.round(performance.now()); return x; }).catch((err) => { console.error(err); setView('list'); return null; });
  fonts.then(() => { T.fonts = Math.round(performance.now()); intro.progress(0.4); });
  // only the home page waits for the grid (capped); inner pages need nothing but the fonts
  const cap = new Promise((r) => setTimeout(r, isHome ? 9000 : 1200));
  await Promise.race([Promise.all([fonts, isHome ? g : fonts]), cap]);
  clearInterval(creeper);
  sound.play('load', 0.5);
  await intro.finish(() => {
    T.loaderDone = Math.round(performance.now());
    syncAllToggles();
    g.then(() => {
      if (!grid) return;
      grid.setProjects(filtered());
      const onHome = state.route.name === 'home';
      grid.active = onHome && state.view === 'grid' && !open() && $('#contact').hidden;
      if (onHome) grid.intro(); else { grid.setLens(-0.07, true); grid.setActive(false); }
    });
  });
  window.__ff = { grid, state };
})();
