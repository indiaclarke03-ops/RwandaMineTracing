"""Validate the hand-curated seed tables and write the public /data files.

    python3 pipeline/build.py           # validate + write
    python3 pipeline/build.py --check   # validate only

The seed lives in pipeline/seed/<table>.json (one JSON array per table, see
docs/BUILD_PLAN.md). The site only ever reads /data. The build refuses to
write if any project rule in docs/PROJECT_RULES.md is broken.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "pipeline" / "seed"
DATA = ROOT / "data"

TIERS = {"designated", "documented", "reported", "inferred"}
DATE_RE = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")

ENUMS = {
    "sources.type": {"sanctions", "un_report", "ngo", "media", "dataset", "analysis", "government"},
    "sites.site_type": {"mine", "trading_centre", "border", "port", "refinery", "smelter", "town"},
    "actors.type": {"armed_group", "state_force", "state_body", "company", "person",
                    "financial_institution", "scheme"},
    "control_claims.control_type": {"controls", "taxes", "present", "escorts_transport", "operates"},
    "relationships.type": {"owns", "directs", "legal_rep", "supports", "buys_from", "ships_to",
                           "member_of_scheme", "officer_of", "political_wing_of", "part_of"},
    "impacts.type": {"deaths", "forced_labour", "child_labour", "displacement", "violence",
                     "revenue_to_armed_group", "laundering_gap", "smuggled_volume", "abuses"},
    "responses.type": {"sanction", "import_rule", "due_diligence_law", "peace_deal",
                       "scheme_suspension", "disclosure", "lawsuit", "advisory"},
    "responses.side": {"outside", "inside"},
    "effectiveness.verdict": {"moved", "didn't move", "too early", "no data"},
    "trade_series.metric": {"exports_reported", "exports_mirror", "production_usgs"},
    "trade_series.basis": {"gross_weight", "contained_metal", "unknown"},
    "gap_evidence.section": {"trade", "origin", "alternative"},
    "gaps.layer": {"control", "supply_chain", "impacts", "response", "sayari"},
}

# table -> fields that must be ISO-ish dates (YYYY, YYYY-MM or YYYY-MM-DD) when present
DATE_FIELDS = {
    "sources": ["published_date", "accessed_date"],
    "control_claims": ["valid_from", "valid_to", "observed_date"],
    "relationships": ["valid_from", "valid_to"],
    "responses": ["date"],
    "responses_to_claims": ["date"],
}

TABLES = ["sources", "sites", "actors", "control_claims", "relationships", "flows",
          "impacts", "responses", "effectiveness", "responses_to_claims", "gaps", "findings",
          "trade_series", "trade_quarterly", "gap_evidence"]


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


def load(table):
    path = SEED / f"{table}.json"
    if not path.exists():
        return []
    with path.open() as f:
        rows = json.load(f)
    if not isinstance(rows, list):
        raise SystemExit(f"{path} must contain a JSON array")
    return rows


def walk_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_strings(v)


def validate(db):
    r = Report()
    ids = {t: {row.get("id") for row in db[t]} for t in TABLES}
    node_ids = ids["sites"] | ids["actors"]

    for table in TABLES:
        seen = set()
        for row in db[table]:
            rid = row.get("id")
            where = f"{table}[{rid}]"
            if not rid:
                r.err(where, "missing id")
            elif rid in seen:
                r.err(where, "duplicate id")
            seen.add(rid)

            # Rule 1: no unsourced records (sources themselves excepted)
            if table != "sources":
                sids = row.get("source_ids") or []
                if not sids:
                    r.err(where, "no source_ids")
                for sid in sids:
                    if sid not in ids["sources"]:
                        r.err(where, f"unknown source_id {sid!r}")

            # Rule 3: evidence tier on every claim-bearing table
            if table not in ("sources", "sites", "gaps"):
                tier = row.get("evidence_tier")
                if tier not in TIERS:
                    r.err(where, f"bad evidence_tier {tier!r}")
                if tier == "inferred" and not (row.get("method") or "").strip():
                    r.err(where, "inferred rows must say how (method)")

            for field in DATE_FIELDS.get(table, []):
                v = row.get(field)
                if v is not None and not DATE_RE.match(str(v)):
                    r.err(where, f"{field} {v!r} is not YYYY[-MM[-DD]]")

            for key, allowed in ENUMS.items():
                t, field = key.split(".")
                if t == table and field in row and row[field] not in allowed:
                    r.err(where, f"{field} {row[field]!r} not in {sorted(allowed)}")

            if any("VERIFY" in s for s in walk_strings(row)):
                r.warn(where, "unresolved VERIFY flag")

    for s in db["sources"]:
        where = f"sources[{s.get('id')}]"
        for f in ("title", "publisher", "url", "type"):
            if not s.get(f):
                r.err(where, f"missing {f}")
        # Rule 12: a lead becomes a source only once the page has been read
        if not s.get("accessed_date"):
            r.err(where, "missing accessed_date (source must be read, not just found)")

    for s in db["sites"]:
        where = f"sites[{s['id']}]"
        if s.get("lat") is None or s.get("lon") is None:
            r.warn(where, "no coordinates; will not appear on the map")

    for a in db["actors"]:
        where = f"actors[{a['id']}]"
        if a.get("sayari_entity_id") and not a.get("sayari_match_reason"):
            r.err(where, "Sayari id without sayari_match_reason (rule 7)")
        if a.get("sayari_entity_id") and not a.get("sayari_url"):
            r.err(where, "Sayari id without sayari_url (rule 11)")

    def ref(where, value, pool, label):
        if value is not None and value not in pool:
            r.err(where, f"{label} {value!r} does not exist")

    for c in db["control_claims"]:
        w = f"control_claims[{c['id']}]"
        ref(w, c.get("site_id"), ids["sites"], "site_id")
        ref(w, c.get("actor_id"), ids["actors"], "actor_id")
    for x in db["relationships"]:
        w = f"relationships[{x['id']}]"
        ref(w, x.get("from_actor"), ids["actors"], "from_actor")
        ref(w, x.get("to_actor"), ids["actors"], "to_actor")
    for x in db["flows"]:
        w = f"flows[{x['id']}]"
        ref(w, x.get("from_node"), node_ids, "from_node")
        ref(w, x.get("to_node"), node_ids, "to_node")
    for x in db["impacts"]:
        w = f"impacts[{x['id']}]"
        ref(w, x.get("site_id"), ids["sites"], "site_id")
        ref(w, x.get("actor_id"), ids["actors"], "actor_id")
    for x in db["responses"]:
        w = f"responses[{x['id']}]"
        for t in x.get("targets", []):
            ref(w, t, ids["actors"], "target")
    for x in db["effectiveness"]:
        ref(f"effectiveness[{x['id']}]", x.get("response_id"), ids["responses"], "response_id")
    claim_ids = set().union(*(ids[t] for t in TABLES if t != "sources"))
    for x in db["responses_to_claims"]:
        ref(f"responses_to_claims[{x['id']}]", x.get("claim_ref"), claim_ids, "claim_ref")

    return r


# ---------- derived analysis: the laundering gap (always tier "inferred") ----------

# Coltan should be ~25% of combined coltan + cassiterite output in the region's mixed deposits
# (BGR 2020, cited by the UN Group of Experts, S/2025/446 annex 53). So expected coltan = cassiterite / 3.
GEO_SHARE = 0.25
GEO_SOURCES = ["src_un_goe_s2025_446"]
# UN Group of Experts: ~120 t/month of Rubaya coltan traded under M23 (para 64) and 150 t/month smuggled
# to Rwanda (annex 29), mid-May to late Oct 2024. We scale to the May–Dec 2024 window (8 months).
RUBAYA_2024 = {"low": 120 * 8, "high": 150 * 8, "months": 8, "source_ids": ["src_un_goe_s2024_969"],
               "note": "UN monthly estimates (120–150 t) × 8 months of M23 control in 2024 (May–Dec). "
                       "The UN observed mid-May to late Oct only; extending to December assumes the rate held."}


def series(db, mineral, metric, basis="gross_weight"):
    out = {}
    for r in db["trade_series"]:
        if r["mineral"] == mineral and r["metric"] == metric and r["basis"] == basis:
            out.setdefault(r["year"], r)  # first row per year wins (seed order = preference)
    return out


def laundering_gap(db):
    col = series(db, "coltan", "exports_reported")
    tin = series(db, "tin", "exports_reported")
    mir = series(db, "coltan", "exports_mirror")
    usgs = series(db, "coltan", "production_usgs")
    years = sorted(set(col) & set(tin))
    rows = []
    for y in years:
        c, s = col[y]["value"], tin[y]["value"]
        expected = s * GEO_SHARE / (1 - GEO_SHARE)
        u = usgs.get(y)
        # USGS 2018–22 "production" is Rwanda's reported exports (USGS footnote); only 2023+ are USGS estimates.
        usgs_est = u["value"] if u and y >= 2023 else None
        rows.append({
            "year": y,
            "coltan_exports_t": c,
            "cassiterite_exports_t": s,
            "coltan_share_pct": round(100 * c / (c + s), 1),
            "expected_coltan_t": round(expected),
            "excess_vs_geology_t": round(c - expected),
            "coltan_exports_mirror_t": mir[y]["value"] if y in mir else None,
            "usgs_production_estimate_t": usgs_est,
            "excess_vs_usgs_t": round(c - usgs_est) if usgs_est else None,
            "source_ids": sorted(set(col[y]["source_ids"] + tin[y]["source_ids"] + GEO_SOURCES
                                     + (u["source_ids"] if usgs_est else []) + (mir[y]["source_ids"] if y in mir else []))),
        })
    base = [r["coltan_share_pct"] for r in rows if r["year"] <= 2022]
    return {
        "mineral": "coltan",
        "evidence_tier": "inferred",
        "method": ("Expected coltan exports = cassiterite exports × 25/75, from the ~25% coltan share of the region's mixed "
                   "coltan–cassiterite deposits (BGR, cited by the UN Group of Experts). Excess = reported coltan exports − expected. "
                   "Where USGS published its own estimate (2023 onward), excess is also shown against that."),
        "baseline_share_pct_2018_2022": [min(base), max(base)] if base else None,
        "geology_share_pct": GEO_SHARE * 100,
        "rows": rows,
        "rubaya_2024": RUBAYA_2024,
        "quarterly": [{k: r[k] for k in ("quarter", "shipments", "weight_t", "gw7_shipments", "gw7_weight_t",
                                          "uae_buyer_shipments", "source_ids")}
                      for r in sorted(db["trade_quarterly"], key=lambda r: r["quarter"])],
        "caveats": [
            "Rwanda's cassiterite exports also rose sharply in 2025 (+58%, flagged by the UN), so the geological baseline is itself inflated that year and the 2025 excess is understated.",
            "USGS production figures for 2018–2022 are Rwanda's reported exports, not independent estimates.",
            "Export tonnages are gross concentrate weight; grades vary.",
            "A gap shows that exports need explaining. It does not show where the extra material came from.",
        ],
    }


def sites_geojson(db):
    features = []
    for s in db["sites"]:
        if s.get("lat") is None or s.get("lon") is None:
            continue
        props = {k: v for k, v in s.items() if k not in ("lat", "lon")}
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
            "properties": props,
        })
    return {"type": "FeatureCollection", "features": features}


def main():
    check_only = "--check" in sys.argv
    db = {t: load(t) for t in TABLES}
    rep = validate(db)
    for w in rep.warnings:
        print("warn ", w)
    for e in rep.errors:
        print("ERROR", e)
    counts = ", ".join(f"{t}={len(db[t])}" for t in TABLES)
    print(f"\n{counts}\n{len(rep.errors)} errors, {len(rep.warnings)} warnings")
    if rep.errors:
        sys.exit(1)
    if check_only:
        return

    DATA.mkdir(exist_ok=True)
    for t in TABLES:
        (DATA / f"{t}.json").write_text(json.dumps(db[t], indent=2, ensure_ascii=False) + "\n")
    if db["trade_series"]:
        (DATA / "laundering_gap.json").write_text(json.dumps(laundering_gap(db), indent=2, ensure_ascii=False) + "\n")
    (DATA / "sites.geojson").write_text(json.dumps(sites_geojson(db), indent=2, ensure_ascii=False) + "\n")
    manifest = {
        "case": "rwanda-drc",
        "built": date.today().isoformat(),
        "counts": {t: len(db[t]) for t in TABLES},
        "warnings": rep.warnings,
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {len(TABLES) + 2} files to {DATA.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
