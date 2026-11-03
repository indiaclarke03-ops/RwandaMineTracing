// Ground Control — front end. Reads only the pre-built JSON in /data.
"use strict";

const TABLES = ["manifest", "sources", "sites", "actors", "control_claims", "relationships",
  "flows", "impacts", "responses", "effectiveness", "responses_to_claims", "gaps"];

const TIER = {
  designated: { icon: "◆", label: "Designated", verb: "designated by", dash: null, weight: 3.5 },
  documented: { icon: "■", label: "Documented", verb: "documented by", dash: null, weight: 2 },
  reported:   { icon: "●", label: "Reported",   verb: "reported by",   dash: "5 4", weight: 2 },
  inferred:   { icon: "△", label: "Inferred",   verb: "our analysis suggests", dash: "1 5", weight: 2 },
};
const MINERAL_VAR = { coltan: "--m-coltan", gold: "--m-gold", tin: "--m-tin", tungsten: "--m-tungsten" };
const CONTROL_VERB = {
  controls: "controls", taxes: "taxes production at", present: "is present at",
  escorts_transport: "escorts transport from", operates: "operates",
};

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
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

// ---------- control map ----------
let map, siteLayers = {}, months = [];

function activeClaims(siteId, when) {
  const t = dkey(when);
  // With no start date, a claim is shown only from when it was observed.
  return DB.control_claims.filter((c) => c.site_id === siteId &&
    (dkey(c.valid_from || c.observed_date) || "0") <= t && (!c.valid_to || dkey(c.valid_to) >= t));
}

function strongest(claims) {
  const order = ["designated", "documented", "reported", "inferred"];
  return claims.map((c) => c.evidence_tier).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
}

function buildMap() {
  map = L.map("map", { scrollWheelZoom: false }).setView([-1.9, 29.2], 8);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18, className: "basemap",
  }).addTo(map);

  // Flows between located nodes (sites, or actors with a site_id).
  const loc = (id) => {
    const s = byId.sites[id] || byId.sites[byId.actors[id]?.site_id];
    return s && s.lat != null ? [s.lat, s.lon] : null;
  };
  for (const f of DB.flows) {
    const a = loc(f.from_node), b = loc(f.to_node);
    if (!a || !b) continue;
    const t = TIER[f.evidence_tier] || TIER.inferred;
    L.polyline([a, b], { color: css("--muted"), weight: 2, opacity: 0.8, dashArray: t.dash || "8 5" })
      .bindTooltip(`${esc(f.mineral)}: ${esc(nodeName(f.from_node))} → ${esc(nodeName(f.to_node))} · ${t.label}`)
      .addTo(map);
  }

  const bounds = [];
  for (const s of DB.sites) {
    if (s.lat == null) continue;
    const mineral = (s.minerals || [])[0];
    const fill = css(MINERAL_VAR[mineral] || "--m-none");
    const isNode = !["mine"].includes(s.site_type);
    const ring = L.circleMarker([s.lat, s.lon], { radius: 13, fill: false, weight: 0, color: css("--accent") });
    const dot = L.circleMarker([s.lat, s.lon], {
      radius: isNode ? 5 : 7, color: "#fff", weight: 1.5, fillColor: fill, fillOpacity: 1,
    });
    dot.bindTooltip(`${esc(s.name)} — ${esc(s.site_type.replace("_", " "))}${mineral ? ", " + esc(mineral) : ""}`);
    dot.on("click", () => showSite(s.id));
    ring.on("click", () => showSite(s.id));
    ring.addTo(map); dot.addTo(map);
    siteLayers[s.id] = { ring, dot };
    if (s.site_type !== "port") bounds.push([s.lat, s.lon]);  // ports sit far east; keep the Kivus in view
  }
  if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
}

function nodeName(id) {
  return byId.sites[id]?.name || byId.actors[id]?.name || id;
}

function buildSlider() {
  const start = new Date(Date.UTC(2023, 0, 1));
  const end = new Date(DB.manifest.built || Date.now());
  for (let d = new Date(start); d <= end; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push(d.toISOString().slice(0, 7));
  }
  const input = document.getElementById("when");
  input.max = months.length - 1;
  input.value = months.length - 1;
  input.addEventListener("input", () => setWhen(months[+input.value]));

  const ticks = document.getElementById("ticks");
  for (const r of DB.responses) {
    const i = months.indexOf(String(r.date).slice(0, 7));
    if (i < 0) continue;
    const span = document.createElement("span");
    span.style.left = `calc(${(i / (months.length - 1)) * 100}% - 1px)`;
    span.title = `${fmtDate(r.date)} — ${r.title}`;
    ticks.appendChild(span);
  }
  setWhen(months[months.length - 1]);
}

