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
    const rows = GAP.rows;
    const r24 = rows.find((r) => r.year === 2024);
    const b = GAP.baseline_share_pct_2018_2022;
    const un = GAP.rubaya_2024;
    const el = document.getElementById("laundering");
    el.innerHTML = `
      <div class="gap-headline">
        <div class="hero-num"><span class="num">${fmt(r24.excess_vs_geology_t)} t</span>
          <span class="lbl">more coltan exported by Rwanda in 2024 than its tin output predicts</span></div>
        <div class="hero-num"><span class="num">${fmt(un.low)}–${fmt(un.high)} t</span>
          <span class="lbl">UN estimate of Rubaya coltan under M23 control or smuggled to Rwanda, May–Dec 2024</span></div>
        <div class="hero-badge">${badge("inferred")}<span class="small muted">Our calculation. It shows the exports need explaining; it does not prove where the extra coltan came from.</span></div>
      </div>

      <h3 class="chart-title">Rwanda's coltan exports vs what its geology predicts</h3>
      <p class="chart-sub">Tonnes of concentrate a year. In this region's mixed deposits coltan is about a quarter of combined coltan and tin-ore output, so Rwanda's tin-ore exports predict roughly how much coltan it should export. From 2018 to 2022 the two tracked closely (coltan was ${b[0]}–${b[1]}% of the total). From 2023, with Rubaya in armed-group hands, they separate.</p>
      <div class="legend-row" aria-hidden="true">
        <span><i class="sw s1"></i>Coltan exports reported by Rwanda</span>
        <span><i class="sw s2"></i>Coltan expected from tin-ore exports</span>
        <span><i class="sw hatch"></i>Excess</span>
      </div>
      <div id="gap-line" class="chart" role="img" aria-label="Line chart: reported coltan exports and expected coltan, 2018 to 2025. The lines track until 2022, then reported exports exceed expected by 763 tonnes in 2023 and ${fmt(r24.excess_vs_geology_t)} tonnes in 2024."></div>

      <h3 class="chart-title">The excess, year by year, against the UN's Rubaya estimate</h3>
      <p class="chart-sub">Excess = reported coltan exports minus expected. The shaded band on 2024 is the UN Group of Experts' estimate of Rubaya coltan under M23 control (120 t a month) or smuggled to Rwanda (150 t a month), over the eight months M23 held Rubaya that year.</p>
      <div id="gap-bars" class="chart" role="img" aria-label="Bar chart of excess coltan exports by year; 2024 excess sits inside the UN Rubaya estimate band."></div>

      <h3 class="chart-title">Who ships Rwanda's coltan, quarter by quarter</h3>
      <p class="chart-sub">Tonnes of coltan leaving Rwanda in Sayari's customs records (mostly Tanzanian transit records, so partial). Blue is the seven exporters Global Witness found buying Rubaya conflict coltan; orange is everyone else. When ITSCI suspended several of the seven in 2025, total volume held steady while other exporters' share grew.</p>
      <div class="legend-row" aria-hidden="true">
        <span><i class="sw s1 block"></i>Seven exporters named by Global Witness</span>
        <span><i class="sw s2 block"></i>Other exporters</span>
        <span><i class="sw band"></i>ITSCI suspensions (Mar–Nov 2025)</span>
      </div>
      <div id="gap-quarters" class="chart" role="img" aria-label="Stacked bar chart of coltan export weight by quarter, 2023 to mid-2026, split between seven Global Witness-named exporters and other exporters. The named exporters' share falls during the 2025 ITSCI suspensions while total volume holds steady."></div>
      <p class="small muted">Sayari customs records, mostly Tanzanian transit data; ${badge("documented")} for the shipments, ${badge("inferred")} for reading the shift as one set of exporters replacing another. Jan–Aug 2024 is missing from the data. Four of the seven company matches are low confidence.</p>

      <details class="table-view"><summary>Show the numbers as a table</summary>
        <table><thead><tr><th>Year</th><th>Coltan exports (t)</th><th>Tin-ore exports (t)</th><th>Coltan share</th><th>Expected coltan (t)</th><th>Excess (t)</th><th>USGS estimate (t)</th><th>Partner-reported imports (t)</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r.year}</td><td>${fmt(r.coltan_exports_t)}</td><td>${fmt(r.cassiterite_exports_t)}</td><td>${r.coltan_share_pct}%</td><td>${fmt(r.expected_coltan_t)}</td><td><strong>${fmt(r.excess_vs_geology_t)}</strong></td><td>${fmt(r.usgs_production_estimate_t)}</td><td>${fmt(r.coltan_exports_mirror_t)}</td></tr>`).join("")}</tbody></table>
        <p class="small muted">Sources: ${cites([...new Set(rows.flatMap((r) => r.source_ids))])}</p>
      </details>

      <div class="method">
        <h3>How this is calculated</h3>
        <p>${esc(GAP.method)} USGS's own estimate gives a similar answer: it held Rwanda's coltan output at 1,300 t in 2023 and 2024 while exports rose, an excess of ${fmt(rows.find((r) => r.year === 2023).excess_vs_usgs_t)} t and ${fmt(r24.excess_vs_usgs_t)} t.</p>
        <ul>${GAP.caveats.map((c) => `<li>${esc(c)}</li>`).join("")}<li>${esc(un.note)}</li></ul>
      </div>

      <div id="gap-evidence"></div>`;
    renderEvidence();
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
    const top = rows.map((r) => `${x(r.year)},${y(Math.max(r.coltan_exports_t, r.expected_coltan_t))}`);
    const bot = rows.slice().reverse().map((r) => `${x(r.year)},${y(r.expected_coltan_t)}`);
    f.svg.appendChild(svgEl("polygon", { points: top.concat(bot).join(" "), fill: "url(#hatch)", class: "excess" }));

    const line = (key, cls) => {
      const d = rows.map((r, i) => `${i ? "L" : "M"}${x(r.year)},${y(r[key])}`).join("");
      f.svg.appendChild(svgEl("path", { d, class: "line " + cls }));
      rows.forEach((r) => f.svg.appendChild(svgEl("circle", { cx: x(r.year), cy: y(r[key]), r: 4, class: "dot " + cls })));
    };
    line("expected_coltan_t", "s2");
    line("coltan_exports_t", "s1");

    // direct labels at the right end
    const last = rows[rows.length - 1];
    if (f.m.r > 60) {
      [["coltan_exports_t", "Reported exports"], ["expected_coltan_t", "Expected from tin ore"]].forEach(([k, lab]) => {
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
        <div><i class="sw s2"></i>Expected ${fmt(r.expected_coltan_t)} t</div><div>Excess <strong>${fmt(r.excess_vs_geology_t)} t</strong> · coltan ${r.coltan_share_pct}% of total</div>`,
        x(r.year), y(r.coltan_exports_t));
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => { f.tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
  }

  // ---------- chart 2: excess bars + UN band ----------
  function barChart(host) {
    const rows = GAP.rows, un = GAP.rubaya_2024;
    const f = frame(host, 260);
    const max = 1400, n = rows.length;
    const band = f.iw / n, bw = Math.min(46, band * 0.6);
    const x = (i) => f.m.l + band * i + band / 2;
    const y = (v) => f.m.t + f.ih - (Math.max(v, 0) / max) * f.ih;
    yAxis(f, max, 200);

    const i24 = rows.findIndex((r) => r.year === 2024);
    if (i24 >= 0) {
      f.svg.appendChild(svgEl("rect", { x: x(i24) - band / 2 + 4, width: band - 8, y: y(un.high), height: y(un.low) - y(un.high), class: "un-band" }));
      if (f.m.r > 60) {
        const t = svgEl("text", { x: f.m.l + f.iw + 10, y: y((un.low + un.high) / 2) + 4, class: "direct" });
        t.textContent = "UN Rubaya estimate"; f.svg.appendChild(t);
      }
    }
    rows.forEach((r, i) => {
      const h = f.m.t + f.ih - y(r.excess_vs_geology_t);
      const top = y(r.excess_vs_geology_t), r0 = Math.min(4, h);
      const d = `M${x(i) - bw / 2},${f.m.t + f.ih} V${top + r0} q0,-${r0} ${r0},-${r0} H${x(i) + bw / 2 - r0} q${r0},0 ${r0},${r0} V${f.m.t + f.ih} Z`;
      const bar = svgEl("path", { d, class: "bar" + (r.year >= 2023 ? " hi" : "") });
      f.svg.appendChild(bar);
      const labY = r.year === 2024 ? Math.min(top, y(un.high)) - 6 : top - 6;  // clear the UN band
      const lab = svgEl("text", { x: x(i), y: labY, class: "bar-val", "text-anchor": "middle" });
      lab.textContent = fmt(r.excess_vs_geology_t); f.svg.appendChild(lab);
      const yt = svgEl("text", { x: x(i), y: f.H - 8, class: "tick", "text-anchor": "middle" });
      yt.textContent = r.year; f.svg.appendChild(yt);
      const hit = svgEl("rect", { x: x(i) - band / 2, y: f.m.t, width: band, height: f.ih, fill: "transparent" });
      hit.addEventListener("pointermove", () => showTip(f, `<strong>${r.year}</strong><div>Excess ${fmt(r.excess_vs_geology_t)} t</div>
        ${r.year === 2024 ? `<div>UN Rubaya estimate ${fmt(un.low)}–${fmt(un.high)} t</div>` : ""}
        ${r.excess_vs_usgs_t != null ? `<div>vs USGS estimate: ${fmt(r.excess_vs_usgs_t)} t</div>` : ""}`, x(i), top));
      hit.addEventListener("pointerleave", () => (f.tip.hidden = true));
      f.svg.appendChild(hit);
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
