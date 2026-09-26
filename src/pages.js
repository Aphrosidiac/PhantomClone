// Page templates. Each returns { html, theme }; titles and meta live in seo.js.
import { PRIVACY, STORAGE, LEGAL_UPDATED } from './legal.js';
import { PROJECTS, ZONES, PRICING, CONTACT, FAQ, bySlug, tileUrl, media, label, STACK_LABEL } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MARK = '<svg viewBox="0 0 194 72" aria-hidden="true"><path d="M0 72 16 0h14L14 72Z"/><path d="M24 72 40 0h14L38 72Z"/><path d="M72 0h54v15H88v13h32v14H88v30H72Z"/><path d="M140 0h54v15h-38v13h32v14h-32v30h-16Z"/></svg>';
// one captured shot, framed on the project's plate: desktop frames in a browser window (with the address
// it shows), phones inset with rounded corners. Two widths; the browser picks by rendered size.
const SIZES = { full: 'calc((100vw - 2 * var(--margin)) * .82)', pair: '(max-width: 700px) 86vw, 38vw', trio: '(max-width: 700px) 50vw, 24vw' };
const img = (m, kind, lazy) => `<img src="${m.sm}" srcset="${m.sm} ${m.smw}w, ${m.src} ${m.w}w" sizes="${SIZES[kind]}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" ${lazy ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}>`;
const bar = (m) => `<div class="bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(m.page)}</span></div>`;
const shot = (m, kind, lazy = true) => `<figure class="shot shot--${kind}"><div class="win${kind === 'trio' ? ' win--phone' : ''}">${kind !== 'trio' ? bar(m) : ''}${img(m, kind, lazy)}</div></figure>`;
// plate tone decides the window bar: dark plates get a dark browser
const dark = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.45; };
// Cloudflare's Email Obfuscation swaps every address in served HTML for a script-decoded placeholder,
// which crawlers and AI fetchers read as "[email protected]"; email_off opts these links out.
const mail = () => `<!--email_off--><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><!--/email_off-->`;
const split = (text) => text.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(' ');

export const footer = () => `
  <footer class="foot">
    <div class="c1">${MARK.replace('<svg', '<svg style="width:64px;fill:currentColor"')}</div>
    <div class="c2 mono">FF Dev Studio<br>${esc(CONTACT.city)}<br><span style="opacity:.6">${esc(CONTACT.legalName)} (${esc(CONTACT.regNo)})</span></div>
    <div class="c3 mono">${mail()}<a href="${CONTACT.wa}" target="_blank" rel="noopener">WhatsApp ${esc(CONTACT.whatsapp)}</a><a href="/faq" data-link>Questions</a></div>
    <div class="c4 mono"><a href="/privacy" data-link>Privacy</a><a href="/cookies" data-link>Cookies</a><button type="button" data-cookie-settings>Cookie settings</button></div>
  </footer>`;

export function project(slug) {
  const p = bySlug(slug);
  if (!p) return notFound();
  const i = PROJECTS.indexOf(p);
  const related = [1, 2, 3].map((k) => PROJECTS[(i + k * 4) % PROJECTS.length]);
  const m = media(p);
  return {
    theme: 'light',
    client: p.client,
    html: `
    <article class="project" style="--plate:${p.plate}"${dark(p.plate) ? ' data-plate="dark"' : ''}>
      <header class="p-hero"><h1 class="large-title">${esc(p.title)}</h1></header>
      <hr class="rule" style="margin:0 var(--margin)">
      <div class="p-meta mono">
        <div class="pills"><span>Zone &amp; year</span><a class="pill pill--zone" href="/?zone=${p.zone}" data-link>${ZONES[p.zone].name}</a><span class="pill">${p.year}</span></div>
        <a class="p-live" href="${p.url}" target="_blank" rel="noopener"><span class="lbl">See it live<span class="host">${esc(new URL(p.url).host)}</span></span><span class="arrow" aria-hidden="true">↗</span></a>
      </div>
      <div class="p-cover">${shot(m.cover, 'full', false)}</div>
      <section class="p-intro"><p class="statement reveal">${split(p.statement)}</p></section>
      <section class="p-about">
        <h2 class="mono">About</h2>
        <div class="body-copy">${p.about.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
        <dl class="p-facts mono">
          <div><dt>Client</dt><dd>${esc(p.client)}</dd></div>
          <div><dt>Type</dt><dd>${esc(p.type)}</dd></div>
          <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
          <div><dt>Built with</dt><dd>${p.stack.map((x) => esc(label(x, STACK_LABEL))).join(', ')}</dd></div>
          ${p.reference ? `<div><dt>Reference</dt><dd>${esc(p.reference)}</dd></div>` : ''}
        </dl>
      </section>
      <div class="p-shots">${m.rows.map((r) => `<div class="p-row p-row--${r.kind}">${r.items.map((x) => shot(x, r.kind)).join('')}</div>`).join('')}</div>
      <section class="p-features">
        <h2 class="mono">Features</h2>
        <div class="pills mono">${p.features.map((f) => `<a class="pill" href="/?feature=${f}" data-link>${esc(label(f))}</a>`).join('')}${p.stack.map((s) => `<span class="pill pill--zone">${esc(label(s, STACK_LABEL))}</span>`).join('')}</div>
      </section>
      <section class="related">
        <h2 class="mono">Related work</h2>
        <div class="related-grid">${related.map((r) => `
          <a class="rel" href="/projects/${r.slug}" data-link>
            <div class="img"><img src="${tileUrl(r)}" alt="" loading="lazy" width="1200" height="750"></div>
            <div class="row"><span>${esc(r.title)}</span><span class="mono">View project</span></div>
          </a>`).join('')}</div>
        <a class="see-all" href="/" data-link>See all work</a>
      </section>
      ${footer()}
    </article>`,
  };
}

