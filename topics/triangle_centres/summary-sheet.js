(function () {
window.renderJM28SummaryLines = function renderJM28SummaryLines() {
  return (
    '<section class="jm28-sheet" aria-label="Special lines in a triangle">' +
    '  <div class="jm28-sheet-banner">' +
    bulbSvg() +
    '    <div class="jm28-ribbon">' +
    '      <h2>Special Lines in a Triangle</h2>' +
    '      <p>三角形的特殊線</p>' +
    "    </div>" +
    bulbSvg() +
    "  </div>" +
    '  <p class="jm28-quote">“ Four lines every triangle uses: median, altitude, angle bisector, and perpendicular bisector. ”</p>' +
    '  <div class="jm28-sheet-grid">' +
    card(
      "median",
      "Median",
      "中線",
      medianSvg(),
      "Joins a vertex to the midpoint of the opposite side.",
      "連頂點與對邊中點。",
      ""
    ) +
    card(
      "altitude",
      "Altitude",
      "高線",
      altitudeSvg(),
      "From a vertex, perpendicular to the opposite side.",
      "由頂點垂直於對邊。",
      ""
    ) +
    card(
      "bisector",
      "Angle bisector",
      "角平分線",
      bisectorSvg(),
      "A ray from a vertex that splits the angle in half.",
      "由頂點出發，把該角分成兩個相等的角。",
      ""
    ) +
    card(
      "perp",
      "Perpendicular bisector",
      "垂直平分線",
      perpSvg(),
      "Through the midpoint of a side, at right angles to that side.",
      "經過一邊的中點，並且垂直於該邊。",
      "Need not pass through the opposite vertex. 不必經過對角頂點。"
    ) +
    "  </div>" +
    '  <span class="jm28-star jm28-star-a" aria-hidden="true"></span>' +
    '  <span class="jm28-star jm28-star-b" aria-hidden="true"></span>' +
    "</section>"
  );
};

window.renderJM28SummaryCentres = function renderJM28SummaryCentres() {
  return centresSheet();
};

window.renderJM28SummaryAngles = function renderJM28SummaryAngles() {
  return (
    '<section class="jm28-sheet" aria-label="Angle pairs with a transversal">' +
    '  <div class="jm28-sheet-banner">' +
    bulbSvg() +
    '    <div class="jm28-ribbon">' +
    "      <h2>Angle Pairs</h2>" +
    "      <p>角對</p>" +
    "    </div>" +
    bulbSvg() +
    "  </div>" +
    '  <p class="jm28-quote">“ One transversal. Three pairs of angles. ”</p>' +
    '  <div class="jm28-sheet-grid">' +
    card(
      "trans",
      "Transversal",
      "截線",
      angleSvg("trans"),
      "The line that crosses the other two.",
      "穿過另外兩條直線的線。",
      ""
    ) +
    card(
      "corr",
      "Corresponding angles",
      "同位角",
      angleSvg("corr"),
      "x = y (corr. angles, AB // CD).",
      "x = y（同位角，AB // CD）。",
      ""
    ) +
    card(
      "alt",
      "Alternate angles",
      "內錯角",
      angleSvg("alt"),
      "x = y (alt. angles, AB // CD).",
      "x = y（內錯角，AB // CD）。",
      ""
    ) +
    card(
      "cointerior",
      "Interior angles",
      "同旁內角",
      angleSvg("cointerior"),
      "x + y = 180° (int. angles, AB // CD).",
      "x + y = 180°（同旁內角，AB // CD）。",
      ""
    ) +
    "  </div>" +
    '  <span class="jm28-star jm28-star-a" aria-hidden="true"></span>' +
    '  <span class="jm28-star jm28-star-b" aria-hidden="true"></span>' +
    "</section>"
  );
};

window.renderJM28SummaryTriangles = function renderJM28SummaryTriangles() {
  return (
    '<section class="jm28-sheet" aria-label="Similar and congruent triangles">' +
    '  <div class="jm28-sheet-banner">' +
    bulbSvg() +
    '    <div class="jm28-ribbon">' +
    "      <h2>Similar &amp; Congruent</h2>" +
    "      <p>相似與全等</p>" +
    "    </div>" +
    bulbSvg() +
    "  </div>" +
    '  <p class="jm28-quote">“ Same shape, or same shape and size. The reason has to match. ”</p>' +
    '  <div class="jm28-sheet-grid">' +
    group("Similar", "相似") +
    card(
      "aaa",
      "AAA",
      "三個角相等",
      aaaSvg(),
      "Three pairs of equal angles. The triangles are similar, not necessarily the same size.",
      "三對角相等。兩個三角形相似，大小未必相同。",
      ""
    ) +
    card(
      "prop",
      "Three sides proportional",
      "三邊成比例",
      propSvg(),
      "Sides 3, 4, 5 and 6, 8, 10. Each pair has the same ratio.",
      "邊長 3、4、5 與 6、8、10。每對邊比例相同。",
      ""
    ) +
    card(
      "ratio",
      "Two sides, included angle",
      "兩邊成比例，夾角相等",
      ratioSvg(),
      "Two pairs of sides are in the same ratio, and the angle between them is equal.",
      "兩對邊成相同比例，而且夾角相等。",
      ""
    ) +
    group("Congruent", "全等") +
    card(
      "sss",
      "SSS",
      "三邊相等",
      sssSvg(),
      "Three pairs of corresponding sides are equal.",
      "三對對應邊相等。",
      ""
    ) +
    card(
      "sas",
      "SAS",
      "兩邊夾一角",
      sasSvg(),
      "Two sides and the included angle are equal.",
      "兩邊和夾角相等。",
      ""
    ) +
    card(
      "asa",
      "ASA",
      "兩角夾一邊",
      asaSvg(),
      "Two angles and the included side are equal.",
      "兩角和夾邊相等。",
      ""
    ) +
    card(
      "aas",
      "AAS",
      "兩角同一邊",
      aasSvg(),
      "Two angles and a side that is not between them are equal.",
      "兩角和一條非夾邊相等。",
      ""
    ) +
    card(
      "rhs",
      "RHS",
      "直角、斜邊、另一邊",
      rhsSvg(),
      "The right angle, the hypotenuse, and one other side are equal.",
      "直角、斜邊和另一邊相等。",
      ""
    ) +
    group("Not a reason", "不能作為理由") +
    card(
      "ass",
      "Not ASS or SSA",
      "不是 ASS 或 SSA",
      assSvg(),
      "These two triangles match in angle, adjacent side, and opposite side. ASS and SSA do not prove congruence.",
      "這兩個三角形有相同的角、鄰邊和對邊。ASS 和 SSA 不能證明全等。",
      ""
    ) +
    "  </div>" +
    '  <span class="jm28-star jm28-star-a" aria-hidden="true"></span>' +
    '  <span class="jm28-star jm28-star-b" aria-hidden="true"></span>' +
    "</section>"
  );
};

function card(kind, title, zhTitle, svg, en, zh, note) {
  var extra = "";
  if (kind === "median") extra = '<span class="jm28-clip" aria-hidden="true"></span>';
  if (kind === "bisector") extra = '<span class="jm28-tape" aria-hidden="true"></span>';
  var noteHtml = note ? '<p class="jm28-note">' + note + "</p>" : "";
  return (
    '<article class="jm28-card jm28-card-' +
    kind +
    '">' +
    extra +
    '  <div class="jm28-card-top">' +
    "    <h3>" +
    title +
    "<span>" +
    zhTitle +
    "</span></h3>" +
    svg +
    "  </div>" +
    "  <p>" +
    en +
    "</p>" +
    '  <p class="zh">' +
    zh +
    "</p>" +
    noteHtml +
    "</article>"
  );
}

function bulbSvg() {
  return (
    '<svg class="jm28-bulb" viewBox="0 0 36 46" aria-hidden="true">' +
    '<path d="M18 3a11 11 0 0 0-7 19.2c.8 1.1 1.3 2.2 1.3 3.3V28h11.4v-2.5c0-1.1.5-2.2 1.3-3.3A11 11 0 0 0 18 3z" fill="#ffe9a8" stroke="#2b2b2b" stroke-width="1.8"/>' +
    '<path d="M14 31.5h8M15 34.5h6M16.2 37.5h3.6" fill="none" stroke="#2b2b2b" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>"
  );
}

function medianSvg() {
  return (
    '<svg class="jm28-diagram" viewBox="0 0 220 148" role="img" aria-label="Median from A to the midpoint M of BC">' +
    '<polygon points="110,22 28,118 192,118" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<line class="jm28-mark jm28-mark-median" x1="110" y1="22" x2="110" y2="118"/>' +
    '<line class="jm28-tick" x1="69" y1="110" x2="69" y2="126"/>' +
    '<line class="jm28-tick" x1="151" y1="110" x2="151" y2="126"/>' +
    '<text x="102" y="16">A</text>' +
    '<text x="10" y="132">B</text>' +
    '<text x="186" y="132">C</text>' +
    '<text x="116" y="108">M</text>' +
    "</svg>"
  );
}

function altitudeSvg() {
  return (
    '<svg class="jm28-diagram" viewBox="0 0 220 148" role="img" aria-label="Altitude from A meeting BC at a right angle at D">' +
    '<polygon points="78,20 22,118 198,118" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<line class="jm28-mark jm28-mark-altitude" x1="78" y1="20" x2="78" y2="118"/>' +
    '<path class="jm28-right" d="M66 118 L66 106 L78 106"/>' +
    '<text x="70" y="14">A</text>' +
    '<text x="6" y="132">B</text>' +
    '<text x="190" y="132">C</text>' +
    '<text x="84" y="136">D</text>' +
    "</svg>"
  );
}

function bisectorSvg() {
  return (
    '<svg class="jm28-diagram" viewBox="0 0 220 148" role="img" aria-label="Angle bisector from A to E, splitting angle BAC into two equal angles">' +
    '<polygon points="100,20 24,118 196,118" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<line class="jm28-mark jm28-mark-bisector" x1="100" y1="20" x2="105.7" y2="118"/>' +
    '<path class="jm28-arc" d="M84.1 47.8 A32 32 0 0 0 97.4 51.9"/>' +
    '<path class="jm28-arc" d="M87.9 43 A26 26 0 0 0 97 45.8"/>' +
    '<path class="jm28-arc" d="M106.3 51.4 A32 32 0 0 0 119 45.8"/>' +
    '<path class="jm28-arc" d="M106 45.3 A26 26 0 0 0 114.7 41.5"/>' +
    '<text x="92" y="14">A</text>' +
    '<text x="8" y="132">B</text>' +
    '<text x="188" y="132">C</text>' +
    '<text x="112" y="136">E</text>' +
    "</svg>"
  );
}

function perpSvg() {
  return (
    '<svg class="jm28-diagram" viewBox="0 0 220 148" role="img" aria-label="Perpendicular bisector of BC through midpoint M, missing vertex A">' +
    '<polygon points="158,22 24,112 196,112" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<line class="jm28-mark jm28-mark-perp" x1="110" y1="36" x2="110" y2="132"/>' +
    '<line class="jm28-tick" x1="67" y1="104" x2="67" y2="120"/>' +
    '<line class="jm28-tick" x1="153" y1="104" x2="153" y2="120"/>' +
    '<path class="jm28-right" d="M98 112 L98 100 L110 100"/>' +
    '<text x="162" y="18">A</text>' +
    '<text x="8" y="128">B</text>' +
    '<text x="188" y="128">C</text>' +
    '<text x="116" y="128">M</text>' +
    "</svg>"
  );
}

function centresSheet() {
  return (
    '<section class="jm28-sheet jm28-centres" aria-label="Triangle centres">' +
    '  <div class="jm28-sheet-banner">' +
    bulbSvg() +
    '    <div class="jm28-ribbon">' +
    "      <h2>Triangle Centres</h2>" +
    "      <p>三角形的四心</p>" +
    "    </div>" +
    bulbSvg() +
    "  </div>" +
    '  <p class="jm28-quote">“ Where the special lines meet, and which circle belongs to each centre. ”</p>' +
    centreRow(
      "in",
      "Incenter",
      "內心",
      "Where the angle bisectors meet. Centre of the incircle, which touches all three sides.",
      "角平分線的交點，亦是內切圓的圓心。內切圓與三邊相切。",
      "#2f8a55",
      "in"
    ) +
    centreRow(
      "centroid",
      "Centroid",
      "重心",
      "Where the medians meet. The balance point stays inside every triangle.",
      "中線的交點，是三角形的平衡點，一定在三角形內。",
      "#c4841a",
      "centroid"
    ) +
    centreRow(
      "circum",
      "Circumcenter",
      "外心",
      "Where the perpendicular bisectors meet. Centre of the circumcircle through all three vertices.",
      "垂直平分線的交點，亦是外接圓的圓心。外接圓經過三個頂點。",
      "#c45c32",
      "circum"
    ) +
    centreRow(
      "ortho",
      "Orthocenter",
      "垂心",
      "Where the altitudes meet.",
      "高線的交點。",
      "#2f74b5",
      "ortho"
    ) +
    '  <span class="jm28-star jm28-star-a" aria-hidden="true"></span>' +
    '  <span class="jm28-star jm28-star-b" aria-hidden="true"></span>' +
    "</section>"
  );
}

function centreRow(kind, title, zhTitle, en, zh, color, mode) {
  return (
    '<article class="jm28-centre jm28-centre-' +
    kind +
    '">' +
    '  <div class="jm28-centre-copy">' +
    "    <h3>" +
    title +
    "<span>" +
    zhTitle +
    "</span></h3>" +
    "    <p>" +
    en +
    "</p>" +
    '    <p class="zh">' +
    zh +
    "</p>" +
    "  </div>" +
    '  <div class="jm28-centre-figs">' +
    mini("Acute", "銳角", centreFig("acute", mode, color), capFor(mode, "acute")) +
    mini("Right", "直角", centreFig("right", mode, color), capFor(mode, "right")) +
    mini("Obtuse", "鈍角", centreFig("obtuse", mode, color), capFor(mode, "obtuse")) +
    "  </div>" +
    "</article>"
  );
}

function capFor(mode, shape) {
  if (mode === "circum" && shape === "right") {
    return { en: "Midpoint of the hypotenuse", zh: "斜邊中點" };
  }
  if (mode === "ortho" && shape === "right") {
    return { en: "B is the orthocenter", zh: "B 是垂心" };
  }
  if ((mode === "circum" || mode === "ortho") && shape === "obtuse") {
    return { en: "Outside", zh: "在外部" };
  }
  return { en: "Inside", zh: "在內部" };
}

function mini(title, zh, svg, cap) {
  return (
    '<figure class="jm28-mini">' +
    "<figcaption><b>" +
    title +
    "</b><span>" +
    zh +
    "</span></figcaption>" +
    svg +
    "<p>" +
    cap.en +
    "<span>" +
    cap.zh +
    "</span></p>" +
    "</figure>"
  );
}

function centreFig(shape, mode, color) {
  var spec = SHAPES[shape];
  var lines = CENTRE_LINES[shape];
  var body = poly(spec.pts);
  if (shape === "right") body += rightAngle();
  if (mode === "in") body += ring(spec.I, spec.r, color);
  if (mode === "circum") body += ring(spec.O, spec.R, color);
  if (mode === "centroid") body += medians(shape);
  if (mode === "in") body += strokes(lines.bis, "jm28-bis");
  if (mode === "circum") body += strokes(lines.perp, "jm28-perp");
  if (mode === "in") body += strokes(lines.inRad, "jm28-radius");
  if (mode === "circum") body += strokes(lines.circumRad, "jm28-radius");
  if (mode === "in") {
    body += lines.inMarks
      .map(function (d) {
        return '<path class="jm28-right" d="' + d + '"/>';
      })
      .join("");
  }
  if (mode === "ortho") {
    body += strokes(lines.extend, "jm28-extend");
    body += strokes(lines.alt, "jm28-alt");
    body += strokes(lines.altOut, "jm28-alt");
    body += lines.marks
      .map(function (d) {
        return '<path class="jm28-right" d="' + d + '"/>';
      })
      .join("");
  }
  var pt = spec[mode === "in" ? "I" : mode === "centroid" ? "G" : mode === "circum" ? "O" : "H"];
  var tag = mode === "in" ? "I" : mode === "centroid" ? "G" : mode === "circum" ? "O" : "H";
  body += centreDot(pt, color);
  body += spec.labels;
  if (!(mode === "ortho" && shape === "right")) {
    body += lab(spec.tag[mode].x, spec.tag[mode].y, tag);
  }
  return (
    '<svg class="jm28-diagram" viewBox="' +
    spec.box[mode] +
    '" role="img" aria-label="' +
    tag +
    " in a " +
    shape +
    ' triangle">' +
    body +
    "</svg>"
  );
}

var SHAPES = {
  acute: {
    pts: "90,18 18,108 162,96",
    I: { x: 91.8, y: 68.7 },
    r: 33.1,
    G: { x: 90, y: 74 },
    O: { x: 89.1, y: 91.1 },
    R: 73.1,
    H: { x: 91.8, y: 39.9 },
    box: {
      in: "0 0 180 130",
      centroid: "0 0 180 130",
      circum: "0 4 176 172",
      ortho: "0 0 180 130"
    },
    labels:
      '<text x="82" y="14">A</text><text x="6" y="124">B</text><text x="156" y="112">C</text>',
    tag: {
      in: { x: 96, y: 90 },
      centroid: { x: 76, y: 65 },
      circum: { x: 72, y: 70 },
      ortho: { x: 77, y: 72 }
    }
  },
  right: {
    pts: "36,16 36,112 150,112",
    I: { x: 66.5, y: 81.5 },
    r: 30.5,
    G: { x: 74, y: 80 },
    O: { x: 93, y: 64 },
    R: 74.5,
    H: { x: 36, y: 112 },
    box: {
      in: "4 0 164 136",
      centroid: "4 0 164 136",
      circum: "8 -20 172 166",
      ortho: "4 0 164 136"
    },
    labels:
      '<text x="16" y="14">A</text><text x="10" y="128">B</text><text x="146" y="128">C</text>',
    tag: {
      in: { x: 65, y: 67 },
      centroid: { x: 73, y: 67 },
      circum: { x: 108, y: 66 },
      ortho: { x: 64, y: 90 }
    }
  },
  obtuse: {
    pts: "46,20 78,104 170,104",
    I: { x: 94.1, y: 80.7 },
    r: 23.3,
    G: { x: 98, y: 76 },
    O: { x: 124, y: 38.4 },
    R: 80.1,
    H: { x: 46, y: 151.2 },
    box: {
      in: "20 0 168 128",
      centroid: "20 0 168 128",
      circum: "20 -52 200 184",
      ortho: "20 0 168 178"
    },
    labels:
      '<text x="28" y="16">A</text><text x="60" y="120">B</text><text x="158" y="120">C</text>',
    tag: {
      in: { x: 91, y: 69 },
      centroid: { x: 90, y: 58 },
      circum: { x: 140, y: 42 },
      ortho: { x: 30, y: 156 }
    }
  }
};

function poly(pts) {
  return (
    '<polygon points="' +
    pts +
    '" fill="none" stroke="#2b2b2b" stroke-width="2.2" stroke-linejoin="round"/>'
  );
}

function ring(c, r, color) {
  return (
    '<circle cx="' +
    c.x +
    '" cy="' +
    c.y +
    '" r="' +
    r +
    '" fill="none" stroke="' +
    color +
    '" stroke-width="1.8"/>'
  );
}

function centreDot(c, color) {
  return (
    '<circle cx="' +
    c.x +
    '" cy="' +
    c.y +
    '" r="3.5" fill="' +
    color +
    '" stroke="#2b2b2b" stroke-width="1.1"/>'
  );
}

function lab(x, y, text) {
  return '<text x="' + x + '" y="' + y + '">' + text + "</text>";
}

function rightAngle() {
  return '<path class="jm28-right" d="M36 100 L48 100 L48 112"/>';
}

function medians(shape) {
  var lines = {
    acute: ["90,18 90,102", "18,108 126,57", "162,96 54,63"],
    right: ["36,16 93,112", "36,112 93,64", "150,112 36,64"],
    obtuse: ["46,20 124,104", "78,104 108,62", "170,104 62,62"]
  };
  return lines[shape]
    .map(function (seg) {
      var p = seg.split(" ");
      var a = p[0].split(",");
      var b = p[1].split(",");
      return (
        '<line class="jm28-median" x1="' +
        a[0] +
        '" y1="' +
        a[1] +
        '" x2="' +
        b[0] +
        '" y2="' +
        b[1] +
        '"/>'
      );
    })
    .join("");
}

function strokes(list, cls) {
  return list
    .map(function (seg) {
      var p = seg.split(" ");
      var a = p[0].split(",");
      var b = p[1].split(",");
      return (
        '<line class="' +
        cls +
        '" x1="' +
        a[0] +
        '" y1="' +
        a[1] +
        '" x2="' +
        b[0] +
        '" y2="' +
        b[1] +
        '"/>'
      );
    })
    .join("");
}

var CENTRE_LINES = {
  acute: {
    bis: ["90,18 93,101.8", "18,108 122,52.6", "162,96 59.5,56.1"],
    inRad: ["91.8,68.7 94.5,101.6", "91.8,68.7 116.1,46.3", "91.8,68.7 66,48"],
    inMarks: ["M101 101 L101 94 L94 95", "M111 41 L106 46 L111 51", "M70 43 L76 47 L71 52"],
    circumRad: ["89.1,91.1 90,18", "89.1,91.1 18,108", "89.1,91.1 162,96"],
    alt: ["90,18 97,101.4", "18,108 101.7,30.7", "162,96 80,30.4"],
    altOut: [],
    extend: [],
    perp: ["91.2,116 88.1,79.1", "136.3,47.5 80.3,99.2", "43.1,54.3 98.5,98.6"],
    marks: ["M89 102 L88 94 L96 93", "M107 37 L101 42 L96 36", "M75 37 L81 42 L86 35"]
  },
  right: {
    bis: ["36,16 80.7,112", "36,112 88.1,59.9", "150,112 36,70.4"],
    inRad: ["66.5,81.5 66.5,112", "66.5,81.5 86.1,58.2", "66.5,81.5 36,81.5"],
    inMarks: ["M60 112 L60 105 L66 105", "M81 54 L76 59 L82 64", "M36 88 L43 88 L43 82"],
    circumRad: ["93,64 36,16", "93,64 36,112", "93,64 150,112"],
    alt: ["36,16 36,112", "150,112 36,112", "36,112 83.3,55.8"],
    altOut: [],
    extend: [],
    perp: ["93,128 93,52", "120.1,31.9 65.9,96.1", "20,64 105,64"],
    marks: ["M89 61 L84 67 L78 62"]
  },
  obtuse: {
    bis: ["46,20 112.6,104", "78,104 107.3,61.5", "170,104 65.8,72"],
    inRad: ["94.1,80.7 94.1,104", "94.1,80.7 107.2,61.4", "94.1,80.7 72.3,89"],
    inMarks: ["M87 104 L87 97 L94 97", "M101 57 L97 63 L103 67", "M75 96 L81 93 L79 87"],
    circumRad: ["124,38.4 46,20", "124,38.4 78,104", "124,38.4 170,104"],
    alt: ["78,104 106.9,61.3"],
    altOut: ["46,20 46,151.2", "78,104 46,151.2", "170,104 46,151.2"],
    extend: ["78,104 36,104", "78,104 94,145.8"],
    perp: ["124,120 124,26", "97.9,76.9 133,25.2", "45.2,68.4 136,34.3"],
    marks: ["M54 104 L54 96 L46 96", "M114 66 L109 72 L102 68", "M87 127 L94 124 L97 132"]
  }
};

function angleSvg(mode) {
  var wedges = "";
  if (mode === "corr") wedges = wedge(88, 42, "corr", "se", 34) + wedge(136, 108, "corr", "se", 34);
  if (mode === "alt") wedges = wedge(88, 42, "alt", "se", 34) + wedge(136, 108, "alt", "nw", 36);
  if (mode === "cointerior") wedges = wedge(88, 42, "int", "se", 34) + wedge(136, 108, "int", "ne", 30);
  var crossing = mode === "trans" ? "jm28-trans" : "jm28-ray";
  var label = "";
  var ends =
    '<text text-anchor="middle" dominant-baseline="central" x="14" y="42">A</text>' +
    '<text text-anchor="middle" dominant-baseline="central" x="214" y="42">B</text>' +
    '<text text-anchor="middle" dominant-baseline="central" x="14" y="108">C</text>' +
    '<text text-anchor="middle" dominant-baseline="central" x="214" y="108">D</text>';
  if (mode === "trans") label = '<text x="46" y="32">t</text>' + ends;
  if (mode === "corr") label = ang(105.8, 51.1, "x") + ang(162, 115.2, "y") + ends;
  if (mode === "alt") label = ang(105.8, 51.1, "x") + ang(112.8, 96.2, "y") + ends;
  if (mode === "cointerior") label = ang(105.8, 51.1, "x") + ang(143.4, 93.8, "y") + ends;
  return (
    '<svg class="jm28-diagram" viewBox="0 0 236 156" role="img">' +
    wedges +
    '<path class="jm28-ray" d="M28 42 H202"/>' +
    '<path class="jm28-ray" d="M28 108 H202"/>' +
    '<path class="' +
    crossing +
    '" d="M71.5 19.4 L164.3 146.8"/>' +
    paraArrows(42) +
    paraArrows(108) +
    label +
    "</svg>"
  );
}

function ang(x, y, letter) {
  return (
    '<text class="jm28-ang" text-anchor="middle" dominant-baseline="central" x="' +
    x +
    '" y="' +
    y +
    '">' +
    letter +
    "</text>"
  );
}

function wedge(cx, cy, kind, corner, r) {
  var c54 = 0.5878;
  var s54 = 0.809;
  var d;
  if (corner === "se") {
    d =
      "M" + cx + " " + cy +
      " L" + (cx + r) + " " + cy +
      " A" + r + " " + r + " 0 0 1 " +
      (cx + r * c54) + " " + (cy + r * s54) + " Z";
  } else if (corner === "nw") {
    d =
      "M" + cx + " " + cy +
      " L" + (cx - r) + " " + cy +
      " A" + r + " " + r + " 0 0 1 " +
      (cx - r * c54) + " " + (cy - r * s54) + " Z";
  } else {
    d =
      "M" + cx + " " + cy +
      " L" + (cx - r * c54) + " " + (cy - r * s54) +
      " A" + r + " " + r + " 0 0 1 " +
      (cx + r) + " " + cy + " Z";
  }
  return '<path class="jm28-wedge jm28-wedge-' + kind + '" d="' + d + '"/>';
}

function paraArrows(y) {
  return (
    '<path class="jm28-arrow" d="M176 ' +
    (y - 6) +
    " L186 " +
    y +
    " L176 " +
    (y + 6) +
    '"/>' +
    '<path class="jm28-arrow" d="M190 ' +
    (y - 6) +
    " L200 " +
    y +
    " L190 " +
    (y + 6) +
    '"/>'
  );
}

function group(en, zh) {
  return '<p class="jm28-group">' + en + " · " + zh + "</p>";
}

function fig(w, h, body) {
  return '<svg class="jm28-diagram" viewBox="0 0 ' + w + " " + h + '" role="img">' + body + "</svg>";
}

function rnd(n) {
  return Math.round(n * 10) / 10;
}

function unit(from, to) {
  var dx = to[0] - from[0];
  var dy = to[1] - from[1];
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / len, dy / len];
}

function tri(pts) {
  return (
    '<path class="jm28-ray" d="M' +
    pts
      .map(function (p) {
        return rnd(p[0]) + " " + rnd(p[1]);
      })
      .join(" L") +
    ' Z"/>'
  );
}

function ticks(a, b, n) {
  var mx = (a[0] + b[0]) / 2;
  var my = (a[1] + b[1]) / 2;
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var ux = dx / len;
  var uy = dy / len;
  var px = -uy;
  var py = ux;
  var gap = 4.2;
  var start = -((n - 1) * gap) / 2;
  var d = "";
  var i;
  var cx;
  var cy;
  for (i = 0; i < n; i++) {
    cx = mx + (start + i * gap) * ux;
    cy = my + (start + i * gap) * uy;
    d +=
      '<path class="jm28-tick" d="M' +
      rnd(cx - px * 5.5) +
      " " +
      rnd(cy - py * 5.5) +
      " L" +
      rnd(cx + px * 5.5) +
      " " +
      rnd(cy + py * 5.5) +
      '"/>';
  }
  return d;
}

function arc(v, p, q, r, n) {
  var ua = unit(v, p);
  var ub = unit(v, q);
  var sweep = ua[0] * ub[1] - ua[1] * ub[0] > 0 ? 1 : 0;
  var d = "";
  var i;
  var rr;
  var p1;
  var p2;
  for (i = 0; i < n; i++) {
    rr = r + i * 3.4;
    p1 = [v[0] + ua[0] * rr, v[1] + ua[1] * rr];
    p2 = [v[0] + ub[0] * rr, v[1] + ub[1] * rr];
    d +=
      '<path class="jm28-arc" d="M' +
      rnd(p1[0]) +
      " " +
      rnd(p1[1]) +
      " A" +
      rnd(rr) +
      " " +
      rnd(rr) +
      " 0 0 " +
      sweep +
      " " +
      rnd(p2[0]) +
      " " +
      rnd(p2[1]) +
      '"/>';
  }
  return d;
}

function rightMark(v, p, q, s) {
  var ua = unit(v, p);
  var ub = unit(v, q);
  var p1 = [v[0] + ua[0] * s, v[1] + ua[1] * s];
  var p2 = [v[0] + ua[0] * s + ub[0] * s, v[1] + ua[1] * s + ub[1] * s];
  var p3 = [v[0] + ub[0] * s, v[1] + ub[1] * s];
  return (
    '<path class="jm28-right" d="M' +
    rnd(p1[0]) +
    " " +
    rnd(p1[1]) +
    " L" +
    rnd(p2[0]) +
    " " +
    rnd(p2[1]) +
    " L" +
    rnd(p3[0]) +
    " " +
    rnd(p3[1]) +
    '"/>'
  );
}

function sideLabel(a, b, inside, text) {
  var mx = (a[0] + b[0]) / 2;
  var my = (a[1] + b[1]) / 2;
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var px = -dy / len;
  var py = dx / len;
  var vx = inside[0] - mx;
  var vy = inside[1] - my;
  if (px * vx + py * vy > 0) {
    px = -px;
    py = -py;
  }
  return (
    '<text class="jm28-len" text-anchor="middle" dominant-baseline="central" x="' +
    rnd(mx + px * 13) +
    '" y="' +
    rnd(my + py * 13) +
    '">' +
    text +
    "</text>"
  );
}

function both(draw) {
  var left = [
    [26, 104],
    [72, 32],
    [118, 104]
  ];
  var right = [
    [126, 104],
    [172, 32],
    [218, 104]
  ];
  return fig(236, 122, tri(left) + tri(right) + draw(left) + draw(right));
}

function aaaSvg() {
  var left = [
    [20, 94],
    [52, 44],
    [84, 94]
  ];
  var right = [
    [108, 112],
    [159.2, 32],
    [210.4, 112]
  ];
  function marks(t) {
    return arc(t[0], t[1], t[2], 9, 1) + arc(t[1], t[0], t[2], 9, 2) + arc(t[2], t[0], t[1], 9, 3);
  }
  return fig(224, 128, tri(left) + tri(right) + marks(left) + marks(right));
}

function propSvg() {
  var left = [
    [24, 100],
    [24, 60],
    [54, 100]
  ];
  var right = [
    [100, 114],
    [100, 34],
    [160, 114]
  ];
  function marks(t, names) {
    return (
      sideLabel(t[0], t[2], t[1], names[0]) +
      sideLabel(t[0], t[1], t[2], names[1]) +
      sideLabel(t[1], t[2], t[0], names[2])
    );
  }
  return fig(190, 132, tri(left) + tri(right) + marks(left, ["3", "4", "5"]) + marks(right, ["6", "8", "10"]));
}

function ratioSvg() {
  var left = [
    [18, 108],
    [34, 80],
    [66, 108]
  ];
  var right = [
    [92, 116],
    [124, 60],
    [188, 116]
  ];
  function marks(t, ab, ac) {
    return sideLabel(t[0], t[1], t[2], ab) + sideLabel(t[0], t[2], t[1], ac) + arc(t[0], t[1], t[2], 12, 1);
  }
  return fig(206, 132, tri(left) + tri(right) + marks(left, "2", "3") + marks(right, "4", "6"));
}

function sssSvg() {
  return both(function (t) {
    return ticks(t[0], t[1], 1) + ticks(t[1], t[2], 2) + ticks(t[2], t[0], 3);
  });
}

function sasSvg() {
  return both(function (t) {
    return ticks(t[0], t[1], 1) + ticks(t[1], t[2], 2) + arc(t[1], t[0], t[2], 11, 1);
  });
}

function asaSvg() {
  return both(function (t) {
    return arc(t[0], t[1], t[2], 10, 1) + arc(t[1], t[0], t[2], 10, 2) + ticks(t[0], t[1], 1);
  });
}

function aasSvg() {
  return both(function (t) {
    return arc(t[0], t[1], t[2], 10, 1) + arc(t[1], t[0], t[2], 10, 2) + ticks(t[1], t[2], 1);
  });
}

function rhsSvg() {
  var left = [
    [28, 104],
    [28, 46],
    [96, 104]
  ];
  var right = [
    [128, 104],
    [128, 46],
    [196, 104]
  ];
  function marks(t) {
    return rightMark(t[0], t[1], t[2], 11) + ticks(t[1], t[2], 1) + ticks(t[0], t[2], 2);
  }
  return fig(214, 122, tri(left) + tri(right) + marks(left) + marks(right));
}

function assSvg() {
  var left = [
    [14, 104],
    [98, 104],
    [44.5, 82.6]
  ];
  var right = [
    [116, 110],
    [200, 110],
    [198.2, 52.4]
  ];
  function marks(t) {
    return arc(t[0], t[1], t[2], 11, 1) + ticks(t[0], t[1], 2) + ticks(t[1], t[2], 1);
  }
  return fig(214, 124, tri(left) + tri(right) + marks(left) + marks(right));
}
})();
