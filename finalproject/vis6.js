//  VIS 6 — Interactive Calculator
function updateBountyCalculator() {
  const el = document.getElementById("vis6");
  if (!el) return;

  if (!_chars.length) {
    el.innerHTML =
      '<div style="padding:2rem;color:#555;text-align:center;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.06em">Loading character data…</div>';
    return;
  }

  const dfType = document.getElementById("calc-df")?.value || "none";
  const hasObs = document.getElementById("calc-obs")?.checked || false;
  const hasArm = document.getElementById("calc-arm")?.checked || false;
  const hasCon = document.getElementById("calc-con")?.checked || false;

  const withBounty = _chars.filter((c) => parseBounty(c.bounty) > 0);
  const isDefault = dfType === "none" && !hasObs && !hasArm && !hasCon;

  // Exact match: DF type + Haki combo
  let similar = withBounty.filter((c) => {
    const dfMatch =
      dfType === "none" ? !isDFUser(c) : getFruitType(c) === dfType;
    if (!dfMatch) return false;
    if (_hakiLoaded) {
      const h = getHaki(c);
      if (hasObs && !h.observation) return false;
      if (hasArm && !h.armament) return false;
      if (hasCon && !h.conquerors) return false;
    }
    return true;
  });

  let noteText = _hakiLoaded
    ? ""
    : "Haki data still loading — Haki matching pending";
  if (_hakiLoaded && similar.length === 0) {
    // Relax to just DF type
    similar = withBounty.filter((c) =>
      dfType === "none" ? !isDFUser(c) : getFruitType(c) === dfType,
    );
    noteText = similar.length
      ? "No exact Haki match — showing DF type average"
      : "";
  }
  if (similar.length === 0) {
    similar = withBounty;
    noteText = "No data for this combo — showing overall average";
  }

  const estimated = Math.round(mean(similar.map((c) => parseBounty(c.bounty))));
  const sortedAll = withBounty
    .map((c) => parseBounty(c.bounty))
    .sort((a, b) => b - a);
  const rank = sortedAll.filter((b) => b > estimated).length + 1;
  const similarNames = new Set(similar.map((c) => c.name));
  const closest = withBounty.reduce(
    (best, c) =>
      Math.abs(parseBounty(c.bounty) - estimated) <
      Math.abs(parseBounty(best.bounty) - estimated)
        ? c
        : best,
    withBounty[0],
  );

  el.innerHTML = "";

  // ── Stats summary ──
  const statsDiv = document.createElement("div");
  statsDiv.style.cssText =
    "display:flex;gap:2.5rem;padding:0.4rem 0 1.4rem;flex-wrap:wrap;border-bottom:1px solid #1e1e1e;margin-bottom:1rem;";
  statsDiv.innerHTML = `
    <div>
      <div style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Estimated Bounty</div>
      <div style="font-size:2rem;font-weight:900;color:#cc2200;line-height:1">฿${fmtBounty(estimated)}</div>
      ${noteText ? `<div style="color:#666;font-size:10px;margin-top:4px">${noteText}</div>` : ""}
    </div>
    <div>
      <div style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Your Rank</div>
      <div style="font-size:2rem;font-weight:900;color:#ccc;line-height:1">#${rank}</div>
      <div style="color:#555;font-size:10px;margin-top:4px">of ${withBounty.length} pirates</div>
    </div>
    <div>
      <div style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Most Similar To</div>
      <div style="font-size:1.1rem;font-weight:700;color:#ccc;line-height:1.3">${!isDefault && closest ? closest.name : "—"}</div>
      <div style="color:#555;font-size:10px;margin-top:4px">${!isDefault && closest ? `฿${fmtBounty(parseBounty(closest.bounty))}` : ""}</div>
    </div>
    <div>
      <div style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">Based On</div>
      <div style="font-size:1.1rem;font-weight:700;color:#ccc;line-height:1.3">${similar.length} pirate${similar.length !== 1 ? "s" : ""}</div>
      <div style="color:#555;font-size:10px;margin-top:4px">with matching traits</div>
    </div>
  `;
  el.appendChild(statsDiv);

  // ── Ranking bar chart ──
  const top20 = [...withBounty]
    .sort((a, b) => parseBounty(b.bounty) - parseBounty(a.bounty))
    .slice(0, 20)
    .map((c) => ({
      name: c.name,
      _bounty: parseBounty(c.bounty),
      _isYou: false,
      _isSimilar: similarNames.has(c.name),
      _isDf: isDFUser(c),
    }));

  const youEntry = {
    name: "YOU",
    _bounty: estimated,
    _isYou: true,
    _isSimilar: false,
    _isDf: dfType !== "none",
  };
  const chartData = [...top20, youEntry]
    .sort((a, b) => b._bounty - a._bounty)
    .slice(0, 21);

  const W = visWidth(el);
  const H = Math.max(320, chartData.length * 22 + 80);
  const m = { top: 8, right: 95, bottom: 32, left: 132 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("background", C.bg);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const maxB = d3.max(chartData, (d) => d._bounty) || 1;
  const x = d3.scaleLinear().domain([0, maxB]).range([0, iw]).nice();
  const y = d3
    .scaleBand()
    .domain(chartData.map((d) => d.name))
    .range([0, ih])
    .padding(0.26);

  // Grid
  g.append("g")
    .call(d3.axisBottom(x).ticks(4).tickSize(ih).tickFormat(""))
    .call((ax) => ax.select(".domain").remove())
    .call((ax) =>
      ax
        .selectAll(".tick line")
        .attr("stroke", "#1c1c1c")
        .attr("stroke-dasharray", "3,4"),
    );

  // Track backgrounds
  g.selectAll(".track")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "track")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", iw)
    .attr("height", y.bandwidth())
    .attr("fill", (d) => (d._isYou ? "#1a0808" : "#141414"))
    .attr("rx", 3);

  // Bars
  g.selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", (d) =>
      d._isYou
        ? "#cc2200"
        : d._isSimilar
          ? C.accent
          : d._isDf
            ? "#4a4a7a"
            : "#3a3a4a",
    )
    .attr("opacity", (d) => (d._isYou ? 1 : d._isSimilar ? 0.85 : 0.55))
    .attr("width", 0)
    .transition()
    .duration(T.bar)
    .ease(d3.easeExpOut)
    .delay((_, i) => i * 26)
    .attr("width", (d) => x(d._bounty));

  // Value labels
  g.selectAll(".vlabel")
    .data(chartData)
    .enter()
    .append("text")
    .attr("class", "vlabel")
    .attr("x", (d) => x(d._bounty) + 5)
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", (d) =>
      d._isYou ? "#cc2200" : d._isSimilar ? C.accent : C.textMid,
    )
    .attr("font-size", (d) => (d._isYou ? 11 : 10))
    .attr("font-weight", (d) => (d._isYou ? "700" : "400"))
    .attr("opacity", 0)
    .text((d) => `฿${fmtBounty(d._bounty)}`)
    .transition()
    .delay((_, i) => i * 26 + T.bar * 0.6)
    .duration(T.fade)
    .attr("opacity", 1);

  // Y axis (names)
  g.append("g")
    .call(d3.axisLeft(y))
    .call((ax) => {
      ax.selectAll("text")
        .style("fill", function (name) {
          const entry = chartData.find((c) => c.name === name);
          return entry?._isYou
            ? "#cc2200"
            : entry?._isSimilar
              ? C.accent
              : "#b0b0b0";
        })
        .style("font-size", "10.5px")
        .style("font-weight", function (name) {
          return chartData.find((c) => c.name === name)?._isYou ? "900" : "400";
        });
    })
    .call(removeAxisLines);

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(4)
        .tickFormat((d) => fmtBounty(d)),
    )
    .call(styleAxis);

  // Legend
  const legData = [
    ["#cc2200", "You"],
    [C.accent, "Similar pirates"],
    ["#4a4a7a", "DF users"],
    ["#3a3a4a", "Non-DF users"],
  ];
  const legG = svg
    .append("g")
    .attr("transform", `translate(${m.left}, ${H - 6})`);
  legData.forEach(([col, lbl], i) => {
    const ox = i * 130;
    legG
      .append("rect")
      .attr("x", ox)
      .attr("y", -8)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", col)
      .attr("rx", 2);
    legG
      .append("text")
      .attr("x", ox + 14)
      .attr("y", 2)
      .attr("fill", C.textMid)
      .attr("font-size", 10)
      .text(lbl);
  });
}
