// Ground Control — front end. Reads only the pre-built JSON in /data.
"use strict";

const TABLES = ["manifest", "sources", "sites", "actors", "control_claims", "relationships",
  "flows", "impacts", "responses", "effectiveness", "responses_to_claims", "gaps", "findings", "gap_evidence", "smelter_brand", "network_signals", "company_assessments"];

const TIER = {
  designated: { icon: "◆", label: "Designated", verb: "designated by", dash: null, weight: 3.5 },
  documented: { icon: "■", label: "Documented", verb: "documented by", dash: null, weight: 2 },
  reported:   { icon: "●", label: "Reported",   verb: "reported by",   dash: "5 4", weight: 2 },
  inferred:   { icon: "△", label: "Inferred",   verb: "our analysis suggests", dash: "1 5", weight: 2 },
};
const CONTROL_VERB = {
  controls: "controls", taxes: "taxes production at", present: "is present at",
  escorts_transport: "escorts transport from", operates: "operates",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let DB = {};
const byId = {};

async function loadData() {
  // Deployed site has data/ beside index.html; local dev serves the repo root (../data).
  for (const base of ["data/", "../data/"]) {
    try {
      const res = await fetch(base + "manifest.json");
      if (!res.ok) continue;
      const out = await Promise.all(TABLES.map((t) =>
        fetch(base + t + ".json").then((r) => (r.ok ? r.json() : []))));
      TABLES.forEach((t, i) => (DB[t] = out[i]));
      return;
    } catch (e) { /* try next base */ }
  }
  throw new Error("Could not load /data. Run pipeline/build.py, then serve the repo root.");
}

function index() {
  for (const t of TABLES) {
    if (!Array.isArray(DB[t])) continue;
    byId[t] = Object.fromEntries(DB[t].map((r) => [r.id, r]));
  }
}

// ---------- shared bits ----------
function badge(tier) {
  const t = TIER[tier];
  if (!t) return "";
  return `<span class="badge ${tier}" title="${esc(t.label)}"><span aria-hidden="true">${t.icon}</span>${t.label}</span>`;
}

function cites(ids, extra) {
  return (ids || []).map((id) => {
    const s = byId.sources[id];
    if (!s) return "";
    const where = extra || s.paragraph_or_page;
    return `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)}${s.published_date ? ", " + esc(fmtDate(s.published_date)) : ""}${where ? " (" + esc(where) + ")" : ""}</a>`;
  }).filter(Boolean).join("; ");
}

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = String(d).split("-");
  if (!m) return y;
  const mon = new Date(Date.UTC(+y, +m - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return day ? `${+day} ${mon} ${y}` : `${mon} ${y}`;
}

// Partial dates compare as the start of the period they name.
const dkey = (d) => (d ? (String(d) + "-01-01").slice(0, 10) : null);

function denialsFor(claimId) {
  return DB.responses_to_claims.filter((d) => d.claim_ref === claimId).map((d) =>
    `<div class="denial"><span class="badge denied">Denied</span> ${esc(d.respondent)}, ${esc(fmtDate(d.date))}: ${esc(d.summary)} <span class="cite">${cites(d.source_ids)}</span></div>`
  ).join("");
}

function nodeName(id) {
  return byId.sites[id]?.name || byId.actors[id]?.name || id;
}

function sayariLink(id) {
  const a = byId.actors[id];
  return a?.sayari_url ? ` <a class="small" href="${esc(a.sayari_url)}" target="_blank" rel="noopener" title="Verify ${esc(a.name)} in Sayari Graph">[Sayari${a.sayari_confidence === "low" ? ", low-confidence" : ""}]</a>` : "";
}

function actorLine(a) {
  const sanc = (a.sanctions || []).map((x) => `${esc(x.issuer)} ${esc(fmtDate(x.date))}`).join(", ");
  const psa = (a.sayari_risk_flags || []).filter((f) => f.startsWith("psa_"));
  return `<strong>${esc(a.name)}</strong> ${badge(a.evidence_tier)}
    ${sanc ? `<div class="small">Sanctioned: ${sanc}</div>` : ""}
    ${a.notes ? `<div class="small muted">${esc(a.notes)}</div>` : ""}
    ${a.sayari_url ? `<div class="small"><a href="${esc(a.sayari_url)}" target="_blank" rel="noopener">Verify in Sayari Graph</a>
      ${a.sayari_confidence === "low" ? ' <span class="badge inferred" title="Matched on name, country and trade route only; no identifiers">Low-confidence match</span>' : ""}
      ${psa.length ? ` <span class="small muted">Weak (possibly-same-as) flags: ${esc(psa.join(", "))}</span>` : ""}</div>` : ""}
    ${denialsFor(a.id)}`;
}

// ---------- responses ----------
function buildTimeline() {
  const ol = document.getElementById("timeline");
  const sides = () => [...document.querySelectorAll("[data-side]")].filter((c) => c.checked).map((c) => c.dataset.side);
  const render = () => {
    const show = sides();
    ol.innerHTML = DB.responses.filter((r) => show.includes(r.side))
      .sort((a, b) => dkey(a.date).localeCompare(dkey(b.date)))
      .map((r) => {
        const eff = DB.effectiveness.filter((e) => e.response_id === r.id).map((e) => `
          <div class="eff"><span class="verdict">${esc(e.verdict)}</span> — ${esc(e.indicator)}
            (should ${esc(e.expected_direction)})${e.before_value != null ? `: ${esc(e.before_value)} → ${esc(e.after_value ?? "?")}` : ""}
            ${e.window ? `<span class="muted">· ${esc(e.window)}</span>` : ""} ${badge(e.evidence_tier)}
            ${e.method ? `<div class="small muted">How: ${esc(e.method)}</div>` : ""}
            <div class="cite">${cites(e.source_ids)}</div></div>`).join("")
          || '<div class="eff muted">No effectiveness indicator yet.</div>';
        const targets = (r.targets || []).map((t) => esc(byId.actors[t]?.name || t)).join(", ");
        return `<li>
          <div class="date">${esc(fmtDate(r.date))}</div>
          <div>
            <div class="side">${esc(r.issuer)} · ${esc(r.type.replace(/_/g, " "))} · ${r.side === "inside" ? "inside the company / industry" : "outside the company"}</div>
            <h3>${esc(r.title)}</h3>
            <div>${esc(r.summary)}</div>
            ${targets ? `<div class="targets">Targets: ${targets}</div>` : ""}
            <div class="claim-meta">${badge(r.evidence_tier)}</div>
            <div class="cite">${cites(r.source_ids)}</div>
            ${eff}
          </div></li>`;
      }).join("");
  };
  document.querySelectorAll("[data-side]").forEach((c) => c.addEventListener("change", render));
  render();

  // Case-wide indicators (not tied to one site), e.g. the laundering gap.
  const wide = DB.impacts.filter((i) => !i.site_id);
  document.getElementById("indicators").innerHTML = wide.length ? `<h2>Case-wide indicators</h2><ul>` + wide.map((i) => `<li>
      <strong>${esc(i.value != null ? i.value.toLocaleString() + " " + (i.unit || "") : "")}</strong> — ${esc(i.summary)}
      <div class="claim-meta">${badge(i.evidence_tier)} <span>${esc(i.period || "")}</span></div>
      ${i.notes ? `<div class="small muted">${esc(i.notes)}</div>` : ""}
      <div class="cite">${cites(i.source_ids, i.paragraph_or_page)}</div></li>`).join("") + "</ul>" : "";
}

// ---------- gaps & sources ----------
function buildGaps() {
  const verifies = (DB.manifest.warnings || []).filter((w) => w.includes("VERIFY")).length;
  document.getElementById("gaps").innerHTML = DB.gaps.map((g) => `
    <div class="gap"><div class="layer">${esc(g.layer.replace("_", " "))}</div>
      <h3>${esc(g.title)}</h3><div>${esc(g.detail)}</div>
      <div class="cite">${cites(g.source_ids)}</div></div>`).join("")
    + (verifies ? `<div class="gap"><div class="layer">data quality</div><h3>${verifies} record(s) still flagged VERIFY</h3>
      <div>These came from secondary reporting and have not yet been checked against the primary document.</div></div>` : "");
}

function buildSources() {
  document.getElementById("sources").innerHTML = DB.sources
    .sort((a, b) => dkey(b.published_date || "0").localeCompare(dkey(a.published_date || "0")))
    .map((s) => `<li id="src-${esc(s.id)}"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>
      — ${esc(s.publisher)}${s.published_date ? ", " + esc(fmtDate(s.published_date)) : ""}
      <span class="muted small">(${esc(s.type.replace("_", " "))}; accessed ${esc(s.accessed_date)})</span></li>`).join("");
}

// ---------- overview ----------
function buildHome() {
  document.getElementById("findings").innerHTML = [...DB.findings].sort((a, b) => a.order - b.order).map((f) => `
    <article class="finding">
      <div class="kicker">${esc(f.kicker)}</div>
      <h3>${esc(f.headline)}</h3>
      <p>${esc(f.detail)}</p>
      <div class="claim-meta">${badge(f.evidence_tier)}</div>
      ${f.method ? `<div class="small muted">How: ${esc(f.method)}</div>` : ""}
      ${f.source_ids.length > 2 ? `<details class="cite-more"><summary>Sources (${f.source_ids.length})</summary><div class="cite">${cites(f.source_ids, f.paragraph_or_page)}</div></details>` : `<div class="cite">${cites(f.source_ids, f.paragraph_or_page)}</div>`}
      ${f.link ? `<a class="more" href="${esc(f.link)}">${esc(f.link_label || "More")} →</a>` : ""}
    </article>`).join("");
  const c = DB.manifest.counts || {};
  document.getElementById("stats").textContent =
    `Built from ${c.sources} sources, ${c.actors} actors, ${c.control_claims} control claims and ${c.responses} responses. Data last built ${fmtDate(DB.manifest.built)}.`;
}

// ---------- views & routing ----------
// Modules (map.js, chain.js, search.js, gap.js) register here: { build(), show(params) }
const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});

