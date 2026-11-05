window.TriangleCentreGame = (function () {
  var TOTAL = 8;
  var HANDLE_TOL = 12;
  var ANGLE_TOL = (6 * Math.PI) / 180;
  var CENTRES = ["centroid", "orthocentre", "incentre", "circumcentre"];
  var NAMES = ["A", "B", "C"];
  var RING = { A: "#c45c26", B: "#2d6a4f", C: "#3d7ea6" };
  var CENTRE_MARK = { centroid: "G", orthocentre: "H", incentre: "I", circumcentre: "O" };

  var canvas, ctx;
  var width = 900;
  var height = 520;
  var running = false;
  var dragging = null;
  var solved = false;
  var hintOn = false;
  var firstTry = true;
  var score = 0;
  var missionIndex = 0;
  var missions = [];
  var triangle = null;
  var showExt = false;
  var listeners = [];
  var lines = {
    A: { t: 0.2, angle: 0 },
    B: { t: 0.2, angle: 0 },
    C: { t: 0.2, angle: 0 },
  };

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

  function lineIntersect(p1, d1, p2, d2) {
    var det = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(det) < 1e-8) return mid(p1, p2);
    var u = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / det;
    return add(p1, scale(d1, u));
  }

  function sameSide(p, q, a, b) {
    var ab = sub(b, a);
    var cp1 = ab.x * (p.y - a.y) - ab.y * (p.x - a.x);
    var cp2 = ab.x * (q.y - a.y) - ab.y * (q.x - a.x);
    return cp1 * cp2 >= 0;
  }

  function pointInTriangle(p) {
    if (!p || !triangle) return false;
    return (
      sameSide(p, triangle.A, triangle.B, triangle.C) &&
      sameSide(p, triangle.B, triangle.A, triangle.C) &&
      sameSide(p, triangle.C, triangle.A, triangle.B)
    );
  }

  function inCanvas(p, margin) {
    var m = margin == null ? 28 : margin;
    return p && p.x >= m && p.x <= width - m && p.y >= m && p.y <= height - m;
  }

  function vertex(name) {
    return triangle[name];
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

  function labelTriangle(p, q, r, rightPt) {
    var raw = [p, q, r];
    raw.sort(function (a, b) {
      return a.y - b.y;
    });
    var A = raw[0];
    var B = raw[1].x < raw[2].x ? raw[1] : raw[2];
    var C = raw[1].x < raw[2].x ? raw[2] : raw[1];
    var rightAt = null;
    if (rightPt === A) rightAt = "A";
    else if (rightPt === B) rightAt = "B";
    else if (rightPt === C) rightAt = "C";
    return { A: A, B: B, C: C, rightAt: rightAt };
  }

  function rightTriangle() {
    var pad = 88;
    var i;
    for (i = 0; i < 80; i++) {
      var R = {
        x: pad + Math.random() * (width - 2 * pad),
        y: pad + Math.random() * (height - 2 * pad),
      };
      var base = Math.random() * Math.PI * 2;
      var len1 = 190 + Math.random() * 150;
      var len2 = 190 + Math.random() * 150;
      var P = {
        x: R.x + Math.cos(base) * len1,
        y: R.y + Math.sin(base) * len1,
      };
      var Q = {
        x: R.x + Math.cos(base + Math.PI / 2) * len2,
        y: R.y + Math.sin(base + Math.PI / 2) * len2,
      };
      if (!inCanvas(P, pad) || !inCanvas(Q, pad) || !inCanvas(R, pad)) continue;
      if (dist(P, Q) < 180) continue;
      var tri = labelTriangle(P, Q, R, R);
      if (!tri.rightAt) continue;
      return tri;
    }
    return null;
  }

  function pickTriangle() {
    var m = mission();
    var needsOutsideCentre = m && (m.centre === "orthocentre" || m.centre === "circumcentre");
    var wantRight = Math.random() < 0.42;
    var i;
    var last = null;
    if (wantRight) {
      for (i = 0; i < 80; i++) {
        last = rightTriangle();
        if (!last) continue;
        triangle = last;
        if (!needsOutsideCentre || inCanvas(geoCentre(), 32)) return last;
      }
    }
    for (i = 0; i < 180; i++) {
      last = randomTriangle();
      triangle = last;
      if (!needsOutsideCentre) return last;
      if (inCanvas(geoCentre(), 32)) return last;
    }
    return last || randomTriangle();
  }

  function buildMissions() {
    var list = [];
    CENTRES.forEach(function (centre) {
      list.push({ centre: centre });
      list.push({ centre: centre });
    });
    var i;
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

  function lineType(centre) {
    if (centre === "centroid") return "median";
    if (centre === "orthocentre") return "altitude";
    if (centre === "incentre") return "bisector";
    return "perp";
  }

  function lineMission(name) {
    var m = mission();
    var opp = opposite(name);
    return {
      type: lineType(m.centre),
      vertex: name,
      side: opp[0] + opp[1],
    };
  }

  function sidePoints(lm) {
    var ends = sideEnds(lm.side);
    return [vertex(ends[0]), vertex(ends[1])];
  }

  function targetPoint(lm) {
    var V = vertex(lm.vertex);
    var s = sidePoints(lm);
    if (lm.type === "median") return mid(s[0], s[1]);
    if (lm.type === "altitude") return footOfPerp(V, s[0], s[1]);
    if (lm.type === "bisector") {
      var len0 = dist(V, s[0]);
      var len1 = dist(V, s[1]);
      return lerp(s[0], s[1], len0 / (len0 + len1));
    }
    return mid(s[0], s[1]);
  }

  function targetAngle(lm) {
    var s = sidePoints(lm);
    var dir = sub(s[1], s[0]);
    return Math.atan2(-dir.x, dir.y);
  }

  function altitudeFootT(lm) {
    var s = sidePoints(lm);
    return projectT(targetPoint(lm), s[0], s[1]);
  }

  function altitudeOutside(lm) {
    if (!lm || lm.type !== "altitude") return false;
    var u = altitudeFootT(lm);
    return u < -0.01 || u > 1.01;
  }

  function anyAltitudeOutside() {
    if (!mission() || mission().centre !== "orthocentre") return false;
    return NAMES.some(function (name) {
      return altitudeOutside(lineMission(name));
    });
  }

  function slideRange(lm) {
    if (lm.type !== "altitude") return { tMin: 0, tMax: 1 };
    var u = altitudeFootT(lm);
    return {
      tMin: Math.min(-0.2, u - 0.2),
      tMax: Math.max(1.2, u + 0.2),
    };
  }

  function perpDir(name) {
    return { x: Math.cos(lines[name].angle), y: Math.sin(lines[name].angle) };
  }

  function handlePoint(name) {
    var lm = lineMission(name);
    var s = sidePoints(lm);
    if (lm.type === "perp") return mid(s[0], s[1]);
    var range = slideRange(lm);
    return pointOn(s[0], s[1], clamp(lines[name].t, range.tMin, range.tMax));
  }

  function anchorPoint(name) {
    var lm = lineMission(name);
    if (lm.type === "perp") {
      var s = sidePoints(lm);
      return mid(s[0], s[1]);
    }
    return vertex(lm.vertex);
  }

  function resetHandles() {
    NAMES.forEach(function (name) {
      var lm = lineMission(name);
      var target = targetPoint(lm);
      var s = sidePoints(lm);
      if (lm.type === "perp") {
        var goal = targetAngle(lm);
        lines[name].angle = goal + ((Math.random() < 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.7));
        return;
      }
      var goalT = projectT(target, s[0], s[1]);
      lines[name].t = goalT < 0.5 ? 0.88 : 0.12;
    });
  }

  function isLineCorrect(name) {
    var lm = lineMission(name);
    if (lm.type === "perp") {
      return angDiff(lines[name].angle, targetAngle(lm)) <= ANGLE_TOL;
    }
    return dist(handlePoint(name), targetPoint(lm)) <= HANDLE_TOL;
  }

  function isCorrect() {
    return NAMES.every(isLineCorrect);
  }

  function snapLine(name) {
    var lm = lineMission(name);
    var s = sidePoints(lm);
    if (lm.type === "perp") {
      lines[name].angle = targetAngle(lm);
    } else {
      lines[name].t = projectT(targetPoint(lm), s[0], s[1]);
    }
  }

  function geoCentre() {
    var c = mission().centre;
    var A = triangle.A;
    var B = triangle.B;
    var C = triangle.C;
    if (c === "centroid") {
      return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    }
    if (c === "incentre") {
      var a = dist(B, C);
      var b = dist(A, C);
      var cLen = dist(A, B);
      var p = a + b + cLen;
      return { x: (a * A.x + b * B.x + cLen * C.x) / p, y: (a * A.y + b * B.y + cLen * C.y) / p };
    }
    if (c === "orthocentre") {
      var footA = targetPoint(lineMission("A"));
      var footB = targetPoint(lineMission("B"));
      return lineIntersect(A, sub(footA, A), B, sub(footB, B));
    }
    var mA = mid(B, C);
    var mB = mid(A, C);
    var dA = { x: Math.cos(targetAngle(lineMission("A"))), y: Math.sin(targetAngle(lineMission("A"))) };
    var dB = { x: Math.cos(targetAngle(lineMission("B"))), y: Math.sin(targetAngle(lineMission("B"))) };
    return lineIntersect(mA, dA, mB, dB);
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
    return t("game.centres.mission")
      .replace("{centre}", t("game.centre." + m.centre))
      .replace("{lines}", t("game.centres.lines." + m.centre));
  }

  function hintText(m) {
    return t("game.centres.hint." + m.centre);
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

  function drawTick(p, n) {
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

  function drawVertexRightAngle() {
    if (!triangle || !triangle.rightAt) return;
    var R = vertex(triangle.rightAt);
    var ends = opposite(triangle.rightAt);
    var v0 = sub(vertex(ends[0]), R);
    var v1 = sub(vertex(ends[1]), R);
    var centre = triangleCentroid();
    var inward = sub(centre, R);
    if (dot(v0, inward) < 0) v0 = scale(v0, -1);
    if (dot(v1, inward) < 0) v1 = scale(v1, -1);
    ctx.strokeStyle = "#1a1f2e";
    ctx.lineWidth = 2;
    drawRightAngle(R, v0, v1);
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

  function drawEqualArcs(name) {
    var lm = lineMission(name);
    var V = vertex(lm.vertex);
    var s = sidePoints(lm);
    var midPt = targetPoint(lm);
    var r = 28;
    var a0 = Math.atan2(s[0].y - V.y, s[0].x - V.x);
    var a1 = Math.atan2(s[1].y - V.y, s[1].x - V.x);
    var midA = Math.atan2(midPt.y - V.y, midPt.x - V.x);
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

  function drawMarkings(name, color) {
    var lm = lineMission(name);
    var V = vertex(lm.vertex);
    var s = sidePoints(lm);
    var foot = targetPoint(lm);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    if (lm.type === "median" || lm.type === "perp") {
      var n = norm({ x: -(s[1].y - s[0].y), y: s[1].x - s[0].x });
      drawTick(lerp(s[0], foot, 0.5), n);
      drawTick(lerp(foot, s[1], 0.5), n);
    }
    if (lm.type === "altitude") {
      drawAltitudeRightAngle(foot, V, s[0], s[1]);
    }
    if (lm.type === "bisector") {
      drawEqualArcs(name);
    }
    if (lm.type === "perp") {
      var M = mid(s[0], s[1]);
      var along = sub(s[1], s[0]);
      var toward = { x: Math.cos(targetAngle(lm)), y: Math.sin(targetAngle(lm)) };
      drawRightAngle(M, along, toward);
    }
  }

  function drawAltitudeExtension(name) {
    var lm = lineMission(name);
    if (!altitudeOutside(lm)) return;
    var s = sidePoints(lm);
    var foot = targetPoint(lm);
    var tFoot = projectT(foot, s[0], s[1]);
    var end = tFoot < 0 ? s[0] : s[1];
    var h = handlePoint(name);
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

  function shouldDrawFullLine(lm) {
    if (lm.type === "perp" || lm.type === "altitude") return true;
    if (!solved) return false;
    var c = geoCentre();
    return c && !pointInTriangle(c);
  }

  function drawLineThrough(origin, dir, gap) {
    var span = Math.max(width, height) * 1.25;
    ctx.moveTo(origin.x - dir.x * span, origin.y - dir.y * span);
    ctx.lineTo(origin.x - dir.x * gap, origin.y - dir.y * gap);
    ctx.moveTo(origin.x + dir.x * gap, origin.y + dir.y * gap);
    ctx.lineTo(origin.x + dir.x * span, origin.y + dir.y * span);
  }

  function drawConstruction(name) {
    var lm = lineMission(name);
    var a = anchorPoint(name);
    var h = handlePoint(name);
    var dir =
      lm.type === "perp"
        ? perpDir(name)
        : dist(h, a) > 0.5
          ? norm(sub(h, a))
          : { x: 1, y: 0 };
    var lineColor = solved ? "#2d6a4f" : RING[name];
    var gap = 9;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "butt";
    ctx.setLineDash(lm.type === "perp" ? [8, 6] : []);
    ctx.beginPath();
    if (shouldDrawFullLine(lm)) {
      drawLineThrough(h, dir, gap);
    } else {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(h.x - dir.x * gap, h.y - dir.y * gap);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHandle(name) {
    var h = handlePoint(name);
    var color = solved ? "#2d6a4f" : RING[name];
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    var c = {
      x: (triangle.A.x + triangle.B.x + triangle.C.x) / 3,
      y: (triangle.A.y + triangle.B.y + triangle.C.y) / 3,
    };
    var off = norm(sub(h, c));
    ctx.fillStyle = color;
    ctx.font = "700 12px 'DM Sans', sans-serif";
    ctx.fillText(name, h.x + off.x * 14 - 4, h.y + off.y * 14 + 4);
  }

  function drawCentreMark() {
    var p = geoCentre();
    if (!p) return;
    ctx.fillStyle = "#1b4332";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#1b4332";
    ctx.font = "700 16px 'DM Sans', sans-serif";
    ctx.fillText(CENTRE_MARK[mission().centre], p.x + 10, p.y - 8);
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
    drawVertexRightAngle();

    if (showExt) {
      NAMES.forEach(drawAltitudeExtension);
    }

    NAMES.forEach(function (name) {
      var p = vertex(name);
      var c = {
        x: (triangle.A.x + triangle.B.x + triangle.C.x) / 3,
        y: (triangle.A.y + triangle.B.y + triangle.C.y) / 3,
      };
      var off = norm(sub(p, c));
      ctx.fillStyle = "#1a1f2e";
      ctx.font = "700 20px 'DM Sans', sans-serif";
      ctx.fillText(name, p.x + off.x * 22 - 7, p.y + off.y * 22 + 7);
    });

    if (hintOn && !solved) {
      NAMES.forEach(function (name) {
        drawMarkings(name, "#2d6a4f");
      });
    }

    NAMES.forEach(drawConstruction);

    if (solved) {
      NAMES.forEach(function (name) {
        drawMarkings(name, "#1b4332");
      });
      drawCentreMark();
    }

    NAMES.forEach(drawHandle);

    ctx.fillStyle = "#5c6578";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(
      t(m.centre === "circumcentre" ? "game.centres.rotate" : "game.centres.drag"),
      18,
      height - 16
    );
  }

  function canvasPoint(evt) {
    var rect = canvas.getBoundingClientRect();
    var src = evt.touches ? evt.touches[0] : evt;
    return {
      x: ((src.clientX - rect.left) / rect.width) * width,
      y: ((src.clientY - rect.top) / rect.height) * height,
    };
  }

  function moveHandle(name, p) {
    if (solved || !running) return;
    var lm = lineMission(name);
    var s = sidePoints(lm);
    if (lm.type === "perp") {
      var M = mid(s[0], s[1]);
      lines[name].angle = Math.atan2(p.y - M.y, p.x - M.x);
    } else {
      var range = slideRange(lm);
      lines[name].t = clamp(projectT(p, s[0], s[1]), range.tMin, range.tMax);
    }
    draw();
  }

  function distToLine(p, origin, dir) {
    var w = sub(p, origin);
    return Math.abs(w.x * dir.y - w.y * dir.x);
  }

  function hitName(p) {
    var best = null;
    var bestD = 22;
    NAMES.forEach(function (name) {
      var d = dist(p, handlePoint(name));
      if (d < bestD) {
        bestD = d;
        best = name;
      }
    });
    if (best) return best;
    if (!mission() || mission().centre !== "circumcentre") return null;
    var lineBest = null;
    var lineD = 18;
    NAMES.forEach(function (name) {
      var d = distToLine(p, anchorPoint(name), perpDir(name));
      if (d < lineD) {
        lineD = d;
        lineBest = name;
      }
    });
    return lineBest;
  }

  function onPointerDown(evt) {
    if (!running || solved) return;
    var name = hitName(canvasPoint(evt));
    if (name) {
      dragging = name;
      evt.preventDefault();
    }
  }

  function onPointerMove(evt) {
    if (!dragging) return;
    evt.preventDefault();
    moveHandle(dragging, canvasPoint(evt));
  }

  function onPointerUp() {
    dragging = null;
  }

  function loadMission() {
    solved = false;
    hintOn = false;
    showExt = false;
    firstTry = true;
    triangle = pickTriangle();
    resetHandles();
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
    if (!mission()) return;
    if (anyAltitudeOutside()) showExt = true;
    if (isCorrect()) {
      solved = true;
      if (firstTry) score += 1;
      showToast(t("game.centres.ok"), true);
      el("btn-line-check").hidden = true;
      el("btn-line-next").hidden = missionIndex >= TOTAL - 1;
      if (missionIndex >= TOTAL - 1) {
        running = false;
        missionIndex = TOTAL;
        setOverlay(true, t("game.victory"), t("game.victoryMsg"), true);
      }
      updateHud();
      draw();
      return;
    }
    firstTry = false;
    hintOn = true;
    updateHud();
    updateBanner();
    showToast(t("game.centres.miss"), false);
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
    missions = [{ centre: "centroid" }];
    missionIndex = 0;
    resetHandles();
    updateBanner();
    updateHud();
    draw();
    setOverlay(true, t("game.ready"), t("game.readyMsg.jm28.centres"), false);

    bind(el("btn-start"), "click", startRound);
    bind(el("btn-line-check"), "click", check);
    bind(el("btn-line-next"), "click", nextMission);
    bind(el("btn-review-comics"), "click", function () {
      location.hash = "comics";
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
    dragging = null;
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
        return mission() && mission().centre;
      },
      snapCorrect: function () {
        if (!mission()) return;
        NAMES.forEach(snapLine);
        draw();
      },
      setType: function (centre) {
        missions = [{ centre: centre }];
        missionIndex = 0;
        running = true;
        loadMission();
      },
    },
  };
})();
