// "Check a company": shortest sourced path from any actor to each armed group in the dataset.
"use strict";

(function () {
  const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});
  let G, adj, sel = -1;
  // Path cost: one per step, plus a penalty for weaker evidence, so strong short paths win ties.
  const PEN = { designated: 0, documented: 0.1, reported: 0.35, inferred: 0.7 };
  const ORDER = ["designated", "documented", "reported", "inferred"];
  const REL_TEXT = {
    owns: "owns", directs: "directs", legal_rep: "is legal representative of", supports: "supports",
    buys_from: "buys from", ships_to: "shipped minerals to", member_of_scheme: "is a member of",
    officer_of: "is an officer of", political_wing_of: "is the political wing of", part_of: "is part of",
    alleged_link: "is alleged to have dealt in minerals from areas held by",
  };

  VIEWS.search = {
    build() {
      G = window.GC;
      adj = buildGraph();
      const q = document.getElementById("company-q"), list = document.getElementById("company-suggest");
      q.addEventListener("input", () => suggest(q.value));
      q.addEventListener("keydown", (e) => {
        const items = [...list.querySelectorAll("li")];
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); if (!items.length) return;
          sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
          items.forEach((li, i) => li.setAttribute("aria-selected", i === sel));
        } else if (e.key === "Enter") {
          const li = items[sel >= 0 ? sel : 0]; if (li) pick(li.dataset.id);
        } else if (e.key === "Escape") list.hidden = true;
      });
      list.addEventListener("mousedown", (e) => { const li = e.target.closest("li"); if (li) pick(li.dataset.id); });
      q.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 150));
      const quick = ["act_halcyon", "act_kanzamin", "act_ulba", "act_gasabo", "act_zigama", "act_taniobis_th"].filter((id) => G.byId.actors[id]);
      document.getElementById("company-quick").innerHTML = `<span class="muted small">Try:</span> ` +
        quick.map((id) => `<button type="button" class="chip" data-id="${id}">${G.esc(short(id))}</button>`).join("");
      buildTable();
      document.getElementById("company-quick").addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) pick(b.dataset.id); });
    },
    show(params) {
      const id = params.get && params.get("company");
      if (id && G.byId.actors[id]) pick(id, true);
      else if (!document.getElementById("company-result").innerHTML) document.getElementById("company-q").focus({ preventScroll: true });
    },
  };

  const short = (id) => G.nodeName(id).replace(/ \(.*\)/, "").replace(/ — .*/, "").replace(/ mining area/, "");

  function buildGraph() {
    const A = new Map();
    const add = (a, b, e) => {
      if (!A.has(a)) A.set(a, []);
      if (!A.has(b)) A.set(b, []);
      A.get(a).push({ to: b, e }); A.get(b).push({ to: a, e });
    };
    for (const r of G.DB.relationships) add(r.from_actor, r.to_actor, { from: r.from_actor, to: r.to_actor, text: REL_TEXT[r.type] || r.type, tier: r.evidence_tier, src: r.source_ids, rec: r });
    // A filing listing is a weak step: it says a smelter may be in a supply chain.
    for (const x of G.DB.smelter_brand) add(x.brand_actor, x.smelter_actor, { from: x.brand_actor, to: x.smelter_actor, text: "lists as a possible smelter", tier: "documented", src: x.source_ids, rec: x, extra: 1.2, when: x.years.join(", ") });
    for (const f of G.DB.flows) add(f.from_node, f.to_node, { from: f.from_node, to: f.to_node, text: G.byId.sites[f.from_node] && G.byId.actors[f.to_node] ? `supplied ${f.mineral} to` : `${f.mineral} moves to`, tier: f.evidence_tier, src: f.source_ids, rec: f });
    for (const c of G.DB.control_claims) add(c.actor_id, c.site_id, { from: c.actor_id, to: c.site_id, text: G.CONTROL_VERB[c.control_type] || c.control_type, tier: c.evidence_tier, src: c.source_ids, rec: c,
      when: `${G.fmtDate(c.valid_from || c.observed_date)} – ${c.valid_to ? G.fmtDate(c.valid_to) : "present"}` });
    for (const a of G.DB.actors) if (a.site_id) add(a.id, a.site_id, { from: a.id, to: a.site_id, text: "is located at", tier: "documented", src: G.byId.sites[a.site_id].source_ids, rec: a });
    return A;
  }

  function paths(start) {
    // Dijkstra; don't route *through* an armed group (a path ends at the first one it reaches).
    const dist = new Map([[start, 0]]), prev = new Map(), done = new Set(), q = [[0, start]];
    while (q.length) {
      q.sort((a, b) => a[0] - b[0]);
      const [d, u] = q.shift();
      if (done.has(u)) continue;
      done.add(u);
      if (u !== start && isArmed(u)) continue;
      for (const { to, e } of adj.get(u) || []) {
        // Ended control (e.g. PARECO-FF at Rubaya until 2024) ranks after current control.
        const nd = d + 1 + (PEN[e.tier] ?? 1) + (e.extra || 0) + (e.rec.valid_to && e.rec.control_type ? 0.5 : 0);
        if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, { u, e }); q.push([nd, to]); }
      }
    }
    const out = [];
    for (const a of G.DB.actors) {
      if (!isArmed(a.id) || a.id === start || !prev.has(a.id)) continue;
      const steps = [];
      for (let v = a.id; v !== start; v = prev.get(v).u) steps.unshift({ node: v, ...prev.get(v) });
      const weakest = steps.map((s) => s.e.tier).sort((x, y) => ORDER.indexOf(y) - ORDER.indexOf(x))[0];
      out.push({ target: a.id, steps, cost: dist.get(a.id), weakest });
    }
    // Fewest steps first; on a tie, lead with M23, the group holding these mines now.
    return out.sort((a, b) => a.steps.length - b.steps.length || (b.target === "act_m23") - (a.target === "act_m23") || a.cost - b.cost);
  }
  const isArmed = (id) => G.byId.actors[id]?.role === "armed_group";

  // ---------- exporter assessments ----------
  const LEVEL = { strong: [3, "Strong"], moderate: [2, "Moderate"], weak: [1, "Weak"], none: [0, "None found"] };
  const meter = (l) => `<span class="meter" aria-label="${LEVEL[l][1]}">${[1, 2, 3].map((i) => `<i class="${i <= LEVEL[l][0] ? "on" : ""}"></i>`).join("")}</span> ${LEVEL[l][1]}`;
  const people = (id) => [...new Set(G.DB.relationships.filter((r) => (r.type === "owns" || r.type === "directs") && r.to_actor === id).map((r) => short(r.from_actor)))];

  function buildTable() {
    const rows = [...G.DB.company_assessments].sort((a, b) => LEVEL[b.link][0] - LEVEL[a.link][0] || short(a.actor_id).localeCompare(short(b.actor_id)));
    const flagged = rows.filter((r) => r.link === "strong" || r.link === "moderate").length;
    const sanctioned = rows.filter((r) => G.byId.actors[r.actor_id].sanctions?.length).length;
    document.getElementById("assess").innerHTML = `
      <details open class="assess-box"><summary><strong>Unsanctioned exporters and traders, graded</strong> <span class="muted">${rows.length} companies · ${flagged} with moderate or strong evidence · ${sanctioned} sanctioned</span></summary>
      <p class="small muted">Sayari has no Rwandan company registry, so these grades combine UN and NGO reports, customs records and open registries. "Strong" means a UN report plus a second organisation, which may share sources. Grades describe the evidence; they are allegations, not findings of knowledge or intent. Customs and registry records add structure but never show where ore came from.</p>
      <div class="assess-scroll"><table class="assess"><thead><tr><th>Company</th><th>Evidence of an armed-group link</th><th>Best source type</th><th>Named owners, directors</th><th>Basis</th></tr></thead><tbody>
      ${rows.map((r) => { const a = G.byId.actors[r.actor_id], pp = people(a.id); return `<tr data-id="${G.esc(a.id)}" tabindex="0">
        <td><strong>${G.esc(short(a.id))}</strong><div class="small muted">${G.esc([a.country, a.role].filter(Boolean).join(" · "))}</div></td>
        <td class="nowrap">${meter(r.link)}</td><td>${G.badge(r.evidence_tier)}</td>
        <td class="small">${pp.length ? G.esc(pp.join(", ")) : '<span class="muted">unknown</span>'}</td><td class="small">${G.esc(r.basis)}</td></tr>`; }).join("")}
      </tbody></table></div></details>`;
    document.querySelectorAll(".assess tbody tr").forEach((tr) => { const go = () => pick(tr.dataset.id); tr.addEventListener("click", go); tr.addEventListener("keydown", (e) => e.key === "Enter" && go()); });
  }

  function suggest(text) {
    const list = document.getElementById("company-suggest");
    const q = text.trim().toLowerCase();
    sel = -1;
    if (q.length < 2) { list.hidden = true; return; }
    const hits = G.DB.actors.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 8);
    list.innerHTML = hits.length ? hits.map((a) => `<li role="option" data-id="${G.esc(a.id)}">${G.esc(a.name)} <span class="muted">${G.esc([a.country, a.role?.replace("_", " ")].filter(Boolean).join(" · "))}</span></li>`).join("")
      : `<li class="muted" aria-disabled="true">No match in this dataset. Not being here is not a clearance.</li>`;
    list.hidden = false;
  }

  function pick(id, fromRoute) {
    const a = G.byId.actors[id]; if (!a) return;
    document.getElementById("company-q").value = a.name;
    document.getElementById("company-suggest").hidden = true;
    if (!fromRoute) history.replaceState(null, "", "#company=" + encodeURIComponent(id));
    render(a);
    document.getElementById("company-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render(a) {
    const { esc, badge, cites, actorLine, fmtDate } = G;
    const ps = paths(a.id);
    const self = a.role === "armed_group";
    const best = ps[0];
    const verdict = self ? `<div class="verdict-box armed"><strong>${esc(a.name)} is an armed group.</strong></div>` :
      best ? `<div class="verdict-box found">
          <div class="vb-main">Connected to <strong>${esc(short(best.target))}</strong> in <strong>${best.steps.length} step${best.steps.length > 1 ? "s" : ""}</strong>${ps.length > 1 ? `<span class="vb-also"> · also ${ps.slice(1).map((p) => `${esc(short(p.target))} (${p.steps.length})`).join(", ")}</span>` : ""}</div>
          <div class="vb-sub"><span>Weakest link in the shortest path:</span> ${badge(best.weakest)}</div>
          <div class="vb-sub">A path shows sourced connections. It does not show that this company knowingly funded an armed group.</div></div>`
        : `<div class="verdict-box none"><div class="vb-main">No path to an armed group in this dataset</div>
          <div class="vb-sub">This covers ${G.DB.actors.length} actors and ${G.DB.relationships.length + G.DB.flows.length} sourced links. Absence here is not a clearance.</div></div>`;

    const pathHtml = ps.map((p, i) => `
      <section class="path-card">
        <h3>${i === 0 ? "Shortest path" : "Path"} to ${esc(short(p.target))} <span class="muted">· ${p.steps.length} step${p.steps.length > 1 ? "s" : ""} · weakest ${G.TIER[p.weakest].label.toLowerCase()}</span></h3>
        <ol class="stepper">
          <li class="st-node start">${esc(short(a.id))}</li>
          ${p.steps.map((s) => {
            const sentence = `${short(s.e.from)} ${s.e.text} ${short(s.e.to)}`;  // always in the record's own direction
            return `<li class="st-edge t-${s.e.tier}"><div class="st-line" aria-hidden="true"></div><div class="st-body">
                <div>${esc(sentence)}${s.e.when ? ` <span class="muted">(${esc(s.e.when)})</span>` : ""}</div>
                <div class="claim-meta">${badge(s.e.tier)}</div>
                <div class="cite">${cites(s.e.src, s.e.rec.paragraph_or_page)}</div>${G.denialsFor(s.e.rec.id)}</div></li>
              <li class="st-node${isArmed(s.node) ? " armed" : ""}">${esc(short(s.node))}${G.byId.actors[s.node]?.sanctions?.length ? ' <span class="nf sanc">◆ sanctioned</span>' : ""}</li>`;
          }).join("")}
        </ol>
      </section>`).join("");

    const nb = (adj.get(a.id) || []).filter(({ e }) => e.rec !== a);
    const nbHtml = nb.length ? `<details class="nb"><summary>All direct links (${nb.length})</summary><ul class="cc-list">${nb.map(({ to, e }) =>
      `<li>${esc(short(e.from))} ${esc(e.text)} ${esc(short(e.to))} ${badge(e.tier)}<div class="cite">${cites(e.src)}</div></li>`).join("")}</ul></details>` : "";

    const ca = G.DB.company_assessments.find((c) => c.actor_id === a.id);
    const assess = ca ? `<div class="verdict-box"><div class="vb-main">Evidence of an armed-group link: ${meter(ca.link)}</div>
      <div class="small">${esc(ca.basis)}</div>${ca.still_unknown ? `<div class="small muted">Still unknown: ${esc(ca.still_unknown)}</div>` : ""}${G.denialsFor(ca.id)}</div>` : "";
    const sb = G.DB.smelter_brand.filter((x) => x.brand_actor === a.id || x.smelter_actor === a.id);
    const smelterSide = !sb.length ? "" : a.role === "brand"
      ? `<details class="nb" open><summary>Smelters this company lists (${sb.length})</summary><ul class="cc-list">${sb.map((x) => `<li>${esc(short(x.smelter_actor))} <span class="muted">${esc(x.years.join(", "))}</span><div class="small muted">${esc(x.wording)}</div><div class="cite">${cites(x.source_ids)}</div></li>`).join("")}</ul></details>`
      : `<details class="nb"><summary>Companies listing this smelter (${sb.length})</summary><ul class="cc-list">${sb.map((x) => `<li><a href="#company=${encodeURIComponent(x.brand_actor)}">${esc(short(x.brand_actor))}</a> <span class="muted">${esc(x.years.join(", "))}</span></li>`).join("")}</ul></details>`;
    const sig = G.DB.network_signals.filter((s) => s.from_actor === a.id || s.to_actor === a.id);
    const sigHtml = sig.length ? `<details class="nb"><summary>Network signals (${sig.length})</summary><p class="small muted">Shared buyers, addresses or labels. These are leads only and never count as a path: a common customer is not evidence of ownership or control.</p><ul class="cc-list">${sig.map((s) =>
      `<li>${esc(short(s.from_actor))} · ${esc(short(s.to_actor))} <span class="muted">${esc(s.type.replace(/_/g, " "))}, ${esc(s.strength)}</span> ${badge(s.evidence_tier)}<div class="small">${esc(s.summary)}</div><div class="cite">${cites(s.source_ids)}</div></li>`).join("")}</ul></details>` : "";
    document.getElementById("company-result").innerHTML = `
      <article class="company-card">
        <div class="cc-kicker">${esc([a.role?.replace("_", " "), a.country].filter(Boolean).join(" · "))}</div>
        <h2>${esc(a.name)}</h2>
        <div class="cc-actor">${actorLine(a).replace(/<strong>.*?<\/strong>/, "")}</div>
        <div class="cite">${cites(a.source_ids)}</div>
      </article>
      ${assess}
      ${verdict}
      ${smelterSide}
      ${pathHtml}
      ${nbHtml}
      ${sigHtml}
      <p class="small muted">How paths are found: we join every sourced link in the dataset — ownership and officer ties, sanctions findings, trade records, mineral flows and site control — and take the shortest route to each armed group, preferring stronger evidence when two routes are the same length. Trade links show who traded with whom, never where a specific shipment was mined.</p>`;
  }
})();
