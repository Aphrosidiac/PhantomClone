// FF Dev Studio work — the content model the grid, list, filter and project pages share.
// Facts come from ff-portfolio's data/projects.json (the live ffdev.studio); prose is FF's voice.
import SHOTS from './shots.json';

export const ZONES = {
  client: { name: 'Client', blurb: 'Our focus on – clarity, trust and conversion.', line: 'Sites for businesses that sell something real, built so the product reads before the pitch.' },
  product: { name: 'Product', blurb: 'Our focus on – utility, scale and function.', line: 'Product sites and systems where the interface itself is the argument.' },
  study: { name: 'Study', blurb: 'Our focus on – measurement, motion and craft.', line: 'Award-level sites rebuilt to the pixel, to prove the motion can be matched, not approximated.' },
};

export const PROJECTS = [
  // plate: the backdrop the project page's screenshots sit on (picked from each site's own palette)
  {
    slug: 'ff-search', title: 'FF Search', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#1f1f1f',
    features: ['website', 'motion', 'measurement'], stack: ['vite', 'gsap'], url: 'https://ff-search-b4q.pages.dev/',
    type: 'Executive search site, recreation', role: 'Frontend / Motion / Measurement', reference: 'aspensearch.com',
    statement: 'A search firm’s site rebuilt to the pixel, then re-cast in the studio’s own words.',
    about: [
      'An executive-search website measured from the reference rather than eyeballed: type scale, spacing rhythm and every easing curve extracted from the live page, then rebuilt in our own code.',
      'The copy was rewritten for FF throughout, and the team and testimonials are fictional — the point of the study was the craft of the page, not borrowing anyone’s credentials.',
    ],
  },
  {
    slug: 'ff-shoots', title: 'FF Shoots', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#8f1d17',
    features: ['webgl', 'motion', 'ai', 'gesture'], stack: ['next', 'three', 'gsap'], url: 'https://ff-shoots.pages.dev/',
    type: 'WebGL photography portfolio, recreation', role: 'WebGL / Motion / Gesture control', reference: 'remyshoots.co.za',
    statement: 'A photographer’s slider rebuilt one to one, fisheye lens and hand gestures included.',
    about: [
      'A WebGL image slider with a fisheye lens pass, rebuilt from scratch in React Three Fiber and matched frame for frame against the original.',
      'The camera gesture mode runs MediaPipe hand tracking in the browser, so a visitor can swipe through the work without touching anything.',
    ],
  },
  {
    slug: 'ff-stanzza', title: 'FF Stanzza', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#5f6b3b',
    features: ['website', 'motion', 'interaction'], stack: ['vite', 'gsap', 'lenis'], url: 'https://ff-stanzza.pages.dev/',
    type: 'Design studio landing page, recreation', role: 'Frontend / Motion / Webflow interactions', reference: 'stanzza.design',
    statement: 'A Webflow awards page rebuilt outside Webflow, every scroll timeline and dropdown intact.',
    about: [
      'Webflow’s interaction engine was read out of the page bundle — easing table, tween types, breakpoints — and re-implemented as a small runner of our own.',
      'Every pinned scrub, text split and dropdown behaves as it did on the reference, compared side by side in a real browser rather than in screenshots.',
    ],
  },
  {
    slug: 'ff-frames', title: 'FF Frames', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#e6e0d4',
    features: ['website', 'motion', 'photography'], stack: ['astro', 'gsap', 'lenis'], url: 'https://ff-frames.pages.dev/',
    type: 'Photography portfolio, recreation', role: 'Frontend / Motion / Astro', reference: 'ethanwong.photography',
    statement: 'Twenty-four routes of a photographer’s site, rebuilt one to one, pricing calculator included.',
    about: [
      'A full photography portfolio — galleries, journal, services and a working package calculator — rebuilt route by route in Astro.',
      'Static by default, animated only where the reference was, and fast enough to feel like a single page.',
    ],
  },
  {
    slug: 'sunlight-supplies', title: 'Sunlight Supplies', client: 'Sunlight Supplies', zone: 'client', year: 2026, plate: '#f4d6ae',
    features: ['website', '3d', 'brand'], stack: ['next', 'three'], url: 'https://ff-sunlight.pages.dev/',
    type: 'Industrial marketing site', role: 'Art direction / Frontend / 3D',
    statement: 'Pallet racking and display fixtures, rendered in three.js rather than photographed.',
    about: [
      'Racking is hard to photograph well and easy to model precisely, so the site shows the product as live 3D: beams, frames and bays assembled on scroll.',
      'The result explains load, height and configuration faster than a catalogue page ever did.',
    ],
  },
  {
    slug: 'lewix-ai', title: 'LEWIX AI', client: 'LEWIX AI', zone: 'product', year: 2026, plate: '#2a2466',
    features: ['website', 'webgl', 'motion'], stack: ['next', 'three', 'gsap'], url: 'https://lewix.ai/',
    type: 'Company website', role: 'Art direction / Frontend / WebGL',
    statement: 'A one-page site carried by a single generative environment instead of a stack of sections.',
    about: [
      'One WebGL environment runs the whole page. Scrolling moves the camera through it, and every section is a place in that world rather than a new block of layout.',
      'The effect is a company that reads as technically serious before a single capability is listed.',
    ],
  },
  {
    slug: 'smoothsail', title: 'SmoothSail', client: 'LEWIX AI', zone: 'product', year: 2026, plate: '#cfe4da',
    features: ['platform', 'e-commerce', 'website'], stack: ['next', 'postgres'], url: 'https://smoothsail.my/',
    type: 'Product site & store builder', role: 'Product design / Frontend / Architecture',
    statement: 'A store builder for Malaysian sellers, sold on real interface states rather than a feature list.',
    about: [
      'A multi-tenant store builder: storefronts, checkout, shared stock across channels and an AI studio that proposes changes a seller can apply or undo.',
      'The marketing site shows the real product in its real states — no mock dashboards drawn for the occasion.',
    ],
  },
  {
    slug: 'big-brain-furniture', title: 'Big Brain Furniture', client: 'TGS Furnishings', zone: 'client', year: 2026, plate: '#3a2f26',
    features: ['website', 'e-commerce', 'brand'], stack: ['next'], url: 'https://bbf.lewix.ai/',
    type: 'Retail website', role: 'Art direction / Design system / Frontend',
    statement: 'Reclaimed teak, presented as a catalogue that treats the material as the whole design.',
    about: [
      'Warm grounds, generous crops and a catalogue structure that lets the grain of each piece do the selling.',
      'Built on a small design system so the team can add ranges without the site drifting.',
    ],
  },
  {
    slug: 'ascend-peptides', title: 'Ascend Peptides', client: 'Ascend Peptides', zone: 'client', year: 2026, plate: '#233a73',
    features: ['e-commerce', 'website', 'seo'], stack: ['next', 'postgres'], url: 'https://ascendpeptides.my/',
    type: 'E-commerce', role: 'Design / Frontend / Commerce / SEO',
    statement: 'A research catalogue where the product needs precision, not persuasion.',
    about: [
      'A commerce site built around specification: purity, form, storage and documentation first, price second.',
      'Structured data and clean page architecture carry it in search without a single inflated claim.',
    ],
  },
  {
    slug: 'lewix-my', title: 'Lewix', client: 'LEWIX AI', zone: 'product', year: 2026, plate: '#c9d0f2',
    features: ['website', 'motion', 'brand'], stack: ['next', 'gsap'], url: 'https://lewix.my/',
    type: 'Company website', role: 'Art direction / Design / Frontend / Motion',
    statement: 'The front door of an AI product studio, built to read as capable before a feature is described.',
    about: [
      'Motion does the introducing: each product arrives with its own small system of movement, so the studio’s range shows before it is explained.',
      'Server-rendered, self-hosted and quick on a phone.',
    ],
  },
  {
    slug: 'meridian', title: 'Meridian', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#a14d33',
    features: ['webgl', 'interaction', 'motion'], stack: ['vite', 'three'], url: 'https://ff-meridian.pages.dev/',
    type: 'WebGL portfolio engine', role: 'WebGL / Interaction engineering / Motion', reference: 'aristidebenoist.com',
    statement: 'The engine ffdev.studio runs on, rebuilt from nothing. No code, no assets and no copy taken from it.',
    about: [
      'A clean-room WebGL portfolio engine: one build on desktop and phone, sized to the scarce axis, with a flat fallback when WebGL is unavailable.',
      'It is what the live FF site runs on today.',
    ],
  },
  {
    slug: 'big-brain-furniture-alt', title: 'Big Brain, second direction', client: 'TGS Furnishings', zone: 'client', year: 2026, plate: '#d9c9b3',
    features: ['website', 'strategy'], stack: ['next'], url: 'https://ff-bbf-alt.pages.dev/',
    type: 'Retail site, alternate structure', role: 'Art direction / Information architecture',
    statement: 'The same brief structured a second way, so the choice could be made by looking, not arguing.',
    about: [
      'Rather than debate two directions in a meeting, both were built. The client chose with the real thing open in two tabs.',
      'Cheaper than it sounds when the design system is shared.',
    ],
  },
  {
    slug: 'obys-translation', title: 'Obys translation', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#1c1c1c',
    features: ['interaction', 'motion'], stack: ['vite', 'gsap'], url: 'https://ff-concepts.pages.dev/concepts/02/',
    type: 'Interaction study', role: 'Interaction engineering / Measurement', reference: 'obys.agency',
    statement: 'Three layout modes, a flip tumble between them, and a page that never scrolls.',
    about: [
      'A study in FLIP transitions: the same set of cards re-flows between grid, list and stack, each element tumbling from where it was to where it lands.',
      'Measured across every state, not just the one on the first screen.',
    ],
  },
  {
    slug: 'basement-translation', title: 'Basement translation', client: 'FF Dev Studio', zone: 'study', year: 2026, plate: '#d8d4ca',
    features: ['interaction', 'type'], stack: ['vite'], url: 'https://ff-concepts.pages.dev/concepts/01/',
    type: 'Interaction study, unfinished', role: 'Interaction engineering / Type system', reference: 'basement.studio',
    statement: 'Pure black, one weight throughout. Unfinished, and shown that way rather than dressed up.',
    about: [
      'A type-system study: one weight, one colour, all hierarchy from size and spacing.',
      'Left unfinished on purpose — the parts that work are the point, and the parts that do not are labelled.',
    ],
  },
];

