#!/usr/bin/env python3
"""Import IPIS artisanal mining site visits (eastern DRC) into a compact seed file.

Usage:
    python3 pipeline/import_ipis.py RAW_FILE [--out pipeline/seed/ipis_sites.json]

RAW_FILE is one row per site visit, keyed by IPIS `pcode`. Accepted shapes:
  * JSON array of row objects (the `opendata.cod_mines_webmap_en` table the
    IPIS v6 webmap loads; see pipeline/notes/ipis_import.md),
  * GeoJSON FeatureCollection with the same property names,
  * CSV with the same column names.

Data: IPIS, licensed ODC-BY 1.0 (attribute IPIS). Stdlib only.
"""
import argparse
import csv
import json
import os
import re
import sys
from collections import Counter, OrderedDict, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.join(HERE, "seed", "ipis_sites.json")
SOURCE_ID = "src_ipis_asm"
MAX_BYTES = 3 * 1024 * 1024
VISIT_CAP = 6

# Non-state armed group types in IPIS `agN_type`.
ARMED_TYPES = {"Local armed group", "Foreign armed group"}
# Third-party rows (source != "IPIS") mostly leave the armed-actor block at
# "None" because it was not collected (97% "None", 77% no worker count). We
# read "None" there as unknown (null), except for these third-party sources,
# which do record armed actors.
THIRD_PARTY_WITH_ACTORS = ("Third party: BGR/DRC project 2026",)
# State actors in agN; never counted as armed-group presence.
STATE_NAMES = {"FARDC", "PNC", "PMH"}

# Light normalisation of armed-group names. Exact raw values seen in the data
# first, then regex fallbacks for spellings that may appear in later updates.
GROUP_EXACT = {
    "Maï-maï": "Mai-Mai",
    "Raïa Mutomboki": "Raia Mutomboki",
    "NDC": "NDC",
    "NDC-R": "NDC-R",
    "FDLR": "FDLR",
    "FRPI": "FRPI",
    "ADF": "ADF",
    "UPLC": "UPLC",
    "CODECO": "CODECO",
    "Nyatura": "Nyatura",
    "Autodéfense Zaïre": "Zaïre (self-defence group)",
}
GROUP_PATTERNS = [
    (r"\b(m23|afc|arc\s*/?\s*m23|alliance fleuve congo)\b", "M23/AFC"),
    (r"ra[iï]a?\s*-?\s*mutomboki", "Raia Mutomboki"),
    (r"nyatura", "Nyatura"),
    (r"ndc\s*-?\s*r|guidon", "NDC-R"),
    (r"^ndc\b|sheka", "NDC"),
    (r"fdlr|fdlr-foca", "FDLR"),
    (r"twirwaneho", "Twirwaneho"),
    (r"wazalendo", "Wazalendo"),
    (r"pareco", "PARECO"),
    (r"ma[iï]\s*-?\s*ma[iï]", "Mai-Mai"),
    (r"codeco", "CODECO"),
    (r"\badf\b", "ADF"),
]


def norm_group(raw, typ):
    raw = (raw or "").strip()
    if raw in GROUP_EXACT:
        return GROUP_EXACT[raw]
    low = raw.lower()
    if low in ("other", "autre", ""):
        return "Other foreign armed group" if typ == "Foreign armed group" else "Other local armed group"
    for pat, name in GROUP_PATTERNS:
        if re.search(pat, low):
            # Keep the faction detail for Mai-Mai variants, e.g. "Mai-Mai Yakutumba".
            if name == "Mai-Mai":
                rest = re.sub(r"ma[iï]\s*-?\s*ma[iï]", "", raw, flags=re.I).strip(" -")
                return ("Mai-Mai " + rest).strip()
            return name
    return raw


MINERALS = {
    "gold": "gold", "or": "gold",
    "cassiterite": "cassiterite", "cassitérite": "cassiterite",
    "coltan": "coltan",
    "wolframite": "wolframite",
    "copper": "copper", "cuivre": "copper",
    "cobalt": "cobalt",
    "diamond": "diamond", "diamant": "diamond",
    "tourmaline": "tourmaline",
    "manganese": "manganese", "manganèse": "manganese",
    "other": "other", "autre": "other",
}


def norm_mineral(m):
    m = (m or "").strip().lower()
    return MINERALS.get(m, m) if m else None


def to_int(v):
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None  # "No data" etc.


def to_float(v):
    try:
        f = float(v)
        return f if f == f else None
    except (TypeError, ValueError):
        return None