function showView(name, params) {
  const btn = document.querySelector(`.tabs [data-view="${CSS.escape(name)}"]`);
  if (!btn) return;
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === btn));
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + name));
  document.querySelector(".legend").hidden = ["home", "sources", "map"].includes(name);  // these explain tiers themselves
  document.body.dataset.view = name;
  VIEWS[name]?.show?.(params || new URLSearchParams());
  if (name === "laundering" && window.drawGap) window.drawGap();
}

function route() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("site")) { showView("map", h); return; }
  if (h.get("company")) { showView("search", h); return; }
  if (h.get("chain")) { showView("chain", h); return; }
  showView(h.get("view") || "home", h);
  window.scrollTo(0, 0);
}

function tabs() {
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    history.replaceState(null, "", b.dataset.view === "home" ? location.pathname : "#view=" + b.dataset.view);
    showView(b.dataset.view);
  }));
  window.addEventListener("hashchange", route);
}

(async function main() {
  try {
    await loadData();
  } catch (e) {
    document.querySelector("main").innerHTML = `<p class="view">${esc(e.message)}</p>`;
    return;
  }
  index();
  window.GC = { DB, byId, TIER, esc, badge, cites, fmtDate, dkey, denialsFor, actorLine, sayariLink, nodeName, CONTROL_VERB, go: (hash) => { location.hash = hash; } };
  document.getElementById("built").textContent = `data built ${fmtDate(DB.manifest.built)}`;
  tabs();
  buildHome();
  buildTimeline();
  buildGaps();
  buildSources();
  for (const v of Object.values(VIEWS)) v.build?.();
  if (window.buildGap) window.buildGap(DB, { badge, cites, esc, fmtDate });
  route();
})();
