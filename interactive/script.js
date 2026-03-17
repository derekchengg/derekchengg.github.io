import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const WIDTH = 800;
const HEIGHT = 560;
const MAX_SHAPES = 20;

const svg = d3
  .select("#canvas")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .style("background", "#fff8f0");

const COLORS = [
  "#ff6b9d", "#c084fc", "#67e8f9", "#86efac",
  "#fbbf24", "#fb923c", "#a78bfa", "#34d399",
  "#f472b6", "#38bdf8",
];

const SHAPE_NAMES = [
  "", "", "Circle", "Triangle", "Square", "Pentagon",
  "Hexagon", "Heptagon", "Octagon", "Nonagon", "Decagon",
  "11-gon", "12-gon", "13-gon", "14-gon", "15-gon",
  "16-gon", "17-gon", "18-gon", "19-gon", "20-gon",
];

let clickCount = 0;
let shapes = []; // stack of { g, cx, cy }

function polygonPath(sides, r) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (2 * Math.PI * i) / sides - Math.PI / 2;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return "M" + pts.map(p => p.join(",")).join("L") + "Z";
}

function updateCounter() {
  document.getElementById("shapeCount").textContent = shapes.length;
  const next = clickCount < 2 ? "Circle" : SHAPE_NAMES[clickCount + 1] || "Circle";
  document.getElementById("nextShape").textContent = next;
}

// Only the last shape is clickable to remove
function refreshClickHandlers() {
  shapes.forEach((s, i) => {
    if (i === shapes.length - 1) {
      // Last shape: dashed outline + click to undo
      s.g.style("cursor", "pointer");
      s.g.select(".shape-outline").attr("stroke-dasharray", "4,3").attr("stroke-opacity", 1);
      s.g.on("click", function (e) {
        e.stopPropagation();
        const { g, cx, cy } = shapes[shapes.length - 1];
        g.transition().duration(200)
          .attr("transform", `translate(${cx},${cy}) scale(0)`)
          .remove();
        shapes.pop();
        clickCount--;
        refreshClickHandlers();
        updateCounter();
      });
    } else {
      // Not last: no click, no dashed outline
      s.g.style("cursor", "default");
      s.g.select(".shape-outline").attr("stroke-dasharray", null).attr("stroke-opacity", 0.5);
      s.g.on("click", null);
    }
  });
}

svg.on("click", function (event) {
  if (shapes.length >= MAX_SHAPES) return;

  const [cx, cy] = d3.pointer(event);
  clickCount++;

  const sides = clickCount <= 2 ? 0 : clickCount;
  const color = COLORS[(clickCount - 1) % COLORS.length];
  const r = 28;

  const g = svg.append("g")
    .attr("transform", `translate(${cx},${cy})`);

  // Draw shape
  let shape;
  if (sides === 0) {
    shape = g.append("circle")
      .classed("shape-outline", true)
      .attr("r", 0)
      .attr("fill", color)
      .attr("opacity", 0.85)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    shape.transition().duration(400).ease(d3.easeBounceOut).attr("r", r);
  } else {
    shape = g.append("path")
      .classed("shape-outline", true)
      .attr("d", polygonPath(sides, 0))
      .attr("fill", color)
      .attr("opacity", 0.85)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    shape.transition().duration(400).ease(d3.easeBounceOut).attr("d", polygonPath(sides, r));
  }

  // Label
  g.append("text")
    .attr("y", r + 16)
    .attr("text-anchor", "middle")
    .attr("fill", color)
    .attr("font-size", "11px")
    .attr("font-family", "Segoe UI, sans-serif")
    .attr("opacity", 0)
    .text(sides === 0 ? "Circle" : SHAPE_NAMES[sides])
    .transition().delay(300).duration(300).attr("opacity", 1);

  // Spin for polygons
  if (sides > 0) {
    let angle = 0;
    function rotate() {
      if (!g.node().isConnected) return;
      angle += sides <= 4 ? 0.4 : 0.2;
      shape.attr("transform", `rotate(${angle})`);
      requestAnimationFrame(rotate);
    }
    rotate();
  }

  shapes.push({ g, cx, cy });
  refreshClickHandlers();
  updateCounter();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  svg.selectAll("g").remove();
  shapes = [];
  clickCount = 0;
  updateCounter();
});

updateCounter();
