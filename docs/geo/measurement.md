# Measurement — ffdev.studio

- **Prompt set:** `prompts_v1.csv` (40 prompts: discovery, best-for, comparison, brand). Freeze it
  when wave 0 runs; add prompts only as a new version.
- **Engines:** ChatGPT, Perplexity, Gemini, Google AI Mode. Logged-out, fresh chat per prompt,
  Malaysia locale, 3 runs each (answers vary run to run).
- **Wave 0:** `visibility/manual-2026-09-26/manual.csv`, then
  `python3 ~/.claude/skills/geo-aeo/scripts/ai_visibility.py --ingest-manual docs/geo/visibility/manual-2026-09-26`.
  With API keys, run the tracker instead (`--runs 3`).
- **Cadence:** every 4 weeks. Report mention rate and citation rate with confidence intervals per
  stratum; "no detectable change" is a valid result.
- **Also every wave:** Search Console (pages indexed, queries, the Generative AI report), Bing
  Webmaster Tools AI Performance once connected, `presence.py` for Common Crawl and back-mentions,
  and `audit.py https://ffdev.studio` to catch regressions.
- **Expected lags:** Bing and Perplexity days to weeks; Google AI surfaces 2–8 weeks; built-in
  model knowledge months.
