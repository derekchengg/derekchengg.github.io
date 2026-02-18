const genreColors = {
  Action: "#e05c4b", Sports: "#f0a500", "Role-Playing": "#6a9fd8",
  Shooter: "#e8845a", Racing: "#8fbf6a", Platform: "#f2d04a",
  Puzzle: "#c47dbf", Simulation: "#5bbfbf", Fighting: "#d4905a",
  Adventure: "#6abf9a", Misc: "#aaaaaa", Strategy: "#9a8fd4"
};
const genreDomain = Object.keys(genreColors);
const genreRange = Object.values(genreColors);

d3.csv("./dataset/videogames_wide.csv").then((data) => {

  // Visualization 1A: Total sales by platform and genre (stacked bar chart)

  const platforms1 = ["PS2", "PS3", "PS4", "X360", "Wii", "DS", "GBA", "3DS", "N64", "NES", "SNES", "PC", "PSP", "GC", "XB"];
  const vis1aData = [];
  data.forEach(d => {
    if (!platforms1.includes(d.Platform)) return;
    vis1aData.push({ Platform: d.Platform, Genre: d.Genre, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis1a = vl
    .markBar()
    .data(vis1aData)
    .transform(
      vl.aggregate({ op: "sum", field: "Sales", as: "TotalSales" }).groupby(["Platform", "Genre"]),
      vl.joinaggregate({ op: "sum", field: "TotalSales", as: "PlatformTotal" }).groupby(["Platform"])
    )
    .encode(
      vl.y().fieldN("Platform").sort({ field: "PlatformTotal", order: "descending" }).title(null),
      vl.x().fieldQ("TotalSales").title("Global Sales (Millions)"),
      vl.color()
        .fieldN("Genre")
        .scale({ domain: genreDomain, range: genreRange })
        .legend({ title: "Genre", orient: "bottom", columns: 6 }),
      vl.order().fieldQ("TotalSales").sort("descending"),
      vl.tooltip([
        { field: "Platform", type: "nominal" },
        { field: "Genre", type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(420)
    .toSpec();

  vegaEmbed("#vis1a", vis1a, { actions: false });

  //  Visualization 1B: Average sales per game by genre (bar chart)

  const vis1b = vl
    .markBar()
    .data(data)
    .transform(
      vl.aggregate({ op: "mean", field: "Global_Sales", as: "AvgSales" }).groupby(["Genre"])
    )
    .encode(
      vl.y().fieldN("Genre").sort("-x").title(null),
      vl.x().fieldQ("AvgSales").title("Average Sales per Game (Millions)"),
      vl.color()
        .fieldN("Genre")
        .scale({ domain: genreDomain, range: genreRange })
        .legend(null),
      vl.tooltip([
        { field: "Genre", type: "nominal" },
        { field: "AvgSales", type: "quantitative", title: "Avg Sales (M)", format: ".2f" }
      ])
    )
    .width("container")
    .height(340)
    .toSpec();

  vegaEmbed("#vis1b", vis1b, { actions: false });

  //  Visualization 2A: Annual sales trends by genre (stacked area chart)

  const vis2aData = [];
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    vis2aData.push({ Year: yr, Genre: d.Genre, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis2a = vl
    .markArea({ interpolate: "monotone", opacity: 0.9 })
    .data(vis2aData)
    .transform(
      vl.aggregate({ op: "sum", field: "Sales", as: "TotalSales" }).groupby(["Year", "Genre"])
    )
    .encode(
      vl.x().fieldQ("Year").title("Year").axis({ format: "d", tickCount: 10 }),
      vl.y().fieldQ("TotalSales").stack("zero").title("Global Sales (Millions)"),
      vl.color()
        .fieldN("Genre")
        .scale({ domain: genreDomain, range: genreRange })
        .legend({ title: "Genre", orient: "bottom", columns: 6 }),
      vl.order().fieldN("Genre"),
      vl.tooltip([
        { field: "Year", type: "quantitative" },
        { field: "Genre", type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(360)
    .toSpec();

  vegaEmbed("#vis2a", vis2a, { actions: false });

  //  Visualization 2B: Number of games released per year (line chart)

  const vis2bData = [];
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    vis2bData.push({ Year: yr });
  });

  const vis2b = vl
    .markLine({ interpolate: "monotone", strokeWidth: 2.5, point: true, color: "#e05c4b" })
    .data(vis2bData)
    .transform(
      vl.aggregate({ op: "count", as: "GameCount" }).groupby(["Year"])
    )
    .encode(
      vl.x().fieldQ("Year").title("Year").axis({ format: "d", tickCount: 10 }),
      vl.y().fieldQ("GameCount").title("Number of Games Released"),
      vl.tooltip([
        { field: "Year", type: "quantitative" },
        { field: "GameCount", type: "quantitative", title: "Games Released" }
      ])
    )
    .width("container")
    .height(300)
    .toSpec();

  vegaEmbed("#vis2b", vis2b, { actions: false });

  // Visualization 3A: NA vs JP sales for top-selling games (point size = global sales, color = Nintendo vs others)

  const vis3aData = [];
  data.forEach(d => {
    const na = parseFloat(d.NA_Sales) || 0;
    const jp = parseFloat(d.JP_Sales) || 0;
    if (na < 0.1 && jp < 0.1) return;
    vis3aData.push({
      Name: d.Name,
      Platform: d.Platform,
      Publisher: d.Publisher === "Nintendo" ? "Nintendo" : "Other Publishers",
      NA_Sales: na,
      JP_Sales: jp,
      Global_Sales: parseFloat(d.Global_Sales) || 0
    });
  });

  const vis3a = vl
    .markPoint({ filled: true, opacity: 0.6, size: 40 })
    .data(vis3aData)
    .encode(
      vl.x().fieldQ("NA_Sales").title("North America Sales (Millions)").scale({ type: "sqrt" }),
      vl.y().fieldQ("JP_Sales").title("Japan Sales (Millions)").scale({ type: "sqrt" }),
      vl.color()
        .fieldN("Publisher")
        .scale({ domain: ["Nintendo", "Other Publishers"], range: ["#e05c4b", "#aaaaaa"] })
        .legend({ title: "Publisher" }),
      vl.size()
        .fieldQ("Global_Sales")
        .scale({ range: [20, 400] })
        .legend({ title: "Global Sales (M)" }),
      vl.tooltip([
        { field: "Name", type: "nominal" },
        { field: "Publisher", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "NA_Sales", type: "quantitative", title: "NA Sales (M)", format: ".2f" },
        { field: "JP_Sales", type: "quantitative", title: "JP Sales (M)", format: ".2f" },
        { field: "Global_Sales", type: "quantitative", title: "Global Sales (M)", format: ".2f" }
      ])
    )
    .width("container")
    .height(420)
    .toSpec();

  vegaEmbed("#vis3a", vis3a, { actions: false });


  // Visualization 3B: Regional sales breakdown for top platforms

  const vis3bRows = [];
  data.forEach(d => {
    if (!platforms1.includes(d.Platform)) return;
    const regions = {
      NA: parseFloat(d.NA_Sales) || 0,
      EU: parseFloat(d.EU_Sales) || 0,
      JP: parseFloat(d.JP_Sales) || 0,
      Other: parseFloat(d.Other_Sales) || 0,
    };
    Object.entries(regions).forEach(([region, sales]) => {
      vis3bRows.push({ Platform: d.Platform, Region: region, Sales: sales });
    });
  });

  const p3bAgg = {};
  vis3bRows.forEach(({ Platform, Region, Sales }) => {
    if (!p3bAgg[Platform]) p3bAgg[Platform] = { NA: 0, EU: 0, JP: 0, Other: 0, Total: 0 };
    p3bAgg[Platform][Region] += Sales;
    p3bAgg[Platform].Total += Sales;
  });

  const vis3bFlat = [];
  Object.entries(p3bAgg).forEach(([Platform, vals]) => {
    ["NA", "EU", "JP", "Other"].forEach(region => {
      vis3bFlat.push({ Platform, Region: region, TotalSales: vals[region], PlatformTotal: vals.Total });
    });
  });

  const plt3bSortOrder = platforms1
    .filter(p => p3bAgg[p])
    .sort((a, b) => p3bAgg[b].Total - p3bAgg[a].Total);

  const vis3b = vl
    .markBar({ cornerRadiusTopRight: 3, cornerRadiusTopLeft: 3 })
    .data(vis3bFlat)
    .encode(
      vl.row()
        .fieldN("Region")
        .sort(["NA", "EU", "JP", "Other"])
        .title(null)
        .header({ labelFontSize: 12, labelAngle: 0, labelAlign: "left" }),
      vl.x()
        .fieldN("Platform")
        .sort(plt3bSortOrder)
        .title(null)
        .axis({ labelFontSize: 10, labelAngle: 0 }),
      vl.y()
        .fieldQ("TotalSales")
        .title("Sales (Millions)")
        .axis({ labelFontSize: 10, tickCount: 4 }),
      vl.color()
        .fieldN("Region")
        .scale({ domain: ["NA", "EU", "JP", "Other"], range: ["#e05c4b", "#6a9fd8", "#f0a500", "#6abf9a"] })
        .legend({ title: "Region", orient: "bottom", columns: 4, labelFrontSize: 12 }),
      vl.tooltip([
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .toSpec();

  vegaEmbed("#vis3b", { ...vis3b, config: { view: { stroke: null }, axis: { grid: false } } }, { actions: false });

  //  Visualization 4A: Annual sales trends for top publishers (1990-2016)

  const trackedPublishers = [
    "Nintendo", "Electronic Arts", "Activision", "Ubisoft",
    "Konami Digital Entertainment", "Sega", "Namco Bandai Games",
    "THQ", "Sony Computer Entertainment"
  ];
  const publisherColors = [
    "#e05c4b", "#f0a500", "#6a9fd8", "#8fbf6a",
    "#c47dbf", "#f2d04a", "#5bbfbf", "#d4905a", "#9a8fd4"
  ];

  const vis4aData = [];
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    if (!trackedPublishers.includes(d.Publisher)) return;
    vis4aData.push({ Year: yr, Publisher: d.Publisher, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis4a = vl
    .markLine({ interpolate: "monotone", strokeWidth: 2.5, point: true })
    .data(vis4aData)
    .transform(
      vl.aggregate({ op: "sum", field: "Sales", as: "TotalSales" }).groupby(["Year", "Publisher"])
    )
    .encode(
      vl.x().fieldQ("Year").title("Year").axis({ format: "d", tickCount: 10 }),
      vl.y().fieldQ("TotalSales").title("Annual Sales (Millions)"),
      vl.color()
        .fieldN("Publisher")
        .scale({ domain: trackedPublishers, range: publisherColors })
        .legend({ title: "Publisher", orient: "bottom", columns: 3 }),
      vl.tooltip([
        { field: "Year", type: "quantitative" },
        { field: "Publisher", type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(360)
    .toSpec();

  vegaEmbed("#vis4a", vis4a, { actions: false });


  //  Visualization 4B: Publisher rank by annual sales (1 = highest sales that year, etc.)

  const pubYearMap = {};
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    if (!trackedPublishers.includes(d.Publisher)) return;
    const sales = parseFloat(d.Global_Sales) || 0;
    if (!pubYearMap[d.Publisher]) pubYearMap[d.Publisher] = {};
    pubYearMap[d.Publisher][yr] = (pubYearMap[d.Publisher][yr] || 0) + sales;
  });

  const years4b = Array.from({ length: 27 }, (_, i) => 1990 + i);
  const rankRows = [];

  years4b.forEach(yr => {
    const yearSales = trackedPublishers.map(pub => ({
      Publisher: pub,
      Sales: (pubYearMap[pub] && pubYearMap[pub][yr]) || 0
    }));

    yearSales
      .sort((a, b) => b.Sales - a.Sales)
      .forEach((d, i) => {
        rankRows.push({
          Year: yr,
          Publisher: d.Publisher,
          Sales: d.Sales,
          Rank: i + 1
        });
      });
  });

  const lineLayer = vl
    .markLine({ interpolate: "monotone", strokeWidth: 2.5, opacity: 0.9 })
    .encode(
      vl.x()
        .fieldQ("Year")
        .title("Year")
        .axis({ format: "d", tickCount: 10, labelFontSize: 11 }),
      vl.y()
        .fieldQ("Rank")
        .title("Rank (1 = highest sales)")
        .scale({ domain: [1, trackedPublishers.length] })
        .axis({ values: Array.from({ length: trackedPublishers.length }, (_, i) => i + 1), labelFontSize: 11 }),
      vl.color()
        .fieldN("Publisher")
        .scale({ domain: trackedPublishers, range: publisherColors })
        .legend({ title: "Publisher", orient: "bottom", columns: 3, labelFontSize: 11 }),
      vl.tooltip([
        { field: "Publisher", type: "nominal" },
        { field: "Year", type: "quantitative" },
        { field: "Rank", type: "quantitative", title: "Rank" },
        { field: "Sales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    );

  const dotLayer = vl
    .markPoint({ filled: true, size: 50, opacity: 0.9 })
    .encode(
      vl.x().fieldQ("Year"),
      vl.y().fieldQ("Rank"),
      vl.color()
        .fieldN("Publisher")
        .scale({ domain: trackedPublishers, range: publisherColors })
        .legend(null),
      vl.tooltip([
        { field: "Publisher", type: "nominal" },
        { field: "Year", type: "quantitative" },
        { field: "Rank", type: "quantitative", title: "Rank" },
        { field: "Sales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    );

  const vis4b = vl
    .layer(lineLayer, dotLayer)
    .data(rankRows)
    .width("container")
    .height(360)
    .toSpec();

  vegaEmbed("#vis4b", { ...vis4b, config: { view: { stroke: null }, axis: { grid: true, gridColor: "#f0f0f0", domainColor: "#ccc" } } }, { actions: false });

});