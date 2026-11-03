# Case 1: Rwanda / eastern DRC

The first case to build out fully. Everything here needs a `source_id` once in the data files; sources are named inline. Items marked **VERIFY** came from secondary reporting and need checking against the primary document.

## The story in one paragraph

M23, an armed group the UN Group of Experts and the US say is backed and directed by Rwanda's army, took the Rubaya coltan mines in North Kivu on 30 April 2024 and has since expanded into gold areas in South Kivu. It taxes production and controls transport routes into Rwanda, where Congolese minerals are mixed with Rwandan output and exported as Rwandan. Rwanda's mineral exports have risen faster than its plausible production. Coltan goes via Tanzanian and Kenyan ports, largely to Chinese smelters; gold goes through Gasabo Gold Refinery in Kigali. Since 2025 the EU and US have responded with escalating sanctions, and a US-brokered peace deal includes a minerals framework. Whether any of it has reduced the flow is the open question the tool should answer.

## Actors

| Actor | Role | Key evidence |
|---|---|---|
| **M23 / AFC (Alliance Fleuve Congo)** | Armed group controlling mine sites and trade routes; AFC is its political wing | UN GoE reports; OFAC designations. Sayari: `diV1zDu2TnrgnGxCb3WD8Q` (M23), `tANZaCKgA6oMa6jl9OmdHg` (AFC) |
| **Rwanda Defence Force (RDF)** | Deployed alongside M23 in North and South Kivu; oversees gold transport to Kigali per Treasury | OFAC 2 Mar 2026; Treasury `sb0543`, `sb0668`. Sayari: `E74Od6qY6XwVVlUY-W0G7Q` |
| **Rwandan Ministry of Defence** | Umbrella for RDF; sanctioned 28 Oct 2026 | Treasury `sb0668` |
| **Zigama Credit and Savings Society** | Rwandan financial institution; a branch allegedly enabled transport of M23-area gold to Kigali | Treasury `sb0668`. Sayari: `GBgw7aYaaYfLAQO2KsliQA` |
| **Gasabo Gold Refinery** | Rwanda's gold refinery (began operating 1 June 2022); receives gold from RDF/M23-held areas | EU (Mar 2025); OFAC (25 Jun 2026, `sb0543`), which alleges ≥60 kg smuggled in early 2026. Sayari: `i0CKJhgvHKympxUfQw1BUA` |
| **Jean Malic Kalima Karekezi** | Gasabo chairman; controls Bugambira Mines, Wolfram Mining and Processing, Rwinkwavu Mining Corporation | OFAC `sb0543`. Sayari: `3IPk7makLLnIcTI_C5uNSw` |
| **Bosco Kayobotsi** | Gasabo general manager | OFAC `sb0543`. Sayari: `Pj4_K8Exf3J8OW-nAvaiZg` |
| **Francis Kamanzi** | CEO, Rwanda Mines, Petroleum and Gas Board | EU sanctions, Mar 2025 |
| **Rwandan coltan exporters** | Global Witness found evidence that 5 of the 7 largest bought Rubaya conflict coltan: African Panther Resources, Sunrise Metal Company, Boss Mining Solution, Kanzamin, Philbert Trading Minerals; smaller: Space Mining, Rani Mining | Global Witness (Jun 2026); Reuters on Boss Mining (Jul 2025) |
| **Smelters** | Ningxia Orient Tantalum (OTIC), Jiujiang Jinxin, Jiujiang Tanbre, Jiujiang Zhongao, Ximei Resources, Hengyang King Xing Lifeng (China); Ulba (Kazakhstan); Taniobis (Thailand) | Global Witness (Jun 2026) |
| **Traceability schemes** | ITSCI (dominant; has suspended/expelled six coltan exporters since 2024); Better Mining (SLR Consulting) as an alternative that doesn't publish members | Global Witness |
| **Government of Rwanda** | Denies supporting M23; says DRC hasn't met its peace-deal obligations | Public statements; record in `responses_to_claims` |

## Sites (start with these)

| Site | Mineral | Control | Since | Source |
|---|---|---|---|---|
| **Rubaya** (Masisi, North Kivu) | Coltan (also tin, tungsten) | M23 | 30 Apr 2024 | UN GoE; IPIS |
| **Mushaki** (Masisi) | Trading centre | M23 | 2024 | UN GoE |
| **Lomera** (Kabare, South Kivu) | Gold | M23-linked operator | 2025–26 | Amnesty (Sept 2026) |
| South Kivu gold sites in M23-held areas | Gold | M23/RDF | 2025– | Treasury `sb0543`, `sb0668` |

