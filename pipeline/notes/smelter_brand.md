# Smelter to brand mapping (run 2026-11-04)

Data: `smelter_brand.json`. 621 company-smelter rows across 41 companies, RY2024 and RY2025, plus 22 Sayari buyer rows from 31 calls.

**What this does not show.** A listing means a company's suppliers named a smelter, and most reports say it "may" be in the supply chain. No filing says a company received Rubaya material. Periods may not match. Sayari rows show shipper and consignee, not origin (rule 10), and are `inferred`. The Rubaya claims are allegations (`documented`, Global Witness), denied by OTIC, Tanbre, Jinxin and Ulba. Taniobis, which GW does not link to Rubaya, says it stopped DRC and Rwanda sourcing at end 2023.

## RMI status
| Smelter | RMI ID | Status | Rubaya link (GW) | Response |
|---|---|---|---|---|
| Ningxia Orient Tantalum (OTIC) | CID001277 | Conformant, frozen | Yes | Denies |
| Jiujiang Tanbre | CID000917 | Conformant, frozen | Yes | Denies |
| Jiujiang Jinxin | CID000914 | Conformant, frozen | "May have" | Denies |
| Jiujiang Zhongao | CID002506 | Conformant, frozen | No | Not recorded |
| Ximei Resources (Guangdong) | CID000616 | Conformant, frozen | No | Not recorded |
| Hengyang King Xing Lifeng | CID002492 | Conformant, frozen | No | Not recorded |
| Ulba Metallurgical Plant | CID001969 | Conformant | Yes, via East Rise | Denies |
| Taniobis (Thailand) | CID002544 | Conformant | No | Stopped DRC/Rwanda end 2023 |

Status comes from Ericsson's RY2025 annex, using RMI data of 22 May 2026. It agrees with Corning, Howmet and others.

**Frozen:** on 17 Aug 2026 RMI paused new China assessments and extended the latest ones until further notice, after China listed its parent body. Six of the eight are in China, so their status is no longer a fresh result.

**Data gap:** last-assessment dates are blank. The RMI table needs an "I AGREE" to terms that restrict redistribution, and that was not accepted for the user. Global Witness says only that all eight were assessed in 2024 or 2025.

## Brand links
- All 8 smelters appear in most lists: 39 to 41 of 41 companies for each smelter in RY2025, including Amazon, Microsoft, NVIDIA, Intel, Toyota, Honda, Sony, Ericsson, LG Display and TSMC.
- That breadth is a warning, not a finding. Lists are near-universal because suppliers answer at company level.
- Seven filers use firmer wording: Caterpillar, Howmet, Intel, Microsoft, NVIDIA, Nokia, TSMC.
- Honeywell's list is limited to smelters potentially sourcing from Covered Countries, and it names 4 of 8 in RY2025.
- Corning marks seven of eight as sourcing from the DRC or a covered country in both years, and King Xing as not.
- Apple filed a Form SD with no Conflict Minerals Report for RY2025. Tesla points to its website. In all, 18 large filers name none of the eight in the filing searched.

## Sayari downstream
- **OTIC to Samsung Electro-Mechanics:** 215 tantalum rows, Mar 2019 to Aug 2026, across two consignee names, arriving in the Philippines. This is the strongest trade link and matches GW. Samsung told GW it had no concerns.
- **Taniobis Thailand:** Panasonic Indonesia (50 rows to June 2026) and Kyocera AVX (17 rows, ending Feb 2024). Rows after 2023 are not implied to be affected.
- **Ulba:** ingot buyers and Kyocera AVX edges with no dated row. Only 100 of 542 rows read.
- **Not found:** KEMET or Vishay rows from any of the eight, and GW's OTIC to Panasonic Philippines shipments.
- **No buyers seen:** Jinxin, Zhongao, King Xing (inbound rows only).

## To check
- **East Rise and Ulba, Sept 2024.** Ingots went to Ulba and returned 24 days later, with matching lot numbers. Our analysis suggests tolling. It falls after Ulba's stated May 2024 stop, but it is ingot, not ore.
- **Responses table.** OTIC, Tanbre and Jinxin denials are not in the brief and should be added to `responses_to_claims`.
- **Sayari IDs.** Buyer IDs need a rule 7 same-entity review before linking.
