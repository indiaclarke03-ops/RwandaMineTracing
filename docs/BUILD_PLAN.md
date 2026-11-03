# Build plan

## Architecture

```
/pipeline   Python scripts → pull, clean, link, score → write /data
/data       committed JSON / GeoJSON (the only thing the site reads)
/site       static front end on GitHub Pages
/docs       these spec files
.env        SAYARI + TAVILY keys (gitignored)
```

- **Pipeline** runs locally in VS Code (Sayari MCP / API, Tavily, Comtrade, IPIS downloads). It never runs in the browser.
- **Site** is static (GitHub Pages, same deployment pattern as Paper Trail). Maps: MapLibre GL or Leaflet. Flows: D3 Sankey. Network: D3 force or Cytoscape.js. Timeline: plain D3.
- Keep it simple enough to update in an afternoon when a new sanctions round drops.

## Data model

All tables are JSON arrays in `/data`. Every record has `id`, `source_ids[]`, `evidence_tier` (`designated` | `documented` | `reported` | `inferred`), and `notes`.

| Table | Key fields |
|---|---|
| `sources` | id, title, publisher, url, published_date, accessed_date, type (sanctions / un_report / ngo / media / dataset / analysis), paragraph_or_page |
| `sites` | id, name, lat, lon, admin area, country, minerals[], ipis_site_id, site_type (mine / trading_centre / border / port / refinery / smelter) |
| `actors` | id, name, type (armed_group / state_force / state_body / company / person / financial_institution / scheme), country, sayari_entity_id, sayari_url, sanctions[] |
| `control_claims` | id, site_id, actor_id, control_type (controls / taxes / present / escorts_transport), valid_from, valid_to, evidence_tier |
| `relationships` | id, from_actor, to_actor, type (owns / directs / legal_rep / supports / buys_from / ships_to / member_of_scheme), valid_from, valid_to, evidence_tier, sayari_path |
| `flows` | id, mineral, from_node, to_node (site or actor), period, volume_t, value_usd, hs_code, evidence_tier |
| `impacts` | id, type (deaths / forced_labour / child_labour / displacement / violence / revenue_to_armed_group / laundering_gap), site_id or actor_id, period, value, unit, evidence_tier |
| `responses` | id, date, issuer (US / EU / UN / DRC / Rwanda / ITSCI / RMI / company), type (sanction / import_rule / due_diligence_law / peace_deal / scheme_suspension / disclosure / lawsuit / advisory), targets[], summary |
| `effectiveness` | id, response_id, indicator, expected_direction, before_value, after_value, window, verdict (moved / didn't move / too early / no data), evidence_tier |
| `responses_to_claims` | id, claim_ref, respondent, date, summary, source_ids |

## Views

1. **Control map** (lead view for both users). IPIS sites coloured by mineral; armed-group control shown by polygon and site status; a time slider; click a site for the control history with sources and evidence tiers.
2. **Chain view.** For a selected site or mineral: a Sankey from site → trading centre → exporter → port → trader → smelter → brand. Each link labelled with its evidence tier and impacts. This is "trace it all the way through".
3. **Network view (analyst).** Search any company; show its shortest documented path to an armed group, using Sayari IDs, relationship types and sanctions badges. "Verify in Sayari Graph" link on every node.
4. **Response tracker (policymaker).** Timeline of responses by issuer, inside vs. outside the company, with each response's effectiveness indicators and a verdict. Laundering-gap chart with response dates overlaid.
5. **Gaps panel.** What we don't know (no ownership data, unverified control, missing production figures), shown openly.

## Phases

### Phase 0 — Repo and scaffolding
- New repo (separate from Paper Trail). Copy the docs in.
- Set up `.env`, `.gitignore`, `/pipeline`, `/data`, `/site`.
- Look at Paper Trail's repo as a reference for MCP calls, project layout and Pages deployment.

### Phase 1 — Seed data, by hand (Rwanda)
- Build `sources`, `actors`, `responses` from `RWANDA_CASE.md`.
- Resolve every actor in Sayari, confirm identity, store IDs.
- Hand-enter control claims for Rubaya, Mushaki, Lomera from UN GoE and Amnesty.
- Goal: a correct, small, fully sourced dataset before any automation.

### Phase 2 — Bulk data
- Download IPIS eastern DRC site data → `sites` + IPIS armed-presence history.
- Digitise M23 area-of-influence at key dates (Apr 2024, Jan 2025, Dec 2025, latest).
- ACLED events for North/South Kivu around sites (respect licence for public display).
- Comtrade mirror data for Rwanda HS 261590, 2609, 2611, 7108 (2018–latest).

### Phase 3 — Sayari tracing
- Route 1: designation-anchored traversals (filtered) from all sanctioned Rwandan/M23 entities.
- Route 3: resolve Global Witness exporters; pull buyer networks from trade data.
- Route 4: resolve named smelters; pull suppliers from RWA/TZA; check RMI status.
- Write `relationships` and `flows`. Log every entity-resolution decision.

### Phase 4 — Analysis
- Laundering-gap series by mineral and year (reuse Paper Trail anomaly logic).
- Before/after indicators for each response → `effectiveness`.

### Phase 5 — Front end
- Build the views in order: control map → chain view → response tracker → network view → gaps panel.
- Evidence-tier legend that doesn't rely on colour alone.

### Phase 6 — Freshness
- A script that runs Tavily searches for new designations, UN reports and control changes and writes a "leads" file for manual review. Nothing auto-publishes.

### Phase 7 — Next cases
- Reuse the data model for Myanmar rare earths, then Sahel/Sudan gold, then Colombia/Venezuela gold. Add a case selector.

## Definition of done for the Rwanda case
- Every record sourced and tiered; no `VERIFY` flags left unresolved.
- A user can click Rubaya and follow coltan to at least one named smelter, with every hop sourced.
- A user can search a company and see its path (or lack of one) to M23.
- Each response in the timeline has at least one indicator with a verdict.
- The gaps panel is honest about what's missing.
