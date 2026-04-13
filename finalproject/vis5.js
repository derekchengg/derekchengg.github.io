//  VIS 5 — Bounty Trajectory Line Chart
const ARCS = [
  "Alabasta",
  "Water 7",
  "Marineford",
  "Fishman Is.",
  "Dressrosa",
  "Whole Cake",
  "Wano",
];

const ARC_DATA = [
  {
    name: "Luffy",
    color: PALETTE[0],
    values: [100, 300, 400, 400, 1500, 1500, 3000],
  },
  {
    name: "Zoro",
    color: PALETTE[1],
    values: [60, 120, 120, 120, 320, 320, 1111],
  },
  {
    name: "Sanji",
    color: PALETTE[2],
    values: [77, 77, 77, 177, 177, 330, 1032],
  },
  {
    name: "Robin",
    color: PALETTE[3],
    values: [79, 79, 79, 130, 130, 130, 930],
  },
  {
    name: "Jinbe",
    color: PALETTE[4],
    values: [0, 0, 250, 250, 438, 438, 1100],
  },
  {
    name: "Law",
    color: PALETTE[5],
    values: [0, 100, 200, 200, 500, 500, 3000],
  },
  { name: "Kid", color: PALETTE[6], values: [0, 0, 315, 315, 470, 470, 3000] },
  {
    name: "Blackbeard",
    color: PALETTE[7],
    values: [0, 0, 0, 0, 0, 2247, 3996],
  },
  { name: "Nami", color: PALETTE[8], values: [16, 16, 16, 66, 66, 66, 366] },
  {
    name: "Usopp",
    color: PALETTE[9],
    values: [30, 30, 30, 200, 200, 200, 500],
  },
].map((d) => ({ ...d, values: d.values.map((v) => v * 1e6) }));

