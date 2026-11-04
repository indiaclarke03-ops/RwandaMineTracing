# Corrections to the spec (verification pass, 2 Nov 2026)

Source checks (Tavily, read with `tavily_extract`) and Sayari entity resolution found these differences from `RWANDA_CASE.md` / `SAYARI_METHOD.md`. The seed data follows the corrected version; logs are in `pipeline/notes/`.

| Spec said | Verified | Source |
|---|---|---|
| ≥150 t coltan smuggled to Rwanda **in 2024** | **150 t per month** smuggled (annex 29); ~120 t/month traded under M23 (para 64) | UN S/2024/969 |
| Aug 2025 Treasury sanctions — targets VERIFY | 12 Aug 2025 (sb0221): PARECO-FF, CDMC and two Hong Kong exporters (East Rise, Star Dragon). No Rwandan or M23 target | Treasury sb0221 |
| Eight smelters as buyers of conflict coltan | All eight processed most Rwandan coltan and were found compliant; only Tanbre, OTIC, Jinxin ("may have") and Ulba are linked to Rubaya. Ulba and Taniobis deny | Global Witness, Jun 2026 |
| Rubaya landslides, Jan 2026, ≥227 dead | Two events: 28 Jan 2026 (counts conflict: >200 / ~400 / >430; "227" source unread) and 3 Mar 2026 (>200 incl. ~70 children, DRC Ministry of Mines) | BBC, TV5MONDE, PNN, Mongabay |
| Lomera: "M23-linked operator" | Amnesty names no single operator; M23 expelled cooperatives Apr–May 2025 and works with a company and Rwandan nationals | Amnesty AFR 62/1454/2026 |
| ITSCI: six exporters suspended/expelled 2024–2026 | Four verified by name, all 2025 (African Panther — later lifted, Sunrise, Space Mining, Philbert). No 2024 suspension found | ITSCI |
| EU–Rwanda MoU "under reconsideration" | Put under review 24 Feb 2025, not suspended; still not suspended Oct 2025; outcome unknown | Euronews; Taipei Times |
| EU Battery Regulation Aug 2027 — tantalum/tin? | Applies 18 Aug 2027 (Reg. 2025/1561); Annex X covers cobalt, graphite, lithium, nickel only — **3T not in scope** | EUR-Lex |
| AFC | Succeeded by the "Front for the Refoundation of the Nation" on 12 Oct 2026 | Treasury sb0668 |
| State Dept 28 Oct 2026 "advisory" | One sentence in a press statement, not a formal advisory | State |
| Missing from timeline | OFAC 30 Apr 2026 (sb0480, Kabila) and 2 Jun 2026 (sb0518, FDLR / M23 commanders) — to add | Treasury sb0543 |
| Boss Mining buyers across TZA/CHN/KOR/JPN/ARE/GBR/NLD | This run found UAE buyers only (Novacore FZE 30 rows, Halcyon 1) | Sayari |

## Sayari method notes
- Links to M23 all use the generic `linked_to` type; the meaning ("Providing support to" vs "is linked to") is only in a text field. Parse it.
- Filtered traversals (`shareholder_of` etc.) only run person → company. From a company node, use the entity profile or the reverse `has_*` types.
- Rwandan MoD (`8fKsoMBpty_6tRnAfSuONQ`) and Zigama have no Sayari relationships yet.
- Sayari doesn't return designation dates; take them from the OFAC/EU notices.
- Sunrise Metal, Philbert, Space Mining and Rani Mining matches are **low confidence** (name + country + trade route, no identifiers). Confirm against ITSCI/RMB exporter lists.

## Second verification pass (4 Nov 2026)

| Earlier | Now | Source |
|---|---|---|
| M23 control of Lomera from Apr 2025 | From mid-Feb 2025 (UN); cooperatives expelled Apr–May 2025 (Amnesty); site reportedly closed since about Sep 2025 | S/2025/858; Amnesty |
| 2025 coltan excess 627 t | 1,444 t with the tin-ore baseline frozen at 2022–24; 627 t stands only if the 2025 tin-ore surge is domestic | Our analysis |
| Tin-ore rise of 2,841 t in 2025 | About 1,620 t went to Cambodia at $1.6/kg vs about $20/kg elsewhere; about 1,221 t without it. Unconfirmed | Comtrade; Sayari |
| East Rise trade record unconfirmed | Same address as OFAC-listed East Rise (SDN 55048); treated as the same entity with moderate-to-high confidence | Sayari |
| Denials: Ulba, Taniobis | OTIC, Tanbre and Jinxin also denied the claims to Global Witness | Global Witness |
| Metarex owned by Konovalchik (GW) | Cyprus record shows a 50/50 split between Konovalchik and Tolmatchev family names | Registry via Sayari |
