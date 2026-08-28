/* Probability — interactive tools.
 *
 * Tool A (card game): a 52-card deck. Pick a SAMPLE SPACE (denominator) and a
 * FAVOURABLE condition (numerator). Cards in the sample space turn face up, the
 * rest stay face down, and the favourable ones glow. The probability is then
 *      P = |favourable in sample| / |sample|
 * shown as a fraction, a probability tree, and a count-by-suit tabulation.
 *
 * Colours match the Manim decks:  favourable -> amber,  total -> green.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const C = { ink: "#e5e7eb", dim: "#94a3b8", fav: "#FFD54F", tot: "#66BB6A", a: "#4FC3F7", red: "#f06292" };

  // ── card model ──────────────────────────────────────────────────────────
  const SUITS = [
    { id: "S", sym: "\u2660", red: false, name: "Spades" },
    { id: "H", sym: "\u2665", red: true, name: "Hearts" },
    { id: "D", sym: "\u2666", red: true, name: "Diamonds" },
    { id: "C", sym: "\u2663", red: false, name: "Clubs" },
  ];
  const RANK_LABEL = { 1: "A", 11: "J", 12: "Q", 13: "K" };
  const rankLabel = (r) => RANK_LABEL[r] || String(r);

  const DECK = [];
  for (const s of SUITS) for (let r = 1; r <= 13; r++) DECK.push({ suit: s, rank: r });

  // ── conditions (usable as sample space and/or favourable) ─────────────────
  const PRED = {
    all:    { label: "Whole deck (52)",          test: () => true },
    red:    { label: "Red cards",                test: (c) => c.suit.red },
    black:  { label: "Black cards",              test: (c) => !c.suit.red },
    spades: { label: "Spades \u2660",            test: (c) => c.suit.id === "S" },
    hearts: { label: "Hearts \u2665",            test: (c) => c.suit.id === "H" },
    diamonds:{ label: "Diamonds \u2666",         test: (c) => c.suit.id === "D" },
    clubs:  { label: "Clubs \u2663",             test: (c) => c.suit.id === "C" },
    number: { label: "Number cards (2\u201310)", test: (c) => c.rank >= 2 && c.rank <= 10 },
    face:   { label: "Face cards (J, Q, K)",     test: (c) => c.rank >= 11 },
    ace:    { label: "Aces",                     test: (c) => c.rank === 1 },
    king:   { label: "Kings",                    test: (c) => c.rank === 13 },
    queen:  { label: "Queens",                   test: (c) => c.rank === 12 },
    jack:   { label: "Jacks",                    test: (c) => c.rank === 11 },
    odd:    { label: "Odd ranks (3,5,7,9)",    test: (c) => c.rank >= 3 && c.rank % 2 === 1 && c.rank <= 9 },
    even:   { label: "Even ranks (2,4,6,8,10)",  test: (c) => c.rank % 2 === 0 && c.rank <= 10 },
  };
  const DENOM_KEYS = ["all", "red", "black", "spades", "hearts", "diamonds", "clubs",
    "number", "face", "ace", "odd", "even"];
  const NUM_KEYS = ["hearts", "diamonds", "spades", "clubs", "red", "black",
    "face", "number", "ace", "king", "queen", "jack", "odd", "even"];

  // ── helpers ───────────────────────────────────────────────────────────────
  function E(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function km(el, latex) {
    try { katex.render(latex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = latex; }
  }
  // iPad / phone: WebKit (bug 23113) paints foreignObject content without the
  // svg's viewBox transform, so KaTeX labels drift to the top-left or vanish.
  // Workaround: position:fixed re-anchors the content to the foreignObject box,
  // with percentage sizes so flex centring still works. Desktop is untouched.
  function isTouchUI() {
    const de = document.documentElement;
    return de.classList.contains("tablet-touch") || de.classList.contains("phone-compact") ||
      window.innerWidth <= 767 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }
  function isAppleWebKit() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true; // iPadOS desktop UA
    return /AppleWebKit/.test(ua) && !/Chrome|CriOS|Edg|Android/.test(ua);
  }
  function anchorFO(fo, div, w, h) {
    if (!isTouchUI() || !isAppleWebKit()) return;
    // position:fixed re-anchors to the foreignObject box (WebKit bug 23113).
    // Pixel width/height are ignored (shrink-wrap), so centre with left/top 50%
    // + translate(-50%,-50%). Rewrite cssText in one shot — piecemeal style
    // updates are unreliable inside a foreignObject on WebKit.
    const color = div.dataset.color || div.style.color || "#e8eefc";
    const fs = parseFloat(div.dataset.basefs || div.style.fontSize) || 14;
    const latex = div.dataset.latex || "";
    const svg = fo.ownerSVGElement;
    const paint = (s) => {
      div.style.cssText = "position:fixed;left:50%;top:52%;transform:translate(-50%,-50%);" +
        "white-space:nowrap;display:flex;align-items:center;justify-content:center;" +
        "color:" + color + ";font-size:" + (fs * s) + "px;line-height:1;";
      if (latex) km(div, latex);
    };
    const apply = () => {
      const vb = svg && svg.viewBox && svg.viewBox.baseVal;
      const cw = svg ? svg.getBoundingClientRect().width : 0;
      if (!vb || !vb.width || !cw) { paint(1); return false; }
      paint(cw / vb.width);
      return true;
    };
    if (!apply() && typeof ResizeObserver !== "undefined" && svg) {
      const ro = new ResizeObserver(() => { if (apply()) ro.disconnect(); });
      ro.observe(svg);
    }
  }
  // Labels are measured off-screen so a long label can be shrunk to fit its pill
  // (measurement is in viewBox units; the scale above then matches the screen).
  let measureBox = null;
  function fitFontSize(latex, fs, maxW) {
    if (!measureBox) {
      measureBox = document.createElement("div");
      measureBox.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;line-height:1;";
      document.body.appendChild(measureBox);
    }
    measureBox.style.fontSize = fs + "px";
    km(measureBox, latex);
    const mw = measureBox.getBoundingClientRect().width;
    measureBox.textContent = "";
    if (mw > maxW && mw > 0) fs = Math.max(9, Math.floor(fs * (maxW / mw) * 0.97));
    return fs;
  }
  function texSvg(p, cx, cy, latex, color, size, w, h) {
    w = w || 120; h = h || 28;
    let fs = size || 14;
    if (isTouchUI()) fs = fitFontSize(latex, fs, w);
    const fo = E("foreignObject", { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    fo.setAttribute("overflow", "visible");
    const div = document.createElement("div");
    div.dataset.latex = latex;
    div.dataset.color = color;
    div.dataset.basefs = String(fs);
    if (isTouchUI() && isAppleWebKit()) {
      // styles + KaTeX applied inside anchorFO once the svg scale is known
      fo.appendChild(div); p.appendChild(fo);
      anchorFO(fo, div, w, h);
    } else {
      div.style.cssText = "width:" + w + "px;height:" + h + "px;display:flex;align-items:center;" +
        "justify-content:center;color:" + color + ";font-size:" + fs + "px;line-height:1;";
      km(div, latex);
      fo.appendChild(div); p.appendChild(fo);
    }
  }
  const tc = (c, s) => `\\textcolor{${c}}{${s}}`;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

  // tiny fraction arithmetic
  function fr(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; }
  function fmul(a, b) { return fr(a.n * b.n, a.d * b.d); }
  function fadd(a, b) { return fr(a.n * b.d + b.n * a.d, a.d * b.d); }
  const fnum = (f) => f.n / f.d;
  const fracTex = (f) => (f.n === 0 ? "0" : f.d === 1 ? String(f.n) : `\\frac{${f.n}}{${f.d}}`);
  const fracStr = (f) => (f.n === 0 ? "0" : f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

  // ball colours
  const BALL = {
    R: { fill: "#ef4444", name: "red" },
    G: { fill: "#22c55e", name: "green" },
    B: { fill: "#3b82f6", name: "blue" },
  };
  const COLS = ["R", "G", "B"];
  function ballHTML(col, size) {
    size = size || 14;
    return `<span class="bb-ball" style="width:${size}px;height:${size}px;background:${BALL[col].fill}"></span>`;
  }

  /* ─────────────────────────── card game tool ─────────────────────────── */
  function initCardTool() {
    const denSel = document.getElementById("ct-denom");
    const numSel = document.getElementById("ct-num");
    const resetBtn = document.getElementById("ct-reset");
    const cardBox = document.getElementById("ct-cards");
    const fBox = document.getElementById("ct-formula");
    const treeSvg = document.getElementById("ct-tree-svg");
    const tabBox = document.getElementById("ct-tab");
    if (!denSel) return;

    const DEFAULT = { den: "all", num: "hearts" };
    const state = { den: DEFAULT.den, num: DEFAULT.num };

    // populate selects
    DENOM_KEYS.forEach((k) => denSel.add(new Option(PRED[k].label, k)));
    NUM_KEYS.forEach((k) => numSel.add(new Option(PRED[k].label, k)));
    denSel.value = state.den; numSel.value = state.num;

    // build the 52 card elements once
    const cardEls = DECK.map((c) => {
      const el = document.createElement("div");
      el.className = "pcard" + (c.suit.red ? " red" : "");
      el.innerHTML = `<span class="r">${rankLabel(c.rank)}</span><span class="s">${c.suit.sym}</span>`;
      cardBox.appendChild(el);
      return el;
    });

    function update() {
      const inS = PRED[state.den].test;
      const inF = PRED[state.num].test;
      let tot = 0, fav = 0;
      const perSuit = {};
      SUITS.forEach((s) => (perSuit[s.id] = { tot: 0, fav: 0 }));

      DECK.forEach((c, i) => {
        const s = inS(c), f = s && inF(c);
        if (s) { tot++; perSuit[c.suit.id].tot++; }
        if (f) { fav++; perSuit[c.suit.id].fav++; }
        const el = cardEls[i];
        el.classList.toggle("up", s);
        el.classList.toggle("down", !s);
        el.classList.toggle("fav", f);
      });

      renderFormula(fav, tot);
      renderTree(fav, tot);
      renderTab(perSuit, fav, tot);
    }

    function renderFormula(fav, tot) {
      clear(fBox);
      const favName = PRED[state.num].label.replace(/\s*\(.*\)/, "");
      const totName = PRED[state.den].label.replace(/\s*\(.*\)/, "");
      const lines = [];
      lines.push(`\\text{favourable} = ${tc(C.fav, fav)} \\quad \\text{total} = ${tc(C.tot, tot)}`);
      let frac = `P = \\dfrac{${tc(C.fav, fav)}}{${tc(C.tot, tot)}}`;
      if (tot > 0 && fav > 0) {
        const g = gcd(fav, tot);
        if (g > 1) frac += ` = \\dfrac{${fav / g}}{${tot / g}}`;
      }
      frac += tot > 0 ? ` \\approx ${(fav / tot).toFixed(3)}` : " = \\text{(empty)}";
      const l1 = document.createElement("div"); l1.className = "eq-line";
      km(l1, `P(\\,${tc(C.fav, "\\text{" + favName + "}")}\\ \\text{within}\\ ${tc(C.tot, "\\text{" + totName + "}")}\\,)`);
      const l2 = document.createElement("div"); l2.className = "eq-line";
      km(l2, lines[0]);
      const l3 = document.createElement("div"); l3.className = "eq-line big";
      km(l3, frac);
      fBox.appendChild(l1); fBox.appendChild(l2); fBox.appendChild(l3);
    }

    function renderTree(fav, tot) {
      clear(treeSvg);
      const rest = tot - fav;
      const rootX = 18, rootY = 110, midX = 150, boxX = 250;
      // root
      drawNode(treeSvg, rootX, rootY, 120, `${tc(C.tot, "\\text{Total}")}=${tc(C.tot, tot)}`, C.tot);
      // branches
      branch(treeSvg, rootX + 122, rootY, boxX, 52, fav, tot, true);
      branch(treeSvg, rootX + 122, rootY, boxX, 168, rest, tot, false);
      // leaf boxes
      drawNode(treeSvg, boxX, 52, 120, `${tc(C.fav, "\\text{favourable}")}=${tc(C.fav, fav)}`, C.fav, true);
      drawNode(treeSvg, boxX, 168, 120, `${tc(C.dim, "\\text{not fav.}")}=${tc(C.dim, rest)}`, C.dim);
    }
    function drawNode(svg, x, y, w, latex, color, glow) {
      const h = 34;
      const r = E("rect", { x, y: y - h / 2, width: w, height: h, rx: 7,
        fill: "#1b2945", stroke: color, "stroke-width": glow ? 2 : 1.3 });
      if (glow) r.setAttribute("filter", "drop-shadow(0 0 5px " + color + ")");
      svg.appendChild(r);
      texSvg(svg, x + w / 2, y, latex, C.ink, 13, w - 8, 24);
    }
    function branch(svg, x1, y1, x2, y2, n, tot, isFav) {
      const color = isFav ? C.fav : C.dim;
      svg.appendChild(E("line", { x1, y1, x2, y2, stroke: color, "stroke-width": isFav ? 2 : 1.6, opacity: isFav ? 0.95 : 0.7 }));
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      // perpendicular offset so the label sits clearly off the line
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      let ox = (-dy / len) * 27, oy = (dx / len) * 27;
      if (isFav && oy > 0) { ox = -ox; oy = -oy; }      // fav label above the line
      if (!isFav && oy < 0) { ox = -ox; oy = -oy; }     // not-fav label below the line
      const lx = mx + ox, ly = my + oy;
      const g = tot > 0 ? gcd(n, tot) : 1;
      const lbl = tot > 0 ? `\\frac{${n}}{${tot}}` + (g > 1 && n > 0 ? `=\\frac{${n / g}}{${tot / g}}` : "") : "0";
      const pw = 78, ph = 24;
      svg.appendChild(E("rect", { x: lx - pw / 2, y: ly - ph / 2, width: pw, height: ph, rx: 8,
        fill: "#0f172a", stroke: color, "stroke-width": 1, opacity: 0.95 }));
      texSvg(svg, lx, ly, tc(color, lbl), color, 12, pw - 8, ph - 4);
    }

    function renderTab(perSuit, fav, tot) {
      const rows = SUITS.map((s) => {
        const cls = s.red ? "suit-red" : "suit-blk";
        return `<tr>
          <td class="suit"><span class="${cls}">${s.sym}</span> ${s.name}</td>
          <td class="tot">${perSuit[s.id].tot}</td>
          <td class="fav">${perSuit[s.id].fav}</td>
        </tr>`;
      }).join("");
      const g = (fav > 0 && tot > 0) ? gcd(fav, tot) : 1;
      const reduced = (fav > 0 && tot > 0 && g > 1) ? ` = ${fav / g}/${tot / g}` : "";
      tabBox.innerHTML = `<table class="ptab">
        <thead><tr><th>Suit</th><th>In sample (total)</th><th>Favourable</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td class="lbl">Total</td>
          <td class="tot">${tot}</td>
          <td class="fav">${fav}</td>
        </tr></tfoot>
      </table>
      <p style="margin:12px 2px 0;font-size:14px;color:var(--dim)">
        P = <b style="color:var(--fav);font-family:'JetBrains Mono',monospace">${fav}</b>
        / <b style="color:var(--tot);font-family:'JetBrains Mono',monospace">${tot}</b>${reduced}</p>`;
    }

    denSel.addEventListener("change", () => { state.den = denSel.value; update(); });
    numSel.addEventListener("change", () => { state.num = numSel.value; update(); });
    resetBtn.addEventListener("click", () => {
      state.den = DEFAULT.den; state.num = DEFAULT.num;
      denSel.value = state.den; numSel.value = state.num; update();
    });

    update();
  }

  /* ─────────────────────────── ball drawing tool ─────────────────────────── */
  const cnt = (seq, c) => seq.filter((x) => x === c).length;
  const FAV = {
    any_red:   { label: "At least one red",        test: (s) => cnt(s, "R") >= 1 },
    any_green: { label: "At least one green",      test: (s) => cnt(s, "G") >= 1 },
    any_blue:  { label: "At least one blue",       test: (s) => cnt(s, "B") >= 1 },
    all_red:   { label: "All red",                 test: (s) => s.length > 0 && s.every((c) => c === "R") },
    all_green: { label: "All green",               test: (s) => s.length > 0 && s.every((c) => c === "G") },
    all_blue:  { label: "All blue",                test: (s) => s.length > 0 && s.every((c) => c === "B") },
    all_same:  { label: "All the same colour",     test: (s) => s.length > 0 && s.every((c) => c === s[0]) },
    all_diff:  { label: "All different colours",   test: (s) => new Set(s).size === s.length && s.length > 1 },
    ex1_red:   { label: "Exactly one red",         test: (s) => cnt(s, "R") === 1 },
    ex1_green: { label: "Exactly one green",       test: (s) => cnt(s, "G") === 1 },
    ex1_blue:  { label: "Exactly one blue",        test: (s) => cnt(s, "B") === 1 },
    no_red:    { label: "No red",                  test: (s) => cnt(s, "R") === 0 },
    no_green:  { label: "No green",                test: (s) => cnt(s, "G") === 0 },
    no_blue:   { label: "No blue",                 test: (s) => cnt(s, "B") === 0 },
  };
  const FAV_KEYS = ["any_red", "any_green", "any_blue", "all_red", "all_green", "all_blue",
    "all_same", "all_diff", "ex1_red", "ex1_green", "ex1_blue", "no_red", "no_green", "no_blue"];
  const MAX_BALLS = 10;        // balls per bag
  const REP_CAP = 8;           // max draws per bag when drawing WITH replacement
  const ENUM_CAP = 8000;       // safety cap on enumerated outcomes
  const TREE_MAX_LEAVES = 40;  // above this, the tree is too dense to draw
  const TAB_MAX_LEAVES = 240;  // above this, list a summary instead of every row
  const FILL_MAX_LEAVES = 8;   // Fill-branches practice: keep the tree small

  function initBallTool() {
    const nbagsBox = document.getElementById("bb-nbags");
    const replaceCb = document.getElementById("bb-replace");
    const modeBox = document.getElementById("bb-mode");
    const favSel = document.getElementById("bb-fav");
    const resetBtn = document.getElementById("bb-reset");
    const bagsBox = document.getElementById("bb-bags");
    const warn = document.getElementById("bb-warn");
    const fillBar = document.getElementById("bb-fill-bar");
    const fillCheck = document.getElementById("bb-fill-check");
    const fillReveal = document.getElementById("bb-fill-reveal");
    const fillStatus = document.getElementById("bb-fill-status");
    const fBox = document.getElementById("bb-formula");
    const treeSvg = document.getElementById("bb-tree-svg");
    const tabBox = document.getElementById("bb-tab");
    if (!nbagsBox) return;

    const def = () => ({ nBags: 1,
      bags: [{ R: 2, G: 1, B: 1 }, { R: 1, G: 1, B: 0 }, { R: 1, G: 0, B: 1 }],
      draws: [2, 0, 0], replace: false, fav: "any_red", mode: "explore" });
    let state = def();
    // edgeKey -> { nInp, dInp, pill, trueFrac, chips }
    let fillEdges = [];
    let fillRevealed = false;
    (function fromURL() {
      const q = new URLSearchParams(location.search);
      if (q.get("nbags")) state.nBags = Math.min(3, Math.max(1, +q.get("nbags")));
      if (q.get("replace")) state.replace = q.get("replace") === "1";
      if (q.get("fav") && FAV[q.get("fav")]) state.fav = q.get("fav");
      state.mode = "explore";
      if (q.get("bags")) q.get("bags").split("_").forEach((bs, i) => {
        const m = bs.split("-").map(Number);
        if (i < 3 && m.length === 3 && m.every((x) => !isNaN(x))) state.bags[i] = { R: m[0], G: m[1], B: m[2] };
      });
      if (q.get("d")) { const a = q.get("d").split(",").map(Number); for (let i = 0; i < 3; i++) if (!isNaN(a[i])) state.draws[i] = a[i]; }
    })();

    FAV_KEYS.forEach((k) => favSel.add(new Option(FAV[k].label, k)));
    favSel.value = state.fav;
    replaceCb.checked = state.replace;
    nbagsBox.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", +x.dataset.n === state.nBags));
    if (modeBox) modeBox.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x.dataset.mode === state.mode));

    function bagTotal(b) { const x = state.bags[b]; return x.R + x.G + x.B; }
    function totalDraws() { let s = 0; for (let b = 0; b < state.nBags; b++) s += state.draws[b]; return s; }

    /* ---- controls render ---- */
    function renderBags() {
      let html = "";
      for (let b = 0; b < state.nBags; b++) {
        const bag = state.bags[b], tot = bagTotal(b);
        let balls = "";
        COLS.forEach((c) => { for (let i = 0; i < bag[c]; i++) balls += ballHTML(c, 18); });
        if (!balls) balls = '<span class="empty">empty bag</span>';
        const rows = COLS.map((c) => `
          <div class="bb-row">
            <span class="lbl"><span class="bb-dot" style="background:${BALL[c].fill}"></span>${BALL[c].name}</span>
            <span class="stepper">
              <button class="step-btn" data-act="col" data-bag="${b}" data-col="${c}" data-d="-1" ${bag[c] <= 0 ? "disabled" : ""}>&minus;</button>
              <span class="step-val">${bag[c]}</span>
              <button class="step-btn" data-act="col" data-bag="${b}" data-col="${c}" data-d="1" ${tot >= MAX_BALLS ? "disabled" : ""}>+</button>
            </span>
          </div>`).join("");
        const dr = state.draws[b];
        const drawMax = state.replace ? REP_CAP : tot;
        html += `<div class="bb-bag">
          <h5>Bag ${b + 1}</h5>
          <div class="bb-balls">${balls}</div>
          ${rows}
          <p class="bb-total">total: ${tot} ball${tot === 1 ? "" : "s"}</p>
          <div class="bb-draw bb-row">
            <span class="lbl">Draw</span>
            <span class="stepper">
              <button class="step-btn" data-act="draw" data-bag="${b}" data-d="-1" ${dr <= 0 ? "disabled" : ""}>&minus;</button>
              <span class="step-val">${dr}</span>
              <button class="step-btn" data-act="draw" data-bag="${b}" data-d="1" ${dr >= drawMax ? "disabled" : ""}>+</button>
            </span>
          </div>
        </div>`;
      }
      bagsBox.innerHTML = html;
    }

    /* ---- experiment / tree enumeration ---- */
    function buildTree() {
      const drawList = [];
      for (let b = 0; b < state.nBags; b++) for (let k = 0; k < state.draws[b]; k++) drawList.push(b);
      const leaves = [];
      const root = { depth: 0, children: null };
      let tooBig = false;
      try {
        (function rec(node, remaining, idx, seq, prob) {
          if (leaves.length > ENUM_CAP) throw "big";
          if (idx === drawList.length) { node.leaf = true; node.seq = seq.slice(); node.prob = prob; leaves.push(node); return; }
          const b = drawList[idx], bag = remaining[b], tot = bag.R + bag.G + bag.B;
          node.children = [];
          if (tot <= 0) { node.leaf = true; node.seq = seq.slice(); node.prob = prob; leaves.push(node); return; }
          COLS.forEach((c) => {
            if (bag[c] <= 0) return;
            const p = fr(bag[c], tot);
            const child = { depth: idx + 1, colour: c, frac: p, bag: b };
            const nr = remaining.map((o) => ({ R: o.R, G: o.G, B: o.B }));
            if (!state.replace) nr[b][c]--;
            node.children.push(child);
            rec(child, nr, idx + 1, seq.concat(c), fmul(prob, p));
          });
        })(root, state.bags.slice(0, state.nBags).map((o) => ({ R: o.R, G: o.G, B: o.B })), 0, [], fr(1, 1));
      } catch (e) { tooBig = true; }
      return { root, leaves, drawList, tooBig };
    }

    function fillUsable(tree) {
      return !tree.tooBig && tree.drawList.length > 0 && tree.leaves.length > 0 &&
        tree.leaves.length <= FILL_MAX_LEAVES;
    }

    function setFillStatus(msg, cls) {
      if (!fillStatus) return;
      fillStatus.textContent = msg || "";
      fillStatus.className = "bb-fill-status" + (cls ? " " + cls : "");
    }

    function parseFracInput(nRaw, dRaw) {
      const nStr = String(nRaw == null ? "" : nRaw).trim();
      const dStr = String(dRaw == null ? "" : dRaw).trim();
      if (!nStr && !dStr) return { empty: true };
      // allow "1/2" pasted into numerator alone
      const slash = nStr.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
      if (slash) return { empty: false, frac: fr(+slash[1], +slash[2]) };
      const n = +nStr, d = +dStr;
      if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0 || nStr === "" || dStr === "") return { empty: false, bad: true };
      return { empty: false, frac: fr(n, d) };
    }

    function sameFrac(a, b) { return a.n === b.n && a.d === b.d; }

    /* ---- probability panel ---- */
    function renderFormula(tree) {
      const { leaves, tooBig } = tree;
      clear(fBox);
      if (state.mode === "fill" && !fillRevealed) {
        const d = document.createElement("div"); d.className = "eq-line";
        d.style.cssText = "font-size:14px;color:var(--dim);line-height:1.45";
        if (!fillUsable(tree)) {
          d.textContent = "Fill mode needs a small tree (ideally 2 draws, ≤ " + FILL_MAX_LEAVES +
            " outcomes). Reduce draws or colours, then try again.";
        } else {
          d.textContent = "Answers hidden — fill each branch probability on the tree, then press Check. " +
            (state.replace ? "With replacement: denominators stay the same." : "Without replacement: update the bag after each draw.");
        }
        fBox.appendChild(d); return;
      }
      if (tooBig) {
        const d = document.createElement("div"); d.className = "eq-line";
        d.style.cssText = "font-size:14px;color:var(--dim)";
        d.textContent = "Too many possible outcomes to enumerate. Reduce the number of draws.";
        fBox.appendChild(d); return;
      }
      const pred = FAV[state.fav].test;
      const favLeaves = leaves.filter((l) => pred(l.seq));
      let favProb = fr(0, 1);
      favLeaves.forEach((l) => { favProb = fadd(favProb, l.prob); });

      const l1 = document.createElement("div"); l1.className = "eq-line";
      km(l1, `P(\\,${tc(C.fav, "\\text{" + FAV[state.fav].label + "}")}\\,)`);
      fBox.appendChild(l1);

      if (favLeaves.length > 1 && favLeaves.length <= 6) {
        const terms = favLeaves.map((l) => fracTex(l.prob)).join(" + ");
        const ls = document.createElement("div"); ls.className = "eq-line";
        km(ls, `= ${terms}`); fBox.appendChild(ls);
      }
      const big = document.createElement("div"); big.className = "eq-line big";
      km(big, `= ${tc(C.fav, fracTex(favProb))} \\approx ${fnum(favProb).toFixed(3)}`);
      fBox.appendChild(big);

      const note = document.createElement("div"); note.className = "eq-line";
      note.style.cssText = "font-size:13px;color:var(--dim);margin-top:6px";
      note.textContent = `${favLeaves.length} of ${leaves.length} possible outcome${leaves.length === 1 ? "" : "s"} favourable` +
        (state.replace ? " · with replacement" : " · without replacement");
      fBox.appendChild(note);
    }

    /* ---- tree diagram ---- */
    function renderTree(tree) {
      clear(treeSvg);
      fillEdges = [];
      const { root, leaves, drawList, tooBig } = tree;
      const pred = FAV[state.fav].test;
      const D = drawList.length;
      const fillMode = state.mode === "fill";

      if (D === 0) {
        treeSvg.setAttribute("viewBox", "0 0 400 80");
        texSvg(treeSvg, 200, 40, tc(C.dim, "\\text{choose a draw}"), C.dim, 14, 280, 24);
        return;
      }
      if (fillMode && !fillUsable(tree)) {
        treeSvg.setAttribute("viewBox", "0 0 440 120");
        const n = tooBig ? (ENUM_CAP + "+") : leaves.length;
        texSvg(treeSvg, 220, 38, tc(C.dim, "\\text{Fill mode needs a smaller tree}"), C.dim, 14, 400, 24);
        texSvg(treeSvg, 220, 68, tc(C.dim, "\\text{" + n + " outcomes — try 2 draws, fewer colours}"), C.dim, 12, 420, 24);
        texSvg(treeSvg, 220, 94, tc(C.dim, "\\text{(at most " + FILL_MAX_LEAVES + " outcomes), or switch to Explore}"), C.dim, 12, 400, 22);
        return;
      }
      if (!fillMode && (tooBig || leaves.length > TREE_MAX_LEAVES)) {
        treeSvg.setAttribute("viewBox", "0 0 400 110");
        const n = tooBig ? (ENUM_CAP + "+") : leaves.length;
        texSvg(treeSvg, 200, 45, tc(C.dim, "\\text{" + n + "\\ outcomes}"), C.dim, 15, 360, 24);
        texSvg(treeSvg, 200, 72, tc(C.dim, "\\text{too many to draw — see probability \\& tabulation}"), C.dim, 12, 380, 24);
        return;
      }

      const LEAFH = fillMode ? 44 : 30, TOP = 44, LEFT = 30, LEVELW = fillMode ? 180 : 150;
      const leafLabelW = fillMode ? 90 : 150;
      let slot = 0;
      (function assignY(n) {
        if (n.leaf || !n.children || !n.children.length) { n.y = TOP + slot * LEAFH + LEAFH / 2; slot++; return n.y; }
        let s = 0; n.children.forEach((c) => { s += assignY(c); }); n.y = s / n.children.length; return n.y;
      })(root);
      root.x = LEFT;
      (function assignX(n) { if (n.children) n.children.forEach((c) => { c.x = LEFT + c.depth * LEVELW; assignX(c); }); })(root);
      const W = LEFT + D * LEVELW + leafLabelW, H = Math.max(120, TOP + slot * LEAFH + 10);
      treeSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      for (let d = 1; d <= D; d++) {
        const b = drawList[d - 1];
        const lbl = state.nBags > 1 ? `\\text{Draw }${d}\\;(\\text{Bag }${b + 1})` : `\\text{Draw }${d}`;
        texSvg(treeSvg, LEFT + d * LEVELW, 16, tc(C.dim, lbl), C.dim, 12, LEVELW, 22);
      }
      treeSvg.appendChild(E("circle", { cx: root.x, cy: root.y, r: 6, fill: "#1b2945", stroke: C.dim, "stroke-width": 1.5 }));

      (function draw(n, pathKey) {
        if (n.children) n.children.forEach((c, i) => {
          const key = pathKey + c.colour;
          edge(n, c, i, n.children.length, key);
          draw(c, key);
        });
        if (n !== root) ball(n);
      })(root, "");

      function edge(p, c, i, cnt, key) {
        const col = BALL[c.colour].fill;
        treeSvg.appendChild(E("line", { x1: p.x, y1: p.y, x2: c.x, y2: c.y,
          stroke: col, "stroke-width": 1.6, opacity: 0.5 }));
        const t = 0.5 + (i - (cnt - 1) / 2) * 0.16;
        const mx = p.x + (c.x - p.x) * t, my = p.y + (c.y - p.y) * t;

        if (!fillMode) {
          const pw = 30, ph = 22;
          treeSvg.appendChild(E("rect", { x: mx - pw / 2, y: my - ph / 2, width: pw, height: ph, rx: 6,
            fill: "#0f172a", stroke: col, "stroke-width": 1, opacity: 0.97 }));
          texSvg(treeSvg, mx, my, tc(col, fracTex(c.frac)), col, 10, pw - 7, ph - 3);
          return;
        }

        // Fill mode: blank fraction inputs + optional chips of bag-based candidates
        const pw = 58, ph = 28;
        const pill = E("rect", { x: mx - pw / 2, y: my - ph / 2, width: pw, height: ph, rx: 6,
          fill: "#0f172a", stroke: col, "stroke-width": 1.2, opacity: 0.97, class: "bb-edge-pill" });
        treeSvg.appendChild(pill);

        const fo = E("foreignObject", { x: mx - pw / 2, y: my - ph / 2, width: pw, height: ph });
        fo.setAttribute("overflow", "visible");
        const wrap = document.createElement("div");
        wrap.className = "bb-frac-wrap";
        wrap.style.cssText = "pointer-events:auto;width:" + pw + "px;height:" + ph + "px";
        const nInp = document.createElement("input");
        nInp.type = "text"; nInp.inputMode = "numeric"; nInp.className = "bb-frac-inp";
        nInp.setAttribute("aria-label", "numerator for " + BALL[c.colour].name + " branch");
        nInp.autocomplete = "off";
        const slash = document.createElement("span"); slash.className = "bb-frac-slash"; slash.textContent = "/";
        const dInp = document.createElement("input");
        dInp.type = "text"; dInp.inputMode = "numeric"; dInp.className = "bb-frac-inp";
        dInp.setAttribute("aria-label", "denominator for " + BALL[c.colour].name + " branch");
        dInp.autocomplete = "off";
        wrap.appendChild(nInp); wrap.appendChild(slash); wrap.appendChild(dInp);
        fo.appendChild(wrap);
        treeSvg.appendChild(fo);

        // Candidate chips = distinct sibling branch probs at this node
        const cand = [];
        const seen = {};
        const addCand = (f) => {
          const s = fracStr(f);
          if (seen[s] || f.n < 0 || f.d <= 0) return;
          seen[s] = true; cand.push(f);
        };
        p.children.forEach((sib) => addCand(sib.frac));
        const chipH = 18;
        const chipFo = E("foreignObject", {
          x: mx - 48, y: my + ph / 2 + 1, width: 96, height: chipH + 2
        });
        chipFo.setAttribute("overflow", "visible");
        const chipRow = document.createElement("div");
        chipRow.className = "bb-frac-chips";
        chipRow.style.cssText = "pointer-events:auto";
        const chipBtns = [];
        cand.forEach((f) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "bb-frac-chip";
          btn.textContent = fracStr(f);
          btn.addEventListener("click", (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            nInp.value = String(f.n); dInp.value = String(f.d);
            chipBtns.forEach((b) => b.classList.toggle("picked", b === btn));
            pill.classList.remove("ok", "bad", "revealed");
            setFillStatus("");
          });
          chipRow.appendChild(btn);
          chipBtns.push(btn);
        });
        chipFo.appendChild(chipRow);
        treeSvg.appendChild(chipFo);

        const onEdit = () => {
          pill.classList.remove("ok", "bad", "revealed");
          const parsed = parseFracInput(nInp.value, dInp.value);
          chipBtns.forEach((b) => {
            b.classList.toggle("picked", !parsed.empty && !parsed.bad && !!parsed.frac && b.textContent === fracStr(parsed.frac));
          });
          setFillStatus("");
        };
        nInp.addEventListener("input", onEdit);
        dInp.addEventListener("input", onEdit);
        // stop enlarge-modal / card click bubbling from inputs
        [nInp, dInp, wrap, chipRow].forEach((el) => {
          el.addEventListener("click", (ev) => ev.stopPropagation());
          el.addEventListener("mousedown", (ev) => ev.stopPropagation());
        });

        fillEdges.push({ key, nInp, dInp, pill, trueFrac: c.frac, chipBtns });
      }
      function ball(n) {
        const fav = n.leaf && pred(n.seq);
        const circ = E("circle", { cx: n.x, cy: n.y, r: 9, fill: BALL[n.colour].fill,
          stroke: fav && !fillMode ? C.fav : "#0b1324", "stroke-width": fav && !fillMode ? 2.5 : 1 });
        if (fav && !fillMode) circ.setAttribute("filter", "drop-shadow(0 0 4px " + C.fav + ")");
        treeSvg.appendChild(circ);
        if (n.leaf) {
          let lx = n.x + 16;
          if (fav && !fillMode) treeSvg.appendChild(E("rect", { x: lx - 4, y: n.y - 12, width: leafLabelW - 18, height: 24, rx: 6,
            fill: "rgba(255,213,79,.12)", stroke: C.fav, "stroke-width": 1 }));
          n.seq.forEach((c, i) => {
            treeSvg.appendChild(E("circle", { cx: lx + 6 + i * 14, cy: n.y, r: 5, fill: BALL[c].fill }));
          });
          if (!fillMode || fillRevealed) {
            const px = lx + 6 + n.seq.length * 14 + 6;
            texSvg(treeSvg, px + 30, n.y, (fav ? tc(C.fav, "=" + fracTex(n.prob)) : "=" + fracTex(n.prob)),
              fav ? C.fav : C.dim, 12, 70, 20);
          }
        }
      }
    }

    /* ---- tabulation ---- */
    function renderTab(tree) {
      const { leaves, drawList, tooBig } = tree;
      const pred = FAV[state.fav].test;
      const D = drawList.length;
      if (state.mode === "fill" && !fillRevealed) {
        if (!fillUsable(tree)) {
          tabBox.innerHTML = '<p style="color:var(--dim);font-size:14px">Reduce draws or colours for Fill mode (≤ ' + FILL_MAX_LEAVES + ' outcomes), or switch to Explore.</p>';
        } else {
          tabBox.innerHTML = '<p style="color:var(--dim);font-size:14px">Tabulation hidden while you fill the tree. Press Reveal (or switch to Explore) to see every outcome.</p>';
        }
        return;
      }
      if (D === 0) { tabBox.innerHTML = '<p style="color:var(--dim);font-size:14px">No draws selected.</p>'; return; }
      if (tooBig) { tabBox.innerHTML = '<p style="color:var(--dim);font-size:14px">Too many outcomes to list — reduce the number of draws.</p>'; return; }
      if (D !== 2 && leaves.length > TAB_MAX_LEAVES) {
        let favProb = fr(0, 1); let nf = 0;
        leaves.forEach((l) => { if (pred(l.seq)) { favProb = fadd(favProb, l.prob); nf++; } });
        tabBox.innerHTML = `<p style="color:var(--dim);font-size:14px">${leaves.length} possible outcomes — too many to list every row.</p>
          <p style="margin-top:8px;font-size:15px">P(favourable) = <b style="color:var(--fav);font-family:'JetBrains Mono',monospace">${fracStr(favProb)}</b>
          <span style="color:var(--dim)">(${nf} favourable)</span></p>`;
        return;
      }

      if (D === 2) {
        // grid: rows = first draw colour, cols = second draw colour
        const rset = [], cset = [];
        leaves.forEach((l) => { if (!rset.includes(l.seq[0])) rset.push(l.seq[0]); if (!cset.includes(l.seq[1])) cset.push(l.seq[1]); });
        const cellMap = {};
        leaves.forEach((l) => { cellMap[l.seq[0] + l.seq[1]] = l.prob; });
        let head = `<tr><th></th>` + cset.map((c) => `<th>${ballHTML(c, 16)}</th>`).join("") + `<th>total</th></tr>`;
        let body = rset.map((r) => {
          let rowSum = fr(0, 1);
          const cells = cset.map((c) => {
            const f = cellMap[r + c] || fr(0, 1); rowSum = fadd(rowSum, f);
            const isFav = pred([r, c]) && (cellMap[r + c]);
            return `<td class="cellp ${isFav ? "cell-fav" : ""}">${fracStr(f)}</td>`;
          }).join("");
          return `<tr><td class="suit">${ballHTML(r, 16)}</td>${cells}<td class="cellp tot">${fracStr(rowSum)}</td></tr>`;
        }).join("");
        let colSums = cset.map((c) => { let s = fr(0, 1); rset.forEach((r) => { s = fadd(s, cellMap[r + c] || fr(0, 1)); }); return s; });
        let foot = `<tr><td class="lbl">total</td>` + colSums.map((s) => `<td class="cellp tot">${fracStr(s)}</td>`).join("") + `<td class="cellp tot">1</td></tr>`;
        tabBox.innerHTML = `<table class="ptab"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>
          <p style="margin:10px 2px 0;font-size:13px;color:var(--dim)">Amber cells are favourable. Each cell = P(row, then column).</p>`;
        return;
      }

      // flat list of every outcome (1 draw, or 3+ draws)
      let favProb = fr(0, 1);
      const rows = leaves.map((l) => {
        const isFav = pred(l.seq);
        if (isFav) favProb = fadd(favProb, l.prob);
        const balls = `<span class="balls-cell">${l.seq.map((c) => ballHTML(c, 14)).join("")}</span>`;
        return `<tr class="${isFav ? "bb-leaf-fav" : ""}">
          <td class="suit">${balls}</td>
          <td class="cellp ${isFav ? "fav" : ""}">${fracStr(l.prob)}</td>
          <td>${isFav ? '<span style="color:var(--fav)">✓ favourable</span>' : '<span style="color:var(--dim)">—</span>'}</td>
        </tr>`;
      }).join("");
      tabBox.innerHTML = `<div style="max-height:300px;overflow:auto"><table class="ptab">
        <thead><tr><th>Outcome</th><th>Probability</th><th>Favourable?</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td class="lbl">P(favourable)</td><td class="cellp fav">${fracStr(favProb)}</td><td></td></tr></tfoot>
      </table></div>`;
    }

    function syncFillBar(tree) {
      if (!fillBar) return;
      const on = state.mode === "fill";
      fillBar.classList.toggle("visible", on);
      if (fillCheck) fillCheck.disabled = !on || !fillUsable(tree);
      if (fillReveal) fillReveal.disabled = !on || !fillUsable(tree);
    }

    function checkFillAnswers() {
      if (!fillEdges.length) return;
      let ok = 0, wrong = 0, empty = 0;
      fillEdges.forEach((e) => {
        const parsed = parseFracInput(e.nInp.value, e.dInp.value);
        e.pill.classList.remove("ok", "bad", "revealed");
        if (parsed.empty) { empty++; return; }
        if (parsed.bad || !sameFrac(parsed.frac, e.trueFrac)) {
          e.pill.classList.add("bad"); wrong++;
        } else {
          e.pill.classList.add("ok"); ok++;
        }
      });
      if (empty && !ok && !wrong) setFillStatus("Enter a fraction on each branch.", "bad");
      else if (wrong || empty) {
        setFillStatus((ok ? ok + " correct · " : "") + (wrong ? wrong + " incorrect" : "") +
          (empty ? (wrong ? " · " : "") + empty + " blank" : "") + ".", "bad");
      } else {
        revealFillAnswers(true);
      }
    }

    function revealFillAnswers(fromCheck) {
      fillRevealed = true;
      const saved = fillEdges.map((e) => ({
        key: e.key,
        n: e.nInp.value,
        d: e.dInp.value,
      }));
      const tree = buildTree();
      renderFormula(tree);
      renderTree(tree);
      renderTab(tree);
      fillEdges.forEach((e) => {
        if (fromCheck) {
          const prev = saved.find((s) => s.key === e.key);
          if (prev) { e.nInp.value = prev.n; e.dInp.value = prev.d; }
        } else {
          e.nInp.value = String(e.trueFrac.n);
          e.dInp.value = String(e.trueFrac.d);
        }
        e.pill.classList.remove("ok", "bad", "revealed");
        e.pill.classList.add(fromCheck ? "ok" : "revealed");
        if (e.chipBtns) e.chipBtns.forEach((b) => b.classList.toggle("picked", b.textContent === fracStr(e.trueFrac)));
      });
      if (fromCheck) setFillStatus("All " + fillEdges.length + " branches correct!", "ok");
      else setFillStatus("Correct fractions shown.", "ok");
    }

    /* ---- recompute everything ---- */
    function compute() {
      if (totalDraws() === 0) { warn.textContent = "Set at least one draw to build the experiment."; }
      else if (state.mode === "fill") {
        const preview = buildTree();
        if (!fillUsable(preview) && totalDraws() > 0) {
          warn.textContent = "Fill branches works best with 2 draws and ≤ " + FILL_MAX_LEAVES +
            " outcomes — reduce draws or colours (or switch to Explore).";
        } else { warn.textContent = ""; }
      } else { warn.textContent = ""; }
      fillRevealed = false;
      setFillStatus("");
      const tree = buildTree();
      syncFillBar(tree);
      renderFormula(tree);
      renderTree(tree);
      renderTab(tree);
    }
    function renderAll() { renderBags(); compute(); }

    /* ---- interactions ---- */
    bagsBox.addEventListener("click", (e) => {
      const btn = e.target.closest(".step-btn"); if (!btn) return;
      const b = +btn.dataset.bag, d = +btn.dataset.d;
      if (btn.dataset.act === "col") {
        const col = btn.dataset.col, bag = state.bags[b];
        const nv = bag[col] + d;
        if (nv < 0) return;
        if (d > 0 && bagTotal(b) >= MAX_BALLS) return;
        bag[col] = nv;
        if (!state.replace && state.draws[b] > bagTotal(b)) state.draws[b] = bagTotal(b);
      } else if (btn.dataset.act === "draw") {
        let nv = state.draws[b] + d;
        if (nv < 0) return;
        if (d > 0) {
          if (!state.replace && nv > bagTotal(b)) return;   // can't draw more than the bag holds
          if (state.replace && nv > REP_CAP) return;
        }
        state.draws[b] = nv;
      }
      renderAll();
    });

    nbagsBox.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
      state.nBags = +b.dataset.n;
      nbagsBox.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      for (let i = state.nBags; i < 3; i++) state.draws[i] = 0;
      if (totalDraws() === 0) state.draws[0] = 1;
      renderAll();
    }));
    if (modeBox) modeBox.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
      state.mode = "explore";
      modeBox.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x.dataset.mode === "explore"));
      compute();
    }));
    if (fillCheck) fillCheck.addEventListener("click", (e) => { e.stopPropagation(); checkFillAnswers(); });
    if (fillReveal) fillReveal.addEventListener("click", (e) => { e.stopPropagation(); revealFillAnswers(false); });
    replaceCb.addEventListener("change", () => {
      state.replace = replaceCb.checked;
      if (!state.replace) for (let b = 0; b < 3; b++) if (state.draws[b] > bagTotal(b)) state.draws[b] = bagTotal(b);
      renderAll();
    });
    favSel.addEventListener("change", () => { state.fav = favSel.value; compute(); });
    resetBtn.addEventListener("click", () => {
      state = def();
      state.mode = "explore";
      replaceCb.checked = false; favSel.value = state.fav;
      nbagsBox.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x.dataset.n === "1"));
      renderAll();
    });

    renderAll();
  }

  /* ─────────────────────────── tab / deck / tool wiring ─────────────────── */
  function initTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = {
      slides: document.getElementById("panel-slides"),
      tools: document.getElementById("panel-tools"),
      game: document.getElementById("panel-game"),
      quiz: document.getElementById("panel-quiz"),
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      for (const k in panels) if (panels[k]) panels[k].classList.toggle("hidden", k !== t.dataset.tab);
      if (t.dataset.tab === "game" && window.ProbGame) window.ProbGame.show();
    }));
  }
  function initDecks() {
    const frame = document.getElementById("deck-frame");
    const btns = document.querySelectorAll("[data-deck]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("active", x === b));
      frame.src = b.dataset.deck;
    }));
    if (window.KOCDeckTouch) window.KOCDeckTouch.initDeckTouchNav(frame);
  }
  function initToolNav() {
    const btns = document.querySelectorAll("[data-tool]");
    const tools = { card: document.getElementById("tool-card"), ball: document.getElementById("tool-ball") };
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("active", x === b));
      for (const k in tools) if (tools[k]) tools[k].classList.toggle("ct-hide", k !== b.dataset.tool);
    }));
  }

  function applyDeepLink() {
    const q = new URLSearchParams(location.search);
    const tab = q.get("tab"), tool = q.get("tool"), den = q.get("den"), num = q.get("num");
    if (tab) { const b = document.querySelector(`[data-tab="${tab}"]`); if (b) b.click(); }
    if (tool) { const b = document.querySelector(`[data-tool="${tool}"]`); if (b) b.click(); }
    const denSel = document.getElementById("ct-denom"), numSel = document.getElementById("ct-num");
    if (den && denSel && PRED[den]) { denSel.value = den; denSel.dispatchEvent(new Event("change")); }
    if (num && numSel && PRED[num]) { numSel.value = num; numSel.dispatchEvent(new Event("change")); }
  }
  function initCardModal() {
    const modal = document.getElementById("ct-modal");
    const body = document.getElementById("ct-modal-body");
    const closeBtn = document.getElementById("ct-modal-close");
    if (!modal) return;
    function open(card) {
      body.innerHTML = "";
      const clone = card.cloneNode(true);
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      body.appendChild(clone);
      modal.classList.remove("hidden");
    }
    function close() { modal.classList.add("hidden"); body.innerHTML = ""; }
    document.querySelectorAll("#panel-tools .res-card").forEach((c) => c.addEventListener("click", () => open(c)));
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  function start() {
    if (window.KOCDeckTouch) {
      window.KOCDeckTouch.initTabletClass();
      window.KOCDeckTouch.initTabletMode();
    }
    initTabs(); initDecks(); initToolNav(); initCardTool(); initBallTool(); initCardModal(); applyDeepLink();
  }
  if (window.katex) { window.addEventListener("DOMContentLoaded", start); }
  else { window.addEventListener("DOMContentLoaded", () => {
    (function wait() { if (window.katex) start(); else setTimeout(wait, 30); })();
  }); }
})();
