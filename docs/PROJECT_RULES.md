# Project rules (for the coding assistant)

Read this before writing any code or data for this project. If you use Claude Code, you can rename this file to `CLAUDE.md`; for GitHub Copilot, copy it to `.github/copilot-instructions.md`.

## What this project is

A static dashboard (GitHub Pages) plus a Python data pipeline that maps armed-group control of mining sites and traces the supply chain from those sites to buyers, with impacts and regulatory responses. First case: Rwanda / eastern DRC. Read `README.md` and `BUILD_PLAN.md` first.

## Sourcing and evidence

1. **No unsourced records.** Every row in every data file has `source_ids` (one or more) pointing to the `sources` table. No source → don't add the row.
2. **Every claim has a date.** Use `observed_date` (when the thing was true) and `source_date` (when it was published). Control claims also need `valid_from` / `valid_to` where known.
3. **Every claim has an evidence tier:**
   - `designated` — named in a government sanctions or enforcement action (OFAC, EU, UN)
   - `documented` — UN Group of Experts report, or an investigative NGO report with stated evidence (Global Witness, Amnesty, IPIS, The Sentry)
   - `reported` — media reporting
   - `inferred` — our own analysis (trade anomalies, network proximity). Must say how it was inferred.
4. **Never upgrade a tier.** An NGO allegation is `documented`, not `designated`. Our trade anomaly is `inferred`, not evidence of smuggling. UI copy must match the tier ("alleged by", "designated by", "our analysis suggests").
5. **Record denials.** Where a named party has publicly denied a claim (e.g. Rwanda denies supporting M23), store it in `responses_to_claims` and show it next to the claim.
6. **Don't reproduce copyrighted text.** Store short paraphrased summaries and links, not article text.

## Sayari

7. **Entity resolution is a same-legal-entity judgment, not name matching.** Before linking a Sayari entity to our record, check country, identifiers, address, and relationships. Store the Sayari `entity_id` and the reason for the match.
8. **"PSA" (possibly-same-as) links are weak.** Any risk flag prefixed `psa_` must be shown as lower confidence.
9. **Filter traversals by relationship type.** Unfiltered depth-2 traversals from sanctioned nodes explode into hundreds of unrelated trade counterparties and every sanctioned figure linked to M23. Use explicit relationship filters (`shareholder_of`, `director_of`, `legal_representative_of`, `ships_to`, `receives_from`) and cap depth at 2. See `SAYARI_METHOD.md`.
10. **Trade data is customs data, not proof of origin.** A shipment of HS 261590 from Rwanda tells us who shipped and who received, not where it was mined.
11. Always store and display the Sayari `entity_url` so users can verify in Sayari Graph.

## Tavily

12. Use Tavily for discovery and freshness (new designations, new NGO reports, control changes). A Tavily result is a lead; add it to `sources` only after reading the page with `tavily_extract`.

## Code and repo

13. **Secrets:** Sayari and Tavily API keys live in `.env` (gitignored). Never commit keys, never write them into front-end code. The public site only reads pre-built JSON.
14. **Pipeline outputs are committed JSON/GeoJSON in `/data`.** The front end never calls Sayari or Tavily directly.
15. Keep this repo separate from Paper Trail. You may read Paper Trail's code as a reference for patterns (Sayari MCP calls, trade anomaly logic, Pages deployment), but don't import from it.
16. Prefer plain, readable code: Python for the pipeline, vanilla JS or a light framework for the site, MapLibre/Leaflet for maps, D3 for flows.
17. Accessibility: don't encode evidence tier by colour alone; use a pattern, icon or label too.

## When unsure

Leave the field null, add a `notes` entry explaining what's missing, and surface it as a visible data gap in the UI. A visible gap is better than a confident wrong answer.
