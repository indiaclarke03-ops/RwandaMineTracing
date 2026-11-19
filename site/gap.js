// Export-gap view: coltan exports vs what Rwanda's geology predicts. Reads data/laundering_gap.json.
"use strict";

(function () {
  let GAP = null, H = null, drawn = false;

  async function loadGap() {
    for (const base of ["data/", "../data/"]) {
      try {
        const r = await fetch(base + "laundering_gap.json");
        if (r.ok) return r.json();
      } catch (e) { /* next */ }
    }
    return null;
  }

  window.buildGap = async function (DB, helpers) {
    H = helpers;
    H.DB = DB;
    GAP = await loadGap();
    window.GC_GAP = GAP;
    if (!GAP) return;
    renderText();
    if (!document.getElementById("view-laundering").hidden) window.drawGap();
  };

  window.drawGap = function () {
    if (!GAP || drawn) return;
    drawn = true;
    lineChart(document.getElementById("gap-line"));
    barChart(document.getElementById("gap-bars"));
    if (GAP.quarterly && GAP.quarterly.length) quarterChart(document.getElementById("gap-quarters"));
  };

  const fmt = (n) => (n == null ? "–" : Math.round(n).toLocaleString("en-GB"));
  const svgEl = (tag, attrs = {}) => {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  function renderText() {
    const { esc, badge, cites } = H;
    const rows = GAP.rows, un = GAP.rubaya_2024;
    const row = (y) => rows.find((r) => r.year === y);
    const br = (m, y, v) => GAP.bridge.find((b) => b.mineral === m && b.year === y && (!v || b.variant === v));
    const b24 = br("coltan", 2024), b25 = br("coltan", 2025), tinAll = br("tin", 2025, "as_published"), tinNet = br("tin", 2025, "excl_cambodia_low_value");
    const base = GAP.baseline_share_pct_2018_2022;
    const zs = GAP.zero_sum.filter((z) => z.mineral === "coltan");
    document.getElementById("laundering").innerHTML = `
      <section class="answer">
        <h3>Does Congo's missing output explain Rwanda's excess?</h3>
        <p><strong>For coltan, broadly yes, province by province.</strong> From 2023 Rwanda exported far more coltan than its tin-ore exports predict, and over the same years official output in Congo's Kivu provinces fell by a similar amount. In size, this fits ore from armed-group-held areas, chiefly M23's Rubaya. For tin ore the 2025 surge is smaller than it looks. Gold can't be measured this way.</p>
        <div class="tiles">
          <div class="tile"><span class="num">${fmt(b24.rwanda_excess_t)} t</span><span class="lbl">Rwanda's coltan excess, 2024</span></div>
          <div class="tile"><span class="num">${fmt(b24.kivu_loss_t)} t</span><span class="lbl">Fall in official Kivu coltan output, 2024</span></div>
          <div class="tile"><span class="num">${b24.central}%</span><span class="lbl">Central estimate of the excess that could be from armed-group-held areas (range ${b24.low}–${b24.high}%)</span></div>
        </div>
        <p class="small muted">${badge("inferred")} Our analysis. No source states these shares. Rwanda denies laundering and has not answered the UN's April 2026 request to explain the rise.</p>
      </section>

      <h3 class="step"><span>1</span>Rwanda exports more coltan than its geology predicts</h3>
      <p class="chart-sub">Rwanda publishes no mine-level output, and USGS's "production" figures for it are mostly reported exports, so we use geology. In this region's mixed deposits coltan is about a quarter of combined coltan and tin-ore output, so tin-ore exports predict coltan exports. From 2018 to 2022 they tracked closely (coltan was ${base[0]}–${base[1]}% of the total). They separate from 2023, while Rubaya is in armed-group hands. For 2025 the baseline is frozen at its 2022–24 level, because the tin-ore surge itself looks non-domestic.</p>
      <div class="legend-row" aria-hidden="true">
        <span><i class="sw s1"></i>Coltan exports reported by Rwanda</span>
        <span><i class="sw s2"></i>Coltan expected from tin-ore exports</span>
        <span><i class="sw hatch"></i>Excess</span>
      </div>
      <div id="gap-line" class="chart" role="img" aria-label="Line chart of reported and expected coltan exports, 2018 to 2025. The lines track until 2022, then reported exports pull ahead."></div>

      <h3 class="step"><span>2</span>Official output in the Kivus fell by a similar amount</h3>
      <p class="chart-sub">Nationally there is no "missing" coltan: Congo's recorded exports exceed its recorded output in 2022–24. The signal appears by province. This compares Rwanda's excess with the fall in official North and South Kivu output against the 2020–22 mean. The fall means ore left the state's books, not that it reached Rwanda; the ministry says some Kivu ore was rerouted through Kindu and Kalemie. Shaded: the UN's estimate of Rubaya coltan for May–Dec 2024.</p>
      <div class="legend-row" aria-hidden="true">
        <span><i class="sw s1 block"></i>Rwanda's excess</span>
        <span><i class="sw s2 block"></i>Fall in official Kivu output</span>
        <span><i class="sw band"></i>UN Rubaya estimate, 2024</span>
      </div>
      <div id="gap-bars" class="chart" role="img" aria-label="Paired bars of Rwanda's coltan excess and the fall in official Kivu output, 2023 to 2025. The two are similar in size each year."></div>
      <details class="table-view"><summary>Rwanda and Congo official coltan exports together</summary>
        <table><thead><tr><th>Year</th><th>Rwanda</th><th>Congo official</th><th>Combined</th><th>Rwanda's share</th><th>China's imports from both</th></tr></thead>
        <tbody>${zs.map((z) => `<tr><td>${z.year}</td><td>${fmt(z.rwanda_exports_t)}</td><td>${fmt(z.drc_official_exports_t)}</td><td>${fmt(z.combined_t)}</td><td>${Math.round(z.rwanda_share_pct)}%</td><td>${fmt(z.china_combined_t)}</td></tr>`).join("")}</tbody></table>
        <p class="small muted">On official figures the combined total is about flat from 2023 while Rwanda's share climbs, which fits ore being rerouted. China's import figures rise much more, so some of Congo's fall may be a recording problem and total supply may have grown.</p>
      </details>

      <h3 class="step"><span>3</span>How much could come from armed-group-held areas?</h3>
      <p class="chart-sub">We take published volumes from armed-group-held areas, assume 50, 75 or 100% reached Rwanda, and divide by the excess. Those pass-through rates are our judgement. Before 30 April 2024 Rubaya was under PARECO-FF and Wazalendo groups, so "armed-group-held" isn't the same as M23, and about 500 t of the 2025 flow was stock looted from exporters rather than new ore.</p>
      <div id="gap-range" class="range-chart"></div>
      <details class="table-view"><summary>The arithmetic, and what would disprove it</summary>
        <table class="left"><thead><tr><th>Mineral, year</th><th>Excess</th><th>How the shares are worked out</th></tr></thead>
        <tbody>${GAP.bridge.map((b) => `<tr><td>${esc(rangeLabel(b))}</td><td>${fmt(b.rwanda_excess_t)} t</td><td>${esc(b.method)}</td></tr>`).join("")}</tbody></table>
        <p class="small"><strong>What would disprove this:</strong> ${esc(b25.falsifiers)}</p>
      </details>

      <h3 class="step"><span>4</span>Where the extra ore shipped</h3>
      <p class="chart-sub">Change in tonnes by destination, using importers' figures for coltan and Rwanda's own for tin ore. The partner that grew most is the likeliest destination of the excess, though customs data never shows which tonnes were which.</p>
      <div class="partner-grid"><div id="pg-coltan"></div><div id="pg-tin"></div></div>
      <aside class="callout-box">
        <h4>Why the tin-ore rise is smaller than it looks</h4>
        <p>The UN reports Rwanda's tin-ore exports rose 58% in 2025 (about ${fmt(tinAll.rwanda_excess_t)} t), and says this matches M23-area smuggling. But Rwanda's own trade data shows 1,620 t of the increase going to Cambodia at about $1.6/kg, against about $20/kg elsewhere. Customs rows point to low-grade material from one Rwandan smelter. Without it, the rise is about ${fmt(tinNet.rwanda_excess_t)} t. This is unconfirmed and sits awkwardly with the UN's reading, so we show both.</p>
      </aside>

      <h3 class="step"><span>5</span>Who ships it</h3>
      <p class="chart-sub">Coltan leaving Rwanda in Sayari's customs records, mostly Tanzanian transit data. Blue is the seven exporters Global Witness found buying Rubaya coltan. When ITSCI suspended several in 2025, total volume held steady while other exporters' share grew.</p>
      <div class="legend-row" aria-hidden="true">
        <span><i class="sw s1 block"></i>Seven exporters named by Global Witness</span>
        <span><i class="sw s2 block"></i>Other exporters</span>
        <span><i class="sw band"></i>ITSCI suspensions (Mar–Nov 2025)</span>
      </div>
      <div id="gap-quarters" class="chart" role="img" aria-label="Stacked bars of coltan export weight by quarter, 2023 to mid-2026. The named exporters' share falls during the 2025 ITSCI suspensions while the total holds steady."></div>
      <p class="small muted">${badge("documented")} for the shipments, ${badge("inferred")} for reading the shift as one set of exporters replacing another. January–August 2024 is missing from the data.</p>

      <div id="gap-evidence"></div>

      <details class="table-view"><summary>All the coltan numbers</summary>
        <table><thead><tr><th>Year</th><th>Coltan exports</th><th>Tin-ore exports</th><th>Coltan share</th><th>Expected coltan</th><th>Excess</th><th>USGS estimate</th><th>Importers' figure</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r.year}</td><td>${fmt(r.coltan_exports_t)}</td><td>${fmt(r.cassiterite_exports_t)}</td><td>${r.coltan_share_pct}%</td><td>${fmt(r.expected_best_t)}</td><td><strong>${fmt(r.excess_best_t)}</strong></td><td>${fmt(r.usgs_production_estimate_t)}</td><td>${fmt(r.coltan_exports_mirror_t)}</td></tr>`).join("")}</tbody></table>
        <p class="small muted">2025 uses the frozen baseline; with a same-year baseline the excess is ${fmt(row(2025).excess_vs_geology_t)} t. Sources: ${cites([...new Set(rows.flatMap((r) => r.source_ids))])}</p>
      </details>
      <div class="method">
        <h3>Method and limits</h3>
        <p>${esc(GAP.method)}</p>
        <ul>${GAP.caveats.map((c) => `<li>${esc(c)}</li>`).join("")}<li>${esc(un.note)}</li></ul>
      </div>`;
    renderEvidence();
    renderRange();
    renderPartners();
  }

  const rangeLabel = (b) => `${b.mineral === "tin" ? "Tin ore" : b.mineral === "coltan" ? "Coltan" : "Tungsten"} ${b.year}${b.variant === "excl_cambodia_low_value" ? " (without Cambodia)" : b.variant === "as_published" ? " (as published)" : ""}`;

  function renderRange() {
    document.getElementById("gap-range").innerHTML = GAP.bridge.map((b) => `
      <div class="rg-row" title="${H.esc(b.method)}"><span class="rg-lab">${H.esc(rangeLabel(b))}</span>
        <span class="rg-track"><i class="rg-bar" style="left:${b.low}%;width:${b.high - b.low}%"></i><i class="rg-dot" style="left:${b.central}%"></i></span>
        <span class="rg-val">${b.central}% <span class="muted">(${b.low}–${b.high})</span></span></div>`).join("") +
      `<div class="rg-row rg-axis"><span></span><span class="rg-track noline"><em style="left:0">0%</em><em style="left:50%">50%</em><em style="left:100%">100%</em></span><span></span></div>`;
  }

  const PARTNER = { CHN: "China", MYS: "Malaysia", THA: "Thailand", USA: "United States", JPN: "Japan", LUX: "Luxembourg", ARE: "UAE", SGP: "Singapore", KHM: "Cambodia", BEL: "Belgium", HKG: "Hong Kong" };
  function renderPartners() {
    const panel = (id, title, sel) => {
      const rows = GAP.partners.filter(sel).sort((a, b) => b.change_t - a.change_t);
      const max = Math.max(...rows.map((r) => Math.abs(r.change_t)));
      document.getElementById(id).innerHTML = `<h4>${title}</h4>` + rows.map((r) => {
        const w = (Math.abs(r.change_t) / max) * 50;
        return `<div class="pg-row"><span class="pg-name">${PARTNER[r.partner] || r.partner}</span><span class="pg-track"><i class="pg-bar ${r.change_t < 0 ? "neg" : "pos"}${r.partner === "KHM" ? " flag" : ""}" style="width:${w}%;${r.change_t < 0 ? `left:${50 - w}%` : "left:50%"}"></i></span><span class="pg-val">${r.change_t > 0 ? "+" : "−"}${fmt(Math.abs(r.change_t))}</span></div>`;
      }).join("");
    };
    panel("pg-coltan", "Coltan, 2022 to 2024 (importers' figures)", (r) => r.mineral === "coltan" && r.side === "mirror");
    panel("pg-tin", "Tin ore, 2022 to 2025 (Rwanda's figures)", (r) => r.mineral === "tin" && r.side === "rwanda");
  }

  // ---------- shared chart frame ----------
  function frame(host, height) {
    host.innerHTML = "";
    const W = Math.max(320, host.clientWidth || 800);
    const m = { t: 18, r: W < 560 ? 16 : 150, b: 30, l: 52 };
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${height}`, width: "100%", height });
    host.appendChild(svg);
    const tip = document.createElement("div");
    tip.className = "chart-tip"; tip.hidden = true;
    host.appendChild(tip);
    return { svg, tip, W, H: height, m, iw: W - m.l - m.r, ih: height - m.t - m.b };
  }

  function yAxis(f, max, step) {
    for (let v = 0; v <= max; v += step) {
      const y = f.m.t + f.ih - (v / max) * f.ih;
      f.svg.appendChild(svgEl("line", { x1: f.m.l, x2: f.m.l + f.iw, y1: y, y2: y, class: v === 0 ? "axis" : "grid" }));
      const t = svgEl("text", { x: f.m.l - 8, y: y + 4, class: "tick", "text-anchor": "end" });
      t.textContent = v.toLocaleString("en-GB");
      f.svg.appendChild(t);
    }
  }

  function showTip(f, html, x, y) {
    f.tip.innerHTML = html; f.tip.hidden = false;
    const tw = f.tip.offsetWidth;
    const left = Math.min(Math.max(x / f.W * f.svg.clientWidth - tw / 2, 0), f.svg.clientWidth - tw);
    f.tip.style.left = left + "px";
    f.tip.style.top = Math.max(0, y / f.H * f.svg.clientHeight - f.tip.offsetHeight - 12) + "px";
  }

  // ---------- chart 1: two lines + hatched excess ----------
  function lineChart(host) {
    const rows = GAP.rows;
    const f = frame(host, 320);
    const years = rows.map((r) => r.year);
    const max = 3000;
    const x = (yr) => f.m.l + ((yr - years[0]) / (years[years.length - 1] - years[0])) * f.iw;
    const y = (v) => f.m.t + f.ih - (v / max) * f.ih;
    yAxis(f, max, 500);

    // hatch pattern for the excess area
    const defs = svgEl("defs");
    const pat = svgEl("pattern", { id: "hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
    pat.appendChild(svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 6, class: "hatch-line" }));
    defs.appendChild(pat); f.svg.appendChild(defs);

    // control periods at Rubaya
    const span = (from, to, label) => {
      f.svg.appendChild(svgEl("rect", { x: x(from), width: x(to) - x(from), y: f.m.t, height: f.ih, class: "ctrl-span" }));
      const t = svgEl("text", { x: x(from) + 6, y: f.m.t + f.ih - 8, class: "event-label" });
      t.textContent = label; f.svg.appendChild(t);
    };
    span(2022, 2024 + 3 / 12, "PARECO-FF holds Rubaya");
    // events
    [{ yr: 2024 + 3 / 12, label: "M23 takes Rubaya (Apr 2024)" }].forEach((e) => {
      f.svg.appendChild(svgEl("line", { x1: x(e.yr), x2: x(e.yr), y1: f.m.t, y2: f.m.t + f.ih, class: "event" }));
      const t = svgEl("text", { x: x(e.yr) - 6, y: f.m.t + 10, class: "event-label", "text-anchor": "end" });
      t.textContent = e.label; f.svg.appendChild(t);
    });

    // excess area (only where reported > expected)
    const top = rows.map((r) => `${x(r.year)},${y(Math.max(r.coltan_exports_t, r.expected_best_t))}`);
    const bot = rows.slice().reverse().map((r) => `${x(r.year)},${y(r.expected_best_t)}`);
    f.svg.appendChild(svgEl("polygon", { points: top.concat(bot).join(" "), fill: "url(#hatch)", class: "excess" }));

    const line = (key, cls) => {
      const d = rows.map((r, i) => `${i ? "L" : "M"}${x(r.year)},${y(r[key])}`).join("");
      f.svg.appendChild(svgEl("path", { d, class: "line " + cls }));
      rows.forEach((r) => f.svg.appendChild(svgEl("circle", { cx: x(r.year), cy: y(r[key]), r: 4, class: "dot " + cls })));
    };
    line("expected_best_t", "s2");
    line("coltan_exports_t", "s1");

    // direct labels at the right end
    const last = rows[rows.length - 1];
    if (f.m.r > 60) {
      [["coltan_exports_t", "Reported exports"], ["expected_best_t", "Expected from tin ore"]].forEach(([k, lab]) => {
        const t = svgEl("text", { x: x(last.year) + 10, y: y(last[k]) + 4, class: "direct" });
        t.textContent = lab; f.svg.appendChild(t);
      });
    }

    years.forEach((yr) => {
      const t = svgEl("text", { x: x(yr), y: f.H - 8, class: "tick", "text-anchor": "middle" });
      t.textContent = yr; f.svg.appendChild(t);
    });

    // crosshair + tooltip
    const cross = svgEl("line", { y1: f.m.t, y2: f.m.t + f.ih, class: "cross", visibility: "hidden" });
    f.svg.appendChild(cross);
    const hit = svgEl("rect", { x: f.m.l, y: f.m.t, width: f.iw, height: f.ih, fill: "transparent" });
    f.svg.appendChild(hit);
    const move = (ev) => {
      const pt = f.svg.getBoundingClientRect();
      const sx = ((ev.clientX - pt.left) / pt.width) * f.W;
      const r = rows.reduce((a, b) => (Math.abs(x(b.year) - sx) < Math.abs(x(a.year) - sx) ? b : a));
      cross.setAttribute("x1", x(r.year)); cross.setAttribute("x2", x(r.year)); cross.setAttribute("visibility", "visible");
      showTip(f, `<strong>${r.year}</strong><div><i class="sw s1"></i>Reported ${fmt(r.coltan_exports_t)} t</div>
        <div><i class="sw s2"></i>Expected ${fmt(r.expected_best_t)} t</div><div>Excess <strong>${fmt(r.excess_best_t)} t</strong> · coltan ${r.coltan_share_pct}% of total</div>`,
        x(r.year), y(r.coltan_exports_t));
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => { f.tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
  }

  // ---------- chart 2: Rwanda's excess vs the fall in official Kivu output ----------
  function barChart(host) {
    const un = GAP.rubaya_2024;
    const data = [2023, 2024, 2025].map((y) => { const b = GAP.bridge.find((x) => x.mineral === "coltan" && x.year === y); return { y, ex: b.rwanda_excess_t, loss: b.kivu_loss_t }; });
    const f = frame(host, 280);
    const max = 1600, band = f.iw / data.length, bw = Math.min(70, band * 0.28);
    const x = (i) => f.m.l + band * i + band / 2;
    const y = (v) => f.m.t + f.ih - (v / max) * f.ih;
    yAxis(f, max, 400);
    const base = f.m.t + f.ih;
    const rect = (bx, v, cls) => { const top = y(v), r = 4; return svgEl("path", { d: `M${bx},${base} V${top + r} q0,-${r} ${r},-${r} H${bx + bw - r} q${r},0 ${r},${r} V${base} Z`, class: cls }); };
    data.forEach((d, i) => {
      if (d.y === 2024) {
        f.svg.appendChild(svgEl("rect", { x: x(i) - band / 2 + 6, width: band - 12, y: y(un.high), height: y(un.low) - y(un.high), class: "un-band" }));
        if (f.m.r > 60) { const t = svgEl("text", { x: f.m.l + f.iw + 10, y: y((un.low + un.high) / 2) + 4, class: "direct" }); t.textContent = "UN Rubaya estimate"; f.svg.appendChild(t); }
      }
      const gap = 2;
      f.svg.appendChild(rect(x(i) - bw - gap / 2, d.ex, "seg s1"));
      f.svg.appendChild(rect(x(i) + gap / 2, d.loss, "seg s2"));
      [[x(i) - bw / 2 - gap / 2, d.ex], [x(i) + bw / 2 + gap / 2, d.loss]].forEach(([tx, v]) => { const l = svgEl("text", { x: tx, y: y(v) - 6, class: "bar-val", "text-anchor": "middle" }); l.textContent = fmt(v); f.svg.appendChild(l); });
      const yt = svgEl("text", { x: x(i), y: f.H - 8, class: "tick", "text-anchor": "middle" }); yt.textContent = d.y; f.svg.appendChild(yt);
    });
  }

  // ---------- chart 3: stacked quarterly bars (GW-named vs other exporters) ----------
  function quarterChart(host) {
    // full quarter range, so the 2024 data hole shows as a gap rather than being squeezed out
    const have = Object.fromEntries(GAP.quarterly.map((q) => [q.quarter, q]));
    const qs = [];
    for (let y = 2023; y <= 2026; y++) for (let k = 1; k <= 4; k++) {
      const id = `${y}Q${k}`;
      if (id >= GAP.quarterly[0].quarter && id <= GAP.quarterly[GAP.quarterly.length - 1].quarter) qs.push(id);
    }
    const f = frame(host, 280);
    const max = 1200, n = qs.length, band = f.iw / n, bw = Math.min(30, band * 0.62);
    const x = (i) => f.m.l + band * i + band / 2;
    const y = (v) => f.m.t + f.ih - (v / max) * f.ih;
    // ITSCI suspension window: 2025Q1 (16 Mar) to 2025Q4 (12 Nov)
    const i0 = qs.indexOf("2025Q1"), i1 = qs.indexOf("2025Q4");
    if (i0 >= 0 && i1 >= 0) f.svg.appendChild(svgEl("rect", { x: x(i0) - band / 2, width: band * (i1 - i0 + 1), y: f.m.t, height: f.ih, class: "itsci-band" }));
    yAxis(f, max, 200);
    qs.forEach((q, i) => {
      const r = have[q];
      const lab = svgEl("text", { x: x(i), y: f.H - 8, class: "tick", "text-anchor": "middle" });
      lab.textContent = q.endsWith("Q1") || i === 0 ? q.replace("Q", " Q") : q.slice(4);
      f.svg.appendChild(lab);
      if (!r || r.weight_t < 5) {
        const t = svgEl("text", { x: x(i), y: f.m.t + f.ih - 6, class: "nodata", "text-anchor": "middle" });
        t.textContent = "no data"; f.svg.appendChild(t);
        return;
      }
      const gw = r.gw7_weight_t, other = r.weight_t - gw;
      const base = f.m.t + f.ih, gwTop = y(gw), allTop = y(r.weight_t);
      f.svg.appendChild(svgEl("rect", { x: x(i) - bw / 2, y: gwTop, width: bw, height: base - gwTop, class: "seg s1" }));
      // 2px surface gap between stacked segments
      if (other > 0) f.svg.appendChild(svgEl("rect", { x: x(i) - bw / 2, y: allTop, width: bw, height: Math.max(0, gwTop - allTop - 2), rx: 2, class: "seg s2" }));
      const hit = svgEl("rect", { x: x(i) - band / 2, y: f.m.t, width: band, height: f.ih, fill: "transparent" });
      hit.addEventListener("pointermove", () => showTip(f, `<strong>${q}</strong><div>Total ${fmt(r.weight_t)} t (${r.shipments} rows)</div>
        <div><i class="sw s1"></i>Named seven: ${fmt(gw)} t (${Math.round(100 * gw / r.weight_t)}%)</div>
        <div><i class="sw s2"></i>Others: ${fmt(other)} t</div>
        <div>Rows to UAE-based buyers: ${r.uae_buyer_shipments} of ${r.shipments}</div>`, x(i), allTop));
      hit.addEventListener("pointerleave", () => (f.tip.hidden = true));
      f.svg.appendChild(hit);
    });
  }

  function renderEvidence() {
    const { esc, badge, cites, DB } = H;
    const ev = (DB.gap_evidence || []).slice().sort((a, b) => a.order - b.order);
    const sec = (key) => ev.filter((e) => e.section === key).map((e) => `<li>
        <h4>${esc(e.headline)}</h4>
        <p>${esc(e.detail)}</p>
        <div class="claim-meta">${badge(e.evidence_tier)}${e.armed_group ? `<span>Armed group: ${esc(e.armed_group)}</span>` : ""}</div>
        ${e.method ? `<div class="small muted">How: ${esc(e.method)}</div>` : ""}
        <div class="cite">${cites(e.source_ids, e.paragraph_or_page)}</div></li>`).join("");
    document.getElementById("gap-evidence").innerHTML = `
      <h2 class="section-h">So who fills the gap?</h2>
      <p class="lede">The short answer from the evidence: in timing and size, the extra coltan and tin ore match minerals from armed-group-held mines in eastern Congo — PARECO-FF's Rubaya before April 2024, M23's since. But no source has measured exactly how much of the gap each group accounts for, and Rwanda disputes the premise.</p>
      <div class="ev-cols">
        <section><h3>What investigators found</h3><ul class="evidence-list">${sec("origin")}</ul></section>
        <section><h3>What the trade records show</h3><ul class="evidence-list">${sec("trade")}</ul>
          <h3 style="margin-top:20px">Other explanations, and Rwanda's position</h3><ul class="evidence-list">${sec("alternative")}</ul></section>
      </div>`;
  }

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (drawn) { drawn = false; window.drawGap(); } }, 200);
  });
})();
