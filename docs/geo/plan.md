# GEO / AEO plan — ffdev.studio

Order matters: access, then entity, then answers, then coverage, then off-site. Evidence tags
refer to the geo-aeo skill's `references/evidence.md`.

## Done in the repo (2026-09-26)

| Tier | Change | Why | Verified |
|---|---|---|---|
| P0 | Contact email wrapped in `<!--email_off-->` everywhere it is served | Cloudflare Email Obfuscation showed crawlers `[email protected]` on 18 pages; answer engines could not quote the contact address [proven: fetchers don't run the decode script] | email_off present in built HTML |
| P1 | Organization: `alternateName`, `slogan`, `contactPoint` (sales, EN/Malay, MY), `knowsLanguage`; WebSite `alternateName`; Person `url`, `description`, `knowsAbout` | One connected entity graph with the names people actually type [supported] | built JSON-LD |
| P1 | Pricing bands are `AggregateOffer` (`lowPrice`/`highPrice`) instead of an `Offer` with no price | The only high-severity finding: a range is not a single price | audit: high cleared |
| P1 | Contact page gets a BreadcrumbList | Consistency with every other page | built JSON-LD |
| P2 | Section labels on About, Approach and project pages are `<h2>` (same class, same look); team name `h4` → `h3` | The outline skipped h1 → h3/h4; extraction uses the outline [supported] | computed styles unchanged |
| P2 | Project pages list "Built with" in the facts | A visible, quotable stack fact beside Client/Type/Role | build |
| P3 | **New `/faq` page**: 16 questions buyers and engines ask (cost in Malaysia, what changes the price, timing, types of site, e-commerce, what is included, what to provide, payment, revisions, hosting, ownership, Bahasa Malaysia, SEO, after launch, location, how to start). Answer first, each answer names FF Dev Studio and stands alone. Every fact comes from SERVICE_ARCHITECTURE.md or `PRICING`. Linked from every footer; in the sitemap and llms.txt; `FAQPage` schema that mirrors the text | Coverage of the fan-out sub-queries the site had no passage for [proven: answer engines cite passages that answer the sub-query] | local build: 200, ~1,050 words |
| P4 | Sitemap `lastmod` per route from the git history of the files behind it | A lastmod that moves with every build gets ignored [supported] | sitemap |
| P4 | IndexNow key + `scripts/indexnow.mjs`; `deploy:live` pings it after each production deploy | Bing (which feeds ChatGPT search and Copilot) recrawls within minutes [proven for Bing] | runs after the next deploy |
| P5 | llms.txt gains the Questions page and the full Q&A | Cheap; no proven effect [weak] | built llms.txt |

## Owner actions — see `owner-todo.md`

The biggest remaining levers are off-site (P6) and need Fakhrul: client-site credits, Google
Business Profile, profiles for `sameAs`, Bing Webmaster Tools, and a first visibility wave.

## Deliberately not doing

- **Hidden text for the home page.** The home page is a WebGL grid with 66 words of server HTML;
  padding it with visually hidden prose would be cloaking. The FAQ, About and project pages carry
  the text.
- **Rewriting the pricing page.** Fakhrul settled it as final on 2026-09-26. The "what changes the
  price" content lives on the FAQ instead.
- **Location or service doorway pages** ("web design Penang", "web design JB"…). The studio has
  one location; city pages without a real presence are spam.
- **FAQ schema for rich results.** FAQ rich results ended 2026-05-07. `FAQPage` is used only
  because it is the accurate type for the page.
- **Markdown negotiation / llms-full.txt.** No evidence of effect; revisit if an engine adopts it.
- **Invented case-study numbers.** Project pages stay short until there are real outcomes to add
  (owner-todo).

## Intervention log

| Date | Change | Commit |
|---|---|---|
| 2026-09-26 | Site live on ffdev.studio (FF Phantom) | c35aa00, 44a405d |
| 2026-09-26 | This plan's repo changes (FAQ page, schema, email_off, outline, lastmod, IndexNow) | see git log |
