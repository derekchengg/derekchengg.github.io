//  VIS 1 — Animated Horizontal Bar Chart
function drawVis1(chars, filter = "all") {
  const el = document.getElementById("vis1");
  el.innerHTML = "";

  let data = chars.filter((c) => parseBounty(c.bounty) > 0);
  if (filter === "df") data = data.filter((c) => isDFUser(c));
  if (filter === "nondf") data = data.filter((c) => !isDFUser(c));
  data = data
    .sort((a, b) => parseBounty(b.bounty) - parseBounty(a.bounty))
    .slice(0, 15);

  const W = visWidth(el);
  const H = 440;
  // Measure the longest name so the left margin always fits
  const maxNameLen = d3.max(data, (d) => d.name.length) || 0;
  const leftMargin = Math.max(152, Math.min(maxNameLen * 7.2 + 16, 260));
  const m = { top: 12, right: 100, bottom: 40, left: leftMargin };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("background", C.bg);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const maxB = d3.max(data, (d) => parseBounty(d.bounty)) || 1;
  const x = d3.scaleLinear().domain([0, maxB]).range([0, iw]).nice();
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([0, ih])
    .padding(0.28);

  // Subtle vertical grid
  g.append("g")
    .call(d3.axisBottom(x).ticks(5).tickSize(ih).tickFormat(""))
    .attr("transform", "translate(0,0)")
    .call((ax) => ax.select(".domain").remove())
    .call((ax) =>
      ax
        .selectAll(".tick line")
        .attr("stroke", "#1c1c1c")
        .attr("stroke-dasharray", "3,4"),
    );

  // Bar background tracks
  g.selectAll(".track")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "track")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", iw)
    .attr("height", y.bandwidth())
    .attr("fill", "#171717")
    .attr("rx", 3);

  // Rank numbers
  g.selectAll(".rank")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "rank")
    .attr("x", -10)
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", C.textDim)
    .attr("font-size", 10)
    .text((d, i) => `#${i + 1}`);

  // Bars — animate width from 0
  const bars = g
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", (d) => (isDFUser(d) ? C.accent : "#3e3e58"))
    .attr("rx", 3)
    .attr("opacity", 0.92);

  bars
    .transition()
    .duration(T.bar)
    .ease(d3.easeExpOut)
    .delay((d, i) => i * T.stagger)
    .attr("width", (d) => x(parseBounty(d.bounty)));

  // Value labels — fade in after bar grows
  g.selectAll(".vlabel")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "vlabel")
    .attr("x", (d) => x(parseBounty(d.bounty)) + 6)
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", C.textMid)
    .attr("font-size", 11)
    .attr("opacity", 0)
    .text((d) => `฿${fmtBounty(parseBounty(d.bounty))}`)
    .transition()
    .delay((d, i) => i * T.stagger + T.bar * 0.55)
    .duration(T.fade)
    .attr("opacity", 1);

  // Invisible full-row hover targets
  g.selectAll(".hover-row")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "hover-row")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", iw)
    .attr("height", y.bandwidth())
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      g.selectAll(".bar").transition().duration(T.hover).attr("opacity", T.dim);
      g.selectAll(".bar")
        .filter((b) => b === d)
        .transition()
        .duration(T.hover)
        .attr("opacity", 1);
      const h = getHaki(d);
      const hakiStr =
        [
          h.observation && "Observation",
          h.armament && "Armament",
          h.conquerors && "Conqueror's",
        ]
          .filter(Boolean)
          .join(" · ") || "None";
      const f = d.fruit || d.devil_fruit || d.devilFruit;
      showTip(
        event,
        `
        <div class="tt-title">${d.name}</div>
        <div class="tt-row"><span class="tt-label">Bounty</span><span class="tt-value">฿${fmtBounty(parseBounty(d.bounty))}</span></div>
        <div class="tt-row"><span class="tt-label">Devil Fruit</span><span class="tt-value">${f ? f.name || getFruitType(d) || "Unknown" : "None"}</span></div>
        <div class="tt-row"><span class="tt-label">Crew</span><span class="tt-value">${getCrewName(d)}</span></div>
        <div class="tt-row"><span class="tt-label">Haki</span><span class="tt-value">${hakiStr}</span></div>
      `,
      );
    })
    .on("mousemove", moveTip)
    .on("mouseout", function () {
      g.selectAll(".bar").transition().duration(T.hover).attr("opacity", 0.92);
      hideTip();
    });

  // Y axis (character names)
  g.append("g")
    .call(d3.axisLeft(y))
    .call((ax) =>
      ax
        .selectAll("text")
        .style("fill", "#c0c0c0")
        .style("font-size", "11.5px"),
    )
    .call(removeAxisLines);

  // X axis
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickFormat((d) => fmtBounty(d)),
    )
    .call(styleAxis);

  // Legend
  const leg = svg
    .append("g")
    .attr("transform", `translate(${m.left},${H - 8})`);
  [
    [C.accent, "Devil Fruit User"],
    ["#3e3e58", "Non-Fruit User"],
  ].forEach(([col, lbl], i) => {
    const ox = i * 168;
    leg
      .append("rect")
      .attr("x", ox)
      .attr("y", -8)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", col)
      .attr("rx", 2);
    leg
      .append("text")
      .attr("x", ox + 14)
      .attr("y", 2)
      .attr("fill", C.textMid)
      .attr("font-size", 11)
      .text(lbl);
  });
}
