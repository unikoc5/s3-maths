window.JM28FactoryGame = (function () {
  var TIME_LIMIT = 10;
  var MAX_LIVES = 3;
  var TYPES = [
    { id: "sss", family: "congruent", accept: true },
    { id: "sas", family: "congruent", accept: true },
    { id: "asa", family: "congruent", accept: true },
    { id: "aas", family: "congruent", accept: true },
    { id: "rhs", family: "congruent", accept: true },
    { id: "ssa", family: "congruent", accept: false },
    { id: "aaa", family: "congruent", accept: false },
    { id: "noncorr", family: "congruent", accept: false },
    { id: "aa", family: "similar", accept: true },
    { id: "sssprop", family: "similar", accept: true },
    { id: "sasprop", family: "similar", accept: true },
    { id: "ssaprop", family: "similar", accept: false },
    { id: "badprop", family: "similar", accept: false },
  ];

  var canvas, ctx;
  var width = 960;
  var height = 420;
  var running = false;
  var locked = false;
  var item = null;
  var score = 0;
  var combo = 1;
  var lives = MAX_LIVES;
  var timeLeft = TIME_LIMIT;
  var timerId = null;
  var barRaf = null;
  var timerStarted = 0;
  var listeners = [];
  var askedCorrect = {};
  var reviewQueue = [];
  var questionsAsked = 0;
  var lastId = null;
  var LEARN_KEY = "jm28-factory-learn";

  function t(key) {
    return window.I18n && window.I18n.t ? window.I18n.t(key) : key;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = el(id);
    if (node) node.textContent = value;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function loadLearn() {
    try {
      var data = JSON.parse(sessionStorage.getItem(LEARN_KEY) || "{}");
      askedCorrect = data.askedCorrect || {};
      reviewQueue = Array.isArray(data.reviewQueue) ? data.reviewQueue : [];
      questionsAsked = data.questionsAsked || 0;
      lastId = data.lastId || null;
    } catch (e) {
      askedCorrect = {};
      reviewQueue = [];
      questionsAsked = 0;
      lastId = null;
    }
  }

  function persistLearn() {
    try {
      sessionStorage.setItem(
        LEARN_KEY,
        JSON.stringify({
          askedCorrect: askedCorrect,
          reviewQueue: reviewQueue,
          questionsAsked: questionsAsked,
          lastId: lastId,
        })
      );
    } catch (e) {}
  }

  function typeById(id) {
    var i;
    for (i = 0; i < TYPES.length; i++) {
      if (TYPES[i].id === id) return TYPES[i];
    }
    return TYPES[0];
  }

  function scheduleReview(id) {
    reviewQueue = reviewQueue.filter(function (q) {
      return q.id !== id;
    });
    reviewQueue.push({
      id: id,
      due: questionsAsked + 3 + Math.floor(Math.random() * 3),
    });
  }

  function noteResult(correct) {
    if (!item) return;
    if (correct) {
      askedCorrect[item.id] = true;
      reviewQueue = reviewQueue.filter(function (q) {
        return q.id !== item.id;
      });
    } else {
      delete askedCorrect[item.id];
      scheduleReview(item.id);
    }
    persistLearn();
  }

  function nextType() {
    var due = reviewQueue
      .filter(function (q) {
        return q.due <= questionsAsked && q.id !== lastId;
      })
      .sort(function (a, b) {
        return a.due - b.due;
      });
    if (!due.length) {
      due = reviewQueue
        .filter(function (q) {
          return q.due <= questionsAsked;
        })
        .sort(function (a, b) {
          return a.due - b.due;
        });
    }
    if (due.length) {
      reviewQueue = reviewQueue.filter(function (q) {
        return q.id !== due[0].id;
      });
      return typeById(due[0].id);
    }

    var pending = {};
    reviewQueue.forEach(function (q) {
      pending[q.id] = true;
    });
    var fresh = TYPES.filter(function (tp) {
      return !askedCorrect[tp.id] && !pending[tp.id] && tp.id !== lastId;
    });
    if (fresh.length) return pick(fresh);

    var filler = TYPES.filter(function (tp) {
      return !pending[tp.id] && tp.id !== lastId;
    });
    if (filler.length) return pick(filler);

    if (reviewQueue.length) {
      reviewQueue.sort(function (a, b) {
        return a.due - b.due;
      });
      return typeById(reviewQueue.shift().id);
    }

    askedCorrect = {};
    var cycle = TYPES.filter(function (tp) {
      return tp.id !== lastId;
    });
    return pick(cycle.length ? cycle : TYPES);
  }

  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }
  function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }
  function scale(a, s) {
    return { x: a.x * s, y: a.y * s };
  }
  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function norm(a) {
    var L = Math.hypot(a.x, a.y) || 1;
    return { x: a.x / L, y: a.y / L };
  }

  function deg(a) {
    return (a * Math.PI) / 180;
  }

  function triangleFromSSS(ab, bc, ca) {
    var x = (ab * ab + bc * bc - ca * ca) / (2 * bc);
    var y2 = Math.max(0, ab * ab - x * x);
    return {
      B: { x: 0, y: 0 },
      C: { x: bc, y: 0 },
      A: { x: x, y: -Math.sqrt(y2) },
    };
  }

  function triangleFromSAS(ca, angleA, ab) {
    return {
      A: { x: 0, y: 0 },
      B: { x: ab, y: 0 },
      C: { x: ca * Math.cos(angleA), y: -ca * Math.sin(angleA) },
    };
  }

  function triangleFromASA(angleA, ab, angleB) {
    var angleC = Math.PI - angleA - angleB;
    var bc = ab * Math.sin(angleA) / Math.sin(angleC);
    var ca = ab * Math.sin(angleB) / Math.sin(angleC);
    return triangleFromSSS(ab, bc, ca);
  }

  function triangleFromAAS(angleA, angleB, bc) {
    var angleC = Math.PI - angleA - angleB;
    var ab = bc * Math.sin(angleC) / Math.sin(angleA);
    var ca = bc * Math.sin(angleB) / Math.sin(angleA);
    return triangleFromSSS(ab, bc, ca);
  }

  function triangleFromRHS(hyp, legAB) {
    var legBC = Math.sqrt(Math.max(0, hyp * hyp - legAB * legAB));
    return {
      B: { x: 0, y: 0 },
      C: { x: legBC, y: 0 },
      A: { x: 0, y: -legAB },
    };
  }

  function triangleFromSSA(ab, angleA, bc, obtuseC) {
    var sinC = (ab * Math.sin(angleA)) / bc;
    sinC = Math.min(0.96, Math.max(0.2, sinC));
    var angleC = Math.asin(sinC);
    if (obtuseC) angleC = Math.PI - angleC;
    var angleB = Math.PI - angleA - angleC;
    if (angleB < 0.18) {
      angleC = Math.asin(sinC);
      angleB = Math.PI - angleA - angleC;
    }
    var ca = bc * Math.sin(angleB) / Math.sin(angleA);
    return triangleFromSSS(ab, bc, ca);
  }

  function triangleFromNoncorr(ab, ca, angleB) {
    var B = { x: 0, y: 0 };
    var A = { x: ab, y: 0 };
    var dir = { x: Math.cos(angleB), y: -Math.sin(angleB) };
    var qb = -2 * dir.x * ab;
    var qc = ab * ab - ca * ca;
    var disc = Math.max(0, qb * qb - 4 * qc);
    var root = Math.sqrt(disc);
    var t = (-qb + root) / 2;
    if (t < 0.4) t = (-qb - root) / 2;
    return { A: A, B: B, C: { x: dir.x * t, y: dir.y * t } };
  }

  function centroid(pts) {
    return {
      x: (pts.A.x + pts.B.x + pts.C.x) / 3,
      y: (pts.A.y + pts.B.y + pts.C.y) / 3,
    };
  }

  function maxExtent(pts) {
    var c = centroid(pts);
    return Math.max(dist(pts.A, c), dist(pts.B, c), dist(pts.C, c));
  }

  function placePts(pts, cx, cy, rot, flip, pxPerUnit) {
    var c = centroid(pts);
    var cos = Math.cos(rot);
    var sin = Math.sin(rot);
    var out = {};
    ["A", "B", "C"].forEach(function (k) {
      var x = (pts[k].x - c.x) * pxPerUnit;
      var y = (pts[k].y - c.y) * pxPerUnit;
      if (flip) x = -x;
      out[k] = { x: cx + x * cos - y * sin, y: cy + x * sin + y * cos };
    });
    return out;
  }

  function pairPx(leftPts, rightPts) {
    var ext = Math.max(maxExtent(leftPts), maxExtent(rightPts), 0.01);
    return Math.min(36, 128 / ext);
  }

  function emptyMarks() {
    return {
      sideTicks: { AB: 0, BC: 0, CA: 0 },
      angleTicks: { A: 0, B: 0, C: 0 },
      rightAt: null,
      labels: {},
    };
  }

  function pose() {
    return {
      rot: (Math.random() - 0.5) * 0.7,
      flip: Math.random() < 0.42,
    };
  }

  function makePair(type) {
    var L = emptyMarks();
    var R = emptyMarks();
    var leftSrc;
    var rightSrc;
    var id = type.id;

    if (id === "sss") {
      leftSrc = rightSrc = triangleFromSSS(5.2, 6.5, 7.1);
      L.sideTicks = { AB: 1, BC: 2, CA: 3 };
      R.sideTicks = { AB: 1, BC: 2, CA: 3 };
    } else if (id === "sas") {
      leftSrc = rightSrc = triangleFromSAS(3.6, deg(52), 4.8);
      L.sideTicks = { CA: 1, AB: 2, BC: 0 };
      L.angleTicks.A = 1;
      R.sideTicks = { CA: 1, AB: 2, BC: 0 };
      R.angleTicks.A = 1;
    } else if (id === "asa") {
      leftSrc = rightSrc = triangleFromASA(deg(48), 5.4, deg(58));
      L.angleTicks = { A: 1, B: 2, C: 0 };
      L.sideTicks.AB = 1;
      R.angleTicks = { A: 1, B: 2, C: 0 };
      R.sideTicks.AB = 1;
    } else if (id === "aas") {
      leftSrc = rightSrc = triangleFromAAS(deg(46), deg(62), 5.8);
      L.angleTicks = { A: 1, B: 2, C: 0 };
      L.sideTicks.BC = 1;
      R.angleTicks = { A: 1, B: 2, C: 0 };
      R.sideTicks.BC = 1;
    } else if (id === "rhs") {
      leftSrc = rightSrc = triangleFromRHS(5, 3);
      L.rightAt = "B";
      R.rightAt = "B";
      L.sideTicks = { CA: 2, AB: 1, BC: 0 };
      R.sideTicks = { CA: 2, AB: 1, BC: 0 };
    } else if (id === "ssa") {
      leftSrc = rightSrc = triangleFromSSA(5.4, deg(38), 4.2, false);
      L.sideTicks = { AB: 1, BC: 2, CA: 0 };
      L.angleTicks.A = 1;
      R.sideTicks = { AB: 1, BC: 2, CA: 0 };
      R.angleTicks.A = 1;
    } else if (id === "aaa") {
      leftSrc = triangleFromASA(deg(50), 4.2, deg(60));
      rightSrc = triangleFromASA(deg(50), 6.8, deg(60));
      L.angleTicks = { A: 1, B: 2, C: 3 };
      R.angleTicks = { A: 1, B: 2, C: 3 };
    } else if (id === "noncorr") {
      leftSrc = triangleFromSAS(3.5, deg(50), 4.6);
      rightSrc = triangleFromNoncorr(4.6, 3.5, deg(50));
      L.sideTicks = { CA: 1, AB: 2, BC: 0 };
      L.angleTicks.A = 1;
      R.sideTicks = { CA: 1, AB: 2, BC: 0 };
      R.angleTicks.B = 1;
    } else if (id === "aa") {
      leftSrc = triangleFromASA(deg(48), 4.4, deg(64));
      rightSrc = triangleFromASA(deg(48), 7.0, deg(64));
      L.angleTicks = { A: 1, B: 2, C: 0 };
      R.angleTicks = { A: 1, B: 2, C: 0 };
    } else if (id === "sssprop") {
      leftSrc = triangleFromSSS(3, 4, 5);
      rightSrc = triangleFromSSS(6, 8, 10);
      L.rightAt = "B";
      R.rightAt = "B";
      L.labels = { AB: "3", BC: "4", CA: "5" };
      R.labels = { AB: "6", BC: "8", CA: "10" };
    } else if (id === "sasprop") {
      leftSrc = triangleFromSAS(3, deg(54), 4);
      rightSrc = triangleFromSAS(6, deg(54), 8);
      L.labels = { CA: "3", AB: "4" };
      L.angleTicks.A = 1;
      R.labels = { CA: "6", AB: "8" };
      R.angleTicks.A = 1;
    } else if (id === "ssaprop") {
      leftSrc = triangleFromSSA(5, deg(40), 4, false);
      rightSrc = triangleFromSSA(10, deg(40), 8, true);
      L.labels = { AB: "5", BC: "4" };
      L.angleTicks.A = 1;
      R.labels = { AB: "10", BC: "8" };
      R.angleTicks.A = 1;
    } else if (id === "badprop") {
      leftSrc = triangleFromSSS(3, 4, 5);
      rightSrc = triangleFromSSS(6, 8, 12);
      L.rightAt = "B";
      L.labels = { AB: "3", BC: "4", CA: "5" };
      R.labels = { AB: "6", BC: "8", CA: "12" };
    } else {
      leftSrc = rightSrc = triangleFromSSS(5, 6, 7);
    }

    var px = pairPx(leftSrc, rightSrc);
    var pL = pose();
    var pR = pose();
    return {
      left: { pts: placePts(leftSrc, 250, 225, pL.rot, false, px), marks: L },
      right: { pts: placePts(rightSrc, 710, 225, pR.rot, pR.flip, px), marks: R },
    };
  }

  function nextItem() {
    var type = nextType();
    lastId = type.id;
    persistLearn();
    var pair = makePair(type);
    return {
      id: type.id,
      family: type.family,
      accept: type.accept,
      left: pair.left,
      right: pair.right,
    };
  }

  function hearts() {
    var i;
    var out = "";
    for (i = 0; i < MAX_LIVES; i++) out += i < lives ? "♥" : "♡";
    return out;
  }

  function updateHud() {
    setText("hud-score", String(score));
    setText("hud-combo", "x" + combo);
    setText("hud-lives", hearts());
  }

  function updateBanner() {
    var node = el("factory-target");
    if (!node || !item) return;
    node.textContent = t("game.factory.target." + item.family);
  }

  function setFeedback(msg, ok) {
    var node = el("factory-feedback");
    if (!node) return;
    node.textContent = msg || "";
    node.classList.toggle("is-ok", !!ok && !!msg);
    node.classList.toggle("is-bad", !ok && !!msg);
  }

  function showToast(msg, ok) {
    var toast = el("game-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle("is-ok", !!ok);
    toast.classList.add("is-visible");
  }

  function hideToast() {
    var toast = el("game-toast");
    if (toast) toast.classList.remove("is-visible");
  }

  function setNextHidden(hidden) {
    var next = el("btn-line-next");
    if (next) next.hidden = hidden;
  }

  function setOverlay(visible, title, msg, showReview) {
    var overlay = el("game-overlay");
    if (!overlay) return;
    overlay.classList.toggle("is-visible", visible);
    if (title) setText("overlay-title", title);
    if (msg) setText("overlay-msg", msg);
    var review = el("btn-review-comics");
    if (review) review.hidden = !showReview;
    var playC = el("btn-play-centres");
    if (playC) playC.hidden = true;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (barRaf) {
      cancelAnimationFrame(barRaf);
      barRaf = null;
    }
  }

  function pulseBar() {
    var bar = el("factory-timer-bar");
    if (!bar || !running || locked) return;
    var used = (Date.now() - timerStarted) / (TIME_LIMIT * 1000);
    bar.style.width = Math.max(0, 100 - used * 100) + "%";
    barRaf = requestAnimationFrame(pulseBar);
  }

  function startTimer() {
    stopTimer();
    timeLeft = TIME_LIMIT;
    timerStarted = Date.now();
    var bar = el("factory-timer-bar");
    if (bar) bar.style.width = "100%";
    pulseBar();
    timerId = setInterval(function () {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 1000);
  }

  function drawSeg(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawTicks(a, b, n) {
    if (!n) return;
    var along = sub(b, a);
    var perp = norm({ x: -along.y, y: along.x });
    var i;
    for (i = 0; i < n; i++) {
      var u = 0.42 + (i - (n - 1) / 2) * 0.08;
      var p = { x: a.x + along.x * u, y: a.y + along.y * u };
      ctx.beginPath();
      ctx.moveTo(p.x - perp.x * 7, p.y - perp.y * 7);
      ctx.lineTo(p.x + perp.x * 7, p.y + perp.y * 7);
      ctx.stroke();
    }
  }

  function drawRight(corner, p, q) {
    var u = norm(sub(p, corner));
    var v = norm(sub(q, corner));
    var s = 14;
    ctx.beginPath();
    ctx.moveTo(corner.x + u.x * s, corner.y + u.y * s);
    ctx.lineTo(corner.x + u.x * s + v.x * s, corner.y + u.y * s + v.y * s);
    ctx.lineTo(corner.x + v.x * s, corner.y + v.y * s);
    ctx.stroke();
  }

  function drawAngleTicks(V, P, Q, n) {
    if (!n) return;
    var a0 = Math.atan2(P.y - V.y, P.x - V.x);
    var a1 = Math.atan2(Q.y - V.y, Q.x - V.x);
    var d = a1 - a0;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    var r = 22;
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, a0, a0 + d, d < 0);
    ctx.stroke();
    var midA = a0 + d / 2;
    var i;
    for (i = 0; i < n; i++) {
      var ang = midA + (i - (n - 1) / 2) * 0.12;
      ctx.beginPath();
      ctx.moveTo(V.x + Math.cos(ang) * (r - 5), V.y + Math.sin(ang) * (r - 5));
      ctx.lineTo(V.x + Math.cos(ang) * (r + 5), V.y + Math.sin(ang) * (r + 5));
      ctx.stroke();
    }
  }

  function outward(v, p, q) {
    var u = norm(sub(p, v));
    var w = norm(sub(q, v));
    var b = add(u, w);
    if (Math.hypot(b.x, b.y) < 0.15) {
      return norm({ x: -u.y, y: u.x });
    }
    return norm({ x: -b.x, y: -b.y });
  }

  function clampLabel(p) {
    return {
      x: Math.max(14, Math.min(width - 14, p.x)),
      y: Math.max(16, Math.min(height - 14, p.y)),
    };
  }

  function vertexLabelPos(v, p, q, extra) {
    var d = outward(v, p, q);
    var gap = 24 + extra;
    return clampLabel({ x: v.x + d.x * gap, y: v.y + d.y * gap });
  }

  function drawLabel(a, b, text, inside) {
    var p = mid(a, b);
    var n = norm({ x: -(b.y - a.y), y: b.x - a.x });
    var away = sub(p, inside);
    if (n.x * away.x + n.y * away.y < 0) {
      n = { x: -n.x, y: -n.y };
    }
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "700 13px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, p.x + n.x * 16, p.y + n.y * 16);
  }

  function drawVertexLetters(pts, marks) {
    var extra = { A: 0, B: 0, C: 0 };
    if (marks.angleTicks.A) extra.A += 12;
    if (marks.angleTicks.B) extra.B += 12;
    if (marks.angleTicks.C) extra.C += 12;
    if (marks.rightAt === "A") extra.A += 8;
    if (marks.rightAt === "B") extra.B += 8;
    if (marks.rightAt === "C") extra.C += 8;
    var pos = {
      A: vertexLabelPos(pts.A, pts.B, pts.C, extra.A),
      B: vertexLabelPos(pts.B, pts.A, pts.C, extra.B),
      C: vertexLabelPos(pts.C, pts.A, pts.B, extra.C),
    };
    var keys = ["A", "B", "C"];
    keys.forEach(function (a) {
      keys.forEach(function (b) {
        if (a >= b) return;
        var dx = pos[a].x - pos[b].x;
        var dy = pos[a].y - pos[b].y;
        var d = Math.hypot(dx, dy);
        if (d < 22 && d > 0.01) {
          var push = (22 - d) / 2;
          pos[a] = clampLabel({ x: pos[a].x + (dx / d) * push, y: pos[a].y + (dy / d) * push });
          pos[b] = clampLabel({ x: pos[b].x - (dx / d) * push, y: pos[b].y - (dy / d) * push });
        }
      });
    });
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 15px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    keys.forEach(function (k) {
      ctx.fillText(k, pos[k].x, pos[k].y);
    });
  }

  function drawOne(tri) {
    var A = tri.pts.A;
    var B = tri.pts.B;
    var C = tri.pts.C;
    var m = tri.marks;
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(34, 211, 238, 0.06)";
    ctx.fill();

    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 1.8;
    drawTicks(A, B, m.sideTicks.AB);
    drawTicks(B, C, m.sideTicks.BC);
    drawTicks(C, A, m.sideTicks.CA || m.sideTicks.AC);
    drawAngleTicks(A, B, C, m.angleTicks.A);
    drawAngleTicks(B, A, C, m.angleTicks.B);
    drawAngleTicks(C, A, B, m.angleTicks.C);
    if (m.rightAt === "A") drawRight(A, B, C);
    if (m.rightAt === "B") drawRight(B, A, C);
    if (m.rightAt === "C") drawRight(C, A, B);
    if (m.labels.AB) drawLabel(A, B, m.labels.AB, C);
    if (m.labels.BC) drawLabel(B, C, m.labels.BC, A);
    if (m.labels.CA) drawLabel(C, A, m.labels.CA, B);
    if (m.labels.AC) drawLabel(A, C, m.labels.AC, B);
    drawVertexLetters({ A: A, B: B, C: C }, m);
  }

  function drawBoard() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#050814";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
    ctx.lineWidth = 1;
    var i;
    for (i = 0; i <= width; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, height);
      ctx.stroke();
    }
    for (i = 0; i <= height; i += 28) {
      ctx.beginPath();
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(width, i + 0.5);
      ctx.stroke();
    }
    if (!item) return;
    drawOne(item.left);
    drawOne(item.right);
    ctx.fillStyle = "#67e8f9";
    ctx.font = "700 28px Fraunces, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(item.family === "congruent" ? "≅ ?" : "~ ?", width / 2, 36);
  }

  function setButtons(on) {
    var a = el("btn-factory-accept");
    var r = el("btn-factory-reject");
    if (a) a.disabled = !on;
    if (r) r.disabled = !on;
  }

  function loadItem() {
    locked = false;
    if (running) questionsAsked += 1;
    item = nextItem();
    hideToast();
    setNextHidden(true);
    setFeedback("", true);
    updateBanner();
    updateHud();
    drawBoard();
    setButtons(true);
    if (running) startTimer();
  }

  function goNext() {
    if (!locked) return;
    if (lives <= 0) {
      gameOver();
      return;
    }
    if (running) loadItem();
  }

  function gameOver() {
    running = false;
    locked = true;
    stopTimer();
    setButtons(false);
    setNextHidden(true);
    setOverlay(true, t("game.over"), t("game.factory.overMsg") + " " + t("game.score") + ": " + score, true);
  }

  function resolve(accepted) {
    if (!running || locked || !item) return;
    locked = true;
    stopTimer();
    setButtons(false);
    var correct = accepted === item.accept;
    noteResult(correct);
    var why = t("game.factory.why." + item.id);
    if (correct) {
      score += combo;
      combo += 1;
      setFeedback(t("game.factory.ok") + " " + why, true);
      showToast(t("game.factory.ok") + " " + why, true);
    } else {
      lives -= 1;
      combo = 1;
      setFeedback(t("game.factory.miss") + " " + why, false);
      showToast(t("game.factory.miss") + " " + why, false);
    }
    updateHud();
    setNextHidden(false);
  }

  function onTimeout() {
    if (!running || locked) return;
    locked = true;
    setButtons(false);
    lives -= 1;
    combo = 1;
    noteResult(false);
    var why = item ? t("game.factory.why." + item.id) : "";
    setFeedback(t("game.factory.timeout") + " " + why, false);
    showToast(t("game.factory.timeout") + " " + why, false);
    updateHud();
    setNextHidden(false);
  }

  function startRound() {
    score = 0;
    combo = 1;
    lives = MAX_LIVES;
    running = true;
    locked = false;
    setOverlay(false);
    loadItem();
  }

  function onKey(evt) {
    var k = evt.key;
    if (locked && (k === "Enter" || k === "n" || k === "N")) {
      evt.preventDefault();
      goNext();
      return;
    }
    if (!running || locked) return;
    if (k === "a" || k === "A" || k === "ArrowLeft") {
      evt.preventDefault();
      resolve(true);
    } else if (k === "d" || k === "D" || k === "ArrowRight") {
      evt.preventDefault();
      resolve(false);
    }
  }

  function bind(target, type, fn, opts) {
    if (!target) return;
    target.addEventListener(type, fn, opts);
    listeners.push({ target: target, type: type, fn: fn, opts: opts });
  }

  function unbindAll() {
    listeners.forEach(function (entry) {
      entry.target.removeEventListener(entry.type, entry.fn, entry.opts);
    });
    listeners = [];
  }

  function init() {
    destroy();
    canvas = el("triangle-inspector-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    running = false;
    loadLearn();
    item = nextItem();
    updateBanner();
    updateHud();
    drawBoard();
    setButtons(false);
    hideToast();
    setNextHidden(true);
    setFeedback("", true);
    setOverlay(true, t("game.ready"), t("game.readyMsg.jm28.factory"), false);

    bind(el("btn-start"), "click", startRound);
    bind(el("btn-line-next"), "click", goNext);
    bind(el("btn-factory-accept"), "click", function () {
      resolve(true);
    });
    bind(el("btn-factory-reject"), "click", function () {
      resolve(false);
    });
    bind(el("btn-review-comics"), "click", function () {
      location.hash = "comics";
    });
    bind(window, "keydown", onKey);
  }

  function destroy() {
    stopTimer();
    unbindAll();
    running = false;
    locked = false;
    score = 0;
    combo = 1;
    lives = MAX_LIVES;
    timeLeft = TIME_LIMIT;
    item = null;
    canvas = null;
    ctx = null;
  }

  function onShow() {
    if (ctx) drawBoard();
  }

  return {
    init: init,
    destroy: destroy,
    onShow: onShow,
  };
})();