def load_rows(path):
    if path.lower().endswith(".csv"):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            return [{k: (v if v != "" else None) for k, v in r.items()} for r in csv.DictReader(fh)]
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    if isinstance(data, dict) and data.get("type") == "FeatureCollection":
        rows = []
        for f in data.get("features", []):
            p = dict(f.get("properties") or {})
            g = f.get("geometry") or {}
            if g.get("type") == "Point" and p.get("longitude") is None:
                p["longitude"], p["latitude"] = g["coordinates"][:2]
            rows.append(p)
        return rows
    if isinstance(data, list):
        return data
    raise SystemExit("Unrecognised raw file shape: expected JSON array, GeoJSON or CSV")


def parse_visit(r):
    """Return a per-visit dict, or None if the row has no usable date."""
    d = (r.get("visit_date") or "")[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
        return None
    groups, fardc_seen, pmh_coded = [], False, False
    for i in (1, 2, 3):
        name, typ = r.get(f"ag{i}"), r.get(f"ag{i}_type")
        if not typ or typ == "None":
            continue
        if typ.startswith("FARDC") or name == "FARDC":
            fardc_seen = True
        elif name == "PMH":
            pmh_coded = True  # mining police; IPIS codes it as "Local armed group"
        elif typ in ARMED_TYPES and name not in STATE_NAMES:
            g = norm_group(name, typ)
            if g not in groups:
                groups.append(g)
    t1 = r.get("ag1_type")
    third_party = (r.get("source") or "") != "IPIS"
    known = t1 is not None  # "None" string = none observed; null = no data
    if third_party and t1 == "None" and not (r.get("source_specify") or "").startswith(THIRD_PARTY_WITH_ACTORS):
        known = False  # armed-actor block not collected by this third party
    trace = r.get("traceability")
    itsci = True if trace == "iTSCi" else (False if trace in ("None", "Other") else None)
    return {
        "d": d,
        "ag": groups,
        "armed": (len(groups) > 0) if known else None,
        "fardc": fardc_seen if known else None,
        "w": to_int(r.get("n_workers")),
        "itsci": itsci,
        "pmh": pmh_coded,
        "third_party": third_party,
        "minerals": [m for m in (norm_mineral(r.get(f"m{i}")) for i in (1, 2, 3)) if m],
        "raw_groups": [(r.get(f"ag{i}"), r.get(f"ag{i}_type")) for i in (1, 2, 3)
                       if r.get(f"ag{i}_type") in ARMED_TYPES],
    }


def merge_same_day(a, b):
    """Two rows for one site on one date: union observations."""
    out = dict(a)
    out["ag"] = a["ag"] + [g for g in b["ag"] if g not in a["ag"]]
    for k in ("armed", "fardc", "itsci"):
        vals = [v for v in (a[k], b[k]) if v is not None]
        out[k] = any(vals) if vals else None
    ws = [w for w in (a["w"], b["w"]) if w is not None]
    out["w"] = max(ws) if ws else None
    out["pmh"] = a["pmh"] or b["pmh"]
    out["third_party"] = a["third_party"] and b["third_party"]
    out["minerals"] = a["minerals"] + [m for m in b["minerals"] if m not in a["minerals"]]
    out["raw_groups"] = a["raw_groups"] + b["raw_groups"]
    return out


def build(rows, cap=None):
    by_site = defaultdict(list)
    meta = {}
    skipped_nocoord = 0
    for r in rows:
        pcode = (r.get("pcode") or "").strip()
        lat, lon = to_float(r.get("latitude")), to_float(r.get("longitude"))
        if not pcode:
            continue
        if lat is None or lon is None:
            skipped_nocoord += 1
            continue
        v = parse_visit(r)
        if not v:
            continue
        by_site[pcode].append(v)
        # Site attributes from the most recent row (rows may update names/coords).
        prev = meta.get(pcode)
        if prev is None or v["d"] >= prev["d"]:
            meta[pcode] = {"d": v["d"], "name": r.get("name"), "lat": lat, "lon": lon,
                           "province": r.get("province"), "territory": r.get("territoire"),
                           "approx": r.get("location_origin") == "Approximation"}

    sites, raw_map, dup_merges = [], Counter(), 0
    for pcode in sorted(by_site):
        day = OrderedDict()
        for v in sorted(by_site[pcode], key=lambda x: x["d"]):
            if v["d"] in day:
                day[v["d"]] = merge_same_day(day[v["d"]], v)
                dup_merges += 1
            else:
                day[v["d"]] = v
        visits = list(day.values())
        for v in visits:
            for raw, typ in v["raw_groups"]:
                raw_map[(raw, typ, norm_group(raw, typ) if raw not in STATE_NAMES else "(state; excluded)")] += 1
        last = visits[-1]
        m = meta[pcode]
        minerals = []
        for v in reversed(visits):  # latest visit's minerals first
            for x in v["minerals"]:
                if x not in minerals:
                    minerals.append(x)
        notes = []
        if m["approx"]:
            notes.append("IPIS location is an approximation, not GPS.")
        if last["third_party"]:
            notes.append("Latest visit is third-party data republished by IPIS"
                         + ("; it did not record armed actors." if last["armed"] is None else "."))
            prior = [v for v in visits if v["armed"] is not None]
            if last["armed"] is None and prior:
                p = prior[-1]
                notes.append(f"Last visit with armed-actor data: {p['d']} (armed groups: "
                             + (", ".join(p["ag"]) if p["ag"] else "none observed")
                             + f"; FARDC: {'yes' if p['fardc'] else 'no'}).")
        pmh_dates = [v["d"] for v in visits if v["pmh"]]
        if pmh_dates:
            notes.append("IPIS coded PMH (mining police) as a local armed group on "
                         + ", ".join(pmh_dates) + "; treated here as a state service, not armed-group presence.")
        kept = visits[-cap:] if cap else visits
        if cap and len(visits) > cap:
            notes.append(f"{len(visits)} visits; only the latest {cap} kept.")
        sites.append({
            "id": "ipis_" + pcode,
            "name": m["name"],
            "lat": round(m["lat"], 5),
            "lon": round(m["lon"], 5),
            "province": m["province"],
            "territory": m["territory"],
            "minerals": minerals,
            "workers": last["w"],
            "last_visit": last["d"],
            "armed_presence_last": last["armed"],
            "armed_groups_last": last["ag"],
            "fardc_last": last["fardc"],
            "visits": [dict({"d": v["d"], "ag": v["ag"] if v["armed"] is not None else None, "fardc": v["fardc"], "w": v["w"]},
                            **({"src": "3p"} if v["third_party"] else {})) for v in kept],
            "itsci": last["itsci"],
            "source_ids": [SOURCE_ID],
            "evidence_tier": "documented",
            "notes": " ".join(notes),
        })
    stats = {"skipped_nocoord": skipped_nocoord, "same_day_merges": dup_merges, "raw_map": raw_map}
    return sites, stats


def dump(sites):
    return json.dumps(sites, ensure_ascii=False, separators=(",", ":")).replace("},{\"id\"", "},\n{\"id\"")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("raw")
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()
    rows = load_rows(args.raw)
    sites, stats = build(rows)
    text = dump(sites)
    capped = False
    if len(text.encode("utf-8")) > MAX_BYTES:
        sites, stats = build(rows, cap=VISIT_CAP)
        text = dump(sites)
        capped = True
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(text + "\n")

    n_visits = sum(len(s["visits"]) for s in sites)
    dates = sorted(v["d"] for s in sites for v in s["visits"])
    armed_last = Counter()
    for s in sites:
        for g in s["armed_groups_last"]:
            armed_last[g] += 1
    print(f"rows read: {len(rows)}")
    print(f"sites written: {len(sites)}  visits: {n_visits}  capped: {capped}")
    print(f"skipped (no coords): {stats['skipped_nocoord']}  same-day merges: {stats['same_day_merges']}")
    print(f"date range: {dates[0] if dates else None} .. {dates[-1] if dates else None}")
    print(f"armed presence at last visit: true={sum(1 for s in sites if s['armed_presence_last'] is True)} "
          f"false={sum(1 for s in sites if s['armed_presence_last'] is False)} "
          f"null={sum(1 for s in sites if s['armed_presence_last'] is None)}")
    print("sites with any visit flagged armed:", sum(1 for s in sites if any(v["ag"] for v in s["visits"] if v["ag"])))
    print(f"FARDC at last visit: true={sum(1 for s in sites if s['fardc_last'] is True)} "
          f"null={sum(1 for s in sites if s['fardc_last'] is None)}")
    print("sites by group at last visit:", dict(armed_last.most_common()))
    print("raw -> normalised (visit count):")
    for (raw, typ, norm), n in sorted(stats["raw_map"].items(), key=lambda x: -x[1]):
        print(f"  {raw!r} [{typ}] -> {norm!r}: {n}")
    print(f"bytes: {len(text.encode('utf-8'))} -> {args.out}")


if __name__ == "__main__":
    sys.exit(main())
