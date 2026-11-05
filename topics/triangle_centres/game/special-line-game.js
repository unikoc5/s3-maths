window.SpecialLineGame = (function () {
  var TOTAL = 10;
  var HANDLE_TOL = 14;
  var ANGLE_TOL = (6 * Math.PI) / 180;
  var TYPES = ["median", "altitude", "bisector", "perp"];
  var NAMES = ["A", "B", "C"];

  var canvas, ctx;
  var width = 900;
  var height = 520;
  var running = false;
  var dragging = false;
  var solved = false;
  var hintOn = false;
  var firstTry = true;
  var score = 0;
  var missionIndex = 0;
  var missions = [];
  var triangle = null;
  var handleT = 0.2;
  var handleAngle = 0;
  var showExt = false;
  var listeners = [];

  function t(key) {
    return window.I18n && window.I18n.t ? window.I18n.t(key) : key;
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
  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }
  function len(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }
  function dist(a, b) {
    return len(sub(a, b));
  }
  function norm(a) {
    var L = len(a) || 1;
    return { x: a.x / L, y: a.y / L };
  }
  function lerp(a, b, u) {
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  }
  function mid(a, b) {
    return lerp(a, b, 0.5);
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function projectT(p, a, b) {
    var v = sub(b, a);
    var d2 = dot(v, v);
    if (d2 < 1e-8) return 0;
    return dot(sub(p, a), v) / d2;
  }

  function pointOn(a, b, u) {
    return lerp(a, b, u);
  }

  function footOfPerp(p, a, b) {
    return pointOn(a, b, projectT(p, a, b));
  }

  function angleAt(p, q, r) {
    var u = norm(sub(p, q));
    var v = norm(sub(r, q));
    return Math.acos(clamp(dot(u, v), -1, 1));
  }

  function angDiff(a, b) {
    var d = Math.abs(a - b) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    return Math.min(d, Math.PI - d);
  }

  function pts() {
    return triangle;
  }

  function vertex(name) {
    return pts()[name];
  }

  function opposite(name) {
    if (name === "A") return ["B", "C"];
    if (name === "B") return ["A", "C"];
    return ["A", "B"];
  }

  function sideEnds(side) {
    return [side.charAt(0), side.charAt(1)];
  }

  function randomTriangle() {
    var pad = 80;
    var i;
    for (i = 0; i < 120; i++) {
      var raw = [
        { x: pad + Math.random() * (width - 2 * pad), y: pad + Math.random() * (height - 2 * pad) },
        { x: pad + Math.random() * (width - 2 * pad), y: pad + Math.random() * (height - 2 * pad) },
        { x: pad + Math.random() * (width - 2 * pad), y: pad + Math.random() * (height - 2 * pad) },
      ];
      raw.sort(function (p, q) {
        return p.y - q.y;
      });
      var A = raw[0];
      var left = raw[1].x < raw[2].x ? raw[1] : raw[2];
      var right = raw[1].x < raw[2].x ? raw[2] : raw[1];
      var B = left;
      var C = right;
      var ab = dist(A, B);
      var bc = dist(B, C);
      var ca = dist(C, A);
      var sides = [ab, bc, ca].sort(function (p, q) {
        return p - q;
      });
      if (sides[0] < 140) continue;
      if (sides[1] / sides[0] < 1.14 || sides[2] / sides[1] < 1.1) continue;
      var angA = angleAt(B, A, C);
      var angB = angleAt(A, B, C);
      var angC = angleAt(A, C, B);
      var minA = Math.min(angA, angB, angC);
      var maxA = Math.max(angA, angB, angC);
      if (minA < (28 * Math.PI) / 180 || maxA > (128 * Math.PI) / 180) continue;
      return { A: A, B: B, C: C };
    }
    return {
      A: { x: 450, y: 90 },
      B: { x: 170, y: 430 },
      C: { x: 760, y: 400 },
    };
  }

  function buildMissions() {
    var list = [];
    var typeI = 0;
    var nameI = 0;
    var i;
    for (i = 0; i < TOTAL; i++) {
      var type = TYPES[typeI % TYPES.length];
      var v = NAMES[nameI % 3];
      typeI++;
      nameI++;
      if (type === "perp") {
        var ends = opposite(v);
        list.push({ type: type, vertex: v, side: ends[0] + ends[1] });
      } else {
        var opp = opposite(v);
        list.push({ type: type, vertex: v, side: opp[0] + opp[1] });
      }
    }
    for (i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function mission() {
    return missions[missionIndex] || null;
  }

  function sidePoints(m) {
    var ends = sideEnds(m.side);
    return [vertex(ends[0]), vertex(ends[1])];
  }

  function targetPoint(m) {
    var V = vertex(m.vertex);
    var s = sidePoints(m);
    if (m.type === "median") return mid(s[0], s[1]);
    if (m.type === "altitude") return footOfPerp(V, s[0], s[1]);
    if (m.type === "bisector") {
      var len0 = dist(V, s[0]);
      var len1 = dist(V, s[1]);
      return lerp(s[0], s[1], len0 / (len0 + len1));
    }
    return mid(s[0], s[1]);
  }

  function targetAngle(m) {
    var s = sidePoints(m);
    var dir = sub(s[1], s[0]);
    return Math.atan2(-dir.x, dir.y);
  }

  function altitudeFootT(m) {
    var s = sidePoints(m);
    return projectT(targetPoint(m), s[0], s[1]);
  }

  function altitudeOutside(m) {
    if (!m || m.type !== "altitude") return false;
    var u = altitudeFootT(m);
    return u < -0.01 || u > 1.01;
  }

  function slideRange(m) {
    if (m.type !== "altitude") return { tMin: 0, tMax: 1 };
    var u = altitudeFootT(m);
    return {
      tMin: Math.min(-0.2, u - 0.2),
      tMax: Math.max(1.2, u + 0.2),
    };
  }

  function perpDir() {
    return { x: Math.cos(handleAngle), y: Math.sin(handleAngle) };
  }

  function handlePoint(m) {
    var s = sidePoints(m);
    if (m.type === "perp") {
      return mid(s[0], s[1]);
    }
    var range = slideRange(m);
    return pointOn(s[0], s[1], clamp(handleT, range.tMin, range.tMax));
  }

  function anchorPoint(m) {
    if (m.type === "perp") {
      var s = sidePoints(m);
      return mid(s[0], s[1]);
    }
    return vertex(m.vertex);
  }

  function resetHandle(m) {
    var target = targetPoint(m);
    var s = sidePoints(m);
    if (m.type === "perp") {
      var goal = targetAngle(m);
      handleAngle = goal + ((Math.random() < 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.7));
      return;
    }
    var goalT = projectT(target, s[0], s[1]);
    handleT = goalT < 0.5 ? 0.88 : 0.12;
  }

  function isCorrect(m) {
    if (m.type === "perp") {
      return angDiff(handleAngle, targetAngle(m)) <= ANGLE_TOL;
    }
    return dist(handlePoint(m), targetPoint(m)) <= HANDLE_TOL;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = el(id);
    if (node) node.textContent = value;
  }

  function updateHud() {
    setText("hud-score", String(score));
    setText("hud-progress", (running ? missionIndex + 1 : missionIndex) + " / " + TOTAL);
  }

  function missionLabel(m) {
    var typeName = t("game.line." + m.type);
    if (m.type === "perp") {
      return t("game.line.missionPerp")
        .replace("{type}", typeName)
        .replace("{side}", m.side);
    }
    return t("game.line.missionVertex")
      .replace("{type}", typeName)
      .replace("{v}", m.vertex)
      .replace("{side}", m.side);
  }

  function hintText(m) {
    return t("game.line.hint." + m.type);
  }

  function updateBanner() {
    var banner = el("line-mission-banner");
    if (!banner || !mission()) return;
    banner.innerHTML =
      '<span class="line-mission-kicker">' +
      t("game.line.mission") +
      "</span> " +
      missionLabel(mission());
    var hint = el("line-mission-hint");
    if (hint) {
      hint.hidden = !hintOn;
      hint.textContent = hintOn ? hintText(mission()) : "";
    }
  }

  function showToast(msg, ok) {
    var toast = el("game-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle("is-ok", !!ok);
    toast.classList.add("is-visible");
    setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 1600);
  }

  function setOverlay(visible, title, msg, showReview, showCentres) {
    var overlay = el("game-overlay");
    if (!overlay) return;
    overlay.classList.toggle("is-visible", visible);
    if (title) setText("overlay-title", title);
    if (msg) setText("overlay-msg", msg);
    var review = el("btn-review-comics");
    if (review) review.hidden = !showReview;
    var playC = el("btn-play-centres");
    if (playC) playC.hidden = !showCentres;
  }

  function drawTick(p, along, n) {
    var t1 = add(p, scale(n, 7));
    var t2 = add(p, scale(n, -7));
    ctx.beginPath();
    ctx.moveTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.stroke();
  }

  function triangleCentroid() {
    return {
      x: (triangle.A.x + triangle.B.x + triangle.C.x) / 3,
      y: (triangle.A.y + triangle.B.y + triangle.C.y) / 3,
    };
  }

  function drawAltitudeRightAngle(foot, V, s0, s1) {
    var towardV = sub(V, foot);
    if (len(towardV) < 1e-6) return;
    var sideDir = norm(sub(s1, s0));
    var centre = triangleCentroid();
    if (dist(add(foot, sideDir), centre) > dist(add(foot, scale(sideDir, -1)), centre)) {
      sideDir = scale(sideDir, -1);
    }
    drawRightAngle(foot, sideDir, towardV);
  }

  function drawRightAngle(corner, alongSide, towardVertex) {
    var u = norm(alongSide);
    var v = norm(towardVertex);
    var s = 16;
    var p1 = add(corner, scale(u, s));
    var p2 = add(p1, scale(v, s));
    var p3 = add(corner, scale(v, s));
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();
  }

  function drawEqualArcs(V, L, R) {
    var r = 28;
    var a0 = Math.atan2(L.y - V.y, L.x - V.x);
    var a1 = Math.atan2(R.y - V.y, R.x - V.x);
    var midA = Math.atan2(handlePoint(mission()).y - V.y, handlePoint(mission()).x - V.x);
    function sweep(from, to) {
      var d = to - from;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      ctx.beginPath();
      ctx.arc(V.x, V.y, r, from, from + d, d < 0);
      ctx.stroke();
    }
    sweep(a0, midA);
    sweep(midA, a1);
  }

  function drawMarkings(m, color) {
    var V = vertex(m.vertex);
    var s = sidePoints(m);
    var foot = targetPoint(m);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    if (m.type === "median" || m.type === "perp") {
      var n = norm({ x: -(s[1].y - s[0].y), y: s[1].x - s[0].x });
      drawTick(lerp(s[0], foot, 0.5), sub(s[1], s[0]), n);
      drawTick(lerp(foot, s[1], 0.5), sub(s[1], s[0]), n);
    }
    if (m.type === "altitude") {
      drawAltitudeRightAngle(foot, V, s[0], s[1]);
    }
    if (m.type === "bisector") {
      drawEqualArcs(V, s[0], s[1]);
    }
    if (m.type === "perp") {
      var M = mid(s[0], s[1]);
      var along = sub(s[1], s[0]);
      var toward = { x: Math.cos(targetAngle(m)), y: Math.sin(targetAngle(m)) };
      drawRightAngle(M, along, toward);
    }
  }

  function drawAltitudeExtension(m) {
    if (!altitudeOutside(m)) return;
    var s = sidePoints(m);
    var foot = targetPoint(m);
    var tFoot = projectT(foot, s[0], s[1]);
    var end = tFoot < 0 ? s[0] : s[1];
    var h = handlePoint(m);
    var tH = projectT(h, s[0], s[1]);
    var far = foot;
    if (tFoot < 0 && tH < tFoot) far = h;
    if (tFoot > 1 && tH > tFoot) far = h;
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(far.x, far.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    if (!ctx || !triangle) return;
    var m = mission();
    if (!m) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1a1f2e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(triangle.A.x, triangle.A.y);
    ctx.lineTo(triangle.B.x, triangle.B.y);
    ctx.lineTo(triangle.C.x, triangle.C.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(61, 126, 166, 0.08)";
    ctx.fill();

    if (showExt) {
      drawAltitudeExtension(m);
    }

    NAMES.forEach(function (name) {
      var p = vertex(name);
      var c = { x: (triangle.A.x + triangle.B.x + triangle.C.x) / 3, y: (triangle.A.y + triangle.B.y + triangle.C.y) / 3 };
      var off = norm(sub(p, c));
      ctx.fillStyle = "#1a1f2e";
      ctx.font = "700 20px 'DM Sans', sans-serif";
      ctx.fillText(name, p.x + off.x * 22 - 7, p.y + off.y * 22 + 7);
    });

    if (hintOn && !solved) {
      drawMarkings(m, "#2d6a4f");
    }

    var a = anchorPoint(m);
    var h = handlePoint(m);
    var dir = m.type === "perp" ? perpDir() : dist(h, a) > 0.5 ? norm(sub(h, a)) : { x: 1, y: 0 };
    var lineColor = solved ? "#2d6a4f" : "#c45c26";
    var gap = 14;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "butt";
    ctx.setLineDash(m.type === "perp" ? [8, 6] : []);
    ctx.beginPath();
    if (m.type === "perp") {
      var span = Math.max(width, height);
      ctx.moveTo(a.x - dir.x * span, a.y - dir.y * span);
      ctx.lineTo(a.x - dir.x * gap, a.y - dir.y * gap);
      ctx.moveTo(a.x + dir.x * gap, a.y + dir.y * gap);
      ctx.lineTo(a.x + dir.x * span, a.y + dir.y * span);
    } else {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(h.x - dir.x * gap, h.y - dir.y * gap);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (solved) {
      drawMarkings(m, "#1b4332");
    }

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#5c6578";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(t(m.type === "perp" ? "game.line.rotate" : "game.line.drag"), 18, height - 16);
  }

  function canvasPoint(evt) {
    var rect = canvas.getBoundingClientRect();
    var src = evt.touches ? evt.touches[0] : evt;
    return {
      x: ((src.clientX - rect.left) / rect.width) * width,
      y: ((src.clientY - rect.top) / rect.height) * height,
    };
  }

  function moveHandle(p) {
    if (solved || !running) return;
    var m = mission();
    var s = sidePoints(m);
    if (m.type === "perp") {
      var M = mid(s[0], s[1]);
      handleAngle = Math.atan2(p.y - M.y, p.x - M.x);
    } else {
      var range = slideRange(m);
      handleT = clamp(projectT(p, s[0], s[1]), range.tMin, range.tMax);
    }
    draw();
  }

  function distToLine(p, origin, dir) {
    var w = sub(p, origin);
    return Math.abs(w.x * dir.y - w.y * dir.x);
  }

  function onPointerDown(evt) {
    if (!running || solved) return;
    var p = canvasPoint(evt);
    var m = mission();
    var hit = dist(p, handlePoint(m)) < 28;
    if (!hit && m.type === "perp") {
      hit = distToLine(p, anchorPoint(m), perpDir()) < 18;
    }
    if (hit) {
      dragging = true;
      evt.preventDefault();
    }
  }

  function onPointerMove(evt) {
    if (!dragging) return;
    evt.preventDefault();
    moveHandle(canvasPoint(evt));
  }

  function onPointerUp() {
    dragging = false;
  }

  function loadMission() {
    solved = false;
    hintOn = false;
    showExt = false;
    firstTry = true;
    triangle = randomTriangle();
    resetHandle(mission());
    el("btn-line-check").hidden = false;
    el("btn-line-next").hidden = true;
    updateBanner();
    updateHud();
    draw();
  }

  function startRound() {
    score = 0;
    missionIndex = 0;
    missions = buildMissions();
    running = true;
    setOverlay(false);
    loadMission();
  }

  function check() {
    if (!running || solved) return;
    var m = mission();
    if (!m) return;
    if (altitudeOutside(m)) showExt = true;
    if (isCorrect(m)) {
      solved = true;
      if (firstTry) score += 1;
      showToast(t("game.line.ok"), true);
      el("btn-line-check").hidden = true;
      el("btn-line-next").hidden = missionIndex >= TOTAL - 1;
      if (missionIndex >= TOTAL - 1) {
        running = false;
        missionIndex = TOTAL;
        if (window.JM28Games) window.JM28Games.unlockCentres();
        setOverlay(true, t("game.victory"), t("game.victoryMsg"), true, true);
      }
      updateHud();
      draw();
      return;
    }
    firstTry = false;
    hintOn = true;
    updateHud();
    updateBanner();
    showToast(t("game.line.miss"), false);
    draw();
  }

  function nextMission() {
    if (missionIndex < TOTAL - 1) {
      missionIndex += 1;
      loadMission();
    }
  }

  function bind(target, type, fn, opts) {
    if (!target) return;
    target.addEventListener(type, fn, opts);
    listeners.push({ target: target, type: type, fn: fn, opts: opts });
  }

  function unbindAll() {
    listeners.forEach(function (item) {
      item.target.removeEventListener(item.type, item.fn, item.opts);
    });
    listeners = [];
  }

  function init() {
    destroy();
    canvas = el("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    running = false;
    triangle = randomTriangle();
    missions = [{ type: "median", vertex: "A", side: "BC" }];
    missionIndex = 0;
    resetHandle(mission());
    updateBanner();
    updateHud();
    draw();
    setOverlay(true, t("game.ready"), t("game.readyMsg.jm28"), false);

    bind(el("btn-start"), "click", startRound);
    bind(el("btn-line-check"), "click", check);
    bind(el("btn-line-next"), "click", nextMission);
    bind(el("btn-review-comics"), "click", function () {
      location.hash = "comics";
    });
    bind(el("btn-play-centres"), "click", function () {
      if (window.JM28Games) window.JM28Games.switchTo("centres");
    });
    bind(canvas, "mousedown", onPointerDown);
    bind(window, "mousemove", onPointerMove);
    bind(window, "mouseup", onPointerUp);
    bind(canvas, "touchstart", onPointerDown, { passive: false });
    bind(window, "touchmove", onPointerMove, { passive: false });
    bind(window, "touchend", onPointerUp);
  }

  function destroy() {
    unbindAll();
    dragging = false;
    running = false;
    canvas = null;
    ctx = null;
  }

  function onShow() {
    if (ctx) draw();
  }

  return {
    init: init,
    destroy: destroy,
    onShow: onShow,
    _test: {
      type: function () {
        return mission() && mission().type;
      },
      snapCorrect: function () {
        var m = mission();
        if (!m) return;
        var s = sidePoints(m);
        if (m.type === "perp") {
          handleAngle = targetAngle(m);
        } else {
          handleT = projectT(targetPoint(m), s[0], s[1]);
        }
        draw();
      },
    },
  };
})();
