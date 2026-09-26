// Cookie banner. Shown while PostHog's consent status is 'pending'; reopened by any
// [data-cookie-settings] control (footer, /cookies). Accept and Reject carry equal weight.
// The banner stores nothing itself: the choice lives in PostHog's consent record (see analytics.js).
import { enabled, consentStatus, setConsent } from './analytics.js';

const TEXT = {
  pending: 'FF Dev Studio would like to use cookies to learn how the site is used: which work gets opened, where visitors come from, and recordings of visits with anything you type hidden. Reject, and your visit is still counted anonymously, without cookies.',
  granted: 'You accepted analytics cookies. You can change that at any time.',
  denied: 'You rejected analytics cookies: your visits are counted anonymously, without cookies. You can change that at any time.',
};

let el = null;
export async function showConsent(force = false) {
  if (!enabled) return;
  const status = await consentStatus();
  if (!force && status !== 'pending') return;
  el?.remove();
  el = document.createElement('section');
  el.className = 'consent';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Cookie choice');
  el.innerHTML = `
    <p class="mono label-dot">Cookies</p>
    <p class="t">${TEXT[status] || TEXT.pending}</p>
    <div class="row">
      <button type="button" class="btn-pill" data-consent="accept">Accept</button>
      <button type="button" class="btn-pill" data-consent="reject">Reject</button>
      <a class="mono" href="/cookies" data-link>Details</a>
    </div>`;
  document.body.append(el);
  if (force) el.querySelector('[data-consent]').focus({ preventScroll: true });
}
export function hideConsent() { el?.remove(); el = null; }

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-consent]');
  if (b) { setConsent(b.dataset.consent === 'accept').then(refreshCookieStatus); hideConsent(); return; }
  const s = e.target.closest('[data-cookie-settings]');
  if (s) { e.preventDefault(); showConsent(true); }
});

// /cookies shows the current choice; keep it in step after a change
export async function refreshCookieStatus() {
  const s = document.querySelector('[data-cookie-status]');
  if (!s) return;
  const status = await consentStatus();
  s.textContent = !enabled ? 'Analytics is off on this address.' : status === 'granted' ? 'Accepted — analytics cookies are on.' : status === 'denied' ? 'Rejected — counted anonymously, no cookies.' : 'Not chosen yet — nothing is collected until you choose.';
}
