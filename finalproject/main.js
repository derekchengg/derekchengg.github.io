// resizing
function setupResizeHandler() {
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (_chars.length) {
        try {
          drawVis1(_chars, _filters.vis1);
        } catch (e) {
          console.error("[vis1]", e);
        }
        try {
          drawVis2(_chars, _filters.vis2);
        } catch (e) {
          console.error("[vis2]", e);
        }
        try {
          drawVis3(_chars, _filters.vis3);
        } catch (e) {
          console.error("[vis3]", e);
        }
        try {
          drawVis4(_chars, _filters.vis4);
        } catch (e) {
          console.error("[vis4]", e);
        }
      }
      try {
        drawVis5(_filters.vis5);
      } catch (e) {
        console.error("[vis5]", e);
      }
      try {
        updateBountyCalculator();
      } catch (e) {
        console.error("[vis6]", e);
      }
    }, 250);
  });
}

// filters
function wireFilters(chars) {
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".chart-card");
      if (!card) return;
      card
        .querySelectorAll(".btn-filter")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const vis = btn.dataset.vis;
      const label = (btn.dataset.label || "").toLowerCase();
      const lblEl = card.querySelector('[id^="lbl-"]');
      if (lblEl) lblEl.textContent = btn.dataset.chart || "";

      if (vis === "vis1") {
        const f = label.includes("non")
          ? "nondf"
          : label.includes("devil")
            ? "df"
            : "all";
        _filters.vis1 = f;
        drawVis1(chars, f);
      } else if (vis === "vis2") {
        const f =
          ["paramecia", "zoan antique", "zoan mythique", "zoan", "logia"].find(
            (t) => label.includes(t),
          ) || "all";
        _filters.vis2 = f;
        // Use in-chart highlight when available (no redraw), else redraw
        if (_vis2Highlight) _vis2Highlight(f);
        else drawVis2(chars, f);
      } else if (vis === "vis3") {
        const f = label.includes("observ")
          ? "observation"
          : label.includes("armament")
            ? "armament"
            : label.includes("conqueror")
              ? "conquerors"
              : "all";
        _filters.vis3 = f;
        drawVis3(chars, f);
      } else if (vis === "vis4") {
        const f = label.includes("df-heavy")
          ? "df"
          : label.includes("non-df")
            ? "nondf"
            : "all";
        _filters.vis4 = f;
        // Use in-graph highlight when available (no restart), else redraw
        if (_vis4Highlight) _vis4Highlight(f);
        else drawVis4(chars, f);
      } else if (vis === "vis5") {
        const charNames = ARC_DATA.map((d) => d.name.toLowerCase());
        const found = charNames.find((n) => label.includes(n));
        _filters.vis5 = found || "all";
        drawVis5(found || "all");
      }
    });
  });
}

// main
(async function main() {
  setupScrollReveal();
  setupResizeHandler();

  setLoading("vis1", "Loading bounty data…");
  setLoading("vis2", "Loading devil fruit data…");
  setLoading("vis3", "Loading haki data…");
  setLoading("vis4", "Loading crew data…");

  drawVis5();

  const chars = await fetchAllCharacters();
  _chars = chars;

  if (!chars.length) {
    ["vis1", "vis2", "vis3", "vis4"].forEach((id) => {
      clearLoading(id);
      document.getElementById(id).textContent =
        "Failed to load — check console.";
    });
    return;
  }

  const safe = (id, fn) => {
    try {
      clearLoading(id);
      fn();
    } catch (e) {
      console.error(`[${id}]`, e);
      document.getElementById(id).textContent = "Render error — see console.";
    }
  };

  safe("vis1", () => drawVis1(chars));
  safe("vis2", () => drawVis2(chars));
  safe("vis4", () => drawVis4(chars));
  updateBountyCalculator();

  // Wire filter buttons and calculator controls immediately, before the haki
  // fetch so tabs for vis1/vis2/vis4/vis5 are responsive right away.
  wireFilters(chars);
  ["calc-df", "calc-obs", "calc-arm", "calc-con"].forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener("change", updateBountyCalculator);
  });

  const hakiTargets = chars.filter((c) => parseBounty(c.bounty) > 0).length;
  setLoading("vis3", `Loading haki data… 0 / ${hakiTargets}`);
  await fetchHakiData(chars, (done, total) => {
    setLoading("vis3", `Loading haki data… ${done} / ${total}`);
  });
  _hakiLoaded = true;
  safe("vis3", () => drawVis3(chars));
  updateBountyCalculator(); // re-render with full haki data
})();
