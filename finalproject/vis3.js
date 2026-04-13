//  VIS 3 — Haki Venn Diagram + side bars
function drawVis3(chars, filter = "all") {
  const el = document.getElementById("vis3");
  el.innerHTML = "";

  const W = visWidth(el);
  const H = 500;

  const keys = ["O", "A", "C", "OA", "OC", "AC", "OAC"];
  const buckets = {};
  const names = {};
  keys.forEach((k) => {
    buckets[k] = [];
    names[k] = [];
  });

  chars.forEach((c) => {
    const b = parseBounty(c.bounty);
    if (!b) return;
    const { observation: o, armament: a, conquerors: co } = getHaki(c);
    let k;
    if (o && a && co) k = "OAC";
    else if (o && a) k = "OA";
    else if (o && co) k = "OC";
    else if (a && co) k = "AC";
    else if (o) k = "O";
    else if (a) k = "A";
    else if (co) k = "C";
    else return;
    buckets[k].push(b);
    names[k].push(c.name);
  });

  const avgBucket = (k) => mean(buckets[k]);

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
    .text("Haki Overlap");

  const vennW = W * 0.68;
  const cx = vennW / 2;
  const cy = H / 2 + 14;
  const r = Math.min(vennW * 0.17, H * 0.23);

  const circs = [
    {
      key: "O",
      cx: cx - r * 0.5,
      cy: cy - r * 0.34,
      label: "Observation",
      col: C.obs,
    },
    {
      key: "A",
      cx: cx + r * 0.5,
      cy: cy - r * 0.34,
      label: "Armament",
      col: C.arm,
    },
    { key: "C", cx: cx, cy: cy + r * 0.46, label: "Conqueror's", col: C.con },
  ];

  const isActive = (ci) => {
    if (filter === "all") return true;
    const fl = filter.toLowerCase();
    return (
      fl.startsWith(ci.label.toLowerCase().slice(0, 3)) ||
      fl === ci.key.toLowerCase()
    );
  };

  // Draw venn circles with bounce entry — save refs for later hover wiring
  const circleEls = [];
  circs.forEach((ci, i) => {
    const active = isActive(ci);
    const circ = svg
      .append("circle")
      .attr("cx", ci.cx)
      .attr("cy", ci.cy)
      .attr("r", 0)
      .attr("fill", ci.col)
      .attr("fill-opacity", active ? 0.28 : 0.06)
      .attr("stroke", ci.col)
      .attr("stroke-width", active ? 1.5 : 0.5)
      .attr("stroke-opacity", active ? 0.9 : 0.2)
      .style("cursor", "pointer");
    circ
      .transition()
      .duration(T.bounce)
      .ease(d3.easeCubicOut)
      .delay(i * 110)
      .attr("r", r);
    circleEls.push(circ);

    const angles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.5];
    const labelDist = r * 1.18;
    svg
      .append("text")
      .attr("x", ci.cx + Math.cos(angles[i]) * labelDist * 0.5)
      .attr("y", ci.cy + Math.sin(angles[i]) * labelDist * 0.55)
      .attr("text-anchor", "middle")
      .attr("fill", active ? "#d0d0d0" : "#3a3a3a")
      .attr("font-size", 11.5)
      .attr("opacity", 0)
      .text(ci.label)
      .transition()
      .delay(i * 110 + 380)
      .duration(T.fade)
      .attr("opacity", 1);
  });

  // Conqueror's is drawn last (index 2) so it sits on top in SVG order —
  // lower it behind Observation and Armament so the OA intersection isn't covered.
  circleEls[2]?.lower();

  // Side bar data
  const sideData = [
    { label: "All 3", key: "OAC", col: "#9b3a3a" },
    { label: "Obs + Arm", key: "OA", col: "#3a5a7a" },
    { label: "Obs + Con", key: "OC", col: "#5a3a7a" },
    { label: "Arm + Con", key: "AC", col: "#2e6b4a" },
    { label: "Obs only", key: "O", col: C.obs },
    { label: "Arm only", key: "A", col: C.arm },
    { label: "Con only", key: "C", col: C.con },
  ].filter((d) => buckets[d.key].length > 0);

  let sideBars = null;
  let sideLabels = null;

  if (sideData.length) {
    const sx0 = W * 0.74;
    const sw = W - sx0 - 12;
    const sRowH = (H - 52) / sideData.length;
    const maxAvg = d3.max(sideData, (d) => avgBucket(d.key)) || 1;
    const sg = svg.append("g").attr("transform", `translate(${sx0},30)`);

    sg.append("text")
      .attr("fill", C.textDim)
      .attr("font-size", 9.5)
      .attr("y", -9)
      .text("Avg Bounty");

    sideLabels = sg
      .selectAll(".sl")
      .data(sideData)
      .enter()
      .append("text")
      .attr("class", "sl")
      .attr("x", 0)
      .attr("y", (d, i) => i * sRowH + sRowH * 0.52 * 0.5 + 4)
      .attr("fill", "#999")
      .attr("font-size", 9.5)
      .text((d) => d.label);

    sg.selectAll(".sb-bg")
      .data(sideData)
      .enter()
      .append("rect")
      .attr("class", "sb-bg")
      .attr("x", 62)
      .attr("y", (d, i) => i * sRowH)
      .attr("width", sw - 62)
      .attr("height", sRowH * 0.52)
      .attr("fill", "#181818")
      .attr("rx", 2);

    sideBars = sg
      .selectAll(".sb")
      .data(sideData)
      .enter()
      .append("rect")
      .attr("class", "sb")
      .attr("data-key", (d) => d.key)
      .attr("x", 62)
      .attr("y", (d, i) => i * sRowH)
      .attr("width", 0)
      .attr("height", sRowH * 0.52)
      .attr("fill", (d) => d.col)
      .attr("rx", 2)
      .attr("opacity", 0.8);

    sideBars
      .transition()
      .duration(T.bar)
      .ease(d3.easeExpOut)
      .delay((d, i) => i * 55 + 560)
      .attr("width", (d) => (avgBucket(d.key) / maxAvg) * (sw - 62));
  }

  // Circle hover — highlight one Haki type, sync side bars
  circleEls.forEach((circ, i) => {
    const ci = circs[i];
    circ
      .on("mouseover", function (event) {
        circleEls.forEach((c, j) =>
          c
            .transition()
            .duration(T.hover)
            .attr("fill-opacity", j === i ? 0.55 : T.dim)
            .attr("stroke-opacity", j === i ? 1 : 0.08),
        );
        if (sideBars)
          sideBars
            .transition()
            .duration(T.hover)
            .attr("opacity", (d) => (d.key === ci.key ? 1 : 0.12));
        if (sideLabels)
          sideLabels
            .transition()
            .duration(T.hover)
            .attr("fill", (d) => (d.key === ci.key ? "#eee" : C.textDim));
        const count = buckets[ci.key].length;
        const avgVal = avgBucket(ci.key);
        const top6 = names[ci.key].slice(0, 6).join(", ");
        const extra =
          names[ci.key].length > 6 ? ` +${names[ci.key].length - 6} more` : "";
        showTip(
          event,
          `
          <div class="tt-title">${ci.label} Haki</div>
          <div class="tt-row"><span class="tt-label">Exclusive users</span><span class="tt-value">${count}</span></div>
          <div class="tt-row"><span class="tt-label">Avg Bounty</span><span class="tt-value">฿${fmtBounty(avgVal)}</span></div>
          ${count > 0 ? `<div class="tt-names">${top6}${extra}</div>` : ""}
        `,
        );
      })
      .on("mousemove", moveTip)
      .on("mouseout", function () {
        circleEls.forEach((c, j) =>
          c
            .transition()
            .duration(T.hover)
            .attr("fill-opacity", isActive(circs[j]) ? 0.28 : 0.06)
            .attr("stroke-opacity", isActive(circs[j]) ? 0.9 : 0.2),
        );
        if (sideBars)
          sideBars.transition().duration(T.hover).attr("opacity", 0.8);
        if (sideLabels)
          sideLabels.transition().duration(T.hover).attr("fill", "#999");
        hideTip();
      });
  });

  // Intersection label positions + hover with side-bar sync
  const labelPos = [
    { x: circs[0].cx - r * 0.5, y: circs[0].cy - r * 0.1, key: "O" },
    { x: circs[1].cx + r * 0.5, y: circs[1].cy - r * 0.1, key: "A" },
    { x: circs[2].cx, y: circs[2].cy + r * 0.38, key: "C" },
    { x: cx, y: circs[0].cy - r * 0.14, key: "OA" },
    { x: circs[0].cx - r * 0.1, y: cy + r * 0.36, key: "OC" },
    { x: circs[1].cx + r * 0.1, y: cy + r * 0.36, key: "AC" },
    { x: cx, y: cy + r * 0.14, key: "OAC", bold: true },
  ];

  const KEY_LABELS = { O: "Observation", A: "Armament", C: "Conqueror's" };
  const keyToLabel = (k) =>
    k
      .split("")
      .map((c) => KEY_LABELS[c])
      .filter(Boolean)
      .join(" + ");

  labelPos.forEach(({ x, y, key, bold }) => {
    const count = buckets[key].length;
    const avgVal = avgBucket(key);
    const grp = svg.append("g").style("cursor", "pointer").attr("opacity", 0);

    // Transparent hit rect so the hover area is larger than the text
    grp
      .append("rect")
      .attr("x", x - 40)
      .attr("y", y - 20)
      .attr("width", 80)
      .attr("height", 46)
      .attr("fill", "none")
      .style("pointer-events", "all");

    grp
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("fill", "#eeeeee")
      .attr("font-size", bold ? 14 : 11.5)
      .attr("font-weight", bold ? "700" : "400")
      .text(count);
    if (avgVal > 0) {
      grp
        .append("text")
        .attr("x", x)
        .attr("y", y + 17)
        .attr("text-anchor", "middle")
        .attr("fill", C.textMid)
        .attr("font-size", 9)
        .text(`฿${fmtBounty(avgVal)}`);
    }
    grp.transition().delay(480).duration(T.fade).attr("opacity", 1);

    grp
      .on("mouseover", (event) => {
        // Sync side bars — highlight matching row
        if (sideBars)
          sideBars
            .transition()
            .duration(T.hover)
            .attr("opacity", (d) => (d.key === key ? 1 : 0.15));
        if (sideLabels)
          sideLabels
            .transition()
            .duration(T.hover)
            .attr("fill", (d) => (d.key === key ? "#eee" : C.textDim));

        const top8 = names[key].slice(0, 8).join(", ");
        const extra =
          names[key].length > 8 ? ` +${names[key].length - 8} more` : "";
        showTip(
          event,
          `
          <div class="tt-title">${keyToLabel(key)}</div>
          <div class="tt-row"><span class="tt-label">Users</span><span class="tt-value">${count}</span></div>
          <div class="tt-row"><span class="tt-label">Avg Bounty</span><span class="tt-value">฿${fmtBounty(avgVal)}</span></div>
          ${count > 0 ? `<div class="tt-names">${top8}${extra}</div>` : ""}
        `,
        );
      })
      .on("mousemove", moveTip)
      .on("mouseout", () => {
        if (sideBars)
          sideBars.transition().duration(T.hover).attr("opacity", 0.8);
        if (sideLabels)
          sideLabels.transition().duration(T.hover).attr("fill", "#999");
        hideTip();
      });
  });
}
