# GEO / AEO / SEO audit — https://ffdev.studio

Run 2026-09-26 18:58 · 19 pages sampled of 19 in sitemaps · raw HTML only (no JavaScript)

Scores are a triage aid for ordering work, not a KPI. The KPI is measured citation/mention rate (ai_visibility.py).

| Area | Score |
|---|---|
| AI crawler access | 100 |
| Rendering (raw HTML) | 100 |
| Indexability & canonicals | 92 |
| Structured data & entity | 91 |
| Content extractability (AEO) | 97 |
| Trust & E-E-A-T signals | 96 |
| Delivery & performance | 100 |
| Agent operability | 100 |
| International | 100 |
| **Overall** | **79** |

Overall is capped at 49 while any critical finding exists and at 79 while any high finding exists.

## AI crawler access (robots.txt, path `/`)

| Crawler | Purpose | Named in robots.txt | Allowed | Deciding rule |
|---|---|---|---|---|
| Googlebot | search | no | ✅ | `Allow: /` |
| Google-Extended | control | no | ✅ | `Allow: /` |
| Bingbot | search | no | ✅ | `Allow: /` |
| OAI-SearchBot | search | no | ✅ | `Allow: /` |
| ChatGPT-User | user | no | ✅ | `Allow: /` |
| GPTBot | training | no | ✅ | `Allow: /` |
| Claude-SearchBot | search | no | ✅ | `Allow: /` |
| Claude-User | user | no | ✅ | `Allow: /` |
| ClaudeBot | training | no | ✅ | `Allow: /` |
| PerplexityBot | search | no | ✅ | `Allow: /` |
| Perplexity-User | user | no | ✅ | `Allow: /` |
| Applebot | search | no | ✅ | `Allow: /` |
| Applebot-Extended | control | no | ✅ | `Allow: /` |
| meta-webindexer | search | no | ✅ | `Allow: /` |

robots.txt is only the first gate: a CDN/WAF can still 403 these bots. Run `bot_access.py`.

## Findings

### HIGH

- **[Structured data & entity]** Offer is missing required 'price' — 3 page(s): https://ffdev.studio/pricing, https://ffdev.studio/pricing, https://ffdev.studio/pricing

### MEDIUM

- **[Content extractability (AEO)]** Thin server HTML: 66 words — 7 page(s): https://ffdev.studio/, https://ffdev.studio/projects/lewix-ai, https://ffdev.studio/projects/smoothsail …
  - Fix: Add substantive, self-contained content or noindex/merge
- **[Indexability & canonicals]** 19/19 sitemap lastmod values are the same day (2026-09-26) — looks like build time, not content change; engines learn to ignore it — 1 page(s): https://ffdev.studio/sitemap.xml
  - Fix: Emit the real content-modified date

### LOW

- **[Structured data & entity]** Organization could add: sameAs, contactPoint, legalName — 19 page(s): https://ffdev.studio/, https://ffdev.studio/projects/lewix-ai, https://ffdev.studio/about/approach …
- **[Structured data & entity]** Person could add: url, sameAs, image, description, knowsAbout — 19 page(s): https://ffdev.studio/, https://ffdev.studio/projects/lewix-ai, https://ffdev.studio/about/approach …
- **[Structured data & entity]** WebSite could add: alternateName — 19 page(s): https://ffdev.studio/, https://ffdev.studio/projects/lewix-ai, https://ffdev.studio/about/approach …
- **[Trust & E-E-A-T signals]** Email address hidden from crawlers by Cloudflare Email Obfuscation — live AI fetchers can't read the contact email — 18 page(s): https://ffdev.studio/projects/lewix-ai, https://ffdev.studio/about/approach, https://ffdev.studio/pricing …
  - Fix: Turn off Email Obfuscation (Scrape Shield) or also show the address as plain text on the Contact/About page
- **[Content extractability (AEO)]** Heading levels skip (e.g. h2 -> h4); extraction uses the outline — 2 page(s): https://ffdev.studio/about/approach, https://ffdev.studio/about
- **[Structured data & entity]** WebPage could add: about, dateModified, primaryImageOfPage — 2 page(s): https://ffdev.studio/about/approach, https://ffdev.studio/pricing
- **[Trust & E-E-A-T signals]** No Privacy policy page linked from the sampled pages — trust pages are how engines and people verify who is behind a site — 1 page(s): https://ffdev.studio
- **[Structured data & entity]** No BreadcrumbList — 1 page(s): https://ffdev.studio/contact

## Pages

| URL | Type | Status | Words | H2/H3 | Schema | Q-heads | Author | Dates | Issues |
|---|---|---|---|---|---|---|---|---|---|
| https://ffdev.studio/ | home | 200 | 66 | 2 | CollectionPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/lewix-ai | page | 200 | 148 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/about/approach | about | 200 | 258 | 11 | Organization, Person, WebPage, WebSite | 0 | ✓ |  | 6 |
| https://ffdev.studio/pricing | service | 200 | 256 | 11 | Organization, Person, WebPage, WebSite | 0 | ✓ |  | 8 |
| https://ffdev.studio/contact | contact | 200 | 77 | 2 | ContactPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/ff-stanzza | page | 200 | 164 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/about | about | 200 | 220 | 6 | AboutPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/smoothsail | page | 200 | 148 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/meridian | page | 200 | 150 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/ff-search | page | 200 | 176 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/ff-shoots | page | 200 | 159 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/ascend-peptides | page | 200 | 127 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/obys-translation | page | 200 | 144 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/sunlight-supplies | page | 200 | 151 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/lewix-my | page | 200 | 137 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/big-brain-furniture | page | 200 | 159 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/basement-translation | page | 200 | 148 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 5 |
| https://ffdev.studio/projects/big-brain-furniture-alt | page | 200 | 153 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |
| https://ffdev.studio/projects/ff-frames | page | 200 | 169 | 3 | ItemPage, Organization, Person, WebSite | 0 | ✓ |  | 4 |

## Site facts

- home_final: `"https://ffdev.studio"`
- http_redirect: `{"status_chain": [301], "final": "https://ffdev.studio/"}`
- alt_host: `{"host": "www.ffdev.studio", "status": 200, "final": "https://ffdev.studio/", "error": ""}`
- soft404_status: `404`
- markdown_negotiation: `false`
- llms.txt: `{"status": 200, "content_type": "text/plain; charset=utf-8", "bytes": 5418, "h1": true, "links": 19}`
- llms-full.txt: `{"status": 404, "content_type": "text/html; charset=utf-8", "bytes": 15629}`
- sitemap_url_count: `19`

## Not measured here

- JavaScript-rendered content → `node scripts/render_diff.mjs <url>`
- CDN/WAF blocking of AI bots → `python3 scripts/bot_access.py <url>`
- Core Web Vitals field data → PageSpeed Insights / CrUX (references/seo-foundations.md)
- What AI engines actually say about the brand → `python3 scripts/ai_visibility.py`
- Off-site authority (mentions, reviews, Wikipedia/Wikidata, Reddit, YouTube) → references/offsite-authority.md
