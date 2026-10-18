/**
 * JM28 Meeting Point
 * Free-draw special lines from vertices / mid-points. Centre stays hidden
 * until three lines exist — then we reveal whether they meet at the target.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var W = 460;
  var H = 360;
  var HIT = 10;
  var PERP_COS = 0.07; /* |cos| below this ≈ perpendicular (tighter) */
  var CENTRE_TOL = 3.5; /* tighter concurrence check */
  var CLUSTER_TOL = 5;
  var SIDE_EQ = 5; /* px — sides closer than this share tick count */
  var BISECTOR_COS = 0.985; /* ~10° from true bisector */
  var HANDLE = "#0284c7";
  var DELETE_HINT = "Delete a line (hover + double-click) to remove it.";
  var ENERGY_MAX = 100;
  var ENERGY_MISS = 12;
  var LABELS = ["A", "B", "C"];
  var TICK = "#dc2626";
  var MARK = "#2563eb";
  var INK = "#0f172a";
  var DASH = "#0284c7";
  var HOT = "#e11d48";

  var MODE_META = {
    median: {
      centre: "Centroid",
      line: "medians",
      tip: "Draw three medians (vertex → mid-point of the opposite side). Release freely — find where they meet.",
    },
    altitude: {
      centre: "Orthocentre",
      line: "altitudes",
      tip: "Draw three altitudes (vertex ⊥ opposite side). In an obtuse triangle the meeting point may lie outside.",
    },
    bisector: {
      centre: "In-centre",
      line: "angle bisectors",
      tip: "Draw three angle bisectors from the vertices. They meet at a point inside the triangle.",
    },
    perp: {
      centre: "Circumcentre",
      line: "perpendicular bisectors",
      tip: "Draw three perpendicular bisectors from the side mid-points. Acute → inside; right → on a side; obtuse → outside.",
    },
  };

  /* Compact shapes centred in the smaller viewBox */
  var SHAPES = {
    acute: [
      { x: 70, y: 230 },
      { x: 340, y: 215 },
      { x: 200, y: 45 },
    ],
    acute2: [
      { x: 55, y: 200 },
      { x: 330, y: 235 },
      { x: 250, y: 50 },
    ],
    right: [
      { x: 80, y: 220 },
      { x: 300, y: 220 },
      { x: 80, y: 60 },
    ],
    right2: [
      { x: 90, y: 50 },
      { x: 90, y: 230 },
      { x: 310, y: 230 },
    ],
    /* clearly obtuse at B */
    obtuse: [
      { x: 50, y: 220 },
      { x: 250, y: 220 },
      { x: 340, y: 90 },
    ],
    /* clearly obtuse at A */
    obtuse2: [
      { x: 95, y: 155 },
      { x: 50, y: 40 },
      { x: 55, y: 250 },
    ],
    /* clearly obtuse at C */
    obtuse3: [
      { x: 55, y: 200 },
      { x: 330, y: 230 },
      { x: 140, y: 150 },
    ],
    isosceles: [
      { x: 90, y: 230 },
      { x: 310, y: 230 },
      { x: 200, y: 50 },
    ],
    isosceles2: [
      { x: 200, y: 45 },
      { x: 70, y: 230 },
      { x: 330, y: 230 },
    ],
    scalene: [
      { x: 55, y: 205 },
      { x: 335, y: 245 },
      { x: 165, y: 42 },
    ],
  };

  var LEVELS = [
    { act: 1, mode: "median", shape: "scalene", title: "Medians → Centroid" },
    { act: 1, mode: "altitude", shape: "obtuse", title: "Altitudes → Orthocentre (obtuse)" },
    { act: 1, mode: "bisector", shape: "isosceles", title: "Bisectors → In-centre" },
    { act: 1, mode: "perp", shape: "obtuse2", title: "Perp. bisectors (obtuse)" },
    { act: 2, mode: "median", shape: "right", title: "Medians (right-angled)" },
    { act: 2, mode: "altitude", shape: "acute2", title: "Altitudes (acute)" },
    { act: 2, mode: "perp", shape: "right2", title: "Circumcentre on the hypotenuse" },
    { act: 2, mode: "bisector", shape: "obtuse3", title: "In-centre (obtuse)" },
    { act: 3, switch: true, crystals: 3, switchMs: 14000, timeLimit: 100, title: "Centre scramble I", shapes: ["obtuse", "scalene", "isosceles"] },
    { act: 3, switch: true, crystals: 3, switchMs: 12000, timeLimit: 85, title: "Centre scramble II", shapes: ["obtuse2", "right", "acute2"] },
    { act: 3, switch: true, crystals: 4, switchMs: 10000, timeLimit: 75, title: "Centre scramble III", shapes: ["obtuse3", "isosceles2", "right2", "scalene"] },
    { act: 3, switch: true, crystals: 4, switchMs: 8000, timeLimit: 60, title: "Line master", shapes: ["obtuse", "obtuse2", "right", "acute", "scalene"], boss: true },
  ];

  var SWITCH_ORDER = ["median", "altitude", "bisector", "perp"];

  var state = {
    levelIdx: 0,
    rawVerts: null,
    verts: null,
    mode: "median",
    lines: [], /* { a, b, from: {kind,index} } */
    energy: ENERGY_MAX,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    startedAt: 0,
    crystalLit: false,
    crystalsDone: 0,
    reveal: null, /* null | { ok, point } */
    switchTimer: null,
    switchEndsAt: 0,
    levelTimer: null,
    levelEndsAt: 0,
    drag: null,
    hoverLine: -1,
    pointer: null,
    running: false,
    stars: 0,
    overlay: "title",
  };

  var els = {};

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function mid(p, q) { return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function unit(p, q) {
    var d = dist(p, q) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
  }
  function add(p, u, s) { return { x: p.x + u.x * s, y: p.y + u.y * s }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function cloneVerts(v) { return v.map(function (p) { return { x: p.x, y: p.y }; }); }

  function foot(p, a, b) {
    var abx = b.x - a.x;
    var aby = b.y - a.y;
    var len2 = abx * abx + aby * aby || 1;
    var t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    return { x: a.x + t * abx, y: a.y + t * aby, t: t };
  }

  function distPointToSeg(p, a, b) {
    var f = foot(p, a, b);
    var t = Math.max(0, Math.min(1, f.t));
    var q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    return dist(p, q);
  }

  function intersectLines(p1, p2, p3, p4) {
    var d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 1e-8) return null;
    var t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    var u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
      t: t,
      u: u,
    };
  }

  function centroid(v) {
    return { x: (v[0].x + v[1].x + v[2].x) / 3, y: (v[0].y + v[1].y + v[2].y) / 3 };
  }
  function orthocentre(v) {
    var F0 = foot(v[0], v[1], v[2]);
    var F1 = foot(v[1], v[0], v[2]);
    return intersectLines(v[0], F0, v[1], F1);
  }
  function incentre(v) {
    var a = dist(v[1], v[2]);
    var b = dist(v[0], v[2]);
    var c = dist(v[0], v[1]);
    var p = a + b + c;
    return {
      x: (a * v[0].x + b * v[1].x + c * v[2].x) / p,
      y: (a * v[0].y + b * v[1].y + c * v[2].y) / p,
    };
  }
  function circumcentre(v) {
    var A = v[0], B = v[1], C = v[2];
    var D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(D) < 1e-6) return null;
    var a2 = A.x * A.x + A.y * A.y;
    var b2 = B.x * B.x + B.y * B.y;
    var c2 = C.x * C.x + C.y * C.y;
    return {
      x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / D,
      y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / D,
    };
  }
  function trueCentre(mode, v) {
    if (mode === "median") return centroid(v);
    if (mode === "altitude") return orthocentre(v);
    if (mode === "bisector") return incentre(v);
    return circumcentre(v);
  }

  function fitToView(verts, mode) {
    var src = cloneVerts(verts);
    var c0 = trueCentre(mode, src);
    var pts = src.slice();
    if (c0) pts.push(c0);
    var i;
    for (i = 0; i < 3; i++) pts.push(mid(src[i], src[(i + 1) % 3]));
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    pts.forEach(function (p) {
      if (!p) return;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    var pad = 48;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    var bw = Math.max(60, maxX - minX);
    var bh = Math.max(60, maxY - minY);
    var scale = Math.min((W - 24) / bw, (H - 24) / bh) * 0.88;
    var cx = (minX + maxX) / 2;
    var cy = (minY + maxY) / 2;
    return src.map(function (p) {
      return {
        x: W / 2 + (p.x - cx) * scale,
        y: H / 2 + (p.y - cy) * scale,
      };
    });
  }

  function applyVerts(raw, mode) {
    state.rawVerts = cloneVerts(raw);
    state.verts = fitToView(state.rawVerts, mode || state.mode);
  }

  function levelDef() { return LEVELS[state.levelIdx]; }

  function pickShape(lv) {
    if (lv.shapes && lv.shapes.length) {
      return lv.shapes[Math.floor(Math.random() * lv.shapes.length)];
    }
    return lv.shape || "acute";
  }

  function clearTimers() {
    if (state.switchTimer) { clearInterval(state.switchTimer); state.switchTimer = null; }
    if (state.levelTimer) { clearInterval(state.levelTimer); state.levelTimer = null; }
  }

  function handlePoint(kind, index) {
    if (kind === "vertex") return state.verts[index];
    return mid(state.verts[index], state.verts[(index + 1) % 3]);
  }

  function setMode(mode) {
    state.mode = mode;
    state.lines = [];
    state.crystalLit = false;
    state.reveal = null;
    state.hoverLine = -1;
    if (state.rawVerts) applyVerts(state.rawVerts, mode);
    updateHud();
    draw();
    drawSolution();
  }

  function startLevel(idx) {
    clearTimers();
    hideClearBar();
    state.levelIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
    var lv = levelDef();
    var shape = pickShape(lv);
    var mode0 = lv.switch ? SWITCH_ORDER[0] : (lv.mode || "median");
    state.mode = mode0;
    applyVerts(SHAPES[shape], mode0);
    state.energy = ENERGY_MAX;
    state.combo = 0;
    state.maxCombo = 0;
    state.misses = 0;
    state.crystalsDone = 0;
    state.crystalLit = false;
    state.startedAt = Date.now();
    state.overlay = "play";
    state.running = true;
    state.drag = null;
    state.reveal = null;
    state.lines = [];
    state.hoverLine = -1;
    if (lv.switch) {
      state.switchEndsAt = Date.now() + (lv.switchMs || 12000);
      state.switchTimer = setInterval(onSwitchTick, 200);
      state.levelEndsAt = Date.now() + (lv.timeLimit || 90) * 1000;
      state.levelTimer = setInterval(onLevelTick, 200);
    }
    showOverlay("play");
    updateHud();
    draw();
    drawSolution();
  }

  function onSwitchTick() {
    if (!state.running || state.overlay !== "play") return;
    updateTimers();
    if (state.switchEndsAt - Date.now() > 0) return;
    var i = SWITCH_ORDER.indexOf(state.mode);
    setMode(SWITCH_ORDER[(i + 1) % SWITCH_ORDER.length]);
    state.energy = Math.max(0, state.energy - 8);
    state.combo = 0;
    state.switchEndsAt = Date.now() + (levelDef().switchMs || 12000);
    pulse("warn");
    if (state.energy <= 0) failLevel("Out of energy — the target centre changed too soon.");
  }

  function onLevelTick() {
    if (!state.running || state.overlay !== "play") return;
    updateTimers();
    if (Date.now() >= state.levelEndsAt) failLevel("Time is up — the crystal never lit.");
  }

  function updateTimers() {
    if (!els.timerRow) return;
    var lv = levelDef();
    if (lv.switch) {
      els.timerSwitch.textContent = Math.max(0, Math.ceil((state.switchEndsAt - Date.now()) / 1000)) + "s";
      els.timerLevel.textContent = Math.max(0, Math.ceil((state.levelEndsAt - Date.now()) / 1000)) + "s";
      els.timerRow.classList.remove("hidden");
    } else {
      els.timerRow.classList.add("hidden");
    }
  }

  function starsForClear() {
    var elapsed = (Date.now() - state.startedAt) / 1000;
    var s = 3;
    if (state.misses > 2 || state.energy < 40) s = 2;
    if (state.misses > 5 || state.energy < 20 || elapsed > 100) s = 1;
    return s;
  }

  function clearCrystal() {
    state.crystalLit = true;
    state.crystalsDone += 1;
    pulse("ok");
    updateHud();
    var lv = levelDef();
    var need = lv.switch ? (lv.crystals || 3) : 1;
    if (state.crystalsDone >= need) {
      state.stars = starsForClear();
      state.running = false;
      clearTimers();
      showClear();
      return;
    }
    var i = SWITCH_ORDER.indexOf(state.mode);
    setMode(SWITCH_ORDER[(i + 1) % SWITCH_ORDER.length]);
    state.switchEndsAt = Date.now() + (lv.switchMs || 12000);
  }

  function failLevel(msg) {
    state.running = false;
    clearTimers();
    state.overlay = "fail";
    els.failMsg.textContent = msg || "Try again!";
    showOverlay("fail");
  }

  function centreSymbol(mode) {
    if (mode === "median") return "G";
    if (mode === "altitude") return "H";
    if (mode === "bisector") return "I";
    return "O";
  }

  function segmentsForLabelClearance() {
    var segs = [];
    var v = state.verts;
    var i;
    if (v) {
      for (i = 0; i < 3; i++) segs.push([v[i], v[(i + 1) % 3]]);
    }
    state.lines.forEach(function (L) { segs.push([L.a, L.b]); });
    return segs;
  }

  function bestLabelOffset(c, segs) {
    var opts = [
      { x: 16, y: -14 }, { x: -16, y: -14 }, { x: 16, y: 14 }, { x: -16, y: 14 },
      { x: 0, y: -18 }, { x: 0, y: 18 }, { x: 18, y: 0 }, { x: -18, y: 0 },
      { x: 14, y: -6 }, { x: -14, y: 6 },
    ];
    var g = state.verts ? centroid(state.verts) : c;
    var rdx = c.x - g.x;
    var rdy = c.y - g.y;
    var rd = Math.hypot(rdx, rdy) || 1;
    opts.push({ x: (rdx / rd) * 18, y: (rdy / rd) * 18 });
    var best = opts[0];
    var bestScore = -1;
    opts.forEach(function (off) {
      var p = { x: c.x + off.x, y: c.y + off.y };
      var minD = 1000;
      (segs || []).forEach(function (S) {
        minD = Math.min(minD, distPointToSeg(p, S[0], S[1]));
      });
      minD = Math.min(minD, dist(p, c)); /* prefer not sitting on the spot */
      var score = minD + Math.hypot(off.x, off.y) * 0.05;
      if (score > bestScore) { bestScore = score; best = off; }
    });
    return best;
  }

  function appendCentreSpot(svg, c, mode, extraSegs) {
    if (!c) return;
    svg.appendChild(E("circle", {
      cx: c.x, cy: c.y, r: 3.8,
      fill: HANDLE, stroke: "none",
    }));
    var segs = (extraSegs || []).concat(segmentsForLabelClearance());
    var off = bestLabelOffset(c, segs);
    var t = E("text", {
      x: c.x + off.x,
      y: c.y + off.y,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill: INK,
      "font-size": "13",
      "font-weight": "800",
    });
    t.textContent = centreSymbol(mode);
    svg.appendChild(t);
  }

  function showFinishBar(ok) {
    /* always show after Check / Skip — does not cover the figure */
    state.overlay = "clear";
    state.running = false;
    clearTimers();
    if (els.clearBar) els.clearBar.classList.remove("hidden");
    var stars = ok ? (state.stars || starsForClear()) : 0;
    state.stars = stars;
    els.clearStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    els.clearTitle.textContent = ok
      ? levelDef().title + " · Cleared"
      : levelDef().title + " · See solution";
    els.clearMsg.textContent = ok
      ? ("Best combo " + state.maxCombo + " · Retries " + state.misses + " · Energy left " + Math.round(state.energy))
      : "Correct figure shown below · Next level or Replay";
    if (els.nextBtn) {
      els.nextBtn.textContent = state.levelIdx >= LEVELS.length - 1 ? "Play again" : "Next level";
    }
    showOverlay("play");
    updateHud();
  }

  function showClear() {
    showFinishBar(true);
  }

  function hideClearBar() {
    if (els.clearBar) els.clearBar.classList.add("hidden");
  }

  function showOverlay(which) {
    var mode = which || "play";
    if (els.overlayTitle) els.overlayTitle.classList.toggle("hidden", mode !== "title");
    if (els.overlayFail) els.overlayFail.classList.toggle("hidden", mode !== "fail");
    if (mode === "title" || mode === "fail") hideClearBar();
  }

  function pulse(kind) {
    var root = els.root;
    root.classList.remove("mp-pulse-ok", "mp-pulse-bad", "mp-pulse-warn");
    void root.offsetWidth;
    root.classList.add(kind === "ok" ? "mp-pulse-ok" : kind === "warn" ? "mp-pulse-warn" : "mp-pulse-bad");
    setTimeout(function () {
      root.classList.remove("mp-pulse-ok", "mp-pulse-bad", "mp-pulse-warn");
    }, 420);
  }

  function updateHud() {
    var lv = levelDef();
    var meta = MODE_META[state.mode];
    els.levelNum.textContent = (state.levelIdx + 1) + " / " + LEVELS.length;
    els.actLabel.textContent =
      lv.act === 1 ? "Act 1 · Learn the four lines" :
      lv.act === 2 ? "Act 2 · Shape challenges" :
      "Act 3 · Centre scramble";
    els.energyFill.style.width = Math.max(0, Math.min(100, state.energy)) + "%";
    els.combo.textContent = String(state.combo);
    els.crystals.textContent = lv.switch
      ? state.crystalsDone + " / " + (lv.crystals || 3)
      : (state.crystalLit ? "1 / 1" : "0 / 1");
    els.lockedCount.textContent = String(state.lines.length);
    els.tip.textContent = meta.tip + " " + DELETE_HINT;
    els.crystalName.textContent = meta.centre;
    els.lineName.textContent = meta.line;
    if (els.checkBtn) {
      els.checkBtn.disabled = !(
        state.running && state.overlay === "play" && state.lines.length >= 3 && !state.reveal
      );
    }
    updateTimers();
  }

  function svgPoint(evt) {
    var pt = els.svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var ctm = els.svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }

  function nearestHandle(p, maxD) {
    var best = null;
    var bestD = maxD;
    var i;
    for (i = 0; i < 3; i++) {
      var d = dist(p, state.verts[i]);
      if (d < bestD) { bestD = d; best = { kind: "vertex", index: i }; }
    }
    for (i = 0; i < 3; i++) {
      var m = mid(state.verts[i], state.verts[(i + 1) % 3]);
      d = dist(p, m);
      if (d < bestD) { bestD = d; best = { kind: "side", index: i }; }
    }
    return best;
  }

  function nearestLine(p, maxD) {
    var best = -1;
    var bestD = maxD;
    state.lines.forEach(function (L, i) {
      var d = distPointToSeg(p, L.a, L.b);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function isPerp(u, w) {
    var du = Math.hypot(u.x, u.y) || 1;
    var dw = Math.hypot(w.x, w.y) || 1;
    return Math.abs(dot({ x: u.x / du, y: u.y / du }, { x: w.x / dw, y: w.y / dw })) < PERP_COS;
  }

  function perpHitsForSegment(a, b) {
    var hits = [];
    var dir = sub(b, a);
    var segs = [];
    var i;
    for (i = 0; i < 3; i++) {
      segs.push([state.verts[i], state.verts[(i + 1) % 3]]);
    }
    state.lines.forEach(function (L) {
      if (Math.abs(L.a.x - a.x) < 0.5 && Math.abs(L.a.y - a.y) < 0.5
        && Math.abs(L.b.x - b.x) < 0.5 && Math.abs(L.b.y - b.y) < 0.5) return;
      segs.push([L.a, L.b]);
    });
    segs.forEach(function (S) {
      var side = sub(S[1], S[0]);
      if (!isPerp(dir, side)) return;
      var hit = intersectLines(a, b, S[0], S[1]);
      if (!hit) return;
      if (hit.t < -0.08 || hit.t > 1.08) return;
      /* allow feet on side extensions beyond the segment */
      if (hit.u < -0.55 || hit.u > 1.55) return;
      var alongLine = dist(hit, a) <= dist(hit, b) ? b : a;
      if (dist(hit, a) < 1.5) alongLine = b;
      if (dist(hit, b) < 1.5) alongLine = a;
      var alongSide = dist(hit, S[0]) <= dist(hit, S[1]) ? S[1] : S[0];
      hits.push({ x: hit.x, y: hit.y, alongLine: alongLine, alongSide: alongSide });
    });
    return hits;
  }

  function meetPointOfLines(lines) {
    if (!lines || lines.length < 2) return null;
    var pts = [];
    var i, j;
    for (i = 0; i < lines.length; i++) {
      for (j = i + 1; j < lines.length; j++) {
        var m = intersectLines(lines[i].a, lines[i].b, lines[j].a, lines[j].b);
        if (m) pts.push(m);
      }
    }
    if (pts.length < 1) return null;
    var avg = { x: 0, y: 0 };
    pts.forEach(function (p) { avg.x += p.x; avg.y += p.y; });
    avg.x /= pts.length;
    avg.y /= pts.length;
    for (i = 0; i < pts.length; i++) {
      if (dist(pts[i], avg) > CLUSTER_TOL) return null;
    }
    return avg;
  }

  function evaluateLines() {
    var c = trueCentre(state.mode, state.verts);
    if (!c || state.lines.length < 3) return { ok: false, point: null, trueC: c };
    var through = state.lines.filter(function (L) {
      return dist(c, foot(c, L.a, L.b)) < CENTRE_TOL;
    });
    if (through.length < 3) return { ok: false, point: null, trueC: c };
    var meet = meetPointOfLines(through);
    if (!meet || dist(meet, c) > CENTRE_TOL) {
      return { ok: false, point: meet, trueC: c };
    }
    return { ok: true, point: meet, trueC: c };
  }

  function checkAnswer() {
    if (state.lines.length < 3 || state.reveal) return;
    var result = evaluateLines();
    state.reveal = {
      ok: !!result.ok,
      /* spot on player figure only when correct */
      point: result.ok ? (result.point || result.trueC) : null,
      trueC: result.trueC,
    };
    if (result.ok) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      clearCrystal();
    } else {
      onMiss();
      showFinishBar(false);
    }
    updateHud();
    draw();
    drawSolution();
  }

  function skipLevel() {
    var c = trueCentre(state.mode, state.verts);
    state.reveal = { ok: false, point: null, trueC: c, skipped: true };
    state.stars = 0;
    state.running = false;
    clearTimers();
    updateHud();
    draw();
    drawSolution();
    showFinishBar(false);
  }

  var SIDE_EXT_BEYOND = 16; /* must drag this far past the cut */
  var SIDE_EXT_OVERSHOOT = 12;

  function isObtuseTri(v) {
    var i;
    for (i = 0; i < 3; i++) {
      var V = v[i];
      var P = v[(i + 1) % 3];
      var Q = v[(i + 2) % 3];
      if (dot(unit(V, P), unit(V, Q)) < -0.02) return true;
    }
    return false;
  }

  function orient2(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function pointInTri(p, v) {
    var b0 = orient2(v[0], v[1], p);
    var b1 = orient2(v[1], v[2], p);
    var b2 = orient2(v[2], v[0], p);
    var neg = b0 < 0 || b1 < 0 || b2 < 0;
    var pos = b0 > 0 || b1 > 0 || b2 > 0;
    return !(neg && pos);
  }

  function tryExtendSide(start, end, A, B, v) {
    var hit = intersectLines(start, end, A, B);
    if (!hit) return null;
    if (hit.t < 0.05) return null;
    if (hit.u >= -0.02 && hit.u <= 1.02) return null;
    if (pointInTri(end, v)) return null;
    var lenSE = dist(start, end);
    var lenSH = dist(start, hit);
    if (lenSE < lenSH + SIDE_EXT_BEYOND) return null;
    var nearer = hit.u < 0 ? A : B;
    var dir = unit(nearer, hit);
    return { a: nearer, b: add(hit, dir, SIDE_EXT_OVERSHOOT) };
  }

  /**
   * Finite side extension when obtuse + drag past triangle cuts a side's
   * linear extension: vertex → opposite side; mid-point → that mid-point's side
   * (or another side the ray cuts on an extension).
   */
  function oppositeSideExtension(start, end, from) {
    var v = state.verts;
    if (!v || !from) return null;
    if (!isObtuseTri(v)) return null;

    if (from.kind === "vertex") {
      if (dist(start, v[from.index]) > 16) return null;
      return tryExtendSide(
        start, end,
        v[(from.index + 1) % 3],
        v[(from.index + 2) % 3],
        v
      );
    }

    if (from.kind === "side") {
      var A0 = v[from.index];
      var B0 = v[(from.index + 1) % 3];
      if (dist(start, mid(A0, B0)) > 16) return null;
      /* prefer extending the side that owns this mid-point */
      var own = tryExtendSide(start, end, A0, B0, v);
      if (own) return own;
      var si;
      for (si = 0; si < 3; si++) {
        if (si === from.index) continue;
        var ext = tryExtendSide(start, end, v[si], v[(si + 1) % 3], v);
        if (ext) return ext;
      }
    }
    return null;
  }

  function appendOppositeSideExtension(svg, start, end, from) {
    var ext = oppositeSideExtension(start, end, from);
    if (!ext) return;
    svg.appendChild(E("line", {
      x1: ext.a.x, y1: ext.a.y, x2: ext.b.x, y2: ext.b.y,
      stroke: "#64748b", "stroke-width": 1.7, "stroke-dasharray": "3 3.5",
      "stroke-linecap": "round",
    }));
  }

  function correctSpecialLines(mode, v) {
    var c = trueCentre(mode, v);
    var lines = [];
    var i;
    if (!c) return lines;
    if (mode === "median") {
      for (i = 0; i < 3; i++) {
        var mpt = mid(v[(i + 1) % 3], v[(i + 2) % 3]);
        lines.push({
          a: v[i],
          b: add(v[i], unit(v[i], mpt), dist(v[i], mpt) + 12),
        });
      }
    } else if (mode === "altitude") {
      for (i = 0; i < 3; i++) {
        var f = foot(v[i], v[(i + 1) % 3], v[(i + 2) % 3]);
        var len = Math.max(dist(v[i], f), dist(v[i], c)) + 22;
        lines.push({ a: v[i], b: add(v[i], unit(v[i], f), len) });
      }
    } else if (mode === "bisector") {
      for (i = 0; i < 3; i++) {
        lines.push({
          a: v[i],
          b: add(v[i], unit(v[i], c), dist(v[i], c) + 28),
        });
      }
    } else {
      for (i = 0; i < 3; i++) {
        var M = mid(v[i], v[(i + 1) % 3]);
        var u = unit(M, c);
        var d = dist(M, c);
        lines.push({ a: add(M, u, -18), b: add(M, u, d + 28) });
      }
    }
    return lines;
  }

  function drawSolution() {
    if (!els.solution || !els.svgSol) return;
    /* wrong Check or Skip — never when correct */
    var showSol = !!(state.reveal && state.reveal.ok === false);
    els.solution.classList.toggle("hidden", !showSol);
    if (!showSol) {
      while (els.svgSol.firstChild) els.svgSol.removeChild(els.svgSol.firstChild);
      return;
    }
    var meta = MODE_META[state.mode];
    els.solutionLabel.textContent = "Correct · " + meta.line + " → " + meta.centre;
    var svg = els.svgSol;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = E("defs", {});
    var grad = E("linearGradient", { id: "mpSolGrad", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(E("stop", { offset: "0%", "stop-color": "#f8fafc" }));
    grad.appendChild(E("stop", { offset: "100%", "stop-color": "#e0e7ff" }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(E("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#mpSolGrad)" }));
    var v = state.verts;
    svg.appendChild(E("polygon", {
      points: v.map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "rgba(255,255,255,.92)", stroke: INK, "stroke-width": 2.2,
    }));
    var solLines = correctSpecialLines(state.mode, v);
    var solSegs = solLines.map(function (L) { return [L.a, L.b]; });
    solLines.forEach(function (L, i) {
      if (state.mode === "altitude") {
        appendOppositeSideExtension(svg, L.a, L.b, { kind: "vertex", index: i });
      }
      if (state.mode === "perp") {
        appendOriginPerpMark(svg, L.a, L.b, { kind: "side", index: i });
      }
      svg.appendChild(E("line", {
        x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y,
        stroke: DASH, "stroke-width": 2.2, "stroke-dasharray": "7 4", "stroke-linecap": "round",
      }));
    });
    appendCentreSpot(
      svg,
      state.reveal.trueC || trueCentre(state.mode, v),
      state.mode,
      solSegs
    );
    var i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(E("circle", {
        cx: v[i].x, cy: v[i].y, r: 4.5,
        fill: HANDLE, stroke: "none",
      }));
      svg.appendChild(labelOutside(v[i], LABELS[i]));
    }
  }

  function onMiss() {
    state.misses += 1;
    state.combo = 0;
    state.energy = Math.max(0, state.energy - ENERGY_MISS);
    pulse("bad");
    updateHud();
    if (state.energy <= 0) failLevel("Out of energy — redraw more carefully.");
  }

  function rightAngleMark(corner, alongA, alongB) {
    var s = 9;
    var ua = unit(corner, alongA);
    var ub = unit(corner, alongB);
    if (Math.abs(dot(ua, ub)) > 0.97) {
      ub = { x: -ua.y, y: ua.x };
    }
    /* build square in the quadrant of ub relative to ua */
    var p1 = add(corner, ua, s);
    var p3 = add(corner, ub, s);
    var p2 = { x: corner.x + ua.x * s + ub.x * s, y: corner.y + ua.y * s + ub.y * s };
    return E("polyline", {
      points: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y].join(" "),
      fill: "none", stroke: MARK, "stroke-width": 1.8,
    });
  }

  function appendOriginPerpMark(svg, a, b, from) {
    if (!from || !state.verts || from.kind !== "side") return;
    var S0 = state.verts[from.index];
    var S1 = state.verts[(from.index + 1) % 3];
    if (!isPerp(sub(b, a), sub(S1, S0))) return;
    var M = mid(S0, S1);
    if (dist(M, foot(M, a, b)) > 6) return;
    var alongLine = dist(a, M) <= dist(b, M) ? b : a;
    svg.appendChild(rightAngleMark(M, alongLine, S1));
  }

  function shortArcPath(V, P, Q, r) {
    var u1 = unit(V, P);
    var u2 = unit(V, Q);
    var a1 = Math.atan2(u1.y, u1.x);
    var a2 = Math.atan2(u2.y, u2.x);
    var d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    var p1 = { x: V.x + Math.cos(a1) * r, y: V.y + Math.sin(a1) * r };
    var p2 = { x: V.x + Math.cos(a1 + d) * r, y: V.y + Math.sin(a1 + d) * r };
    return "M " + p1.x + " " + p1.y + " A " + r + " " + r + " 0 0 " + (d > 0 ? 1 : 0) + " " + p2.x + " " + p2.y;
  }

  function equalAngleArc(V, P, Q, r) {
    return E("path", {
      d: shortArcPath(V, P, Q, r),
      fill: "none", stroke: MARK, "stroke-width": 1.7, "stroke-linecap": "round",
    });
  }

  function bisectorHitForSegment(a, b) {
    var v = state.verts;
    var i;
    for (i = 0; i < 3; i++) {
      var V = v[i];
      var P = v[(i + 1) % 3];
      var Q = v[(i + 2) % 3];
      var start = null;
      var end = null;
      if (dist(a, V) < 14) { start = a; end = b; }
      else if (dist(b, V) < 14) { start = b; end = a; }
      if (!start) continue;
      var dir = unit(start, end);
      var uP = unit(V, P);
      var uQ = unit(V, Q);
      var bx = uP.x + uQ.x;
      var by = uP.y + uQ.y;
      var bl = Math.hypot(bx, by) || 1;
      var bis = { x: bx / bl, y: by / bl };
      if (dot(dir, bis) < BISECTOR_COS) continue;
      var I = add(V, bis, 36);
      return { V: V, P: P, Q: Q, I: I };
    }
    return null;
  }

  function appendBisectorMarks(svg, a, b) {
    var hit = bisectorHitForSegment(a, b);
    if (!hit) return;
    svg.appendChild(equalAngleArc(hit.V, hit.P, hit.I, 14));
    svg.appendChild(equalAngleArc(hit.V, hit.I, hit.Q, 18.5));
  }

  function sideTickCounts(v) {
    /* sides 0=AB, 1=BC, 2=CA — equal lengths share a mark; distinct lengths get 1,2,3 */
    var lens = [dist(v[0], v[1]), dist(v[1], v[2]), dist(v[2], v[0])];
    var order = [0, 1, 2].sort(function (i, j) { return lens[i] - lens[j]; });
    var counts = [1, 1, 1];
    counts[order[0]] = 1;
    var rank = 1;
    var i;
    for (i = 1; i < 3; i++) {
      if (Math.abs(lens[order[i]] - lens[order[i - 1]]) <= SIDE_EQ) {
        counts[order[i]] = counts[order[i - 1]];
      } else {
        rank += 1;
        counts[order[i]] = rank;
      }
    }
    return counts;
  }

  function hashHalf(p, q, count) {
    var g = E("g", {});
    var u = unit(p, q);
    var n = { x: -u.y, y: u.x };
    var c = mid(p, q);
    var nTicks = Math.max(1, count || 1);
    var gap = 3.4;
    var start = -((nTicks - 1) * gap) / 2;
    var k;
    for (k = 0; k < nTicks; k++) {
      var cx = c.x + u.x * (start + k * gap);
      var cy = c.y + u.y * (start + k * gap);
      g.appendChild(E("line", {
        x1: cx - n.x * 5, y1: cy - n.y * 5,
        x2: cx + n.x * 5, y2: cy + n.y * 5,
        stroke: TICK, "stroke-width": 2.4, "stroke-linecap": "round",
        "stroke-opacity": "1",
      }));
    }
    return g;
  }

  function labelOutside(P, t) {
    var g = centroid(state.verts);
    var dx = P.x - g.x;
    var dy = P.y - g.y;
    var d = Math.hypot(dx, dy) || 1;
    var x = P.x + (dx / d) * 14;
    var y = P.y + (dy / d) * 14;
    var el = E("text", {
      x: x, y: y, "text-anchor": "middle", "dominant-baseline": "middle",
      fill: INK, "font-size": "12", "font-weight": "800",
    });
    el.textContent = t;
    return el;
  }

  function draw() {
    var svg = els.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = E("defs", {});
    var grad = E("linearGradient", { id: "mpGrad", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(E("stop", { offset: "0%", "stop-color": "#eef6fc" }));
    grad.appendChild(E("stop", { offset: "100%", "stop-color": "#dbeafe" }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(E("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#mpGrad)" }));

    var v = state.verts;
    if (!v) return;

    svg.appendChild(E("polygon", {
      points: v.map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "rgba(255,255,255,.35)", stroke: INK, "stroke-width": 2.2,
    }));

    /* ticks above fill so they stay vivid */
    var tickCounts = sideTickCounts(v);
    var s;
    for (s = 0; s < 3; s++) {
      var a = v[s];
      var b = v[(s + 1) % 3];
      var m = mid(a, b);
      var tc = tickCounts[s];
      svg.appendChild(hashHalf(a, m, tc));
      svg.appendChild(hashHalf(m, b, tc));
    }

    /* conditional opposite-side extensions (obtuse + vertex drag past cut) */
    state.lines.forEach(function (L) {
      appendOppositeSideExtension(svg, L.a, L.b, L.from);
    });
    if (state.drag && state.pointer) {
      appendOppositeSideExtension(
        svg,
        handlePoint(state.drag.kind, state.drag.index),
        state.pointer,
        state.drag
      );
    }

    /* player lines: only the segment dragged (start → release) */
    state.lines.forEach(function (L, i) {
      var col = i === state.hoverLine ? HOT : DASH;
      svg.appendChild(E("line", {
        x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y,
        stroke: col, "stroke-width": i === state.hoverLine ? 3.2 : 2.2,
        "stroke-dasharray": "7 4", "stroke-linecap": "round",
        class: "mp-line", "data-line": String(i),
      }));
      appendOriginPerpMark(svg, L.a, L.b, L.from);
      perpHitsForSegment(L.a, L.b).forEach(function (hit) {
        svg.appendChild(rightAngleMark(hit, hit.alongLine, hit.alongSide));
      });
      appendBisectorMarks(svg, L.a, L.b);
    });

    /* drag ghost: start → pointer only */
    if (state.drag && state.pointer) {
      var start = handlePoint(state.drag.kind, state.drag.index);
      svg.appendChild(E("line", {
        x1: start.x, y1: start.y, x2: state.pointer.x, y2: state.pointer.y,
        stroke: "#64748b", "stroke-width": 2.2, "stroke-dasharray": "6 4", "stroke-linecap": "round",
      }));
      appendOriginPerpMark(svg, start, state.pointer, state.drag);
      perpHitsForSegment(start, state.pointer).forEach(function (hit) {
        svg.appendChild(rightAngleMark(hit, hit.alongLine, hit.alongSide));
      });
      appendBisectorMarks(svg, start, state.pointer);
    }

    /* centre spot on player figure only after a correct Check */
    if (state.reveal && state.reveal.ok && state.reveal.point) {
      appendCentreSpot(svg, state.reveal.point, state.mode);
    }

    var i, m;
    for (i = 0; i < 3; i++) {
      svg.appendChild(E("circle", {
        cx: v[i].x, cy: v[i].y, r: 4.5,
        fill: HANDLE, stroke: "none",
        style: "cursor:crosshair",
      }));
      svg.appendChild(labelOutside(v[i], LABELS[i]));
    }
    for (i = 0; i < 3; i++) {
      m = mid(v[i], v[(i + 1) % 3]);
      svg.appendChild(E("circle", {
        cx: m.x, cy: m.y, r: 3.8,
        fill: HANDLE, stroke: "none",
        style: "cursor:crosshair",
      }));
    }
  }

  function bindPointer() {
    var svg = els.svg;
    var lastTap = 0;

    function down(evt) {
      if (!state.running || state.overlay !== "play") return;
      var p = svgPoint(evt);
      state.pointer = p;
      var now = Date.now();
      var h = nearestHandle(p, 12);
      var hi = nearestLine(p, HIT);
      /* double-click delete only when not on a handle */
      if (!h && hi >= 0 && now - lastTap < 320) {
        state.lines.splice(hi, 1);
        state.reveal = null;
        state.hoverLine = -1;
        state.crystalLit = false;
        updateHud();
        draw();
        drawSolution();
        lastTap = 0;
        evt.preventDefault();
        return;
      }
      lastTap = now;

      if (h) {
        state.drag = h;
        state.reveal = null;
        drawSolution();
        evt.preventDefault();
        draw();
      }
    }

    function move(evt) {
      var p = svgPoint(evt);
      state.pointer = p;
      if (state.drag) {
        draw();
        return;
      }
      if (!state.running || state.overlay !== "play") return;
      var hi = nearestLine(p, HIT);
      if (hi !== state.hoverLine) {
        state.hoverLine = hi;
        draw();
      }
    }

    function up(evt) {
      if (!state.drag) return;
      var drag = state.drag;
      state.drag = null;
      var p = svgPoint(evt);
      var start = handlePoint(drag.kind, drag.index);
      if (dist(start, p) < 18) {
        draw();
        return;
      }
      state.lines.push({
        a: { x: start.x, y: start.y },
        b: { x: p.x, y: p.y },
        from: { kind: drag.kind, index: drag.index },
      });
      state.reveal = null;
      updateHud();
      draw();
      drawSolution();
    }

    svg.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function wireUi() {
    els.startBtn.addEventListener("click", function () { startLevel(0); });
    els.retryBtn.addEventListener("click", function () { startLevel(state.levelIdx); });
    els.retryFailBtn.addEventListener("click", function () { startLevel(state.levelIdx); });
    els.nextBtn.addEventListener("click", function () {
      if (state.levelIdx >= LEVELS.length - 1) startLevel(0);
      else startLevel(state.levelIdx + 1);
    });
    els.menuBtn.addEventListener("click", function () {
      clearTimers();
      hideClearBar();
      state.running = false;
      state.overlay = "title";
      state.mode = "median";
      applyVerts(SHAPES.acute, "median");
      state.lines = [];
      state.reveal = null;
      draw();
      drawSolution();
      updateHud();
      showOverlay("title");
    });
    if (els.checkBtn) {
      els.checkBtn.addEventListener("click", function () { checkAnswer(); });
    }
    els.skipBtn.addEventListener("click", function () {
      if (state.overlay === "clear") {
        if (state.levelIdx < LEVELS.length - 1) startLevel(state.levelIdx + 1);
        else startLevel(0);
        return;
      }
      skipLevel();
    });
  }

  function cacheEls() {
    els.root = document.getElementById("mp-root");
    els.svg = document.getElementById("mp-svg");
    els.tip = document.getElementById("mp-tip");
    els.crystalName = document.getElementById("mp-crystal-name");
    els.lineName = document.getElementById("mp-line-name");
    els.levelNum = document.getElementById("mp-level");
    els.actLabel = document.getElementById("mp-act");
    els.energyFill = document.getElementById("mp-energy-fill");
    els.combo = document.getElementById("mp-combo");
    els.crystals = document.getElementById("mp-crystals");
    els.lockedCount = document.getElementById("mp-locked");
    els.timerRow = document.getElementById("mp-timers");
    els.timerSwitch = document.getElementById("mp-timer-switch");
    els.timerLevel = document.getElementById("mp-timer-level");
    els.overlayTitle = document.getElementById("mp-overlay-title");
    els.overlayFail = document.getElementById("mp-overlay-fail");
    els.startBtn = document.getElementById("mp-start");
    els.retryBtn = document.getElementById("mp-retry");
    els.retryFailBtn = document.getElementById("mp-retry-fail");
    els.nextBtn = document.getElementById("mp-next");
    els.menuBtn = document.getElementById("mp-menu");
    els.skipBtn = document.getElementById("mp-skip");
    els.checkBtn = document.getElementById("mp-check");
    els.solution = document.getElementById("mp-solution");
    els.solutionLabel = document.getElementById("mp-solution-label");
    els.svgSol = document.getElementById("mp-svg-sol");
    els.clearBar = document.getElementById("mp-clear-bar");
    els.clearStars = document.getElementById("mp-clear-stars");
    els.clearTitle = document.getElementById("mp-clear-title");
    els.clearMsg = document.getElementById("mp-clear-msg");
    els.failMsg = document.getElementById("mp-fail-msg");
  }

  function activate() {
    if (!els.root) return;
    if (state.overlay === "play" && state.running) {
      draw();
      updateHud();
      return;
    }
    if (state.overlay === "clear") {
      showOverlay("play");
      if (els.clearBar) els.clearBar.classList.remove("hidden");
    } else if (state.overlay === "fail") {
      showOverlay("fail");
    } else if (state.overlay !== "play") {
      showOverlay("title");
    }
    draw();
    updateHud();
  }

  function deactivate() {
    clearTimers();
    state.running = false;
  }

  function init() {
    if (!document.getElementById("mp-root")) return;
    cacheEls();
    if (els.svg) {
      els.svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    }
    if (els.svgSol) {
      els.svgSol.setAttribute("viewBox", "0 0 " + W + " " + H);
    }
    bindPointer();
    wireUi();
    state.mode = "median";
    applyVerts(SHAPES.acute, "median");
    draw();
    drawSolution();
    updateHud();
    showOverlay("title");
    window.JM28MeetingPoint = { activate: activate, deactivate: deactivate };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
