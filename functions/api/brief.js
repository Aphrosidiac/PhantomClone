// POST /api/brief — the "Start a project" form, delivered. The brief is emailed to the studio
// (Resend — Cloudflare Email Sending needs the paid Workers plan) and, once FF Ops
// is live, filed there as a WEBSITE lead through its public lead-form endpoint. Either one landing
// counts as delivered; if neither does the visitor is told, and offered email/WhatsApp instead.
//
// Settings (Pages project → Settings → Variables and Secrets; locally .dev.vars):
//   RESEND_API_KEY     secret, Resend key with "Sending access" for ffdev.studio
//   BRIEF_TO           optional, default hello@ffdev.studio
//   BRIEF_FROM         optional, default brief@ffdev.studio (domain verified in Resend)
//   FFOPS_LEAD_URL     optional, https://ops.ffdev.studio/api/public/leads/lf_… (FF Ops → Leads → Forms)
// Never logged: what the visitor wrote. Logs carry which channel failed and why, nothing else.

const MAX = { name: 120, email: 200, company: 160, note: 6000, refs: 3000, kickoff: 120, work: 20 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function onRequestPost({ request, env }) {
  // same-site only: the form is the one caller (a missing Origin is allowed — some privacy tools strip it)
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'origin' }, 403);

  let raw;
  try { raw = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  if (!raw || typeof raw !== 'object') return json({ ok: false, error: 'bad_request' }, 400);
  if (raw._gotcha) return json({ ok: true, channels: [] }); // honeypot: a bot filled the hidden field

  const d = {
    kickoff: str(raw.kickoff, MAX.kickoff),
    name: str(raw.name, MAX.name),
    email: str(raw.email, MAX.email).toLowerCase(),
    company: str(raw.company, MAX.company),
    note: str(raw.note, MAX.note),
    refs: str(raw.refs, MAX.refs),
    work: (Array.isArray(raw.work) ? raw.work : []).map((w) => str(w, 80)).filter(Boolean).slice(0, MAX.work),
    page: str(raw.page, 300),
  };
  const errs = {};
  if (!d.name) errs.name = 'Please add your name.';
  if (!EMAIL_RE.test(d.email)) errs.email = 'Please add an email address that works.';
  if (!d.company) errs.company = 'Please add a company — your own name is fine.';
  if (Object.keys(errs).length) return json({ ok: false, error: 'invalid', fields: errs }, 422);

  const results = await Promise.allSettled([sendEmail(d, env), fileLead(d, env)]);
  const channels = [];
  results.forEach((r, i) => {
    const ch = i === 0 ? 'email' : 'ffops';
    if (r.status === 'fulfilled' && r.value === true) channels.push(ch);
    else if (r.status === 'rejected') console.error(`brief: ${ch} failed: ${r.reason?.message || r.reason}`);
  });
  if (!channels.length) return json({ ok: false, error: 'undelivered' }, 502);
  return json({ ok: true, channels });
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405);

function briefText(d) {
  const lines = [d.kickoff, '', `Name: ${d.name}`, `Email: ${d.email}`, `Company: ${d.company}`];
  if (d.work.length) lines.push(`Interested in: ${d.work.join(', ')}`);
  if (d.note) lines.push('', d.note);
  if (d.refs) lines.push('', 'References:', d.refs);
  return lines.join('\n');
}

// resolves true when sent, false when not configured, throws when Resend refuses it
async function sendEmail(d, env) {
  if (!env.RESEND_API_KEY) return false;
  const text = `${briefText(d)}\n\n—\nSent from the brief form on ${d.page || 'ffdev.studio'}. Reply to this email to answer ${d.name}.`;
  const row = (k, v) => `<tr><td style="padding:4px 16px 4px 0;color:#777;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
  const html = `<div style="font:15px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111;max-width:620px">
<p style="margin:0 0 16px;font-size:13px;color:#777">${esc(d.kickoff)}</p>
<table style="border-collapse:collapse;margin-bottom:18px">${row('Name', esc(d.name))}${row('Email', `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}${row('Company', esc(d.company))}${d.work.length ? row('Interested in', esc(d.work.join(', '))) : ''}</table>
${d.note ? `<p style="white-space:pre-wrap;margin:0 0 18px">${esc(d.note)}</p>` : ''}
${d.refs ? `<p style="margin:0 0 4px;color:#777;font-size:13px">References</p><p style="white-space:pre-wrap;margin:0 0 18px">${esc(d.refs)}</p>` : ''}
<p style="margin:24px 0 0;font-size:12px;color:#999">Sent from the brief form on ${esc(d.page || 'ffdev.studio')}. Reply to answer ${esc(d.name)}.</p></div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `ffdev.studio brief <${env.BRIEF_FROM || 'brief@ffdev.studio'}>`,
      to: [env.BRIEF_TO || 'hello@ffdev.studio'],
      reply_to: d.email,
      subject: `New project — ${d.company}`,
      text, html,
    }),
  });
  if (!r.ok) {
    const b = await r.json().catch(() => ({}));
    throw new Error(`HTTP ${r.status} ${b.name || ''}`);
  }
  return true;
}

async function fileLead(d, env) {
  if (!env.FFOPS_LEAD_URL) return false;
  const r = await fetch(env.FFOPS_LEAD_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: d.name, email: d.email, company: d.company,
      message: briefText(d), websiteType: d.work.join(', ') || null, referrer: d.page || null,
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return true;
}
