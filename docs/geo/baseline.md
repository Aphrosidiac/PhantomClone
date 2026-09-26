# GEO / AEO baseline — ffdev.studio, 2026-09-26

The site went live as FF Phantom the same day, so this is a day-zero baseline: the site is
technically sound and almost unknown.

## Measured

| Check | Result | How |
|---|---|---|
| audit.py (live, 19 URLs) | **79/100**, 0 critical, 3 high (all one issue: pricing bands as `Offer` without `price`) | `audit/audit.md` |
| AI crawler access (robots) | All 14 crawlers allowed, incl. GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended | audit.py |
| CDN/WAF | Every bot UA gets 200 and the same bytes as a browser, on `/` and `/pricing` | `bot_access.txt` |
| Rendering | 0–1.6% of main content needs JavaScript on home, a project, About and Pricing | `render.json` |
| Status codes | Real 404, 308 on trailing slash, www → apex 301, old `/<slug>` → 301 | audit.py + curl |
| Email visibility | **Cloudflare Email Obfuscation replaced `hello@ffdev.studio` with `[email protected]` on 18 pages** | curl |
| Content depth | Home 66 words (it is a WebGL grid); project pages 127–176 words; no page answers a question in question form | audit.py |
| Coverage | No page for cost / timing / ownership / language / hosting questions beyond the pricing table | manual review |
| Common Crawl | 0 captures in the last 3 indexes; no Wayback history | `presence.txt` |
| Back-mentions | lewix.ai, smoothsail.my, ascendpeptides.my, lewix.my: none name or link FF Dev Studio | `presence.txt` |

## Not measured

- **What AI engines say about FF Dev Studio.** No OpenAI, Gemini, Perplexity or SerpApi keys
  are on this machine, so `ai_visibility.py` could not run. A fill-in sheet for a logged-out
  sample is ready at `visibility/manual-2026-09-26/manual.csv` (40 prompts from
  `prompts_v1.csv` × ChatGPT, Perplexity, Gemini, AI Mode). Given zero crawl history and zero
  inbound mentions, the expected answer today is "not mentioned"; that is inference, not a
  measurement.
- Search Console: the Domain property was created on 2026-09-26; no query or AI data yet.
- Bing Webmaster Tools, GA4, CrUX field data: none set up (the site runs no analytics by design).
- Server logs: Cloudflare Pages keeps none on this plan.
