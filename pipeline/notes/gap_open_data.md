# Laundering-gap open data: run of 2026-11-03

Machine-readable data: `gap_open_data.json` (sources, 313 series rows, conversions, caveats).
Raw Comtrade JSON, BNR xlsx, USGS xlsx and UN PDFs were saved in the session scratchpad. They are not committed.

## Exports vs USGS "production", gross concentrate tonnes

| Mineral | Year | Rwanda reported (Comtrade = BNR) | Mirror (partner imports) | of which China | USGS gross "production" | USGS contained |
|---|---|---|---|---|---|---|
| coltan | 2018 | 1,644 | 1,434 | 601 | 1,644* | 350 t Ta |
| coltan | 2019 | 1,354 | 1,336 | 789 | 1,354* | 290 |
| coltan | 2020 | 963 (BNR 1,028) | 1,427 | 866 | 1,028* | 220 |
| coltan | 2021 | 1,046 | 3,189 (1,106 excl. Malaysia) | 343 | 1,046* | 220 |
| coltan | 2022 | 1,305 | 1,545 | 811 | 1,305* | 280 |
| coltan | 2023 | 2,070 | 2,030 | 1,571 | 1,300e | 280 |
| coltan | 2024 | 2,384 | 2,909 | 2,286 | 1,300e | 300 (374 all sources) |
| coltan | 2025 | 2,743 | 4,763 (partial; 2 reporters) | 2,865 | n/a | 400e |
| tin | 2018 | 4,780 | 1,665 | ~0 | 4,780 | 3,000 t Sn |
| tin | 2019 | 3,776 (BNR 3,861) | 3,643 | 0 | 4,077 | 2,600 |
| tin | 2020 | 2,325 (BNR 2,820) | 2,029 | 0 | 3,764 | 2,400 |
| tin | 2021 | 2,879 (BNR 3,136) | 3,206 | 0 | 3,679 | 2,300 |
| tin | 2022 | 3,752 (BNR 4,452) | 3,476 | 48 | 5,445 | 3,400 |
| tin | 2023 | 3,922 (BNR 4,588) | 3,017 | 502 | 5,844 | 3,700 |
| tin | 2024 | 4,018 (BNR 4,861) | 4,223 | 597 | 6,485 | 4,100 |
| tin | 2025 | 6,349 | 4,271 | 1,564 | n/a | 4,600e |
| tungsten | 2018 | n/a (BNR 1,966) | 611 | 584 | 1,966* | 940 t W |
| tungsten | 2019 | 1,884 | 143 | 90 | 1,884* | 900 |
| tungsten | 2020 | 1,933 (BNR 1,809) | 429 | 269 | 1,809* | 860 |
| tungsten | 2021 | 2,825 | 564 | 535 | 2,825* | 1,340 |
| tungsten | 2022 | 2,943 | 408 | 386 | 2,943* | 1,400 |
| tungsten | 2023 | 2,502 | 578 | 212 | 2,502* | 1,200 |
| tungsten | 2024 | 2,741 | 1,295 | 1,123 | 2,741* | 1,300 |
| tungsten | 2025 | 3,009 | 692 | 415 | n/a | 1,300 |
| gold (kg) | 2018 | 2,169 | 18,134 (UAE) | | | 350 kg Au |
| gold (kg) | 2020 | 11,784 | 11,836 | | | 310 |
| gold (kg) | 2023 | 13,934 | 13,831 | | | 350 |
| gold (kg) | 2024 | 19,219 ($1.51bn) | not reported | | | NA |
| gold (kg) | 2025 | 6,359 ($519m) | not reported | | | n/a |

\* USGS footnote: "Reported exports". This is not an independent production figure.

## Key findings
- **The USGS production side is circular for coltan and tungsten.** USGS gross tonnages are Rwanda's own BNR export figures. For coltan in 2023 and 2024, USGS freezes its estimate at 1,300 t while exports rose to 2,070 t and 2,384 t. The difference, about 770 t in 2023 and 1,080 t in 2024, is the only "gap" that USGS implies, and USGS marks it as an estimate.
- **There is no independent production capacity estimate.** The Rwanda Development Board claims 8,000–9,000 t/yr of 3T combined. The UN Group of Experts (S/2025/446, para 120) says NISR data, geology and ITSCI contradict that claim. Comtrade 3T exports in 2025 were about 12,100 t.
- **Geological plausibility (UN annex 53, citing BGR 2020):** coltan is about 25% of mixed coltan-cassiterite deposits in the region. The ITSCI tantalite share of Rwandan tagged exports rose from 21% (2020) to 31% (2024) (Global Witness). The 2024 coltan/(coltan+cassiterite) export ratio is about 33%.
- **Mirror data:** partner imports of Rwandan coltan reached 2,909 t in 2024, above Rwanda's reported 2,384 t. This matches Global Witness's ">2,900 t". China is the main buyer: 1,571 t in 2023, 2,286 t in 2024 and 2,865 t in 2025.
- **DRC context:** USGS puts DRC Ta output at 1,270 t (2024). The UN reports about 120 t/month of Rubaya coltan under M23 from May to Oct 2024 (para 64), and 150 t/month smuggled to Rwanda (annex 29).

See the `caveats` in the JSON before using any of this. Every gap built from these numbers is tier `inferred`.
