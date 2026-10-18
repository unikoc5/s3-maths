/**
 * JM28 Meeting Point · 三線交會
 * Draw the three special lines that meet at the target centre. Not a quiz.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var W = 560;
  var H = 400;
  var SNAP = 22;
  var ANGLE_SNAP = 10 * Math.PI / 180;
  var ENERGY_MAX = 100;
  var ENERGY_MISS = 14;
  var LABELS = ["A", "B", "C"];
  var TICK = "#dc2626";
  var MARK = "#2563eb";
  var INK = "#0f172a";
  var DASH = "#0284c7";

  var MODE_META = {
    median: {
      centre: "Centroid",
      centreZh: "重心",
      lineZh: "中線",
      tip: "從頂點拖到對邊中點。三條中線交於重心。",
      tipEn: "Drag from a vertex to the mid-point of the opposite side.",
    },
    altitude: {
      centre: "Orthocentre",
      centreZh: "垂心",
      lineZh: "高線",
      tip: "從頂點拖到對邊（或延長線）上的垂足。鈍角時垂心在形外。",
      tipEn: "Drag from a vertex perpendicular to the opposite side (or its extension).",
    },
    bisector: {
      centre: "In-centre",
      centreZh: "內心",
      lineZh: "角平分線",
      tip: "從頂點沿角平分線拖出。三條角平分線交於內心。",
      tipEn: "Drag from a vertex along the angle bisector.",
    },
    perp: {
      centre: "Circumcentre",
      centreZh: "外心",
      lineZh: "垂直平分線",
      tip: "從邊的中點沿垂直方向拖出。三條垂直平分線交於外心。",
      tipEn: "Drag from a side mid-point along the perpendicular.",
    },
  };

  var SHAPES = {
    acute: [
      { x: 90, y: 320 },
      { x: 470, y: 300 },
      { x: 260, y: 70 },
    ],
    right: [
      { x: 110, y: 310 },
      { x: 420, y: 310 },
      { x: 110, y: 90 },
    ],
    obtuse: [
      { x: 80, y: 280 },
      { x: 430, y: 310 },
      { x: 200, y: 80 },
    ],
    isosceles: [
      { x: 120, y: 320 },
      { x: 440, y: 320 },
      { x: 280, y: 70 },
    ],
  };

  var LEVELS = [
    { act: 1, mode: "median", shape: "acute", tutorial: true, title: "認識中線" },
    { act: 1, mode: "altitude", shape: "acute", tutorial: true, title: "認識高線" },
    { act: 1, mode: "bisector", shape: "acute", tutorial: true, title: "認識角平分線" },
    { act: 1, mode: "perp", shape: "acute", tutorial: true, title: "認識垂直平分線" },
    { act: 2, mode: "altitude", shape: "obtuse", title: "鈍角垂心", allowExtend: true },
    { act: 2, mode: "perp", shape: "right", title: "直角外心" },
    { act: 2, mode: "median", shape: "isosceles", title: "等腰重心", dragVerts: true },
    { act: 2, mode: "bisector", shape: "acute", title: "內心守護", dragVerts: true },
    { act: 3, switch: true, crystals: 3, switchMs: 12000, timeLimit: 95, title: "四心亂戰 I" },
    { act: 3, switch: true, crystals: 3, switchMs: 10000, timeLimit: 80, title: "四心亂戰 II", shapes: ["acute", "isosceles"] },
    { act: 3, switch: true, crystals: 4, switchMs: 8500, timeLimit: 70, title: "四心亂戰 III", shapes: ["obtuse", "right", "acute"], allowExtend: true },
    { act: 3, switch: true, crystals: 4, switchMs: 7000, timeLimit: 55, title: "線匠試煉", shapes: ["obtuse", "isosceles", "right", "acute"], allowExtend: true, boss: true },
  ];

  var SWITCH_ORDER = ["median", "altitude", "bisector", "perp"];

  var state = {
    levelIdx: 0,
    verts: null,
    mode: "median",
    locked: [], // { kind:'vertex'|'side', index, a, b, foot }
    energy: ENERGY_MAX,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    startedAt: 0,
    crystalLit: false,
    crystalsDone: 0,
    switchTimer: null,
    switchEndsAt: 0,
    levelTimer: null,
    levelEndsAt: 0,
    drag: null,
    running: false,
    stars: 0,
    overlay: "title", // title | play | clear | fail
  };

  var els = {};

  function E(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function mid(p, q) { return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }
  function lerp(p, q, t) { return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function unit(p, q) {
    var d = dist(p, q) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
  }
  function add(p, u, s) { return { x: p.x + u.x * s, y: p.y + u.y * s }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function cloneVerts(v) {
    return v.map(function (p) { return { x: p.x, y: p.y }; });
  }
  function opposite(i) { return [(i + 1) % 3, (i + 2) % 3]; }

  function foot(p, a, b) {
    var abx = b.x - a.x;
    var aby = b.y - a.y;
    var len2 = abx * abx + aby * aby || 1;
    var t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    return { x: a.x + t * abx, y: a.y + t * aby, t: t };
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
    var A = v[0];
    var B = v[1];
    var C = v[2];
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
  function intersectLines(p1, p2, p3, p4) {
    var d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 1e-8) return null;
    var t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  }
  function trueCentre(mode, v) {
    if (mode === "median") return centroid(v);
    if (mode === "altitude") return orthocentre(v);
    if (mode === "bisector") return incentre(v);
    return circumcentre(v);
  }
  function angleBisectorDir(v, i) {
    var prev = v[(i + 2) % 3];
    var cur = v[i];
    var next = v[(i + 1) % 3];
    var u = unit(cur, prev);
    var w = unit(cur, next);
    var s = { x: u.x + w.x, y: u.y + w.y };
    var len = Math.hypot(s.x, s.y) || 1;
    return { x: s.x / len, y: s.y / len };
  }
  function targetForVertex(mode, v, i) {
    var opp = opposite(i);
    var a = v[opp[0]];
    var b = v[opp[1]];
    if (mode === "median") return mid(a, b);
    if (mode === "altitude") {
      var f = foot(v[i], a, b);
      return { x: f.x, y: f.y, t: f.t, a: a, b: b };
    }
    if (mode === "bisector") {
      var dir = angleBisectorDir(v, i);
      var sideLen = dist(a, b);
      return add(v[i], dir, sideLen * 0.55);
    }
    return null;
  }
  function targetForSide(mode, v, sideIdx) {
    if (mode !== "perp") return null;
    var a = v[sideIdx];
    var b = v[(sideIdx + 1) % 3];
    var m = mid(a, b);
    var u = unit(a, b);
    var n = { x: -u.y, y: u.x };
    var c = trueCentre(mode, v);
    if (c && dot(sub(c, m), n) < 0) n = { x: -n.x, y: -n.y };
    return { mid: m, dir: n, a: a, b: b };
  }

  function alreadyLockedVertex(i) {
    return state.locked.some(function (L) { return L.kind === "vertex" && L.index === i; });
  }
  function alreadyLockedSide(i) {
    return state.locked.some(function (L) { return L.kind === "side" && L.index === i; });
  }

  function levelDef() { return LEVELS[state.levelIdx]; }

  function pickShape(lv) {
    if (lv.shapes && lv.shapes.length) {
      return lv.shapes[Math.floor(Math.random() * lv.shapes.length)];
    }
    return lv.shape || "acute";
  }

  function clearTimers() {
    if (state.switchTimer) {
      clearInterval(state.switchTimer);
      state.switchTimer = null;
    }
    if (state.levelTimer) {
      clearInterval(state.levelTimer);
      state.levelTimer = null;
    }
  }

  function setMode(mode) {
    state.mode = mode;
    state.locked = [];
    state.crystalLit = false;
    updateHud();
    draw();
  }

  function startLevel(idx) {
    clearTimers();
    state.levelIdx = Math.max(0, Math.min(LEVELS.length - 1, idx));
    var lv = levelDef();
    state.verts = cloneVerts(SHAPES[pickShape(lv)]);
    state.energy = ENERGY_MAX;
    state.combo = 0;
    state.maxCombo = 0;
    state.misses = 0;
    state.crystalsDone = 0;
    state.startedAt = Date.now();
    state.overlay = "play";
    state.running = true;
    state.drag = null;
    if (lv.switch) {
      setMode(SWITCH_ORDER[0]);
      state.switchEndsAt = Date.now() + (lv.switchMs || 12000);
      state.switchTimer = setInterval(onSwitchTick, 200);
      state.levelEndsAt = Date.now() + (lv.timeLimit || 90) * 1000;
      state.levelTimer = setInterval(onLevelTick, 200);
    } else {
      setMode(lv.mode);
    }
    showOverlay("play");
    updateHud();
    draw();
    flashTip(true);
  }

  function onSwitchTick() {
    if (!state.running || state.overlay !== "play") return;
    var left = state.switchEndsAt - Date.now();
    updateTimers();
    if (left > 0) return;
    // Force switch: clear lines, next mode, energy hit
    var i = SWITCH_ORDER.indexOf(state.mode);
    var next = SWITCH_ORDER[(i + 1) % SWITCH_ORDER.length];
    state.energy = Math.max(0, state.energy - 8);
    state.combo = 0;
    setMode(next);
    state.switchEndsAt = Date.now() + (levelDef().switchMs || 12000);
    if (state.energy <= 0) failLevel("能量耗盡 — 換心太慢了！");
    else {
      pulse("warn");
      flashTip(true);
    }
  }

  function onLevelTick() {
    if (!state.running || state.overlay !== "play") return;
    updateTimers();
    if (Date.now() >= state.levelEndsAt) {
      failLevel("時間到！水晶還沒全亮。");
    }
  }

  function updateTimers() {
    if (!els.timerSwitch || !els.timerLevel) return;
    var lv = levelDef();
    if (lv.switch) {
      var sLeft = Math.max(0, Math.ceil((state.switchEndsAt - Date.now()) / 1000));
      var lLeft = Math.max(0, Math.ceil((state.levelEndsAt - Date.now()) / 1000));
      els.timerSwitch.textContent = sLeft + "s";
      els.timerLevel.textContent = lLeft + "s";
      els.timerRow.classList.remove("hidden");
    } else {
      els.timerRow.classList.add("hidden");
    }
  }

  function starsForClear() {
    var elapsed = (Date.now() - state.startedAt) / 1000;
    var s = 3;
    if (state.misses > 2 || state.energy < 40) s = 2;
    if (state.misses > 5 || state.energy < 20 || elapsed > 90) s = 1;
    if (levelDef().switch && state.maxCombo >= 4) s = Math.max(s, 2);
    return s;
  }

  function clearCrystal() {
    state.crystalLit = true;
    state.crystalsDone += 1;
    pulse("ok");
    var lv = levelDef();
    var need = lv.switch ? (lv.crystals || 3) : 1;
    if (state.crystalsDone >= need) {
      state.stars = starsForClear();
      state.running = false;
      clearTimers();
      setTimeout(function () { showClear(); }, 480);
      return;
    }
    // Next crystal in switch mode
    var i = SWITCH_ORDER.indexOf(state.mode);
    setMode(SWITCH_ORDER[(i + 1) % SWITCH_ORDER.length]);
    state.switchEndsAt = Date.now() + (lv.switchMs || 12000);
    flashTip(true);
  }

  function failLevel(msg) {
    state.running = false;
    clearTimers();
    state.overlay = "fail";
    els.failMsg.textContent = msg || "再試一次！";
    els.overlayFail.classList.remove("hidden");
    els.overlayClear.classList.add("hidden");
    els.overlayTitle.classList.add("hidden");
  }

  function showClear() {
    state.overlay = "clear";
    var stars = state.stars;
    els.clearStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    els.clearTitle.textContent = levelDef().title + " · 通關";
    var meta = MODE_META[state.mode];
    els.clearMsg.textContent =
      "連擊最高 " + state.maxCombo + " · 失誤 " + state.misses + " · 剩餘能量 " + Math.round(state.energy);
    els.overlayClear.classList.remove("hidden");
    els.overlayFail.classList.add("hidden");
    els.overlayTitle.classList.add("hidden");
    if (els.nextBtn) {
      els.nextBtn.textContent = state.levelIdx >= LEVELS.length - 1 ? "再玩一輪" : "下一關";
    }
  }

  function showOverlay(which) {
    // which: "title" | "clear" | "fail" | "play" | null
    var mode = which || "play";
    els.overlayTitle.classList.toggle("hidden", mode !== "title");
    els.overlayClear.classList.toggle("hidden", mode !== "clear");
    els.overlayFail.classList.toggle("hidden", mode !== "fail");
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

  function flashTip(force) {
    var meta = MODE_META[state.mode];
    if (!meta) return;
    els.tip.textContent = meta.tip;
    els.crystalName.textContent = meta.centreZh + " · " + meta.centre;
    els.lineName.textContent = meta.lineZh;
    if (force) els.tip.classList.add("mp-tip-pop");
    setTimeout(function () { els.tip.classList.remove("mp-tip-pop"); }, 500);
  }

  function updateHud() {
    var lv = levelDef();
    els.levelNum.textContent = (state.levelIdx + 1) + " / " + LEVELS.length;
    els.actLabel.textContent = lv.act === 1 ? "第一幕 · 認識四線" : lv.act === 2 ? "第二幕 · 形狀變化" : "第三幕 · 四心亂戰";
    els.energyFill.style.width = Math.max(0, Math.min(100, state.energy)) + "%";
    els.combo.textContent = String(state.combo);
    els.crystals.textContent = lv.switch
      ? state.crystalsDone + " / " + (lv.crystals || 3)
      : (state.crystalLit ? "1 / 1" : "0 / 1");
    els.lockedCount.textContent = state.locked.length + " / 3";
    flashTip(false);
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

  function nearestVertex(p, maxD) {
    var best = -1;
    var bestD = maxD;
    for (var i = 0; i < 3; i++) {
      var d = dist(p, state.verts[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function nearestSideMid(p, maxD) {
    var best = -1;
    var bestD = maxD;
    for (var i = 0; i < 3; i++) {
      var m = mid(state.verts[i], state.verts[(i + 1) % 3]);
      var d = dist(p, m);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function tryLockFromDrag(drag, p) {
    var mode = state.mode;
    if (mode === "perp") {
      if (drag.kind !== "side") return { ok: false, reason: "wrong" };
      var tgt = targetForSide(mode, state.verts, drag.index);
      if (!tgt) return { ok: false };
      var along = dot(sub(p, tgt.mid), tgt.dir);
      if (along < 28) return { ok: false, reason: "short" };
      var closest = add(tgt.mid, tgt.dir, along);
      var lateral = dist(p, closest);
      var angOk = lateral < SNAP * 1.2;
      if (!angOk) return { ok: false, reason: "miss" };
      if (alreadyLockedSide(drag.index)) return { ok: false, reason: "dup" };
      var end = add(tgt.mid, tgt.dir, Math.max(60, Math.min(160, along)));
      return {
        ok: true,
        line: {
          kind: "side",
          index: drag.index,
          a: tgt.mid,
          b: end,
          marks: "perp",
          sideA: tgt.a,
          sideB: tgt.b,
        },
      };
    }

    if (drag.kind !== "vertex") return { ok: false, reason: "wrong" };
    if (alreadyLockedVertex(drag.index)) return { ok: false, reason: "dup" };
    var i = drag.index;
    var start = state.verts[i];
    var tgt = targetForVertex(mode, state.verts, i);
    if (!tgt) return { ok: false };

    if (mode === "bisector") {
      var dir = angleBisectorDir(state.verts, i);
      var vdir = unit(start, p);
      var ang = Math.acos(Math.max(-1, Math.min(1, dot(dir, vdir))));
      if (dist(start, p) < 36) return { ok: false, reason: "short" };
      if (ang > ANGLE_SNAP) return { ok: false, reason: "miss" };
      var endB = add(start, dir, Math.max(80, dist(start, p)));
      return {
        ok: true,
        line: { kind: "vertex", index: i, a: start, b: endB, marks: "bisector" },
      };
    }

    // median / altitude: snap to target point
    if (dist(p, tgt) > SNAP) {
      // Wrong-construction hint: near the other foot?
      if (mode === "median") {
        var alt = targetForVertex("altitude", state.verts, i);
        if (alt && dist(p, alt) <= SNAP) return { ok: false, reason: "wrongType" };
      }
      if (mode === "altitude") {
        var med = targetForVertex("median", state.verts, i);
        if (med && dist(p, med) <= SNAP) return { ok: false, reason: "wrongType" };
      }
      return { ok: false, reason: "miss" };
    }
    if (mode === "altitude" && typeof tgt.t === "number") {
      var onSeg = tgt.t >= -0.02 && tgt.t <= 1.02;
      if (!onSeg && !levelDef().allowExtend && levelDef().shape !== "obtuse") {
        // still allow slight extension
      }
    }
    return {
      ok: true,
      line: {
        kind: "vertex",
        index: i,
        a: start,
        b: { x: tgt.x, y: tgt.y },
        marks: mode,
        extend: mode === "altitude" && typeof tgt.t === "number" && (tgt.t < 0 || tgt.t > 1),
        sideA: tgt.a,
        sideB: tgt.b,
      },
    };
  }

  function onMiss(reason) {
    state.misses += 1;
    state.combo = 0;
    state.energy = Math.max(0, state.energy - ENERGY_MISS);
    pulse(reason === "wrongType" ? "warn" : "bad");
    updateHud();
    if (state.energy <= 0) failLevel("能量耗盡 — 線畫歪太多了！");
    else draw();
  }

  function onLock(line) {
    state.locked.push(line);
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    pulse("ok");
    updateHud();
    draw();
    if (state.locked.length >= 3) {
      setTimeout(checkConcurrence, 120);
    }
  }

  function checkConcurrence() {
    if (state.locked.length < 3) return;
    var c = trueCentre(state.mode, state.verts);
    if (!c) {
      onMiss("miss");
      state.locked = [];
      updateHud();
      draw();
      return;
    }
    // Each locked line should pass near the true centre
    var ok = state.locked.every(function (L) {
      var f = foot(c, L.a, L.b);
      return dist(c, f) < SNAP * 1.35;
    });
    // Also lines should roughly meet each other
    var meet = intersectLines(state.locked[0].a, state.locked[0].b, state.locked[1].a, state.locked[1].b);
    if (meet && dist(meet, c) > SNAP * 2) ok = false;
    if (!ok) {
      state.locked = [];
      onMiss("miss");
      els.tip.textContent = "三線還沒交在" + MODE_META[state.mode].centreZh + "上 — 再畫一次！";
      draw();
      return;
    }
    clearCrystal();
    draw();
  }

  function drawMarks(g, line) {
    if (line.marks === "median") {
      var opp = opposite(line.index);
      var m = line.b;
      g.appendChild(tickPair(state.verts[opp[0]], m, state.verts[opp[1]]));
    } else if (line.marks === "altitude") {
      g.appendChild(rightAngleMark(line.b, line.a, line.sideA || state.verts[opposite(line.index)[0]]));
      if (line.extend && line.sideA && line.sideB) {
        var fa = line.sideA;
        var fb = line.sideB;
        var t = foot(line.a, fa, fb).t;
        if (t < 0) g.appendChild(dotted(fa, line.b));
        else if (t > 1) g.appendChild(dotted(fb, line.b));
      }
    } else if (line.marks === "bisector") {
      g.appendChild(arcMarks(line.a, line.index));
    } else if (line.marks === "perp") {
      g.appendChild(tickPair(line.sideA, line.a, line.sideB));
      g.appendChild(rightAngleMark(line.a, line.b, line.sideB));
    }
  }

  function tickPair(p1, m, p2) {
    var g = E("g", {});
    g.appendChild(hashAt(p1, m, 1));
    g.appendChild(hashAt(m, p2, 1));
    return g;
  }
  function hashAt(p, q, count) {
    var g = E("g", {});
    var u = unit(p, q);
    var n = { x: -u.y, y: u.x };
    var c = mid(p, q);
    for (var i = 0; i < count; i++) {
      var a = { x: c.x - n.x * 6, y: c.y - n.y * 6 };
      var b = { x: c.x + n.x * 6, y: c.y + n.y * 6 };
      g.appendChild(E("line", {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: TICK, "stroke-width": 2.2, "stroke-linecap": "round",
      }));
    }
    return g;
  }
  function rightAngleMark(corner, alongAlt, alongSide) {
    var s = 10;
    var ua = unit(corner, alongAlt);
    var us = unit(corner, alongSide);
    // Prefer a direction along the side through the foot
    if (alongSide && corner) {
      /* keep us */
    }
    var p1 = add(corner, ua, s);
    var p3 = add(corner, us, s);
    var p2 = { x: corner.x + ua.x * s + us.x * s, y: corner.y + ua.y * s + us.y * s };
    return E("polyline", {
      points: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y].join(" "),
      fill: "none", stroke: MARK, "stroke-width": 2,
    });
  }
  function arcMarks(vertex, i) {
    var g = E("g", {});
    var prev = state.verts[(i + 2) % 3];
    var next = state.verts[(i + 1) % 3];
    var a0 = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
    var a1 = Math.atan2(next.y - vertex.y, next.x - vertex.x);
    var r = 22;
    g.appendChild(arc(vertex, r, a0, a1));
    g.appendChild(arc(vertex, r + 6, a0, a1));
    return g;
  }
  function arc(c, r, a0, a1) {
    // Draw the smaller arc between a0 and a1
    var dA = a1 - a0;
    while (dA <= -Math.PI) dA += Math.PI * 2;
    while (dA > Math.PI) dA -= Math.PI * 2;
    var large = Math.abs(dA) > Math.PI ? 1 : 0;
    var sweep = dA > 0 ? 1 : 0;
    var x0 = c.x + r * Math.cos(a0);
    var y0 = c.y + r * Math.sin(a0);
    var x1 = c.x + r * Math.cos(a1);
    var y1 = c.y + r * Math.sin(a1);
    return E("path", {
      d: "M " + x0 + " " + y0 + " A " + r + " " + r + " 0 " + large + " " + sweep + " " + x1 + " " + y1,
      fill: "none", stroke: MARK, "stroke-width": 2,
    });
  }
  function dotted(a, b) {
    return E("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: "#94a3b8", "stroke-width": 1.6, "stroke-dasharray": "3 5",
    });
  }

  function drawGhost(g, drag, p) {
    if (!drag) return;
    var trial = tryLockFromDrag(drag, p);
    var col = trial.ok ? "#16a34a" : "#94a3b8";
    var start = drag.kind === "vertex" ? state.verts[drag.index] : mid(state.verts[drag.index], state.verts[(drag.index + 1) % 3]);
    g.appendChild(E("line", {
      x1: start.x, y1: start.y, x2: p.x, y2: p.y,
      stroke: col, "stroke-width": 2.4, "stroke-dasharray": "7 5", "stroke-linecap": "round",
      opacity: "0.9",
    }));
    if (trial.ok && trial.line) {
      g.appendChild(E("circle", {
        cx: trial.line.b.x, cy: trial.line.b.y, r: 7,
        fill: "#bbf7d0", stroke: "#16a34a", "stroke-width": 2,
      }));
    }
    // Snap guides
    if (drag.kind === "vertex" && state.mode !== "perp") {
      var tgt = targetForVertex(state.mode, state.verts, drag.index);
      if (tgt) {
        g.appendChild(E("circle", {
          cx: tgt.x, cy: tgt.y, r: 5,
          fill: "none", stroke: DASH, "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: "0.7",
        }));
      }
    }
  }

  function draw() {
    var svg = els.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Background soft grid
    var bg = E("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#mpGrad)" });
    var defs = E("defs", {});
    var grad = E("linearGradient", { id: "mpGrad", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(E("stop", { offset: "0%", "stop-color": "#f0f9ff" }));
    grad.appendChild(E("stop", { offset: "100%", "stop-color": "#e2e8f0" }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    svg.appendChild(bg);

    var v = state.verts;
    if (!v) return;

    // Side extensions for obtuse altitude levels
    if (state.mode === "altitude" && (levelDef().allowExtend || levelDef().shape === "obtuse")) {
      for (var ei = 0; ei < 3; ei++) {
        var f = foot(v[ei], v[(ei + 1) % 3], v[(ei + 2) % 3]);
        if (f.t < 0 || f.t > 1) {
          var end = f.t < 0 ? v[(ei + 1) % 3] : v[(ei + 2) % 3];
          var other = { x: f.x, y: f.y };
          svg.appendChild(dotted(end, other));
        }
      }
    }

    // Triangle fill
    svg.appendChild(E("polygon", {
      points: v.map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "rgba(255,255,255,.85)", stroke: INK, "stroke-width": 2.5,
    }));

    // Locked lines
    state.locked.forEach(function (L) {
      var lg = E("g", { class: "mp-locked" });
      lg.appendChild(E("line", {
        x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y,
        stroke: DASH, "stroke-width": 2.4, "stroke-dasharray": "8 6", "stroke-linecap": "round",
      }));
      drawMarks(lg, L);
      svg.appendChild(lg);
    });

    // Crystal at true centre (dim until lit)
    var c = trueCentre(state.mode, v);
    if (c) {
      var cryst = E("g", { class: state.crystalLit ? "mp-crystal lit" : "mp-crystal" });
      cryst.appendChild(E("circle", {
        cx: c.x, cy: c.y, r: state.crystalLit ? 16 : 12,
        fill: state.crystalLit ? "#fde68a" : "rgba(148,163,184,.35)",
        stroke: state.crystalLit ? "#d97706" : "#64748b",
        "stroke-width": 2.5,
      }));
      cryst.appendChild(E("text", {
        x: c.x, y: c.y + 4, "text-anchor": "middle",
        fill: state.crystalLit ? "#92400e" : "#475569",
        "font-size": "11", "font-weight": "800",
      })).textContent = MODE_META[state.mode].centreZh;
      svg.appendChild(cryst);
    }

    // Handles
    if (state.mode === "perp") {
      for (var s = 0; s < 3; s++) {
        if (alreadyLockedSide(s)) continue;
        var m = mid(v[s], v[(s + 1) % 3]);
        svg.appendChild(E("circle", {
          cx: m.x, cy: m.y, r: 9,
          fill: "#38bdf8", stroke: "#fff", "stroke-width": 2,
          class: "mp-handle", "data-side": String(s),
          style: "cursor:grab",
        }));
      }
    } else {
      for (var i = 0; i < 3; i++) {
        if (alreadyLockedVertex(i)) continue;
        svg.appendChild(E("circle", {
          cx: v[i].x, cy: v[i].y, r: 10,
          fill: "#0ea5e9", stroke: "#fff", "stroke-width": 2.5,
          class: "mp-handle", "data-vertex": String(i),
          style: "cursor:grab",
        }));
      }
    }

    // Vertex labels + optional drag verts
    for (var li = 0; li < 3; li++) {
      svg.appendChild(E("text", {
        x: v[li].x, y: v[li].y - 16, "text-anchor": "middle",
        fill: INK, "font-size": "14", "font-weight": "800",
      })).textContent = LABELS[li];
      if (levelDef().dragVerts) {
        svg.appendChild(E("circle", {
          cx: v[li].x, cy: v[li].y, r: 14,
          fill: "transparent", class: "mp-vert-drag", "data-vert": String(li),
          style: "cursor:move",
        }));
      }
    }

    if (state.drag && state.drag.pointer) {
      drawGhost(svg, state.drag, state.drag.pointer);
    }
  }

  function bindPointer() {
    var svg = els.svg;

    function down(evt) {
      if (!state.running || state.overlay !== "play") return;
      var p = svgPoint(evt);
      var t = evt.target;
      if (t && t.getAttribute && t.getAttribute("data-vert") != null && levelDef().dragVerts) {
        state.drag = { kind: "moveVert", index: +t.getAttribute("data-vert"), pointer: p };
        evt.preventDefault();
        return;
      }
      if (state.mode === "perp") {
        var si = nearestSideMid(p, 22);
        if (si >= 0 && !alreadyLockedSide(si)) {
          state.drag = { kind: "side", index: si, pointer: p };
          evt.preventDefault();
        }
        return;
      }
      var vi = nearestVertex(p, 24);
      if (vi >= 0 && !alreadyLockedVertex(vi)) {
        state.drag = { kind: "vertex", index: vi, pointer: p };
        evt.preventDefault();
      }
    }

    function move(evt) {
      if (!state.drag) return;
      var p = svgPoint(evt);
      if (state.drag.kind === "moveVert") {
        state.verts[state.drag.index] = {
          x: Math.max(40, Math.min(W - 40, p.x)),
          y: Math.max(40, Math.min(H - 40, p.y)),
        };
        state.locked = [];
        state.drag.pointer = p;
        draw();
        return;
      }
      state.drag.pointer = p;
      draw();
    }

    function up(evt) {
      if (!state.drag) return;
      var drag = state.drag;
      state.drag = null;
      if (drag.kind === "moveVert") {
        draw();
        return;
      }
      var p = svgPoint(evt);
      var result = tryLockFromDrag(drag, p);
      if (result.ok) onLock(result.line);
      else onMiss(result.reason || "miss");
    }

    svg.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    svg.addEventListener("pointerleave", function () {
      if (state.drag && state.drag.kind !== "moveVert") {
        /* keep drag until up */
      }
    });
  }

  function wireUi() {
    els.startBtn.addEventListener("click", function () {
      startLevel(0);
    });
    els.retryBtn.addEventListener("click", function () {
      startLevel(state.levelIdx);
    });
    els.retryFailBtn.addEventListener("click", function () {
      startLevel(state.levelIdx);
    });
    els.nextBtn.addEventListener("click", function () {
      if (state.levelIdx >= LEVELS.length - 1) startLevel(0);
      else startLevel(state.levelIdx + 1);
    });
    els.menuBtn.addEventListener("click", function () {
      clearTimers();
      state.running = false;
      state.overlay = "title";
      state.verts = cloneVerts(SHAPES.acute);
      state.mode = "median";
      state.locked = [];
      draw();
      updateHud();
      els.overlayTitle.classList.remove("hidden");
      els.overlayClear.classList.add("hidden");
      els.overlayFail.classList.add("hidden");
    });
    els.skipBtn.addEventListener("click", function () {
      if (state.levelIdx < LEVELS.length - 1) startLevel(state.levelIdx + 1);
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
    els.overlayClear = document.getElementById("mp-overlay-clear");
    els.overlayFail = document.getElementById("mp-overlay-fail");
    els.startBtn = document.getElementById("mp-start");
    els.retryBtn = document.getElementById("mp-retry");
    els.retryFailBtn = document.getElementById("mp-retry-fail");
    els.nextBtn = document.getElementById("mp-next");
    els.menuBtn = document.getElementById("mp-menu");
    els.skipBtn = document.getElementById("mp-skip");
    els.clearStars = document.getElementById("mp-clear-stars");
    els.clearTitle = document.getElementById("mp-clear-title");
    els.clearMsg = document.getElementById("mp-clear-msg");
    els.failMsg = document.getElementById("mp-fail-msg");
  }

  function init() {
    if (!document.getElementById("mp-root")) return;
    cacheEls();
    bindPointer();
    wireUi();
    state.verts = cloneVerts(SHAPES.acute);
    state.mode = "median";
    draw();
    updateHud();
    showOverlay("title");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
