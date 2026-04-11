// Data: https://api.api-onepiece.com/v2/characters/en

const API_URL   = 'https://api.api-onepiece.com/v2/characters/en';
const HAKI_URL  = 'https://api.api-onepiece.com/v2/hakis/en/character';
const RED     = '#cc2200';
const CREAM   = '#aaaaaa';
const BG      = '#1a1a1a';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseBounty(b) {
  if (b == null || b === '' || b === 'none' || b === 'None') return 0;
  if (typeof b === 'number') return b;
  const n = parseInt(String(b).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function isDFUser(c) {
  return !!(c.fruit || c.devil_fruit || c.devilFruit);
}

function getFruitType(c) {
  const f = c.fruit || c.devil_fruit || c.devilFruit;
  if (!f) return null;
  return (f.type || f.category || 'Unknown').trim();
}

function getCrewName(c) {
  const cr = c.crew || c.pirate_crew;
  if (!cr) return 'Unknown';
  return (cr.name || cr.title || String(cr) || 'Unknown').trim();
}

function getHaki(c) {
  // Populated by fetchHakiData() using /v2/hakis/en/character/{id}
  // haki ids: 1=Observation, 2=Weaponry (Armament), 3=Haki of Kings (Conqueror's)
  return c._haki || { observation: false, armament: false, conquerors: false };
}

function fmtBounty(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return '—';
}

function visWidth(el) {
  return el.clientWidth > 80 ? el.clientWidth : 700;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

// Fetches haki types for all chars that have a bounty, in parallel.
// Attaches result as c._haki = { observation, armament, conquerors } on each char.
async function fetchHakiData(chars) {
  const targets = chars.filter(c => parseBounty(c.bounty) > 0);
  await Promise.all(
    targets.map(async c => {
      try {
        const res = await fetch(`${HAKI_URL}/${c.id}`);
        if (!res.ok) return;
        const hakis = await res.json();
        c._haki = {
          observation: hakis.some(h => h.haki.id === 1),
          armament:    hakis.some(h => h.haki.id === 2),
          conquerors:  hakis.some(h => h.haki.id === 3),
        };
      } catch { /* leave _haki undefined */ }
    })
  );
}

async function fetchAllCharacters() {
  const limit = 100;
  try {
    // Page 1 first — needed to discover total page count
    const res1 = await fetch(`${API_URL}?limit=${limit}&page=1`);
    if (!res1.ok) return [];
    const json1 = await res1.json();
    const items1 = Array.isArray(json1) ? json1
      : (json1.data || json1.characters || json1.results || []);

    const meta     = json1.meta || {};
    const lastPage = meta.lastPage || meta.totalPages || json1.totalPages || 1;

    // If only one page (or response didn't paginate), return immediately
    if (lastPage <= 1 || items1.length < limit) return items1;

    // Fire all remaining pages in parallel
    const pageNums = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const pages = await Promise.all(
      pageNums.map(async p => {
        const res = await fetch(`${API_URL}?limit=${limit}&page=${p}`);
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json
          : (json.data || json.characters || json.results || []);
      })
    );

    return [items1, ...pages].flat();
  } catch (e) {
    console.error('Fetch error:', e);
    return [];
  }
}

// ── VIS 1 — Horizontal Bar Chart ─────────────────────────────────────────────

function drawVis1(chars, filter = 'all') {
  const el = document.getElementById('vis1');
  el.innerHTML = '';

  let data = chars.filter(c => parseBounty(c.bounty) > 0);
  if (filter === 'df')    data = data.filter(c =>  isDFUser(c));
  if (filter === 'nondf') data = data.filter(c => !isDFUser(c));
  data = data.sort((a, b) => parseBounty(b.bounty) - parseBounty(a.bounty)).slice(0, 15);

  const W = visWidth(el);
  const H = 340;
  const m = { top: 16, right: 24, bottom: 44, left: 140 };
  const iw = W - m.left - m.right;
  const ih = H - m.top  - m.bottom;

  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', H)
    .style('display', 'block').style('background', BG);

  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const maxB = d3.max(data, d => parseBounty(d.bounty)) || 1;
  const x = d3.scaleLinear().domain([0, maxB]).range([0, iw]);
  const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, ih]).padding(0.2);

  // Background rect
  g.append('rect').attr('width', iw).attr('height', ih).attr('fill', BG);

  // Bars
  g.selectAll('rect.bar').data(data).enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(d.name))
    .attr('width', d => x(parseBounty(d.bounty)))
    .attr('height', y.bandwidth())
    .attr('fill', d => isDFUser(d) ? RED : CREAM);

  // Axes
  g.append('g').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => fmtBounty(d)))
    .call(ax => ax.selectAll('text').style('fill', '#888').style('font-size', '11px'))
    .call(ax => ax.select('.domain').attr('stroke', '#555'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#555'));

  g.append('g').call(d3.axisLeft(y))
    .call(ax => ax.selectAll('text').style('fill', '#ccc').style('font-size', '11px'))
    .call(ax => ax.select('.domain').attr('stroke', '#555'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#555'));

  // X label
  svg.append('text')
    .attr('x', m.left + iw / 2).attr('y', H - 6)
    .attr('text-anchor', 'middle').attr('fill', '#666').attr('font-size', 11)
    .text('bounty (Berries)');

  // Legend
  const leg = svg.append('g').attr('transform', `translate(${m.left + iw - 130},${m.top + 4})`);
  [[RED, 'Devil Fruit User'], [CREAM, 'Non-Fruit User']].forEach(([col, lbl], i) => {
    leg.append('rect').attr('y', i * 18).attr('width', 12).attr('height', 12).attr('fill', col);
    leg.append('text').attr('x', 16).attr('y', i * 18 + 10)
      .attr('fill', '#ccc').attr('font-size', 11).text(lbl);
  });

  // Chart title
  svg.append('text').attr('x', m.left).attr('y', 10)
    .attr('fill', '#888').attr('font-size', 11)
    .text('Top 15 Pirate Bounties');
}

// ── VIS 2 — Treemap ───────────────────────────────────────────────────────────

const FRUIT_COLORS = {
  'Paramecia': RED,
  'Zoan':      '#b8860b',
  'Logia':     '#2e6b2e',
  'None':      '#555555',
  'Unknown':   '#444444'
};

function drawVis2(chars, filter = 'all') {
  const el = document.getElementById('vis2');
  el.innerHTML = '';

  const dfUsers = chars.filter(c => parseBounty(c.bounty) > 0 && isDFUser(c));

  let leaves;
  if (filter === 'all') {
    // Group by type → one rect per type
    const typeMap = {};
    dfUsers.forEach(c => {
      const t = getFruitType(c) || 'Unknown';
      if (!typeMap[t]) typeMap[t] = { name: t, total: 0, count: 0 };
      typeMap[t].total += parseBounty(c.bounty);
      typeMap[t].count++;
    });
    // Add None bucket
    const noneChars = chars.filter(c => parseBounty(c.bounty) > 0 && !isDFUser(c));
    typeMap['None'] = {
      name: 'None',
      total: noneChars.reduce((s, c) => s + parseBounty(c.bounty), 0),
      count: noneChars.length
    };
    leaves = Object.values(typeMap).map(t => ({
      name: t.name,
      value: t.total / (t.count || 1),
      count: t.count,
      avgBounty: t.total / (t.count || 1)
    }));
  } else {
    // Show individual chars of this fruit type
    leaves = dfUsers
      .filter(c => (getFruitType(c) || '').toLowerCase() === filter.toLowerCase())
      .map(c => {
        const f = c.fruit || c.devil_fruit || c.devilFruit;
        return {
          name: c.name,
          fruitName: f ? (f.name || '') : '',
          value: parseBounty(c.bounty),
          avgBounty: parseBounty(c.bounty),
          count: 1
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  const W = visWidth(el);
  const H = 320;

  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', H)
    .style('display', 'block').style('background', BG);

  svg.append('text').attr('x', 8).attr('y', 16)
    .attr('fill', '#888').attr('font-size', 11)
    .text(filter === 'all' ? 'Treemap — Fruit Type by Avg Bounty' : `Treemap — ${filter} users by Bounty`);

  const root = d3.hierarchy({ name: 'root', children: leaves })
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.treemap().size([W, H - 22]).padding(2)(root);

  const cell = svg.selectAll('g.cell').data(root.leaves()).enter()
    .append('g').attr('class', 'cell')
    .attr('transform', d => `translate(${d.x0},${d.y0 + 22})`);

  cell.append('rect')
    .attr('width',  d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0))
    .attr('fill', d => filter === 'all' ? (FRUIT_COLORS[d.data.name] || '#555') : RED)
    .attr('stroke', '#0f0f0f').attr('stroke-width', 1);

  cell.filter(d => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 28)
    .append('text').attr('x', 6).attr('y', 18)
    .attr('fill', '#fff').attr('font-size', 12).attr('font-weight', 'bold')
    .text(d => d.data.name);

  cell.filter(d => (d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 46)
    .append('text').attr('x', 6).attr('y', 33)
    .attr('fill', 'rgba(255,255,255,0.65)').attr('font-size', 10)
    .text(d => `${fmtBounty(d.data.avgBounty)} · ${d.data.count} user${d.data.count !== 1 ? 's' : ''}`);

  svg.append('text').attr('x', 8).attr('y', H - 4)
    .attr('fill', '#555').attr('font-size', 10)
    .text('size = avg bounty   color = fruit category');
}

// ── VIS 3 — Venn Diagram (Haki overlap) ──────────────────────────────────────

function drawVis3(chars, filter = 'all') {
  const el = document.getElementById('vis3');
  el.innerHTML = '';

  const W = visWidth(el);
  const H = 360;

  // Compute intersections
  const buckets = { O: [], A: [], C: [], OA: [], OC: [], AC: [], OAC: [] };
  chars.forEach(c => {
    const h = getHaki(c);
    const b = parseBounty(c.bounty);
    const o = h.observation, a = h.armament, co = h.conquerors;
    if (!o && !a && !co) return;
    if      (o && a && co) buckets.OAC.push(b);
    else if (o && a)       buckets.OA.push(b);
    else if (o && co)      buckets.OC.push(b);
    else if (a && co)      buckets.AC.push(b);
    else if (o)            buckets.O.push(b);
    else if (a)            buckets.A.push(b);
    else                   buckets.C.push(b);
  });

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', H)
    .style('display', 'block').style('background', BG);

  svg.append('text').attr('x', 8).attr('y', 16)
    .attr('fill', '#888').attr('font-size', 11).text('Supremacy Matrix');

  const cx = W / 2;
  const cy = H / 2 + 10;
  const r  = Math.min(W * 0.22, H * 0.38);

  // Circle definitions (triangle layout)
  const circles = [
    { cx: cx - r * 0.55, cy: cy - r * 0.38, label: 'Observation', side: 'left',  color: '#4a4a8a', key: 'O' },
    { cx: cx + r * 0.55, cy: cy - r * 0.38, label: 'Armament',    side: 'right', color: '#4a7a4a', key: 'A' },
    { cx: cx,            cy: cy + r * 0.45, label: "Conqueror's",  side: 'mid',   color: '#8a3a3a', key: 'C' }
  ];

  // Draw circles — dim non-selected if filter active
  circles.forEach(ci => {
    const active = filter === 'all' || filter === ci.key.toLowerCase() ||
                   filter === ci.label.toLowerCase().slice(0, 3);
    svg.append('circle')
      .attr('cx', ci.cx).attr('cy', ci.cy).attr('r', r)
      .attr('fill', ci.color).attr('fill-opacity', active ? 0.35 : 0.1)
      .attr('stroke', ci.color).attr('stroke-width', active ? 1.5 : 0.5)
      .attr('stroke-opacity', active ? 1 : 0.3);
  });

  // Circle labels
  const labelOffset = r * 0.85;
  svg.append('text').attr('x', circles[0].cx - labelOffset * 0.45).attr('y', circles[0].cy - labelOffset * 0.65)
    .attr('text-anchor', 'middle').attr('fill', '#bbb').attr('font-size', 12).text('Observation');
  svg.append('text').attr('x', circles[1].cx + labelOffset * 0.45).attr('y', circles[1].cy - labelOffset * 0.65)
    .attr('text-anchor', 'middle').attr('fill', '#bbb').attr('font-size', 12).text('Armament');
  svg.append('text').attr('x', circles[2].cx).attr('y', circles[2].cy + labelOffset * 0.85)
    .attr('text-anchor', 'middle').attr('fill', '#bbb').attr('font-size', 12).text("Conqueror's");

  // Intersection labels
  const labels = [
    // Sole users (outside intersections)
    { x: circles[0].cx - r * 0.42, y: circles[0].cy - 4,   text: `${buckets.O.length}`,   sub: fmtBounty(avg(buckets.O)) },
    { x: circles[1].cx + r * 0.42, y: circles[1].cy - 4,   text: `${buckets.A.length}`,   sub: fmtBounty(avg(buckets.A)) },
    { x: circles[2].cx,            y: circles[2].cy + r * 0.6, text: `${buckets.C.length}`, sub: fmtBounty(avg(buckets.C)) },
    // Pairwise
    { x: cx,                        y: circles[0].cy + 4,   text: `${buckets.OA.length}`,  sub: fmtBounty(avg(buckets.OA)) },
    { x: circles[0].cx - r * 0.05, y: cy + r * 0.22,       text: `${buckets.OC.length}`,  sub: fmtBounty(avg(buckets.OC)) },
    { x: circles[1].cx + r * 0.05, y: cy + r * 0.22,       text: `${buckets.AC.length}`,  sub: fmtBounty(avg(buckets.AC)) },
    // Triple center
    { x: cx, y: cy - 6, text: `${buckets.OAC.length}`, sub: fmtBounty(avg(buckets.OAC)), bold: true }
  ];

  labels.forEach(({ x, y, text, sub, bold }) => {
    svg.append('text').attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle').attr('fill', '#eee')
      .attr('font-size', bold ? 13 : 11)
      .attr('font-weight', bold ? 'bold' : 'normal')
      .text(text);
    svg.append('text').attr('x', x).attr('y', y + 13)
      .attr('text-anchor', 'middle').attr('fill', '#999').attr('font-size', 9)
      .text(sub);
  });

  svg.append('text').attr('x', 8).attr('y', H - 4)
    .attr('fill', '#555').attr('font-size', 10)
    .text('count · avg bounty per intersection');
}

// ── VIS 4 — Bubble Chart (Crew Affiliation) ───────────────────────────────────

function drawVis4(chars, filter = 'all') {
  const el = document.getElementById('vis4');
  el.innerHTML = '';

  // Group by crew
  const crewMap = {};
  chars.forEach(c => {
    const b = parseBounty(c.bounty);
    if (b <= 0) return;
    const crew = getCrewName(c);
    if (!crewMap[crew]) crewMap[crew] = { name: crew, bounties: [], dfCount: 0 };
    crewMap[crew].bounties.push(b);
    if (isDFUser(c)) crewMap[crew].dfCount++;
  });

  let crews = Object.values(crewMap)
    .filter(c => c.bounties.length >= 2)
    .map(c => ({
      name:      c.name,
      avgBounty: c.bounties.reduce((a, b) => a + b, 0) / c.bounties.length,
      count:     c.bounties.length,
      dfRatio:   c.dfCount / c.bounties.length
    }))
    .sort((a, b) => b.avgBounty - a.avgBounty)
    .slice(0, 18);

  if (filter === 'df')    crews = crews.filter(c => c.dfRatio >= 0.5);
  if (filter === 'nondf') crews = crews.filter(c => c.dfRatio <  0.5);

  const W = visWidth(el);
  const H = 340;
  const m = { top: 28, right: 20, bottom: 54, left: 20 };
  const iw = W - m.left - m.right;
  const ih = H - m.top  - m.bottom;

  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', H)
    .style('display', 'block').style('background', BG);

  svg.append('text').attr('x', 8).attr('y', 16)
    .attr('fill', '#888').attr('font-size', 11)
    .text('Bubble Chart — Crew Power & Size');

  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const maxB = d3.max(crews, d => d.avgBounty) || 1;
  const x = d3.scaleLinear().domain([0, maxB]).range([0, iw]).nice();
  const rScale = d3.scaleSqrt().domain([1, d3.max(crews, d => d.count) || 1]).range([8, 28]);

  // Jitter rows so bubbles don't overlap on one line
  const rowH = ih / 4;
  const yPos = (i) => rowH * (i % 4) + rowH / 2;

  const bubble = g.selectAll('g.bub').data(crews).enter().append('g').attr('class', 'bub')
    .attr('transform', (d, i) => `translate(${x(d.avgBounty)},${yPos(i)})`);

  bubble.append('circle')
    .attr('r', d => rScale(d.count))
    .attr('fill', d => d.dfRatio >= 0.5 ? RED : CREAM)
    .attr('fill-opacity', 0.8)
    .attr('stroke', '#222').attr('stroke-width', 1);

  bubble.filter(d => rScale(d.count) > 14)
    .append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
    .attr('fill', '#fff').attr('font-size', 9)
    .text(d => d.name.replace(/pirates?|crew|alliance/gi, '').trim().slice(0, 10));

  // X axis
  g.append('g').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => fmtBounty(d)))
    .call(ax => ax.selectAll('text').style('fill', '#888').style('font-size', '11px'))
    .call(ax => ax.select('.domain').attr('stroke', '#555'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#555'));

  svg.append('text').attr('x', m.left + iw / 2).attr('y', H - 4)
    .attr('text-anchor', 'middle').attr('fill', '#666').attr('font-size', 11)
    .text('Average Bounty (Berries) per Member');

  // Legend
  const leg = svg.append('g').attr('transform', `translate(${m.left + 8},${m.top + 4})`);
  [[RED, 'DF-heavy crew (≥50% users)'], [CREAM, 'Non-DF crew']].forEach(([col, lbl], i) => {
    leg.append('circle').attr('cx', 6).attr('cy', i * 18 + 6).attr('r', 6).attr('fill', col);
    leg.append('text').attr('x', 16).attr('y', i * 18 + 10)
      .attr('fill', '#ccc').attr('font-size', 11).text(lbl);
  });
}

// ── VIS 5 — Line Chart (Bounty Trajectory, hardcoded arc data) ───────────────
// API does not track per-arc bounty history; values sourced from wiki.

const ARC_DATA = [
  {
    name: 'Luffy', color: '#e63946',
    arcs: ['Alabasta', 'Marineford', 'Dressrosa', 'Wano', 'Egghead'],
    values: [100e6, 400e6, 500e6, 3000e6, 3000e6]
  },
  {
    name: 'Zoro', color: '#457b9d',
    arcs: ['Alabasta', 'Marineford', 'Dressrosa', 'Wano', 'Egghead'],
    values: [60e6, 120e6, 320e6, 1111e6, 1111e6]
  },
  {
    name: 'Sanji', color: '#f4a261',
    arcs: ['Alabasta', 'Marineford', 'Dressrosa', 'Wano', 'Egghead'],
    values: [77e6, 77e6, 177e6, 1032e6, 1032e6]
  }
];

function drawVis5(filter = 'all') {
  const el = document.getElementById('vis5');
  el.innerHTML = '';

  const arcs   = ARC_DATA[0].arcs;
  const series = filter === 'all'
    ? ARC_DATA
    : ARC_DATA.filter(d => d.name.toLowerCase() === filter);

  const W = visWidth(el);
  const H = 320;
  const m = { top: 28, right: 60, bottom: 50, left: 72 };
  const iw = W - m.left - m.right;
  const ih = H - m.top  - m.bottom;

  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', H)
    .style('display', 'block').style('background', BG);

  svg.append('text').attr('x', 8).attr('y', 16)
    .attr('fill', '#888').attr('font-size', 11)
    .text('Line Chart — Bounty Growth Across Story Arcs');

  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const maxVal = d3.max(series, s => d3.max(s.values)) || 1;
  const x = d3.scalePoint().domain(arcs).range([0, iw]);
  const y = d3.scaleLinear().domain([0, maxVal]).range([ih, 0]).nice();

  const line = d3.line()
    .x((d, i) => x(arcs[i]))
    .y(d => y(d));

  series.forEach(s => {
    g.append('path').datum(s.values)
      .attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 2)
      .attr('d', line);

    g.selectAll(null).data(s.values).enter().append('circle')
      .attr('cx', (d, i) => x(arcs[i]))
      .attr('cy', d => y(d))
      .attr('r', 4).attr('fill', s.color);

    // End label
    g.append('text')
      .attr('x', x(arcs[arcs.length - 1]) + 8)
      .attr('y', y(s.values[s.values.length - 1]))
      .attr('dy', '0.35em').attr('fill', s.color).attr('font-size', 11)
      .text(s.name);
  });

  // X axis
  g.append('g').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .call(ax => ax.selectAll('text').style('fill', '#888').style('font-size', '11px'))
    .call(ax => ax.select('.domain').attr('stroke', '#555'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#555'));

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => fmtBounty(d)))
    .call(ax => ax.selectAll('text').style('fill', '#888').style('font-size', '11px'))
    .call(ax => ax.select('.domain').attr('stroke', '#555'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#555'));

  svg.append('text')
    .attr('transform', `translate(10,${m.top + ih / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle').attr('fill', '#666').attr('font-size', 10)
    .text('bounty (Berries)');
}

// ── Filter button wiring ──────────────────────────────────────────────────────

function wireFilters(chars) {
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.bg-dark');
      card.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const vis   = btn.dataset.vis;
      const label = (btn.dataset.label || '').toLowerCase();
      const lbl   = card.querySelector('[id^="lbl-"]');
      if (lbl) lbl.textContent = btn.dataset.chart;

      if      (vis === 'vis1') drawVis1(chars, label.includes('df only') ? 'df' : label.includes('non-df') ? 'nondf' : 'all');
      else if (vis === 'vis2') {
        const f = ['paramecia', 'zoan', 'logia'].find(t => label.includes(t)) || 'all';
        drawVis2(chars, f);
      }
      else if (vis === 'vis3') {
        const f = label.includes('observ') ? 'observation'
                : label.includes('armament') ? 'armament'
                : label.includes('conqueror') ? 'conquerors' : 'all';
        drawVis3(chars, f);
      }
      else if (vis === 'vis4') drawVis4(chars, label.includes('df-heavy') ? 'df' : label.includes('non-df') ? 'nondf' : 'all');
      else if (vis === 'vis5') {
        const f = ['luffy', 'zoro', 'sanji'].find(n => label.includes(n)) || 'all';
        drawVis5(f);
      }
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async function main() {
  // vis5 is hardcoded — render immediately, no API needed
  drawVis5();

  ['vis1', 'vis2', 'vis3', 'vis4'].forEach(id => {
    document.getElementById(id).textContent = 'Loading data from API…';
  });

  const chars = await fetchAllCharacters();

  if (!chars.length) {
    ['vis1', 'vis2', 'vis3', 'vis4'].forEach(id => {
      document.getElementById(id).textContent = 'Failed to load data — check console for errors.';
    });
    return;
  }

  // Draw non-haki charts immediately with character data
  drawVis1(chars);
  drawVis2(chars);
  drawVis4(chars);

  // Fetch haki in parallel for all bounty-having chars, then draw vis3
  document.getElementById('vis3').textContent = 'Loading haki data…';
  await fetchHakiData(chars);
  drawVis3(chars);

  wireFilters(chars);
})();
