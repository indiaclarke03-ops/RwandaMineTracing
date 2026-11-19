// The Story: a scrolling narrative. Each step swaps the sticky "stage" visual. Every number comes from /data with its source.
"use strict";

(function () {
  const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});
  let G, built = false, current = null, smap = null, smapReady = false, ipis = [], areaData = null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  VIEWS.home = {
    build() { G = window.GC; },
    show() { if (!built) build(); },
  };

  // ---------- data helpers ----------
  const fact = (key) => (G.DB.story_facts || []).find((f) => f.id === key);
  const num = (n) => (n == null ? "–" : Number(n).toLocaleString("en-GB"));
  const shortCite = (ids) => short(ids);
  const short = (ids) => (ids || []).map((id) => G.byId.sources[id]).filter(Boolean)
    .map((s) => `<a href="${G.esc(s.url)}" target="_blank" rel="noopener">${G.esc(s.publisher.replace(/ \(.*\)$/, ""))}${s.published_date ? ", " + G.esc(G.fmtDate(s.published_date)) : ""}</a>`).join("; ");
  const src = (ids) => `<span class="st-src">Source: ${short(ids)}</span>`;
  const factHtml = (key, fmt) => {
    const f = fact(key);
    if (!f) return `<span class="muted">not yet sourced</span>`;
    return `${fmt ? fmt(f) : `${num(f.value)}${f.unit ? " " + G.esc(f.unit) : ""}`}`;
  };
  const factSrc = (...keys) => src([...new Set(keys.map(fact).filter(Boolean).flatMap((f) => f.source_ids))]);

  // ---------- the steps ----------
  function steps() {
    const DB = G.DB;
    const rev = DB.impacts.find((i) => i.id === "imp_rubaya_revenue");
    const smug = DB.impacts.find((i) => i.id === "imp_rubaya_smuggled");
    const deaths = DB.impacts.filter((i) => i.type === "deaths");
    const eff = DB.effectiveness;
    const verdicts = ["didn't move", "moved", "too early", "no data"].map((v) => [v, eff.filter((e) => e.verdict === v).length]);
    const strong = DB.company_assessments.filter((c) => c.link === "strong" || c.link === "moderate").length;
    return [
      { ch: 1, chTitle: "What's inside", stage: "products", html: `
        <h2>Every phone carries a few specks of conflict-risk metal</h2>
        <p>Three metals mined in eastern Congo are in almost everything with a circuit board. <strong>Tantalum</strong> makes tiny, reliable capacitors that store charge. <strong>Tin</strong> is the solder that holds every component in place. <strong>Gold</strong> plates connectors because it doesn't corrode.</p>
        <p>Pick a product on the right to see where each metal sits and roughly how much is in it.</p>` },
      { ch: 1, stage: "uses", html: `
        <h2>Most tantalum goes into electronics, most gold into jewellery</h2>
        <p>The amounts in one device are tiny. The total isn't: these metals are used by the tonne across electronics, cars, aircraft engines, medical devices and jewellery.</p>
        <p class="small muted">Shares of world demand by use, from industry and government sources.</p>` },
      { ch: 2, chTitle: "Where it comes from", stage: "shares", html: `
        <h2>Congo and Rwanda mine a large share of the world's tantalum</h2>
        <p>Congo and Rwanda together account for ${factHtml("ta_cod_rwa_share", (f) => `<strong>about ${num(f.value)}%</strong>`)} of the world's mined tantalum, against about ${factHtml("sn_cod_rwa_share", (f) => num(f.value) + "%")} of tin and under 1% of gold. ${factSrc("ta_cod_rwa_share", "sn_cod_rwa_share")}</p>
        <p class="small">Rwanda's official figure is worked out from what it exports, so it already includes ore smuggled in from Congo. That's the first sign the numbers don't add up.</p>
        <p>One mining area matters most. <strong>Rubaya</strong>, in North Kivu, supplies ${factHtml("rubaya_share", (f) => `about ${num(f.value)}%`)} of world tantalum on its own. ${factSrc("rubaya_share")}</p>
        <p>Tantalum is hard to replace. Capacitors for airbags, ABS brakes and satellites still rely on it, and less than 1% is recycled, so new supply keeps coming from mines.</p>${factSrc("ta_recycled")}` },
      { ch: 3, chTitle: "Who controls the mines", stage: "map:all", html: `
        <h2>Thousands of hand-dug mines</h2>
        <p>Researchers have surveyed ${num(3469)} artisanal mining sites in eastern Congo since 2009. Each dot is one. Most are worked by hand.</p>
        ${src(["src_ipis_asm"])}` },
      { ch: 3, stage: "map:armed", html: `
        <h2>Many are run by armed groups</h2>
        <p>Dark red sites are in areas that a UN, NGO or government source says an armed group held at the latest date. Purple sites are contested. Orange sites had an armed group present when researchers last visited.</p>
        <p class="small muted">Grey does not mean safe: for most sites there is no recent information.</p>` },
      { ch: 3, stage: "map:rubaya", html: `
        <h2>Rubaya: under M23 since 30 April 2024</h2>
        <p>The M23 armed group took the Rubaya mines in April 2024. UN investigators say it taxes production, controls who can buy and runs the routes into Rwanda, collecting at least <strong>US$${num(rev?.value)}</strong> a month in 2024. Before M23, another armed group, PARECO-FF, held the same mines.</p>
        ${src(rev?.source_ids || [], rev?.paragraph_or_page)}` },
      { ch: 4, chTitle: "The people who dig", stage: "hr", hr: "forced_labour", html: `
        <h2>Forced to dig</h2>
        <div id="hr-forced_labour" class="hr-facts"></div>` },
      { ch: 4, stage: "hr", hr: "child_labour", html: `
        <h2>Children in the pits</h2>
        <div id="hr-child_labour" class="hr-facts"></div>` },
      { ch: 4, stage: "hr", hr: "violence", html: `
        <h2>Killings, torture and sexual violence</h2>
        <div id="hr-violence" class="hr-facts"></div>` },
      { ch: 4, stage: "hr", hr: "extortion", html: `
        <h2>Taxed at every step, and barely paid</h2>
        <div id="hr-extortion" class="hr-facts"></div>` },
      { ch: 4, stage: "hr", hr: "unsafe_conditions", html: `
        <h2>When the hillside gives way</h2>
        <p>In January 2026 a landslide at Rubaya killed more than 200 people, with some counts over 400. In March a second collapse killed more than 200, about 70 of them children. The US Treasury says civilians in M23-held mining areas face forced labour and dangerous conditions.</p>
        ${src([...new Set(deaths.flatMap((d) => d.source_ids).concat(["src_treasury_sb0668"]))])}
        <div id="hr-unsafe_conditions" class="hr-facts"></div>` },
      { ch: 4, stage: "hr", hr: "displacement", html: `
        <h2>Driven from home</h2>
        <div id="hr-displacement" class="hr-facts"></div>
        <p class="small muted">Abuses are not only by M23. Sources also document abuses by the Congolese army, allied Wazalendo militias and other groups, shown here alongside.</p>` },
      { ch: 5, chTitle: "How it reaches you", stage: "flow", html: `
        <h2>Across the border, into the supply chain</h2>
        <p>UN investigators estimate about <strong>${num(smug?.value)} t a month</strong> of Rubaya coltan was smuggled into Rwanda in 2024. There it is mixed with Rwandan ore and exported as Rwandan.</p>
        <p>Watch it move: exporters in Kigali, traders in the UAE, smelters mostly in China, then capacitor makers, then the products in our homes.</p>
        ${src(smug?.source_ids || [], smug?.paragraph_or_page)}` },
      { ch: 5, stage: "flow2", html: `
        <h2>By the time it reaches a brand, the origin is invisible</h2>
        <p>Each step adds paperwork and removes traceability. All eight smelters that processed most of Rwanda's coltan passed industry audits. ${num(new Set(DB.smelter_brand.map((x) => x.brand_actor)).size)} major companies list them as possible sources. No filing says a company received conflict minerals, and customs records never show where ore was mined.</p>` },
      { ch: 6, chTitle: "The numbers don't add up", stage: "balance", html: `
        <h2>Rwanda exports more coltan than its own mines can explain</h2>
        <p>Until 2022 Rwanda's coltan exports tracked what its geology predicts. From 2023 they pulled away, by about 1,000 t a year. Over the same years, official output in Congo's Kivu provinces fell by a similar amount.</p>
        <p>Our central estimate is that more than half of Rwanda's extra coltan could come from armed-group-held areas. No source has measured it exactly, and Rwanda denies laundering.</p>
        <a class="more" href="#view=laundering">See the full balance →</a>` },
      { ch: 7, chTitle: "Has anything worked?", stage: "response", html: `
        <h2>So far, no sign that sanctions have slowed the trade</h2>
        <p>Since 2024 governments and industry have taken ${num(DB.responses.length)} recorded actions: sanctions on Rwanda's army, its gold refinery and a military bank, suspensions of exporters, and a peace deal. Of the indicators we track, ${verdicts[0][1]} didn't move, ${verdicts[1][1]} moved, and the rest are too early to tell or have no data.</p>
        <p>The ${strong} unsanctioned exporters and traders with moderate or strong evidence against them have not been sanctioned.</p>
        <a class="more" href="#view=responses">See every response →</a>` },
    ];
  }

  // ---------- build ----------
  async function build() {
    built = true;
    const S = steps();
    const host = document.getElementById("story-steps");
    let lastCh = 0;
    host.innerHTML = S.map((s, i) => {
      const head = s.ch !== lastCh ? `<div class="ch-head" id="chapter-${s.ch}"><span>Chapter ${s.ch}</span>${G.esc(s.chTitle)}</div>` : "";
      lastCh = s.ch;
      return `${head}<article class="sstep" data-i="${i}">${s.html}</article>`;
    }).join("");
    renderHr();
    window.annotateTerms?.(host);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) activate(S, +e.target.dataset.i);
    }, { rootMargin: "-45% 0px -45% 0px" });
    host.querySelectorAll(".sstep").forEach((el) => io.observe(el));
    document.querySelectorAll("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); document.getElementById("chapter-1").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }));
    activate(S, 0);
    // Data for the map stage loads in the background.
    for (const base of ["data/", "../data/"]) {
      try {
        const [a, b] = await Promise.all([fetch(base + "ipis_sites.json"), fetch(base + "area_control.json")]);
        if (a.ok && b.ok) { ipis = await a.json(); areaData = await b.json(); break; }
      } catch (e) { /* next */ }
    }
  }

  function activate(S, i) {
    document.querySelectorAll("#story-steps .sstep").forEach((el) => el.classList.toggle("on", +el.dataset.i === i));
    const s = S[i];
    const key = s.stage + (s.hr ? ":" + s.hr : "");
    if (key === current) return;
    current = key;
    const stage = document.getElementById("stage-inner");
    const [kind, arg] = s.stage.split(":");
    if (kind === "map") return showMap(arg);
    document.querySelector(".stage").classList.remove("is-map");
    document.getElementById("stage-map").hidden = true;
    stage.hidden = false;
    stage.classList.remove("fade-in"); void stage.offsetWidth; stage.classList.add("fade-in");
    stage.innerHTML = { products: stageProducts, uses: stageUses, shares: stageShares, hr: () => stageHr(s.hr), flow: () => stageFlow(false), flow2: () => stageFlow(true), balance: stageBalance, response: stageResponse }[kind]();
    if (kind === "products") wireProducts();
  }

  // ---------- stage: products ----------
  const PRODUCTS = [
    { id: "phone", label: "Smartphone", svg: '<rect x="70" y="14" width="100" height="192" rx="16"/><rect x="80" y="34" width="80" height="140" rx="4" class="screen"/><circle cx="120" cy="190" r="7"/>',
      spots: [{ m: "tantalum", x: 98, y: 70 }, { m: "tin", x: 140, y: 110 }, { m: "gold", x: 112, y: 150 }] },
    { id: "laptop", label: "Laptop", svg: '<rect x="40" y="40" width="160" height="104" rx="6"/><rect x="50" y="50" width="140" height="84" class="screen"/><path d="M20 154 H220 L206 170 H34 Z"/>',
      spots: [{ m: "tantalum", x: 82, y: 92 }, { m: "tin", x: 158, y: 92 }, { m: "gold", x: 120, y: 162 }] },
    { id: "car", label: "Car", svg: '<path d="M20 140 Q24 110 60 104 L86 76 Q96 66 112 66 H156 Q172 66 182 78 L202 104 Q222 108 222 132 V148 H20 Z"/><circle cx="66" cy="150" r="18" class="wheel"/><circle cx="178" cy="150" r="18" class="wheel"/>',
      spots: [{ m: "tantalum", x: 140, y: 96 }, { m: "tin", x: 100, y: 124 }, { m: "gold", x: 180, y: 120 }] },
    { id: "aircraft", label: "Jet engine", svg: '<ellipse cx="120" cy="110" rx="96" ry="44"/><ellipse cx="44" cy="110" rx="18" ry="40" class="screen"/><path d="M60 80 L200 92 M60 140 L200 128"/>',
      spots: [{ m: "tantalum", x: 120, y: 104 }, { m: "tin", x: 170, y: 118 }] },
    { id: "jewellery", label: "Jewellery", svg: '<circle cx="120" cy="120" r="58" class="ring"/><circle cx="120" cy="120" r="40" class="hole"/><path d="M104 56 L120 32 L136 56 Z"/>',
      spots: [{ m: "gold", x: 120, y: 66 }] },
  ];
  const METAL = { tantalum: ["Tantalum", "--m1", "capacitors"], tin: ["Tin", "--m3", "solder"], gold: ["Gold", "--m2", "contacts and plating"] };

  function stageProducts() {
    return `<div class="prod">
      <div class="prod-tabs" role="tablist">${PRODUCTS.map((p, i) => `<button type="button" role="tab" data-p="${p.id}" aria-selected="${i === 0}">${p.label}</button>`).join("")}</div>
      <div class="prod-body" id="prod-body"></div></div>`;
  }
  function wireProducts() {
    const body = document.getElementById("prod-body");
    const show = (id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      const uses = (G.DB.end_uses || []).filter((u) => (u.products || []).includes(id)).sort((a, b) => (b.share_pct || 0) - (a.share_pct || 0));
      const content = (G.DB.product_content || []).filter((c) => c.product === id);
      const amount = (c) => c.value_low == null ? `<span class="muted">no reliable public figure</span>` : `<span class="amt">${c.value_high != null && c.value_high !== c.value_low ? num(c.value_low) + "–" + num(c.value_high) : num(c.value_low)} ${G.esc(c.unit || "")}</span>`;
      document.querySelectorAll(".prod-tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.p === id));
      body.innerHTML = `<svg viewBox="0 0 240 220" class="prod-svg" role="img" aria-label="${p.label} with the metals it contains marked">${p.svg}
          ${p.spots.map((s) => `<g class="spot" style="--c:var(${METAL[s.m][1]})"><circle cx="${s.x}" cy="${s.y}" r="9"/><circle cx="${s.x}" cy="${s.y}" r="9" class="pulse"/></g>`).join("")}</svg>
        <ul class="prod-list">${[...new Set(p.spots.map((s) => s.m))].map((m) => {
          const cs = content.filter((x) => x.metal === m), u = uses.find((x) => x.metal === m);
          return `<li style="--c:var(${METAL[m][1]})"><i></i><div><strong>${METAL[m][0]}</strong>
            <div class="small">${G.esc(u?.what_it_does || "Used in " + METAL[m][2] + ".")}</div>
            ${cs.map((c) => `<div class="small">${c.value_low == null ? `<span class="muted">No reliable public figure for one device</span>` : `${amount(c)} <span class="muted">${G.esc(c.what_it_measures.split(/[.;(]/)[0])}</span>`}</div>`).join("")}
            ${cs.length || u ? `<div class="st-src">Source: ${shortCite([...cs.flatMap((c) => c.source_ids), ...(u?.source_ids || [])].filter((v, i, a) => a.indexOf(v) === i))}</div>` : ""}</div></li>`;
        }).join("")}</ul>`;
    };
    document.querySelectorAll(".prod-tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.p)));
    show("phone");
  }

  // ---------- stage: end uses ----------
  function stageUses() {
    const uses = G.DB.end_uses || [];
    if (!uses.length) return `<p class="muted">End-use data loading.</p>`;
    const by = (m) => {
      const r = uses.filter((u) => u.metal === m && u.share_pct != null).sort((a, b) => b.share_pct - a.share_pct);
      const top = r.slice(0, 5), rest = r.slice(5).reduce((s, u) => s + u.share_pct, 0);
      return rest ? top.concat([{ use: "other uses", share_pct: Math.round(rest), source_ids: [] }]) : top;
    };
    return `<div class="uses">${["tantalum", "tin", "gold"].map((m) => `<div class="use-col"><h3 style="--c:var(${METAL[m][1]})"><i></i>${METAL[m][0]}</h3>
        <div class="use-stack">${by(m).map((u) => `<div class="use-seg" style="flex:${u.share_pct};--c:var(${METAL[m][1]})" title="${G.esc(u.use)}: ${u.share_pct}%"><span>${G.esc(u.use)}</span><b>${u.share_pct}%</b></div>`).join("")}</div>
        <div class="st-src">Source: ${shortCite([...new Set(by(m).flatMap((u) => u.source_ids))])}</div></div>`).join("")}</div>`;
  }

  // ---------- stage: world shares ----------
  function stageShares() {
    const rows = ["tantalum", "tin", "gold"].map((m) => [m, fact(m.slice(0, 2) === "ta" ? "ta_cod_rwa_share" : m === "tin" ? "sn_cod_rwa_share" : "au_cod_rwa_share")]);
    const ru = fact("rubaya_share");
    return `<div class="shares"><h3>Share of world mine production from Congo and Rwanda</h3>
      ${rows.map(([m, f]) => `<div class="sh-row"><span class="sh-lab">${METAL[m][0]}</span>
        <span class="sh-bar"><i style="width:${f ? f.value : 0}%;--c:var(${METAL[m][1]})"></i>${m === "tantalum" && ru ? `<em style="width:${ru.value}%">Rubaya ~${num(ru.value)}%</em>` : ""}</span>
        <span class="sh-val">${f ? num(f.value) + "%" : "–"}</span></div>`).join("")}
      <div class="waffle" aria-label="100 squares; coloured squares show the Congo and Rwanda share of world tantalum">${(() => { const f = rows[0][1]; const n = f ? Math.round(f.value) : 0; return Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? "on" : ""}${ru && i < Math.round(ru.value) ? " ru" : ""}"></i>`).join(""); })()}</div>
      <p class="small muted">Each square is 1% of world tantalum. Dark squares: Rubaya alone.</p>
      <div class="st-src">${shortCite([...new Set(rows.flatMap(([, f]) => f?.source_ids || []).concat(ru?.source_ids || []))])}</div></div>`;
  }

  // ---------- stage: human rights ----------
  const HR = {
    forced_labour: { icon: "⛓", label: "Forced labour" }, child_labour: { icon: "◐", label: "Child labour" },
    violence: { icon: "✕", label: "Killings, torture, sexual violence", cats: ["killings", "sexual_violence", "forced_recruitment"] },
    extortion: { icon: "$", label: "Extortion and pay" },
    unsafe_conditions: { icon: "▼", label: "Deaths from collapses" }, displacement: { icon: "⇢", label: "Displacement" },
  };
  const hrFacts = (k) => (G.DB.hr_facts || []).filter((f) => (HR[k].cats || [k]).includes(f.category));
  function stageHr(k) {
    const cats = HR[k].cats || [k];
    const heads = (G.DB.hr_headlines || []).filter((h) => cats.includes(h.category));
    return `<div class="hr-stage"><h3>Abuses recorded in and around the mines</h3>
      <div class="hr-grid">${Object.entries(HR).map(([key, h]) => {
        const n = hrFacts(key).length;
        return `<div class="hr-cell${key === k ? " on" : ""}"><span class="hr-ic" aria-hidden="true">${h.icon}</span><strong>${h.label}</strong><span class="muted small">${n} sourced record${n === 1 ? "" : "s"}</span></div>`;
      }).join("")}</div>
      ${heads.length ? `<div class="hr-heads">${heads.map((h) => `<div class="hr-head"><span class="num">${h.unit === "US$" || h.unit === "US$/kg" ? "$" : ""}${num(h.value)}${h.unit === "%" ? "%" : h.unit === "US$/kg" ? "/kg" : ""}</span><span class="lbl">${G.esc(h.label)}</span><span class="st-src">${G.badge(h.evidence_tier)} ${shortCite(h.source_ids)}</span></div>`).join("")}</div>` : ""}
      <p class="small muted">Records include abuses by M23, the Congolese army, Wazalendo militias and others. No victims are named.</p></div>`;
  }
  function renderHr() {
    for (const k of Object.keys(HR)) {
      const el = document.getElementById("hr-" + k);
      if (!el) continue;
      const all = hrFacts(k).sort((a, b) => (b.site_hint ? 1 : 0) - (a.site_hint ? 1 : 0));
      const fs = all.slice(0, 3);
      const other = all.find((f) => !/M23/.test(f.perpetrator) && f.perpetrator !== "n/a" && !fs.includes(f));
      if (other) fs.push(other);
      el.innerHTML = fs.length ? fs.map((f) => `<div class="hr-fact"><p>${G.esc(f.summary)}</p>
        <div class="claim-meta">${G.badge(f.evidence_tier)}<span>${G.esc([f.place, f.date_or_period].filter(Boolean).join(" · "))}</span>${f.perpetrator && !/^n\/a/.test(f.perpetrator) ? `<span class="perp">${G.esc(f.perpetrator)}</span>` : ""}</div>
        <div class="st-src">Source: ${shortCite(f.source_ids)}</div>${G.denialsFor(f.id)}</div>`).join("") : `<p class="muted small">Sourced records are being added.</p>`;
    }
  }

  // ---------- stage: flow ----------
  function stageFlow(late) {
    const N = [
      ["Rubaya mines", "M23-held", "120–150 t coltan a month (2024)"],
      ["Rwandan exporters", "Kigali", "mixed with Rwandan ore"],
      ["Traders", "mostly UAE-based", "64% of coltan rows (2026)"],
      ["Smelters", "mostly in China", "China took 79% of Rwanda's coltan (2024)"],
      ["Component makers", "capacitors, solder,", "plating"],
      ["Products", "phones, laptops,", "cars, aircraft"],
    ];
    const W = 420, H = 560, x = 40, gap = (H - 70) / (N.length - 1);
    const path = `M${x},30 ` + N.slice(1).map((_, i) => `L${x},${30 + gap * (i + 1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" class="flow-svg" role="img" aria-label="Flow from Rubaya through Rwandan exporters, traders, smelters and component makers to everyday products">
      <path d="${path}" class="flow-line"/>
      ${reduce ? "" : Array.from({ length: 6 }, (_, i) => `<circle r="5" class="flow-dot"><animateMotion dur="6s" begin="${i}s" repeatCount="indefinite" path="${path}"/></circle>`).join("")}
      ${N.map(([t, a, b], i) => `<g transform="translate(${x},${30 + gap * i})"><circle r="11" class="flow-node${i === 0 ? " src" : ""}${late && i > 2 ? " fog" : ""}"/>
        <text x="24" y="-4" class="flow-t">${G.esc(t)}</text><text x="24" y="14" class="flow-s">${G.esc(a)}</text><text x="24" y="30" class="flow-s">${G.esc(b)}</text></g>`).join("")}
      ${late ? `<rect x="${x - 30}" y="${30 + gap * 2.55}" width="${W - x + 20}" height="${gap * 3}" class="flow-fog"/><text x="${x + 24}" y="${30 + gap * 2.55 + 18}" class="flow-s fogtxt">Origin no longer visible in records</text>` : ""}
    </svg><div class="st-src">Source: ${short(["src_un_goe_s2024_969", "src_sayari", "src_comtrade_preview"])}</div>`;
  }

  // ---------- stage: balance ----------
  function stageBalance() {
    const B = (window.GC_GAP?.bridge || []).filter((b) => b.mineral === "coltan" && !b.variant);
    if (!B.length) return `<p class="muted">Loading the balance.</p>`;
    const max = 1600;
    return `<div class="bal"><h3>Coltan: Rwanda's excess vs the fall in official Kivu output (tonnes)</h3>
      <div class="bal-bars">${B.map((b) => `<div class="bal-yr"><div class="bal-pair">
        <i class="s1" style="height:${(b.rwanda_excess_t / max) * 100}%"><b>${num(b.rwanda_excess_t)}</b></i>
        <i class="s2" style="height:${(b.kivu_loss_t / max) * 100}%"><b>${num(b.kivu_loss_t)}</b></i></div><span>${b.year}</span></div>`).join("")}</div>
      <div class="legend-row"><span><i class="sw s1 block"></i>Rwanda's excess</span><span><i class="sw s2 block"></i>Fall in Kivu output</span></div>
      <p class="small">${G.badge("inferred")} Our analysis of Comtrade and Congo's ministry tables.</p></div>`;
  }

  // ---------- stage: responses ----------
  function stageResponse() {
    const R = [...G.DB.responses].sort((a, b) => G.dkey(a.date).localeCompare(G.dkey(b.date))).filter((r) => G.dkey(r.date) <= G.dkey(G.DB.manifest.built));
    const V = { "didn't move": ["✕", "didn't move"], moved: ["✓", "moved"], "too early": ["…", "too early"], "no data": ["?", "no data"] };
    return `<ol class="resp-tl">${R.map((r) => {
      const e = G.DB.effectiveness.find((x) => x.response_id === r.id);
      const v = e ? V[e.verdict] : ["?", "no indicator"];
      return `<li class="v-${(e?.verdict || "none").replace(/\W/g, "")}"><span class="rt-date">${G.esc(G.fmtDate(r.date))}</span><span class="rt-ic" aria-hidden="true">${v[0]}</span><span class="rt-t">${G.esc(r.title)}<span class="rt-v">${v[1]}</span></span></li>`;
    }).join("")}</ol>`;
  }

  // ---------- stage: map ----------
  const KIVUS = [[27.0, -4.8], [30.6, -0.2]];
  function showMap(arg) {
    document.querySelector(".stage").classList.add("is-map");
    document.getElementById("stage-map").hidden = false;
    document.getElementById("stage-inner").hidden = true;
    pendingArg = arg;
    if (!smap) {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      smap = new maplibregl.Map({ container: "story-map", style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`, bounds: KIVUS,
        interactive: false, attributionControl: { compact: true } });
      smap.on("load", () => { smapReady = true; addMapData(); mapStep(pendingArg); });
    } else { smap.resize(); mapStep(arg); }
  }
  let pendingArg = "all";

  function siteStatus(s) {
    const ids = (areaData?.areas || []).filter((a) => a.site_ids.includes(s.id)).map((a) => a.id);
    const now = G.dkey(G.DB.manifest.built);
    const act = (areaData?.claims || []).filter((c) => ids.includes(c.area_id) && c.actor !== "FARDC" && (G.dkey(c.valid_from || c.observed_date) || "0") <= now && (!c.valid_to || G.dkey(c.valid_to) >= now));
    if (act.length) return act.some((c) => c.control_type === "controls" || c.control_type === "taxes") ? "held" : "contested";
    const v = [...(s.visits || [])].sort((a, b) => b.d.localeCompare(a.d))[0];
    return v && v.ag && v.ag.length ? "armed" : "other";
  }

  function addMapData() {
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const feats = ipis.map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lon, s.lat] }, properties: { st: siteStatus(s) } }));
    smap.addSource("s", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
    smap.addLayer({ id: "s", type: "circle", source: "s", layout: { "circle-sort-key": ["match", ["get", "st"], "held", 3, "contested", 2, "armed", 1, 0] },
      paint: { "circle-radius": ["match", ["get", "st"], "held", 5, "contested", 4, "armed", 3.5, 2.4],
        "circle-color": ["match", ["get", "st"], "held", css("--st-held"), "contested", css("--st-contested"), "armed", css("--st-armed"), css("--st-none")],
        "circle-stroke-width": 0.5, "circle-stroke-color": "#fff", "circle-opacity": 0.9 } });
    const line = { type: "Feature", geometry: { type: "LineString", coordinates: [[28.8819, -1.5602], [28.98, -1.5301], [29.2257, -1.6666], [29.2599, -1.6935], [30.0619, -1.9441]] } };
    smap.addSource("route", { type: "geojson", data: line });
    smap.addLayer({ id: "route", type: "line", source: "route", paint: { "line-color": css("--accent"), "line-width": 3, "line-dasharray": [2, 1.5], "line-opacity": 0 } });
    smap.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: [["Rubaya", 28.8819, -1.5602], ["Goma", 29.2257, -1.6666], ["Kigali", 30.0619, -1.9441]].map(([n, x, y]) => ({ type: "Feature", geometry: { type: "Point", coordinates: [x, y] }, properties: { n } })) } });
    smap.addLayer({ id: "pts", type: "symbol", source: "pts", layout: { "text-field": ["get", "n"], "text-font": ["Noto Sans Bold"], "text-size": 14, "text-offset": [0, -1.2] }, paint: { "text-color": css("--ink"), "text-halo-color": css("--surface"), "text-halo-width": 2, "text-opacity": 0 } });
  }

  function mapStep(arg) {
    if (!smapReady) return;
    const key = document.getElementById("sm-key");
    const fly = (o) => reduce ? smap.jumpTo(o) : smap.flyTo({ ...o, duration: 1600, essential: true });
    if (arg === "all") {
      smap.setPaintProperty("s", "circle-color", getComputedStyle(document.documentElement).getPropertyValue("--m0").trim());
      smap.fitBounds(KIVUS, { duration: reduce ? 0 : 1200 });
      smap.setPaintProperty("route", "line-opacity", 0); smap.setPaintProperty("pts", "text-opacity", 0);
      key.innerHTML = `<span><i class="st-dot st-none"></i>Surveyed mining site</span>`;
    } else {
      const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      smap.setPaintProperty("s", "circle-color", ["match", ["get", "st"], "held", css("--st-held"), "contested", css("--st-contested"), "armed", css("--st-armed"), css("--st-none")]);
      key.innerHTML = `<span><i class="st-dot st-held"></i>Armed-group-held area</span><span><i class="st-dot st-contested"></i>Contested</span><span><i class="st-dot st-armed"></i>Armed group at last visit</span><span><i class="st-dot st-none"></i>Other or unknown</span>`;
      if (arg === "armed") { smap.fitBounds(KIVUS, { duration: reduce ? 0 : 1200 }); smap.setPaintProperty("route", "line-opacity", 0); smap.setPaintProperty("pts", "text-opacity", 0); }
      if (arg === "rubaya") { smap.fitBounds([[28.6, -2.15], [30.25, -1.3]], { padding: 30, duration: reduce ? 0 : 1600 }); smap.setPaintProperty("route", "line-opacity", 0.9); smap.setPaintProperty("pts", "text-opacity", 1); }
    }
  }
})();
