# Data sources

Ranked by how much each source is worth for this project. "Access" notes what you need to do to get the data into the pipeline. Items marked **VERIFY** were found via secondary sources and should be confirmed against the original before use.

---

## 1. Control data (who controls which mine)

This is the hardest layer. No single dataset covers it; combine a geolocated site base with dated control claims from reports.

### Tier A — use as the backbone

| Source | What it gives | Coverage | Access |
|---|---|---|---|
| **IPIS — Artisanal mining sites in eastern DRC** (ipisresearch.be, open data portal) | Geolocated ASM sites with mineral, worker counts, **presence of armed groups and FARDC at each visit**, roadblocks, whether the site is validated or covered by ITSCI. Data collected since 2009; 2023 update is the most recent full analysis. | Eastern DRC (North/South Kivu, Ituri, Maniema, Tanganyika, Haut-Uele) | Open data (Open Data Commons licence). Downloadable via IPIS open-data portal, ArcGIS Hub and open.africa. Read the IPIS open-data FAQ/dictionary for field definitions. |
| **IPIS — M23 "area of influence" maps** | Polygons of M23 territorial control at points in time (e.g. ~7,800 km² by late Jan 2025), overlaid on mining sites. Shows M23 held hardly any mining sites until it moved into the Rubaya area in late April 2024. | North/South Kivu | Published as maps in IPIS Q&A/analysis pieces. May need to request shapefiles from IPIS or digitise. |
| **UN Group of Experts on the DRC** (1533 sanctions committee) | The most authoritative documented evidence on who controls which sites, taxation, smuggling routes, named exporters, and Rwanda's role. Key reports: **S/2026/466** (final, June 2026), **S/2025/858** (midterm, Dec 2025), **S/2025/446** (final, July 2025), **S/2024/969** (midterm, Dec 2024). | Eastern DRC + Rwanda/Uganda/Burundi transit | PDFs on main.un.org Security Council 1533 "Expert reports" page. Extract paragraph-level claims manually or with an LLM pass, citing paragraph numbers. |

### Tier B — use to update and fill gaps

| Source | What it gives | Access |
|---|---|---|
| **Critical Threats (AEI/ISW) — Congo War Security Review** | Frequent (roughly fortnightly) updates on M23 territorial changes and control maps. Good for "since when" dating. | criticalthreats.org briefs; maps as images, so digitise key moments. |
| **International Crisis Group** | Maps combining IPIS sites with M23 area of operations (e.g. Dec 2025 report). | crisisgroup.org |
| **Global Witness — "Who buys Rwanda's smuggled coltan?"** (updated 18 June 2026) | Names exporters with evidence of buying Rubaya conflict coltan, ITSCI suspensions, and the downstream smelters. Best source for the supply-chain seed list. | globalwitness.org, free |
| **Amnesty International — "We didn't come to play"** (Sept 2026, AFR 62/1454/2026) | M23 abuses at artisanal mines (Rubaya, Lomera gold), working conditions, trafficking of gold and coltan to Rwanda. | amnesty.org PDF |
| **The Sentry** | Investigations into conflict gold flows via Rwanda (incl. estimates of illicit gold exports since 2022). | thesentry.org |

### Tier C — context and event data

| Source | What it gives | Access |
|---|---|---|
| **ACLED** | Geolocated conflict events (battles, violence against civilians) with actors and fatalities. Africa coverage since 1997. Has integrated **Kivu Security Tracker** data for Jan 2018 – Nov 2023. Use for the impacts layer and to corroborate armed presence near sites. | Free account (registration) for the Data Export Tool/API. Aggregated country files on HDX. Check licence terms for public redistribution before publishing raw rows. |
| **Kivu Security Tracker** (Congo Research Group / HRW) | Violence in North/South Kivu. Historical data now best accessed via ACLED. | Via ACLED |

### Other regions (for later cases)

Note now, research properly when starting each case: Global Witness on Myanmar rare earths (Kachin), UN Panels of Experts on Sudan/CAR/Mali, The Sentry and Global Initiative against Transnational Organized Crime on Sahel gold, InSight Crime and Amazon Underworld on Colombia/Venezuela gold.

---

## 2. Supply chain data

