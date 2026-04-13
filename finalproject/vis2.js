//  VIS 2 — Sunburst Chart
function drawVis2(chars, filter = "all") {
  const el = document.getElementById("vis2");
  el.innerHTML = "";
  _vis2Highlight = null;

  const dfUsers = chars.filter((c) => parseBounty(c.bounty) > 0 && isDFUser(c));

  // Build hierarchy
  const typeGroups = d3.group(dfUsers, (c) => getFruitType(c) || "Unknown");
  const hierarchyData = {
    name: "root",
    children: [...typeGroups.entries()].map(([type, members]) => ({
      name: type,
      children: members.map((c) => ({
        name: c.name,
        value: parseBounty(c.bounty),
      })),
    })),
  };

  const W = visWidth(el);
  const H = 380;
  const cx = W / 2;
  const cy = H / 2 + 12;
  const radius = Math.min(W * 0.4, H * 0.42);

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", W)
    .attr("height", H)
    .style("background", C.bg);

  svg
    .append("text")
    .attr("x", 12)
    .attr("y", 18)
    .attr("fill", C.textMid)
    .attr("font-size", 11)
    .text(
      "Devil Fruit Hierarchy",
    );

  const root = d3
    .hierarchy(hierarchyData)
    .sum((d) => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.partition().size([2 * Math.PI, radius])(root);

  const arcFn = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.006))
    .padRadius(radius / 2)
    .innerRadius((d) => d.y0 + (d.depth === 1 ? 8 : 4))
    .outerRadius((d) => Math.max(d.y0 + 8, d.y1 - 3));

  const typeColor = (d) => {
    const t = d.depth === 1 ? d.data.name : d.parent?.data.name;
    return FRUIT_COL[t] || C.none;
  };

  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  const paths = g
    .selectAll("path")
    .data(root.descendants().filter((d) => d.depth > 0))
    .enter()
    .append("path")
    .attr("fill", typeColor)
    .attr("fill-opacity", (d) => (d.depth === 1 ? 0.85 : 0.5))
    .attr("stroke", C.bg)
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer");

  // Entry: arcs sweep from startAngle → endAngle, staggered by depth
  paths
    .attr("d", (d) => arcFn({ ...d, x1: d.x0 }))
    .transition()
    .duration(T.arc)
    .ease(d3.easeExpOut)
    .delay((d) => d.depth * 180 + 40)
    .attrTween("d", function (d) {
      const interp = d3.interpolate(d.x0, d.x1);
      return (t) => arcFn({ ...d, x1: interp(t) });
    });

  // Center labels
  const centerG = g.append("g");
  const centerTitle = centerG
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.4em")
    .attr("fill", "#eee")
    .attr("font-size", 14)
    .attr("font-weight", "700")
    .text("All Devil Fruit Users");
  const centerSub = centerG
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1em")
    .attr("fill", C.textMid)
    .attr("font-size", 10)
    .text(`${dfUsers.length} characters`);
  const centerNote = centerG
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "2.4em")
    .attr("fill", C.textDim)
    .attr("font-size", 9)
    .text("");

  // Outer type-ring labels
  const labelG = g.append("g").attr("pointer-events", "none");
  root
    .descendants()
    .filter((d) => d.depth === 1)
    .forEach((d) => {
      const mid = (d.x0 + d.x1) / 2;
      const labelR = d.y1 + 16;
      labelG
        .append("text")
        .attr("x", Math.sin(mid) * labelR)
        .attr("y", -Math.cos(mid) * labelR)
        .attr(
          "text-anchor",
          Math.abs(Math.sin(mid)) < 0.2
            ? "middle"
            : Math.sin(mid) > 0
              ? "start"
              : "end",
        )
        .attr("dy", "0.35em")
        .attr("fill", FRUIT_COL[d.data.name] || C.none)
        .attr("font-size", 11)
        .attr("font-weight", "600")
        .attr("opacity", 0)
        .text(d.data.name)
        .transition()
        .delay(d.depth * 180 + T.arc * 0.65)
        .duration(T.fade)
        .attr("opacity", 1);
    });

  // Hover — dim siblings, update center
  paths
    .on("mouseover", function (event, d) {
      paths
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", (n) => {
          const sameType =
            d.depth === 1
              ? n.data.name === d.data.name ||
                n.parent?.data.name === d.data.name
              : n.parent?.data.name === d.parent?.data.name ||
                (n.depth === 1 && n.data.name === d.parent?.data.name);
          return n === d || sameType ? (n.depth === 1 ? 0.92 : 0.65) : T.dim;
        });

      const typeName = d.depth === 1 ? d.data.name : d.parent?.data.name;
      const count =
        d.depth === 1 ? d.descendants().filter((n) => n.depth === 2).length : 1;
      const bountyVal = d.depth === 1 ? d.value / count : d.data.value;

      centerTitle.text(d.data.name);
      centerSub.text(d.depth === 1 ? `${count} users` : typeName || "");
      centerNote.text(`฿${fmtBounty(bountyVal)}`);

      showTip(
        event,
        d.depth === 1
          ? `
        <div class="tt-title">${d.data.name}</div>
        <div class="tt-row"><span class="tt-label">Users</span><span class="tt-value">${count}</span></div>
        <div class="tt-row"><span class="tt-label">Avg Bounty</span><span class="tt-value">฿${fmtBounty(d.value / count)}</span></div>
        <div class="tt-row"><span class="tt-label">Total Bounty</span><span class="tt-value">฿${fmtBounty(d.value)}</span></div>
      `
          : `
        <div class="tt-title">${d.data.name}</div>
        <div class="tt-row"><span class="tt-label">Type</span><span class="tt-value">${typeName}</span></div>
        <div class="tt-row"><span class="tt-label">Bounty</span><span class="tt-value">฿${fmtBounty(d.data.value)}</span></div>
      `,
      );
    })
    .on("mousemove", moveTip)
    .on("mouseout", function () {
      paths
        .transition()
        .duration(T.hover)
        .attr("fill-opacity", (d) => (d.depth === 1 ? 0.85 : 0.5));
      centerTitle.text("All DF Users");
      centerSub.text(`${dfUsers.length} characters`);
      centerNote.text("");
      hideTip();
    });

  // Filter highlight function — stored for filter buttons
  _vis2Highlight = (typeName) => {
    if (typeName === "all") {
      paths
        .transition()
        .duration(T.zoom)
        .attr("fill-opacity", (d) => (d.depth === 1 ? 0.85 : 0.5));
      centerTitle.text("All DF Users");
      centerSub.text(`${dfUsers.length} characters`);
      centerNote.text("");
    } else {
      paths
        .transition()
        .duration(T.zoom)
        .attr("fill-opacity", (d) => {
          const t = d.depth === 1 ? d.data.name : d.parent?.data.name;
          return t?.toLowerCase() === typeName.toLowerCase()
            ? d.depth === 1
              ? 1
              : 0.75
            : 0.06;
        });
      const node = root.children?.find(
        (d) => d.data.name.toLowerCase() === typeName.toLowerCase(),
      );
      if (node) {
        const count = node.descendants().filter((n) => n.depth === 2).length;
        centerTitle.text(node.data.name);
        centerSub.text(`${count} users`);
        centerNote.text(`฿${fmtBounty(node.value / count)} avg`);
      }
    }
  };

  // Apply initial filter after entry animation completes
  if (filter !== "all") {
    setTimeout(() => {
      if (_vis2Highlight) _vis2Highlight(filter);
    }, T.arc + 400);
  }
}
