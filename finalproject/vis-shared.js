const API_URL = "https://api.api-onepiece.com/v2/characters/en";
const HAKI_URL = "https://api.api-onepiece.com/v2/hakis/en/character";

// Design tokens and constants
const C = {
  // devil fruit users in rankings
  accent: "#e8c96a",
  // paramecia
  paramecia: "#cc2200",
  // zoan
  zoan: "#b8860b",
  // logia
  logia: "#2e6b8f",
  // non-DF users
  none: "#4a4a5a",
  obs: "#3a3a8a",
  arm: "#2e6b3e",
  con: "#8a2e2e",
  bg: "#0f0f0f",
  bgCard: "#141414",
  border: "#242424",
  dim: "#333",
  textDim: "#4a4a4a",
  textMid: "#9a9a9a",
  textMain: "#cccccc",
};

// Module state
let _chars = [];
let _hakiLoaded = false;
const _filters = {
  vis1: "all",
  vis2: "all",
  vis3: "all",
  vis4: "all",
  vis5: "all",
};
let _vis2Highlight = null;
let _vis4Highlight = null;

// Palettes
const PALETTE = [
  "#e63946",
  "#4ecdc4",
  "#ffd166",
  "#a8dadc",
  "#06d6a0",
  "#9b5de5",
  "#f15bb5",
  "#ff9671",
  "#e9c46a",
  "#118ab2",
];

const CREW_PALETTE = [
  "#e63946",
  "#4ecdc4",
  "#ffd166",
  "#a8dadc",
  "#06d6a0",
  "#9b5de5",
  "#f15bb5",
  "#ff9671",
  "#e9c46a",
  "#118ab2",
  "#2ec4b6",
  "#ff595e",
  "#ffca3a",
  "#6a4c93",
];

const FRUIT_COL = {
  Paramecia: C.paramecia,
  Zoan: C.zoan,
  "Zoan Antique": "#7a5a10",
  "Zoan Mythique": "#6b3a7a",
  Logia: C.logia,
  None: C.none,
  Unknown: "#3a3a3a",
};

// animation constants
const T = {
  stagger: 48, // ms between staggered elements
  bar: 650, // bar / stem grow
  arc: 750, // sunburst arc expansion
  path: 1300, // line draw
  fade: 320, // opacity fade-in
  hover: 130, // hover transitions
  bounce: 550, // bounce-in for dots/nodes
  zoom: 650, // sunburst filter highlight
  dim: 0.08, // opacity when dimmed
};

