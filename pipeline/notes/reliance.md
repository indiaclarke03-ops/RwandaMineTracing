# Reliance: how much we depend on these mines, and where the metals go

Run date 2026-11-19. Data: `reliance.json` (26 sources, 69 production rows). Every source was read with `tavily_extract` or downloaded and parsed, except two flagged `verified_by_extract: false` (Bookhagen 2020 smartphone paper, paywalled; and the project's own Comtrade seed, which was not re-read).

## World mine production (USGS MCS 2026, metal content)

| Metal | World 2025e | DRC | Rwanda | DRC+Rwanda share | Next largest |
|---|---|---|---|---|---|
| Tantalum | 2,500 t | 1,300 t | 400 t | **68%** (2024: 66%) | Nigeria 390, Brazil 190, China 80 |
| Tin | 290,000 t | 27,000 t | 4,600 t | **10.9%** (2024: 10.2%) | China 71k, Indonesia 61k, Peru 33k, Brazil 28k |
| Gold | 3,300 t | not listed (27.9 t official 2024, USGS MYB) | ~0.35 t | **~0.9%** official, ~1.2% with undeclared artisanal | China 380, Russia 310, Australia 280 |

The shares are our own arithmetic (`inferred`). How to read them:
- USGS builds Rwanda's tantalum figure from its **exports**, at an assumed 26% Ta2O5 grade. That means it includes DRC ore smuggled into Rwanda. Treat DRC + Rwanda as one Kivu supply.
- About half of the DRC's tantalum (an estimated 630 of 1,270 t in 2024) is modelled as tantalum contained in cassiterite. Also, 47% of the DRC's declared coltan comes from Haut-Katanga, not the conflict-affected east.
- Tin: Bisie (Alphamin, in Walikale, North Kivu) alone is about 5.9% of world tin. Of the DRC's cassiterite, 37% is artisanal.
- Gold: eastern-DRC artisanal output was about 11.6 t/yr (site study, 2013–15, cited by INTERPOL), and 95–98% of it was thought to be smuggled. Rwanda mines about 0.35 t, yet gold made up 47% of its 2024 exports.
- Artisanal and small-scale mining supplies 20–25% of world tantalum (EU SCRREEN2). RFC Ambrian puts artisanal mining in Central Africa at about 60%.

**Rubaya, about 15% of world tantalum.** Global Witness, IPIS and Reuters all give this figure, and none states a method. The UN GoE (S/2024/969) calls Rubaya the largest coltan mine in the Great Lakes region and gives about 120 t of coltan a month (para 64), but no percentage. Our cross-check: 1,440 t/yr × 20–40% Ta2O5 × 0.819 = 240–470 t of tantalum, or 9–19% of world output (about 12% at Rwanda's assumed 26% grade). That is consistent with 15%.

## What the metals are used for
- **Tantalum** (RFC Ambrian 2025 analyst estimate, from T.I.C./USGS data; tier `reported`):
  - electronics 52%: capacitors 34%, semiconductors (sputtering targets) 9%, hard disks 7%, SAW filters 2%
  - metallurgy 34%: aerospace superalloys 15%, chemical equipment 7%, gas turbines 6%, medical 3%, furnaces 3%
  - carbides 9%; other 5%

  Cross-check from T.I.C. 2020 data: capacitors about 36%, electronics about 50%, metallurgy about 25%. Products: phones, laptops, cars (ABS, airbags, engine and EV electronics), jet engines, implants, AI servers.
- **Tin** (ITA, May 2025):
  - solder 52%: electronics 30%, solar PV 11%, industrial 7%, 5G 3%, EVs 1%
  - chemicals 16%, tinplate 11%, lead-acid batteries 8%, tin-copper alloys 6%, other 7%
- **Gold** (WGC, full year 2025, 4,999 t excluding OTC): investment 43.5%, jewellery 32.8%, central banks 17.3%, technology 6.5% (electronics 270 t).

## Per-product content (only where a source gives a number)
- **Notebook, around 2010** (Oeko-Institut 2012): 1.7 g tantalum and 100 mg gold.
- **Smartphone gold:**
  - 4 mg median on the main board (Jandric et al. 2026, measured)
  - about 30 mg estimated for the whole phone (Oeko 2012)
  - 34 mg in a 2005 phone (USGS)
  - 16.8 mg in Bookhagen 2020, **unverified**
- **Cars:**
  - tin in the circuit boards: 19.7 g in a Camry sedan, 71.8 g in a GMC pickup (INL 2020)
  - gold: about 1.5 g in a 2015 car, range 0.2–7 g (EU JRC 2021)
- **AI server board:** up to 25 tantalum capacitors on an Nvidia H100 board (Argus, quoting a former Yageo CTO).
- **Gaps:** tantalum per smartphone, tantalum per car, and tin per phone or laptop. Oeko found no smartphone tantalum data; the INL and Jandric values sit in supplementary tables we did not read.

## Chokepoints
- China imports about 30% of world tantalum consumption and is the largest refiner (RFC Ambrian).
- China imported 2,286 t of Rwandan coltan in 2024 (Global Witness) and 2,865 t in 2025 (Argus). In the project's own Comtrade data, China took about 79% of Rwanda's coltan.
- Six of the eight smelters processing most Rwandan coltan are Chinese (Global Witness).
- US imports of tantalum metal and powder come from China (47%), Germany (25%) and Kazakhstan (16%). US import reliance is 100%.
- Yageo makes about 40% of the world's tantalum-polymer capacitors.
- **Gap:** we found no public source for each country's share of tantalum-capacitor manufacturing or of tantalum processing capacity.

## Why tantalum is hard to replace
- It is on the US Critical Minerals List (2025; tin is too) and the EU critical raw materials list (2023), but it is not an EU strategic raw material.
- USGS says substitutes exist (niobium, ceramics, aluminium in capacitors), but they cost performance or money.
- EU SCRREEN2:
  - tantalum remains the only reliable capacitor choice where reliability, size or safety matter
  - in jet-engine superalloys, recertification takes years, so substitution is unlikely
- Recycling is no quick fix: end-of-life recycling is below 1% (RCR review 2023), and the tantalum in German notebooks was not recovered at all (Oeko 2012).