const ABOUT_ZONES = [
  ['client', 'sunlight-supplies'],
  ['product', 'smoothsail'],
  ['study', 'ff-shoots'],
];

const STEPS = [
  ['WhatsApp enquiry', 'The business, the objective, references, the functions it needs, how ready the content is, budget and date.'],
  ['Fit and scope', 'The smallest scope that can get a strong result. Work that cannot meet the standard is declined, not discounted.'],
  ['Written proposal', 'Deliverables, exclusions, timeline, ownership, hosting, revision rules and price — in writing.'],
  ['50% deposit', 'Work begins once the deposit and the content needed to start are in.'],
  ['Direction and build', 'The intended experience is shown first, then designed and built.'],
  ['Three revision rounds', 'Feedback consolidated per round. New scope is quoted separately.'],
  ['QA and approval', 'Content, responsiveness, forms, performance and launch configuration, checked on real devices.'],
  ['Final 50% payment', 'Due before public launch or final handoff.'],
  ['Launch and care', 'Launch on managed hosting or hand it over. The thirty-day defect warranty starts here.'],
];

const INCLUDED = [
  'Project scoping and a recommended technical approach', 'Custom visual direction for your brand', 'UI design and responsive frontend development',
  'Mobile, tablet and desktop adaptation', 'Purposeful motion and interaction', 'Performance, accessibility and technical SEO',
  'Contact, enquiry and WhatsApp paths', 'Deployment, SSL and launch configuration', 'Three revision rounds', 'Cross-device launch checks', 'Thirty-day defect warranty',
];

// clients strip: each brand's own logo. LEWIX (LewixWeb4's wordmark = LEWIX/LOGO kit) and Ascend MY
// (AscPeps/brand production v1.1) are kit files copied verbatim; SmoothSail and Indahnya have no
// dark-ground lockup file, so tools/client-logos.mjs renders their repo marks + wordmark type.
const CLIENTS = [
  ['SmoothSail', '/brand/smoothsail-lockup-on-dark.png', 'lockup'],
  ['Indahnya', '/brand/indahnya-lockup-on-dark.png', 'lockup'],
  ['Ascend MY', '/brand/ascend-my-primary-on-dark.svg'],
  ['LEWIX', '/brand/lewix-wordmark-on-dark.svg'],
];