// helpers
function parseBounty(b) {
  if (b == null || b === "" || b === "none" || b === "None") return 0;
  if (typeof b === "number") return b;
  const n = parseInt(String(b).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}
function isDFUser(c) {
  return !!(c.fruit || c.devil_fruit || c.devilFruit);
}
function getFruitType(c) {
  const f = c.fruit || c.devil_fruit || c.devilFruit;
  return f ? (f.type || f.category || "Unknown").trim() : null;
}
const CREW_NAME_EN = {
  "The Chapeau de Paille crew": "Straw Hat Pirates",
  "Armarda du Chapeau de Paille": "Straw Hat Grand Fleet",
  "Le Roux crew": "Red Hair Pirates",
  "The Pirates Roger crew": "Roger Pirates",
  "Big Mom's crew": "Big Mom Pirates",
  "The Hundred Beasts crew": "Beasts Pirates",
  "Blackbeard's crew": "Blackbeard Pirates",
  "The Hearth crew": "Heart Pirates",
  "The Kid crew": "Kid Pirates",
  "The Fire Tank crew": "Fire Tank Pirates",
  "The Sun Pirates crew": "Sun Pirates",
  "The Foxy crew": "Foxy Pirates",
  "The Kuja Pirates crew": "Kuja Pirates",
  "The Caribou crew": "Caribou Pirates",
  "The Black Cat crew": "Black Cat Pirates",
  "Thriller Bark": "Thriller Bark Pirates",
  "The crew of the Rolling": "Rolling Pirates",
  "The crew of Les Moines Dépravés": "Fallen Monk Pirates",
  "The crew of the Lion d'Or": "Golden Lion Pirates",
  "Primate League": "Primate League",
};

function getCrewName(c) {
  const cr = c.crew || c.pirate_crew;
  if (!cr) return "Unknown";
  const raw = (cr.name || cr.title || String(cr) || "Unknown").trim();
  return CREW_NAME_EN[raw] || raw;
}
function getHaki(c) {
  return c._haki || { observation: false, armament: false, conquerors: false };
}
function fmtBounty(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return v > 0 ? v.toLocaleString() : "—";
}
function visWidth(el) {
  return el.clientWidth > 120 ? el.clientWidth : 720;
}
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// tooltip
const tooltip = d3.select("body").append("div").attr("class", "chart-tooltip");

function showTip(event, html) {
  tooltip.classed("visible", true).html(html);
  _moveTip(event);
}
function _moveTip(event) {
  const x = event.clientX,
    y = event.clientY;
  const tw = tooltip.node().offsetWidth;
  const th = tooltip.node().offsetHeight;
  const left = x + 18 + tw > window.innerWidth ? x - tw - 14 : x + 18;
  const top = y + th + 12 > window.innerHeight ? y - th - 8 : y + 8;
  tooltip.style("left", left + "px").style("top", top + "px");
}
function moveTip(event) {
  _moveTip(event);
}
function hideTip() {
  tooltip.classed("visible", false);
}

// scroll reveal for sections
function setupScrollReveal() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("section-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll("main section").forEach((s) => {
    s.classList.add("section-hidden");
    io.observe(s);
  });
}

// shared axis
function styleAxis(sel) {
  sel.selectAll("text").style("fill", C.textMid).style("font-size", "11px");
  sel.select(".domain").attr("stroke", C.dim);
  sel.selectAll(".tick line").attr("stroke", C.dim);
}
function removeAxisLines(sel) {
  sel.select(".domain").remove();
  sel.selectAll(".tick line").remove();
}

// loading state
function setLoading(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = msg || "Loading…";
  el.classList.add("loading");
}
function clearLoading(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  el.classList.remove("loading");
  el.style.minHeight = "";
}

// fetching data
async function fetchHakiData(chars, onProgress) {
  const targets = chars.filter((c) => parseBounty(c.bounty) > 0);
  let done = 0;
  await Promise.allSettled(
    targets.map(async (c) => {
      try {
        const res = await fetch(`${HAKI_URL}/${c.id}`);
        if (!res.ok) return;
        const hakis = await res.json();
        c._haki = {
          observation: hakis.some((h) => h.haki.id === 1),
          armament: hakis.some((h) => h.haki.id === 2),
          conquerors: hakis.some((h) => h.haki.id === 3),
        };
      } catch {}
      done++;
      if (onProgress) onProgress(done, targets.length);
    }),
  );
}

async function fetchAllCharacters() {
  const limit = 100;
  try {
    const res1 = await fetch(`${API_URL}?limit=${limit}&page=1`);
    if (!res1.ok) return [];
    const json1 = await res1.json();
    const items1 = Array.isArray(json1)
      ? json1
      : json1.data || json1.characters || json1.results || [];
    const meta = json1.meta || {};
    const lastPage = meta.lastPage || meta.totalPages || json1.totalPages || 1;
    if (lastPage <= 1 || items1.length < limit) return items1;
    const pages = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) => i + 2).map(async (p) => {
        const res = await fetch(`${API_URL}?limit=${limit}&page=${p}`);
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json)
          ? json
          : json.data || json.characters || json.results || [];
      }),
    );
    return [items1, ...pages].flat();
  } catch (e) {
    console.error("Fetch error:", e);
    return [];
  }
}
