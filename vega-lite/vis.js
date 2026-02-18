const genreColors = {
  Action: "#e05c4b", Sports: "#f0a500", "Role-Playing": "#6a9fd8",
  Shooter: "#e8845a", Racing: "#8fbf6a", Platform: "#f2d04a",
  Puzzle: "#c47dbf", Simulation: "#5bbfbf", Fighting: "#d4905a",
  Adventure: "#6abf9a", Misc: "#aaaaaa", Strategy: "#9a8fd4"
};
const genreDomain = Object.keys(genreColors);
const genreRange  = Object.values(genreColors);

d3.csv("./dataset/videogames_wide.csv").then((data) => {

  // Visualization 1: Which platforms had the highest global sales, and how did sales break down by genre?

  const platforms1 = ["PS2","PS3","PS4","X360","Wii","DS","GBA","3DS","N64","NES","SNES","PC","PSP","GC","XB"];
  const vis1Data = [];
  data.forEach(d => {
    if (!platforms1.includes(d.Platform)) return;
    vis1Data.push({ Platform: d.Platform, Genre: d.Genre, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis1 = vl
    .markBar()
    .data(vis1Data)
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
        { field: "Platform",   type: "nominal" },
        { field: "Genre",      type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(420)
    .toSpec();

  vegaEmbed("#vis1", vis1, { actions: false });


  // Visualization 2: How did the popularity of different genres evolve over time?

  const vis2Data = [];
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    vis2Data.push({ Year: yr, Genre: d.Genre, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis2 = vl
    .markArea({ interpolate: "monotone", opacity: 0.9 })
    .data(vis2Data)
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
        { field: "Year",       type: "quantitative" },
        { field: "Genre",      type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(360)
    .toSpec();

  vegaEmbed("#vis2", vis2, { actions: false });


  // Visualization 3: How do sales in Japan vs North America compare for top-selling games?

  const vis3Data = [];
  data.forEach(d => {
    const na = parseFloat(d.NA_Sales) || 0;
    const jp = parseFloat(d.JP_Sales) || 0;
    if (na < 0.1 && jp < 0.1) return;
    vis3Data.push({
      Name:         d.Name,
      Platform:     d.Platform,
      Publisher:    d.Publisher === "Nintendo" ? "Nintendo" : "Other Publishers",
      NA_Sales:     na,
      JP_Sales:     jp,
      Global_Sales: parseFloat(d.Global_Sales) || 0
    });
  });

  const vis3 = vl
    .markPoint({ filled: true, opacity: 0.6, size: 40 })
    .data(vis3Data)
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
        { field: "Name",         type: "nominal" },
        { field: "Publisher",    type: "nominal" },
        { field: "Platform",     type: "nominal" },
        { field: "NA_Sales",     type: "quantitative", title: "NA Sales (M)",     format: ".2f" },
        { field: "JP_Sales",     type: "quantitative", title: "JP Sales (M)",     format: ".2f" },
        { field: "Global_Sales", type: "quantitative", title: "Global Sales (M)", format: ".2f" }
      ])
    )
    .width("container")
    .height(420)
    .toSpec();

  vegaEmbed("#vis3", vis3, { actions: false });


  // Visualization 4: How did the top publishers' annual sales evolve over time?
  
  const trackedPublishers = ["Nintendo","Electronic Arts","Activision","Ubisoft","Konami Digital Entertainment","Sega","Namco Bandai Games","THQ","Sony Computer Entertainment"];
  const publisherColors   = ["#e05c4b","#f0a500","#6a9fd8","#8fbf6a","#c47dbf","#f2d04a","#5bbfbf","#d4905a","#9a8fd4"];

  const vis4Data = [];
  data.forEach(d => {
    const yr = +d.Year;
    if (yr < 1990 || yr > 2016) return;
    if (!trackedPublishers.includes(d.Publisher)) return;
    vis4Data.push({ Year: yr, Publisher: d.Publisher, Sales: parseFloat(d.Global_Sales) || 0 });
  });

  const vis4 = vl
    .markLine({ interpolate: "monotone", strokeWidth: 2.5, point: true })
    .data(vis4Data)
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
        { field: "Year",       type: "quantitative" },
        { field: "Publisher",  type: "nominal" },
        { field: "TotalSales", type: "quantitative", title: "Sales (M)", format: ".1f" }
      ])
    )
    .width("container")
    .height(360)
    .toSpec();

  vegaEmbed("#vis4", vis4, { actions: false });

});