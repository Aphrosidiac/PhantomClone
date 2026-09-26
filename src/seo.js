// Search and share metadata for every route: title, description, canonical, Open Graph / Twitter
// cards and schema.org JSON-LD. The same function feeds the build-time prerender
// (scripts/prerender.mjs writes it into each route's static HTML) and the client router (which
// swaps it on navigation), so a crawler and a visitor always see the same head.
import { LEGAL_UPDATED_ISO } from './legal.js';
import { PROJECTS, ZONES, PRICING, CONTACT, FAQ, bySlug, media, label, STACK_LABEL } from './data.js';

export const SITE_URL = String(import.meta.env?.VITE_SITE_URL || 'https://ffdev.studio').replace(/\/$/, '');
export const SITE_NAME = 'FF Dev Studio';
const abs = (p) => SITE_URL + p;
const ORG = `${SITE_URL}/#org`;
const WEBSITE = `${SITE_URL}/#website`;
const FOUNDER = `${SITE_URL}/#fakhrul`;
const DEFAULT_IMAGE = { src: '/og.jpg', alt: 'FF Dev Studio — an index of work, shown as a draggable grid' };

// "RM1,000–1,999" → { min: 1000, max: 1999 }; "RM3,500–5,000+" → { min: 3500 } (open-ended).
// The figures are PRICING's own, only re-typed for machines.
const num = (s) => Number(s.replace(/[^\d]/g, ''));
function range(text) {
  const [lo, hi] = text.replace(/^RM/, '').split(/[–-]/);
  return hi && !hi.includes('+') ? { min: num(lo), max: num(hi) } : { min: num(lo) };
}

// the longest candidate that fits in the length search results show (else the last one)
const fit = (max, ...c) => c.find((x) => x.length <= max) || c.at(-1);

const org = () => ({
  '@type': 'Organization',
  '@id': ORG,
  name: SITE_NAME,
  alternateName: ['FF', 'ffdev.studio'],
  legalName: CONTACT.legalName,
  identifier: { '@type': 'PropertyValue', propertyID: 'SSM registration number', value: CONTACT.regNo },
  url: SITE_URL,
  slogan: 'Custom websites, designed and built end to end.',
  logo: { '@type': 'ImageObject', url: abs('/logo.png'), width: 512, height: 512 },
  image: abs(DEFAULT_IMAGE.src),
  description: 'A studio in Kuala Lumpur that designs and builds custom websites for founders and small companies across Malaysia.',
  email: CONTACT.email,
  telephone: CONTACT.wa.replace('https://wa.me/', '+'),
  contactPoint: {
    '@type': 'ContactPoint', contactType: 'sales', email: CONTACT.email, telephone: CONTACT.wa.replace('https://wa.me/', '+'),
    url: abs('/contact'), areaServed: 'MY', availableLanguage: ['English', 'Malay'],
  },
  address: { '@type': 'PostalAddress', addressLocality: 'Kuala Lumpur', addressCountry: 'MY' },
  areaServed: { '@type': 'Country', name: 'Malaysia' },
  founder: { '@id': FOUNDER },
  knowsLanguage: ['en', 'ms'],
  knowsAbout: ['Web design', 'Web development', 'WebGL', 'Three.js', 'Motion design', 'E-commerce', 'Technical SEO'],
});
const founder = () => ({
  '@type': 'Person', '@id': FOUNDER, name: 'Fakhrul', url: abs('/about'), jobTitle: 'Founder · Design · Development',
  description: 'Founder of FF Dev Studio in Kuala Lumpur; designs and builds its websites.', worksFor: { '@id': ORG },
  knowsAbout: ['Web design', 'Frontend development', 'WebGL', 'Motion design'],
});
const website = () => ({ '@type': 'WebSite', '@id': WEBSITE, url: abs('/'), name: SITE_NAME, alternateName: 'ffdev.studio', inLanguage: 'en', publisher: { '@id': ORG } });
// every page's graph starts with the same three nodes, so no @id reference dangles
const core = () => [org(), founder(), website()];
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const webpage = (type, path, title, description, extra = {}) => ({
  '@type': type, '@id': `${abs(path)}#page`, url: abs(path), name: title, description,
  isPartOf: { '@id': WEBSITE }, inLanguage: 'en', ...extra,
});

