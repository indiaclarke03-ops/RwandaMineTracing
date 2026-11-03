# IPIS artisanal mining sites import (eastern DRC)

Run: 2026-11-03. Importer: `pipeline/import_ipis.py`. Output: `pipeline/seed/ipis_sites.json`. Source row: `src_ipis_asm`.

## Dataset used and how we got it

- **Dataset:** IPIS Open Data, DRC artisanal mining site visits, as served to the IPIS DRC webmap v6:
  table `cod_mines_webmap_en` in schema `opendata` on IPIS's Supabase project
  (`https://anfwarauamfyjxsscymq.supabase.co/rest/v1/cod_mines_webmap_en`).
- **Licence:** Open Data Commons Attribution License (ODC-BY) v1.0. Attribute IPIS. Stated on https://ipisresearch.be/home/maps-data/open-data (read with tavily_extract, 2026-11-03).
- **Date:** a live table with no version stamp. Fetched 2026-11-03 20:47 UTC. Latest visit date in the data is 2026-03-02. The webmap bundle is build `0.6.0-build20261015.1107`.
- **Completeness:** 7,419 rows. `Prefer: count=exact` returned a total of 7,419, so the download was not truncated.
- **Route:**
  1. The legacy geoserver `geo.ipisresearch.be` (WFS GetCapabilities and GetFeature, over both http and https) timed out after 25 s. It is still offline.
  2. HDX lists `cod_mines_curated_all_opendata_p_ipis` (metadata modified 2026-09-17). Its resource URL points to the same dead geoserver.
  3. The IPIS webmap at https://www.ipisresearch.be/mapping/webmapping/drcongo/v6/ loads its JS bundle `assets/entry-BQn3vkgE.js`. The bundle sets `supabase.url`, a publishable (anon) key, `schema: opendata` and `table_en: cod_mines_webmap_en`. We sent the same GET the browser sends, with headers `apikey` and `Accept-Profile: opendata`. We did not query other tables or schemas, apart from one look at the French twin `cod_mines_webmap_fr` to check one label.
  - **No form was submitted and no personal details were given.** We did not use the official Google Form download.
  - We did not check open.africa (2019) or GitHub mirrors, because the IPIS endpoint is newer and complete.
- Raw file (untrusted, not committed): `/private/tmp/claude-501/-Users-indiaclarke-RwandaMineTracing/3b8d8935-ab6b-433c-b04c-155ffc11c2b4/scratchpad/ipis_raw/supabase_webmap_en/cod_mines_webmap_en.json` (14.9 MB).
- **Caveat:** this table is the webmap view, not the full `cod_mines_curated_all_opendata_p_ipis` layer behind the Google Form. It has the fields we need but fewer columns than the full download. If the official CSV or GeoJSON is obtained later, the importer reads it as long as it uses the same column names.

## Field dictionary relied on

The dictionary is at https://ipisresearch.be/home/maps-data/open-data/open-data-faq-dictionary/. Values were also checked against the data. Each row is one visit.

| Raw field | Meaning | Use |
|---|---|---|
| `pcode` | Stable IPIS site code (`codmineNNNNN`) | `id` = `ipis_<pcode>` |
| `name`, `latitude`, `longitude`, `province`, `territoire` | Site attributes | Taken from the most recent visit row |
| `location_origin` | `GPS` or `Approximation` | Approximate locations are flagged in `notes` |
| `visit_date` | Visit date (YYYY-MM-DD) | `visits[].d`, `last_visit` |
| `visit_year` = `Earlier` | Older visits. 989 visits have dates on 1 January, which looks like a year-only date | Kept as given |
| `source` / `source_specify` | `IPIS` or `Third-party` (BGR, EU IcSP, N/A) | `visits[].src = "3p"` |
| `visit_onsite`, `novisit_reason` | Whether the team reached the site (e.g. `Insecurity`, `Third-party visit`) | Not exported |
| `m1`–`m3` | Main minerals | `minerals`: the union over all visits, latest visit first, lowercased |
| `n_workers` | Number of workers (int or null) | `visits[].w`, `workers` (latest visit) |
| `ag1`–`ag3` + `agN_type` | Armed actor present and its type: `Local armed group`, `Foreign armed group`, `FARDC (no interference)`, `FARDC (undisciplined members)`, `PNC (...)`, or the string `None` (none observed) | Armed groups = Local/Foreign types only. FARDC = any FARDC type |
| `traceability` | `iTSCi`, `None`, `Other`, `No data` | `itsci` at the latest visit (true / false / null) |

