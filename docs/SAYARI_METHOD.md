# Tracing mine owners and buyers to armed groups with Sayari

This method was tested against the Rwanda case on 2 Nov 2026 using the Sayari MCP. Results below are what actually came back, so build the pipeline around what works.

## Headline finding

**Sayari can trace owners to armed groups well — but mainly where a government has already designated the link.** Sanctions designations bring in structured relationships (person → company → "provides support to" → M23), and Sayari then propagates risk to companies owned by sanctioned parties.

**For unsanctioned exporters, Sayari has trade records but no ownership records.** The Rwandan corporate registry isn't covered, so `find_beneficial_owners` returns nothing for companies like Boss Mining Solution or African Panther Resources. For these, the armed-group link has to come from UN/NGO evidence, and Sayari's contribution is the trade network (who they ship to).

So the tool uses **four tracing routes**, each with a different evidence tier.

---

## Route 1 — Designation-anchored (strongest; tier `designated`)

Start from a sanctioned entity and walk its ownership/officer network.

**Tested example:**
- `Gasabo Gold Refinery` (`i0CKJhgvHKympxUfQw1BUA`) — sanctioned by OFAC (SDN 57937) and EU. Depth-1 links include **M23** (`diV1zDu2TnrgnGxCb3WD8Q`), chairman **Jean Malic Kalima Karekezi** (`3IPk7makLLnIcTI_C5uNSw`) and GM **Bosco Kayobotsi** (`Pj4_K8Exf3J8OW-nAvaiZg`).
- Kalima, depth 1 → `shareholder_of`:
  - Bugambira Mines LTD (`bMpOqIwnc55hTXWt_FeGyA`) — OFAC SDN 57939
  - Rwinkwavu Mining Corporation LTD (`vVqCspLlm9Vn-RCNojSrhQ`) — OFAC SDN 57941
  - Wolfram Mining and Processing LTD (`ByUCmIzSSyFaep1RBIu4jQ`) — OFAC SDN 57940
  - plus `legal_representative_of` Gasabo Gold Refinery
- Zigama Credit and Savings Society (`GBgw7aYaaYfLAQO2KsliQA`) — OFAC SDN 58407. Note a second, sparse duplicate record (`j8ka8O7pMigvUthBvI-auA`) with no country: treat as unconfirmed.

**This gives a clean chain:** armed group ← (designated support) ← refinery ← (legal rep / shareholder) ← person → (shareholder) → three mining companies.

**Pipeline call pattern:**
```
search_entities(name) → confirm identity (SDN number, country)
traverse_network(entity_id, max_depth=1,
                 relationships=["shareholder_of","director_of",
                                "legal_representative_of","officer_of"])
```
Then repeat one hop from each person found.

**Warning:** an unfiltered `traverse_network` at depth 2 from Gasabo returned **366 nodes**: every sanctioned M23/RDF figure (via the M23 node) plus hundreds of chemical and logistics traders (via a Brenntag trade counterparty). Always filter by relationship and cap depth.

## Route 2 — Risk propagation (tier `designated` for the flag, `inferred` for meaning)

Sayari tags companies owned by sanctioned parties (`owned_by_sanctioned_entity`, `owned_by_sanctioned_usa_ofac_sdn_entity`). Use these to find companies one step from a designated party that aren't themselves on a list yet. These are leads for the analyst view, not findings.

## Route 3 — Evidence-anchored + trade (tier `documented` for the link, Sayari for the network)

For exporters named by UN Group of Experts or Global Witness but not sanctioned:

1. Resolve the company in Sayari and confirm identity.
2. Record the armed-group link from the report (tier `documented`, cite paragraph/page).
3. Use Sayari trade data to map **who they ship to**: `search_trade_facets(scope="buyers", shipper_name=...)` then `search_shipments`.

**Tested examples:**
- `AFRICAN PANTHER RESOURCES LTD` (`X9BAf2KZzwU7tDfYuH4qoA`) — countries RWA/COD/TZA; flags `exports_conflict_minerals`; sources are Tanzania and Vietnam customs records; ~150 shipments sent. **No ownership data** (UBO search returned nothing). A related Swiss address (Baarerstrasse 53, Zug) appears on a person-type record and on `Principal Investments AG`. Worth investigating, but **treat as unconfirmed** until identifiers match.
- `BOSS MINING SOLUTION LTD` (`WKC3rFluM3Fgj6NXzGwxTA`) — Kigali address, sparse identifiers, no UBO data. A separate DRC company of the same name exists (`yFQo_xvgXez4UJgGyJ9qBw`, RCCM `CD/KNM/RCCM/22-B-00187`). Don't merge without evidence. Coltan buyer facets show buyers across TZA (transit), CHN, KOR, JPN, ARE, GBR, NLD.
- `KANZAMIN LIMITED` (`PgSzW4JGmOSkebhc9rXaLg`) — HS 261590 shipment from Rwanda to UAE (July 2026) to `HALCYON INC`.

Other Global Witness-named exporters to resolve next: Sunrise Metal Company, Philbert Trading Minerals, Space Mining, Rani Mining.

## Route 4 — Downstream from smelters (tier `documented` → Sayari network)

Work backwards from the smelters Global Witness names as buyers of Rwandan coltan:
- Ningxia Orient Tantalum Industry Co. (OTIC), Jiujiang Jinxin Nonferrous Metals, Jiujiang Tanbre, Jiujiang Zhongao Tantalum & Niobium, Ximei Resources (Guangdong), Hengyang King Xing Lifeng New Materials (China); Ulba Metallurgical Plant (Kazakhstan); Taniobis (Thailand).

For each: resolve in Sayari (try Chinese-language names too), pull `search_suppliers` filtered to RWA/TZA departure, check RMI conformance status, then `find_downstream_entities` / SEC Conflict Minerals Reports to reach brands.

This is the analyst's "am I exposed?" path run in reverse.

---

## Trade-data notes

- Rwanda is landlocked; coltan leaves via Dar es Salaam (Tanzania) or Mombasa (Kenya). In Sayari, **Tanzania customs records** are the main source; "buyer country = TZA" usually means a transit record, not the end buyer.
- HS code for coltan: **261590** (niobium, tantalum, vanadium ores and concentrates). Tin ore (cassiterite): **2609**. Tungsten ore: **2611**. Gold: **7108**.
- Test query: `search_shipments(query="tantalum ore concentrate", departure_country="RWA", date_from="2024-01-01")` returned 459 rows. Buyers included UAE traders (`MINTERRA FZC`, `HALCYON INC`) and Chinese firms. UAE as an intermediary is a pattern worth a dedicated view.
- Facet counts by `supplier_country` can reflect where a supplier entity is registered or appears, not mineral origin. Don't read them as origin.

## Laundering-gap indicator (reuse Paper Trail logic)

```
gap(year, mineral) = reported_exports(Rwanda) − plausible_production(Rwanda)
```
- Exports: Comtrade mirror data (partner-reported imports from Rwanda) + Rwandan official figures + Sayari shipment totals as a cross-check.
- Production: USGS estimates and any Rwandan production data; show as a range.
- Annotate the series with control events (M23 takes Rubaya, 30 Apr 2024) and responses (each sanctions date) so the policymaker view can see whether the gap moved after each response.
- Always label this `inferred`.

## Things Sayari can't tell you

- Who physically controls a mine today (use IPIS/UN/Critical Threats).
- Ownership of most Rwandan and DRC private companies.
- The origin of minerals in a shipment.
- Whether a buyer knew.