Pull the full site list and armed-presence history from IPIS open data, then overlay M23 area-of-influence polygons by date.

## Flows

**Coltan:** Rubaya → Mushaki/Goma → border (Goma–Gisenyi; since M23 took Goma, much crosses openly per Global Witness) → Rwandan exporter (tagged via ITSCI or Better Mining) → Dar es Salaam / Mombasa → UAE traders or directly to Chinese, Kazakh and Thai smelters → capacitor and alloy makers → electronics, aerospace, defence brands.

**Gold:** South Kivu sites → RDF/M23-escorted transport → Rusizi District, Rwanda (across from Bukavu) → Gasabo Gold Refinery, Kigali → export (UAE is a major destination for Rwandan exports per 2025 reporting; **VERIFY** for gold specifically).

## Impacts to show

- M23 revenue: ~US$800k/month from Rubaya coltan taxation (UN GoE, Dec 2024)
- Volume: ≥150 t coltan smuggled to Rwanda in 2024 (UN GoE); described by the Group as the largest contamination of Great Lakes mineral supply chains to date
- Rwanda's cassiterite exports up 58% in 2025 without matching production (UN GoE S/2026/466) — **VERIFY** in the report
- Labour conditions at Rubaya: extreme hours, minimal food, child labour (Amnesty Sept 2026; ResponsibleSourcingTool 2026)
- Rubaya landslides, Jan 2026: at least 227 deaths reported — **VERIFY**
- Violence and displacement around sites: ACLED

## Response timeline

| Date | Actor | Action | Type |
|---|---|---|---|
| Jul 2024 | US State Dept | Statement of concern on mineral supply chains in eastern DRC | Advisory |
| Mar 2025 | EU | Sanctions on Gasabo Gold Refinery, RMB CEO Francis Kamanzi, M23 and RDF commanders; EU–Rwanda minerals MoU under reconsideration | Sanctions |
| 27 Jun 2025 | DRC, Rwanda (US-brokered) | Peace agreement | Diplomatic |
| Aug 2025 | US Treasury | Conflict-minerals sanctions — **VERIFY** targets | Sanctions |
| 4 Dec 2025 | DRC, Rwanda, US | Washington Accords incl. Regional Economic Integration Framework (minerals transparency) | Diplomatic / economic |
| 2024–2026 | ITSCI | Six coltan exporters suspended or expelled | Industry |
| 2 Mar 2026 | US OFAC | Rwanda Defence Force and four senior officials | Sanctions |
| 25 Jun 2026 | US OFAC | Gasabo Gold Refinery, Kalima, Kayobotsi, Bugambira, Wolfram, Rwinkwavu | Sanctions |
| 28 Oct 2026 | US OFAC + State | Rwandan MoD and Zigama; State urges private sector to examine supply chains | Sanctions + advisory |
| Aug 2027 (upcoming) | EU | Battery Regulation due diligence obligations apply (covers cobalt, lithium, nickel, graphite; check whether tantalum/tin are in scope) | Regulation |

## "Has it worked?" — indicators to track

For each response, define the indicator that should move, then show whether it did:

| Response | Should move | Data |
|---|---|---|
| EU sanctions on Gasabo (Mar 2025) | Rwandan gold export volumes/destinations; EU buyers | Comtrade, Rwandan stats, Sayari trade |
| ITSCI suspensions | Exporters switching to Better Mining; share of exports untagged | Global Witness, ITSCI |
| US sanctions on Gasabo network (Jun 2026) | Gold flows through Gasabo; transactions by named companies | Sayari trade (before/after), Treasury follow-ups |
| US sanctions on MoD/Zigama (Oct 2026) | Too early; set up a 3- and 6-month review | — |
| Washington Accords | M23 territorial control; mine control changes; minerals transparency measures actually implemented | IPIS, Critical Threats, UN GoE |
| All of the above | Laundering gap; M23 revenue estimates; coltan/cassiterite export trend | Calculated + UN GoE |

Steptoe notes it's unclear whether Treasury will go after the mineral traders themselves. That gap (sanctions hit the refinery, banks and military, but not yet the named coltan exporters) is a strong policy finding to surface.

## Open questions for the case

- Do Sayari trade records show buyers of Gasabo gold changing after the EU and US designations?
- Did exporters suspended by ITSCI keep shipping (Sayari trade by date)?
- Which of the Global Witness smelters are RMI-conformant, and which brands list them in SEC filings?
- What's behind the Zug, Switzerland address on African Panther-related records?
- Is the UAE an increasing intermediary after sanctions?
