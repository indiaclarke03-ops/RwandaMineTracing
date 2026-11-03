# Sayari entity resolution: 2 Nov 2026

Structured output: `sayari_resolution.json`, with 30 entities, 12 edges, 9 trade pairs and 70 logged calls. Every entity has its Sayari URL in the JSON.

## Confirmed: all 15 known IDs are still live, with none merged or redirected

| Entity | Sayari ID | Key identifiers | Lists |
|---|---|---|---|
| M23 | diV1zDu2TnrgnGxCb3WD8Q | OFAC 15585, UN CDe.006, EU.3674.45, UK DRC0020 | OFAC, UN, EU, UK, AUS, JPN, CHE, others |
| AFC | tANZaCKgA6oMa6jl9OmdHg | OFAC 48601, EU.12072.82, UK DRC0076 | OFAC, EU, UK, UN, others. Swiss status is shown as both sanctioned and formerly sanctioned |
| Rwanda Defence Force | E74Od6qY6XwVVlUY-W0G7Q | OFAC 56928 | OFAC only |
| Zigama CSS | GBgw7aYaaYfLAQO2KsliQA | OFAC 58407, RCA/546/2010 | OFAC only |
| Zigama duplicate | j8ka8O7pMigvUthBvI-auA | none | none. **Ambiguous**: a Pakistan customs fragment. Don't link it |
| Gasabo Gold Refinery | i0CKJhgvHKympxUfQw1BUA | OFAC 57937, EU.12862.88, id 120323055 | OFAC, EU, FRA |
| Jean Malic Kalima Karekezi | 3IPk7makLLnIcTI_C5uNSw | OFAC 57936 | OFAC only |
| Bosco Kayobotsi | Pj4_K8Exf3J8OW-nAvaiZg | OFAC 57938 | OFAC only |
| Bugambira Mines | bMpOqIwnc55hTXWt_FeGyA | OFAC 57939 (former name Multiserve Consults) | OFAC |
| Rwinkwavu Mining Corp | vVqCspLlm9Vn-RCNojSrhQ | OFAC 57941 | OFAC |
| Wolfram Mining & Processing | ByUCmIzSSyFaep1RBIu4jQ | OFAC 57940 | OFAC |
| African Panther Resources | X9BAf2KZzwU7tDfYuH4qoA | none (trade records only) | none. Flag `exports_conflict_minerals` |
| Boss Mining Solution (RWA) | WKC3rFluM3Fgj6NXzGwxTA | none (trade records only) | none. No conflict-minerals flag |
| Boss Mining Solution (DRC) | yFQo_xvgXez4UJgGyJ9qBw | RCCM CD/KNM/RCCM/22-B-00187 | none. **A separate entity. Don't merge it with the Rwandan company** |
| Kanzamin | PgSzW4JGmOSkebhc9rXaLg | none (trade records only) | none |

Sayari doesn't return designation dates, so every `sanctions[].date` is null. Take the dates from the primary OFAC and EU notices.

## Resolved

- **Rwandan Ministry of Defence**: `8fKsoMBpty_6tRnAfSuONQ`, OFAC 59069. It has the alias "Rwandan Ministry of Defence" and shares the KG 1 Roundabout address with the RDF record. Three other MoD records are unsanctioned customs fragments and aren't linked.
- **Francis Kamanzi**: `7UisBIYHVOxjxjZXLnOsUA`. He's on the EU list (EU.12860.90, from the same batch as Gasabo) and France's, but not on OFAC. He's flagged as a PEP and is linked as `officer_of` the RMB with the position "Chief Executive Officer".
- **Rwanda Mines, Petroleum and Gas Board**: `Q6LfuEyiZrbWfsrDNi9MAQ`. It's state-owned and isn't sanctioned itself. Its `controlled_by_eu_sanctioned` flag comes from Kamanzi.
- **Exporters (low to medium confidence)**: these four are known only from trade records. Each match rests on country, exact name and the Rwanda–Tanzania export corridor. None of them has a registry identifier.
  - Sunrise Metal Company Ltd `XdjwXWTJpPSM6qhH8gqhnQ`
  - Philbert Trading Minerals Ltd `Z9TfSFyAXgXOCyd-gic-uQ` (flagged `exports_conflict_minerals`; a probable fragment is A_6KbbGki1L2qtboTxJ4HQ)
  - Space Mining Ltd `DGREDQ68sKQBgvglvG7nhg`
  - Rani Mining Ltd `KMJ_GrAwF6ZiFOQSsMEbMQ`
