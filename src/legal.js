// /privacy and /cookies content. Written for Malaysia's Personal Data Protection Act 2010 (as
// amended in 2024): who the data user is, what is collected and why, who it is disclosed to, transfer
// abroad, retention, and the rights to access, correct, withdraw consent and port data.
// Every statement here must stay true of the running site — change it with the code (analytics.js,
// consent.js, the PostHog project settings), never separately.
import { CONTACT, PRODUCTS } from './data.js';

export const LEGAL_UPDATED = '14 October 2026';
export const LEGAL_UPDATED_ISO = '2026-10-14';
// /terms and /refunds: dated on their own, so a change there does not re-date the privacy notice
export const TERMS_UPDATED = '14 October 2026';
export const TERMS_UPDATED_ISO = '2026-10-14';
const WHO = `${CONTACT.legalName} (SSM ${CONTACT.regNo})`;
const ADDRESS = CONTACT.address.join(', ');

export const PRIVACY = [
  {
    id: 'who', h: 'Who is responsible',
    p: [`This website, ffdev.studio, is run by ${WHO}, a web design studio registered at ${ADDRESS} (“FF Dev Studio”, “we”). FF Dev Studio decides how the personal data described here is used and is responsible for it.`,
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
    p: ['When you press Submit on the “Start a project” form, what you typed (your name, email, company, note, links and the kinds of work you picked) is sent to our inbox and kept with our client records. This site does not keep a copy of it. If it cannot be sent, nothing leaves your browser and you can send the brief yourself by email or WhatsApp instead.',
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
      'Cloudflare, Inc.: hosts this site, passes analytics requests on to PostHog, and delivers the project brief to our inbox.',
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

// /terms and /refunds. Every statement must stay true of how FF actually works: the service model is
// ffdevstudio/SERVICE_ARCHITECTURE.md, care-plan billing is FF Ops (apps/api/src/modules/billing/
// service.ts + jobs.ts: auto-pay renewals, retries on day 3 and day 7, cancel at period end, MANUAL plans
// invoiced each period, PREPAID plans lapse). Fakhrul's rulings 2026-10-13: deposit refundable until work
// starts; no partial care refunds (runs to period end); unpaid care pauses, hosting may be suspended after
// 30 days overdue with notice. The SSM registered address is shown (Fakhrul 2026-10-14, for CHIP's card review,
// which asks for the business address in the footer), alongside email and telephone.
// Change these with the code and with him, never separately.
export const TERMS = [
  {
    id: 'who', h: 'Who we are',
    p: [`FF Dev Studio (“FF Dev Studio”, “we”) is ${WHO}, a sole proprietorship registered in Malaysia. Registered address: ${ADDRESS}.`,
      `These terms apply to website projects and care plans bought from FF Dev Studio. Contact: ${CONTACT.email} or WhatsApp ${CONTACT.whatsapp}.`],
  },
  {
    id: 'products', h: 'Our software products',
    p: ['FF Dev Studio also builds and sells its own software online:'],
    list: PRODUCTS.map((p) => `${p.name} (${p.host}): ${p.line}.`),
    after: 'Each product is sold on its own website, under its own terms, privacy notice and refund policy, with payments processed by CHIP. Where a product’s own terms differ from these, the product’s terms apply to it.',
  },
  {
    id: 'proposal', h: 'Every project starts with a written proposal',
    p: ['Before any work starts, you receive a written proposal with the deliverables, what is not included, the timeline, ownership and hosting, the revision rules and the price. The proposal and these terms together are the agreement. Where they differ, the proposal wins.',
      'Prices are in Malaysian ringgit (MYR). The bands on the pricing page are for estimating; the price you pay is the one in your proposal.'],
  },
  {
    id: 'payment', h: 'Paying for a project',
    list: [
      '50% deposit: work begins once the deposit and the content needed to start are in.',
      '50% final payment: due before the site goes public or is handed over.',
      'Each payment is invoiced. Pay online through the link on the invoice (processed by CHIP, a Malaysian payment gateway: online banking (FPX), card or the other methods shown on the payment page) or by bank transfer to the account on the invoice, by the due date shown on it.',
      'Card details are entered on CHIP’s payment page. FF Dev Studio never sees or stores your full card number.',
    ],
  },
  {
    id: 'work', h: 'Revisions, content and launch',
    list: [
      'Three revision rounds are included. Feedback for each round comes together from you in one set. New scope is quoted separately.',
      'You supply the final content: business facts, offer details, copy, logo, photography and any legal information the site must show. Full copywriting, photography, video and other content production are quoted separately.',
      'Timelines start once the deposit and the content needed to start are in, and move if content or feedback arrives late.',
      'After launch, defects in the work we delivered are fixed free of charge for thirty days.',
    ],
  },
  {
    id: 'ownership', h: 'Ownership',
    list: [
      'Your domain and the content you supply are always yours. We may manage hosting, DNS and deployment for you, but we never hold your domain back.',
      'Once a project is fully paid, its deliverables can be handed over or moved to another host when you ask.',
      'Third-party licences, subscriptions, fonts, stock media and services stay under their own terms and costs. Domain fees are billed at cost.',
    ],
    after: 'The exact ownership and handoff terms for a project are written into its proposal.',
  },
  {
    id: 'care', h: 'Care plans',
    p: ['A care plan keeps a site we host and maintain looked after after launch:'],
    list: [
      'Care: RM59 a month or RM590 a year. Managed hosting, SSL and CDN, uptime monitoring, backups, security and dependency maintenance, and fixes for defects in our work.',
      'Maintain: RM149 a month or RM1,490 a year. Everything in Care, plus up to 60 minutes of small content or visual changes a month and priority WhatsApp support.',
      'Evolve: RM299 a month or RM2,990 a year. Everything in Maintain, plus up to three hours of improvements a month and a quarterly improvement recommendation.',
    ],
    after: 'Included time does not roll over to the next month. New pages, redesigns, new features and third-party usage costs are quoted separately. A plan is optional: a site can also be handed over to be hosted elsewhere.',
  },
  {
    id: 'auto-pay', h: 'Care plans on card auto-pay',
    p: ['If you choose auto-pay, the plan renews automatically until you cancel it:'],
    list: [
      'You pay the first month or year on CHIP’s payment page and agree to save the card there for the renewals. CHIP keeps the card; we keep only its brand and last four digits.',
      'On the day each paid period ends, we charge the saved card for the next one, at the price your plan started at. If your plan started with a discount, it renews at the normal price once the discount has run out, as shown when you signed up. Every charge comes with an invoice and receipt by email.',
      'If a charge is declined, we email you and try the card again 3 days later, then once more 4 days after that. After that there are no more automatic attempts: you can pay the invoice online or by bank transfer, or add a new card in the client portal.',
      'You can change the card, or cancel, at any time in the client portal, or by asking us by email or WhatsApp.',
    ],
  },
  {
    id: 'transfer', h: 'Care plans paid by bank transfer',
    list: [
      'If you prefer not to save a card, each month or year is invoiced at the start of the period and emailed to you. Pay it by bank transfer, or online through the link on the invoice, by the due date shown on it.',
      'Nothing is charged automatically. The plan carries on, one invoice per period, until you cancel it.',
      'A prepaid plan (several months paid up front) ends on its last day and does not renew by itself. We remind you before it ends, with the option to continue.',
    ],
  },
  {
    id: 'cancel', h: 'Cancelling a care plan',
    list: [
      'Cancel at any time, in the client portal or by email or WhatsApp. There is no minimum term and no cancellation fee.',
      'The plan keeps running until the end of the month or year already paid, and nothing more is charged or invoiced after that. You can undo the cancellation before that date.',
      'When a plan ends, we can hand the site over or move it to another host for you.',
    ],
    after: 'How refunds work for care plans is on the refunds page.',
  },
  {
    id: 'unpaid', h: 'If a care plan goes unpaid',
    p: ['While a care-plan invoice is overdue, changes and support under the plan pause. If it is still unpaid 30 days after the due date, we may suspend hosting of the site after telling you in writing first. It is restored as soon as the invoice is paid. Your domain and content stay yours throughout.'],
  },
  {
    id: 'law', h: 'Law and changes',
    p: ['These terms are governed by the laws of Malaysia.',
      `When these terms change, the new version is published here with a new date. A change never alters a proposal you have already accepted or a period you have already paid for. Last updated ${TERMS_UPDATED}.`],
  },
];

export const REFUNDS = [
  {
    id: 'deposit', h: 'Project deposits',
    list: [
      'If you cancel a project before we start work on it, the 50% deposit is refunded in full.',
      'Once work has started (the direction, design or build), the deposit is not refundable.',
      'The final 50% is only due before launch or handover. If a project is cancelled before then, the final payment is not owed.',
    ],
  },
  {
    id: 'care', h: 'Care plans',
    list: [
      'Cancel at any time. The plan runs until the end of the month or year already paid and is not charged again.',
      'Periods already paid are not refunded in part, whether the plan is monthly or yearly.',
      'A prepaid plan is not refunded in part either; it simply ends on its last day.',
    ],
  },
  {
    id: 'mistakes', h: 'Charged in error',
    p: ['If you were charged twice, charged after cancelling, or charged an amount that does not match your invoice, tell us and the wrong charge is refunded in full.'],
  },
  {
    id: 'defects', h: 'Defects',
    p: ['A defect in work we delivered is fixed, not refunded: free of charge within thirty days of launch, and at any time while the site is on a care plan.'],
  },
  {
    id: 'how', h: 'How to ask, and how refunds are paid',
    list: [
      `Email ${CONTACT.email} or WhatsApp ${CONTACT.whatsapp} with the invoice number and what happened.`,
      'We reply within 3 working days.',
      'Card, online banking and e-wallet payments are refunded through CHIP to the same card or account. Bank transfers are refunded to the account they came from.',
      'An approved refund is sent within 7 working days. A card refund can take a further 5 to 14 working days to show on your statement, depending on your bank.',
    ],
    after: 'This policy does not affect your rights under the Consumer Protection Act 1999 or other Malaysian law.',
  },
];

// /delivery: CHIP's review asks for a shipping/return policy. Nothing FF sells is physical; every statement
// here must match /terms (deposit → work starts, launch after the final payment, care plans from payment).
export const DELIVERY = [
  {
    id: 'digital', h: 'Nothing is shipped',
    p: ['Everything FF Dev Studio sells is a digital service, delivered online. No physical goods are shipped, so there are no shipping fees, courier tracking or returns of goods. Questions about getting your money back are answered on the refunds page.'],
  },
  {
    id: 'projects', h: 'Website projects',
    list: [
      'Work starts once the 50% deposit and the content needed to start are in. The timeline in your proposal counts from then.',
      'Progress is shared online as a private preview link, with each revision round delivered the same way.',
      'After the final payment, the site is published to your domain, or handed over (files, code and access) to you or your host, as agreed in the proposal.',
    ],
  },
  {
    id: 'care', h: 'Care plans',
    p: ['A care plan starts on the day its first payment clears. Hosting, monitoring, backups and maintenance run from then; changes and support are requested by email or WhatsApp and delivered on the live site. An invoice and receipt for every payment is sent by email.'],
  },
  {
    id: 'products', h: 'Software products',
    p: [`${PRODUCTS.map((p) => `${p.name} (${p.host})`).join(' and ')} are delivered online: access is given in your account as soon as the payment is confirmed, and a receipt is sent by email. Each product’s own website sets out exactly what is included.`],
  },
  {
    id: 'problems', h: 'If something has not arrived',
    p: [`If you have paid and do not have access, a preview, a handover or a receipt you expected, email ${CONTACT.email} or WhatsApp ${CONTACT.whatsapp} with the invoice number. We reply within 3 working days.`],
  },
];
