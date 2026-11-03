# Sayari trade evidence for the laundering-gap view (run 2026-11-03)

Data: `gap_sayari_trade.json` (51 Sayari calls, logged). Evidence tier for everything below: **inferred**. These are customs rows showing who shipped what from Rwanda to whom. They do not show where the ore was mined (rule 10).

## Coverage: read this first
- **No Rwandan customs data.** About 95% of rows come from **Tanzania customs** (Jan 2023 onward, which captures Rwandan cargo via Rusumo and Dar es Salaam). The rest come from Vietnam, Kazakhstan, Japan, Malaysia, UK and Turkey import records. Kenya data is imports only, so the Mombasa export route is missing.
- **Gaps:** there are no rows for 2021–2022. There is an **8-month hole from Jan to Aug 2024** (1 row across all three ores), which covers the M23 capture of Rubaya on 30 Apr 2024. 2023 H1 is thin and 2026 runs only to 31 Jul.
- **Rows are not consignments.** Up to about 5% of rows repeat another row's shipper, buyer, date and weight, and nothing was deduplicated. Value exists for only about 15% of rows, so annual value is null.
- Coverage is probably well under half of real exports and changes over time. All three ores roughly triple per covered month between H2 2023 and late 2024. That uniform jump looks like a coverage change at least as much as a trade change. Cross-check against Comtrade mirror and RMB data before putting any figure into the gap indicator.

## 1. Volume (rows / gross tonnes)
| HS | 2020 | 2023 | 2024 (Sep–Dec only) | 2025 | 2026 (to Jul) |
|---|---|---|---|---|---|
| 261590 coltan | 3 / 46 (VNM) | 44 / 710 | 86 / 1,410 | 204 / 2,906 | 121 / 1,823 |
| 260900 tin | 0 | 149 / 3,330 | 128 / 3,483 | 354 / 9,059 | 219 / 5,072 |
| 261100 tungsten | 15 / 424 (VNM) | 84 / 1,781 | 95 / 2,074 | 261 / 5,507 | 160 / 3,127 |
| 7108 gold | 1 / 0.54 (TUR) | 0 | 0 | 0 | 0 |

Coltan per covered month: about 100 t in H2 2023, about 350 t in Sep–Dec 2024, about 240 t in 2025 and about 260 t in Jan–Jul 2026.

## 2. Concentration (coltan)
- Share of coltan rows (and weight) from the seven GW-named exporters: **2023 66% (53%)**, 2024 56% (51%), **2025 31% (30%)**, 2026 36% (31%).
- The largest exporter from 2024 on is **East Group Minerals** (not GW-named), shipping about 23–30% of rows, mostly to Minterra FZC.
- Four of the matches (Sunrise, Philbert, Space, Rani) are low confidence. Rani Mining, one of the GW seven, first appears in Mar 2025 and is the #2 exporter in 2026. Several GW firms also ship heavily in tin and tungsten (African Panther: 101 tin rows; Kanzamin: 50 tungsten rows).

## 3. Timing (quarterly; see by_quarter)
- **Rubaya (Apr 2024):** this can't be tested because of the Jan–Aug 2024 source gap.
- **Goma (Jan 2025):** no clear break. Coltan went from 64 rows in 2024Q4 to 46 in 2025Q1 to 57 in 2025Q2.
- **ITSCI suspensions (Mar–Nov 2025):** this is the clearest signal.
  - African Panther, Sunrise Metal and Philbert record **zero coltan rows from 2025Q2 to Q4**. African Panther resumes in 2026Q1, consistent with its lifted suspension.
  - The GW-seven share of coltan rows fell from 48% (2025Q1) to 26% and then 15% (2025Q3).
  - In the same window new or expanding exporters appeared: **Hillside Mining** (first row Feb 2025, 21 of 31 rows to Halcyon Inc, a buyer the suspended firms also used), ETS Munsad (all rows to Halcyon), Better Off Equipment, Tebuka (to Minterra), and Rani Mining.
  - Total coltan volume did not fall. This is consistent with substitution between exporters, but it is our inference only and the newcomers may be legitimate.
- **OFAC Gasabo (25 Jun 2026):** only one month of data follows the designation (July: 26 rows, 476 t). No visible change.

## 4. Destinations (coltan)
- By arrival country, China's share keeps rising: 39% (2023), 54%, 66%, 75% (2026). UAE arrivals fall from 30% to 13%. Kazakhstan has only 2 rows (2023) and Thailand only 2 (2024).
- By buyer domicile, UAE buyers are rising: 43% (2023), 48%, **61% (2025)**, **64% (2026)**. Quarterly it peaked at 74–84% in 2025Q3–2026Q1. The UAE buyers are Minterra FZC, Halcyon Inc, Novacore FZE and Saiko LLC-FZ.
- UAE-domiciled buyers increasingly take title while the ore ships to China.

## 5. Gold
- One HS 7108 row has ever departed Rwanda in Sayari: Aldango Ltd to a Turkish buyer, 544 kg, Jul 2020.
- **Gasabo Gold Refinery has no outbound rows.** It appears only as the buyer of refining chemicals from Brenntag SpA (via Uganda and Spain): 2023-08-11, 2024-07-13 and 2024-09-04. All of these predate the EU listing (17 Mar 2025) and the OFAC listing (25 Jun 2026), and no rows follow either listing.
- Gold flies out of Kigali, and no air or UAE import source covers that route. The absence of rows is not evidence of no exports.

## 6. DRC-origin hints
3 rows departing Rwanda declare **product origin COD**:
- Tawotin to **East Rise Corporation** (HK), coltan, 19.8 t, Oct 2024. East Rise shares its name with a target of the Aug 2025 Treasury action, but the Sayari node is unflagged, so the match is unconfirmed.
- Philbert to Halcyon, tin, 25 t, Oct 2024.
- Rutongo to Kalon, cassiterite, 24 t, Jul 2023.

Other hints:
- African Panther shipped 11.5 t of tantalite with **departure country DRC** to Traxys (Oct 2023, arrival address Rusumo).
- One DRC-to-Rwanda coltan row: Congo Ressources Mining SARL to Meta Trading Minerals (Uganda-registered), 26 t, Nov 2025, from Uganda customs.
- No rows show DRC entities shipping to the seven GW exporters. No Congolese place names appear in any row.

The product-origin field is self-declared and mostly mirrors the departure country.