- **Smelters**: each one is resolved to a registry record with a national registration number. The trade-name fragments are listed in the JSON.
  - OTIC: `ZpTn4A-iShM17oe5UZ0pbA`, 宁夏东方钽业股份有限公司, unified social credit code (USCC) 916400007106545275
  - Jiujiang Jinxin: `vEZic6aOgtwXXiMgRT3MsA`, 九江市金鑫有色金属有限公司, USCC 91360400748515821R. It carries a `law_enforcement_action` flag that I haven't looked into yet.
  - Jiujiang Tanbre: `8Q09O1PQ4twjsSdyprTyYA`. The legal name is 九江有色金属冶炼有限公司 and "JIUJIANG TANBRE CO LTD" is listed as an alias. It's flagged as a core Chinese state-owned enterprise (`chinese_core_soe`).
  - Jiujiang Zhongao: `IL1aY2MwQCbcccOK9EI7_A`, 九江中澳钽铌有限公司, USCC 91360402581632080Y
  - Ximei Resources (Guangdong): `6ITu5Fse7Hyja2GUl7g_8w`, 稀美资源（广东）有限公司, USCC 91441800787935562B. Its trade records sit on the English-name fragments.
  - Hengyang King Xing Lifeng: `JoPJdyraJ9o9KbVk_TBqmg`, 衡阳金新莱孚新材料有限公司. Customs records spell it "KING XNG".
  - Ulba Metallurgical Plant: `yd4WCfTHQsYYVO6SEoutWA`, Kazakh business ID (BIN) 941040000097, state-owned
  - Taniobis (Thailand): `dfQ3LgjqYoadPsJFejbYsg`, Thai registration 0835522000255, formerly H.C. Starck Co., Ltd., at Map Ta Phut, Rayong

## Unresolved

None of the entities are unresolved. The four exporters above are weak matches. Confirm them against the ITSCI or RMB exporter list before they appear in the public view.

## Relationships

- Kalima is a `shareholder_of` Bugambira, Rwinkwavu and Wolfram, and a `legal_representative_of` Gasabo. Kayobotsi is a `legal_representative_of` Gasabo.
- Gasabo's profile also lists Kalima as `has_member_of_the_board` and Kayobotsi as `has_manager`. Both carry the position "Acting for or on behalf of", which is sanctions-list wording.
- **The links to M23 all use the generic Sayari type `linked_to`.** The meaning is only in the position text:
  - Gasabo → M23: "Providing support to"
  - RDF → M23: "Mouvement du 23 Mars is linked to Rwanda Defence Force"
  - AFC → M23: "...is linked to Congo River Alliance"
  - The pipeline has to parse the position string. Filtering on the relationship type alone won't separate these links.
- **The MoD and Zigama have no relationships in Sayari at all.** The Treasury designation of 28 Oct 2026 hasn't added any graph edges yet.
- The filtered depth-1 traversal from Gasabo returns 0 results. The four filter types only run from a person to a company, so starting from the company side finds nothing. Use `get_entity_profile` or the inverse types (`has_*`) when starting from a company.
- No record IDs came back on any edge, only entity-level sources (OFAC SDN, Acuris, OpenSanctions).

## Trade (HS 261590, departing Rwanda)

| Exporter | Buyer (country) | Rows | First | Last |
|---|---|---|---|---|
| Kanzamin | HALCYON INC (ARE, Dubai) | 25 | 2023-10-04 | 2026-07-31 |
| Kanzamin | Specialty Metals Resources SA (BEL) | 3 | 2023-07-24 | 2023-12-23 |
| Kanzamin | Specialty Metals Resources Ltd (HKG) | 2 | 2024-11-23 | 2024-11-23 |
| African Panther | Traxys Europe S.A. (LUX), across 2 Sayari records | 11 + 1 | 2023-03-17 | 2025-03-21 |
| African Panther | HALCYON INC (ARE) | 7 | 2024-11-30 | 2026-07-04 |
| Boss Mining Solution | NOVACORE FZE (ARE, Ras Al Khaimah) | 30 | 2023-02-28 | 2026-04-21 |
| Boss Mining Solution | HALCYON INC (ARE) | 1 | 2025-04-11 | 2025-04-11 |
| Boss Mining Solution | NOVASCORE FZE (likely a misspelling of Novacore) | 1 | 2023-10-17 | 2023-10-17 |

"Rows" counts Sayari's customs rows, not consignments, so one consignment can appear more than once. These records show who shipped and who received the ore, not where it was mined.

## Surprises and follow-ups

1. **The UAE is the main intermediary.** Halcyon (Dubai) buys from all three exporters. Novacore FZE, in the Ras Al Khaimah free zone, takes almost all of Boss Mining's coltan. African Panther switched from Traxys (last shipment Mar 2025) to Halcyon. Exports from all three continue into 2026, after the June 2026 OFAC action.
2. **Correct SAYARI_METHOD.md.** It says Boss Mining's coltan buyers span TZA, CHN, KOR, JPN, ARE, GBR and NLD. This run found only UAE buyers.
3. **One customs row has the roles reversed.** It shows Traxys shipping to African Panther on 2024-09-28. The shipper and consignee fields were probably swapped, so I excluded it from the counts.
4. **Rani Mining and Boss Mining Solution both have addresses in Niboye, Kicukiro (Kigali).** This could be a coincidence or a shared agent.
5. **The Taniobis group carries `psa_owned_by_sanctioned_entity`.** This is a weak possible-same-as (PSA) link. Check which owner triggers it before showing it.
6. **Some guessed Chinese-name queries returned 0 results** (for Zhongao and Hengyang). The registry names were found through the English or partial searches instead.
