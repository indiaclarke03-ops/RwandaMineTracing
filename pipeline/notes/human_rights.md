# Human-rights research log (mining, eastern DRC and the trade into Rwanda)

Run: 2026-11-19. Data: `pipeline/notes/human_rights.json` (25 sources, 59 facts, 11 headline numbers, 6 denials or non-responses). Nothing in `/data` or the seed was changed.

## Method
- UN and NGO PDFs were downloaded into the scratchpad (`hr_raw/`) and parsed with `python3 -I`: S/2026/466, S/2025/446, S/2025/858, S/2026/321 (CRSV), S/2026/357 (CAAC), S/2026/208 (MONUSCO), Amnesty AFR 62/1454/2026 and AFR 62/0145/2025, IPIS 2023 update, and the IPIS open-data dictionary.
- Web pages were read with `tavily_extract`: DoL ILAB (DRC, Rwanda, TVPRA list), HRW (Jun 2026 report, Feb 2026), IOM DTM (Jul 2026), Radio Okapi, Mines.cd, DeskEco, AP, Treasury sb0668 and IPIS Mambasa.
- Tiers: UN, NGO and DoL findings are `documented`. Only Treasury sb0668 is `designated`. Media is `reported`. The DoL list is not graded `designated` because it is not a sanction.
- No victims or witnesses are named. Perpetrators are named only where the UN or NGO source names them.

## Strongest site-linked findings
- **Rubaya and Lomera (Amnesty 2026):** M23 or its mine guards killed at least 18 miners. Detainees were held in underground pits, and miners were forced to work underground for little or no pay. M23 threatened miners with recruitment to extort ransoms.
- **M23 taxation (UN GoE):** M23 taxes Rubaya coltan at $4/kg and cassiterite at $2/kg, and charges a $25/yr miner licence and FC 500 a day to enter the site. It took a 30% production tax at Lomera pits. Amnesty adds that $3/kg of coltan is said to go to the Rwandan government.
- **Recruitment:** more than 300 young men, including minors, were seized in Rubaya (Jul 2025, per the GoE). HRW describes forced labour and executions at the Rumangabo and Tshanzu camps.
- **The other side:**
  - Wazalendo/CNPSC runs courts in Fizi mining areas, with release fines of FC 2–5m, plus roadblock extortion.
  - FARDC interfered at 37% of 829 IPIS sites, and FARDC or police taxed 65% of Shabunda sites.
  - CODECO and Zaïre extort gold miners and use forced labour in Djugu.
  - Wazalendo had 221 abuses against M23's 503 (MONUSCO, Dec 2025–Mar 2026).
- **Collapses:** Lomera, 20 Jul 2025 (10 to more than 50 dead). Rubaya, Jun 2025 (tolls conflict). Rubaya, 28 Jan 2026 (more than 200 dead). Rubaya, 3 Mar 2026 (more than 200 dead, about 70 of them children). Gakombe, 7 Mar 2026 (no toll given).

## IPIS fields
The public open-data dictionary (`cod_mines_curated_all_opendata_p_ipis`) includes `childunder15`, `childunder15work`, `women` and `womenwork`, and these per-group fields: `forced_labour_`, `pillaging_`, `taxation_`, `commerce_taxation_`, `entrance_taxation_`, `monopoly_`, `digging_`, `buying_minerals_` and `pit_ownership_`, plus `mercury`.

Our importer reads the webmap view `cod_mines_webmap_en` and uses none of these fields. I could not re-check whether that view carries them: a fresh request was blocked and the old raw file is gone. To use them, get the curated table through IPIS's form.

## Gaps and cautions
- Most UN figures (CRSV, CAAC, displacement) are national or province-wide, not per mine. Don't map them onto sites.
- CRSV wording differs: S/2026/321 says "1,534 cases", while GoE annex 4 says "887 cases, 1,534 victims".
- No 2025 or 2026 DoL TVPRA list was found; the latest is Sept 2024.
- No UNICEF or academic headcount of children at mines in the Kivus for 2023–26 was found.
- Unverified: the DeskEco ">700" toll for the Jun 2025 Rubaya collapse, the PNN ">300" figure (search excerpt only), and the Gakombe collapse (single secondary source).
- Responses: M23 and Rwanda did not answer Amnesty. Rwanda and Kagame denied the GoE findings (AP, Jul 2025). M23 said humanitarian actors invented sexual-violence data (GoE, Mar 2026).
