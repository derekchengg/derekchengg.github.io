//  VIS 4 — Crew Power Rankings
function drawVis4(chars, filter = "all") {
  const el = document.getElementById("vis4");
  el.innerHTML = "";
  _vis4Highlight = null;

  const withBounty = chars.filter((c) => parseBounty(c.bounty) > 0);
  const crewGroups = d3.group(withBounty, (c) => getCrewName(c));

  const crewData = [...crewGroups.entries()]
    .filter(([, m]) => m.length >= 2)
    .map(([name, members]) => {
      const dfMembers = members.filter(isDFUser);
      const avgBounty = mean(members.map((c) => parseBounty(c.bounty)));
      const dfRatio = dfMembers.length / members.length;
      return {
        name,
        members,
        avgBounty,
        dfRatio,
        total: members.length,
        dfCount: dfMembers.length,
      };
    })
    .sort((a, b) => b.avgBounty - a.avgBounty)
    .slice(0, 12);

  let data =
    filter === "df"
      ? crewData.filter((d) => d.dfRatio >= 0.5)
      : filter === "nondf"
        ? crewData.filter((d) => d.dfRatio < 0.5)
        : crewData;

  if (!data.length) data = crewData; // fallback

  const crewNames = crewData.map((d) => d.name);
  const crewColor = d3.scaleOrdinal().domain(crewNames).range(CREW_PALETTE);

  const W = visWidth(el);
  const H = Math.max(300, data.length * 36 + 90);
  const m = { top: 28, right: 110, bottom: 38, left: 168 };
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
    .text(
      "Crew Rankings",
    );

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const maxAvg = d3.max(data, (d) => d.avgBounty) || 1;
  const x = d3.scaleLinear().domain([0, maxAvg]).range([0, iw]).nice();
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([0, ih])
    .padding(0.3);

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
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "track")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", iw)
    .attr("height", y.bandwidth())
    .attr("fill", "#161616")
    .attr("rx", 3);

  // Full bar (total avg — faint)
  g.selectAll(".bar-total")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar-total")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", (d) => crewColor(d.name))
    .attr("fill-opacity", 0.55)
    .attr("rx", 3)
    .transition()
    .duration(T.bar)
    .ease(d3.easeExpOut)
    .delay((_, i) => i * T.stagger)
    .attr("width", (d) => x(d.avgBounty));

  // DF portion bar (bright)
  g.selectAll(".bar-df")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar-df")
    .attr("x", 0)
    .attr("y", (d) => y(d.name))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", (d) => crewColor(d.name))
    .attr("fill-opacity", 0.88)
    .attr("rx", 3)
    .transition()
    .duration(T.bar)
    .ease(d3.easeExpOut)
    .delay((_, i) => i * T.stagger + 100)
    .attr("width", (d) => x(d.avgBounty) * d.dfRatio);

  // Value labels
  g.selectAll(".vlabel")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "vlabel")
    .attr("x", (d) => x(d.avgBounty) + 6)
    .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", C.textMid)
    .attr("font-size", 10)
    .attr("opacity", 0)
    .text((d) => `฿${fmtBounty(d.avgBounty)} avg`)
    .transition()
    .delay((_, i) => i * T.stagger + T.bar * 0.7)
    .duration(T.fade)
    .attr("opacity", 1);

  // Y axis
  g.append("g")
    .call(d3.axisLeft(y))
    .call((ax) =>
      ax.selectAll("text").style("fill", "#c0c0c0").style("font-size", "11px"),
    )
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

  // Hover rows
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
      g.selectAll(".bar-total")
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", (b) => (b.name === d.name ? 0.35 : 0.06));
      g.selectAll(".bar-df")
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", (b) => (b.name === d.name ? 1 : 0.06));
      g.selectAll(".vlabel")
        .transition()
        .duration(T.hover)
        .attr("opacity", (b) => (b.name === d.name ? 1 : 0.15));
      const memberList = d.members
        .map((c) => c.name)
        .slice(0, 6)
        .join(", ");
      const extra =
        d.members.length > 6 ? ` +${d.members.length - 6} more` : "";
      showTip(
        event,
        `
        <div class="tt-title">${d.name}</div>
        <div class="tt-row"><span class="tt-label">Avg Bounty</span><span class="tt-value">฿${fmtBounty(d.avgBounty)}</span></div>
        <div class="tt-row"><span class="tt-label">Members</span><span class="tt-value">${d.total}</span></div>
        <div class="tt-row"><span class="tt-label">DF Users</span><span class="tt-value">${d.dfCount} (${Math.round(d.dfRatio * 100)}%)</span></div>
        <div class="tt-names">${memberList}${extra}</div>
      `,
      );
    })
    .on("mousemove", moveTip)
    .on("mouseout", function () {
      g.selectAll(".bar-total")
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", 0.55);
      g.selectAll(".bar-df")
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", 0.88);
      g.selectAll(".vlabel").transition().duration(T.hover).attr("opacity", 1);
      hideTip();
    });

  // Legend — top-right, inside the top margin so it's immediately visible
  const legItems = [
    ["rgba(255,255,255,0.65)", "DF Users"],
    ["rgba(255,255,255,0.18)", "Non-DF Members"],
  ];
  const legPad = 8;
  const legItemW = 138;
  const legH = 22;
  const legW = legPad + legItemW * 2;
  const legG = svg
    .append("g")
    .attr("transform", `translate(${W - legW - 8}, 4)`);

  legG
    .append("rect")
    .attr("width", legW)
    .attr("height", legH)
    .attr("fill", "#1a1a1a")
    .attr("stroke", C.border)
    .attr("stroke-width", 1)
    .attr("rx", 3);

  legItems.forEach(([col, lbl], i) => {
    const ox = legPad + i * legItemW;
    legG
      .append("rect")
      .attr("x", ox)
      .attr("y", (legH - 10) / 2)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", col)
      .attr("rx", 2);
    legG
      .append("text")
      .attr("x", ox + 14)
      .attr("y", legH / 2)
      .attr("dy", "0.35em")
      .attr("fill", C.textMid)
      .attr("font-size", 11)
      .text(lbl);
  });

  _vis4Highlight = (f) => {
    const activeNames = new Set(
      (f === "df"
        ? crewData.filter((d) => d.dfRatio >= 0.5)
        : f === "nondf"
          ? crewData.filter((d) => d.dfRatio < 0.5)
          : crewData
      ).map((d) => d.name),
    );
    g.selectAll(".bar-total")
      .transition()
      .duration(T.zoom)
      .attr("fill-opacity", (d) => (activeNames.has(d.name) ? 0.55 : 0.04));
    g.selectAll(".bar-df")
      .transition()
      .duration(T.zoom)
      .attr("fill-opacity", (d) => (activeNames.has(d.name) ? 0.88 : 0.04));
    g.selectAll(".vlabel")
      .transition()
      .duration(T.zoom)
      .attr("opacity", (d) => (activeNames.has(d.name) ? 1 : 0.08));
  };

  if (filter !== "all") {
    setTimeout(() => {
      if (_vis4Highlight) _vis4Highlight(filter);
    }, T.bar + 200);
  }
}