// The head for one route. `route` is main.js's match() result.
export function seoFor(route) {
  const base = { type: 'website', image: DEFAULT_IMAGE, robots: 'index, follow, max-image-preview:large' };
  switch (route.name) {
    case 'home': {
      const title = 'FF Dev Studio — Custom websites, designed and built in Malaysia';
      const description = 'Custom websites for founders and small companies across Malaysia, designed and built by FF Dev Studio in Kuala Lumpur. See the work running. From RM1,000.';
      return {
        ...base, path: '/', title, description,
        graph: [...core(), webpage('CollectionPage', '/', title, description, {
          about: { '@id': ORG },
          mainEntity: {
            '@type': 'ItemList', numberOfItems: PROJECTS.length,
            itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/projects/${p.slug}`), name: p.title })),
          },
        })],
      };
    }
    case 'project': {
      const p = bySlug(route.slug);
      if (!p) return seoFor({ name: '404' });
      const path = `/projects/${p.slug}`;
      const title = fit(65, `${p.title} — ${p.type} | FF Dev Studio`, `${p.title} — ${p.type}`, `${p.title} | FF Dev Studio`);
      const description = fit(160, `${p.statement} ${p.type} by FF Dev Studio, ${p.year}.`, `${p.statement} By FF Dev Studio, Kuala Lumpur.`, `${p.statement} By FF Dev Studio.`, p.statement);
      const cover = media(p)?.cover;
      const image = { src: `/media/${p.slug}/og.jpg`, alt: cover?.alt || `${p.title} — ${p.type}` };
      return {
        ...base, type: 'article', path, title, description, image,
        graph: [...core(), webpage('ItemPage', path, title, description, {
          primaryImageOfPage: { '@type': 'ImageObject', url: abs(image.src), width: 1200, height: 630 },
          breadcrumb: crumbs([['Work', '/'], [p.title, path]]),
          mainEntity: {
            '@type': 'CreativeWork',
            name: p.title,
            headline: p.statement,
            description: p.about.join(' '),
            url: p.url,
            genre: p.type,
            dateCreated: String(p.year),
            creator: { '@id': ORG },
            ...(p.client !== SITE_NAME ? { sourceOrganization: { '@type': 'Organization', name: p.client } } : {}),
            ...(p.reference ? { isBasedOn: `https://${p.reference}` } : {}),
            keywords: [ZONES[p.zone].name, ...p.features.map((f) => label(f)), ...p.stack.map((s) => label(s, STACK_LABEL))].join(', '),
            image: cover ? abs(cover.src) : abs(image.src),
          },
        })],
      };
    }
    case 'about': {
      if (route.tab === 'approach') {
        const path = '/about/approach';
        const title = 'Approach — nine steps from brief to launch | FF Dev Studio';
        const description = 'How FF Dev Studio builds a website: a written proposal before anything starts, three revision rounds, checks on real devices, and a thirty-day defect warranty.';
        return { ...base, path, title, description, graph: [...core(), webpage('WebPage', path, title, description, { breadcrumb: crumbs([['About', '/about'], ['Approach', path]]) })] };
      }
      const path = '/about';
      const title = 'About — one studio in Kuala Lumpur | FF Dev Studio';
      const description = 'FF Dev Studio designs and builds custom websites in Kuala Lumpur: research catalogues, store builders, wedding platforms and AI products across Malaysia.';
      return { ...base, path, title, description, graph: [...core(), webpage('AboutPage', path, title, description, { about: { '@id': ORG }, breadcrumb: crumbs([['About', path]]) })] };
    }
    case 'pricing': {
      const path = '/pricing';
      const title = 'Website pricing in Malaysia, from RM1,000 | FF Dev Studio';
      const description = 'Custom websites from RM1,000: focused builds RM1,000–1,999, full brand websites RM2,000–3,499, signature experiences RM3,500–5,000+. Care plans from RM59 a month.';
      const offers = [
        ...PRICING.bands.map((b) => {
          const r = range(b.range);
          return {
            '@type': 'AggregateOffer', name: b.name, description: `${b.line} ${b.days}.`, priceCurrency: 'MYR',
            lowPrice: r.min, ...(r.max ? { highPrice: r.max } : {}),
            priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'MYR', minPrice: r.min, ...(r.max ? { maxPrice: r.max } : {}) },
          };
        }),
        ...PRICING.care.map((c) => ({
          '@type': 'Offer', name: `${c.name} care plan`, description: c.line, price: num(c.price), priceCurrency: 'MYR',
          priceSpecification: { '@type': 'UnitPriceSpecification', price: num(c.price), priceCurrency: 'MYR', unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } },
        })),
      ];
      return {
        ...base, path, title, description,
        graph: [...core(), webpage('WebPage', path, title, description, {
          breadcrumb: crumbs([['Pricing', path]]),
          mainEntity: {
            '@type': 'Service', name: 'Custom website design and development', serviceType: 'Web design and development',
            provider: { '@id': ORG }, areaServed: { '@type': 'Country', name: 'Malaysia' },
            termsOfService: PRICING.terms,
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Estimating bands and care plans', itemListElement: offers },
          },
        })],
      };
    }
    case 'contact': {
      const path = '/contact';
      const title = 'Start a project — contact FF Dev Studio';
      const description = `Tell FF Dev Studio about your website: a seven-question brief, sent by email or WhatsApp. ${CONTACT.email} · WhatsApp ${CONTACT.whatsapp}.`;
      return { ...base, path, title, description, graph: [...core(), webpage('ContactPage', path, title, description, { about: { '@id': ORG }, breadcrumb: crumbs([['Contact', path]]) })] };
    }
    case 'privacy':
    case 'cookies': {
      const path = `/${route.name}`;
      const [title, description, name] = route.name === 'privacy'
        ? ['Privacy notice | FF Dev Studio', 'What ffdev.studio collects, why, who handles it and your rights under Malaysia’s Personal Data Protection Act 2010. Run by FF DEV STUDIO (SSM 202603234793).', 'Privacy']
        : ['Cookies | FF Dev Studio', 'The cookies and browser storage ffdev.studio uses, what each is for and how long it is kept. Analytics only with your consent; change your choice here.', 'Cookies'];
      return { ...base, path, title, description, graph: [...core(), webpage('WebPage', path, title, description, { about: { '@id': ORG }, dateModified: LEGAL_UPDATED_ISO, breadcrumb: crumbs([[name, path]]) })] };
    }
    case 'faq': {
      const path = '/faq';
      const title = 'Website questions: cost, timing, ownership | FF Dev Studio';
      const description = 'What a custom website costs in Malaysia, how long it takes, what is included, who owns it and what happens after launch — answered by FF Dev Studio.';
      // FAQPage mirrors the visible questions and answers word for word (no rich result is expected; it is the accurate type)
      const text = (f) => [...f.a, ...(f.list ? [f.list.join('; ') + '.'] : []), ...(f.after ? [f.after] : [])].join(' ');
      return {
        ...base, path, title, description,
        graph: [...core(), webpage('FAQPage', path, title, description, {
          about: { '@id': ORG }, breadcrumb: crumbs([['Questions', path]]),
          mainEntity: FAQ.map((f) => ({ '@type': 'Question', '@id': `${abs(path)}#${f.id}`, name: f.q, acceptedAnswer: { '@type': 'Answer', text: text(f) } })),
        })],
      };
    }
    default:
      return { ...base, path: null, title: 'Page not found | FF Dev Studio', description: 'This page does not exist. The work, studio and pricing are one click away.', robots: 'noindex, follow', graph: null };
  }
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// The head tags, each marked data-seo so the router can replace the set on navigation.
export function headTags(s) {
  const t = [
    ['meta', { name: 'description', content: s.description }],
    ['meta', { name: 'robots', content: s.robots }],
    s.path && ['link', { rel: 'canonical', href: abs(s.path) }],
    ['meta', { property: 'og:type', content: s.type }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:locale', content: 'en_MY' }],
    ['meta', { property: 'og:title', content: s.title }],
    ['meta', { property: 'og:description', content: s.description }],
    s.path && ['meta', { property: 'og:url', content: abs(s.path) }],
    ['meta', { property: 'og:image', content: abs(s.image.src) }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: s.image.alt }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: s.title }],
    ['meta', { name: 'twitter:description', content: s.description }],
    ['meta', { name: 'twitter:image', content: abs(s.image.src) }],
    ['meta', { name: 'twitter:image:alt', content: s.image.alt }],
  ].filter(Boolean).map(([tag, a]) => `<${tag} data-seo ${Object.entries(a).map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ')}>`);
  if (s.graph) t.push(`<script data-seo type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': s.graph }).replace(/</g, '\\u003c')}</script>`);
  return t.join('\n  ');
}

// client side: swap the head for the current route
export function applySeo(route) {
  const s = seoFor(route);
  document.title = s.title;
  document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
  document.head.querySelector('title').insertAdjacentHTML('afterend', headTags(s));
}