export const FEATURE_LABEL = { '3d': '3D', ai: 'AI', seo: 'SEO', webgl: 'WebGL', 'e-commerce': 'E-commerce' };
export const STACK_LABEL = { next: 'Next.js', vite: 'Vite', astro: 'Astro', three: 'Three.js', gsap: 'GSAP', lenis: 'Lenis', postgres: 'Postgres' };
export const label = (k, map = FEATURE_LABEL) => map[k] || k.charAt(0).toUpperCase() + k.slice(1);

const uniq = (a) => [...new Set(a)].sort();
export const FILTERS = {
  zones: Object.keys(ZONES),
  features: uniq(PROJECTS.flatMap((p) => p.features)),
  stack: uniq(PROJECTS.flatMap((p) => p.stack)),
  clients: uniq(PROJECTS.map((p) => p.client)),
};

export const bySlug = (s) => PROJECTS.find((p) => p.slug === s);
export const tileUrl = (p) => `/media/${p.slug}/tile.jpg`;
// project-page media: cover + rows, captured from the live sites by tools/shots.mjs
export const media = (p) => SHOTS[p.slug];

export function matches(p, f) {
  if (f.zones.length && !f.zones.includes(p.zone)) return false;
  if (f.features.length && !f.features.some((x) => p.features.includes(x))) return false;
  if (f.stack.length && !f.stack.some((x) => p.stack.includes(x))) return false;
  if (f.clients.length && !f.clients.includes(p.client)) return false;
  return true;
}