let currentWhen, currentSite;
function setWhen(m) {
  currentWhen = m;
  document.getElementById("when-label").textContent = fmtDate(m);
  for (const [id, { ring }] of Object.entries(siteLayers)) {
    const claims = activeClaims(id, m);
    if (!claims.length) { ring.setStyle({ weight: 0 }); continue; }
    const t = TIER[strongest(claims)];
    ring.setStyle({ weight: t.weight, dashArray: t.dash });
  }
  if (currentSite) showSite(currentSite);
}

function showSite(id) {
  currentSite = id;
  history.replaceState(null, "", "#site=" + encodeURIComponent(id));
  const s = byId.sites[id];
  const claims = DB.control_claims.filter((c) => c.site_id === id)
    .sort((a, b) => (dkey(a.valid_from) || "").localeCompare(dkey(b.valid_from) || ""));
  const active = new Set(activeClaims(id, currentWhen).map((c) => c.id));
  const impacts = DB.impacts.filter((i) => i.site_id === id);
  const flowsOut = DB.flows.filter((f) => f.from_node === id || f.to_node === id ||
    byId.actors[f.from_node]?.site_id === id || byId.actors[f.to_node]?.site_id === id);
  const atSite = DB.actors.filter((a) => a.site_id === id);

  const claimHtml = claims.length ? claims.map((c) => {
    const actor = byId.actors[c.actor_id];
    const period = `${fmtDate(c.valid_from) || "?"} – ${c.valid_to ? fmtDate(c.valid_to) : "present"}`;
    return `<li>
      <div><strong>${esc(actor?.name)}</strong> ${esc(CONTROL_VERB[c.control_type] || c.control_type)} ${esc(s.name)}
      ${active.has(c.id) ? "" : '<span class="muted small">(not active at selected date)</span>'}</div>
      <div class="claim-meta">${badge(c.evidence_tier)} <span>${esc(period)}</span></div>
      ${c.summary ? `<div class="small">${esc(c.summary)}</div>` : ""}
      <div class="cite">${cites(c.source_ids, c.paragraph_or_page)}</div>
      ${denialsFor(c.id)}
    </li>`;
  }).join("") : '<li class="muted">No control claim recorded. That is a gap, not evidence of no armed presence.</li>';

  const impactHtml = impacts.map((i) => `<li>
      <div><strong>${esc(i.value != null ? i.value.toLocaleString() + " " + (i.unit || "") : "")}</strong> ${esc(i.summary)}</div>
      <div class="claim-meta">${badge(i.evidence_tier)} <span>${esc(i.period || "")}</span></div>
      ${i.method ? `<div class="small muted">How: ${esc(i.method)}</div>` : ""}
      <div class="cite">${cites(i.source_ids, i.paragraph_or_page)}</div>${denialsFor(i.id)}</li>`).join("");

  const flowHtml = flowsOut.map((f) => `<li>
      <div>${esc(f.mineral)}: ${esc(nodeName(f.from_node))} → ${esc(nodeName(f.to_node))}
        ${sayariLink(f.from_node)}${sayariLink(f.to_node)}</div>
      <div class="claim-meta">${badge(f.evidence_tier)} <span>${esc(f.period || "")}</span></div>
      ${f.summary ? `<div class="small">${esc(f.summary)}</div>` : ""}
      <div class="cite">${cites(f.source_ids)}</div>${denialsFor(f.id)}</li>`).join("");

  const actorHtml = atSite.map((a) => `<li>${actorLine(a)}</li>`).join("");

  document.getElementById("panel").innerHTML = `
    <h2>${esc(s.name)}</h2>
    <div class="muted small">${esc([s.site_type.replace("_", " "), (s.minerals || []).join(", "), s.admin_area, s.country].filter(Boolean).join(" · "))}</div>
    ${s.notes ? `<p class="small muted">${esc(s.notes)}</p>` : ""}
    <h3>Control history</h3><ul>${claimHtml}</ul>
    ${actorHtml ? `<h3>Located here</h3><ul>${actorHtml}</ul>` : ""}
    ${impactHtml ? `<h3>Impacts</h3><ul>${impactHtml}</ul>` : ""}
    ${flowHtml ? `<h3>Mineral flows</h3><ul>${flowHtml}</ul>` : ""}
    <div class="cite" style="margin-top:12px">Location: ${cites(s.source_ids)}</div>`;
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

// ---------- tabs ----------
function tabs() {
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + b.dataset.view));
    if (b.dataset.view === "map") map.invalidateSize();
  }));
}

(async function main() {
  try {
    await loadData();
  } catch (e) {
    document.querySelector("main").innerHTML = `<p class="view">${esc(e.message)}</p>`;
    return;
  }
  index();
  document.getElementById("built").textContent = `· data built ${fmtDate(DB.manifest.built)}`;
  tabs();
  buildMap();
  buildSlider();
  buildTimeline();
  buildGaps();
  buildSources();

  // Deep links: #view=responses, #site=site_rubaya
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("view")) document.querySelector(`.tabs [data-view="${CSS.escape(h.get("view"))}"]`)?.click();
  if (h.get("site") && byId.sites[h.get("site")]) showSite(h.get("site"));
})();
