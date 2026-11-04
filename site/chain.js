// Supply-chain view: physical route strip + commercial chain (mine → exporter → trader → smelter → brand).
"use strict";

(function () {
  const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});
  let G, current = null, sectorRows = {}, buyerRows = [];

  const COLS = [
    { key: "mine", label: "Mine", empty: "" },
    { key: "exporter", label: "Rwandan exporter or refinery", empty: "No sourced exporter yet" },
    { key: "trader", label: "Trader or buyer", empty: "No sourced buyer yet" },
    { key: "smelter", label: "Smelter", empty: "No sourced smelter yet" },
    { key: "brand", label: "Component makers and brands", empty: "No sourced smelter on this chain yet, so no brand link." },
  ];
  const ROLE_COL = { exporter: 1, refiner: 1, mining_company: 1, trader: 2, smelter: 3, brand: 4, component_maker: 4 };

  VIEWS.chain = {
    build() {
      G = window.GC;
      const mines = G.DB.sites.filter((s) => s.site_type === "mine" && G.DB.flows.some((f) => f.from_node === s.id));
      const pick = document.getElementById("chain-pick");
      pick.innerHTML = mines.map((s) => `<button type="button" data-site="${G.esc(s.id)}">${G.esc(s.name.replace(/ mining area/, ""))} <span class="muted">${G.esc((s.minerals || [])[0] || "")}</span></button>`).join("");
      pick.addEventListener("click", (e) => {
        const b = e.target.closest("[data-site]"); if (!b) return;
        history.replaceState(null, "", "#chain=" + encodeURIComponent(b.dataset.site));
        render(b.dataset.site);
      });
      window.addEventListener("resize", () => current && !document.getElementById("view-chain").hidden && render(current, true));
    },
    show(params) {
      const id = (params.get && params.get("chain")) || current || "site_rubaya";
      render(id);
    },
  };

  // ---------- graph assembly ----------
  function assemble(siteId) {
    const flows = G.DB.flows, rels = G.DB.relationships;
    // Route: site → site steps, breadth-first, plus the actor a route ends at (e.g. a refinery).
    const levels = [[siteId]], seenSite = new Set([siteId]), routeEdges = [];
    for (let lv = 0; lv < 8; lv++) {
      const next = [];
      for (const s of levels[lv]) for (const f of flows) {
        if (f.from_node !== s) continue;
        const toSite = G.byId.sites[f.to_node] ? f.to_node : null;
        const toActorSite = !toSite && G.byId.actors[f.to_node]?.site_id;
        if (toSite || toActorSite) {
          routeEdges.push(f);
          const n = toSite || f.to_node;
          if (!seenSite.has(n)) { seenSite.add(n); next.push(n); }
        }
      }
      if (!next.length) break;
      levels.push(next);
    }

    // Commercial chain
    const nodes = new Map(), links = [];
    const add = (id, col) => { if (!nodes.has(id)) nodes.set(id, { id, col }); return nodes.get(id); };
    add(siteId, 0);
    for (const f of flows) {
      if (!seenSite.has(f.from_node)) continue;
      const a = G.byId.actors[f.to_node]; if (!a) continue;
      const col = ROLE_COL[a.role]; if (col == null) continue;
      add(a.id, col);
      links.push({ from: siteId, to: a.id, tier: f.evidence_tier, kind: "flow", rec: f, via: f.from_node !== siteId ? f.from_node : null });
    }
    // Links only ever run left to right; a shipment back upstream (e.g. tolling) stays on the company card.
    const col = (id) => ROLE_COL[G.byId.actors[id]?.role];
    const linked = (x, y) => links.some((l) => l.from === x && l.to === y);
    const addLink = (x, y, r) => { if (col(y) > (nodes.get(x)?.col ?? -1) && !linked(x, y)) { add(y, col(y)); links.push({ from: x, to: y, tier: r.evidence_tier, kind: "rel", rec: r }); } };
    for (let pass = 0; pass < 2; pass++) for (const r of rels) {
      if (r.type === "ships_to" && nodes.has(r.from_actor) && col(r.to_actor) != null) addLink(r.from_actor, r.to_actor, r);
      if (r.type === "buys_from" && nodes.has(r.to_actor) && col(r.from_actor) != null) addLink(r.to_actor, r.from_actor, r);
    }
    // Traders a smelter on this chain bought from
    for (const r of rels) {
      if (r.type === "buys_from" && col(r.from_actor) === 3 && nodes.has(r.from_actor) && col(r.to_actor) === 2) { add(r.to_actor, 2); if (!linked(r.to_actor, r.from_actor)) links.push({ from: r.to_actor, to: r.from_actor, tier: r.evidence_tier, kind: "rel", rec: r }); }
    }
    // Companies that list a smelter on this chain, grouped by sector
    const smelters = [...nodes.values()].filter((n) => n.col === 3).map((n) => n.id);
    const bySector = {};
    for (const x of G.DB.smelter_brand) {
      if (!smelters.includes(x.smelter_actor)) continue;
      const sec = G.byId.actors[x.brand_actor].sector;
      const id = "sector:" + sec;
      (bySector[id] = bySector[id] || []).push(x);
    }
    for (const [id, rows] of Object.entries(bySector)) {
      add(id, 4);
      for (const s of new Set(rows.map((r) => r.smelter_actor))) links.push({ from: s, to: id, tier: "documented", kind: "brand", rec: { source_ids: [], notes: "" }, rows: rows.filter((r) => r.smelter_actor === s) });
    }
    sectorRows = bySector;
    // Customs buyers are many and unreviewed, so they share one box; their rows are on its card.
    const buyers = links.filter((l) => G.byId.actors[l.to]?.role === "component_maker");
    if (buyers.length) {
      add("buyers:customs", 4);
      for (const l of buyers) nodes.delete(l.to);
      const smeltersWithBuyers = [...new Set(buyers.map((l) => l.from))];
      for (let i = links.length - 1; i >= 0; i--) if (G.byId.actors[links[i].to]?.role === "component_maker") links.splice(i, 1);
      for (const s of smeltersWithBuyers) links.push({ from: s, to: "buyers:customs", tier: "inferred", kind: "customs", rec: { source_ids: ["src_sayari"], notes: "" }, rows: buyers.filter((l) => l.from === s).map((l) => l.rec) });
      buyerRows = buyers.map((l) => l.rec);
    } else buyerRows = [];
    return { levels, routeEdges, nodes: [...nodes.values()], links };
  }

  // ---------- render ----------
  function render(siteId, keepCard) {
    if (!G.byId.sites[siteId]) siteId = "site_rubaya";
    current = siteId;
    document.querySelectorAll("#chain-pick [data-site]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.site === siteId));
    const g = assemble(siteId);
    renderRoute(g);
    renderGraph(g);
    if (!keepCard) renderCard({ type: "site", id: siteId });
  }

  function renderRoute(g) {
    const { esc, badge, nodeName } = G;
    const edgeTo = (n) => g.routeEdges.find((f) => f.to_node === n);
    const step = (n) => {
      const s = G.byId.sites[n] || G.byId.sites[G.byId.actors[n]?.site_id];
      const e = edgeTo(n);
      return `<div class="rs-node"><span class="rs-name">${esc(nodeName(n).replace(/ mining area/, ""))}</span>
        <span class="rs-type">${esc(s ? s.site_type.replace("_", " ") : "")}${s?.country ? " · " + esc(s.country) : ""}</span>
        ${e ? `<span class="rs-tier">${badge(e.evidence_tier)}</span>` : ""}</div>`;
    };
    document.getElementById("chain-route").innerHTML = `
      <div class="rs-title">Physical route</div>
      <div class="rs-steps">${g.levels.map((lv) => `<div class="rs-level">${lv.map(step).join("")}</div>`).join('<div class="rs-arrow" aria-hidden="true">→</div>')}</div>
      ${g.levels.length < 2 ? '<p class="muted small">No sourced route out of this site yet.</p>' : ""}`;
  }

  function renderGraph(g) {
    const host = document.getElementById("chain-graph");
    const W = Math.max(host.clientWidth, 760);
    const colW = Math.min(210, (W - 40) / COLS.length - 24), gap = (W - colW * COLS.length) / (COLS.length - 1);
    const NH = 44, NG = 10, TOP = 34;
    const byCol = COLS.map((_, i) => g.nodes.filter((n) => n.col === i));
    // order: put nodes with more links first so links cross less
    const deg = (id) => g.links.filter((l) => l.from === id || l.to === id).length;
    byCol.forEach((c) => c.sort((a, b) => deg(b.id) - deg(a.id) || name(a.id).localeCompare(name(b.id))));
    const rows = Math.max(...byCol.map((c) => c.length || 1));
    const H = TOP + rows * (NH + NG) + 20;
    const pos = {};
    byCol.forEach((c, ci) => {
      const off = TOP + ((rows - c.length) * (NH + NG)) / 2;
      c.forEach((n, i) => (pos[n.id] = { x: ci * (colW + gap), y: off + i * (NH + NG), w: colW, h: NH }));
    });

    const svgLinks = g.links.map((l, i) => {
      const a = pos[l.from], b = pos[l.to]; if (!a || !b) return "";
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
      const skip = (g.nodes.find((n) => n.id === l.to).col - g.nodes.find((n) => n.id === l.from).col) > 1 || l.kind === "brand";
      return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" class="clink t-${l.tier}${skip ? " skip" : ""}" data-i="${i}"/>
              <path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" class="clink-hit" data-i="${i}"/>`;
    }).join("");

    const heads = COLS.map((c, i) => `<div class="ccol-head" style="left:${i * (colW + gap)}px;width:${colW}px">${c.label}</div>`).join("");
    const empties = COLS.map((c, i) => byCol[i].length ? "" :
      `<div class="cnode empty" style="left:${i * (colW + gap)}px;top:${TOP + ((rows - 1) * (NH + NG)) / 2}px;width:${colW}px;min-height:${NH}px">${G.esc(c.empty)}</div>`).join("");
    const nodes = g.nodes.map((n) => {
      const p = pos[n.id], a = G.byId.actors[n.id], s = G.byId.sites[n.id];
      if (n.id === "buyers:customs") {
        return `<button type="button" class="cnode sector" data-id="${G.esc(n.id)}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px">
          <span class="cn-name">Customs buyers</span><span class="cn-sub">${new Set(buyerRows.map((r) => r.to_actor)).size} consignees, unchecked</span></button>`;
      }
      if (n.id.startsWith("sector:")) {
        const names = new Set(sectorRows[n.id].map((r) => r.brand_actor));
        return `<button type="button" class="cnode sector" data-id="${G.esc(n.id)}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px">
          <span class="cn-name">${G.esc(n.id.slice(7))}</span><span class="cn-sub">${names.size} compan${names.size === 1 ? "y" : "ies"} list these</span></button>`;
      }
      const flags = [];
      if (a?.sanctions?.length) flags.push('<span class="nf sanc" title="Sanctioned">◆ sanctioned</span>');
      if (a?.rmi_status) flags.push(`<span class="nf rmi" title="${a.rmi_frozen ? "RMI status frozen since Aug 2026" : "RMI status"}">RMI ${a.rmi_frozen ? "frozen" : "conformant"}</span>`);
      if (a?.sayari_confidence === "low") flags.push('<span class="nf low" title="Low-confidence Sayari match">low-conf.</span>');
      // A node "denies" when it is itself the respondent to a recorded claim.
      const first = (a?.name || "").split(/[ (]/)[0].toLowerCase();
      if (a && first.length > 3 && G.DB.responses_to_claims.some((d) => d.respondent.toLowerCase().startsWith(first))) flags.push('<span class="nf den">denies</span>');
      const ctl = s ? G.DB.control_claims.filter((c) => c.site_id === s.id && !c.valid_to) : [];
      const sub = s ? (ctl.length ? `held by ${[...new Set(ctl.map((c) => G.byId.actors[c.actor_id]?.name.replace(/ \(.*/, "")))].join(", ")}` : s.admin_area)
                    : [a?.country, roleLabel(a?.role)].filter(Boolean).join(" · ");
      return `<button type="button" class="cnode${s ? " mine" : ""}" data-id="${G.esc(n.id)}" title="${G.esc(G.nodeName(n.id))}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px">
        <span class="cn-name">${G.esc(name(n.id))}</span><span class="cn-sub">${G.esc(sub || "")}${flags.length ? " " + flags.join(" ") : ""}</span></button>`;
    }).join("");

    host.innerHTML = `<div class="cg-inner" style="height:${H}px;width:${W}px">
        <svg width="${W}" height="${H}" class="cg-svg">${svgLinks}</svg>${heads}${empties}${nodes}
        <div class="chain-tip" hidden></div></div>
      <div class="cg-key"><span><i class="kl t-designated"></i>Designated</span><span><i class="kl t-documented"></i>Documented</span><span><i class="kl t-reported"></i>Reported</span><span><i class="kl t-inferred"></i>Inferred</span><span class="muted">Hover a link for its source; click a box for details.</span></div>`;

    const tip = host.querySelector(".chain-tip");
    host.querySelectorAll(".clink-hit").forEach((p) => {
      const l = g.links[+p.dataset.i];
      p.addEventListener("mousemove", (e) => {
        const r = host.querySelector(".cg-inner").getBoundingClientRect();
        tip.innerHTML = linkText(l, true); tip.hidden = false;
        tip.style.left = Math.min(e.clientX - r.left + 12, r.width - 280) + "px"; tip.style.top = (e.clientY - r.top + 12) + "px";
        host.querySelectorAll(`.clink[data-i="${l && p.dataset.i}"]`).forEach((x) => x.classList.add("hl"));
      });
      p.addEventListener("mouseleave", () => { tip.hidden = true; host.querySelectorAll(".clink.hl").forEach((x) => x.classList.remove("hl")); });
      p.addEventListener("click", () => renderCard({ type: "link", link: l }));
    });
    host.querySelectorAll(".cnode[data-id]").forEach((b) => {
      b.addEventListener("click", () => {
        host.querySelectorAll(".cnode.sel").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
        renderCard(b.dataset.id === "buyers:customs" ? { type: "buyers" } : b.dataset.id.startsWith("sector:") ? { type: "sector", id: b.dataset.id } : G.byId.sites[b.dataset.id] ? { type: "site", id: b.dataset.id } : { type: "actor", id: b.dataset.id }, g);
      });
      b.addEventListener("mouseenter", () => g.links.forEach((l, i) => { if (l.from === b.dataset.id || l.to === b.dataset.id) host.querySelectorAll(`.clink[data-i="${i}"]`).forEach((x) => x.classList.add("hl")); }));
      b.addEventListener("mouseleave", () => host.querySelectorAll(".clink.hl").forEach((x) => x.classList.remove("hl")));
    });
  }

  const name = (id) => id === "buyers:customs" ? "Customs buyers" : id.startsWith("sector:") ? id.slice(7) : G.nodeName(id).replace(/ mining area/, "").replace(/ — .*/, "");
  const roleLabel = (r) => ({ exporter: "exporter", refiner: "refinery", trader: "trader", smelter: "smelter", mining_company: "mining company" }[r] || "");

  function linkText(l, short) {
    const { esc, badge, cites } = G;
    if (l.kind === "customs") return `<strong>${esc(name(l.from))} → customs buyers</strong><div>${badge("inferred")}</div><div class="small">${l.rows.length} consignee${l.rows.length === 1 ? "" : "s"} in Sayari customs rows. These show who received shipments, not where the ore came from.</div>`;
    if (l.kind === "brand") return `<strong>${esc(name(l.from))} → ${esc(name(l.to))}</strong><div>${badge("documented")}</div>
      <div class="small">${l.rows.length} compan${l.rows.length === 1 ? "y lists" : "ies list"} this smelter in a filing. This means it may be in the supply chain, not that Rubaya material was received.</div>`;
    const r = l.rec;
    const verb = l.kind === "flow" ? `${name(l.from)} → ${name(l.to)}${l.via ? ` (via ${name(l.via)})` : ""}` :
      r.type === "ships_to" ? `${name(r.from_actor)} shipped to ${name(r.to_actor)}` : `${name(r.from_actor)} bought from ${name(r.to_actor)}`;
    return `<strong>${esc(verb)}</strong><div>${badge(l.tier)} <span class="muted">${esc(r.period || [r.valid_from, r.valid_to].filter(Boolean).map(G.fmtDate).join(" – "))}</span></div>
      <div class="small">${esc(r.summary || r.notes || "")}</div>${short ? "" : `<div class="cite">${cites(r.source_ids)}</div>${G.denialsFor(r.id)}`}`;
  }

  function renderCard(sel) {
    const { esc, cites, actorLine } = G;
    const card = document.getElementById("chain-card");
    if (sel.type === "buyers") {
      const rows = [...buyerRows].sort((x, y) => parseInt(y.notes) - parseInt(x.notes));
      card.innerHTML = `<div class="cc-kicker">Customs buyers</div><h3>Who received shipments from these smelters</h3>
        <p class="small muted">Consignees on Sayari customs rows. Rows are not consignments, and names have not been checked as the same legal entity. ${G.badge("inferred")}</p>
        <ul class="cc-list">${rows.map((r) => `<li><strong>${esc(name(r.to_actor))}</strong> <span class="muted">from ${esc(name(r.from_actor))}</span> ${G.sayariLink(r.to_actor)}<div class="small">${esc(r.notes.split(".")[0])}. ${esc(G.fmtDate(r.valid_from))} – ${esc(G.fmtDate(r.valid_to))}</div></li>`).join("")}</ul>`;
      return;
    }
    if (sel.type === "sector") {
      const rows = sectorRows[sel.id] || [];
      const byBrand = {};
      for (const r of rows) (byBrand[r.brand_actor] = byBrand[r.brand_actor] || []).push(r);
      card.innerHTML = `<div class="cc-kicker">Sector</div><h3>${esc(sel.id.slice(7))}</h3>
        <p class="small muted">Companies listing a smelter on this chain in an SEC filing or voluntary report. Most say it "may" be in their supply chain, usually from supplier replies. No filing says a company received Rubaya material.</p>
        <ul class="cc-list">${Object.entries(byBrand).sort((x, y) => name(x[0]).localeCompare(name(y[0]))).map(([b, rs]) => `<li><a href="#company=${encodeURIComponent(b)}"><strong>${esc(name(b))}</strong></a>
          <div class="small">${esc(rs.map((r) => name(r.smelter_actor)).join(", "))} · ${esc([...new Set(rs.flatMap((r) => r.years))].sort().join(", "))}</div>
          <div class="small muted">${esc(rs[0].wording)}</div><div class="cite">${cites(rs[0].source_ids)}</div></li>`).join("")}</ul>`;
      return;
    }
    if (sel.type === "link") { card.innerHTML = `<div class="cc-kicker">Link</div>${linkText(sel.link, false)}`; return; }
    if (sel.type === "site") {
      const s = G.byId.sites[sel.id];
      const ctl = G.DB.control_claims.filter((c) => c.site_id === s.id);
      card.innerHTML = `<div class="cc-kicker">Mine</div><h3>${esc(s.name)}</h3>
        <ul class="cc-list">${ctl.map((c) => `<li><strong>${esc(G.byId.actors[c.actor_id]?.name)}</strong> ${esc(G.CONTROL_VERB[c.control_type])} it, ${esc(G.fmtDate(c.valid_from || c.observed_date))} – ${c.valid_to ? esc(G.fmtDate(c.valid_to)) : "present"} ${G.badge(c.evidence_tier)}<div class="cite">${cites(c.source_ids, c.paragraph_or_page)}</div></li>`).join("")}</ul>
        <a class="dr-cta" href="#site=${encodeURIComponent(s.id)}">See it on the map →</a>
        <p class="small muted">Links show who bought from or traded with whom, according to each source. They do not show that a particular shipment came from this mine; customs data never shows that.</p>`;
      return;
    }
    const a = G.byId.actors[sel.id];
    const rels = G.DB.relationships.filter((r) => r.from_actor === a.id || r.to_actor === a.id);
    card.innerHTML = `<div class="cc-kicker">${esc(roleLabel(a.role) || a.type.replace("_", " "))}</div><h3>${esc(a.name)}</h3>
      <div class="cc-actor">${actorLine(a).replace(/<strong>.*?<\/strong>/, "")}</div>
      ${a.rmi_status ? `<div class="rmi-box"><strong>RMI: ${esc(a.rmi_status)}${a.rmi_frozen ? " (frozen)" : ""}</strong> ${esc(a.rmi_id || "")}, as of ${esc(G.fmtDate(a.rmi_observed))}.
        ${a.rmi_frozen ? "RMI paused new China assessments on 17 Aug 2026, so this is not a current audit result. " : ""}Conformant means the due-diligence system passed audit, not that the ore is clean.</div>` : ""}
      ${rels.length ? `<h4>Recorded links</h4><ul class="cc-list">${rels.map((r) => `<li>${esc(name(r.from_actor))} <em>${esc(r.type.replace("_", " "))}</em> ${esc(name(r.to_actor))} ${G.badge(r.evidence_tier)}<div class="small muted">${esc(r.notes || "")}</div></li>`).join("")}</ul>` : ""}
      <a class="dr-cta" href="#company=${encodeURIComponent(a.id)}">Check its path to an armed group →</a>
      <div class="cite">${cites(a.source_ids)}</div>`;
  }
})();