export const CONTACT = {
  email: 'hello@ffdev.studio',
  whatsapp: '+60 13 907 8719',
  wa: 'https://wa.me/60139078719',
  city: 'Kuala Lumpur, MY',
  tz: 'Asia/Kuala_Lumpur',
};

// From ffdevstudio/SERVICE_ARCHITECTURE.md — do not invent tiers or figures.
export const PRICING = {
  bands: [
    { name: 'Focused build', range: 'RM1,000–1,999', days: '2–5 working days', line: 'A landing page, campaign page, portfolio or compact business presence. Custom and polished — the lower price comes from limited breadth, not less care.' },
    { name: 'Full brand website', range: 'RM2,000–3,499', days: '4–8 working days', line: 'A multipage website, content-managed site, richer narrative, booking integration or more involved motion.' },
    { name: 'Signature experience', range: 'RM3,500–5,000+', days: 'One week or longer', line: 'E-commerce, extensive content, original interactive direction, advanced motion, 3D and WebGL.' },
  ],
  care: [
    { name: 'Care', price: 'RM59/month', year: 'RM590/year', line: 'Managed hosting, SSL and CDN, uptime monitoring, backups, security and dependency maintenance.' },
    { name: 'Maintain', price: 'RM149/month', year: 'RM1,490/year', line: 'Everything in Care, plus up to 60 minutes of small changes a month and priority WhatsApp support.', note: 'The one most take' },
    { name: 'Evolve', price: 'RM299/month', year: 'RM2,990/year', line: 'Everything in Maintain, plus up to three hours of improvements a month and a quarterly recommendation.' },
  ],
  terms: '50% to begin, 50% before launch. Thirty-day defect warranty.',
};
