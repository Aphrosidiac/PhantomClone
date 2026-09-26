// /privacy and /cookies content. Written for Malaysia's Personal Data Protection Act 2010 (as
// amended in 2024): who the data user is, what is collected and why, who it is disclosed to, transfer
// abroad, retention, and the rights to access, correct, withdraw consent and port data.
// Every statement here must stay true of the running site — change it with the code (analytics.js,
// consent.js, the PostHog project settings), never separately.
import { CONTACT } from './data.js';

export const LEGAL_UPDATED = '26 September 2026';
export const LEGAL_UPDATED_ISO = '2026-09-26';
const WHO = `${CONTACT.legalName} (SSM ${CONTACT.regNo})`;

export const PRIVACY = [
  {
    id: 'who', h: 'Who is responsible',
    p: [`This website, ffdev.studio, is run by ${WHO}, a web design studio in Kuala Lumpur, Malaysia (“FF Dev Studio”, “we”). FF Dev Studio decides how the personal data described here is used and is responsible for it.`,
      `Questions and requests about your data: ${CONTACT.email} or WhatsApp ${CONTACT.whatsapp}.`],
  },
  {
    id: 'collect', h: 'What this site collects',
    p: ['What the site collects depends on the choice you make in the cookie banner.'],
    list: [
      'Before you choose: nothing is collected or stored. The page only asks PostHog for its settings; no event is recorded.',
      'If you accept: the pages you view, the links and buttons you click, which projects you open, how you arrived (the referring site and any campaign tags in the link), your device type, browser, operating system and screen size, your approximate location (country and city, worked out from your IP address, which is then discarded), page-loading speed, errors in the page, and a recording of your visit — mouse movement, scrolling, clicks and what appears on screen — with everything you type hidden.',
      'If you reject: the same page views and clicks, counted anonymously. Nothing is stored in your browser, there is no recording and no location, and the only identifier is a code PostHog calculates on its servers that changes every day.',
    ],
  },
  {
    id: 'brief', h: 'The project brief and messages',
    p: ['The “Start a project” form never leaves your browser by itself. This site has no server of its own and does not send or store what you type into the form. When you finish, you send the brief yourself, from your own email or WhatsApp, and you can read it before it goes.',
      'From then on, and for anything else you send us by email or WhatsApp, we hold it as correspondence: your name, contact details, company and whatever you choose to tell us about your project.'],
  },
  {
    id: 'why', h: 'Why we use it',
    list: [
      'Analytics: to see which work and pages are useful, where visitors come from, and to find and fix errors and slow pages.',
      'Messages and briefs: to reply to you, recommend a scope, prepare a proposal and do the work you ask for, and to keep the business and tax records the law requires.',
    ],
    after: 'We do not sell personal data, do not use it for advertising, and do not combine it with data from other sources.',
  },
  {
    id: 'who-else', h: 'Who else handles it',
    p: ['These companies process personal data for us, only to provide their service:'],
    list: [
      'PostHog, Inc. (United States): analytics and session recordings.',
      'Cloudflare, Inc.: hosts this site and passes analytics requests on to PostHog.',
      'Google (Google Workspace): our email.',
      'WhatsApp (Meta): if you message us there.',
    ],
    after: 'We disclose personal data to anyone else only where the law requires it.',
  },
  {
    id: 'abroad', h: 'Data stored outside Malaysia',
    p: ['PostHog stores analytics data in the United States. Cloudflare, Google and WhatsApp may process data in other countries where they operate. We use these providers because they protect the data they hold for us under their own security and privacy commitments.'],
  },
  {
    id: 'keep', h: 'How long it is kept',
    list: [
      'Session recordings are deleted automatically after 30 days.',
      'Other analytics data is kept under PostHog’s standard retention and is used only to understand how the site is used. We delete the data tied to your browser if you ask.',
      'Emails, messages and project records are kept for as long as the enquiry or project needs them, and afterwards for as long as Malaysian business and tax law requires.',
    ],
  },
  {
    id: 'rights', h: 'Your choices and rights',
    p: ['Under the Personal Data Protection Act 2010 you can:'],
    list: [
      'change or withdraw your cookie choice at any time, under “Cookie settings”;',
      'ask for access to the personal data we hold about you;',
      'ask us to correct it if it is inaccurate, incomplete or out of date;',
      'withdraw your consent, or ask us to stop or limit using your data;',
      'ask for a copy of your data to be sent to another organisation.',
    ],
    after: `Send requests to ${CONTACT.email}. We reply within 21 days. If you are not satisfied with our answer, you can complain to the Personal Data Protection Commissioner of Malaysia.`,
  },
  {
    id: 'security', h: 'Security',
    p: ['The site is served only over HTTPS. IP addresses are discarded once an approximate location has been worked out, text typed into the site is hidden from recordings, and only FF Dev Studio has access to the analytics project.'],
  },
  {
    id: 'children', h: 'Children',
    p: ['This site is meant for businesses and is not directed at children. We do not knowingly collect personal data from anyone under 18.'],
  },
  {
    id: 'changes', h: 'Changes to this notice',
    p: [`When this notice changes, the new version is published here with a new date. Last updated ${LEGAL_UPDATED}.`],
  },
];

// Every browser storage item the site can create — read from a real browser after Reject and after
// Accept (2026-09-26, posthog-js 1.434.14, defaults '2026-08-30'). Re-check after a posthog-js upgrade.
// `when`: 'choice' = after either choice (strictly necessary), 'accept' = only after Accept,
// 'internal' = only on FF's own devices (?ff_internal=1).
const T = 'phc_t6rrEspDXb4Ubvy8KdsVCV9YwVyPjAo34Yg9xC3WgEdN';
export const STORAGE = [
  { name: `__ph_opt_in_out_${T}`, type: 'Local storage', purpose: 'Remembers your cookie choice, so the banner does not ask again.', life: 'Until you clear it', when: 'choice' },
  { name: `ph_${T}_posthog`, type: 'Cookie', purpose: 'PostHog analytics: a random visitor ID and the current session, so the pages of one visit can be linked.', life: '1 year', when: 'accept' },
  { name: `ph_${T}_posthog_cpm`, type: 'Cookie', purpose: 'PostHog analytics: notes which of its values are kept in the cookie, so the cookie and local storage stay in step.', life: '1 year', when: 'accept' },
  { name: `ph_${T}_posthog`, type: 'Local storage', purpose: 'PostHog analytics: the same IDs, plus PostHog’s settings for this site.', life: 'Until you clear it', when: 'accept' },
  { name: `ph_${T}_posthog__flags`, type: 'Local storage', purpose: 'PostHog’s feature settings for this site. Holds nothing about you.', life: 'Until you clear it', when: 'accept' },
  { name: `ph_${T}_posthog`, type: 'Session storage', purpose: 'PostHog analytics: details of the current visit in this tab.', life: 'Until the tab is closed', when: 'accept' },
  { name: 'ff_internal', type: 'Local storage', purpose: 'Marks FF Dev Studio’s own devices, so our own visits are left out of the statistics. Never set for visitors.', life: 'Until removed', when: 'internal' },
  { name: `ph_${T}_window_id`, type: 'Session storage', purpose: 'Tells visits in different tabs apart, so recordings are not mixed up.', life: 'Until the tab is closed', when: 'accept' },
];