function drawVis5(filter = "all") {
  const el = document.getElementById("vis5");
  el.innerHTML = "";

  const series =
    filter === "all"
      ? ARC_DATA
      : ARC_DATA.filter((d) => d.name.toLowerCase() === filter.toLowerCase());

  const legW = 90;
  const W = visWidth(el);
  const H = 400;
  const m = { top: 28, right: legW + 16, bottom: 58, left: 74 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("background", C.bg);

  svg
    .append("text")
    .attr("x", 10)
    .attr("y", 18)
    .attr("fill", C.textMid)
    .attr("font-size", 11)
    .text("Bounty Trajectory");

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const maxVal = d3.max(series, (s) => d3.max(s.values)) || 1;
  const x = d3.scalePoint().domain(ARCS).range([0, iw]);
  const y = d3.scaleLinear().domain([0, maxVal]).range([ih, 0]).nice();

  // Horizontal grid
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .call((ax) => ax.select(".domain").remove())
    .call((ax) =>
      ax
        .selectAll(".tick line")
        .attr("stroke", "#1c1c1c")
        .attr("stroke-dasharray", "3,4"),
    );

  const lineGen = d3
    .line()
    .defined((d, i) => d > 0)
    .x((d, i) => x(ARCS[i]))
    .y((d) => y(d))
    .curve(d3.curveMonotoneX);

  // Isolate / reset helpers (shared by line hover and legend hover)
  function isolate(safeId) {
    g.selectAll(".line")
      .transition()
      .duration(T.hover)
      .attr("opacity", T.dim)
      .attr("stroke-width", 1.5);
    g.selectAll(".dot")
      .transition()
      .duration(T.hover)
      .attr("opacity", T.dim)
      .attr("r", 3);
    g.selectAll(`.line-${safeId}`)
      .transition()
      .duration(T.hover)
      .attr("opacity", 1)
      .attr("stroke-width", 3.2);
    g.selectAll(`.dot-${safeId}`)
      .transition()
      .duration(T.hover)
      .attr("opacity", 1)
      .attr("r", 5);
  }
  function resetAll() {
    g.selectAll(".line")
      .transition()
      .duration(T.hover)
      .attr("opacity", 0.88)
      .attr("stroke-width", 2.2);
    g.selectAll(".dot")
      .transition()
      .duration(T.hover)
      .attr("opacity", 1)
      .attr("r", 4);
  }

  series.forEach((s, si) => {
    const safeId = s.name.replace(/[^a-zA-Z0-9]/g, "-");

    // Path with draw animation
    const path = g
      .append("path")
      .datum(s.values)
      .attr("class", `line line-${safeId}`)
      .attr("fill", "none")
      .attr("stroke", s.color)
      .attr("stroke-width", 2.2)
      .attr("opacity", 0.88)
      .attr("d", lineGen);

    const len = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${len} ${len}`)
      .attr("stroke-dashoffset", len)
      .transition()
      .duration(T.path)
      .ease(d3.easeLinear)
      .delay(si * 70)
      .attr("stroke-dashoffset", 0);

    // Dots per arc
    s.values.forEach((v, i) => {
      if (!v) return;
      g.append("circle")
        .attr("class", `dot dot-${safeId}`)
        .attr("cx", x(ARCS[i]))
        .attr("cy", y(v))
        .attr("r", 0)
        .attr("fill", s.color)
        .attr("stroke", C.bg)
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", (event) =>
          showTip(
            event,
            `
          <div class="tt-title">${s.name}</div>
          <div class="tt-row"><span class="tt-label">Arc</span><span class="tt-value">${ARCS[i]}</span></div>
          <div class="tt-row"><span class="tt-label">Bounty</span><span class="tt-value">฿${fmtBounty(v)}</span></div>
        `,
          ),
        )
        .on("mousemove", moveTip)
        .on("mouseout", hideTip)
        .transition()
        .delay(si * 70 + (i / (ARCS.length - 1)) * T.path)
        .duration(280)
        .ease(d3.easeBounceOut)
        .attr("r", 4);
    });
  });

  // Line hover isolation
  g.selectAll(".line")
    .on("mouseover", function () {
      const id = this.classList[1]?.replace("line-", "");
      if (id) isolate(id);
    })
    .on("mouseout", resetAll);

  // Right-side legend with hover-to-isolate
  const legG = svg
    .append("g")
    .attr("transform", `translate(${m.left + iw + 14}, ${m.top})`);

  ARC_DATA.forEach((s, i) => {
    const safeId = s.name.replace(/[^a-zA-Z0-9]/g, "-");
    const inSeries = series.some((d) => d.name === s.name);

    const row = legG
      .append("g")
      .attr("transform", `translate(0, ${i * 17})`)
      .style("cursor", inSeries ? "pointer" : "default")
      .attr("opacity", inSeries ? 1 : 0.28);

    row
      .append("line")
      .attr("x1", 0)
      .attr("y1", 6)
      .attr("x2", 12)
      .attr("y2", 6)
      .attr("stroke", s.color)
      .attr("stroke-width", 2);
    row
      .append("text")
      .attr("x", 16)
      .attr("y", 10)
      .attr("fill", s.color)
      .attr("font-size", 9.5)
      .text(s.name);

    if (inSeries) {
      row.on("mouseover", () => isolate(safeId)).on("mouseout", resetAll);
    }
  });

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .call((ax) => {
      ax.selectAll("text")
        .style("fill", C.textMid)
        .style("font-size", "11px")
        .attr("transform", "rotate(-18)")
        .attr("text-anchor", "end")
        .attr("dy", "0.5em");
      ax.select(".domain").attr("stroke", C.dim);
      ax.selectAll(".tick line").attr("stroke", C.dim);
    });

  // Y axis
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => fmtBounty(d)),
    )
    .call(styleAxis);

  svg
    .append("text")
    .attr("transform", `translate(14,${m.top + ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", C.textDim)
    .attr("font-size", 10)
    .text("Bounty (Berries)");
}
