# Owner to-do — only Fakhrul can do these

Ordered by expected effect. Nothing here has been done on his behalf.

## 1. Get FF named on the sites it built (biggest single lever)

None of these sites names or links FF Dev Studio (`presence.txt`, checked 2026-09-26):

| Site | Footer today | Credit links to | Whose call |
|---|---|---|---|
| ascendpeptides.my | Ascend MY disclaimer, shop links | `https://ffdev.studio/projects/ascend-peptides` | Ascend MY (the cleanest case: a separate client) |
| smoothsail.my | "© 2026 SmoothSail, a Lewix.ai product." | `/projects/smoothsail` | Lewix.ai |
| lewix.ai | "© 2026 Lewix AI Sdn Bhd … Engineered in Malaysia" | `/projects/lewix-ai` | Lewix.ai |
| lewix.my | "Engineered in Malaysia · Est. 2026" | `/projects/lewix-my` | Lewix.ai — LEWIX sells software services itself, so a studio credit may not fit its positioning |

How to do it:
- One visible line in the footer, e.g. "Site by FF Dev Studio", linking to that project's page. Readable
  like the other footer text — not tiny, not faded out, not hidden.
- Anchor text is the brand name. Never a keyword anchor ("web design Malaysia"): keyword-rich
  footer links on client sites are a named link scheme in Google's spam policies.
- A normal link is fine for a genuine credit with a brand anchor.
- Optional: the site's WebSite JSON-LD gets `"creator": {"@type": "Organization", "name": "FF Dev
  Studio", "url": "https://ffdev.studio"}` — the same statement for machines.
- From now on, make the credit a default line in every proposal (the client can opt out).

Verify: `python3 ~/.claude/skills/geo-aeo/scripts/presence.py ffdev.studio --brand "FF Dev Studio"
--check <site>` shows NAME+LINK; Common Crawl captures of ffdev.studio should follow within a crawl or two.

## 2. Profiles that confirm the entity — PENDING (Fakhrul, 2026-09-26)

Parked until Fakhrul sets them up; `sameAs` stays empty until then.

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
