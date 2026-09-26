# Owner to-do — only Fakhrul can do these

Ordered by expected effect. Nothing here has been done on his behalf.

## 1. Get FF named on the sites it built (biggest single lever)

None of lewix.ai, smoothsail.my, ascendpeptides.my or lewix.my names or links FF Dev Studio
(`presence.txt`). A "Site by FF Dev Studio" footer credit linking to the project page
(for example `https://ffdev.studio/projects/smoothsail`) on each is a real, earned mention from
an established domain. Check with each client first; LEWIX sites are Lewix.ai's call.

## 2. Profiles that confirm the entity

- **Google Business Profile** as a service-area business (Kuala Lumpur, no public address). It is
  the main source for "web designer near me" and Maps answers.
- **Bing Places** (imports from GBP) and **Bing Webmaster Tools** (import from Search Console in
  one click). BWT's AI Performance report shows which queries ground Copilot answers on the site.
- **LinkedIn company page, Instagram, TikTok** (the acquisition plan's channels). Once each exists
  and uses the same name, description and URL, send the URLs and they go into the Organization
  `sameAs` in `src/seo.js`. None were added now because none were confirmed.

## 3. Facts to confirm or supply

- **[NEEDS SOURCE] Registered business name** (SSM) for Organization `legalName`.
- **Confirm:** the FAQ says projects run over WhatsApp and email, so clients do not need to be in
  Kuala Lumpur. That is inferred from the process, not stated in SERVICE_ARCHITECTURE.
- **Confirm:** the ownership answer uses SERVICE_ARCHITECTURE's "recommended default"; if the
  proposals say something different, the FAQ must change.
- **[NEEDS SOURCE] Case-study outcomes** — for any project where a real result exists (launch
  date, speed, sales, enquiries, the client's own words with permission), add it to the project's
  `about` in `src/data.js`. Project pages are 130–180 words today.

## 4. Decisions

- **Training crawlers** (GPTBot, ClaudeBot, CCBot, Google-Extended) are all allowed. That is the
  right default for a studio that wants to be known; say if you want them blocked.
- **Cloudflare Email Obfuscation** is still on for the zone. The site opts out with
  `email_off`, so no change is needed; turning it off in Scrape Shield would also work.
- **Privacy page.** Legal pages are parked. The contact overlay already states no cookies and no
  analytics; a short `/privacy` page would make that citable. Your call.
- **Bahasa Malaysia version** of the FAQ and pricing. Malaysian searches in BM are real
  (`prompts_v1.csv` p003); a translation needs your register (colloquial, not baku).

## 5. Measure

Fill `visibility/manual-2026-09-26/manual.csv` in logged-out ChatGPT, Perplexity, Gemini and AI
Mode (or provide API keys and run `ai_visibility.py`). Then repeat every 4 weeks on the same
prompt set — see `measurement.md`.

## 6. Deploy

The repo changes are committed and pushed, not deployed. `npm run deploy:live` ships them and
pings IndexNow.