| Source | What it gives | Access |
|---|---|---|
| **Sayari** (MCP in VS Code / API) | Company records, ownership/officer links, sanctions and risk flags (incl. `exports_conflict_minerals`), and **trade data**. Rwanda coltan exports appear mostly through Tanzania customs records (transit via Dar es Salaam). ~459 shipment rows of HS 261590 departing Rwanda since Jan 2024 in our test. See `SAYARI_METHOD.md`. | Your Sayari access |
| **UN Comtrade** | Mirror trade statistics: Rwanda's reported exports vs. partners' reported imports. Core input for the laundering-gap indicator. | Free API (registration) |
| **USGS Mineral Commodity Summaries / Minerals Yearbook** (tantalum, tin, tungsten, gold) | Country production estimates — the denominator for "could Rwanda plausibly produce this?" | Free, pubs.usgs.gov |
| **Rwanda Mines, Petroleum and Gas Board (RMB) / NISR / BNR** | Official Rwandan export figures (volumes and value by mineral). Rwanda doesn't publish mine-level production. | Government sites; quarterly statistics |
| **ITSCI** | Member lists, suspensions/expulsions (six coltan exporters suspended or expelled since 2024 per Global Witness), incident reports. | itsci.org public reports |
| **RMI (Responsible Minerals Initiative) smelter list** | Conformant / active / non-conformant status of tantalum, tin, tungsten and gold smelters. Lets you check the Chinese, Kazakh and Thai smelters Global Witness names. | responsiblemineralsinitiative.org (public facility list) |
| **SEC Form SD / Conflict Minerals Reports** | US-listed companies' disclosures naming smelters in their supply chain — the link from smelter to brand. | SEC EDGAR full-text search |

---

## 3. Impacts data

| Indicator | Source |
|---|---|
| Armed-group revenue from minerals (e.g. ~US$800k/month from Rubaya coltan taxation) | UN Group of Experts (S/2024/969 and later) |
| Volume smuggled (e.g. ≥150 t coltan to Rwanda in 2024) | UN Group of Experts |
| Deaths at sites (e.g. Rubaya landslides, Jan 2026, ≥227 reported) | Media + DRC Ministry of Mines statements. **VERIFY** count against primary reporting. |
| Forced/child labour at sites | Amnesty (Sept 2026), US DoL List of Goods, US State Dept TIP Report |
| Violence and displacement near sites | ACLED, OCHA/HDX |
| Laundering gap | Our calculation: exports (Comtrade + Sayari) vs. plausible production (USGS + Rwandan data). E.g. UN S/2026/466 reports Rwanda's cassiterite exports up 58% in 2025 (4,859 t → 7,700 t) without matching production increases. **VERIFY** figures in the report itself. |

---

## 4. Response data

| Type | Source |
|---|---|
| US sanctions | OFAC SDN list + Treasury press releases (DRC program, E.O. 13413). Key releases: RDF (2 Mar 2026), Gasabo Gold network (25 Jun 2026, `sb0543`), Rwandan MoD + Zigama (28 Oct 2026, `sb0668`). |
| EU sanctions | EU Official Journal / EU Sanctions Map. Gasabo Gold Refinery and RMB CEO Francis Kamanzi listed March 2025. |
| UN sanctions | 1533 Committee sanctions list |
| Aggregated sanctions | **OpenSanctions** (opensanctions.org) — free, structured, cross-list; useful for joining designations to Sayari IDs |
| Due diligence law | EU Conflict Minerals Regulation (and its CAHRA list, which drives Sayari's `exports_conflict_minerals` flag); Dodd-Frank §1502; EU Battery Regulation due diligence (from Aug 2027); OECD Due Diligence Guidance |
| Peace/minerals deals | Washington Accords (signed 4 Dec 2025) incl. Regional Economic Integration Framework; DRC–Rwanda Peace Agreement (27 Jun 2025); EU–Rwanda critical raw materials MoU (status under review since 2025 — **VERIFY** current status) |
| Industry responses | ITSCI suspensions; RMI audit status changes; company statements to Global Witness/Amnesty; SEC disclosures |
| Tracking updates | Steptoe Weekly Sanctions Update; Tavily searches on a schedule |

---

## Licensing reminders

- IPIS: Open Data Commons — attribute IPIS.
- ACLED: check terms before redistributing event-level rows publicly; aggregates and visualisations are usually fine with attribution.
- UN, US government: public.
- NGO reports and media: link and paraphrase; don't copy text or images.
- Sayari: check your access terms before publishing raw Sayari records on a public site. Safer default: publish derived links with a "Verify in Sayari Graph" link rather than bulk exports.
