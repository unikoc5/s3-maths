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
  var PERP_COS = 0.03; /* |cos| for showing ⊥ — only when truly ~90° */
  var CENTRE_TOL = 5.5; /* answer check — looser freehand OK */
  var CLUSTER_TOL = 6;
  var DIR_MATCH = 0.965; /* ~15° of true special line — forgiving */
  var SIDE_EQ_FRAC = 0.06; /* relative — equal sides share tick count */
  var SIDE_EQ_MIN = 14; /* px floor after fitToView */
  var BISECTOR_COS = 0.9985; /* equal-angle arcs — ~3° of true bisector */
  var VERTEX_SKIP = 14; /* no ⊥ mark sitting on a corner (A/B/C) */
  var HANDLE = "#0284c7";
  var DELETE_HINT = "Delete a line (hover + double-click) to remove it.";
  var LIVES_MAX = 3;
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
      how: "three medians (each vertex to the mid-point of the opposite side)",
      tip: "Draw three medians (vertex → mid-point of the opposite side). Release freely — find where they meet.",
    },
    altitude: {
      centre: "Orthocentre",
      line: "altitudes",
      how: "three altitudes (from each vertex perpendicular to the opposite side)",
      tip: "Draw three altitudes (vertex ⊥ opposite side).",
    },
    bisector: {
      centre: "In-centre",
      line: "angle bisectors",
      how: "three angle bisectors (splitting each vertex angle in half)",
      tip: "Draw three angle bisectors from the vertices. They meet at a point inside the triangle.",
    },
    perp: {
      centre: "Circumcentre",
      line: "perpendicular bisectors",
      how: "three perpendicular bisectors (through each side’s mid-point at right angles)",
      tip: "Draw three perpendicular bisectors from the side mid-points. Acute → inside; right → on a side; obtuse → outside.",
    },
  };
  var HARD_TIP = "Find the target centre. Draw the three special lines that meet there — no other hints.";

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
    /* true equilateral — all sides equal → same tick count */
    equilateral: [
      { x: 80, y: 250 },
      { x: 320, y: 250 },
      { x: 200, y: 250 - Math.sqrt(3) * 120 },
    ],
    scalene: [
      { x: 55, y: 205 },
      { x: 335, y: 245 },
      { x: 165, y: 42 },
    ],
  };

  /* Pool of unique mode+shape levels; each run shuffles and takes 10 */
  var LEVEL_BANK = [
    { act: 1, mode: "median", shape: "scalene", title: "Medians → Centroid" },
    { act: 1, mode: "altitude", shape: "obtuse", title: "Altitudes → Orthocentre (obtuse)" },
    { act: 1, mode: "bisector", shape: "equilateral", title: "Bisectors → In-centre" },
    { act: 1, mode: "perp", shape: "obtuse2", title: "Perp. bisectors (obtuse)" },
    { act: 2, mode: "median", shape: "right", title: "Medians (right-angled)" },
    { act: 2, mode: "altitude", shape: "acute2", title: "Altitudes (acute)" },
    { act: 2, mode: "perp", shape: "right2", title: "Circumcentre on the hypotenuse" },
    { act: 2, mode: "bisector", shape: "obtuse3", title: "In-centre (obtuse)" },
    { act: 3, mode: "altitude", shape: "isosceles", title: "Altitudes (isosceles)" },
    { act: 3, mode: "perp", shape: "acute", title: "Circumcentre (acute)" },
    { act: 3, mode: "median", shape: "isosceles2", title: "Medians (isosceles)" },
    { act: 3, mode: "bisector", shape: "acute", title: "In-centre (acute)" },
    { act: 3, mode: "altitude", shape: "right", title: "Orthocentre (right-angled)" },
    { act: 3, mode: "perp", shape: "scalene", title: "Circumcentre (scalene)" },
    { act: 3, mode: "median", shape: "equilateral", title: "Medians (equilateral)" },
    { act: 3, mode: "altitude", shape: "obtuse3", title: "Orthocentre (obtuse again)" },
  ];
  var LEVELS = LEVEL_BANK.slice(0, 10);

  var ALL_MODES = ["median", "altitude", "bisector", "perp"];
  var ENCOURAGE_OK = [
    "I'm proud of how carefully you drew that — your meeting point shines. Let's keep walking this path together.",
    "That was lovely work. You're really listening to the triangle; I'm right here cheering you on for the next one.",
    "Yes — you found it with such calm focus. Hold onto that feeling; the next centre is waiting for you.",
    "Beautifully done. Every clear centre you find makes the next one kinder. Shall we try another?",
    "Well spotted, and so patiently drawn. I'm glad you're here learning this — keep going at your pace.",
  ];

  var state = {
    levelIdx: 0,
    rawVerts: null,
    verts: null,
    mode: "median",
    lines: [], /* { a, b, from: {kind,index} } */
    lives: LIVES_MAX,
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
    tickTimer: null,
    gameOver: false,
    drag: null,
    hoverLine: -1,
    pointer: null,
    running: false,
    stars: 0,
    totalStars: 0,
    overlay: "title",
    retryMode: null, /* adaptive: failed centre → next question */
    finishMsg: "", /* coach message under the clear title */
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

  function triangleArea(v) {
    return Math.abs(
      (v[0].x * (v[1].y - v[2].y) + v[1].x * (v[2].y - v[0].y) + v[2].x * (v[0].y - v[1].y)) / 2
    );
  }

  /** Inradius r = Area / s — reliable tangency to all three sides. */
  function inradiusOf(v) {
    var a = dist(v[1], v[2]);
    var b = dist(v[0], v[2]);
    var c = dist(v[0], v[1]);
    var s = (a + b + c) / 2;
    if (s < 1e-6) return 0;
    return triangleArea(v) / s;
  }

  function fitToView(verts, mode) {
    var src = cloneVerts(verts);
    var c0 = trueCentre(mode, src);
    var pts = src.slice();
    if (c0) pts.push(c0);
    var i;
    for (i = 0; i < 3; i++) pts.push(mid(src[i], src[(i + 1) % 3]));
    /* leave room for circumcircle / incircle so answer-key circles stay on-canvas */
    if (c0 && mode === "perp") {
      var R = dist(c0, src[0]);
      pts.push(
        { x: c0.x + R, y: c0.y },
        { x: c0.x - R, y: c0.y },
        { x: c0.x, y: c0.y + R },
        { x: c0.x, y: c0.y - R }
      );
    }
    if (c0 && mode === "bisector") {
      var rIn = inradiusOf(src);
      pts.push(
        { x: c0.x + rIn, y: c0.y },
        { x: c0.x - rIn, y: c0.y },
        { x: c0.x, y: c0.y + rIn },
        { x: c0.x, y: c0.y - rIn }
      );
    }
    /* obtuse altitudes: include exterior feet so side extensions stay on-canvas */
    if (mode === "altitude") {
      for (i = 0; i < 3; i++) {
        pts.push(foot(src[i], src[(i + 1) % 3], src[(i + 2) % 3]));
      }
    }
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

  /** Last 3 levels of a run — no line-type hints */
  function isHardLevel() {
    return state.levelIdx >= LEVELS.length - 3;
  }

  function rightAngleVertex(v) {
    var i;
    for (i = 0; i < 3; i++) {
      var V = v[i];
      var P = v[(i + 1) % 3];
      var Q = v[(i + 2) % 3];
      if (Math.abs(dot(unit(V, P), unit(V, Q))) < PERP_COS) return i;
    }
    return -1;
  }

  function appendTriangleRightAngle(svg, v) {
    var ri = rightAngleVertex(v);
    if (ri < 0) return;
    var V = v[ri];
    var P = v[(ri + 1) % 3];
    var Q = v[(ri + 2) % 3];
    svg.appendChild(rightAngleMark(V, P, Q));
  }

  function shuffleArr(arr) {
    var i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Build 10 levels so every centre (G/H/I/O) appears at least once. */
  function shuffleLevels() {
    var byMode = { median: [], altitude: [], bisector: [], perp: [] };
    LEVEL_BANK.forEach(function (lv) {
      if (byMode[lv.mode]) byMode[lv.mode].push(lv);
    });
    ALL_MODES.forEach(function (m) { shuffleArr(byMode[m]); });
    var picked = [];
    var seen = {};
    /* seed: one of each centre */
    ALL_MODES.forEach(function (m) {
      var lv = byMode[m].shift();
      if (!lv) return;
      seen[lv.mode + "|" + lv.shape] = true;
      picked.push(lv);
    });
    var rest = [];
    ALL_MODES.forEach(function (m) {
      byMode[m].forEach(function (lv) { rest.push(lv); });
    });
    shuffleArr(rest);
    var i;
    for (i = 0; i < rest.length && picked.length < 10; i++) {
      var key = rest[i].mode + "|" + rest[i].shape;
      if (seen[key]) continue;
      seen[key] = true;
      picked.push(rest[i]);
    }
    shuffleArr(picked);
    LEVELS = picked.slice(0, 10);
  }

  function pickBankLevel(mode, avoidShape) {
    var pool = LEVEL_BANK.filter(function (lv) {
      return lv.mode === mode && lv.shape !== avoidShape;
    });
    if (!pool.length) {
      pool = LEVEL_BANK.filter(function (lv) { return lv.mode === mode; });
    }
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** After a miss: bring that centre forward as the next question (adaptive). */
  function bringModeToNext(mode) {
    if (!mode) return;
    var next = state.levelIdx + 1;
    if (next >= LEVELS.length) return;
    var i;
    for (i = next; i < LEVELS.length; i++) {
      if (LEVELS[i].mode === mode) {
        if (i !== next) {
          var tmp = LEVELS[next];
          LEVELS[next] = LEVELS[i];
          LEVELS[i] = tmp;
        }
        return;
      }
    }
    /* no future level with this mode — replace next from bank, then repair coverage */
    var avoid = levelDef() ? levelDef().shape : null;
    var repl = pickBankLevel(mode, avoid);
    if (repl) LEVELS[next] = repl;
    repairModeCoverage();
  }

  function repairModeCoverage() {
    var counts = { median: 0, altitude: 0, bisector: 0, perp: 0 };
    LEVELS.forEach(function (lv) { counts[lv.mode] += 1; });
    ALL_MODES.forEach(function (m) {
      if (counts[m] > 0) return;
      var donor = -1;
      var i;
      for (i = Math.max(0, state.levelIdx + 1); i < LEVELS.length; i++) {
        if (counts[LEVELS[i].mode] > 1) {
          donor = i;
          break;
        }
      }
      if (donor < 0) return;
      var pick = pickBankLevel(m, null);
      if (!pick) return;
      counts[LEVELS[donor].mode] -= 1;
      LEVELS[donor] = pick;
      counts[m] += 1;
    });
  }

  /**
   * After a correct answer: prefer a different centre next so the run feels fresh
   * (still random among remaining non-matching modes).
   */
  function preferFreshNextMode() {
    var next = state.levelIdx + 1;
    if (next >= LEVELS.length) return;
    var cur = state.mode;
    if (LEVELS[next].mode !== cur) return;
    var candidates = [];
    var i;
    for (i = next + 1; i < LEVELS.length; i++) {
      if (LEVELS[i].mode !== cur) candidates.push(i);
    }
    if (!candidates.length) return;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    var tmp = LEVELS[next];
    LEVELS[next] = LEVELS[pick];
    LEVELS[pick] = tmp;
  }

  function advanceToNextLevel() {
    if (state.retryMode) {
      bringModeToNext(state.retryMode);
      state.retryMode = null;
    } else {
      preferFreshNextMode();
    }
    startLevel(state.levelIdx + 1);
  }

  function pickShape(lv) {
    return lv.shape || "acute";
  }

  function clearTimers() {
    if (state.switchTimer) { clearInterval(state.switchTimer); state.switchTimer = null; }
    if (state.levelTimer) { clearInterval(state.levelTimer); state.levelTimer = null; }
    if (state.tickTimer) { clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  function updateLevelClock() {
    if (!els.timerVal) return;
    var sec = 0;
    if (state.startedAt) {
      sec = Math.min(999, Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000)));
    }
    els.timerVal.textContent = sec + "s";
  }

  function startLevelClock() {
    if (state.tickTimer) clearInterval(state.tickTimer);
    updateLevelClock();
    state.tickTimer = setInterval(function () {
      if (!state.running) return;
      updateLevelClock();
    }, 250);
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

  /** Full mission reset (lives, stars, combo, level) — used after Game over / Start. */
  function resetRunState() {
    state.combo = 0;
    state.maxCombo = 0;
    state.totalStars = 0;
    state.stars = 0;
    state.lives = LIVES_MAX;
    state.gameOver = false;
    state.crystalsDone = 0;
    state.misses = 0;
    state.crystalLit = false;
    state.levelIdx = 0;
    state.retryMode = null;
    state.finishMsg = "";
  }

  function startLevel(idx) {
    clearTimers();
    hideClearBar();
    /* fresh run only — keep combo when advancing to the next level */
    if (idx === 0) {
      shuffleLevels();
      resetRunState();
    }
    state.levelIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
    var lv = levelDef();
    var shape = pickShape(lv);
    var mode0 = lv.mode || "median";
    state.mode = mode0;
    applyVerts(SHAPES[shape] || SHAPES.acute, mode0);
    state.misses = 0;
    state.crystalLit = false;
    state.gameOver = false;
    state.startedAt = Date.now();
    state.overlay = "play";
    state.running = true;
    state.drag = null;
    state.reveal = null;
    state.lines = [];
    state.hoverLine = -1;
    showOverlay("play");
    startLevelClock();
    updateLivesBar(false);
    updateHud();
    draw();
    drawSolution();
  }

  function restartMission() {
    resetRunState();
    startLevel(0);
  }

  function updateTimers() {
    if (!els.timerRow) return;
    els.timerRow.classList.add("hidden");
  }

  function starsForClear() {
    /* time only: 3★ ≤30s · 2★ ≤45s · 1★ >45s */
    var elapsed = (Date.now() - state.startedAt) / 1000;
    if (elapsed <= 30) return 3;
    if (elapsed <= 45) return 2;
    return 1;
  }

  function onLevelClear() {
    state.crystalLit = true;
    pulse("ok");
    state.stars = starsForClear();
    state.totalStars = Math.min(30, (state.totalStars || 0) + state.stars);
    updateHud();
    state.running = false;
    clearTimers();
    showFinishBar(true, { msg: state.finishMsg || pickEncourageOk() });
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

  function vertexLabelPos(P) {
    var g = centroid(state.verts);
    var dx = P.x - g.x;
    var dy = P.y - g.y;
    var d = Math.hypot(dx, dy) || 1;
    return { x: P.x + (dx / d) * 14, y: P.y + (dy / d) * 14 };
  }

  function bestLabelOffset(c, segs) {
    var nearVert = false;
    var avoid = [];
    if (state.verts) {
      state.verts.forEach(function (P) {
        avoid.push(P);
        avoid.push(vertexLabelPos(P));
        if (dist(c, P) < 24) nearVert = true;
      });
    }
    var base = nearVert ? 28 : 16;
    var opts = [];
    var k;
    for (k = 0; k < 16; k++) {
      var ang = (k / 16) * Math.PI * 2;
      opts.push({ x: Math.cos(ang) * base, y: Math.sin(ang) * base });
      if (nearVert) opts.push({ x: Math.cos(ang) * (base + 12), y: Math.sin(ang) * (base + 12) });
    }
    var g = state.verts ? centroid(state.verts) : c;
    var rdx = c.x - g.x;
    var rdy = c.y - g.y;
    var rd = Math.hypot(rdx, rdy) || 1;
    if (nearVert) {
      /* H on a vertex: put H toward triangle interior; A/B/C stay exterior */
      opts.push({ x: -rdx / rd * (base + 8), y: -rdy / rd * (base + 8) });
      opts.push({ x: -rdy / rd * base, y: rdx / rd * base });
      opts.push({ x: rdy / rd * base, y: -rdx / rd * base });
    } else {
      opts.push({ x: (rdx / rd) * 18, y: (rdy / rd) * 18 });
    }
    var best = opts[0];
    var bestScore = -1e9;
    opts.forEach(function (off) {
      var p = { x: c.x + off.x, y: c.y + off.y };
      var minD = 1000;
      (segs || []).forEach(function (S) {
        minD = Math.min(minD, distPointToSeg(p, S[0], S[1]));
      });
      avoid.forEach(function (q) {
        minD = Math.min(minD, dist(p, q));
      });
      /* strongly prefer clear of A/B/C labels (≥16px) */
      var labelClear = 40;
      avoid.forEach(function (q) {
        labelClear = Math.min(labelClear, dist(p, q));
      });
      var score = minD + Math.hypot(off.x, off.y) * 0.04 + labelClear * 1.2;
      if (labelClear < 16) score -= 80;
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

  function pickEncourageOk() {
    if (state.combo >= 3) {
      return (
        "Combo ×" + state.combo +
        " — what steady care. I'm really proud of you; let's keep this warm streak going."
      );
    }
    return ENCOURAGE_OK[Math.floor(Math.random() * ENCOURAGE_OK.length)];
  }

  /**
   * Heartfelt + targeted teaching: which lines find the required centre,
   * vs what the drawing looks like — then soft encouragement.
   */
  function comfortWrongMsg(confusedMode) {
    var meta = MODE_META[state.mode];
    var need = meta ? meta.centre : "target centre";
    var needHow = meta ? meta.how : "the three special lines for that centre";
    if (confusedMode && MODE_META[confusedMode]) {
      var wrong = MODE_META[confusedMode];
      return (
        "I'm glad you tried — your drawing shows real care. To find the " + need +
        ", we actually use " + needHow +
        ", not " + wrong.how + " (those meet at the " + wrong.centre +
        "). Have a kind look at the answer key; mistakes like this are how the picture becomes clear, and I'll walk the next step with you."
      );
    }
    return (
      "This one didn't click yet, and that is perfectly human. Remember: the " + need +
      " grows from " + needHow +
      ". Softly check the key below — you're not alone in this, and every try is teaching your eye."
    );
  }

  function showFinishBar(ok, opts) {
    /* always show after Check / Skip — does not cover the figure */
    opts = opts || {};
    state.overlay = "clear";
    state.running = false;
    clearTimers();
    updateLevelClock();
    if (els.clearBar) els.clearBar.classList.remove("hidden");
    var stars = ok ? (state.stars || starsForClear()) : 0;
    state.stars = stars;
    els.clearStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    var meta = MODE_META[state.mode];
    var clearName = isHardLevel() ? meta.centre : levelDef().title;
    var lastQ = state.levelIdx >= LEVELS.length - 1;
    var gameOver = !!opts.gameOver || !!state.gameOver;
    var coach = opts.msg || state.finishMsg || "";
    if (gameOver) {
      els.clearTitle.textContent = "Game over";
      els.clearMsg.textContent = "Out of lives · Stars " + (state.totalStars || 0) + " / 30 · Jump to Centre Snap or replay";
      if (els.retryBtn) els.retryBtn.textContent = "Replay mission";
      if (els.nextBtn) els.nextBtn.textContent = "Next mission";
    } else {
      els.clearTitle.textContent = ok
        ? clearName + " · Cleared"
        : clearName + " · See solution";
      if (ok) {
        els.clearMsg.textContent = coach
          || (pickEncourageOk() + " · Lives " + state.lives + " / " + LIVES_MAX);
      } else {
        els.clearMsg.textContent = coach
          || (lastQ
            ? "Answer key below · Next mission or Replay mission"
            : "Answer key below · Next level or Replay");
      }
      if (els.retryBtn) els.retryBtn.textContent = lastQ ? "Replay mission" : "Replay";
      if (els.nextBtn) els.nextBtn.textContent = lastQ ? "Next mission" : "Next level";
    }
    showOverlay("play");
    updateHud();
  }

  function updateLivesBar(animate) {
    if (!els.energyFill) return;
    var pct = Math.max(0, Math.min(100, (state.lives / LIVES_MAX) * 100));
    els.energyFill.style.transition = animate
      ? "width .55s cubic-bezier(.22,.8,.2,1), background .2s ease"
      : "none";
    els.energyFill.style.width = pct + "%";
  }

  function loseLife() {
    if (state.lives <= 0) return false;
    state.lives -= 1;
    pulse("bad");
    if (els.root) {
      els.root.classList.remove("mp-flash-bad");
      void els.root.offsetWidth;
      els.root.classList.add("mp-flash-bad");
      setTimeout(function () { els.root.classList.remove("mp-flash-bad"); }, 520);
    }
    if (els.stageFlash) {
      els.stageFlash.classList.remove("mp-stage-flash-on");
      void els.stageFlash.offsetWidth;
      els.stageFlash.classList.add("mp-stage-flash-on");
      setTimeout(function () { els.stageFlash.classList.remove("mp-stage-flash-on"); }, 520);
    }
    updateLivesBar(true);
    updateHud();
    if (state.lives <= 0) {
      state.gameOver = true;
      return true;
    }
    return false;
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
    var hard = isHardLevel();
    els.levelNum.textContent = (state.levelIdx + 1) + " / " + LEVELS.length;
    els.actLabel.textContent =
      lv.act === 1 ? "Act 1 · Learn the four lines" :
      lv.act === 2 ? "Act 2 · Shape challenges" :
      "Act 3 · Mixed centres";
    updateLivesBar(false);
    updateLevelClock();
    if (els.starsTotal) els.starsTotal.textContent = (state.totalStars || 0) + " / 30";
    if (els.combo) els.combo.textContent = String(state.combo);
    els.lockedCount.textContent = String(state.lines.length);
    els.tip.textContent = (hard ? HARD_TIP : meta.tip) + " " + DELETE_HINT;
    els.crystalName.textContent = meta.centre;
    if (els.lineName) els.lineName.textContent = meta.line;
    if (els.drawPill) els.drawPill.classList.toggle("hidden", hard);
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

  function nearAnyVertex(p, tol) {
    if (!state.verts || !p) return false;
    var i;
    for (i = 0; i < 3; i++) {
      if (dist(p, state.verts[i]) < tol) return true;
    }
    return false;
  }

  /**
   * ⊥ only where the drawn segment actually cuts a triangle side (or extension).
   * Never for two player-lines crossing, never on corners, never in median/bisector mode.
   */
  function perpHitsForSegment(a, b) {
    var hits = [];
    if (!state.verts) return hits;
    /* only altitude / perp-bisector tasks show right-angle marks */
    if (state.mode !== "altitude" && state.mode !== "perp") return hits;
    var dir = sub(b, a);
    var i;
    for (i = 0; i < 3; i++) {
      var S0 = state.verts[i];
      var S1 = state.verts[(i + 1) % 3];
      var side = sub(S1, S0);
      if (!isPerp(dir, side)) continue;
      var hit = intersectLines(a, b, S0, S1);
      if (!hit) continue;
      /* drawn segment must reach the cut (really cut the side) */
      if (hit.t < -0.02 || hit.t > 1.02) continue;
      /* foot on side or its extension (obtuse altitudes) */
      if (hit.u < -2.8 || hit.u > 3.8) continue;
      if (nearAnyVertex(hit, VERTEX_SKIP)) continue;
      var alongLine = dist(hit, a) <= dist(hit, b) ? b : a;
      if (dist(hit, a) < 1.5) alongLine = b;
      if (dist(hit, b) < 1.5) alongLine = a;
      var alongSide = dist(hit, S0) <= dist(hit, S1) ? S1 : S0;
      hits.push({ x: hit.x, y: hit.y, alongLine: alongLine, alongSide: alongSide });
    }
    return hits;
  }

  /** At most one ⊥ mark per location. */
  function dedupePerpHits(hits) {
    var out = [];
    hits.forEach(function (h) {
      if (out.some(function (o) { return dist(o, h) < 10; })) return;
      out.push(h);
    });
    return out;
  }

  function collectPerpMarks(a, b, from) {
    if (state.mode !== "altitude" && state.mode !== "perp") return [];
    var hits = perpHitsForSegment(a, b).slice();
    /* perp-bisector from a mid-point: mark at that mid only if the line cuts there */
    if (state.mode === "perp" && from && from.kind === "side" && state.verts) {
      var S0 = state.verts[from.index];
      var S1 = state.verts[(from.index + 1) % 3];
      if (isPerp(sub(b, a), sub(S1, S0))) {
        var M = mid(S0, S1);
        var onSeg = dist(M, foot(M, a, b)) <= 4;
        var tHit = intersectLines(a, b, S0, S1);
        var cuts = tHit && tHit.t >= -0.02 && tHit.t <= 1.02;
        if (onSeg && cuts && !nearAnyVertex(M, VERTEX_SKIP)) {
          var alongLine = dist(a, M) <= dist(b, M) ? b : a;
          hits.push({ x: M.x, y: M.y, alongLine: alongLine, alongSide: S1 });
        }
      }
    }
    return dedupePerpHits(hits);
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

  function scoreModeMatch(mode, v, lines) {
    var c = trueCentre(mode, v);
    if (!c || !lines || lines.length < 1) return 0;
    var through = 0;
    lines.forEach(function (L) {
      if (dist(c, foot(c, L.a, L.b)) < CENTRE_TOL * 1.35) through += 1;
    });
    var special = correctSpecialLines(mode, v);
    var matched = 0;
    special.forEach(function (CL) {
      var cu = unit(CL.a, CL.b);
      var hit = lines.some(function (L) {
        if (Math.abs(dot(unit(L.a, L.b), cu)) < DIR_MATCH) return false;
        return dist(c, foot(c, L.a, L.b)) < CENTRE_TOL * 1.4;
      });
      if (hit) matched += 1;
    });
    return Math.max(through, matched);
  }

  /** If the drawing fits another centre better, return that mode id. */
  function detectConfusedMode() {
    var target = state.mode;
    var targetScore = scoreModeMatch(target, state.verts, state.lines);
    var best = null;
    var bestScore = 0;
    ALL_MODES.forEach(function (m) {
      if (m === target) return;
      var s = scoreModeMatch(m, state.verts, state.lines);
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    });
    if (best && bestScore >= 2 && bestScore > targetScore) return best;
    return null;
  }

  function evaluateLines() {
    var c = trueCentre(state.mode, state.verts);
    if (!c || state.lines.length < 3) {
      return { ok: false, point: null, trueC: c, confused: detectConfusedMode() };
    }
    /* looser: ≥3 player lines through the true centre is enough */
    var through = state.lines.filter(function (L) {
      return dist(c, foot(c, L.a, L.b)) < CENTRE_TOL;
    });
    if (through.length >= 3) return { ok: true, point: c, trueC: c, confused: null };
    /* fallback: match special-line directions with a soft angle tolerance */
    var correct = correctSpecialLines(state.mode, state.verts);
    if (correct.length < 3) {
      return { ok: false, point: null, trueC: c, confused: detectConfusedMode() };
    }
    var matched = 0;
    correct.forEach(function (CL) {
      var cu = unit(CL.a, CL.b);
      var okLine = state.lines.some(function (L) {
        var lu = unit(L.a, L.b);
        if (Math.abs(dot(lu, cu)) < DIR_MATCH) return false;
        return dist(c, foot(c, L.a, L.b)) < CENTRE_TOL * 1.25;
      });
      if (okLine) matched += 1;
    });
    if (matched >= 3) return { ok: true, point: c, trueC: c, confused: null };
    return { ok: false, point: null, trueC: c, confused: detectConfusedMode() };
  }

  function checkAnswer() {
    if (state.lines.length < 3 || state.reveal) return;
    var result = evaluateLines();
    state.reveal = {
      ok: !!result.ok,
      /* spot on player figure only when correct — never show answer key then */
      point: result.ok ? (result.point || result.trueC) : null,
      trueC: result.trueC,
    };
    if (result.ok) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.retryMode = null;
      state.finishMsg = pickEncourageOk();
      onLevelClear();
    } else {
      onMiss();
      state.retryMode = state.mode; /* adaptive: retest this centre next */
      state.finishMsg = comfortWrongMsg(result.confused);
      var dead = loseLife();
      draw();
      drawSolution();
      showFinishBar(false, { gameOver: dead, msg: state.finishMsg });
      return;
    }
    updateHud();
    draw();
    drawSolution(); /* hides when ok */
  }

  function skipLevel() {
    var c = trueCentre(state.mode, state.verts);
    state.reveal = { ok: false, point: null, trueC: c, skipped: true };
    state.stars = 0;
    state.combo = 0;
    state.retryMode = state.mode;
    var sm = MODE_META[state.mode];
    state.finishMsg = sm
      ? (
        "Skipping is okay — rest is part of learning. When you're ready, the " + sm.centre +
        " comes from " + sm.how +
        ". Glance at the key; we'll meet this centre again soon, gently."
      )
      : "Skipping is okay. Peek at the key — we'll practise this centre again soon.";
    var dead = loseLife();
    state.running = false;
    clearTimers();
    updateHud();
    draw();
    drawSolution();
    showFinishBar(false, { gameOver: dead, msg: state.finishMsg });
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

  /**
   * Answer-key / obtuse altitudes: if the foot lies outside the opposite side,
   * draw a grey dashed extension of that side out to (and slightly past) the foot
   * so the ⊥ mark sits on a visible line.
   */
  function appendAltitudeFootExtension(svg, v, vi) {
    var V = v[vi];
    var A = v[(vi + 1) % 3];
    var B = v[(vi + 2) % 3];
    var F = foot(V, A, B);
    if (F.t >= -0.02 && F.t <= 1.02) return;
    var nearer = F.t < 0 ? A : B;
    var beyond = add(F, unit(nearer, F), SIDE_EXT_OVERSHOOT);
    svg.appendChild(E("line", {
      x1: nearer.x, y1: nearer.y, x2: beyond.x, y2: beyond.y,
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
      /* span foot AND orthocentre — obtuse: H is opposite the foot from the vertex */
      for (i = 0; i < 3; i++) {
        var f = foot(v[i], v[(i + 1) % 3], v[(i + 2) % 3]);
        var uAlt = unit(v[i], f);
        var alongF = dist(v[i], f);
        var alongH = (c.x - v[i].x) * uAlt.x + (c.y - v[i].y) * uAlt.y;
        var tMin = Math.min(0, alongF, alongH) - 22;
        var tMax = Math.max(0, alongF, alongH) + 22;
        lines.push({
          a: add(v[i], uAlt, tMin),
          b: add(v[i], uAlt, tMax),
        });
      }
    } else if (mode === "bisector") {
      /* vertex → through I → opposite side (so every ray visibly passes through the centre) */
      for (i = 0; i < 3; i++) {
        var oppA = v[(i + 1) % 3];
        var oppB = v[(i + 2) % 3];
        var hit = intersectLines(v[i], c, oppA, oppB);
        var end;
        if (hit && hit.t > 0.05) {
          end = add(v[i], unit(v[i], hit), dist(v[i], hit) + 10);
        } else {
          end = add(v[i], unit(v[i], c), dist(v[i], c) + 36);
        }
        lines.push({ a: v[i], b: end });
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

  /**
   * True SVG <circle> — circumcircle (O) or incircle (I).
   * Always recomputes the true centre from verts so radius stays exact.
   */
  function appendSolutionCircle(svg, mode, v) {
    if (!v) return;
    if (mode !== "perp" && mode !== "bisector") return;
    var c = trueCentre(mode, v);
    if (!c) return;
    var r = mode === "perp" ? dist(c, v[0]) : inradiusOf(v);
    if (!(r > 1)) return;
    svg.appendChild(E("circle", {
      cx: String(c.x),
      cy: String(c.y),
      r: String(r),
      fill: "rgba(37,99,235,.07)",
      stroke: MARK,
      "stroke-width": "2.2",
      "stroke-dasharray": "6 4",
      "stroke-opacity": "0.95",
    }));
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
    /* no spoiler title — finish bar already says “See solution” */
    if (els.solutionLabel) els.solutionLabel.textContent = "";
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
    appendTriangleRightAngle(svg, v);
    /* median / perp: equal-length marks on both halves (mid-point cut) */
    if (state.mode === "median" || state.mode === "perp") {
      var tickCounts = sideTickCounts(v);
      var s;
      for (s = 0; s < 3; s++) {
        var sa = v[s];
        var sb = v[(s + 1) % 3];
        var sm = mid(sa, sb);
        var tc = tickCounts[s];
        svg.appendChild(hashHalf(sa, sm, tc));
        svg.appendChild(hashHalf(sm, sb, tc));
      }
    }
    var solLines = correctSpecialLines(state.mode, v);
    var solSegs = solLines.map(function (L) { return [L.a, L.b]; });
    var solPerp = [];
    solLines.forEach(function (L, i) {
      if (state.mode === "altitude") {
        appendAltitudeFootExtension(svg, v, i);
        var B = v[(i + 1) % 3];
        var C = v[(i + 2) % 3];
        var F = foot(v[i], B, C);
        if (!nearAnyVertex(F, VERTEX_SKIP)) {
          solPerp.push({ x: F.x, y: F.y, alongLine: v[i], alongSide: B });
        }
      }
      if (state.mode === "perp") {
        var S0 = v[i];
        var S1 = v[(i + 1) % 3];
        var M = mid(S0, S1);
        if (!nearAnyVertex(M, VERTEX_SKIP)) {
          solPerp.push({ x: M.x, y: M.y, alongLine: L.b, alongSide: S1 });
        }
      }
      svg.appendChild(E("line", {
        x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y,
        stroke: DASH, "stroke-width": 2.2, "stroke-dasharray": "7 4", "stroke-linecap": "round",
      }));
      /* bisector solution: equal angles → same n; distinct angles → different n; 錯開 radii */
      if (state.mode === "bisector") {
        var V = v[i];
        var P = v[(i + 1) % 3];
        var Q = v[(i + 2) % 3];
        var Ipt = trueCentre("bisector", v) || L.b;
        appendEqualAnglePair(svg, V, P, Q, Ipt, equalAngleMarkPlan(v)[i]);
      }
    });
    dedupePerpHits(solPerp).forEach(function (hit) {
      svg.appendChild(rightAngleMark(hit, hit.alongLine, hit.alongSide));
    });
    var solC = trueCentre(state.mode, v) || state.reveal.trueC;
    /* reveal step: circumcircle (O) or incircle (I) — true radius, tangent / through vertices */
    appendSolutionCircle(svg, state.mode, v);
    appendCentreSpot(svg, solC, state.mode, solSegs);
    var i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(E("circle", {
        cx: v[i].x, cy: v[i].y, r: 4.5,
        fill: HANDLE, stroke: "none",
      }));
      svg.appendChild(labelOutside(v[i], LABELS[i], solC));
    }
  }

  function onMiss() {
    state.misses += 1;
    state.combo = 0;
    updateHud();
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
    /* kept for solution panel; player draw uses collectPerpMarks (deduped) */
    if (!from || !state.verts || from.kind !== "side") return;
    var S0 = state.verts[from.index];
    var S1 = state.verts[(from.index + 1) % 3];
    if (!isPerp(sub(b, a), sub(S1, S0))) return;
    var M = mid(S0, S1);
    if (dist(M, foot(M, a, b)) > 6) return;
    var alongLine = dist(a, M) <= dist(b, M) ? b : a;
    svg.appendChild(rightAngleMark(M, alongLine, S1));
  }

  function shortArcPathFromAngles(V, a1, a2, r) {
    var d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    var p1 = { x: V.x + Math.cos(a1) * r, y: V.y + Math.sin(a1) * r };
    var p2 = { x: V.x + Math.cos(a1 + d) * r, y: V.y + Math.sin(a1 + d) * r };
    return "M " + p1.x + " " + p1.y + " A " + r + " " + r + " 0 0 " + (d > 0 ? 1 : 0) + " " + p2.x + " " + p2.y;
  }

  function shortArcPath(V, P, Q, r) {
    var a1 = Math.atan2(P.y - V.y, P.x - V.x);
    var a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
    return shortArcPathFromAngles(V, a1, a2, r);
  }

  function equalAngleArc(V, P, Q, r) {
    return E("path", {
      d: shortArcPath(V, P, Q, r),
      fill: "none", stroke: MARK, "stroke-width": 1.7, "stroke-linecap": "round",
    });
  }

  function vertexAngleRad(v, i) {
    var V = v[i];
    var P = v[(i + 1) % 3];
    var Q = v[(i + 2) % 3];
    return Math.acos(Math.max(-1, Math.min(1, dot(unit(V, P), unit(V, Q)))));
  }

  /**
   * Curve-count per vertex for bisector equal-angle marks.
   * Same angle size → same count; distinct sizes get 1, 2, … by first occurrence.
   * Equilateral → all 1. Scalene / right → three different counts.
   */
  function equalAngleMarkPlan(v) {
    var angs = [vertexAngleRad(v, 0), vertexAngleRad(v, 1), vertexAngleRad(v, 2)];
    var ANG_TOL = 0.07;
    var counts = [1, 1, 1];
    var groups = [];
    var i, g, found;
    for (i = 0; i < 3; i++) {
      found = false;
      for (g = 0; g < groups.length; g++) {
        if (Math.abs(groups[g].ang - angs[i]) < ANG_TOL) {
          groups[g].idx.push(i);
          found = true;
          break;
        }
      }
      if (!found) groups.push({ ang: angs[i], idx: [i] });
    }
    var rank = 0;
    groups.forEach(function (gr) {
      rank += 1;
      gr.idx.forEach(function (vi) { counts[vi] = rank; });
    });
    return counts;
  }

  /**
   * Two half-signs at a vertex: same curve count, but 錯開 — different radii.
   * 1 curve → farther out (previous single-arc distance).
   * 2+ curves → shorter pack, same gap:stagger ratio between arcs.
   */
  function appendEqualAnglePair(svg, V, P, Q, I, count) {
    var n = Math.max(1, count || 1);
    var base = n === 1 ? 14 : 8;
    var gap = n === 1 ? 7 : 4;
    var stagger = n === 1 ? 4 : 2.3;
    var k;
    for (k = 0; k < n; k++) {
      svg.appendChild(equalAngleArc(V, P, I, base + k * gap));
      svg.appendChild(equalAngleArc(V, I, Q, base + stagger + k * gap));
    }
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
      return { V: V, P: P, Q: Q, I: I, vi: i };
    }
    return null;
  }

  /**
   * Equal-angle half-arcs only when a true angle bisector is drawn.
   * Curve count from equalAngleMarkPlan; halves are 錯開 (different radii).
   */
  function appendBisectorMarks(svg, a, b) {
    var hit = bisectorHitForSegment(a, b);
    if (!hit) return;
    appendEqualAnglePair(
      svg, hit.V, hit.P, hit.Q, hit.I,
      equalAngleMarkPlan(state.verts)[hit.vi]
    );
  }

  function sideTickCounts(v) {
    /* sides 0=AB, 1=BC, 2=CA — equal lengths share a mark; distinct lengths get 1,2,3 */
    var lens = [dist(v[0], v[1]), dist(v[1], v[2]), dist(v[2], v[0])];
    var avg = (lens[0] + lens[1] + lens[2]) / 3;
    var tol = Math.max(SIDE_EQ_MIN, avg * SIDE_EQ_FRAC);
    var order = [0, 1, 2].sort(function (i, j) { return lens[i] - lens[j]; });
    var counts = [1, 1, 1];
    counts[order[0]] = 1;
    var rank = 1;
    var i;
    for (i = 1; i < 3; i++) {
      if (Math.abs(lens[order[i]] - lens[order[i - 1]]) <= tol) {
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

  function labelOutside(P, t, avoidCentre) {
    var g = centroid(state.verts);
    var dx = P.x - g.x;
    var dy = P.y - g.y;
    var d = Math.hypot(dx, dy) || 1;
    var distOut = 14;
    /* if centre (e.g. H) sits on this vertex, push A/B/C further out */
    if (avoidCentre && dist(P, avoidCentre) < 22) {
      distOut = 26;
    }
    var x = P.x + (dx / d) * distOut;
    var y = P.y + (dy / d) * distOut;
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
    appendTriangleRightAngle(svg, v);

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

    /* side extensions while dragging and on committed lines (obtuse altitudes) */
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

    /* player lines + ⊥ marks (deduped across all lines — ≤1 per point) */
    var allPerp = [];
    state.lines.forEach(function (L, i) {
      var col = i === state.hoverLine ? HOT : DASH;
      svg.appendChild(E("line", {
        x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y,
        stroke: col, "stroke-width": i === state.hoverLine ? 3.2 : 2.2,
        "stroke-dasharray": "7 4", "stroke-linecap": "round",
        class: "mp-line", "data-line": String(i),
      }));
      collectPerpMarks(L.a, L.b, L.from).forEach(function (hit) { allPerp.push(hit); });
      appendBisectorMarks(svg, L.a, L.b);
    });

    /* drag ghost: start → pointer only */
    if (state.drag && state.pointer) {
      var start = handlePoint(state.drag.kind, state.drag.index);
      svg.appendChild(E("line", {
        x1: start.x, y1: start.y, x2: state.pointer.x, y2: state.pointer.y,
        stroke: "#64748b", "stroke-width": 2.2, "stroke-dasharray": "6 4", "stroke-linecap": "round",
      }));
      collectPerpMarks(start, state.pointer, state.drag).forEach(function (hit) { allPerp.push(hit); });
      appendBisectorMarks(svg, start, state.pointer);
    }
    dedupePerpHits(allPerp).forEach(function (hit) {
      svg.appendChild(rightAngleMark(hit, hit.alongLine, hit.alongSide));
    });

    /* centre + circumcircle / incircle after a correct Check */
    var showC = state.reveal && state.reveal.ok && state.reveal.point;
    if (showC) {
      appendSolutionCircle(svg, state.mode, v);
      appendCentreSpot(svg, state.reveal.point, state.mode);
    }

    var i, m;
    for (i = 0; i < 3; i++) {
      svg.appendChild(E("circle", {
        cx: v[i].x, cy: v[i].y, r: 4.5,
        fill: HANDLE, stroke: "none",
        style: "cursor:crosshair",
      }));
      svg.appendChild(labelOutside(v[i], LABELS[i], showC ? state.reveal.point : null));
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
    els.startBtn.addEventListener("click", function () { restartMission(); });
    els.retryFailBtn.addEventListener("click", function () { startLevel(state.levelIdx); });
    els.nextBtn.addEventListener("click", function () {
      if (state.gameOver) {
        /* full reset then jump to Centre Snap (or restart Meeting Point) */
        hideClearBar();
        resetRunState();
        state.running = false;
        state.overlay = "title";
        state.reveal = null;
        state.lines = [];
        updateLivesBar(false);
        updateHud();
        var chipGo = document.querySelector('[data-tg-mode="centres"]');
        if (chipGo) chipGo.click();
        else restartMission();
        return;
      }
      if (state.levelIdx >= LEVELS.length - 1) {
        resetRunState();
        var chipEnd = document.querySelector('[data-tg-mode="centres"]');
        if (chipEnd) chipEnd.click();
        else restartMission();
        return;
      }
      advanceToNextLevel();
    });
    els.retryBtn.addEventListener("click", function () {
      if (state.gameOver) {
        restartMission();
        return;
      }
      /* Replay same level — keep retryMode so Next still adapts after another miss */
      startLevel(state.levelIdx);
    });
    els.menuBtn.addEventListener("click", function () {
      clearTimers();
      hideClearBar();
      resetRunState();
      state.running = false;
      state.overlay = "title";
      state.mode = "median";
      applyVerts(SHAPES.acute, "median");
      state.lines = [];
      state.reveal = null;
      updateLivesBar(false);
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
        if (state.gameOver) {
          hideClearBar();
          resetRunState();
          state.running = false;
          state.overlay = "title";
          state.reveal = null;
          state.lines = [];
          updateLivesBar(false);
          updateHud();
          var chipSkip = document.querySelector('[data-tg-mode="centres"]');
          if (chipSkip) chipSkip.click();
          else restartMission();
          return;
        }
        if (state.levelIdx >= LEVELS.length - 1) {
          resetRunState();
          var chipLast = document.querySelector('[data-tg-mode="centres"]');
          if (chipLast) chipLast.click();
          else restartMission();
          return;
        }
        advanceToNextLevel();
        return;
      }
      skipLevel();
    });
  }

  function cacheEls() {
    els.root = document.getElementById("mp-root");
    els.svg = document.getElementById("mp-svg");
    els.stageFlash = document.getElementById("mp-stage-flash");
    els.tip = document.getElementById("mp-tip");
    els.crystalName = document.getElementById("mp-crystal-name");
    els.lineName = document.getElementById("mp-line-name");
    els.drawPill = document.getElementById("mp-draw-pill");
    els.levelNum = document.getElementById("mp-level");
    els.actLabel = document.getElementById("mp-act");
    els.energyFill = document.getElementById("mp-energy-fill");
    els.starsTotal = document.getElementById("mp-stars-total");
    els.combo = document.getElementById("mp-combo");
    els.lockedCount = document.getElementById("mp-locked");
    els.timerVal = document.getElementById("mp-timer-val");
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
    state.drag = null;
    /* resume mid-level after visiting another mission (deactivate only pauses) */
    if (state.overlay === "play") {
      state.running = true;
      showOverlay("play");
      hideClearBar();
    } else if (state.overlay === "clear") {
      showOverlay("play");
      if (els.clearBar) els.clearBar.classList.remove("hidden");
    } else if (state.overlay === "fail") {
      showOverlay("fail");
    } else {
      showOverlay("title");
    }
    draw();
    updateHud();
  }

  function deactivate() {
    clearTimers();
    state.drag = null;
    /* pause only — do not clear running/overlay or drag breaks on return */
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
