# Ground Control (working title)

**Who controls the mine, where do its minerals go, and has anyone done anything about it — and did it work?**

A dashboard and investigation tool that maps armed-group control of mining sites, traces the minerals from those sites through traders, exporters, smelters and buyers, shows the human impacts along the way, and evaluates the regulatory responses (government and corporate) aimed at breaking that chain.

First case: **Rwanda / eastern DRC (M23, Rubaya coltan, South Kivu gold)**. Further cases (Myanmar rare earths, Sahel/Sudan gold, Colombia/Venezuela gold) are added later using the same data model.

---

## Audience

The tool serves two users from the same data:

| User | Their question | What they need from the tool |
|---|---|---|
| **Analyst** (compliance, due diligence, investigator) | "Is my supplier / smelter / counterparty exposed to armed-group-controlled minerals?" | Entity search, network paths from a company back to a controlled site, sanctions and risk flags, trade flows, source evidence for every link |
| **Policymaker** (government, multilateral, NGO) | "Who controls what, what's been done about it, and is it working?" | Map of control over time, timeline of regulatory actions, before/after indicators (export volumes, prices, revenue to armed groups, buyer behaviour) |

## The four layers

1. **Control** — which armed group (or state force acting alongside one) controls, taxes or is present at which mining site, which mineral, since when, according to whom.
2. **Supply chain** — mine → trading centre → border crossing → exporter → transit port → smelter/refiner → component maker → brand.
3. **Impacts** — attached to each stage: forced and child labour, deaths (e.g. Rubaya landslides), displacement, violence events, revenue captured by the armed group, the "laundering gap" (a transit country exporting more than it could plausibly mine).
4. **Response** — split into:
   - *Outside the company:* sanctions (US OFAC, EU, UN), import restrictions, due diligence laws, peace agreements with minerals clauses.
   - *Inside the company / industry:* traceability scheme suspensions (ITSCI), smelter audit status (RMI), supplier exits, disclosures, lawsuits.
   - *Effectiveness:* for each response, the indicators that should move if it worked, and whether they did.

## Design principles (non-negotiable)

- **Every claim is sourced and dated.** Control is contested and changes fast. No map pin, link or impact appears without a source, a date, and a confidence level.
- **Allegation ≠ fact.** Distinguish *designated* (sanctioned by a government), *documented* (UN Group of Experts, investigative NGO with evidence), *reported* (media), and *inferred* (our own analysis, e.g. trade anomalies). Show the distinction visually.
- **Sayari confirms and extends; it doesn't invent.** See [`SAYARI_METHOD.md`](docs/SAYARI_METHOD.md). Ownership links to armed groups come mostly from sanctions designations; for unsanctioned companies, links come from UN/NGO evidence and trade data.
- **Show the gaps.** Where data runs out (e.g. no Rwandan corporate registry ownership in Sayari), say so on screen.

## Relationship to Paper Trail

This is a **separate project** from Paper Trail (the battery-mineral rerouting Sayari demo for Beyond the Brand). Keep a separate repo and codebase.

**Use Paper Trail as a reference example while building**, specifically:
- its Sayari MCP + Tavily workflow and project structure
- its trade-rerouting / origin-anomaly logic, which is the basis for the laundering-gap indicator here
- its GitHub Pages deployment setup

Don't copy its framing or UI wholesale; this project is anchored on *control and conflict*, not rerouting.

## Docs (in `docs/`)

| File | What it covers |
|---|---|
| `README.md` | This overview |
| [`PROJECT_RULES.md`](docs/PROJECT_RULES.md) | Rules for the coding assistant (sourcing, confidence, entity resolution, secrets) |
| [`DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Ranked sources for control, supply chain, impacts and responses, with access notes |
| [`SAYARI_METHOD.md`](docs/SAYARI_METHOD.md) | How to trace mine owners and buyers to armed groups with Sayari — tested, with what works and what doesn't |
| [`RWANDA_CASE.md`](docs/RWANDA_CASE.md) | Case content: actors, sites, flows, regulatory timeline, seed entities with Sayari IDs |
| [`BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Data model, architecture, views, phased build plan |

## Repo layout

```
docs/            spec files (rules, sources, Sayari method, case, build plan)
pipeline/seed/   hand-curated, sourced tables (the only place data is edited)
pipeline/notes/  research logs: Sayari entity resolution, Tavily source checks
pipeline/build.py  validates the seed against PROJECT_RULES and writes /data
data/            built JSON / GeoJSON — the only thing the site reads
site/            static front end (Leaflet map, response tracker, gaps, sources)
```

## Running it

```bash
python3 pipeline/build.py          # validate seed + write /data (fails on unsourced rows)
python3 -m http.server 8000        # from the repo root, then open http://localhost:8000/site/
```

Deployment: `.github/workflows/pages.yml` validates the seed, bundles `site/` + `data/` and publishes to GitHub Pages on push to `main` (enable Pages → "GitHub Actions" in repo settings).

## Status

- Phase 0 (scaffolding) — done.
- Phase 1 (hand-built Rwanda seed: sources, actors, sites, control claims, responses) — first pass; see `pipeline/notes/` for verification logs.
- Phase 2 (bulk data) — IPIS artisanal mining sites imported (3,469 sites, visits 2009–Mar 2026) via `pipeline/import_ipis.py`; Comtrade/BNR/USGS series for the export gap.
- Phase 4 (analysis) — export gap (coltan vs geology-predicted, cross-checked with USGS) in `data/laundering_gap.json`.
- Phase 5 (front end) — overview, control map (MapLibre + OpenFreeMap, IPIS layer, time slider with play), supply-chain view, company path search, export gap, responses, gaps, sources, about.