export function about(tab = 'studio') {
  const pick = (s) => bySlug(s);
  const studio = `
    <section class="a-row a-hero"><p class="mono" aria-hidden="true">Studio</p><div class="content"><span class="tag mono">Studio</span><h1 class="sub-title">Custom websites, designed and built end to end</h1></div></section>
    <div class="strip">${['lewix-ai', 'ff-stanzza', 'meridian', 'big-brain-furniture'].map((s) => `<img src="${tileUrl(pick(s))}" alt="" loading="lazy">`).join('')}</div>
    <section class="a-row a-block"><h2 class="mono">About</h2><div class="content"><p class="statement reveal">${split('FF Dev Studio designs and builds custom websites for founders and small companies across Malaysia. The person who scopes your site is the person who builds it.')}</p></div></section>
    <section class="a-row a-block" style="padding-bottom:70px"><h2 class="mono">Zones</h2><div class="content"><p class="statement reveal">${split('Never limited by size or shape, the work falls into three zones — and each one gets its own way of working.')}</p></div></section>
    ${ABOUT_ZONES.map(([z, s], i) => `
      <div class="zone-row">
        <span class="ico" aria-hidden="true">${'●'.repeat(i + 1)}</span>
        <h3>${ZONES[z].name}</h3>
        <div class="txt"><p>${esc(ZONES[z].blurb)}</p><p>${esc(ZONES[z].line)}</p><a class="mono" href="/?zone=${z}" data-link>View our ${ZONES[z].name.toLowerCase()} work</a></div>
        <div class="im"><img src="${tileUrl(pick(s))}" alt="" loading="lazy"></div>
      </div>`).join('')}
    <div class="band" style="margin-top:80px">${['ff-frames', 'ff-shoots', 'ascend-peptides'].map((s) => `<img src="${media(pick(s)).rows.find((r) => r.kind === 'trio').items[0].sm}" alt="" loading="lazy">`).join('')}</div>
    <section class="a-row a-block" style="padding-bottom:40px"><h2 class="mono">Clients</h2><div class="content"><p class="statement reveal">${split('Research catalogues, store builders, wedding platforms and AI products — each one designed and built here.')}</p></div></section>
    <ul class="clients">${CLIENTS.map(([name, logo, kind]) => `<li>${logo ? `<img class="client-logo${kind ? ` client-logo--${kind}` : ''}" src="${logo}" alt="${esc(name)}" loading="lazy">` : esc(name)}</li>`).join('')}</ul>
    <section class="a-row a-block" style="padding-bottom:0;margin-top:150px"><p class="mono">Our Studio</p><div class="content"><h2 class="sub-title" style="font-size:clamp(2rem,3vw,3rem);text-transform:none">One studio, in Kuala Lumpur</h2></div></section>
    <div class="studios">
      <div class="mark">${MARK}</div>
      <div class="addr mono">FF Dev Studio<br>Kuala Lumpur<br>Malaysia<br><span style="opacity:.6">${esc(CONTACT.legalName)} (${esc(CONTACT.regNo)})</span></div>
      <div class="links mono">${mail()}<a href="${CONTACT.wa}" target="_blank" rel="noopener">WhatsApp ${esc(CONTACT.whatsapp)}</a><a href="https://ffdev.studio" target="_blank" rel="noopener">ffdev.studio</a></div>
    </div>
    <section class="a-row a-block" style="padding-bottom:40px;margin-top:150px"><h2 class="mono">Team</h2><div class="content"><p class="statement reveal">${split('Design, development and motion, made in-house from the first sketch to launch.')}</p></div></section>
    <div class="team">
      <div class="card"><div class="ph">${MARK}</div><h3>Fakhrul</h3><p class="mono" style="opacity:.6">Founder · Design · Development</p></div>
    </div>`;
  const approach = `
    <section class="a-row a-hero"><p class="mono" aria-hidden="true">Approach</p><div class="content"><span class="tag mono">Approach</span><h1 class="sub-title">Smallest scope, strongest result</h1></div></section>
    <section class="a-row a-block" style="padding-bottom:60px"><h2 class="mono">Process</h2><div class="content"><p class="statement reveal">${split('Nine steps from the first WhatsApp message to launch. Nothing starts without a written proposal, and nothing ships without being checked on real devices.')}</p></div></section>
    <ol class="steps" style="list-style:none;padding:0">${STEPS.map(([h, t], i) => `<li><span class="n mono">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
    <section class="a-row a-block" style="margin-top:120px"><h2 class="mono">Included</h2><div class="content"><ul class="incl">${INCLUDED.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><a class="btn-pill" href="/pricing" data-link>See pricing</a></div></section>`;
  return {
    theme: 'dark',
    html: `
    <div class="about" data-tab="${tab}">
      <div class="about-toggle"><div class="toggle" role="group" aria-label="About section" data-about-toggle>
        <span class="hl" aria-hidden="true"></span>
        <button type="button" data-tab="studio" aria-pressed="${tab === 'studio'}">Studio</button>
        <button type="button" data-tab="approach" aria-pressed="${tab === 'approach'}">Approach</button>
      </div></div>
      ${tab === 'approach' ? approach : studio}
      ${footer()}
    </div>`,
  };
}

export function pricing() {
  // one row system with About: a rule, a mono label in the first three columns, content in the other nine
  return {
    theme: 'dark',
    html: `
    <div class="pricing">
      <section class="pr-row pr-hero">
        <h1 class="mono label-dot">Pricing</h1>
        <div class="content">
          <p class="big reveal">${split('Projects start from RM1,000. Most land between RM1,000 and RM5,000, quoted after one conversation, in writing, before any work starts.')}</p>
          <a class="btn-pill" href="#bands">View the bands</a>
        </div>
      </section>
      <section class="pr-row" id="bands" aria-labelledby="pr-bands">
        <h2 class="mono label-dot" id="pr-bands">Bands</h2>
        <div class="content tiers">
          ${PRICING.bands.map((b, i) => `
          <div class="tier">
            <p class="mono">Band 0${i + 1}</p>
            <h3>${esc(b.name)}</h3>
            <p class="price">${esc(b.range)}</p>
            <p class="line">${esc(b.line)}</p>
            <p class="mono d">${esc(b.days)}</p>
          </div>`).join('')}
        </div>
      </section>
      <section class="pr-row" aria-labelledby="pr-care">
        <h2 class="mono label-dot" id="pr-care">Care</h2>
        <div class="content">
          <p class="lead">Managed care, if you want it.</p>
          <ul class="plans">
            ${PRICING.care.map((c) => `
            <li class="plan">
              <h3>${esc(c.name)}${c.note ? `<span class="tag mono">${esc(c.note)}</span>` : ''}</h3>
              <p class="line">${esc(c.line)}</p>
              <p class="price">${esc(c.price)}<span>${esc(c.year)}</span></p>
            </li>`).join('')}
          </ul>
        </div>
      </section>
      <section class="pr-row" aria-labelledby="pr-terms">
        <h2 class="mono label-dot" id="pr-terms">Terms</h2>
        <div class="content terms">
          <p>${esc(PRICING.terms)} These are estimating bands, not quality tiers — a project is quoted above them when its real scope needs it.</p>
          <p>Not sure where yours sits? Send the brief and get a straight answer.</p>
          <a class="btn-pill" href="/contact" data-link>Start a project</a>
        </div>
      </section>
      ${footer()}
    </div>`,
  };
}

// /faq — Pricing's row system: the number in columns 1–3, the question and its answer in 4–12
export function faq() {
  return {
    theme: 'dark',
    html: `
    <div class="pricing faq">
      <section class="pr-row pr-hero">
        <h1 class="mono label-dot">Questions</h1>
        <div class="content">
          <p class="big reveal">${split('Straight answers on price, timing, ownership and what happens after launch.')}</p>
        </div>
      </section>
      ${FAQ.map((f, i) => `
      <section class="pr-row faq-q" id="${f.id}" aria-labelledby="q-${f.id}">
        <p class="mono label-dot" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
        <div class="content">
          <h2 id="q-${f.id}">${esc(f.q)}</h2>
          ${f.a.map((t) => `<p>${esc(t).replace(CONTACT.email, `<!--email_off-->${CONTACT.email}<!--/email_off-->`)}</p>`).join('')}
          ${f.list ? `<ul class="incl">${f.list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          ${f.after ? `<p>${esc(f.after)}</p>` : ''}
          ${f.more ? `<a class="more mono" href="${f.more[0]}" data-link>${esc(f.more[1])}</a>` : ''}
        </div>
      </section>`).join('')}
      <section class="pr-row" aria-labelledby="q-ask">
        <h2 class="mono label-dot" id="q-ask">Ask</h2>
        <div class="content terms">
          <p>Anything not answered here, ask directly. WhatsApp ${esc(CONTACT.whatsapp)} or ${mail()}.</p>
          <a class="btn-pill" href="/contact" data-link>Start a project</a>
        </div>
      </section>
      ${footer()}
    </div>`,
  };
}

// /privacy and /cookies — the FAQ's rows: a label in columns 1–3, the section in 4–12
const legalRow = (s, i) => `
      <section class="pr-row faq-q" id="${s.id}" aria-labelledby="l-${s.id}">
        <p class="mono label-dot" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
        <div class="content">
          <h2 id="l-${s.id}">${esc(s.h)}</h2>
          ${(s.p || []).map((t) => `<p>${esc(t).replace(CONTACT.email, `<!--email_off-->${CONTACT.email}<!--/email_off-->`)}</p>`).join('')}
          ${s.list ? `<ul class="bullets">${s.list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          ${s.after ? `<p>${esc(s.after).replace(CONTACT.email, `<!--email_off-->${CONTACT.email}<!--/email_off-->`)}</p>` : ''}
        </div>
      </section>`;
const legalHero = (h1, line) => `
      <section class="pr-row pr-hero">
        <h1 class="mono label-dot">${h1}</h1>
        <div class="content">
          <p class="big reveal">${split(line)}</p>
          <p class="mono updated">Last updated ${LEGAL_UPDATED}</p>
        </div>
      </section>`;

export function privacy() {
  return {
    theme: 'dark',
    html: `
    <div class="pricing legal">
      ${legalHero('Privacy', 'What this site collects, why, who handles it, and what you can do about it.')}
      ${PRIVACY.map(legalRow).join('')}
      ${footer()}
    </div>`,
  };
}

export function cookies() {
  const when = { choice: 'After you choose', accept: 'Only if you accept' };
  return {
    theme: 'dark',
    html: `
    <div class="pricing legal">
      ${legalHero('Cookies', 'One strictly necessary item remembers your choice. Everything else is analytics, and only if you accept.')}
      <section class="pr-row faq-q" id="choice" aria-labelledby="l-choice">
        <p class="mono label-dot" aria-hidden="true">01</p>
        <div class="content">
          <h2 id="l-choice">Your choice</h2>
          <p data-cookie-status>Not chosen yet — nothing is collected until you choose.</p>
          <div class="consent-actions"><button type="button" class="btn-pill" data-consent="accept">Accept</button><button type="button" class="btn-pill" data-consent="reject">Reject</button></div>
        </div>
      </section>
      <section class="pr-row faq-q" id="what" aria-labelledby="l-what">
        <p class="mono label-dot" aria-hidden="true">02</p>
        <div class="content">
          <h2 id="l-what">What each choice means</h2>
          <ul class="bullets">
            <li>Accept: PostHog analytics runs with a cookie and local storage, so visits can be linked and recorded, with everything you type hidden.</li>
            <li>Reject: PostHog counts the visit without cookies or storage. There is no recording, and the only identifier is a code calculated on PostHog’s servers that changes every day.</li>
            <li>Before you choose, nothing is collected or stored.</li>
          </ul>
          <p>How the data is used and who handles it is in the <a href="/privacy" data-link>privacy notice</a>.</p>
        </div>
      </section>
      <section class="pr-row faq-q" id="list" aria-labelledby="l-list">
        <p class="mono label-dot" aria-hidden="true">03</p>
        <div class="content">
          <h2 id="l-list">Everything this site stores in your browser</h2>
          <div class="table-wrap"><table class="storage">
            <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Purpose</th><th scope="col">Kept for</th><th scope="col">Set</th></tr></thead>
            <tbody>${STORAGE.map((s) => `<tr><td class="mono" data-l="Name">${esc(s.name)}</td><td data-l="Type">${esc(s.type)}</td><td data-l="Purpose">${esc(s.purpose)}</td><td data-l="Kept for">${esc(s.life)}</td><td data-l="Set">${when[s.when]}</td></tr>`).join('')}</tbody>
          </table></div>
          <p>Nothing else: no advertising cookies, no third-party cookies, and the fonts are served from this site.</p>
        </div>
      </section>
      ${footer()}
    </div>`,
  };
}

export function notFound() {
  return {
    theme: 'dark',
    status: 404,
    html: `<section class="nf"><h1 class="large-title">404</h1><p class="mono">This page was cut.</p><p><a class="btn-pill" href="/" data-link>Back to the work</a></p></section>`,
  };
}

export function homeSeo() {
  return {
    theme: 'dark',
    html: `
      <h1 class="sr-only">FF Dev Studio designs and builds custom websites for founders and small companies across Malaysia.</h1>
      <p class="sr-only">Drag the grid to explore the work, use the arrow keys to move it, or switch to the list view. Projects start from RM1,000.</p>
      ${workNav()}`,
  };
}

// hidden behind the canvas: every project as a real link with its one-line statement
const workNav = () => `<nav class="sr-only" aria-label="All work"><ul>${PROJECTS.map((p) => `<li><a href="/projects/${p.slug}" data-link>${esc(p.title)} — ${esc(p.type)}</a> <span>${esc(p.statement)}</span></li>`).join('')}</ul></nav>`;

// /contact is an overlay on the home page; this is the static page under it, for crawlers and no-JS
export function contactSeo() {
  return {
    theme: 'dark',
    html: `
      <h1 class="sr-only">Start a project with FF Dev Studio</h1>
      <p class="sr-only">Tell us about your website in a seven-question brief, then send it by email or WhatsApp. Projects start from RM1,000; most land between RM1,000 and RM5,000, quoted after one conversation.</p>
      <p class="sr-only">Email ${mail()} · WhatsApp <a href="${CONTACT.wa}">${esc(CONTACT.whatsapp)}</a> · ${esc(CONTACT.city)} · ${esc(CONTACT.legalName)} (${esc(CONTACT.regNo)})</p>
      ${workNav()}`,
  };
}
