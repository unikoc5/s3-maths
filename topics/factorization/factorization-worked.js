/* Worked Solutions tab — step-by-step Manim-slides walkthrough synced to a side panel,
 * plus hover/click method popups (cross method + identities) showing this question's numbers.
 * Demo question wired: Q9 (cross method -> grouping). Other questions are stubs (numbers preserved).
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  function E(t, a) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function kx(el, tex) { try { katex.render(tex, el, { throwOnError: false }); } catch (e) { el.textContent = tex; } }
  function renderTex(root) { root.querySelectorAll("[data-tex]").forEach((el) => kx(el, el.getAttribute("data-tex"))); }
  // LaTeX label centred at (cx,cy) inside an SVG via <foreignObject>
  function texSvg(p, cx, cy, tex, color, size, w, h) {
    w = w || 130; h = h || 40;
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    const div = document.createElement("div");
    div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;justify-content:center;color:" + color + ";font-size:" + (size || 16) + "px;";
    kx(div, tex); fo.appendChild(div); p.appendChild(fo);
  }

  // ── Q9 walkthrough steps. slide = MAIN deck slide; focus = cross-method sub-panel reveal level ──
  const Q9_STEPS = [
    { slide: 0, focus: 0, title: "Problem (Q9)", body: '<b>(a)</b> Factorize <span class="m" data-tex="x^2-2xy-35y^2"></span>.<br><b>(b)</b> Hence factorize <span class="m" data-tex="x^2-2xy-35y^2-7x+49y"></span>.' },
    { slide: 1, focus: 1, title: "Cross method: split x\u00b2", body: 'Use the <button class="method-chip" data-method="cross">cross method</button> (panel below). Put <span class="m" data-tex="x"></span> and <span class="m" data-tex="x"></span> in the left column so the first terms give <span class="m" data-tex="x\\cdot x=x^2"></span>.' },
    { slide: 1, focus: 2, title: "Pick the y-terms", body: 'Find two terms with product <span class="m" data-tex="-35y^2"></span>: choose <span class="m" data-tex="-7y"></span> and <span class="m" data-tex="+5y"></span>, since <span class="m" data-tex="(-7y)(+5y)=-35y^2"></span>.' },
    { slide: 1, focus: 3, title: "Cross-multiply", body: 'Multiply along the diagonals: <span class="m" data-tex="x\\cdot(+5y)=+5xy"></span> and <span class="m" data-tex="x\\cdot(-7y)=-7xy"></span>.' },
    { slide: 1, focus: 4, title: "Check the middle term", body: 'Add the cross-products: <span class="m" data-tex="+5xy-7xy=-2xy"></span> \u2713 — it matches the middle term.' },
    { slide: 2, focus: 5, title: "Read off the factors", body: 'Read each row across: <span class="m" data-tex="(x-7y)(x+5y)"></span>. &nbsp;<button class="method-chip" data-method="cross">view cross method</button>' },
    { slide: 3, focus: 0, title: "(b) Write the expression", body: '<span class="m" data-tex="x^2-2xy-35y^2-7x+49y"></span>' },
    { slide: 4, focus: 0, title: "Use part (a)", body: 'The first three terms are exactly part (a): <span class="m" data-tex="=(x-7y)(x+5y)-7x+49y"></span>.' },
    { slide: 5, focus: 0, title: "Group the last two terms", body: '<span class="m" data-tex="-7x+49y=-7(x-7y)"></span>, so <span class="m" data-tex="=(x-7y)(x+5y)-7(x-7y)"></span>.' },
    { slide: 6, focus: 0, title: "Take out the common factor", body: 'Both terms share <span class="m" data-tex="(x-7y)"></span>: <span class="m" data-tex="=(x-7y)\\,[(x+5y)-7]"></span>.' },
    { slide: 7, focus: 0, title: "Final answer", body: '<span class="m" data-tex="=(x-7y)(x+5y-7)"></span>' },
  ];
  // helpers for question records
  function q(n, tex) { return { n: n, short: tex, question: [{ tag: "", tex: tex }] }; }
  function qm(n, short, parts) { return { n: n, short: short, question: parts }; }
  function st(slide, focus, title, body) { return { slide: slide, focus: focus, title: title, body: body }; }
  function chip(method, label) {
    const inner = /[\^_\\]/.test(label) ? mt(label) : label;
    return '<button class="method-chip' + (method.indexOf("identity") === 0 ? " identity" : "") + '" data-method="' + method + '">' + inner + '</button>';
  }
  function mt(tex) { return '<span class="m" data-tex="' + tex + '"></span>'; }

  const QZ1 = {
    n: "1", short: "x^2-6x-7", title: "Factorize (cross method)", sub: "x^2-6x-7 — pick the option",
    deck: "../../slides/factorization/qz1-solution/index.html", solved: true,
    question: [{ tag: "", tex: "x^2-6x-7" }],
    methods: { cross: { expr: "x^2-6x-7", first: "x", t1: "-7", t2: "+1", p1: "-7x", p2: "+x", mid: "-6x", last: "-7", factors: "(x-7)(x+1)" } },
    steps: [
      st(0, null, "Problem (Qz1)", "Factorize " + mt("x^2-6x-7") + " and pick the matching option."),
      st(1, { type: "cross", reveal: 1 }, "Set up the cross", "Use the " + chip("cross", "cross method") + " (panel below): put " + mt("x") + " and " + mt("x") + " in the left column so the first terms give " + mt("x^2") + "."),
      st(1, { type: "cross", reveal: 3 }, "Find the number pair", "Two numbers with product " + mt("-7") + " and sum " + mt("-6") + ": choose " + mt("-7") + " and " + mt("+1") + "."),
      st(1, { type: "cross", reveal: 4 }, "Check the middle term", "Cross-products " + mt("+x") + " and " + mt("-7x") + " add to " + mt("-6x") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read off the factors", "Read each row across: " + mt("(x-7)(x+1)") + "."),
      st(3, null, "Confirm the option", "This matches <b>option B</b>: " + mt("(x+1)(x-7)") + "."),
    ],
  };

  // The fully-built demo (Quiz Q9). Numbers/prefix per the source-naming convention below.
  const QZ9 = {
    n: "9", short: "x^2-2xy-35y^2\\ (\\text{+ hence})", title: "Factorize",
    sub: "Cross method, then grouping",
    deck: "../../slides/factorization/q9-solution/index.html",
    solved: true,
    question: [
      { tag: "(a)", tex: "x^2-2xy-35y^2" },
      { tag: "(b)", tex: "\\text{Hence, } x^2-2xy-35y^2-7x+49y" },
    ],
    steps: Q9_STEPS,
    methods: {
      cross: { expr: "x^2-2xy-35y^2", first: "x", t1: "-7y", t2: "+5y", p1: "-7xy", p2: "+5xy", mid: "-2xy", last: "-35y^2", factors: "(x-7y)(x+5y)" },
    },
  };

  function deckPath(id) { return "../../slides/factorization/" + id + "/index.html"; }

  const QZ2 = {
    n: "2", short: "49p^2+9q^2-42pq", title: "Factorize (perfect square)", sub: "49p^2+9q^2-42pq",
    deck: deckPath("qz2-solution"), solved: true,
    question: [{ tag: "", tex: "49p^2+9q^2-42pq" }],
    methods: {
      psq: { a2: "49p^2", b2: "9q^2", a: "7p", b: "3q", sign: "-", mid: "42pq", result: "(7p-3q)^2" },
      "identity-diff": { a: "7p", b: "3q", sub: "(7p-3q)^2=49p^2-42pq+9q^2" },
    },
    steps: [
      st(0, null, "Problem (Qz2)", "Factorize " + mt("49p^2+9q^2-42pq") + "."),
      st(1, null, "Rearrange", "Write in descending order: " + mt("49p^2-42pq+9q^2") + "."),
      st(2, { type: "psq", reveal: 1 }, "Spot the squares", "It fits " + chip("identity-diff", "(a-b)^2") + ": " + mt("(7p)^2") + " and " + mt("(3q)^2") + "."),
      st(2, { type: "psq", reveal: 2 }, "Check the middle", "Middle term " + mt("2(7p)(3q)=42pq") + " matches \u2713."),
      st(3, { type: "psq", reveal: 3 }, "Write the square", "So " + mt("=(7p-3q)^2") + "."),
      st(4, null, "Confirm the option", "Matches <b>option C</b>."),
    ],
  };

  const QZ3 = {
    n: "3", short: "x+2\\ \\text{a factor?}", title: "Which has no factor (x+2)?", sub: "I, II, III — find the odd one",
    deck: deckPath("qz3-solution"), solved: true,
    question: [
      { tag: "", tex: "\\text{Which does NOT have } x+2 \\text{ as a factor?}" },
      { tag: "I.", tex: "x^2+4" }, { tag: "II.", tex: "x^2-4" }, { tag: "III.", tex: "(x-3)^2-25" },
    ],
    methods: { "identity-dos": { a: "x", b: "2", sub: "x^2-4=(x+2)(x-2)" } },
    steps: [
      st(0, null, "Problem (Qz3)", "Find which of I, II, III has no factor " + mt("(x+2)") + "."),
      st(2, { type: "dos", reveal: 2, data: { a2: "x^2", b2: "4", a: "x", b: "2", result: "(x+2)(x-2)" } }, "Test II", "Use " + chip("identity-dos", "difference of squares") + ": " + mt("x^2-4=(x+2)(x-2)") + " \u2014 has " + mt("(x+2)") + "."),
      st(4, { type: "dos", reveal: 1, data: { a2: "(x-3)^2", b2: "5^2", a: "(x-3)", b: "5", result: "(x+2)(x-8)" } }, "Test III \u2014 spot DOS", mt("(x-3)^2-25") + " is a difference of squares: " + mt("=(x-3)^2-5^2") + "."),
      st(5, { type: "dos", reveal: 2, data: { a2: "(x-3)^2", b2: "5^2", a: "(x-3)", b: "5", result: "(x+2)(x-8)" } }, "Test III \u2014 factor", mt("=(x+2)(x-8)") + " \u2014 has " + mt("(x+2)") + "."),
      st(6, null, "Test I", mt("x^2+4") + " is a sum of squares \u2014 it cannot be factorized, so it has no factor " + mt("(x+2)") + "."),
      st(7, null, "Conclusion", "Only <b>I</b> lacks the factor: <b>option A</b>."),
    ],
  };

  const QZ4 = {
    n: "4", short: "x^2-8xy+15y^2-5x+15y", title: "Factorize (cross + grouping)", sub: "cross method, then group",
    deck: deckPath("qz4-solution"), solved: true,
    question: [{ tag: "", tex: "x^2-8xy+15y^2-5x+15y" }],
    methods: {
      cross: { expr: "x^2-8xy+15y^2", first: "x", t1: "-3y", t2: "-5y", p1: "-3xy", p2: "-5xy", mid: "-8xy", last: "15y^2", factors: "(x-3y)(x-5y)" },
      group: { g1: "(x-3y)(x-5y)", g2: "-5x+15y", f1: "(x-3y)(x-5y)", f2: "-5(x-3y)", common: "(x-3y)", result: "(x-3y)(x-5y-5)" },
      common: { expr: "(x-3y)(x-5y)-5(x-3y)", gcf: "(x-3y)", inner: "(x-5y)-5", result: "(x-3y)(x-5y-5)" },
    },
    steps: [
      st(0, null, "Problem (Qz4)", "Factorize " + mt("x^2-8xy+15y^2-5x+15y") + "."),
      st(1, { type: "cross", reveal: 5 }, "Factor the first three", "Use the " + chip("cross", "cross method") + " on " + mt("x^2-8xy+15y^2") + " to get " + mt("(x-3y)(x-5y)") + "."),
      st(2, { type: "group", reveal: 2 }, "Group the last two", chip("group", "Group") + " " + mt("-5x+15y=-5(x-3y)") + ", so " + mt("=-5(x-3y)+(x-3y)(x-5y)") + "."),
      st(3, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("(x-3y)") + ": " + mt("=(x-3y)(x-5y-5)") + "."),
      st(4, null, "Confirm the option", "Matches <b>option A</b>."),
    ],
  };

  const QZ5 = {
    n: "5", short: "x^2(x+y)-y^2(y+x)", title: "Factorize (common factor + DOS)", sub: "common bracket, then a^2-b^2",
    deck: deckPath("qz5-solution"), solved: true,
    question: [{ tag: "", tex: "x^2(x+y)-y^2(y+x)" }],
    methods: {
      common: { expr: "x^2(x+y)-y^2(y+x)", gcf: "(x+y)", inner: "x^2-y^2", result: "(x+y)(x^2-y^2)" },
      dos: { a2: "x^2", b2: "y^2", a: "x", b: "y", result: "(x+y)(x-y)" },
      "identity-dos": { a: "x", b: "y", sub: "x^2-y^2=(x+y)(x-y)" },
    },
    steps: [
      st(0, null, "Problem (Qz5)", "Factorize " + mt("x^2(x+y)-y^2(y+x)") + "."),
      st(1, { type: "common", reveal: 2 }, "Common bracket", "Note " + mt("(y+x)=(x+y)") + ", so " + chip("common", "common factor") + " " + mt("(x+y)") + ": " + mt("=(x+y)(x^2-y^2)") + "."),
      st(2, { type: "dos", reveal: 2 }, "Difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("x^2-y^2=(x+y)(x-y)") + "."),
      st(3, null, "Combine repeated factor", mt("=(x+y)^2(x-y)") + "."),
      st(4, null, "Confirm the option", "Matches <b>option A</b>."),
    ],
  };

  const QZ6 = {
    n: "6", short: "y^2+4y-12", title: "Factorize (cross method)", sub: "y^2+4y-12",
    deck: deckPath("qz6-solution"), solved: true,
    question: [{ tag: "", tex: "y^2+4y-12" }],
    methods: { cross: { expr: "y^2+4y-12", first: "y", t1: "+6", t2: "-2", p1: "+6y", p2: "-2y", mid: "+4y", last: "-12", factors: "(y+6)(y-2)" } },
    steps: [
      st(0, null, "Problem (Qz6)", "Factorize " + mt("y^2+4y-12") + "."),
      st(0, { type: "cross", reveal: 1 }, "Set up the cross", "Use the " + chip("cross", "cross method") + ": product " + mt("-12") + ", sum " + mt("+4") + "."),
      st(0, { type: "cross", reveal: 4 }, "Find the pair", "Choose " + mt("+6") + " and " + mt("-2") + "; check " + mt("+6y-2y=+4y") + " \u2713."),
      st(1, { type: "cross", reveal: 5 }, "Read the factors", mt("=(y+6)(y-2)") + "."),
      st(2, null, "Confirm the option", "Matches <b>option C</b>."),
    ],
  };

  const QZ7 = {
    n: "7", short: "n^2+12n+35", title: "Factorize (cross method)", sub: "n^2+12n+35",
    deck: deckPath("qz7-solution"), solved: true,
    question: [{ tag: "", tex: "n^2+12n+35" }],
    methods: { cross: { expr: "n^2+12n+35", first: "n", t1: "+5", t2: "+7", p1: "+7n", p2: "+5n", mid: "+12n", last: "35", factors: "(n+5)(n+7)" } },
    steps: [
      st(0, null, "Problem (Qz7)", "Factorize " + mt("n^2+12n+35") + "."),
      st(0, { type: "cross", reveal: 1 }, "Set up the cross", "Use the " + chip("cross", "cross method") + ": product " + mt("35") + ", sum " + mt("12") + "."),
      st(0, { type: "cross", reveal: 4 }, "Find the pair", "Choose " + mt("+5") + " and " + mt("+7") + "; " + mt("+5n+7n=+12n") + " \u2713."),
      st(1, { type: "cross", reveal: 5 }, "Read the factors", mt("=(n+5)(n+7)") + "."),
      st(2, null, "Confirm the option", "Matches <b>option A</b>."),
    ],
  };

  const QZ8_A = { expr: "x^2+8x+7", first: "x", t1: "+1", t2: "+7", p1: "+7x", p2: "+x", mid: "+8x", last: "7", factors: "(x+1)(x+7)" };
  const QZ8_B = { expr: "y^2-11y-26", first: "y", t1: "+2", t2: "-13", p1: "-13y", p2: "+2y", mid: "-11y", last: "-26", factors: "(y+2)(y-13)" };
  const QZ8 = {
    n: "8", short: "x^2+8x+7\\,;\\ y^2-11y-26", title: "Factorize (cross method)", sub: "two quadratics",
    deck: deckPath("qz8-solution"), solved: true,
    question: [{ tag: "(a)", tex: "x^2+8x+7" }, { tag: "(b)", tex: "y^2-11y-26" }],
    methods: { cross: QZ8_A },
    steps: [
      st(0, null, "Problem (Qz8)", "Factorize (a) " + mt("x^2+8x+7") + " and (b) " + mt("y^2-11y-26") + "."),
      st(0, { type: "cross", reveal: 4, data: QZ8_A }, "(a) Cross method", "Use the " + chip("cross", "cross method") + ": " + mt("+1") + " and " + mt("+7") + " (product 7, sum 8)."),
      st(1, { type: "cross", reveal: 5, data: QZ8_A }, "(a) Read factors", mt("=(x+1)(x+7)") + "."),
      st(2, { type: "cross", reveal: 4, data: QZ8_B }, "(b) Cross method", "Now " + mt("y^2-11y-26") + ": " + mt("+2") + " and " + mt("-13") + " (product -26, sum -11)."),
      st(3, { type: "cross", reveal: 5, data: QZ8_B }, "(b) Read factors", mt("=(y+2)(y-13)") + "."),
    ],
  };

  const QZ10_AC = { expr: "-72u^2+240uv-200v^2", gcf: "-8", inner: "9u^2-30uv+25v^2", result: "-8(9u^2-30uv+25v^2)" };
  const QZ10_AP = { a2: "9u^2", b2: "25v^2", a: "3u", b: "5v", sign: "-", mid: "30uv", result: "(3u-5v)^2" };
  const QZ10_BC = { expr: "63xy^2+84xyz+28xz^2", gcf: "7x", inner: "9y^2+12yz+4z^2", result: "7x(9y^2+12yz+4z^2)" };
  const QZ10_BP = { a2: "9y^2", b2: "4z^2", a: "3y", b: "2z", sign: "+", mid: "12yz", result: "(3y+2z)^2" };
  const QZ10 = {
    n: "10", short: "240uv-72u^2-200v^2\\ (\\text{+ b})", title: "Factorize (common factor + perfect square)", sub: "two parts",
    deck: deckPath("qz10-solution"), solved: true,
    question: [{ tag: "(a)", tex: "240uv-72u^2-200v^2" }, { tag: "(b)", tex: "63xy^2+28xz^2+84xyz" }],
    methods: { common: QZ10_AC, "identity-diff": { a: "3u", b: "5v", sub: "(3u-5v)^2=9u^2-30uv+25v^2" } },
    steps: [
      st(0, null, "Problem (Qz10)", "Factorize (a) " + mt("240uv-72u^2-200v^2") + " and (b) " + mt("63xy^2+28xz^2+84xyz") + "."),
      st(1, { type: "common", reveal: 2, data: QZ10_AC }, "(a) Common factor", chip("common", "Take out") + " " + mt("-8") + ": " + mt("=-8(9u^2-30uv+25v^2)") + "."),
      st(2, { type: "psq", reveal: 2, data: QZ10_AP }, "(a) Spot the perfect square", "Inside the bracket: " + mt("9u^2-30uv+25v^2=(3u)^2-2(3u)(5v)+(5v)^2") + "."),
      st(3, { type: "psq", reveal: 3, data: QZ10_AP }, "(a) Write the square", chip("identity-diff", "(a-b)^2") + ": " + mt("=-8(3u-5v)^2") + "."),
      st(4, null, "(b) Part (b)", "Factorize " + mt("63xy^2+28xz^2+84xyz") + "."),
      st(5, { type: "common", reveal: 2, data: QZ10_BC }, "(b) Common factor", "Take out " + mt("7x") + ": " + mt("=7x(9y^2+12yz+4z^2)") + "."),
      st(6, { type: "psq", reveal: 2, data: QZ10_BP }, "(b) Spot the perfect square", "Inside the bracket: " + mt("9y^2+12yz+4z^2=(3y)^2+2(3y)(2z)+(2z)^2") + "."),
      st(7, { type: "psq", reveal: 3, data: QZ10_BP }, "(b) Write the square", "Perfect square: " + mt("=7x(3y+2z)^2") + "."),
    ],
  };

  const QZ11 = {
    n: "11", short: "a^4-a^2-2a^2b^2-2ab+b^4-b^2", title: "Factorize (grouping + squares)", sub: "regroup into squares",
    deck: deckPath("qz11-solution"), solved: true,
    question: [{ tag: "", tex: "a^4-a^2-2a^2b^2-2ab+b^4-b^2" }],
    methods: {
      group: { g1: "a^4-2a^2b^2+b^4", g2: "-(a^2+2ab+b^2)", f1: "(a^2-b^2)^2", f2: "-(a+b)^2", result: "(a+b)^2[(a-b)^2-1]" },
      "identity-diff": { a: "a^2", b: "b^2", sub: "(a^2-b^2)^2=a^4-2a^2b^2+b^4" },
      "identity-dos": { a: "a", b: "b", sub: "a^2-b^2=(a-b)(a+b)" },
      common: { expr: "[(a-b)(a+b)]^2-(a+b)^2", gcf: "(a+b)^2", inner: "(a-b)^2-1", result: "(a+b)^2[(a-b)^2-1]" },
    },
    steps: [
      st(0, null, "Problem (Qz11)", "Factorize " + mt("a^4-a^2-2a^2b^2-2ab+b^4-b^2") + "."),
      st(1, { type: "group", reveal: 1, data: { g1: "a^4-2a^2b^2+b^4", g2: "-(a^2+2ab+b^2)", f1: "(a^2-b^2)^2", f2: "-(a+b)^2", common: "(a+b)", result: "(a+b)^2[(a-b)^2-1]" } }, "Regroup into two squares", chip("group", "Group") + " the terms: " + mt("(a^4-2a^2b^2+b^4)-(a^2+2ab+b^2)") + "."),
      st(2, { type: "psq", reveal: 3, data: { a2: "a^4", b2: "b^4", a: "a^2", b: "b^2", sign: "-", mid: "2a^2b^2", result: "(a^2-b^2)^2" } }, "Each group is a square", chip("identity-diff", "(a-b)^2") + ": " + mt("=(a^2-b^2)^2-(a+b)^2") + "."),
      st(3, { type: "dos", reveal: 2, data: { a2: "a^2", b2: "b^2", a: "a", b: "b", result: "(a-b)(a+b)" } }, "Difference of squares inside", chip("identity-dos", "a^2-b^2") + ": " + mt("=[(a-b)(a+b)]^2-(a+b)^2") + "."),
      st(4, { type: "common", reveal: 2, data: { expr: "[(a-b)(a+b)]^2-(a+b)^2", gcf: "(a+b)^2", inner: "(a-b)^2-1", result: "(a+b)^2[(a-b)^2-1]" } }, "Common factor (a+b)^2", chip("common", "Common factor") + " " + mt("(a+b)^2") + ": " + mt("=(a+b)^2[(a-b)^2-1]") + "."),
      st(5, { type: "dos", reveal: 2, data: { a2: "(a-b)^2", b2: "1", a: "(a-b)", b: "1", result: "(a-b-1)(a-b+1)" } }, "Final difference of squares", mt("(a-b)^2-1") + " is a difference of squares: " + mt("=(a+b)^2(a-b-1)(a-b+1)") + "."),
    ],
  };

  // builders for the common single-method patterns
  function crossQ(n, deckId, qtex, cross) {
    return {
      n: n, short: qtex, title: "Factorize (cross method)", sub: qtex,
      deck: deckPath(deckId), solved: true,
      question: [{ tag: "", tex: qtex }],
      methods: { cross: cross },
      steps: [
        st(0, null, "Problem (Q" + n + ")", "Factorize " + mt(qtex) + "."),
        st(0, { type: "cross", reveal: 1 }, "Set up the cross", "Use the " + chip("cross", "cross method") + " on " + mt(cross.expr) + "."),
        st(0, { type: "cross", reveal: 4 }, "Find the pair & check", "Cross-products add to " + mt(cross.mid) + " \u2713."),
        st(1, { type: "cross", reveal: 5 }, "Read the factors", mt("=" + cross.factors) + "."),
      ],
    };
  }
  function psqQ(n, deckId, qtex, psq, idk, idsub) {
    const methods = { psq: psq };
    methods[idk] = { a: psq.a, b: psq.b, sub: idsub };
    const idlabel = idk === "identity-sum" ? "(a+b)^2" : "(a-b)^2";
    return {
      n: n, short: qtex, title: "Factorize (perfect square)", sub: qtex,
      deck: deckPath(deckId), solved: true,
      question: [{ tag: "", tex: qtex }],
      methods: methods,
      steps: [
        st(0, null, "Problem (Q" + n + ")", "Factorize " + mt(qtex) + "."),
        st(1, { type: "psq", reveal: 1 }, "Spot the squares", "Recognise " + chip(idk, idlabel) + ": " + mt(psq.a2) + " and " + mt(psq.b2) + "."),
        st(1, { type: "psq", reveal: 2 }, "Check the middle", mt("2(" + psq.a + ")(" + psq.b + ")=" + psq.mid) + " \u2713."),
        st(2, { type: "psq", reveal: 3 }, "Write the square", mt("=" + psq.result) + "."),
      ],
    };
  }

  const QA1 = psqQ("1", "qa1-solution", "a^2+4a+4", { a2: "a^2", b2: "4", a: "a", b: "2", sign: "+", mid: "4a", result: "(a+2)^2" }, "identity-sum", "(a+2)^2=a^2+4a+4");
  const QA4 = psqQ("4", "qa4-solution", "9b^2-6b+1", { a2: "9b^2", b2: "1", a: "3b", b: "1", sign: "-", mid: "6b", result: "(3b-1)^2" }, "identity-diff", "(3b-1)^2=9b^2-6b+1");
  const QA13 = crossQ("13", "qa13-solution", "x^2+4x+3", { expr: "x^2+4x+3", first: "x", t1: "+1", t2: "+3", p1: "+3x", p2: "+x", mid: "+4x", last: "3", factors: "(x+1)(x+3)" });
  const QA19 = crossQ("19", "qa19-solution", "p^2+8pq+15q^2", { expr: "p^2+8pq+15q^2", first: "p", t1: "+3q", t2: "+5q", p1: "+5pq", p2: "+3pq", mid: "+8pq", last: "15q^2", factors: "(p+3q)(p+5q)" });
  const QA22 = crossQ("22", "qa22-solution", "x^2+17xy+30y^2", { expr: "x^2+17xy+30y^2", first: "x", t1: "+2y", t2: "+15y", p1: "+15xy", p2: "+2xy", mid: "+17xy", last: "30y^2", factors: "(x+2y)(x+15y)" });
  const QA23 = crossQ("23", "qa23-solution", "x^2-14x+13", { expr: "x^2-14x+13", first: "x", t1: "-1", t2: "-13", p1: "-13x", p2: "-x", mid: "-14x", last: "13", factors: "(x-1)(x-13)" });
  const QA30 = crossQ("30", "qa30-solution", "a^2-18ab+56b^2", { expr: "a^2-18ab+56b^2", first: "a", t1: "-4b", t2: "-14b", p1: "-14ab", p2: "-4ab", mid: "-18ab", last: "56b^2", factors: "(a-4b)(a-14b)" });

  const QA10 = {
    n: "10", short: "32x^2-50y^2", title: "Factorize (common factor + DOS)", sub: "take out 2, then a^2-b^2",
    deck: deckPath("qa10-solution"), solved: true,
    question: [{ tag: "", tex: "32x^2-50y^2" }],
    methods: {
      common: { expr: "32x^2-50y^2", gcf: "2", inner: "16x^2-25y^2", result: "2(16x^2-25y^2)" },
      dos: { a2: "16x^2", b2: "25y^2", a: "4x", b: "5y", result: "(4x+5y)(4x-5y)" },
      "identity-dos": { a: "4x", b: "5y", sub: "16x^2-25y^2=(4x+5y)(4x-5y)" },
    },
    steps: [
      st(0, null, "Problem (Q10)", "Factorize " + mt("32x^2-50y^2") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("2") + ": " + mt("=2(16x^2-25y^2)") + "."),
      st(2, { type: "dos", reveal: 1 }, "Recognise difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("16x^2=(4x)^2") + ", " + mt("25y^2=(5y)^2") + "."),
      st(3, { type: "dos", reveal: 2 }, "Apply the formula", mt("=2(4x+5y)(4x-5y)") + "."),
    ],
  };

  const QA12 = {
    n: "12", short: "5x^2+20x+20\\ (\\text{+ hence})", title: "Factorize (perfect square, then DOS)", sub: "use (a) for (b)",
    deck: deckPath("qa12-solution"), solved: true,
    question: [{ tag: "(a)", tex: "5x^2+20x+20" }, { tag: "(b)", tex: "5x^2+20x-25" }],
    methods: {
      common: { expr: "5x^2+20x+20", gcf: "5", inner: "x^2+4x+4", result: "5(x+2)^2" },
      psq: { a2: "x^2", b2: "4", a: "x", b: "2", sign: "+", mid: "4x", result: "(x+2)^2" },
      dos: { a2: "(x+2)^2", b2: "3^2", a: "(x+2)", b: "3", result: "(x+5)(x-1)" },
      "identity-dos": { a: "(x+2)", b: "3", sub: "(x+2)^2-3^2=(x+5)(x-1)" },
      "identity-sum": { a: "x", b: "2", sub: "(x+2)^2=x^2+4x+4" },
    },
    steps: [
      st(0, null, "Problem (Q12)", "(a) Factorize " + mt("5x^2+20x+20") + "; (b) hence " + mt("5x^2+20x-25") + "."),
      st(1, { type: "common", reveal: 2 }, "(a) Take out 5", chip("common", "Take out") + " " + mt("5") + ": " + mt("=5(x^2+4x+4)") + "."),
      st(2, { type: "psq", reveal: 3, data: { a2: "x^2", b2: "4", a: "x", b: "2", sign: "+", mid: "4x", result: "(x+2)^2" } }, "(a) Perfect square inside", chip("identity-sum", "(a+b)^2") + ": " + mt("x^2+4x+4=(x+2)^2") + ", so " + mt("=5(x+2)^2") + "."),
      st(3, null, "(b) Part (b)", "Start with " + mt("5x^2+20x-25") + "."),
      st(4, null, "(b) Rewrite using (a)", "Regroup: " + mt("=(5x^2+20x+20)-45") + "."),
      st(5, null, "(b) Substitute from (a)", "From (a): " + mt("=5(x+2)^2-45") + "."),
      st(6, { type: "dos", reveal: 1 }, "(b) Difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("=5[(x+2)^2-3^2]") + "."),
      st(7, { type: "dos", reveal: 2 }, "(b) Final factors", mt("=5(x+5)(x-1)") + "."),
    ],
  };

  const QA40 = {
    n: "40", short: "m^2n-10mnk+21k^2n", title: "Factorize (common factor + cross)", sub: "take out n, then cross",
    deck: deckPath("qa40-solution"), solved: true,
    question: [{ tag: "", tex: "m^2n-10mnk+21k^2n" }],
    methods: {
      common: { expr: "m^2n-10mnk+21k^2n", gcf: "n", inner: "m^2-10mk+21k^2", result: "n(m^2-10mk+21k^2)" },
      cross: { expr: "m^2-10mk+21k^2", first: "m", t1: "-3k", t2: "-7k", p1: "-7mk", p2: "-3mk", mid: "-10mk", last: "21k^2", factors: "(m-3k)(m-7k)" },
    },
    steps: [
      st(0, null, "Problem (Q40)", "Factorize " + mt("m^2n-10mnk+21k^2n") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("n") + ": " + mt("=n(m^2-10mk+21k^2)") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method on the bracket", "Use the " + chip("cross", "cross method") + ": pair " + mt("-3k") + ", " + mt("-7k") + " gives " + mt("-10mk") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=n(m-3k)(m-7k)") + "."),
    ],
  };

  const QA46 = {
    n: "46", short: "x^4-16x^2y^2+63y^4", title: "Factorize (cross + DOS)", sub: "cross in x^2, then DOS",
    deck: deckPath("qa46-solution"), solved: true,
    question: [{ tag: "", tex: "x^4-16x^2y^2+63y^4" }],
    methods: {
      cross: { expr: "x^4-16x^2y^2+63y^4", first: "x^2", t1: "-7y^2", t2: "-9y^2", p1: "-9x^2y^2", p2: "-7x^2y^2", mid: "-16x^2y^2", last: "63y^4", factors: "(x^2-7y^2)(x^2-9y^2)" },
      dos: { a2: "x^2", b2: "9y^2", a: "x", b: "3y", result: "(x+3y)(x-3y)" },
      "identity-dos": { a: "x", b: "3y", sub: "x^2-9y^2=(x+3y)(x-3y)" },
    },
    steps: [
      st(0, null, "Problem (Q46)", "Factorize " + mt("x^4-16x^2y^2+63y^4") + "."),
      st(1, { type: "cross", reveal: 5 }, "Cross method (treat x^2 as the variable)", "Use the " + chip("cross", "cross method") + ": " + mt("=(x^2-7y^2)(x^2-9y^2)") + "."),
      st(2, { type: "dos", reveal: 1 }, "Spot a difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("x^2-9y^2") + " is a difference of squares."),
      st(2, { type: "dos", reveal: 2 }, "Apply the formula", mt("=(x^2-7y^2)(x+3y)(x-3y)") + "."),
    ],
  };

  const QA61 = {
    n: "61", short: "-6st+s^2-91t^2", title: "Factorize (cross method)", sub: "rearrange, then cross",
    deck: deckPath("qa61-solution"), solved: true,
    question: [{ tag: "", tex: "-6st+s^2-91t^2" }],
    methods: { cross: { expr: "s^2-6st-91t^2", first: "s", t1: "+7t", t2: "-13t", p1: "-13st", p2: "+7st", mid: "-6st", last: "-91t^2", factors: "(s+7t)(s-13t)" } },
    steps: [
      st(0, null, "Problem (Q61)", "Factorize " + mt("-6st+s^2-91t^2") + "."),
      st(1, null, "Rearrange", "Descending order: " + mt("s^2-6st-91t^2") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method", "Use the " + chip("cross", "cross method") + ": pair " + mt("+7t") + ", " + mt("-13t") + " gives " + mt("-6st") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=(s+7t)(s-13t)") + "."),
    ],
  };

  const QA66 = {
    n: "66", short: "3a^2-15ab-42b^2", title: "Factorize (common factor + cross)", sub: "take out 3, then cross",
    deck: deckPath("qa66-solution"), solved: true,
    question: [{ tag: "", tex: "3a^2-15ab-42b^2" }],
    methods: {
      common: { expr: "3a^2-15ab-42b^2", gcf: "3", inner: "a^2-5ab-14b^2", result: "3(a^2-5ab-14b^2)" },
      cross: { expr: "a^2-5ab-14b^2", first: "a", t1: "+2b", t2: "-7b", p1: "-7ab", p2: "+2ab", mid: "-5ab", last: "-14b^2", factors: "(a+2b)(a-7b)" },
    },
    steps: [
      st(0, null, "Problem (Q66)", "Factorize " + mt("3a^2-15ab-42b^2") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("3") + ": " + mt("=3(a^2-5ab-14b^2)") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method on the bracket", "Use the " + chip("cross", "cross method") + ": pair " + mt("+2b") + ", " + mt("-7b") + " gives " + mt("-5ab") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=3(a+2b)(a-7b)") + "."),
    ],
  };

  const QA69 = {
    n: "69", short: "-119\\theta\\phi-42\\theta^2+98\\phi^2", title: "Factorize (common factor + cross)", sub: "take out -7, then cross",
    deck: deckPath("qa69-solution"), solved: true,
    question: [{ tag: "", tex: "-119\\theta\\phi-42\\theta^2+98\\phi^2" }],
    methods: {
      common: { expr: "-42\\theta^2-119\\theta\\phi+98\\phi^2", gcf: "-7", inner: "6\\theta^2+17\\theta\\phi-14\\phi^2", result: "-7(6\\theta^2+17\\theta\\phi-14\\phi^2)" },
      cross: { expr: "6\\theta^2+17\\theta\\phi-14\\phi^2", first: "2\\theta", first2: "3\\theta", t1: "+7\\phi", t2: "-2\\phi", p1: "-4\\theta\\phi", p2: "+21\\theta\\phi", mid: "+17\\theta\\phi", last: "-14\\phi^2", factors: "(2\\theta+7\\phi)(3\\theta-2\\phi)" },
    },
    steps: [
      st(0, null, "Problem (Q69)", "Factorize " + mt("-119\\theta\\phi-42\\theta^2+98\\phi^2") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("-7") + ": " + mt("=-7(6\\theta^2+17\\theta\\phi-14\\phi^2)") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method (leading coefficient)", "Use the " + chip("cross", "cross method") + ": " + mt("2\\theta,\\,3\\theta") + " and " + mt("+7\\phi,\\,-2\\phi") + " give " + mt("+17\\theta\\phi") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=-7(2\\theta+7\\phi)(3\\theta-2\\phi)") + "."),
    ],
  };

  const QA70 = {
    n: "70", short: "24\\alpha^4\\gamma^2+90\\beta^4\\gamma^2-94\\alpha^2\\beta^2\\gamma^2", title: "Factorize (common + cross + DOS)", sub: "take out 2\\gamma^2, cross, then DOS",
    deck: deckPath("qa70-solution"), solved: true,
    question: [{ tag: "", tex: "24\\alpha^4\\gamma^2+90\\beta^4\\gamma^2-94\\alpha^2\\beta^2\\gamma^2" }],
    methods: {
      common: { expr: "24\\alpha^4\\gamma^2+90\\beta^4\\gamma^2-94\\alpha^2\\beta^2\\gamma^2", gcf: "2\\gamma^2", inner: "12\\alpha^4-47\\alpha^2\\beta^2+45\\beta^4", result: "2\\gamma^2(12\\alpha^4-47\\alpha^2\\beta^2+45\\beta^4)" },
      cross: { expr: "12\\alpha^4-47\\alpha^2\\beta^2+45\\beta^4", first: "4\\alpha^2", first2: "3\\alpha^2", t1: "-9\\beta^2", t2: "-5\\beta^2", p1: "-20\\alpha^2\\beta^2", p2: "-27\\alpha^2\\beta^2", mid: "-47\\alpha^2\\beta^2", last: "45\\beta^4", factors: "(4\\alpha^2-9\\beta^2)(3\\alpha^2-5\\beta^2)" },
      dos: { a2: "4\\alpha^2", b2: "9\\beta^2", a: "2\\alpha", b: "3\\beta", result: "(2\\alpha+3\\beta)(2\\alpha-3\\beta)" },
      "identity-dos": { a: "2\\alpha", b: "3\\beta", sub: "4\\alpha^2-9\\beta^2=(2\\alpha+3\\beta)(2\\alpha-3\\beta)" },
    },
    steps: [
      st(0, null, "Problem (Q70)", "Factorize " + mt("24\\alpha^4\\gamma^2+90\\beta^4\\gamma^2-94\\alpha^2\\beta^2\\gamma^2") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out the common factor", chip("common", "Common factor") + " " + mt("2\\gamma^2") + ": " + mt("=2\\gamma^2(12\\alpha^4-47\\alpha^2\\beta^2+45\\beta^4)") + "."),
      st(2, { type: "cross", reveal: 5 }, "Cross method (in \\alpha^2,\\,\\beta^2)", "Use the " + chip("cross", "cross method") + ": " + mt("=2\\gamma^2(4\\alpha^2-9\\beta^2)(3\\alpha^2-5\\beta^2)") + "."),
      st(3, { type: "dos", reveal: 2 }, "Difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("4\\alpha^2-9\\beta^2=(2\\alpha+3\\beta)(2\\alpha-3\\beta)") + ", so " + mt("=2\\gamma^2(2\\alpha+3\\beta)(2\\alpha-3\\beta)(3\\alpha^2-5\\beta^2)") + "."),
    ],
  };

  const QB6 = {
    n: "6", short: "-6s+s^2-91", title: "Factorize (cross method)", sub: "rearrange, then cross",
    deck: deckPath("qb6-solution"), solved: true,
    question: [{ tag: "", tex: "-6s+s^2-91" }],
    methods: { cross: { expr: "s^2-6s-91", first: "s", t1: "+7", t2: "-13", p1: "-13s", p2: "+7s", mid: "-6s", last: "-91", factors: "(s+7)(s-13)" } },
    steps: [
      st(0, null, "Problem (Q6)", "Factorize " + mt("-6s+s^2-91") + "."),
      st(1, null, "Rearrange", "Descending order: " + mt("s^2-6s-91") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method", "Use the " + chip("cross", "cross method") + ": pair " + mt("+7") + ", " + mt("-13") + " gives " + mt("-6s") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=(s+7)(s-13)") + "."),
    ],
  };

  const QB10 = {
    n: "10", short: "-17n-n^2-72", title: "Factorize (common factor + cross)", sub: "take out -1, then cross",
    deck: deckPath("qb10-solution"), solved: true,
    question: [{ tag: "", tex: "-17n-n^2-72" }],
    methods: {
      common: { expr: "-17n-n^2-72", gcf: "-1", inner: "n^2+17n+72", result: "-(n^2+17n+72)" },
      cross: { expr: "n^2+17n+72", first: "n", t1: "+8", t2: "+9", p1: "+9n", p2: "+8n", mid: "+17n", last: "72", factors: "(n+8)(n+9)" },
    },
    steps: [
      st(0, null, "Problem (Q10)", "Factorize " + mt("-17n-n^2-72") + "."),
      st(1, { type: "common", reveal: 2 }, "Take out -1", chip("common", "Common factor") + " " + mt("-1") + ": " + mt("=-(n^2+17n+72)") + "."),
      st(1, { type: "cross", reveal: 4 }, "Cross method", "Use the " + chip("cross", "cross method") + ": pair " + mt("+8") + ", " + mt("+9") + " gives " + mt("+17n") + " \u2713."),
      st(2, { type: "cross", reveal: 5 }, "Read the factors", mt("=-(n+8)(n+9)") + "."),
    ],
  };

  const QB22 = {
    n: "22", short: "3a^2-7ac+2c^2\\ (\\text{+ hence})", title: "Factorize (cross + grouping)", sub: "use (a) for (b)",
    deck: deckPath("qb22-solution"), solved: true,
    question: [{ tag: "(a)", tex: "3a^2-7ac+2c^2" }, { tag: "(b)", tex: "3a^2-7ac+2c^2-ab+2bc" }],
    methods: {
      cross: { expr: "3a^2-7ac+2c^2", first: "a", first2: "3a", t1: "-2c", t2: "-c", p1: "-ac", p2: "-6ac", mid: "-7ac", last: "2c^2", factors: "(a-2c)(3a-c)" },
      group: { g1: "(a-2c)(3a-c)", g2: "-ab+2bc", f1: "(a-2c)(3a-c)", f2: "-b(a-2c)", common: "(a-2c)", result: "(a-2c)(3a-c-b)" },
      common: { expr: "(a-2c)(3a-c)-b(a-2c)", gcf: "(a-2c)", inner: "(3a-c)-b", result: "(a-2c)(3a-c-b)" },
    },
    steps: [
      st(0, null, "Problem (Q22)", "(a) Factorize " + mt("3a^2-7ac+2c^2") + "; (b) hence " + mt("3a^2-7ac+2c^2-ab+2bc") + "."),
      st(1, { type: "cross", reveal: 5 }, "(a) Cross method", "Use the " + chip("cross", "cross method") + " (leading coefficient 3): " + mt("=(a-2c)(3a-c)") + "."),
      st(2, null, "(b) Part (b)", "Hence factorize " + mt("3a^2-7ac+2c^2-ab+2bc") + "."),
      st(3, { type: "group", reveal: 3 }, "(b) Group the new terms", chip("group", "Group") + " " + mt("-ab+2bc=-b(a-2c)") + ", giving the common bracket " + mt("(a-2c)") + "."),
      st(4, { type: "common", reveal: 2 }, "(b) Common factor", chip("common", "Common factor") + " " + mt("(a-2c)") + ": " + mt("=(a-2c)(3a-c-b)") + "."),
    ],
  };

  const QB36 = {
    n: "36", short: "x^2y-4xy^2-32y^3\\ (\\text{+ hence})", title: "Factorize (common + cross, then grouping)", sub: "use (a) for (b)",
    deck: deckPath("qb36-solution"), solved: true,
    question: [{ tag: "(a)", tex: "x^2y-4xy^2-32y^3" }, { tag: "(b)", tex: "x^2y+2x^2+16xy-4xy^2+32y^2-32y^3" }],
    methods: {
      common: { expr: "x^2y-4xy^2-32y^3", gcf: "y", inner: "x^2-4xy-32y^2", result: "y(x^2-4xy-32y^2)" },
      cross: { expr: "x^2-4xy-32y^2", first: "x", t1: "+4y", t2: "-8y", p1: "-8xy", p2: "+4xy", mid: "-4xy", last: "-32y^2", factors: "(x+4y)(x-8y)" },
    },
    steps: [
      st(0, null, "Problem (Q36)", "(a) Factorize " + mt("x^2y-4xy^2-32y^3") + "; (b) hence the six-term expression."),
      st(1, { type: "common", reveal: 2 }, "(a) Take out y", chip("common", "Common factor") + " " + mt("y") + ": " + mt("=y(x^2-4xy-32y^2)") + "."),
      st(2, { type: "cross", reveal: 5 }, "(a) Cross method", "Use the " + chip("cross", "cross method") + ": " + mt("=y(x+4y)(x-8y)") + "."),
      st(3, null, "(b) Part (b)", "Hence " + mt("x^2y+2x^2+16xy-4xy^2+32y^2-32y^3") + "."),
      st(4, null, "(b) Regroup using (a)", "Rewrite as " + mt("y(x+4y)(x-8y)+2(x+4y)^2") + "."),
      st(5, { type: "common", reveal: 2, data: { expr: "y(x+4y)(x-8y)+2(x+4y)^2", gcf: "(x+4y)", inner: "y(x-8y)+2(x+4y)", result: "(x+4y)[y(x-8y)+2(x+4y)]" } }, "(b) Common factor (x+4y)", "Take out the common bracket " + mt("(x+4y)") + ": " + mt("=(x+4y)[y(x-8y)+2(x+4y)]") + "."),
      st(6, null, "(b) Expand the bracket", mt("=(x+4y)(xy-8y^2+2x+8y)") + "."),
    ],
  };

  const QB45 = {
    n: "45", short: "(x+3)^3-25x-75", title: "Factorize (common factor + DOS)", sub: "common (x+3), then a^2-b^2",
    deck: deckPath("qb45-solution"), solved: true,
    question: [{ tag: "", tex: "(x+3)^3-25x-75" }],
    methods: {
      common: { expr: "(x+3)^3-25(x+3)", gcf: "(x+3)", inner: "(x+3)^2-25", result: "(x+3)[(x+3)^2-25]" },
      dos: { a2: "(x+3)^2", b2: "5^2", a: "(x+3)", b: "5", result: "(x+8)(x-2)" },
      "identity-dos": { a: "(x+3)", b: "5", sub: "(x+3)^2-5^2=(x+8)(x-2)" },
    },
    steps: [
      st(0, null, "Problem (Q45)", "Factorize " + mt("(x+3)^3-25x-75") + "."),
      st(1, null, "Group the last two terms", mt("-25x-75=-25(x+3)") + ", so " + mt("=(x+3)^3-25(x+3)") + "."),
      st(2, { type: "common", reveal: 2 }, "Take out (x+3)", chip("common", "Common factor") + " " + mt("(x+3)") + ": " + mt("=(x+3)[(x+3)^2-25]") + "."),
      st(3, { type: "dos", reveal: 1 }, "Difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("(x+3)^2-5^2") + "."),
      st(4, { type: "dos", reveal: 2 }, "Final factors", mt("=(x+3)(x+8)(x-2)") + "."),
    ],
  };

  const QB47 = {
    n: "47", short: "x^2+2xy-15y^2\\ (\\text{+ hence})", title: "Factorize (common, cross, grouping)", sub: "use (a),(b) for (c)",
    deck: deckPath("qb47-solution"), solved: true,
    question: [{ tag: "(a)", tex: "3x-9y" }, { tag: "(b)", tex: "x^2+2xy-15y^2" }, { tag: "(c)", tex: "x^2+2xy-15y^2-3x+9y" }],
    methods: {
      common: { expr: "3x-9y", gcf: "3", inner: "x-3y", result: "3(x-3y)" },
      cross: { expr: "x^2+2xy-15y^2", first: "x", t1: "-3y", t2: "+5y", p1: "+5xy", p2: "-3xy", mid: "+2xy", last: "-15y^2", factors: "(x-3y)(x+5y)" },
      group: { g1: "(x-3y)(x+5y)", g2: "-3x+9y", f1: "(x-3y)(x+5y)", f2: "-3(x-3y)", common: "(x-3y)", result: "(x-3y)(x+5y-3)" },
    },
    steps: [
      st(0, null, "Problem (Q47)", "(a) " + mt("3x-9y") + "; (b) " + mt("x^2+2xy-15y^2") + "; (c) the combined expression."),
      st(1, { type: "common", reveal: 2 }, "(a) Common factor", chip("common", "Take out") + " " + mt("3") + ": " + mt("=3(x-3y)") + "."),
      st(2, null, "(b) Part (b)", "Factorize " + mt("x^2+2xy-15y^2") + "."),
      st(3, { type: "cross", reveal: 5 }, "(b) Cross method", "Use the " + chip("cross", "cross method") + ": " + mt("=(x-3y)(x+5y)") + "."),
      st(4, null, "(c) Part (c)", "Hence " + mt("x^2+2xy-15y^2-3x+9y") + "."),
      st(5, { type: "group", reveal: 3 }, "(c) Group using (a)", "From (a), " + mt("-3x+9y=-3(x-3y)") + ", so " + mt("=(x-3y)(x+5y)-3(x-3y)") + "."),
      st(6, { type: "common", reveal: 2, data: { expr: "(x-3y)(x+5y)-3(x-3y)", gcf: "(x-3y)", inner: "(x+5y)-3", result: "(x-3y)(x+5y-3)" } }, "(c) Common factor", "Take out " + mt("(x-3y)") + ": " + mt("=(x-3y)(x+5y-3)") + "."),
    ],
  };

  const QB52 = {
    n: "52", short: "14x^2-25x+6\\ (\\text{+ hence})", title: "Factorize (cross, DOS, grouping)", sub: "use (a),(b) for (c)",
    deck: deckPath("qb52-solution"), solved: true,
    question: [{ tag: "(a)", tex: "14x^2-25x+6" }, { tag: "(b)", tex: "49x^2-4" }, { tag: "(c)", tex: "(42x^3-75x^2+18x)-(98x^2-8)" }],
    methods: {
      cross: { expr: "14x^2-25x+6", first: "2x", first2: "7x", t1: "-3", t2: "-2", p1: "-4x", p2: "-21x", mid: "-25x", last: "6", factors: "(2x-3)(7x-2)" },
      "identity-dos": { a: "7x", b: "2", sub: "49x^2-4=(7x+2)(7x-2)" },
      common: { expr: "3x(2x-3)(7x-2)-2(7x+2)(7x-2)", gcf: "(7x-2)", inner: "3x(2x-3)-2(7x+2)", result: "(7x-2)[3x(2x-3)-2(7x+2)]" },
    },
    steps: [
      st(0, null, "Problem (Q52)", "(a),(b) factorize the quadratics; (c) the cubic expression."),
      st(1, { type: "cross", reveal: 5 }, "(a) Cross method", "Leading-coefficient " + chip("cross", "cross method") + ": " + mt("=(2x-3)(7x-2)") + "."),
      st(2, null, "(b) Part (b)", "Factorize " + mt("49x^2-4") + "."),
      st(3, { type: "dos", reveal: 2, data: { a2: "49x^2", b2: "4", a: "7x", b: "2", result: "(7x+2)(7x-2)" } }, "(b) Difference of squares", chip("identity-dos", "a^2-b^2") + ": " + mt("=(7x+2)(7x-2)") + "."),
      st(4, null, "(c) Part (c)", "Hence " + mt("(42x^3-75x^2+18x)-(98x^2-8)") + "."),
      st(5, null, "(c) Take out 3x and 2", mt("=3x(14x^2-25x+6)-2(49x^2-4)") + "."),
      st(6, null, "(c) Substitute (a) and (b)", mt("=3x(2x-3)(7x-2)-2(7x+2)(7x-2)") + "."),
      st(7, { type: "common", reveal: 2 }, "(c) Common factor (7x-2)", chip("common", "Common factor") + " " + mt("(7x-2)") + ": " + mt("=(7x-2)[3x(2x-3)-2(7x+2)]") + "."),
      st(8, null, "(c) Simplify the bracket", mt("=(7x-2)(6x^2-23x-4)") + "."),
      st(9, { type: "cross", reveal: 5, data: { expr: "6x^2-23x-4", first: "x", first2: "6x", t1: "-4", t2: "+1", p1: "+x", p2: "-24x", mid: "-23x", last: "-4", factors: "(x-4)(6x+1)" } }, "(c) Final cross method", "Cross again: " + mt("6x^2-23x-4=(x-4)(6x+1)") + ", so " + mt("=(7x-2)(x-4)(6x+1)") + "."),
    ],
  };

  const QB53 = {
    n: "53", short: "2x^2-x-10\\ (\\text{+ hence})", title: "Factorize (cross + substitution)", sub: "use (a) by substitution",
    deck: deckPath("qb53-solution"), solved: true,
    question: [{ tag: "(a)", tex: "2x^2-x-10" }, { tag: "(b)(i)", tex: "2(y+2)^2-(y+2)-10" }, { tag: "(b)(ii)", tex: "2(2z-5)^2-2z-5" }],
    methods: { cross: { expr: "2x^2-x-10", first: "x", first2: "2x", t1: "+2", t2: "-5", p1: "-5x", p2: "+4x", mid: "-x", last: "-10", factors: "(x+2)(2x-5)" } },
    steps: [
      st(0, null, "Problem (Q53)", "(a) Factorize " + mt("2x^2-x-10") + "; (b) use it by substitution."),
      st(1, { type: "cross", reveal: 5 }, "(a) Cross method", "Leading-coefficient " + chip("cross", "cross method") + ": " + mt("=(x+2)(2x-5)") + "."),
      st(2, null, "(b)(i) Substitute x=y+2", "With " + mt("x=y+2") + " the expression is " + mt("2x^2-x-10") + "."),
      st(3, null, "(b)(i) Apply (a)", mt("=(x+2)(2x-5)") + "."),
      st(4, null, "(b)(i) Back-substitute", mt("=(y+4)(2y-1)") + "."),
      st(5, null, "(b)(ii) Substitute x=2z-5", "With " + mt("x=2z-5") + " the expression is " + mt("2x^2-x-10") + "."),
      st(6, null, "(b)(ii) Apply (a)", mt("=(x+2)(2x-5)") + "."),
      st(7, null, "(b)(ii) Back-substitute", mt("=(2z-3)(4z-15)") + "."),
    ],
  };

  const QB56 = {
    n: "56", short: "5x^2-17xy+6y^2\\ (\\text{+ hence})", title: "Factorize (cross + substitution)", sub: "use (a) by substitution",
    deck: deckPath("qb56-solution"), solved: true,
    question: [{ tag: "(a)", tex: "5x^2-17xy+6y^2" }, { tag: "(b)", tex: "45(p-q)^2-51(p^2-q^2)+6(p+q)^2" }],
    methods: { cross: { expr: "5x^2-17xy+6y^2", first: "x", first2: "5x", t1: "-3y", t2: "-2y", p1: "-2xy", p2: "-15xy", mid: "-17xy", last: "6y^2", factors: "(x-3y)(5x-2y)" } },
    steps: [
      st(0, null, "Problem (Q56)", "(a) Factorize " + mt("5x^2-17xy+6y^2") + "; (b) use it by substitution."),
      st(1, { type: "cross", reveal: 5 }, "(a) Cross method", "Leading-coefficient " + chip("cross", "cross method") + ": " + mt("=(x-3y)(5x-2y)") + "."),
      st(2, null, "(b) Part (b)", "Hence " + mt("45(p-q)^2-51(p^2-q^2)+6(p+q)^2") + ". Let " + mt("x=3(p-q),\\ y=p+q") + "."),
      st(3, null, "(b) Rewrite the expression", mt("=5x^2-17xy+6y^2") + " (same template as (a), highlighted in blue)."),
      st(4, null, "(b) Apply (a)", mt("=(x-3y)(5x-2y)") + "."),
      st(5, null, "(b) Replace x and y", mt("x-3y=-6q,\\quad 5x-2y=13p-17q") + "."),
      st(6, null, "(b) Final", mt("=-6q(13p-17q)") + "."),
    ],
  };

  const QB59 = {
    n: "59", short: "5a^2-31a+6\\ (\\text{+ hence})", title: "Factorize (cross, grouping, perfect square)", sub: "use (a) for (b)",
    deck: deckPath("qb59-solution"), solved: true,
    question: [{ tag: "(a)", tex: "5a^2-31a+6" }, { tag: "(b)", tex: "5b^3-31b^2+51b-9" }],
    methods: {
      cross: { expr: "5a^2-31a+6", first: "a", first2: "5a", t1: "-6", t2: "-1", p1: "-a", p2: "-30a", mid: "-31a", last: "6", factors: "(a-6)(5a-1)" },
      common: { expr: "b(b-6)(5b-1)+9(5b-1)", gcf: "(5b-1)", inner: "b(b-6)+9", result: "(5b-1)[b(b-6)+9]" },
      psq: { a2: "b^2", b2: "9", a: "b", b: "3", sign: "-", mid: "6b", result: "(b-3)^2" },
      "identity-diff": { a: "b", b: "3", sub: "(b-3)^2=b^2-6b+9" },
    },
    steps: [
      st(0, null, "Problem (Q59)", "(a) Factorize " + mt("5a^2-31a+6") + "; (b) hence " + mt("5b^3-31b^2+51b-9") + "."),
      st(1, { type: "cross", reveal: 5 }, "(a) Cross method", "Leading-coefficient " + chip("cross", "cross method") + ": " + mt("=(a-6)(5a-1)") + "."),
      st(2, null, "(b) Part (b)", "Hence " + mt("5b^3-31b^2+51b-9") + "."),
      st(3, null, "(b) Split the linear term", mt("51b=6b+45b") + ", so " + mt("=b(5b^2-31b+6)+45b-9") + "."),
      st(4, { type: "cross", reveal: 5, data: { expr: "5b^2-31b+6", first: "b", first2: "5b", t1: "-6", t2: "-1", p1: "-b", p2: "-30b", mid: "-31b", last: "6", factors: "(b-6)(5b-1)" } }, "(b) Factor each group", "By (a), " + mt("5b^2-31b+6=(b-6)(5b-1)") + " and " + mt("45b-9=9(5b-1)") + "."),
      st(5, { type: "common", reveal: 2 }, "(b) Common factor (5b-1)", chip("common", "Common factor") + " " + mt("(5b-1)") + ": " + mt("=(5b-1)[b(b-6)+9]") + "."),
      st(6, null, "(b) Simplify the bracket", mt("=(5b-1)(b^2-6b+9)") + "."),
      st(7, { type: "psq", reveal: 3 }, "(b) Perfect square", chip("identity-diff", "(a-b)^2") + ": " + mt("b^2-6b+9=(b-3)^2") + ", so " + mt("=(5b-1)(b-3)^2") + "."),
    ],
  };

  const QB62 = {
    n: "62", short: "9x^2-16y^2\\ (\\text{+ simplify})", title: "Factorize & simplify fractions", sub: "use (a) to simplify (b)",
    deck: deckPath("qb62-solution"), solved: true,
    question: [
      { tag: "(a)(i)", tex: "9x^2-16y^2" },
      { tag: "(a)(ii)", tex: "15x^2-xy-28y^2" },
      { tag: "(b)", tex: "\\frac{15x^2-xy-28y^2}{45x-63y}\\div\\frac{9x^2-16y^2}{15x-6y}" },
    ],
    methods: {
      dos: { a2: "9x^2", b2: "16y^2", a: "3x", b: "4y", result: "(3x+4y)(3x-4y)" },
      cross: { expr: "15x^2-xy-28y^2", first: "3x", first2: "5x", t1: "+4y", t2: "-7y", p1: "+12xy", p2: "-35xy", mid: "-xy", last: "-28y^2", factors: "(3x+4y)(5x-7y)" },
    },
    steps: [
      st(0, null, "Problem (Q62)", "(a)(i) " + mt("9x^2-16y^2") + "; (a)(ii) " + mt("15x^2-xy-28y^2") + "; (b) simplify the quotient."),
      st(1, null, "(a)(i) Write as squares", mt("=(3x)^2-(4y)^2") + "."),
      st(2, { type: "dos", reveal: 3 }, "(a)(i) Difference of squares", chip("dos", "Difference of squares") + ": " + mt("=(3x+4y)(3x-4y)") + "."),
      st(3, null, "(a)(ii) Factorize", "Factorize " + mt("15x^2-xy-28y^2") + " (blue on screen)."),
      st(4, { type: "cross", reveal: 5 }, "(a)(ii) Cross method", "Leading-coefficient " + chip("cross", "cross method") + ": " + mt("=(3x+4y)(5x-7y)") + "."),
      st(5, null, "(b) Problem", "Substitute the factorizations from (a) into the numerators."),
      st(6, null, "(b) From (a)", mt("=\\frac{(3x+4y)(5x-7y)}{9(5x-7y)}\\times\\frac{3(5x-2y)}{(3x+4y)(3x-4y)}") + "."),
      st(7, null, "(b) Cancel common factors", "Cancel " + mt("(3x+4y)") + " and " + mt("(5x-7y)") + " (highlighted orange/green)."),
      st(8, null, "(b) Final", mt("=\\frac{5x-2y}{3(3x-4y)}") + "."),
    ],
  };

  // ── QUESTION SOURCES (questions transcribed from the two PowerPoints) ──
  //   "More about Factorization (2025)"           -> prefix "Q"   (keeps the PPT exercise numbers)
  //   "More about Factorization Quiz (ANS) james" -> prefix "Qz"
  // Only the pinned question is shown on click; step-by-step solutions are built later (Qz9 is the demo).
  const SOURCES = [
    {
      id: "main", name: "More about Factorization (2025)", prefix: "Q", open: false,
      groups: [
        {
          name: "Perfect squares & difference of squares",
          items: [QA1, QA4, QA10, QA12, QA13, QA19, QA22, QA23, QA30, QA40, QA46, QA61, QA66, QA69, QA70],
        },
        {
          name: "Cross method & applications",
          items: [QB6, QB10, QB22, QB36, QB45, QB47, QB52, QB53, QB56, QB59, QB62],
        },
      ],
    },
    {
      id: "quiz", name: "More about Factorization Quiz (ANS) james", prefix: "Qz", open: true,
      groups: [
        {
          name: "",
          items: [QZ1, QZ2, QZ3, QZ4, QZ5, QZ6, QZ7, QZ8, QZ9, QZ10, QZ11],
        },
      ],
    },
  ];

  let frame, listEl, listInner, deckEmpty, scrollEl, titleEl, subEl, qexprEl, prevBtn, nextBtn, resetBtn, progLabel, barFill;
  let modal, modalBody, modalClose, subWrap, subSvg, subLabel;
  let panelEnlarge, peBody, peTitle, peClose, enlargeFrame = null, enlargeKind = null;
  let active = null, activeSrc = null, step = 0, loadedDeck = null;

  function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  // Progressive cross-method build-up for the sub-animation panel (reveal 1..5)
  function drawCross(reveal, v) {
    clearSvg(subSvg);
    const A = "#4FC3F7", B = "#FFD54F", G = "#81C784", INK = "#cdd6e4";
    const xL = 150, xR = 330, yT = 132, yB = 214;
    texSvg(subSvg, xL, yT, v.first, A, 28, 110, 44);
    texSvg(subSvg, xL, yB, v.first2 || v.first, A, 28, 110, 44);
    if (reveal >= 2) {
      texSvg(subSvg, xR, yT, v.t1, B, 26, 100, 44);
      texSvg(subSvg, xR, yB, v.t2, B, 26, 100, 44);
    }
    if (reveal >= 3) {
      subSvg.appendChild(E("line", { x1: xL + 38, y1: yT + 12, x2: xR - 54, y2: yB - 12, stroke: G, "stroke-width": 3 }));
      subSvg.appendChild(E("line", { x1: xL + 38, y1: yB - 12, x2: xR - 54, y2: yT + 12, stroke: G, "stroke-width": 3 }));
      texSvg(subSvg, 540, yT, v.p1, G, 23, 180, 40);
      texSvg(subSvg, 540, yB, v.p2, G, 23, 180, 40);
    }
    if (reveal >= 4) {
      texSvg(subSvg, 340, 272, "\\text{middle: }" + v.p2 + v.p1 + "=" + v.mid + "\\;\\checkmark", G, 20, 460, 36);
    }
    if (reveal >= 5) {
      texSvg(subSvg, 340, 44, v.factors, INK, 24, 320, 40);
    }
  }

  // Perfect-square trinomial: a^2 (±)2ab + b^2  ->  (a ± b)^2
  function drawPSQ(reveal, v) {
    clearSvg(subSvg);
    const A = "#4FC3F7", B = "#FFD54F", G = "#81C784", INK = "#cdd6e4";
    const s = v.sign === "-" ? "-" : "+";
    texSvg(subSvg, 150, 64, v.a2, A, 24, 200, 40);
    texSvg(subSvg, 340, 64, s + v.mid, G, 24, 200, 40);
    texSvg(subSvg, 530, 64, "+" + v.b2, B, 24, 200, 40);
    if (reveal >= 1) {
      subSvg.appendChild(E("line", { x1: 150, y1: 92, x2: 150, y2: 124, stroke: A, "stroke-width": 2.5 }));
      subSvg.appendChild(E("line", { x1: 530, y1: 92, x2: 530, y2: 124, stroke: B, "stroke-width": 2.5 }));
      texSvg(subSvg, 150, 150, "\\sqrt{" + v.a2 + "}=" + v.a, A, 19, 220, 36);
      texSvg(subSvg, 530, 150, "\\sqrt{" + v.b2 + "}=" + v.b, B, 19, 220, 36);
    }
    if (reveal >= 2) {
      texSvg(subSvg, 340, 150, "2(" + v.a + ")(" + v.b + ")=" + v.mid + "\\;\\checkmark", G, 17, 280, 34);
    }
    if (reveal >= 3) {
      texSvg(subSvg, 340, 240, "=" + v.result, INK, 26, 420, 44);
    }
  }

  // Difference of squares: a^2 - b^2 -> (a + b)(a - b)
  function drawDOS(reveal, v) {
    clearSvg(subSvg);
    const A = "#4FC3F7", B = "#FFD54F", INK = "#cdd6e4";
    texSvg(subSvg, 180, 70, v.a2, A, 26, 220, 42);
    texSvg(subSvg, 340, 70, "-", INK, 26, 40, 42);
    texSvg(subSvg, 500, 70, v.b2, B, 26, 220, 42);
    if (reveal >= 1) {
      subSvg.appendChild(E("line", { x1: 180, y1: 100, x2: 180, y2: 132, stroke: A, "stroke-width": 2.5 }));
      subSvg.appendChild(E("line", { x1: 500, y1: 100, x2: 500, y2: 132, stroke: B, "stroke-width": 2.5 }));
      texSvg(subSvg, 180, 158, "\\sqrt{" + v.a2 + "}=" + v.a, A, 19, 220, 36);
      texSvg(subSvg, 500, 158, "\\sqrt{" + v.b2 + "}=" + v.b, B, 19, 220, 36);
    }
    if (reveal >= 2) {
      texSvg(subSvg, 340, 240, "=" + v.result, INK, 26, 460, 44);
    }
  }

  // Taking out a common factor: expr -> gcf( inner )
  function drawCommon(reveal, v) {
    clearSvg(subSvg);
    const P = "#C792EA", INK = "#cdd6e4";
    texSvg(subSvg, 340, 72, v.expr, INK, 23, 640, 44);
    if (reveal >= 1) {
      texSvg(subSvg, 340, 150, "\\text{common factor} = " + v.gcf, P, 22, 500, 38);
    }
    if (reveal >= 2) {
      texSvg(subSvg, 340, 238, "=" + (v.result || v.gcf + "(" + v.inner + ")"), INK, 24, 640, 44);
    }
  }

  // Factorization by grouping
  function drawGroup(reveal, v) {
    clearSvg(subSvg);
    const A = "#4FC3F7", B = "#FFD54F", P = "#C792EA", INK = "#cdd6e4";
    texSvg(subSvg, 185, 62, v.g1, A, 21, 320, 40);
    texSvg(subSvg, 510, 62, v.g2, B, 21, 320, 40);
    if (reveal >= 1) {
      texSvg(subSvg, 185, 132, "=" + v.f1, A, 19, 330, 36);
      texSvg(subSvg, 510, 132, "=" + v.f2, B, 19, 330, 36);
    }
    if (reveal >= 2) {
      texSvg(subSvg, 340, 198, "\\text{common bracket} = " + v.common, P, 19, 420, 34);
    }
    if (reveal >= 3) {
      texSvg(subSvg, 340, 258, "=" + v.result, INK, 24, 560, 42);
    }
  }

  const FOCUS_DRAW = { cross: drawCross, psq: drawPSQ, dos: drawDOS, common: drawCommon, group: drawGroup };
  const FOCUS_LABEL = { cross: "Cross method", psq: "Perfect square", dos: "Difference of squares", common: "Common factor", group: "Grouping" };

  function renderFocus(s) {
    if (!subWrap) return;
    let f = s && s.focus;
    if (typeof f === "number") f = f > 0 ? { type: "cross", reveal: f } : null;
    if (!f) { subWrap.classList.add("hidden"); return; }
    const draw = FOCUS_DRAW[f.type];
    const data = (f && f.data) || (active.methods && active.methods[f.type]) || {};
    if (!draw) { subWrap.classList.add("hidden"); return; }
    subWrap.classList.remove("hidden");
    if (subLabel) subLabel.textContent = FOCUS_LABEL[f.type] || "Method";
    draw(f.reveal || 1, data);
    syncEnlargePanel();
  }

  function deckReveal() { try { const r = frame.contentWindow.Reveal; return (r && r.isReady && r.isReady()) ? r : null; } catch (e) { return null; } }
  function postSlideInFrame(iframe, i) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      const r = iframe.contentWindow.Reveal;
      if (r && r.isReady && r.isReady()) { r.slide(i); return; }
    } catch (e) {}
    try { iframe.contentWindow.postMessage(JSON.stringify({ method: "slide", args: [i] }), "*"); } catch (e) {}
  }
  function postSlide(i) { postSlideInFrame(frame, i); }
  function goToSlide(i) { postSlide(i); syncEnlargePanel(); }
  function currentSlideIndex() { return active && active.steps && active.steps[step] ? active.steps[step].slide : 0; }

  function syncEnlargePanel() {
    if (!enlargeKind || !panelEnlarge || panelEnlarge.classList.contains("hidden")) return;
    if (enlargeKind === "deck" && enlargeFrame) postSlideInFrame(enlargeFrame, currentSlideIndex());
    else if (enlargeKind === "sub") {
      const svg = peBody && peBody.querySelector("svg");
      if (svg && subSvg) svg.innerHTML = subSvg.innerHTML;
    }
  }
  function closePanelEnlarge() {
    if (!panelEnlarge) return;
    panelEnlarge.classList.add("hidden");
    if (peBody) peBody.innerHTML = "";
    enlargeFrame = null;
    enlargeKind = null;
  }
  function openPanelEnlarge(kind) {
    if (!panelEnlarge || !peBody) return;
    if (kind === "deck") {
      if (!active || !active.solved || !frame || frame.src === "about:blank") return;
      if (peTitle) peTitle.textContent = (titleEl.textContent || "Main animation") + " — enlarged";
      peBody.innerHTML = '<div class="pe-deck"><iframe title="Enlarged worked solution slides"></iframe></div>';
      enlargeFrame = peBody.querySelector("iframe");
      enlargeKind = "deck";
      const idx = currentSlideIndex();
      enlargeFrame.onload = () => postSlideInFrame(enlargeFrame, idx);
      enlargeFrame.src = frame.src;
      panelEnlarge.classList.remove("hidden");
    } else if (kind === "sub") {
      if (!subWrap || subWrap.classList.contains("hidden") || !subSvg) return;
      if (peTitle) peTitle.textContent = (subLabel.textContent || "Method") + " — enlarged";
      peBody.innerHTML = '<div class="pe-sub"></div>';
      peBody.querySelector(".pe-sub").appendChild(subSvg.cloneNode(true));
      enlargeKind = "sub";
      panelEnlarge.classList.remove("hidden");
    }
  }

  function buildCards() {
    scrollEl.innerHTML = "";
    active.steps.forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "step-card" + (i === 0 ? " active" : "");
      card.dataset.step = i;
      card.innerHTML =
        '<div class="sc-head"><span class="sc-idx">' + (i + 1) + '</span>' +
        '<span class="sc-title">' + s.title + '</span></div>' +
        '<div class="sc-body">' + s.body + '</div>';
      card.addEventListener("click", (ev) => { if (!ev.target.closest(".method-chip")) setStep(i); });
      scrollEl.appendChild(card);
    });
    renderTex(scrollEl);
    scrollEl.querySelectorAll(".method-chip").forEach((chip) => {
      chip.addEventListener("click", (ev) => { ev.stopPropagation(); openMethod(chip.dataset.method); });
    });
  }

  function setStep(i) {
    if (!active || !active.steps) return;
    i = Math.max(0, Math.min(active.steps.length - 1, i));
    step = i;
    Array.from(scrollEl.children).forEach((c, idx) => c.classList.toggle("active", idx === i));
    const card = scrollEl.children[i];
    if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    goToSlide(active.steps[i].slide);
    renderFocus(active.steps[i]);
    progLabel.textContent = "Step " + (i + 1) + " / " + active.steps.length;
    barFill.style.width = ((i + 1) / active.steps.length * 100) + "%";
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === active.steps.length - 1;
  }

  function buildSources() {
    listInner.innerHTML = "";
    SOURCES.forEach((src) => {
      const open = !!src.open;
      const grp = document.createElement("div"); grp.className = "src-group";
      const head = document.createElement("button");
      head.className = "src-head" + (open ? "" : " collapsed");
      head.innerHTML = '<span class="src-name">' + src.name + '</span><span class="src-badge">' + src.prefix + '</span><span class="src-caret">\u25be</span>';
      const body = document.createElement("div"); body.className = "src-body" + (open ? "" : " hidden");
      src.groups.forEach((g, gi) => {
        if (g.name) { const sh = document.createElement("p"); sh.className = "sub-head"; sh.textContent = g.name; body.appendChild(sh); }
        g.items.forEach((item) => {
          const qid = src.id + ":" + gi + ":" + item.n;
          const b = document.createElement("button"); b.className = "q-row"; b.dataset.qid = qid;
          b.title = item.n;
          b.innerHTML = '<span class="qn">' + src.prefix + item.n + '</span>' +
            (item.solved ? '<span class="dot built" title="solution built">\u2713</span>' : '');
          b.addEventListener("click", () => loadQuestion(item, src, qid));
          body.appendChild(b);
        });
      });
      head.addEventListener("click", () => { head.classList.toggle("collapsed"); body.classList.toggle("hidden"); });
      grp.appendChild(head); grp.appendChild(body); listInner.appendChild(grp);
    });
  }

  function loadQuestion(item, src, qid) {
    closePanelEnlarge();
    active = item; activeSrc = src;
    titleEl.textContent = src.prefix + item.n + " — " + (item.title || "Factorize");
    subEl.textContent = item.sub || src.name;
    if (qexprEl) {
      const rows = item.question || [{ tag: "", tex: item.short }];
      qexprEl.innerHTML = rows.map((r) =>
        '<div class="sp-q-row">' + (r.tag ? '<b>' + r.tag + '</b> ' : '') + '<span data-tex="' + r.tex + '"></span></div>'
      ).join("");
      renderTex(qexprEl);
    }
    listInner.querySelectorAll(".q-row").forEach((b) => b.classList.toggle("active", b.dataset.qid === qid));

    if (item.solved) {
      deckEmpty.classList.add("hidden");
      frame.classList.remove("hidden");
      buildCards();
      if (loadedDeck !== item.deck) {
        loadedDeck = item.deck;
        frame.onload = () => { setStep(0); setTimeout(() => goToSlide(active.steps[step].slide), 700); };
        frame.src = item.deck;
      } else {
        setStep(0);
      }
    } else {
      // question-only state: pin the question, solution to be built later
      loadedDeck = null;
      frame.src = "about:blank";
      frame.classList.add("hidden");
      deckEmpty.classList.remove("hidden");
      if (subWrap) subWrap.classList.add("hidden");
      scrollEl.innerHTML = '<div class="no-sol">Step-by-step solution not built yet.<br>Only the question is shown for now.</div>';
      progLabel.textContent = "\u2014";
      barFill.style.width = "0%";
      prevBtn.disabled = true; nextBtn.disabled = true;
    }
  }

  // ── method popups ──
  function openMethod(method) {
    if (method === "cross") openCross(active.methods.cross);
    else if (method === "common") openCommon(active.methods.common);
    else if (method === "group") openGroup(active.methods.group);
    else if (method && method.indexOf("identity") === 0) openIdentity(method, active.methods[method]);
  }
  function openCommon(v) {
    v = v || {};
    modalBody.innerHTML =
      '<p class="mm-tag">Method used here</p><h3>Take out the common factor</h3>' +
      '<p class="mm-note">Find the greatest factor shared by every term, write it outside the bracket, and divide each term by it inside.</p>' +
      (v.gcf ? '<div class="mm-map"><span class="mm-pair"><b>common factor</b> <span data-tex="=' + v.gcf + '"></span></span></div>' : '') +
      (v.expr ? '<div class="mm-row"><span data-tex="' + v.expr + '=' + (v.result || v.gcf + "(" + v.inner + ")") + '"></span></div>' : '');
    renderTex(modalBody);
    modal.classList.remove("hidden");
  }
  function openGroup(v) {
    v = v || {};
    modalBody.innerHTML =
      '<p class="mm-tag">Method used here</p><h3>Factorize by grouping</h3>' +
      '<p class="mm-note">Split the terms into groups, factor each group, then take out the common bracket that appears.</p>' +
      (v.g1 ? '<div class="mm-row"><span data-tex="' + v.g1 + (v.g2 ? "+" + v.g2 : "") + '"></span></div>' : '') +
      (v.f1 ? '<div class="mm-row"><span data-tex="=' + v.f1 + (v.f2 ? "+" + v.f2 : "") + '"></span></div>' : '') +
      (v.result ? '<div class="mm-row"><span data-tex="=' + v.result + '"></span></div>' : '');
    renderTex(modalBody);
    modal.classList.remove("hidden");
  }
  function openCross(v) {
    modalBody.innerHTML =
      '<p class="mm-tag">Method used here</p><h3>Cross Method</h3>' +
      '<p class="mm-note">To factor a quadratic, split the first term down the left column and the last term down the right column, then <b>cross-multiply</b>: the two diagonal products must add up to the middle term.</p>';
    const svg = E("svg", { viewBox: "0 0 480 210", class: "mm-svg" });
    const xL = 78, xR = 250, yT = 64, yB = 150, COL_A = "#4FC3F7", COL_B = "#FFD54F", COL_AB = "#81C784";
    texSvg(svg, xL, yT, v.first, COL_A, 22, 84, 34);
    texSvg(svg, xL, yB, v.first2 || v.first, COL_A, 22, 84, 34);
    texSvg(svg, xR, yT, v.t1, COL_B, 20, 80, 34);
    texSvg(svg, xR, yB, v.t2, COL_B, 20, 80, 34);
    svg.appendChild(E("line", { x1: xL + 26, y1: yT + 10, x2: xR - 40, y2: yB - 10, stroke: COL_AB, "stroke-width": 2.5 }));
    svg.appendChild(E("line", { x1: xL + 26, y1: yB - 10, x2: xR - 40, y2: yT + 10, stroke: COL_AB, "stroke-width": 2.5 }));
    texSvg(svg, 392, yT, v.p1, COL_AB, 16, 150, 32);
    texSvg(svg, 392, yB, v.p2, COL_AB, 16, 150, 32);
    modalBody.appendChild(svg);
    const rows = document.createElement("div");
    rows.innerHTML =
      '<div class="mm-row"><span data-tex="\\text{cross-sum: }' + v.p2 + v.p1 + '=' + v.mid + '\\;\\checkmark"></span></div>' +
      '<div class="mm-row"><span data-tex="\\Rightarrow\\;' + v.expr + '=' + v.factors + '"></span></div>' +
      '<div class="mm-map"><span class="mm-pair"><b>left \u00d7 left</b> <span data-tex="=' + v.first + '\\cdot ' + (v.first2 || v.first) + '"></span></span>' +
      '<span class="mm-pair"><b>right \u00d7 right</b> <span data-tex="=' + v.last + '"></span></span></div>';
    modalBody.appendChild(rows);
    renderTex(modalBody);
    modal.classList.remove("hidden");
  }
  function openIdentity(kind, v) {
    v = v || {};
    const forms = {
      "identity-sum": { name: "(a+b)^2", rhs: "a^2+2ab+b^2" },
      "identity-diff": { name: "(a-b)^2", rhs: "a^2-2ab+b^2" },
      "identity-dos": { name: "(a+b)(a-b)", rhs: "a^2-b^2" },
    };
    const f = forms[kind] || forms["identity-sum"];
    modalBody.innerHTML =
      '<p class="mm-tag">Identity used here</p><h3>' + '<span id="mm-h"></span></h3>' +
      '<div class="mm-row"><span data-tex="' + f.name + '=' + f.rhs + '"></span></div>' +
      (v.a ? '<div class="mm-map"><span class="mm-pair"><b>a</b> <span data-tex="=' + v.a + '"></span></span><span class="mm-pair"><b>b</b> <span data-tex="=' + v.b + '"></span></span></div>' +
        '<div class="mm-row"><span data-tex="' + v.sub + '"></span></div>' : '');
    kx(modalBody.querySelector("#mm-h"), f.name);
    renderTex(modalBody);
    modal.classList.remove("hidden");
  }
  function closeModal() { modal.classList.add("hidden"); }

  const Worked = {
    mounted: false,
    mount() {
      if (this.mounted) return;
      frame = document.getElementById("worked-frame");
      listEl = document.getElementById("q-list");
      listInner = document.getElementById("q-sources");
      deckEmpty = document.getElementById("deck-empty");
      scrollEl = document.getElementById("solution-scroll");
      titleEl = document.getElementById("w-qtitle");
      subEl = document.getElementById("w-qsub");
      qexprEl = document.getElementById("w-qexpr");
      prevBtn = document.getElementById("w-prev");
      nextBtn = document.getElementById("w-next");
      resetBtn = document.getElementById("w-reset");
      progLabel = document.getElementById("w-progress-label");
      barFill = document.getElementById("w-bar-fill");
      modal = document.getElementById("method-modal");
      modalBody = document.getElementById("mm-body");
      modalClose = document.getElementById("mm-close");
      subWrap = document.getElementById("worked-sub");
      subSvg = document.getElementById("sub-svg");
      subLabel = document.getElementById("sub-label");
      panelEnlarge = document.getElementById("panel-enlarge");
      peBody = document.getElementById("pe-body");
      peTitle = document.getElementById("pe-title");
      peClose = document.getElementById("pe-close");
      if (!frame) return;
      this.mounted = true;

      buildSources();

      document.querySelectorAll(".panel-enlarge-btn").forEach((btn) => {
        btn.addEventListener("click", (ev) => { ev.stopPropagation(); openPanelEnlarge(btn.dataset.enlarge); });
      });
      if (peClose) peClose.addEventListener("click", closePanelEnlarge);
      if (panelEnlarge) panelEnlarge.addEventListener("click", (e) => { if (e.target === panelEnlarge) closePanelEnlarge(); });

      prevBtn.addEventListener("click", () => setStep(step - 1));
      nextBtn.addEventListener("click", () => setStep(step + 1));
      resetBtn.addEventListener("click", () => setStep(0));
      modalClose.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (panelEnlarge && !panelEnlarge.classList.contains("hidden")) closePanelEnlarge();
        else if (!modal.classList.contains("hidden")) closeModal();
      });
    },
    show() {
      this.mount();
      if (!active) loadQuestion(QZ9, SOURCES[1], "quiz:0:9");
    },
  };
  window.FZFigure = {
    draw: function (svg, spec, methods, reveal) {
      if (!spec || !spec.type) return;
      var draw = FOCUS_DRAW[spec.type];
      if (!draw) return;
      var data = spec.data || (methods && methods[spec.type]) || {};
      var prev = subSvg;
      subSvg = svg;
      draw(reveal == null ? 99 : reveal, data);
      subSvg = prev;
    },
    renderTex: renderTex,
  };
  window.FZ_BANK = function () { return SOURCES; };
  window.FactWorked = Worked;
})();
