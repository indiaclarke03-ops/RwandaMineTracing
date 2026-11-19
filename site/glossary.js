// Glossary: one definition per term, used on the Glossary view and as hover/tap definitions across the site.
"use strict";

(function () {
  const TERMS = [
    ["Coltan", "The ore mined for tantalum (and niobium). Short for columbite-tantalite. Mostly dug by hand in eastern Congo."],
    ["Cassiterite", "The ore mined for tin."],
    ["Wolframite", "The ore mined for tungsten."],
    ["3T", "Tin, tantalum and tungsten: the three metals, with gold, covered by most conflict-minerals rules (together, 3TG)."],
    ["Tantalum", "A rare metal used mainly in small, reliable capacitors in electronics, and in heat-resistant alloys for jet engines."],
    ["Artisanal mining", "Small-scale mining by hand or with simple tools, often informal. Most coltan in eastern Congo is mined this way."],
    ["M23", "Mouvement du 23 mars, an armed group in eastern Congo. The UN and the US say Rwanda's army backs it; Rwanda denies this."],
    ["AFC", "Alliance Fleuve Congo, the political-military coalition that includes M23. Renamed in October 2026."],
    ["RDF", "Rwanda Defence Force, Rwanda's army. Sanctioned by the US in March 2026."],
    ["FARDC", "Forces Armées de la République Démocratique du Congo: Congo's national army."],
    ["Wazalendo", "Congolese militias, often allied with the army against M23. Counted here as armed groups."],
    ["PARECO-FF", "A Congolese militia that controlled the Rubaya mines from 2022 until M23 took them in April 2024. Sanctioned by the US in 2025."],
    ["FDLR", "An armed group founded by Rwandan Hutu exiles, some linked to the 1994 genocide, active in eastern Congo."],
    ["ITSCI", "The main industry scheme that tags and traces 3T minerals from mine to export in the region. It has suspended several Rwandan exporters."],
    ["RMI", "Responsible Minerals Initiative, an industry body that audits smelters. \"Conformant\" means a smelter's due-diligence system passed audit, not that its ore is clean."],
    ["Smelter", "A plant that turns ore concentrate into refined metal. Brands' supply chains usually narrow to a few hundred smelters."],
    ["Exporter", "A licensed company that buys ore and ships it out of the country. In Rwanda, a handful export most of the coltan."],
    ["Trader", "A company that buys and resells minerals, often based in a trading hub such as the UAE or Hong Kong."],
    ["Conflict Minerals Report", "A US filing (Form SD) in which listed companies describe smelters in their supply chain and their due diligence."],
    ["Comtrade", "The UN's database of countries' reported trade."],
    ["Mirror data", "One country's trade as reported by its partners, such as what other countries say they imported from Rwanda. A check on official figures."],
    ["HS code", "The international customs code for a product. 261590 is coltan, 260900 tin ore, 261100 tungsten ore, 7108 gold."],
    ["OFAC", "The US Treasury office that imposes sanctions."],
    ["UN Group of Experts", "Investigators appointed by the UN Security Council to monitor the arms embargo and sanctions on the DRC. Their reports are the main evidence on who controls mines."],
    ["IPIS", "International Peace Information Service, a research institute that has surveyed thousands of mining sites in eastern Congo since 2009."],
    ["Sayari", "A commercial database of company records and trade data used here to trace owners and buyers."],
    ["Rubaya", "A mining area in Masisi, North Kivu, and one of the world's most important sources of coltan. Held by M23 since April 2024."],
    ["Tolling", "Processing someone else's material for a fee while they keep ownership, as when a smelter re-melts ingots for a client."],
  ];
  window.GC_GLOSSARY = TERMS;
  const VIEWS = (window.GC_VIEWS = window.GC_VIEWS || {});
  const done = new WeakSet();

  VIEWS.glossary = {
    build() {
      document.getElementById("glossary").innerHTML = TERMS.slice().sort((a, b) => a[0].localeCompare(b[0]))
        .map(([t, d]) => `<div><dt id="gl-${t.replace(/\W+/g, "-").toLowerCase()}">${t}</dt><dd>${d}</dd></div>`).join("");
    },
  };

  // Wrap the first use of each term in a container with a definition, skipping links, buttons, inputs and charts.
  const SKIP = "a, button, input, textarea, select, svg, abbr, .cite, .badge, code, h1, h2, h3, h4, summary, .klabel, .cnode, .st-row, .chip, .tabs";
  const re = new RegExp(`\\b(${TERMS.map((t) => t[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`);
  const defs = Object.fromEntries(TERMS.map(([t, d]) => [t.toLowerCase(), [t, d]]));

  window.annotateTerms = function (root) {
    if (!root || done.has(root)) return;
    done.add(root);
    const used = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.parentElement.closest(SKIP) || !re.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const m = n.nodeValue.match(re);
      if (!m) continue;
      const key = m[1].toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      const after = n.splitText(m.index);
      after.nodeValue = after.nodeValue.slice(m[1].length);
      const ab = document.createElement("abbr");
      ab.className = "gl";
      ab.tabIndex = 0;
      ab.textContent = m[1];
      ab.dataset.def = defs[key][1];
      ab.setAttribute("aria-label", `${m[1]}: ${defs[key][1]}`);
      n.parentNode.insertBefore(ab, after);
    }
  };
})();
