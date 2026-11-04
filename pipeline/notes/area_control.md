# Dated area control for the site map (run 2026-11-04)

Full data: `area_control.json` (31 areas, 57 claims, 24 sources). All counted sources were read in full or with `tavily_extract`. UN reports and the Amnesty briefing were read as complete PDFs from the ecoi.net and Amnesty mirrors.

## How many IPIS sites are classified

Of 3,469 sites, at the latest evidence for each area:

| Status | Sites | Basis |
|---|---:|---|
| Armed-held, by site name | 12 | Rubaya 8 (M23), Kachanga 2 (Yakutumba, last dated 2024), Mongbwalu 2 (CODECO) |
| Armed-held, by radius (M23) | 22 | Rubaya ring 7, Lomera neighbours 4, Nyabibwe 4, Masisi centre 3, Lemera hills 3, Mushaki 1 |
| Armed-held, by radius (Wazalendo) | 25 | Kamituga. Rests on one article; show apart |
| Contested | 48 | Numbi 20, Nzibira 11, Lumbishi 8, Mpeti 3, Luntukulu/Lubimbe 2, Mikenge 2, Ngungu 1, Sange 1 |
| Armed presence only | 3 | Pinga (FDLR) |

- **Everything else is unknown, not "not armed-held".** A site with no claim has no evidence either way.
- **Radius sites are `inferred`**, even when the claim about the place is documented.
- **Contested does not mean unarmed.** An armed group is present at all 48. M23 is the likely holder at Nzibira and Numbi.
- **No territory-wide rule was used.** Every source says "part of" or "most of", so nothing is applied to a whole territory. Rutshuru and Nyiragongo have no IPIS sites anyway.

## Main findings

- **Rubaya:** PARECO-FF held it to April 2024, then M23 from 30 April 2024. Latest confirmation is the UN's March 2026 imagery and Amnesty in mid-2026. Oct 2026 fighting reached Kibabi and Ngungu, but Rubaya town was not reported as threatened.
- **Lomera:** it is not in IPIS. The UN places it at Luhihi, Kabare. It was found only in late 2024 or Jan 2025. The map point in `key_site_updates` is Luhihi village, a proxy, so show it as approximate. The UN dates M23 control to mid-Feb 2025, earlier than the April 2025 in `control_claims.json`. The site has been closed since about Sept 2025 and is being cleared.
- **Numbi:** government forces took it on 6 Oct 2026 and M23 reportedly retook it on 7 Oct. Later status is unclear.
- **Walikale town:** M23 held it only from mid-March to early April 2025.
- **Uvira:** M23 held it from 10 Dec 2025 to 18 Jan 2026.
- **Bisie:** no source read places M23 in control. The mine only suspended work from 13 March to mid-April 2025.
- **Gold:** the UN says most South Kivu gold is in FARDC and Wazalendo areas, not M23 ones (S/2025/858 para 58).

## Polygons

**No public GeoJSON or KML found.** Critical Threats offers shapefiles by email request, and that is the best next step. IPIS has shapefiles but publishes only images, and warns of +/-10 km error and against using them for individual mines. HDX has none. GitHub repository search found none, but code search was not run. Commons has SVG images only. Nothing was digitised.

## Red-status overlay (not a control source)

The Ministry's Feb 2025 annex lists 38 Masisi and Kalehe sites as red. 33 of the 34 with coordinates match IPIS sites within 0.3 km; only Luwowo does not. 17 are already in an area. These 16 are not, and would need a control source first: Rwandanda 01113, Bihula 01114, Mululu 01116, Kamatale-Kamatembe 02632, Birambo 00302, Katembe 01119, Karuba Bugoroba 00308, Katovu 01338, Bihovu 00864, Chakubangwa 03287, Kiboto 00859, Kihonga 03288, Kisongati 03303, Lijiwe 00837, Manga 00919, Nkwiro 00918. The ban was extended only to about Feb 2026 as far as we checked.

## Still unknown

- Who holds Numbi, Lumbishi and Sange today.
- Whether the Nov 2026 Masisi clashes changed anything; those articles were not read.
- Current status of Masisi centre and Minova, last dated May 2025.
- IPIS site matches for Twangiza, Karhembu, southern Lubero and Ngungu mine.
- Any km2 for M23-held area. The UN gives only relative growth.
- Armed control across most of Walikale, Lubero, Shabunda, Mwenga, Fizi and Ituri.

Denials and other caveats are listed in the JSON. Show denials next to the claims.