Derived rules:
- `armed_presence_last` / `visits[].ag`: a list of non-state groups. An empty list means IPIS recorded none.
- **Third-party rows:** 97% of them have `ag1_type = "None"` and 77% have no worker count, so the armed-actor block was mostly not collected. For third-party rows we treat `"None"` as unknown: `ag: null`, `fardc: null`, and `armed_presence_last: null` when such a row is the latest visit. The exception is `BGR/DRC project 2026`, which does record actors. When the latest visit is unknown, the site `notes` give the last visit with armed-actor data.
- **PMH:** in 178 visits IPIS codes `PMH` (Police des Mines et Hydrocarbures, the state mining police) as a "Local armed group". We exclude it from armed-group presence and say so in that site's `notes`. This is our reading, not IPIS's.
- PNC (national police) is not counted as an armed group.
- When one site has two rows on the same date (38 cases), we merge them: the union of groups, any-true for the booleans, and the higher worker count.

## Armed-group name normalisation (raw to normalised, visit count)

| Raw `agN` [type] | Normalised | Visits |
|---|---|---|
| Maï-maï [Local] | Mai-Mai | 666 |
| Raïa Mutomboki [Local] | Raia Mutomboki | 215 |
| Other [Local] | Other local armed group | 186 |
| PMH [Local] | (state mining police; excluded) | 178 |
| NDC [Local] | NDC | 147 |
| FDLR [Foreign] | FDLR | 102 |
| NDC-R [Local] | NDC-R | 51 |
| FRPI [Local] | FRPI | 42 |
| Autodéfense Zaïre [Local] | Zaïre (self-defence group) | 28 |
| UPLC [Local] | UPLC | 24 |
| ADF [Foreign] | ADF | 18 |
| Nyatura [Local] | Nyatura | 4 |
| CODECO [Local] | CODECO | 1 |

**M23/AFC, Twirwaneho, Wazalendo and PARECO do not appear anywhere in this table.** Mai-Mai is a single undifferentiated category: no faction names (Yakutumba, etc.) are given. NDC and NDC-R are kept separate. The importer has regex fallbacks for M23/AFC, Twirwaneho, Wazalendo, PARECO, Nyatura and Mai-Mai variants, in case a later release names them.

## Counts (output as written)

- Sites: **3,469** (0 skipped for missing coordinates). Visits: **7,381**, from 7,419 rows after 38 same-day merges. No cap was needed. The file is 1.7 MB.
- Date range: **2009-01-01 to 2026-03-02**.
- Raw rows by source: 5,695 IPIS and 1,724 third-party.
- Year of each site's latest visit: 2009–2015: 1,123; 2016–2020: 869; 2021–2023: 1,123; 2024: 18; 2025: 258; 2026: 78.
- Sites by province: Sud-Kivu 920, Nord-Kivu 787, Ituri 494, Maniema 488, Tanganyika 211, Tshopo 126, Lualaba 115, Haut-Uele 111, Haut-Lomami 97, Haut-Katanga 93, Kasaï-Oriental 15, Bas-Uele 12.
- Armed-group presence at the latest visit: **true 593**, false 2,231, unknown 645. 879 sites had an armed group at some visit.
  - By group (sites at latest visit): Mai-Mai 280, NDC 108, Raia Mutomboki 85, FDLR 49, Other local 48, NDC-R 28, ADF 13, UPLC 13, FRPI 10, Nyatura 2.
  - By province: Nord-Kivu 272, Sud-Kivu 181, Ituri 73, Maniema 21, Tanganyika 20, Haut-Katanga 12, Tshopo 10, Lualaba 4.
- FARDC present at the latest visit: 867 sites (645 unknown).
- iTSCi at the latest visit: true 451, false 904, null 2,114.
- Minerals (sites): gold 2,274, cassiterite 957, coltan 440, copper 152, wolframite 127, diamond 111, cobalt 76, tourmaline 21, other 20, manganese 6.

## Known limitations

- **No M23-era control data.** M23/AFC is never recorded. Rutshuru and Nyiragongo have no sites at all. Walikale's latest visit is 2023-03, Lubero's 2022-02, and Mwenga and Shabunda's 2023. The only 2025 visits in Masisi (16) and Kalehe (18), which include Rubaya sites such as D3 Bibatama, D4 Gakombe and Luwowo/Gasasa, are third-party visits without armed-actor data. They are therefore `null`, not "no armed presence". Do not read this dataset as showing who controls Rubaya now. Use `control_claims` for that.
- Visit dates lag control changes, often by years. A site's latest visit may be from 2009–2015.
- Since 2024, IPIS's own visits are concentrated in Ituri, Lualaba, Haut-Katanga and Haut-Uele, plus Fizi in Sud-Kivu. IPIS may also hold back new data for up to 6 months after a report.
- About 989 visits (13%) carry 1 January dates. These are probably year-only dates.
- "Presence" covers anything from daily presence to random visits. Frequency and interference fields (taxation, digging, buying) are not exported here.
- Third-party data is republished by IPIS with mixed coverage. It is marked `src: "3p"`.
- This is the webmap view of the data, not the official Google Form download. Its columns may differ slightly from the curated full layer.
- The evidence tier is `documented`: IPIS field surveys. It does not establish site-level control or designation.
