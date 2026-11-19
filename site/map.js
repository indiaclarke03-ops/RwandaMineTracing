// Control map (MapLibre GL + OpenFreeMap vector basemap). Key sites from /data/sites.json,
// IPIS-surveyed mining sites from /data/ipis_sites.json when present.
"use strict";

(function () {
  const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const STYLE = `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`;
  const KIVUS = [[27.2, -4.6], [30.9, -0.4]];
  const pad = () => window.matchMedia("(max-width: 820px)").matches ? { top: 70, bottom: 110, left: 10, right: 10 } : { top: 40, bottom: 130, left: 370, right: 40 };
  const ROUTE = [[27.2, -7.2], [40.2, -0.4]];

  // Mineral groups -> validated categorical slots (see style.css --m1..--m3); everything else neutral.
  const GROUP = (minerals = []) => {
    const m = minerals.map((x) => String(x).toLowerCase());
    if (m.some((x) => /coltan|tantal|niob/.test(x))) return "coltan";
    if (m.some((x) => /cassit|tin|wolfram|tungst/.test(x))) return "tin";
    if (m.some((x) => /gold|or\b/.test(x))) return "gold";
    return "other";
  };
  const GROUPS = [["coltan", "Coltan", "--m1"], ["tin", "Tin / tungsten", "--m3"], ["gold", "Gold", "--m2"], ["other", "Other", "--m0"]];
  const cssv = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  let G, map, ready = false, fitted = false;
  let ipis = [], months = [], whenIdx = 0, playTimer = null;
  const markers = {};
  // Control status of a site at the selected date; order = strongest claim first.
  const STATUS = [
    { k: "held", label: "In an armed-group-held area", note: "A UN, NGO or government source places the area under armed-group control at this date" },
    { k: "contested", label: "Contested area", note: "Sources report fighting or changing control here at this date" },
    { k: "armed", label: "Armed group at last visit", note: "IPIS researchers recorded an armed group at the most recent visit before this date" },
    { k: "army", label: "Congolese army only", note: "FARDC present, no armed group recorded at the last visit" },
    { k: "none", label: "No armed actor at last visit", note: "The last visit recorded none. Old visits may no longer hold" },
    { k: "unknown", label: "Armed presence not recorded", note: "The last visit did not collect this" },
  ];
  const state = { minerals: new Set(GROUPS.map((g) => g[0])), status: new Set(STATUS.map((s) => s.k)), colorBy: "control", recentOnly: false, showIpis: true, showRoutes: true, selected: null };
  let areaClaims = [], areaBySite = new Map(), areas = {};

  VIEWS.map = {
    build() {
      G = window.GC;
      buildControls();
      buildTime();
      loadIpis();
    },
    show(params) {
      if (!map) initMap();
      else map.resize();
      const site = params.get && params.get("site");
      if (site) openSite(site);
    },
  };

  async function loadIpis() {
    for (const base of ["data/", "../data/"]) {
      try {
        const r = await fetch(base + "ipis_sites.json");
        if (r.ok) { ipis = await r.json(); break; }
      } catch (e) { /* next */ }
    }
    for (const base of ["data/", "../data/"]) {
      try {
        const r = await fetch(base + "area_control.json");
        if (r.ok) {
          const d = await r.json();
          areaClaims = d.claims || [];
          areas = Object.fromEntries((d.areas || []).map((a) => [a.id, a]));
          for (const a of d.areas || []) for (const id of a.site_ids || []) { if (!areaBySite.has(id)) areaBySite.set(id, []); areaBySite.get(id).push(a.id); }
          break;
        }
      } catch (e) { /* next */ }
    }
    document.getElementById("ipis-count").textContent = ipis.length ? `(${ipis.length.toLocaleString("en-GB")})` : "(not loaded yet)";
    if (!ipis.length) { document.getElementById("f-ipis").disabled = true; }
    const dl = document.getElementById("site-list");
    dl.innerHTML = G.DB.sites.concat(ipis).map((s) => `<option value="${G.esc(s.name)}">`).join("");
    if (ready) refresh();
  }

  // ---------- map ----------
  function initMap() {
    map = new maplibregl.Map({
      container: "map", style: STYLE, bounds: KIVUS, fitBoundsOptions: { padding: pad() },
      attributionControl: { compact: true, customAttribution: 'Mining sites © <a href="https://ipisresearch.be" target="_blank">IPIS</a> (ODC-BY)' },
      cooperativeGestures: false, dragRotate: false, pitchWithRotate: false,
    });
    new ResizeObserver(() => map.resize()).observe(document.getElementById("map"));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");
    map.on("load", () => {
      map.resize();
      map.fitBounds(KIVUS, { padding: pad(), duration: 0 });
      tuneBasemap();
      addLayers();
      ready = true;
      refresh();
      const h = new URLSearchParams(location.hash.slice(1));
      if (h.get("site")) openSite(h.get("site"));
    });
  }

  // Quieten the basemap so data reads first: fewer POI labels, softer roads, stronger country borders.
  function tuneBasemap() {
    for (const l of map.getStyle().layers) {
      if (/poi|airport|aeroway|highway-shield|road_shield|highway-name-path|highway-name-minor|building/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
      if (/^boundary_2$/.test(l.id)) { map.setPaintProperty(l.id, "line-width", 1.4); map.setPaintProperty(l.id, "line-color", dark ? "#8a8a84" : "#8f8b80"); }
    }
  }

  function addLayers() {
    // Routes: one layer per evidence tier (line-dasharray can't be data-driven).
    map.addSource("routes", { type: "geojson", data: routesGeo() });
    const ink = dark ? "#d8d6cf" : "#3d3b36";
    map.addLayer({ id: "routes-casing", type: "line", source: "routes", paint: { "line-color": dark ? "#1a1a19" : "#ffffff", "line-width": 5, "line-opacity": 0.7 }, layout: { "line-cap": "round" } });
    map.addLayer({ id: "routes-solid", type: "line", source: "routes", filter: ["in", ["get", "tier"], ["literal", ["designated", "documented"]]],
      paint: { "line-color": ink, "line-width": ["case", ["==", ["get", "tier"], "designated"], 3, 2], "line-opacity": 0.85 }, layout: { "line-cap": "round" } });
    map.addLayer({ id: "routes-dashed", type: "line", source: "routes", filter: ["==", ["get", "tier"], "reported"],
      paint: { "line-color": ink, "line-width": 2, "line-dasharray": [3, 2] } });
    map.addLayer({ id: "routes-dotted", type: "line", source: "routes", filter: ["==", ["get", "tier"], "inferred"],
      paint: { "line-color": ink, "line-width": 2, "line-dasharray": [0.5, 2] }, layout: { "line-cap": "round" } });

    // IPIS sites: ring when armed presence at the latest visit on or before the selected date.
    map.addSource("ipis", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    // Status is carried by size, fill and ring as well as colour. Draw weakest first so armed sites sit on top.
    const sizeAt = (held, armed, army, rest) => ["match", ["get", "st"], "held", held, "contested", armed, "armed", armed, "army", army, rest];
    map.addLayer({ id: "ipis-dots", type: "circle", source: "ipis",
      layout: { "circle-sort-key": ["match", ["get", "st"], "held", 6, "contested", 5, "armed", 4, "army", 3, "none", 2, 1] },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, sizeAt(4.5, 3.6, 2.6, 2), 9, sizeAt(7.5, 6, 4.5, 3.6), 12, sizeAt(11, 9, 7, 6)],
        "circle-color": dotColor(),
        "circle-stroke-color": ["match", ["get", "st"], "held", cssv("--st-held-ring"), "unknown", cssv("--st-unknown"), dark ? "#1a1a19" : "#ffffff"],
        "circle-stroke-width": ["match", ["get", "st"], "held", 2, "unknown", 1, 0.6],
        "circle-opacity": ["case", ["==", ["get", "old"], 1], 0.6, 1] } });
    map.addLayer({ id: "ipis-sel", type: "circle", source: "ipis", filter: ["==", ["get", "id"], ""],
      paint: { "circle-radius": 11, "circle-color": "transparent", "circle-stroke-color": dark ? "#fff" : "#111", "circle-stroke-width": 2 } });

    const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "gc-pop" });
    map.on("mousemove", "ipis-dots", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const p = e.features[0].properties;
      const stLabel = STATUS.find((x) => x.k === p.st)?.label || "";
      pop.setLngLat(e.lngLat).setHTML(`<strong>${G.esc(p.name)}</strong><div>${G.esc(p.minerals)}</div>
        <div><strong>${G.esc(stLabel)}</strong>${p.groups ? `: ${G.esc(p.groups)}` : ""}</div><div class="muted">Last visit ${G.esc(G.fmtDate(p.visit))}</div>`).addTo(map);
    });
    map.on("mouseleave", "ipis-dots", () => { map.getCanvas().style.cursor = ""; pop.remove(); });
    map.on("click", "ipis-dots", (e) => openSite(e.features[0].properties.id));
    map.on("mousemove", "routes-solid", (e) => routeTip(e, pop));
    map.on("mousemove", "routes-dotted", (e) => routeTip(e, pop));
    ["routes-solid", "routes-dotted"].forEach((l) => map.on("mouseleave", l, () => pop.remove()));

    // Key sites: HTML markers so ring style can carry the evidence tier (solid / dashed / dotted) and a label.
    for (const s of G.DB.sites) {
      if (s.lat == null) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = `kmark kind-${s.site_type}`;
      el.style.setProperty("--c", cssv({ coltan: "--m1", tin: "--m3", gold: "--m2" }[GROUP(s.minerals)] || "--m0"));
      // Hand-placed label sides: these sites sit within a few km of each other.
      const side = { site_rubaya: "left", site_mushaki: "up", site_goma: "left", site_bukavu: "left", site_gisenyi: "right" }[s.id] || "right";
      el.classList.add("lab-" + side);
      el.innerHTML = `<span class="kdot-m"></span><span class="klabel">${G.esc(s.name.replace(/ —.*/, "").replace(/ mining area/, "").replace(/ \(Kigali SEZ\)/, ""))}</span>`;
      el.setAttribute("aria-label", `${s.name}, ${s.site_type.replace("_", " ")}`);
      el.addEventListener("click", (ev) => { ev.stopPropagation(); openSite(s.id); });
      markers[s.id] = { el, m: new maplibregl.Marker({ element: el, anchor: { left: "right", up: "bottom", right: "left" }[side], offset: { left: [9, 0], up: [0, 9], right: [-9, 0] }[side] }).setLngLat([s.lon, s.lat]).addTo(map), site: s };
    }
  }

  function routeTip(e, pop) {
    map.getCanvas().style.cursor = "pointer";
    const p = e.features[0].properties;
    pop.setLngLat(e.lngLat).setHTML(`<strong>${G.esc(p.mineral)} route</strong><div>${G.esc(p.label)}</div><div class="muted">${G.esc(G.TIER[p.tier]?.label || "")} · ${G.esc(p.period || "")}</div>`).addTo(map);
  }

  function loc(id) {
    const s = G.byId.sites[id] || G.byId.sites[G.byId.actors[id]?.site_id];
    return s && s.lat != null ? [s.lon, s.lat] : null;
  }

  function routesGeo() {
    const features = [];
    for (const f of G.DB.flows) {
      const a = loc(f.from_node), b = loc(f.to_node);
      if (!a || !b || (a[0] === b[0] && a[1] === b[1])) continue;
      features.push({ type: "Feature", geometry: { type: "LineString", coordinates: arc(a, b) },
        properties: { tier: f.evidence_tier, mineral: f.mineral, period: f.period || "", label: `${G.nodeName(f.from_node)} → ${G.nodeName(f.to_node)}` } });
    }
    return { type: "FeatureCollection", features };
  }

  // Gentle curve so overlapping straight segments stay distinguishable.
  function arc(a, b) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
    const k = 0.12, cx = mx - dy * k, cy = my + dx * k, pts = [];
    for (let t = 0; t <= 1.0001; t += 0.05) pts.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]);
    return pts;
  }

  // ---------- time ----------
  function buildTime() {
    const end = new Date(G.DB.manifest.built || Date.now());
    for (let d = new Date(Date.UTC(2018, 0, 1)); d <= end; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 7));
    const input = document.getElementById("when");
    input.max = months.length - 1;
    whenIdx = months.length - 1;
    input.value = whenIdx;
    input.addEventListener("input", () => { whenIdx = +input.value; stopPlay(); refresh(); });
    document.getElementById("play").addEventListener("click", togglePlay);

    // Ticks: responses (small) and control events (tall, labelled on hover).
    const ticks = document.getElementById("ticks");
    const pct = (ym) => (months.indexOf(ym) / (months.length - 1)) * 100;
    const evts = controlEvents();
    for (const e of evts) {
      const i = months.indexOf(e.ym); if (i < 0) continue;
      const s = document.createElement("button");
      s.type = "button"; s.className = "tick-ev"; s.style.left = `calc(${pct(e.ym)}% - 5px)`;
      s.title = `${G.fmtDate(e.date)} — ${e.label}`; s.setAttribute("aria-label", s.title);
      s.addEventListener("click", () => { whenIdx = i; input.value = i; stopPlay(); refresh(); });
      ticks.appendChild(s);
    }
    for (const r of G.DB.responses) {
      const ym = String(r.date).slice(0, 7); if (months.indexOf(ym) < 0) continue;
      const s = document.createElement("span");
      s.className = "tick-resp"; s.style.left = `calc(${pct(ym)}% - 1px)`; s.title = `${G.fmtDate(r.date)} — ${r.title}`;
      ticks.appendChild(s);
    }
    const axis = document.getElementById("tb-axis");
    for (let y = 2018; y <= end.getUTCFullYear(); y++) {
      const s = document.createElement("span"); s.textContent = y; s.style.left = `${pct(`${y}-01`)}%`; axis.appendChild(s);
    }
    const legend = document.createElement("div");
    legend.className = "tb-key";
    legend.innerHTML = '<span><i class="tick-ev static"></i>control change</span><span><i class="tick-resp static"></i>sanction or other response</span>';
    axis.after(legend);
    refresh();
  }

  function controlEvents() {
    const out = [];
    for (const c of G.DB.control_claims) {
      if (!c.valid_from || c.control_type !== "controls") continue;
      const a = G.byId.actors[c.actor_id], s = G.byId.sites[c.site_id];
      out.push({ date: c.valid_from, ym: String(c.valid_from).slice(0, 7), label: `${a?.name.replace(/ \(.*/, "")} takes ${s?.name.replace(/ —.*| mining area/, "")}` });
    }
    return out;
  }

  function togglePlay() {
    if (playTimer) return stopPlay();
    if (whenIdx >= months.length - 1) whenIdx = months.indexOf("2022-01");
    document.getElementById("play").textContent = "❚❚";
    document.getElementById("play").setAttribute("aria-label", "Pause");
    playTimer = setInterval(() => {
      whenIdx++;
      document.getElementById("when").value = whenIdx;
      refresh();
      if (whenIdx >= months.length - 1) stopPlay();
    }, 260);
  }
  function stopPlay() {
    clearInterval(playTimer); playTimer = null;
    const b = document.getElementById("play"); b.textContent = "▶"; b.setAttribute("aria-label", "Play through time");
  }

  // ---------- controls ----------
  function buildControls() {
    const chips = document.getElementById("mineral-chips");
    chips.innerHTML = GROUPS.map(([k, lab, v]) => `<button type="button" class="chip" aria-pressed="true" data-g="${k}"><i style="background:var(${v})"></i>${lab}</button>`).join("");
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      on ? state.minerals.add(b.dataset.g) : state.minerals.delete(b.dataset.g);
      refresh();
    });
    document.getElementById("f-recent").addEventListener("change", (e) => { state.recentOnly = e.target.checked; refresh(); });
    document.getElementById("map-stats").addEventListener("click", (e) => {
      const b = e.target.closest("[data-st]"); if (!b) return;
      const k = b.dataset.st;
      state.status.has(k) ? state.status.delete(k) : state.status.add(k);
      refresh();
    });
    document.getElementById("color-by").addEventListener("click", (e) => {
      const b = e.target.closest("[data-color]"); if (!b) return;
      state.colorBy = b.dataset.color;
      document.querySelectorAll("#color-by [data-color]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      document.querySelector(".map-shell").dataset.color = state.colorBy;
      if (ready) { map.setPaintProperty("ipis-dots", "circle-color", dotColor()); refresh(); }
    });
    document.getElementById("f-ipis").addEventListener("change", (e) => { state.showIpis = e.target.checked; refresh(); });
    document.getElementById("f-routes").addEventListener("change", (e) => { state.showRoutes = e.target.checked; refresh(); });
    document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () =>
      map?.fitBounds(b.dataset.zoom === "route" ? ROUTE : KIVUS, { padding: pad(), duration: 800 })));
    const search = document.getElementById("site-search");
    search.addEventListener("change", () => {
      const q = search.value.trim().toLowerCase(); if (!q) return;
      const hit = G.DB.sites.concat(ipis).find((s) => s.name.toLowerCase() === q) || G.DB.sites.concat(ipis).find((s) => s.name.toLowerCase().includes(q));
      if (hit) openSite(hit.id, true);
    });
    const tog = document.querySelector(".mc-toggle");
    tog.addEventListener("click", () => {
      const open = tog.getAttribute("aria-expanded") !== "true";
      tog.setAttribute("aria-expanded", open);
      document.getElementById("mc-body").hidden = !open;
    });
    if (window.matchMedia("(max-width: 820px)").matches) { tog.setAttribute("aria-expanded", "false"); document.getElementById("mc-body").hidden = true; }
    document.querySelector(".drawer-close").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !document.getElementById("panel").hidden) closeDrawer(); });
  }


  // ---------- state -> map ----------
  function dotColor() {
    if (state.colorBy === "mineral") return ["match", ["get", "g"], "coltan", cssv("--m1"), "tin", cssv("--m3"), "gold", cssv("--m2"), cssv("--m0")];
    return ["match", ["get", "st"], "held", cssv("--st-held"), "contested", cssv("--st-contested"), "armed", cssv("--st-armed"), "army", cssv("--st-army"), "none", cssv("--st-none"), "transparent"];
  }

  // Area claims active at this date for a site, newest first. State forces alone don't count as armed-group control.
  function areaState(id, ym) {
    const key = G.dkey(ym), ids = areaBySite.get(id);
    if (!ids) return null;
    const active = areaClaims.filter((c) => ids.includes(c.area_id) && c.actor !== "FARDC" &&
      (G.dkey(c.valid_from || c.observed_date) || "0") <= key && (!c.valid_to || G.dkey(c.valid_to) >= key))
      .sort((a, b) => (G.dkey(b.valid_from || b.observed_date) || "").localeCompare(G.dkey(a.valid_from || a.observed_date) || ""));
    if (!active.length) return null;
    const t0 = active[0];
    const st = t0.control_type === "contested" ? "contested" : t0.control_type === "present" ? "armed" : "held";
    return { st, actors: [...new Set(active.filter((c) => c.control_type !== "contested").map((c) => c.actor))], claims: active };
  }

  function lastVisit(site, ym) {
    let v = null;
    for (const x of site.visits || []) if (x.d.slice(0, 7) <= ym && (!v || x.d > v.d)) v = x;
    return v;
  }

  function activeClaims(siteId, ym) {
    const t = G.dkey(ym);
    return G.DB.control_claims.filter((c) => c.site_id === siteId &&
      (G.dkey(c.valid_from || c.observed_date) || "0") <= t && (!c.valid_to || G.dkey(c.valid_to) >= t));
  }
  const ORDER = ["designated", "documented", "reported", "inferred"];
  const strongest = (cs) => cs.map((c) => c.evidence_tier).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];

  function refresh() {
    const ym = months[whenIdx];
    document.getElementById("when-label").textContent = G.fmtDate(ym);
    const ev = controlEvents().find((e) => e.ym === ym);
    document.getElementById("when-event").textContent = ev ? ev.label : "";
    if (!ready) return;

    // IPIS
    const counts = Object.fromEntries(STATUS.map((s) => [s.k, 0]));
    const feats = [];
    const oldCut = String(+ym.slice(0, 4) - 4) + ym.slice(4);
    if (state.showIpis) for (const s of ipis) {
      const g = GROUP(s.minerals);
      if (!state.minerals.has(g)) continue;
      const v = lastVisit(s, ym);
      const area = areaState(s.id, ym);
      if (!v && !area) continue;  // not yet surveyed at this date
      if (state.recentOnly && !area && v.d.slice(0, 7) < String(+ym.slice(0, 4) - 4) + ym.slice(4)) continue;
      const st = area ? area.st : !v || v.ag == null ? "unknown" : v.ag.length ? "armed" : v.fardc ? "army" : "none";
      counts[st]++;
      if (!state.status.has(st)) continue;
      const groups = area ? area.actors : v?.ag || [];
      feats.push({ type: "Feature", geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        properties: { id: s.id, name: s.name, g, st, groups: groups.join(", "), visit: v?.d || "", old: v && v.d.slice(0, 7) < oldCut ? 1 : 0, minerals: (s.minerals || []).join(", ") } });
    }
    map.getSource("ipis").setData({ type: "FeatureCollection", features: feats });

    // Key sites
    let ctrlN = 0;
    for (const { el, site } of Object.values(markers)) {
      const cs = activeClaims(site.id, ym);
      const tier = cs.length ? strongest(cs) : "";
      el.dataset.tier = tier;
      if (tier) ctrlN++;
      const mineralColor = cssv({ coltan: "--m1", tin: "--m3", gold: "--m2" }[GROUP(site.minerals)] || "--m0");
      el.style.setProperty("--c", state.colorBy === "control" ? (tier ? cssv("--st-held") : cssv("--m0")) : mineralColor);
      const g = GROUP(site.minerals);
      const hide = site.site_type === "mine" && !state.minerals.has(g);
      el.style.display = hide ? "none" : "";
      el.title = tier ? `${site.name}: ${cs.map((c) => G.byId.actors[c.actor_id]?.name.replace(/ \(.*/, "")).filter((v, i, a) => a.indexOf(v) === i).join(", ")} (${G.TIER[tier].label.toLowerCase()})` : site.name;
    }
    ["routes-casing", "routes-solid", "routes-dashed", "routes-dotted"].forEach((l) => map.setLayoutProperty(l, "visibility", state.showRoutes ? "visible" : "none"));

    const total = Object.values(counts).reduce((x, y) => x + y, 0);
    document.getElementById("map-stats").innerHTML = `
      <div class="st-head"><strong>${ctrlN}</strong> researched site${ctrlN === 1 ? "" : "s"} under armed-group control · ${total.toLocaleString("en-GB")} surveyed sites, ${G.fmtDate(ym)}</div>
      <div class="st-list">${STATUS.map((s) => `<button type="button" class="st-row" data-st="${s.k}" aria-pressed="${state.status.has(s.k)}" title="${G.esc(s.note)}">
        <i class="st-dot st-${s.k}"></i><span class="st-lab">${s.label}</span><span class="st-n">${counts[s.k].toLocaleString("en-GB")}</span></button>`).join("")}</div>`;
    if (state.selected && !document.getElementById("panel").hidden) renderPanel(state.selected);
  }

  // ---------- drawer ----------
  function openSite(id, fly) {
    const key = G.byId.sites[id], ip = !key && ipis.find((s) => s.id === id);
    if (!key && !ip) return;
    state.selected = id;
    history.replaceState(null, "", "#site=" + encodeURIComponent(id));
    Object.values(markers).forEach(({ el, site }) => el.classList.toggle("sel", site.id === id));
    if (map && ready) map.setFilter("ipis-sel", ["==", ["get", "id"], ip ? id : ""]);
    const s = key || ip;
    if (map && s.lat != null && (fly || !map.getBounds().contains([s.lon, s.lat]))) map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 9), duration: 700 });
    renderPanel(id);
    document.getElementById("panel").hidden = false;
    document.querySelector(".map-shell").classList.add("drawer-open");
  }

  function closeDrawer() {
    document.getElementById("panel").hidden = true;
    document.querySelector(".map-shell").classList.remove("drawer-open");
    state.selected = null;
    Object.values(markers).forEach(({ el }) => el.classList.remove("sel"));
    if (map && ready) map.setFilter("ipis-sel", ["==", ["get", "id"], ""]);
    history.replaceState(null, "", "#view=map");
  }

  function renderPanel(id) {
    const body = document.getElementById("panel-body");
    if (G.byId.sites[id]) body.innerHTML = keySitePanel(id);
    else body.innerHTML = ipisPanel(ipis.find((s) => s.id === id));
  }

  function areaHtml(id) {
    const { esc, fmtDate, cites, badge } = G;
    const ids = areaBySite.get(id);
    if (!ids) return "";
    const ym = months[whenIdx], now = areaState(id, ym);
    const rows = areaClaims.filter((c) => ids.includes(c.area_id)).sort((a, b) => (G.dkey(a.valid_from || a.observed_date) || "").localeCompare(G.dkey(b.valid_from || b.observed_date) || ""));
    const how = ids.map((i) => areas[i]).filter(Boolean).map((a) => a.selection === "names" ? `Named in a source for ${a.name}.` : `Our inference: within ${a.radius_km} km of the place named in the source. ${a.selection_reason || ""}`).join(" ");
    return `<div class="dr-status${now && now.st !== "armed" ? " on" : ""}">${now ? `<strong>${esc(now.actors.join(", ") || "Control contested")}</strong> ${now.st === "contested" ? "contested area" : now.st === "held" ? "holds this area" : "present in this area"} as of ${esc(fmtDate(ym))}` : `No area claim active at ${esc(fmtDate(ym))}`}</div>
      <h3>Area control history</h3><ul class="dr-timeline">${rows.map((c) => `<li>
        <div class="tl-when">${esc(fmtDate(c.valid_from || c.observed_date) || "?")} – ${c.valid_to ? esc(fmtDate(c.valid_to)) : "latest source"}</div>
        <div><strong>${esc(c.actor)}</strong> ${esc(c.control_type)}</div><div class="claim-meta">${badge(c.evidence_tier)}</div>
        <div class="small">${esc(c.summary)}</div><div class="cite">${cites(c.source_ids, c.paragraph_or_page)}</div></li>`).join("")}</ul>
      <p class="small muted">How this site was matched: ${esc(how)}</p>`;
  }

  function ipisPanel(s) {
    const { esc, fmtDate, cites, badge } = G;
    const v = [...(s.visits || [])].sort((a, b) => b.d.localeCompare(a.d));
    return `
      <div class="dr-kicker">IPIS-surveyed mining site</div>
      <h2>${esc(s.name)}</h2>
      <div class="dr-meta">${esc([(s.minerals || []).join(", "), s.territory, s.province].filter(Boolean).join(" · "))}</div>
      <div class="dr-facts">
        <div><span>Workers (last visit)</span><strong>${s.workers != null ? s.workers.toLocaleString("en-GB") : "–"}</strong></div>
        <div><span>Last visit</span><strong>${esc(fmtDate(s.last_visit))}</strong></div>
        <div><span>ITSCI tagged</span><strong>${s.itsci == null ? "–" : s.itsci ? "Yes" : "No"}</strong></div>
      </div>
      ${areaHtml(s.id)}
      <h3>Armed presence at each visit</h3>
      <table class="visits"><thead><tr><th>Visit</th><th>Armed groups</th><th>Army (FARDC)</th></tr></thead><tbody>
      ${v.map((x) => `<tr><td>${esc(fmtDate(x.d))}</td><td>${x.ag == null ? '<span class="muted">not recorded</span>' : x.ag.length ? `<span class="armed">${esc(x.ag.join(", "))}</span>` : "none"}</td><td>${x.fardc == null ? "–" : x.fardc ? "present" : "–"}</td></tr>`).join("")}
      </tbody></table>
      ${s.notes ? `<p class="small muted">${esc(s.notes)}</p>` : ""}
      <p class="small muted">IPIS records who was present when its researchers visited; control can change between visits, and IPIS data does not record M23. For M23-era control use the key sites. ${badge("documented")}</p>
      <div class="cite">${cites(s.source_ids)}</div>`;
  }

  function keySitePanel(id) {
    const { esc, fmtDate, cites, badge, denialsFor, actorLine, sayariLink, nodeName, CONTROL_VERB } = G;
    const s = G.byId.sites[id], ym = months[whenIdx];
    const claims = G.DB.control_claims.filter((c) => c.site_id === id).sort((a, b) => (G.dkey(a.valid_from || a.observed_date) || "").localeCompare(G.dkey(b.valid_from || b.observed_date) || ""));
    const active = new Set(activeClaims(id, ym).map((c) => c.id));
    const impacts = G.DB.impacts.filter((i) => i.site_id === id);
    const flows = G.DB.flows.filter((f) => f.from_node === id || f.to_node === id || G.byId.actors[f.from_node]?.site_id === id || G.byId.actors[f.to_node]?.site_id === id);
    const atSite = G.DB.actors.filter((a) => a.site_id === id);
    const nowCtl = claims.filter((c) => active.has(c.id));
    const hasChain = G.DB.flows.some((f) => f.from_node === id);

    const status = nowCtl.length
      ? `<div class="dr-status on"><strong>${esc([...new Set(nowCtl.map((c) => G.byId.actors[c.actor_id]?.name.replace(/ \(.*/, "")))].join(", "))}</strong> controls or taxes this site as of ${esc(fmtDate(ym))} ${badge(strongest(nowCtl))}</div>`
      : `<div class="dr-status">No armed-group control recorded as of ${esc(fmtDate(ym))}</div>`;

    const claimHtml = claims.length ? claims.map((c) => {
      const a = G.byId.actors[c.actor_id];
      const period = `${fmtDate(c.valid_from) || (c.observed_date ? "by " + fmtDate(c.observed_date) : "?")} – ${c.valid_to ? fmtDate(c.valid_to) : "present"}`;
      return `<li class="${active.has(c.id) ? "" : "inactive"}">
        <div class="tl-when">${esc(period)}</div>
        <div><strong>${esc(a?.name)}</strong> ${esc(CONTROL_VERB[c.control_type] || c.control_type)} the site</div>
        <div class="claim-meta">${badge(c.evidence_tier)}</div>
        ${c.summary ? `<div class="small">${esc(c.summary)}</div>` : ""}
        <div class="cite">${cites(c.source_ids, c.paragraph_or_page)}</div>${denialsFor(c.id)}</li>`;
    }).join("") : '<li class="muted">No control claim recorded. That is a gap, not evidence of no armed presence.</li>';

    const impactHtml = impacts.map((i) => `<li>
        <div><strong>${esc(i.value != null ? i.value.toLocaleString("en-GB") + " " + (i.unit || "") : "")}</strong> ${esc(i.summary)}</div>
        <div class="claim-meta">${badge(i.evidence_tier)} <span>${esc(i.period || "")}</span></div>
        <div class="cite">${cites(i.source_ids, i.paragraph_or_page)}</div>${denialsFor(i.id)}</li>`).join("");

    const flowHtml = flows.map((f) => `<li>
        <div>${esc(nodeName(f.from_node))} → ${esc(nodeName(f.to_node))}${sayariLink(f.to_node)}</div>
        <div class="claim-meta">${badge(f.evidence_tier)} <span>${esc(f.mineral)} · ${esc(f.period || "")}</span></div>
        <div class="cite">${cites(f.source_ids)}</div>${denialsFor(f.id)}</li>`).join("");

    return `
      <div class="dr-kicker">${esc(s.site_type.replace("_", " "))} · key site</div>
      <h2>${esc(s.name)}</h2>
      <div class="dr-meta">${esc([(s.minerals || []).join(", "), s.admin_area, s.country].filter(Boolean).join(" · "))}</div>
      ${status}
      ${hasChain ? `<a class="dr-cta" href="#chain=${encodeURIComponent(id)}">Follow this site's minerals →</a>` : ""}
      <h3>Control history</h3><ul class="dr-timeline">${claimHtml}</ul>
      ${atSite.length ? `<h3>Located here</h3><ul>${atSite.map((a) => `<li>${actorLine(a)}</li>`).join("")}</ul>` : ""}
      ${impactHtml ? `<h3>Impacts</h3><ul>${impactHtml}</ul>` : ""}
      ${(() => { const hint = id.replace(/^site_/, ""); const hr = (G.DB.hr_facts || []).filter((f) => f.site_hint === hint);
        return hr.length ? `<h3>Human rights (${hr.length})</h3><ul>${hr.map((f) => `<li><div class="small">${esc(f.summary)}</div>
          <div class="claim-meta">${badge(f.evidence_tier)}<span>${esc(f.category.replace(/_/g, " "))} · ${esc(f.date_or_period || "")}${f.perpetrator && !/^n\/a/.test(f.perpetrator) ? " · " + esc(f.perpetrator) : ""}</span></div>
          <div class="cite">${cites(f.source_ids, f.paragraph_or_page)}</div>${denialsFor(f.id)}</li>`).join("")}</ul>` : ""; })()}
      ${flowHtml ? `<details class="dr-flows"><summary>Mineral flows (${flows.length})</summary><ul>${flowHtml}</ul></details>` : ""}
      ${s.notes ? `<p class="small muted">${esc(s.notes)}</p>` : ""}
      <div class="cite">Location: ${cites(s.source_ids)}</div>`;
  }
})();
