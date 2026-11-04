# Tracing unsanctioned exporters to armed groups (run 2026-11-04)

Data: `unsanctioned_tracing.json` (19 sources, 66 entities, 72 links, 20 verdicts). None of these companies is sanctioned. Armed-group links below are allegations graded `documented`, not findings of knowledge or intent.

## Does the mixed method work?
**Partly.** It works for finding owners and connections, and it does not, on its own, tie a company to an armed group.
- Almost all Rwandan owner names came from Global Witness, which saw corporate documents we cannot read. The Rwanda Mining Association list gave independent support for representatives.
- Open registries outside Rwanda added real structure (Cyprus via Sayari, Zefix, Companies House, GLEIF, Uganda EITI).
- Every strong or moderate armed-group link still rests on UN or NGO testimony and documents. Customs and registry data add context, never ore origin (rule 10).
- No company moved up a verdict because of our own inference. The newer exporters mostly stay at `weak` or `none found`.

## Verdicts
| Company | Link | Best tier | Basis |
|---|---|---|---|
| Rani Mining | strong | documented | UN para 218 (invoices, assays, audio) plus GW |
| Philbert Trading | strong | documented | UN para 219 plus two GW sources |
| Kanzamin | strong | documented | UN para 220 plus GW traders and employee |
| Boss Mining Solution | strong | documented | S/2025/446 para 119 plus GW; Habimana denies |
| African Panther | moderate | documented | Five traders, GW only |
| Sunrise Metal | moderate | documented | GW test call, ITSCI incidents |
| Space Mining | moderate | documented | Two traders, GW only |
| 3U Mining Supporters (added) | moderate | documented | UN para 218 only |
| Halcyon | moderate | documented | Buyer from Kanzamin; denies Rubaya origin |
| Novacore | moderate | documented | Buyer from Boss Mining, shared owners |
| East Group, Hillside | weak | documented | ITSCI incidents only; no Rubaya evidence |
| Tawotin | weak | documented | Sold to designated East Rise; denies |
| Minterra | weak | documented | East Group's buyer; shared past personnel |
| Better Off (added) | weak | documented | Apparent Sunrise successor |
| ETS Munsad, Tebuka, Meta Trading, Congo Ressources, Saiko | none found | inferred | Customs rows or a shared buyer only |

"Strong" means a UN report plus a second organisation. UN and GW may share sources, so these are not fully independent.

## Strongest new links
1. **African Panther group (`inferred`, moderate).** The Baarerstrasse 53 lead resolves. Principal Investments AG (CHE-113.516.288) was African Panther Resources AG until 2019 and is in liquidation. Uganda EITI lists it as shareholder of African Panther (U), with Henry Guy Dudgeon as director. GW names Henry Dudgeon as co-owner of the Rwandan firm. No identifier joins the Rwandan company, and nothing places Rubaya ore in the Swiss or Ugandan firms.
2. **Metarex ownership (`documented`, strong).** The Cyprus record (HE 322537, read through Sayari) shows a 50/50 split between Konovalchik and Tolmatchev family names. That refines GW's statement that Konovalchik owns it. The Metarex to Novacore step remains GW-only.
3. **East Rise identity resolved.** The unflagged trade node has the same address as the SDN 55048 record. Sayari has not merged them, so trade rows to East Rise show no sanction flag.
4. **Rani to East Rise (`inferred`, moderate).** A ships_to edge, to 25 Jul 2025, before the designation. Not reported by GW. Row-level confirmation failed.
5. **Tawotin with WMP (`inferred`, moderate).** Three tungsten rows name Tawotin jointly with Wolfram Mining and Processing, later OFAC-listed, as shipper, all to East Rise. This shows a shared shipment label, not ownership.
6. **UN named intermediaries (`documented`).** Gilbert Kabano (Rani's main agent) and 3U Mining Supporters. Gilbert Kabano is **not** linked to Bazimazika Kabano Bazinga, the AFC/M23-appointed coordinator: a shared name is not identity.

## Weak connections
Shared buyers (Halcyon, Traxys, Minterra, East Rise and others) are logged as weak `inferred` links. They show a common customer, not ownership or ore origin. A single East Group and Hillside joint row is treated the same way.

## Sources reachable without login
- **Useful:** Zefix, Companies House, GLEIF, Uganda EITI, Rwanda Mining Association magazine, UN and NGO PDFs.
- **Open but no use here:** org.rdb.rw (no public search found), RMB site (no licensee list found), Official Gazette (landing page only), DMCC page, HDX ACLED.
- **Blocked:** OpenCorporates, Aleph, ICIJ Offshore Leaks, RAK ICC, ITSCI list file (404). ICIJ was not searched, so it is not a negative result.
- **ACLED on HDX:** aggregated counts by country and month, no companies. It adds conflict timing only.
- **IPIS:** no company fields, zero mentions of any target. It cannot support company attribution.

## Gaps
- No Rwandan registry record was read directly, so GW's owner claims are not independently confirmed.
- S/2025/858 annexes and most of S/2024/432 were not read. African Panther's "no UN naming" is therefore not a clean negative.
- Sayari rows have no agent, broker or forwarder field, so those pair checks could not be run. No exporter phone data exists there.
- Shipper and receiver filters were ignored in tests, and trade facets returned only country buckets.
- Phone numbers, passport numbers, dates of birth and home addresses were deliberately left out.

## Denials
18 denials and non-responses are logged in the JSON, including Habimana, Halcyon, Novacore, Traxys, Tawotin, Huber, CDMC and Minterra. Show them next to any claim (rule 5).
