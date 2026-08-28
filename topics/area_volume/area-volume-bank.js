/* Area & Volume — Worked-Solutions question bank.
 * Rebuilt from PPT slides one question at a time (2025 deck, L07–L09 only).
 */
(function () {
  "use strict";
  window.AVW_BANK = function () {
    var K = window.AVWorkedKit;
    if (!K) return [];
    var mt = K.mt, mx = K.mx, mlines = K.mlines, fchip = K.fchip, tchip = K.tchip, st = K.st, stub = K.stub, deckPath = K.deckPath;
    function fig(type, data) { return { type: type, data: data || {} }; }
    function water(p) { return { kind: "water", label: "Water lab", params: p }; }
    function frustum() { return { kind: "frustum", label: "Frustum explorer" }; }
    function frustumSq(p) { return { kind: "frustum_sq", label: "Square frustum explorer", params: p }; }
    function frustumRect(p) { return { kind: "frustum_rect", label: "Rectangular frustum explorer", params: p }; }

    var ITEMS = { l07: [], l08: [], l09: [] };

    // ════ L07 (A) — prefix QA ════
    ITEMS.l07 = [
      { n: "2", solved: true, title: "Trapezoidal prism",
        deck: deckPath("qa2-solution"), figure: fig("prism_trap", { top: "4", bot: "7", h: "4", slant: "5", len: "10" }),
        figLabel: "Trapezoidal prism",
        question: [{ tag: "", tex: "\\text{Find the }\\textcolor{#F48FB1}{\\text{volume}}\\text{ and the }\\textcolor{#64B5F6}{\\text{total surface area}}\\text{ of the following right solids.}" }],
        steps: [
          st(0, { reveal: 0 }, "Figure (QA2)", mlines(
            "\\text{Right-angled trapezium base, length }10\\text{ cm}",
            "\\text{ — see diagram.}"
          )),
          st(1, { reveal: 1 }, "Question (QA2)", mx("Find the ", "\\textcolor{#F48FB1}{\\text{volume}}", " and the ", "\\textcolor{#64B5F6}{\\text{total surface area}}", " of the right trapezoidal prism.")),
          st(2, { reveal: 1 }, "Part 1 — Volume", mx("First find the ", "\\textcolor{#F48FB1}{\\text{volume}}", " of the prism.")),
          st(3, { reveal: 2 }, "Highlight base", mlines(
            "\\text{The base is a }\\textcolor{#FFD54F}{\\text{right-angled trapezium}}",
            "\\text{ — see diagram.}"
          )),
          st(4, { reveal: 2 }, "Base area", mlines(
            "\\textcolor{#FFD54F}{\\text{Base area}}=\\tfrac12(4+7)\\times4",
            "=22\\text{ cm}^2\\text{.}"
          )),
          st(5, { reveal: 2 }, "Base area result", mt("=22\\text{ cm}^2\\text{.}")),
          st(6, { reveal: 3 }, "Volume setup", mlines(
            "\\textcolor{#F48FB1}{\\text{Volume of Prism}}=\\textcolor{#FFD54F}{22}\\times10",
            "\\text{ cm}^3\\text{.}"
          )),
          st(7, { reveal: 4 }, "Volume", mt("=220\\text{ cm}^3\\text{.}")),
        ] },
      { n: "4", solved: true, title: "Cylinder \u2014 height & volume",
        deck: deckPath("qa4-solution"), figure: fig("cylinder", { rc: "#66BB6A", hc: "#64B5F6" }), figLabel: "Right cylinder",
        question: [
          { tag: "4.", tex: "\\text{The total surface area of a right cylinder}" },
          { tag: "", tex: "\\text{and the }\\color{#FFD54F}{\\textit{circumference of its base}}\\text{ are}" },
          { tag: "", tex: "\\color{#F48FB1}{1312\\pi\\text{ mm}^2}" },
          { tag: "", tex: "\\text{and }\\color{#FFD54F}{32\\pi\\text{ mm}}\\text{ respectively. Find its}" },
          { tag: "(a)", tex: "\\color{#64B5F6}{\\text{height}}\\text{,}" },
          { tag: "(b)", tex: "\\color{#F06292}{\\text{volume}}\\text{.}" },
          { tag: "", tex: "\\text{(Give the answers in terms of }\\pi\\text{ if necessary.)}" },
        ],
        steps: [
          st(0, { reveal: 0 }, "Figure (QA4)", mlines(
            "\\text{Right cylinder}",
            "\\text{See diagram.}",
            "\\text{Use the given total surface area and base circumference.}"
          )),
          st(1, { reveal: 0 }, "Question (QA4)", mlines(
            "\\text{The total surface area of a right cylinder}",
            "\\text{and the }\\color{#FFD54F}{\\textit{circumference of its base}}\\text{ are}",
            "\\color{#F48FB1}{1312\\pi\\text{ mm}^2}",
            "\\text{and }\\color{#FFD54F}{32\\pi\\text{ mm}}\\text{ respectively.}",
            "\\text{Find its}",
            "\\color{#64B5F6}{\\text{(a) height}}\\text{,}",
            "\\color{#F06292}{\\text{(b) volume}}\\text{.}",
            "\\text{(Give the answers in terms of }\\pi\\text{ if necessary.)}"
          )),
          st(2, { reveal: 0, fig: { r: "r" } }, "(a) Let r", mt("\\textit{Let }\\color{#66BB6A}{r}\\textit{ mm be the base radius of the cylinder}\\text{.}")),
          st(3, { reveal: 1, fig: { r: "r" } }, "(a) Circumference", mt("\\therefore\\ \\textit{Circumference of its base}=\\color{#FFD54F}{32\\pi\\text{ mm}}\\text{.}")),
          st(4, { reveal: 1, fig: { r: "r" } }, "(a) Set up r", mx("\\therefore\\ ", "\\textcolor{#66BB6A}{2\\pi r}", "=", "\\textcolor{#FFD54F}{32\\pi}", "\\text{.}")),
          st(5, { reveal: 2, fig: { r: "16" } }, "(a) Radius", mlines(
            mx("\\textcolor{#66BB6A}{r}", "=", "\\dfrac{32\\pi}{2\\pi}", "=", "\\textcolor{#66BB6A}{16}", "\\text{.}"),
            mx("\\therefore\\text{ The base radius of the cylinder is }", "\\textcolor{#66BB6A}{16\\text{ mm}}", "\\text{.}")
          )),
          st(6, { reveal: 2, fig: { r: "16", h: "h" } }, "(a) Let h", mt("\\textit{Let }\\color{#64B5F6}{h}\\textit{ mm be the height of the cylinder}\\text{.}")),
          st(7, { reveal: 3, fig: { r: "16" } }, "(a) Total surface area", mt("\\therefore\\ \\color{#F48FB1}{\\textit{Total surface area}=1312\\pi\\text{ mm}^2\\text{.}}")),
          st(8, { reveal: 3, fig: { r: "16" } }, "(a) Total surface area equation", mx(
            "\\therefore\\ 2\\pi(", "\\textcolor{#66BB6A}{16}", ")", "\\textcolor{#64B5F6}{h}", "+2\\pi(", "\\textcolor{#66BB6A}{16}", ")^2=",
            "\\textcolor{#F48FB1}{1312\\pi}", "\\text{.}"
          )),
          st(9, { reveal: 3, fig: { r: "16" } }, "(a) Simplify", mlines(
            mx("\\therefore\\ 32\\pi", "\\textcolor{#64B5F6}{h}", "+512\\pi=", "\\textcolor{#F48FB1}{1312\\pi}", "\\text{.}"),
            mx("\\therefore\\ 32\\pi", "\\textcolor{#64B5F6}{h}", "=800\\pi", "\\text{.}")
          )),
          st(10, { reveal: 4, fig: { r: "16", h: "25" } }, "(a) Height", mlines(
            mx("\\therefore\\ ", "\\textcolor{#64B5F6}{h}", "=", "\\textcolor{#64B5F6}{25}", "\\text{.}"),
            mx("\\therefore\\text{ The height of the cylinder is }", "\\textcolor{#64B5F6}{25\\text{ mm}}", "\\text{.}")
          )),
          st(11, { reveal: 4, fig: { r: "16", h: "25" } }, "(b) Volume setup", mx(
            "\\textcolor{#F06292}{\\textit{Volume of the cylinder}}", "=\\pi\\times",
            "\\textcolor{#66BB6A}{16^2}", "\\times", "\\textcolor{#64B5F6}{25}", "\\text{ mm}^3\\text{.}"
          )),
          st(12, { reveal: 5, fig: { r: "16", h: "25" } }, "(b) Volume", mt("=\\textcolor{#F06292}{6400\\pi\\text{ mm}^3}\\text{.}")),
        ] },
    ];

    // ════ L08 (B) — prefix QB ════
    ITEMS.l08 = [
      { n: "7", solved: true, title: "Sphere \u2014 radius & volume",
        deck: deckPath("qb7-solution"), figure: fig("sphere", { r: "r", rc: "#66BB6A", rDash: true }), figLabel: "Sphere",
        question: [
          { tag: "7.", tex: "\\text{The surface area of a spherical basketball is }\\color{#FFD54F}{\\mathbf{1850\\text{ cm}^2}}\\text{. Find}" },
          { tag: "(a)", tex: "\\color{#66BB6A}{\\mathbf{its\\ radius}}\\text{,}" },
          { tag: "(b)", tex: "\\color{#F48FB1}{\\mathbf{its\\ volume}}\\text{.}" },
          { tag: "", tex: "\\text{(Give the answers correct to 3 significant figures.)}" },
        ],
        steps: [
          st(0, { reveal: 0 }, "Problem (QB7)", mt("\\text{Surface area}=\\color{#FFD54F}{1850\\text{ cm}^2}\\text{.}")),
          st(1, { reveal: 1 }, "(a) Let r", mt("\\textit{Let }\\color{#66BB6A}{r}\\textit{ cm be the radius of the basketball}\\text{.}")),
          st(2, { reveal: 1 }, "(a) Formula", mt("\\text{Use }A=4\\pi r^2\\text{ to find the surface area}\\text{.}")),
          st(3, { reveal: 1 }, "(a) Set up", mt("4\\pi r^2=\\color{#FFD54F}{1850\\text{ cm}^2}\\text{.}")),
          st(4, { reveal: 1 }, "(a) Solve for r\u00b2", mt("r^2=\\dfrac{925}{2\\pi}\\text{.}")),
          st(5, { reveal: 1, fig: { r: "12.1" } }, "(a) Radius", mt("r=\\sqrt{\\dfrac{925}{2\\pi}}=\\color{#66BB6A}{12.1\\text{ cm}}\\text{ (3 s.f.)}\\text{.}")),
          st(6, { reveal: 2, fig: { r: "12.1" } }, "(b) Formula", mt("\\text{Use }V=\\tfrac43\\pi r^3\\text{ to find the }\\color{#F48FB1}{\\textbf{volume}}\\text{.}")),
          st(7, { reveal: 2, fig: { r: "12.1" } }, "(b) Substitute", mt("\\color{#F48FB1}{\\text{Volume}}\\color{#cdd6e4}{=\\tfrac43\\pi(}\\color{#66BB6A}{12.1}\\color{#cdd6e4}{)^3\\text{ cm}^3\\text{.}}")),
          st(8, { reveal: 2, fig: { r: "12.1" } }, "(b) Volume", mt("\\color{#F48FB1}{\\text{Volume}=7480\\text{ cm}^3}\\text{ (3 s.f.)}\\text{.}")),
        ] },
      { n: "11", solved: true, title: "Sphere \u2014 recasting",
        deck: deckPath("qb11-solution"),
        figure: fig("sphere_recast", { largeR: "15", largeRc: "#FFB74D" }),
        figLabel: "Large sphere",
        question: [
          { tag: "11.", tex: "\\text{A large solid metal sphere of }\\color{#FFB74D}{\\mathbf{radius\\ 15\\text{ cm}}}\\text{ is melted and recast into }\\color{#64B5F6}{\\mathbf{27\\ identical\\ small\\ solid\\ metal\\ spheres}}\\text{. Find}" },
          { tag: "(a)", tex: "\\color{#66BB6A}{\\mathbf{the\\ radius}}\\text{ of each small sphere,}" },
          { tag: "(b)", tex: "\\color{#FFD54F}{\\mathbf{the\\ surface\\ area}}\\text{ of each small sphere in terms of }\\pi\\text{.}" },
        ],
        steps: [
          st(0, { reveal: 0 }, "(a) Let r", mt("\\textit{Let }\\color{#66BB6A}{r}\\textit{ cm be the radius of each small sphere}\\text{.}")),
          st(1, { reveal: 0 }, "(a) Volume equality", mt("\\therefore\\ \\textit{Volume of the large sphere}=\\textit{Total volume of the }\\color{#64B5F6}{27\\ small\\ spheres}\\text{.}")),
          st(2, { reveal: 0 }, "(a) Set up", mt("\\therefore\\ \\tfrac43\\pi(\\color{#FFB74D}{15})^3=\\color{#64B5F6}{27}\\times\\tfrac43\\pi\\color{#66BB6A}{r}^3\\text{.}")),
          st(3, { reveal: 0 }, "(a) Simplify", mt("\\color{#66BB6A}{r}^3=125\\text{.}")),
          st(4, { reveal: 0 }, "(a) Radius", mt("\\color{#66BB6A}{r}=5\\text{.}")),
          st(5, { reveal: 0 }, "(a) Conclusion", mt("\\therefore\\ \\text{The radius of each small sphere is }\\color{#66BB6A}{5\\text{ cm}}\\text{.}")),
          st(6, { reveal: 0 }, "(b) Surface area", mt("\\color{#FFD54F}{\\textit{Surface area of each small sphere}}")),
          st(7, { reveal: 0 }, "(b) Substitute", mt("=4\\pi\\times\\color{#66BB6A}{5}^2\\text{ cm}^2\\text{.}")),
          st(8, { reveal: 0 }, "(b) Answer", mt("=\\color{#FFD54F}{100\\pi\\text{ cm}^2}\\text{.}")),
        ] },
    ];

    // ════ L09 (C) — prefix QC ════
    ITEMS.l09 = [
      { n: "2", solved: true, title: "Scale \u2014 drawing height",
        deck: deckPath("qc2-solution"), noAnim: true,
        question: [{ tag: "", tex: "\\text{Victor wants to make a scale drawing of a building with a scale of }\\color{#FFD54F}{\\mathbf{1\\text{ cm}}}:\\color{#F06292}{\\mathbf{9\\text{ m}}}.\\ \\text{If the actual height of the building is }\\color{#66BB6A}{\\mathbf{126\\text{ m}}},\\ \\text{what should be its }\\color{#64B5F6}{height\\ in\\ the\\ drawing}\\text{ in cm?}" }],
        steps: [
          st(0, null, "Question (QC2)", mt("\\text{Victor wants to make a scale drawing with scale }\\color{#FFD54F}{\\mathbf{1\\text{ cm}}}:\\color{#F06292}{\\mathbf{9\\text{ m}}}\\text{. Actual height }\\color{#66BB6A}{\\mathbf{126\\text{ m}}}\\text{. Find the }\\color{#64B5F6}{height\\ in\\ the\\ drawing}\\text{ (cm).}")),
          st(1, null, "Define variable", mt("\\text{Let }x\\text{ cm be the height of the building in the drawing.}")),
          st(2, null, "Set up ratio", mt("\\color{#4FC3F7}{x}\\text{ cm}:\\color{#66BB6A}{126}\\text{ m}=\\color{#FFD54F}{1}\\text{ cm}:\\color{#F06292}{9}\\text{ m}\\text{.}")),
          st(3, null, "Write as fractions", mt("\\dfrac{\\color{#4FC3F7}{x}\\text{ cm}}{\\color{#66BB6A}{126}\\text{ m}}=\\dfrac{\\color{#FFD54F}{1}\\text{ cm}}{\\color{#F06292}{9}\\text{ m}}\\text{.}")),
          st(4, null, "Solve for x", mt("\\color{#4FC3F7}{x}=\\dfrac{\\color{#FFD54F}{1}}{\\color{#F06292}{9}}\\times\\color{#66BB6A}{126}\\text{.}")),
          st(5, null, "Calculate", mt("\\color{#4FC3F7}{x}=\\color{#64B5F6}{14}\\text{.}")),
          st(6, null, "Conclusion", mt("\\therefore\\text{ The height of the building in the drawing is }\\color{#64B5F6}{14}\\text{ cm.}")),
        ] },
      { n: "4", solved: true, title: "Similar plane figures \u2014 (a)",
        deck: deckPath("qc4-solution"),
        figure: fig("similar_tri", { hyp1: "3", hyp2: "5", area1: "2.7", area2: "T" }),
        figLabel: "Similar triangles (a)",
        question: [
          { tag: "4.", tex: "\\color{#FFB74D}{\\mathbf{Find\\ the\\ unknown}}\\text{ in each of the following pairs of}" },
          { tag: "", tex: "\\text{similar plane figures, where the marked}" },
          { tag: "", tex: "\\text{lengths are corresponding lengths.}" },
          { tag: "(a)", tex: "\\text{Two similar right-angled triangles (see diagram).}" },
        ],
        steps: [
          st(0, { reveal: 0 }, "Question (QC4)", mlines("\\color{#FFB74D}{\\mathbf{Find\\ the\\ unknown}}\\text{ in each of the following pairs of}", "\\text{similar plane figures, where the marked}", "\\text{lengths are corresponding lengths.}")),
          st(1, { reveal: 1 }, "Figure (a)", mlines("\\text{Similar right triangles:}", "\\text{hypotenuse }\\color{#66BB6A}{3\\text{ cm}}\\text{ and }\\color{#66BB6A}{5\\text{ cm}}\\text{;}", "\\text{areas }\\color{#FFD54F}{2.7\\text{ cm}^2}\\text{ and }\\color{#FFD54F}{T\\text{ cm}^2}\\text{.}")),
          st(2, { reveal: 1 }, "Area ratio", mlines("\\text{Areas of similar figures satisfy}", "\\dfrac{A_2}{A_1}=\\left(\\dfrac{L_2}{L_1}\\right)^2")),
          st(3, { reveal: 2 }, "Set up", mt("\\dfrac{\\color{#64B5F6}{T}\\text{ cm}^2}{\\color{#FFD54F}{2.7}\\text{ cm}^2}=\\left(\\dfrac{\\color{#66BB6A}{5}}{\\color{#66BB6A}{3}}\\right)^2")),
          st(4, { reveal: 2 }, "Simplify", mt("\\dfrac{\\color{#64B5F6}{T}}{\\color{#FFD54F}{2.7}}=\\dfrac{25}{9}")),
          st(5, { reveal: 2 }, "Solve for T", mt("{\\color{#64B5F6}{T}}=\\dfrac{25}{9}")),
          st(6, { reveal: 2, fig: { area2: "7.5" } }, "Answer", mlines("{\\color{#64B5F6}{T}}={\\color{#64B5F6}{7.5}}", "\\times{\\color{#FFD54F}{2.7}}")),
        ] },
    ];

    return [
      { id: "l07", name: "L07 \u2014 Area & Volume (A)", prefix: "QA", open: true, groups: [{ name: "", items: ITEMS.l07 }] },
      { id: "l08", name: "L08 \u2014 Area & Volume (B)", prefix: "QB", open: false, groups: [{ name: "", items: ITEMS.l08 }] },
      { id: "l09", name: "L09 \u2014 Area & Volume (C)", prefix: "QC", open: false, groups: [{ name: "", items: ITEMS.l09 }] },
    ];
  };
})();
