window.CenterRunGame = (function () {
  var TIME_LIMIT = 10;
  var KINDS = ["acute", "right", "obtuse", "isosceles"];
  var CENTRES = ["incentre", "centroid", "circumcentre", "orthocentre"];
  var MARK = {
    incentre: { letter: "I", color: "#67e8f9" },
    centroid: { letter: "G", color: "#f0abfc" },
    circumcentre: { letter: "O", color: "#a5b4fc" },
    orthocentre: { letter: "H", color: "#fda4af" },
  };
  var PROMPTS = {
    circumcentre: ["circum.1", "circum.2", "circum.3"],
    centroid: ["centroid.1", "centroid.2", "centroid.3"],
    orthocentre: ["ortho.1", "ortho.2"],
    incentre: ["in.1", "in.2", "in.3"],
  };

  var canvas, ctx;
  var width = 960;
  var height = 540;
  var originX = 0;
  var originY = 0;
  var running = false;
  var solved = false;
  var hintOn = false;
  var firstTry = true;
  var timedOut = false;
  var score = 0;
  var questionNum = 0;
  var currentMission = null;
  var centreBag = [];
  var kindBag = [];
  var usedPrompts = {};
  var timeLeft = TIME_LIMIT;
  var timerId = null;
  var listeners = [];
  var figure = null;

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

  function shuffle(list) {
    var i;
    for (i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function takeFromBag(bag, source, last) {
    if (!bag.length) {
      source.forEach(function (item) {
        bag.push(item);
      });
      shuffle(bag);
      if (last && bag.length > 1 && bag[0] === last) {
        bag.push(bag.shift());
      }
    }
    return bag.shift();
  }

  function nextPrompt(centre) {
    var pool = PROMPTS[centre] || [];
    var used = usedPrompts[centre] || [];
    var left = pool.filter(function (id) {
      return used.indexOf(id) === -1;
    });
    if (!left.length) {
      used = [];
      left = pool.slice();
      if (usedPrompts[centre] && usedPrompts[centre].length) {
        var last = usedPrompts[centre][usedPrompts[centre].length - 1];
        var fresh = left.filter(function (id) {
          return id !== last;
        });
        if (fresh.length) left = fresh;
      }
    }
    var prompt = pick(left);
    usedPrompts[centre] = used.concat(prompt);
    return prompt;
  }

  function buildMission() {
    var last = currentMission;
    var centre = takeFromBag(centreBag, CENTRES, last && last.centre);
    var kind = takeFromBag(kindBag, KINDS, last && last.kind);
    return { centre: centre, prompt: nextPrompt(centre), kind: kind };
  }

  function mission() {
    return currentMission;
  }

  function updateHud() {
    setText("hud-score", String(score));
    setText("hud-progress", String(questionNum));
    setText("hud-timer", String(Math.max(0, timeLeft)));
  }

  function updateBanner() {
    var q = el("cr-question");
    var m = mission();
    if (q) {
      q.textContent = m ? t("game.run.q." + m.prompt) : t("game.run.idle");
    }
    var hint = el("line-mission-hint");
    if (hint) {
      hint.hidden = !hintOn || !m;
      hint.textContent = hintOn && m ? t("game.run.hint." + m.centre) : "";
    }
    var kind = el("cr-kind");
    if (kind) {
      var id = figure && figure.kind ? figure.kind : m && m.kind;
      kind.textContent = id ? t("game.run.kind." + id) : "";
      kind.hidden = !id;
    }
    var fact = el("cr-fact");
    if (fact) {
      var hypo = hypotenuseName();
      var showFact = solved && m && m.centre === "circumcentre" && hypo;
      fact.hidden = !showFact;
      fact.textContent = showFact ? t("game.run.fact.rightO").replace("{side}", hypo) : "";
    }
  }

  function hypotenuseName() {
    if (!figure || !figure.rightAt) return "";
    if (figure.rightAt === "A") return "BC";
    if (figure.rightAt === "B") return "AC";
    return "AB";
  }

  function showToast(msg, ok) {
    var toast = el("game-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.toggle("is-ok", !!ok);
    toast.classList.add("is-visible");
    setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 1400);
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
  }

  function startTimer() {
    stopTimer();
    timeLeft = TIME_LIMIT;
    updateHud();
    timerId = setInterval(function () {
      timeLeft -= 1;
      updateHud();
      if (timeLeft <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 1000);
  }

  function onTimeout() {
    if (!running || solved) return;
    timedOut = true;
    firstTry = false;
    hintOn = true;
    updateBanner();
    showToast(t("game.run.timeout"), false);
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function lerp(a, b, u) {
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  }

  function mid(a, b) {
    return lerp(a, b, 0.5);
  }

  function norm(a) {
    var L = Math.hypot(a.x, a.y) || 1;
    return { x: a.x / L, y: a.y / L };
  }

  function projectT(p, a, b) {
    var v = sub(b, a);
    var d2 = dot(v, v);
    if (d2 < 1e-8) return 0;
    return dot(sub(p, a), v) / d2;
  }

  function footOfPerp(p, a, b) {
    return lerp(a, b, projectT(p, a, b));
  }

  function oppositeSide(name) {
    if (name === "A") return [figure.B, figure.C];
    if (name === "B") return [figure.A, figure.C];
    return [figure.A, figure.B];
  }

  function centroidOf(A, B, C) {
    return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
  }

  function incentreOf(A, B, C) {
    var a = dist(B, C);
    var b = dist(A, C);
    var c = dist(A, B);
    var p = a + b + c;
    return { x: (a * A.x + b * B.x + c * C.x) / p, y: (a * A.y + b * B.y + c * C.y) / p };
  }

  function circumcentreOf(A, B, C) {
    var d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(d) < 1e-6) return centroidOf(A, B, C);
    var a2 = A.x * A.x + A.y * A.y;
    var b2 = B.x * B.x + B.y * B.y;
    var c2 = C.x * C.x + C.y * C.y;
    return {
      x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
      y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d,
    };
  }

  function orthocentreOf(A, B, C) {
    var G = centroidOf(A, B, C);
    var O = circumcentreOf(A, B, C);
    return { x: 3 * G.x - 2 * O.x, y: 3 * G.y - 2 * O.y };
  }

  function angleAt(p, q, r) {
    var ux = p.x - q.x;
    var uy = p.y - q.y;
    var vx = r.x - q.x;
    var vy = r.y - q.y;
    var lu = Math.hypot(ux, uy) || 1;
    var lv = Math.hypot(vx, vy) || 1;
    return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv))));
  }

  function inPad(p, pad) {
    return p.x >= pad && p.x <= width - pad && p.y >= pad && p.y <= height - pad;
  }

  function minPair(points) {
    var best = Infinity;
    var i;
    var j;
    for (i = 0; i < points.length; i++) {
      for (j = i + 1; j < points.length; j++) {
        best = Math.min(best, dist(points[i], points[j]));
      }
    }
    return best;
  }

  function makePts(A, B, C) {
    return {
      incentre: incentreOf(A, B, C),
      centroid: centroidOf(A, B, C),
      circumcentre: circumcentreOf(A, B, C),
      orthocentre: orthocentreOf(A, B, C),
    };
  }

  function labelVerts(p, q, r) {
    var raw = [p, q, r];
    raw.sort(function (a, b) {
      return a.y - b.y;
    });
    var A = raw[0];
    var B = raw[1].x < raw[2].x ? raw[1] : raw[2];
    var C = raw[1].x < raw[2].x ? raw[2] : raw[1];
    return { A: A, B: B, C: C };
  }

  function sidesNear(a, b, tol) {
    return Math.abs(a - b) / Math.max(a, b, 1) < tol;
  }

  function isIsosceles(A, B, C) {
    var ab = dist(A, B);
    var bc = dist(B, C);
    var ca = dist(C, A);
    var pairs =
      sidesNear(ab, bc, 0.03) || sidesNear(bc, ca, 0.03) || sidesNear(ca, ab, 0.03);
    var equilateral = sidesNear(ab, bc, 0.03) && sidesNear(bc, ca, 0.03);
    return pairs && !equilateral;
  }

  function isScalene(A, B, C) {
    var ab = dist(A, B);
    var bc = dist(B, C);
    var ca = dist(C, A);
    return !sidesNear(ab, bc, 0.08) && !sidesNear(bc, ca, 0.08) && !sidesNear(ca, ab, 0.08);
  }

  function classifyAngles(A, B, C) {
    var angA = angleAt(B, A, C);
    var angB = angleAt(A, B, C);
    var angC = angleAt(A, C, B);
    var maxA = Math.max(angA, angB, angC);
    var minA = Math.min(angA, angB, angC);
    var kind = "acute";
    if (maxA > Math.PI / 2 + 0.03) kind = "obtuse";
    else if (Math.abs(maxA - Math.PI / 2) <= 0.03) kind = "right";
    var obtuseAt = null;
    var rightAt = null;
    if (kind === "obtuse") {
      if (angA === maxA) obtuseAt = "A";
      else if (angB === maxA) obtuseAt = "B";
      else obtuseAt = "C";
    }
    if (kind === "right") {
      if (angA === maxA) rightAt = "A";
      else if (angB === maxA) rightAt = "B";
      else rightAt = "C";
    }
    return { kind: kind, minA: minA, maxA: maxA, obtuseAt: obtuseAt, rightAt: rightAt };
  }

  function fitTriangle(p, q, r, kind) {
    var pts0 = makePts(p, q, r);
    var items = [p, q, r].concat(
      CENTRES.map(function (id) {
        return pts0[id];
      })
    );
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    items.forEach(function (pt) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    });
    var boxW = maxX - minX;
    var boxH = maxY - minY;
    if (boxW < 80 || boxH < 80) return null;
    var pad = 42;
    var scale = Math.min((width - 2 * pad) / boxW, (height - 2 * pad) / boxH) * 0.9;
    if (scale < 0.28) return null;
    var cx = (minX + maxX) / 2;
    var cy = (minY + maxY) / 2;
    function map(pt) {
      return { x: width / 2 + (pt.x - cx) * scale, y: height / 2 + (pt.y - cy) * scale };
    }
    var tri = labelVerts(map(p), map(q), map(r));
    var pts = makePts(tri.A, tri.B, tri.C);
    var list = CENTRES.map(function (id) {
      return pts[id];
    });
    if (
      [tri.A, tri.B, tri.C].concat(list).some(function (pt) {
        return !inPad(pt, 30);
      })
    ) {
      return null;
    }
    var gap = kind === "right" || kind === "isosceles" ? 24 : 32;
    if (minPair(list) < gap) return null;
    var info = classifyAngles(tri.A, tri.B, tri.C);
    if (kind === "isosceles") {
      if (!isIsosceles(tri.A, tri.B, tri.C)) return null;
    } else {
      if (info.kind !== kind) return null;
      if (!isScalene(tri.A, tri.B, tri.C)) return null;
    }
    return {
      A: tri.A,
      B: tri.B,
      C: tri.C,
      pts: pts,
      kind: kind,
      rightAt: info.rightAt,
      obtuseAt: info.obtuseAt,
    };
  }

  function fallbackFigure(kind) {
    if (kind === "right") {
      return fitTriangle(
        { x: 220, y: 90 },
        { x: 220, y: 390 },
        { x: 740, y: 390 },
        "right"
      );
    }
    if (kind === "obtuse") {
      return fitTriangle(
        { x: 660, y: 240 },
        { x: 318, y: 466 },
        { x: 400, y: 240 },
        "obtuse"
      );
    }
    if (kind === "isosceles") {
      return fitTriangle(
        { x: 480, y: 70 },
        { x: 210, y: 400 },
        { x: 750, y: 400 },
        "isosceles"
      );
    }
    return fitTriangle(
      { x: 720, y: 60 },
      { x: 200, y: 230 },
      { x: 670, y: 390 },
      "acute"
    );
  }

  function rawAcute() {
    var pad = 40;
    return [
      { x: pad + Math.random() * 400, y: pad + Math.random() * 320 },
      { x: pad + Math.random() * 400, y: pad + Math.random() * 320 },
      { x: pad + Math.random() * 400, y: pad + Math.random() * 320 },
    ];
  }

  function rawRight() {
    var R = { x: 200, y: 200 };
    var base = Math.random() * Math.PI * 2;
    var len1 = 180 + Math.random() * 160;
    var len2 = 160 + Math.random() * 180;
    return [
      R,
      { x: R.x + Math.cos(base) * len1, y: R.y + Math.sin(base) * len1 },
      {
        x: R.x + Math.cos(base + Math.PI / 2) * len2,
        y: R.y + Math.sin(base + Math.PI / 2) * len2,
      },
    ];
  }

  function rawIsosceles() {
    var apex = { x: 240, y: 200 };
    var roll = Math.random();
    var apexDeg = roll < 0.4 ? 50 + Math.random() * 24 : roll < 0.7 ? 90 : 102 + Math.random() * 16;
    var half = ((apexDeg / 2) * Math.PI) / 180;
    var rot = Math.random() * Math.PI * 2;
    var leg = 210 + Math.random() * 90;
    return [
      apex,
      { x: apex.x + Math.cos(rot - half) * leg, y: apex.y + Math.sin(rot - half) * leg },
      { x: apex.x + Math.cos(rot + half) * leg, y: apex.y + Math.sin(rot + half) * leg },
    ];
  }

  function rawObtuse() {
    var C = { x: 240, y: 220 };
    var ang = ((102 + Math.random() * 22) * Math.PI) / 180;
    var rot = Math.random() * Math.PI * 2;
    var len1 = 190 + Math.random() * 90;
    var len2 = 170 + Math.random() * 120;
    return [
      { x: C.x + Math.cos(rot) * len1, y: C.y + Math.sin(rot) * len1 },
      { x: C.x + Math.cos(rot + ang) * len2, y: C.y + Math.sin(rot + ang) * len2 },
      C,
    ];
  }

  function wantedKind() {
    var m = mission();
    return (m && m.kind) || KINDS[Math.floor(Math.random() * KINDS.length)];
  }

  function pickFigure() {
    var kind = wantedKind();
    var rawFn =
      kind === "right" ? rawRight : kind === "obtuse" ? rawObtuse : kind === "isosceles" ? rawIsosceles : rawAcute;
    var i;
    for (i = 0; i < 180; i++) {
      var raw = rawFn();
      var next = fitTriangle(raw[0], raw[1], raw[2], kind);
      if (next) {
        figure = next;
        return figure;
      }
    }
    figure = fallbackFigure(kind) || fallbackFigure("acute");
    return figure;
  }

  function drawVertexLabel(name, p, inward) {
    var dx = p.x - inward.x;
    var dy = p.y - inward.y;
    var L = Math.hypot(dx, dy) || 1;
    var bump = figure.pts && dist(p, figure.pts.orthocentre) < 22 ? 32 : 18;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 16px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, p.x + (dx / L) * bump, p.y + (dy / L) * bump);
  }

  function drawRightAngleMark() {
    if (!figure || !figure.rightAt) return;
    var R = figure[figure.rightAt];
    var others = ["A", "B", "C"].filter(function (name) {
      return name !== figure.rightAt;
    });
    var u = norm(sub(figure[others[0]], R));
    var v = norm(sub(figure[others[1]], R));
    var s = 18;
    ctx.save();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(R.x + u.x * s, R.y + u.y * s);
    ctx.lineTo(R.x + u.x * s + v.x * s, R.y + u.y * s + v.y * s);
    ctx.lineTo(R.x + v.x * s, R.y + v.y * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawSeg(p, q, dashed) {
    ctx.beginPath();
    ctx.setLineDash(dashed ? [7, 6] : []);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawLineThrough(origin, dir) {
    var d = norm(dir);
    var span = canvas ? Math.max(canvas.width, canvas.height) : Math.max(width, height);
    ctx.beginPath();
    ctx.moveTo(origin.x - d.x * span, origin.y - d.y * span);
    ctx.lineTo(origin.x + d.x * span, origin.y + d.y * span);
    ctx.stroke();
  }

  function drawCoveringSeg(points) {
    var usable = points.filter(function (p) {
      return p && isFinite(p.x) && isFinite(p.y);
    });
    if (usable.length < 2) return;
    var dir = { x: 1, y: 0 };
    var i;
    for (i = 1; i < usable.length; i++) {
      if (dist(usable[0], usable[i]) > 1) {
        dir = norm(sub(usable[i], usable[0]));
        break;
      }
    }
    var minT = Infinity;
    var maxT = -Infinity;
    var a = usable[0];
    var b = usable[0];
    usable.forEach(function (p) {
      var t = (p.x - usable[0].x) * dir.x + (p.y - usable[0].y) * dir.y;
      if (t < minT) {
        minT = t;
        a = p;
      }
      if (t > maxT) {
        maxT = t;
        b = p;
      }
    });
    if (dist(a, b) > 1) drawSeg(a, b);
  }

  function drawSpecialLines() {
    var m = mission();
    if (!solved || !m || !figure) return;
    var names = ["A", "B", "C"];
    var color = MARK[m.centre].color;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.88;
    ctx.lineCap = "round";
    names.forEach(function (name) {
      var V = figure[name];
      var side = oppositeSide(name);
      if (m.centre === "centroid") {
        drawSeg(V, mid(side[0], side[1]));
        return;
      }
      if (m.centre === "orthocentre") {
        var foot = footOfPerp(V, side[0], side[1]);
        var u = projectT(foot, side[0], side[1]);
        if (u < -0.02 || u > 1.02) {
          var end = u < 0 ? side[0] : side[1];
          ctx.save();
          ctx.strokeStyle = "rgba(148, 163, 184, 0.75)";
          ctx.lineWidth = 1.8;
          drawSeg(end, foot, true);
          ctx.restore();
        }
        drawCoveringSeg([V, foot, figure.pts.orthocentre]);
        if (dist(foot, V) > 12) {
          drawAltitudeFootMark(foot, side, V);
        }
        return;
      }
      if (m.centre !== "circumcentre") return;
      var M = mid(side[0], side[1]);
      var along = sub(side[1], side[0]);
      ctx.setLineDash([8, 6]);
      drawLineThrough(M, { x: -along.y, y: along.x });
      ctx.setLineDash([]);
    });
    ctx.restore();
    if (m.centre === "centroid") drawCentroidRatios();
    if (m.centre === "incentre") {
      drawAngleBisectors();
      drawIncircle();
    }
    if (m.centre === "circumcentre") drawCircumcircle();
  }

  function angleSweep(from, to) {
    var d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function drawEqualAngleMarks(V, P, Q, I, ticks, color) {
    var a0 = Math.atan2(P.y - V.y, P.x - V.x);
    var a1 = Math.atan2(Q.y - V.y, Q.x - V.x);
    var aI = Math.atan2(I.y - V.y, I.x - V.x);
    var d0 = angleSweep(a0, aI);
    var d1 = angleSweep(aI, a1);
    var r = 28;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, a0, a0 + d0, d0 < 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, aI, aI + d1, d1 < 0);
    ctx.stroke();
    function hatch(from, delta) {
      var mid = from + delta / 2;
      var i;
      for (i = 0; i < ticks; i++) {
        var ang = mid + (i - (ticks - 1) / 2) * 0.11;
        ctx.beginPath();
        ctx.moveTo(V.x + Math.cos(ang) * (r - 5), V.y + Math.sin(ang) * (r - 5));
        ctx.lineTo(V.x + Math.cos(ang) * (r + 5), V.y + Math.sin(ang) * (r + 5));
        ctx.stroke();
      }
    }
    hatch(a0, d0);
    hatch(aI, d1);
    ctx.restore();
  }

  function drawAngleBisectors() {
    var I = figure.pts.incentre;
    var color = MARK.incentre.color;
    var ticks = { A: 1, B: 2, C: 3 };
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ["A", "B", "C"].forEach(function (name) {
      var V = figure[name];
      var side = oppositeSide(name);
      drawSeg(V, I);
      drawEqualAngleMarks(V, side[0], side[1], I, ticks[name], color);
    });
    ctx.restore();
  }

  function distToLine(p, a, b) {
    var v = sub(b, a);
    var L = Math.hypot(v.x, v.y) || 1;
    return Math.abs((p.x - a.x) * v.y - (p.y - a.y) * v.x) / L;
  }

  function drawRatioLabel(from, to, text, color) {
    var p = mid(from, to);
    var along = sub(to, from);
    var n = norm({ x: -along.y, y: along.x });
    var g = figure.pts.centroid;
    if ((p.x + n.x - g.x) * (p.x - g.x) + (p.y + n.y - g.y) * (p.y - g.y) < 0) {
      n = { x: -n.x, y: -n.y };
    }
    ctx.fillStyle = color;
    ctx.font = "700 14px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, p.x + n.x * 13, p.y + n.y * 13);
  }

  function drawCentroidRatios() {
    var G = figure.pts.centroid;
    var color = MARK.centroid.color;
    ctx.save();
    ["A", "B", "C"].forEach(function (name) {
      var V = figure[name];
      var M = mid(oppositeSide(name)[0], oppositeSide(name)[1]);
      drawRatioLabel(V, G, "2", color);
      drawRatioLabel(G, M, "1", color);
    });
    ctx.restore();
  }

  function drawRadius(from, to) {
    var d = sub(to, from);
    var L = Math.hypot(d.x, d.y) || 1;
    var start = { x: from.x + (d.x / L) * 9, y: from.y + (d.y / L) * 9 };
    ctx.save();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawPerpMark(foot, alongSide, towardCentre, color) {
    var u = norm(alongSide);
    var v = norm(towardCentre);
    var s = 11;
    ctx.save();
    ctx.strokeStyle = color || "#ef4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(foot.x + u.x * s, foot.y + u.y * s);
    ctx.lineTo(foot.x + u.x * s + v.x * s, foot.y + u.y * s + v.y * s);
    ctx.lineTo(foot.x + v.x * s, foot.y + v.y * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawAltitudeFootMark(foot, side, V) {
    var along = sub(side[1], side[0]);
    var toward = sub(V, foot);
    if (Math.hypot(toward.x, toward.y) < 1) {
      toward = sub(figure.pts.orthocentre, foot);
    }
    var g = figure.pts.centroid;
    function away(dir) {
      return dist({ x: foot.x + dir.x, y: foot.y + dir.y }, g);
    }
    if (away(along) > away({ x: -along.x, y: -along.y })) {
      along = { x: -along.x, y: -along.y };
    }
    if (away(toward) > away({ x: -toward.x, y: -toward.y })) {
      toward = { x: -toward.x, y: -toward.y };
    }
    drawPerpMark(foot, along, toward, MARK.orthocentre.color);
  }

  function drawIncircle() {
    var I = figure.pts.incentre;
    var r = distToLine(I, figure.A, figure.B);
    ctx.save();
    ctx.strokeStyle = MARK.incentre.color;
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(I.x, I.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = MARK.incentre.color;
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.restore();
    [
      [figure.A, figure.B],
      [figure.B, figure.C],
      [figure.C, figure.A],
    ].forEach(function (side) {
      var foot = footOfPerp(I, side[0], side[1]);
      drawRadius(I, foot);
      drawPerpMark(foot, sub(side[1], side[0]), sub(I, foot));
    });
  }

  function drawCircumcircle() {
    var O = figure.pts.circumcentre;
    var r = dist(O, figure.A);
    ctx.save();
    ctx.strokeStyle = MARK.circumcentre.color;
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(O.x, O.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = MARK.circumcentre.color;
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.restore();
    ["A", "B", "C"].forEach(function (name) {
      drawRadius(O, figure[name]);
    });
  }

  function drawTick(p, n) {
    ctx.beginPath();
    ctx.moveTo(p.x - n.x * 8, p.y - n.y * 8);
    ctx.lineTo(p.x + n.x * 8, p.y + n.y * 8);
    ctx.stroke();
  }

  function drawIsoscelesMarks() {
    if (!figure || figure.kind !== "isosceles") return;
    var pairs = [
      [figure.A, figure.B],
      [figure.B, figure.C],
      [figure.C, figure.A],
    ];
    var lengths = pairs.map(function (pair) {
      return dist(pair[0], pair[1]);
    });
    ctx.save();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2.2;
    pairs.forEach(function (pair, i) {
      var match = pairs.some(function (other, j) {
        return i !== j && sidesNear(lengths[i], lengths[j], 0.03);
      });
      if (!match) return;
      var along = sub(pair[1], pair[0]);
      var n = norm({ x: -along.y, y: along.x });
      drawTick(mid(pair[0], pair[1]), n);
    });
    ctx.restore();
  }

  function drawCentreMark(id) {
    var p = figure.pts[id];
    var meta = MARK[id];
    var active = solved && mission() && mission().centre === id;
    ctx.save();
    if (solved && !active) ctx.globalAlpha = 0.32;
    if (active) {
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, active ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#04121a";
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#04121a";
    ctx.font = "700 9px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.letter, p.x, p.y + 0.5);
    ctx.restore();
  }

  function circumBounds() {
    var pad = 40;
    var minX = 0;
    var minY = 0;
    var maxX = width;
    var maxY = height;
    var m = mission();
    if (solved && m && figure && m.centre === "circumcentre") {
      var O = figure.pts.circumcentre;
      var r = dist(O, figure.A) + pad;
      minX = Math.min(minX, O.x - r);
      maxX = Math.max(maxX, O.x + r);
      minY = Math.min(minY, O.y - r);
      maxY = Math.max(maxY, O.y + r);
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function prepareCanvas() {
    var b = circumBounds();
    originX = Math.max(0, Math.ceil(-b.minX));
    originY = Math.max(0, Math.ceil(-b.minY));
    var nextW = Math.max(width, Math.ceil(b.maxX + originX));
    var nextH = Math.max(height, Math.ceil(b.maxY + originY));
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
  }

  function cssScale() {
    var box = el("cr-board-scroll");
    if (!box || !canvas || !canvas.width) return 1;
    return box.clientWidth / canvas.width;
  }

  function syncScroller(keepTriangle) {
    var box = el("cr-board-scroll");
    var slider = el("cr-scroll");
    if (!box || !canvas) return;
    var scale = cssScale();
    var overflowY = Math.max(0, canvas.height * scale - box.clientHeight);
    if (keepTriangle) {
      box.scrollTop = originY * scale;
      box.scrollLeft = originX * scale;
    }
    if (slider) {
      slider.hidden = overflowY < 8;
      slider.max = String(Math.max(1, Math.round(overflowY)));
      slider.value = String(Math.round(box.scrollTop));
    }
  }

  function drawBoard() {
    if (!ctx) return;
    if (!figure) pickFigure();
    prepareCanvas();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050814";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
    ctx.lineWidth = 1;
    var step = 28;
    var i;
    for (i = 0; i <= canvas.width; i += step) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, canvas.height);
      ctx.stroke();
    }
    for (i = 0; i <= canvas.height; i += step) {
      ctx.beginPath();
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(canvas.width, i + 0.5);
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, originX, originY);

    var A = figure.A;
    var B = figure.B;
    var C = figure.C;
    ctx.save();
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 22;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowColor = "#e879f9";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "#e879f9";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(34, 211, 238, 0.06)";
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fill();
    drawRightAngleMark();
    drawIsoscelesMarks();

    var g = figure.pts.centroid;
    drawVertexLabel("A", A, g);
    drawVertexLabel("B", B, g);
    drawVertexLabel("C", C, g);

    drawSpecialLines();
    CENTRES.forEach(drawCentreMark);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    syncScroller(solved && mission() && mission().centre === "circumcentre");
  }

  function clearButtonState() {
    document.querySelectorAll(".cr-centre").forEach(function (btn) {
      btn.classList.remove("is-correct", "is-wrong", "is-disabled");
      btn.disabled = false;
    });
  }

  function loadMission() {
    advancing = false;
    solved = false;
    hintOn = false;
    firstTry = true;
    timedOut = false;
    currentMission = buildMission();
    questionNum += 1;
    clearButtonState();
    var next = el("btn-line-next");
    if (next) next.hidden = true;
    pickFigure();
    updateBanner();
    updateHud();
    drawBoard();
    var box = el("cr-board-scroll");
    if (box) {
      box.scrollTop = 0;
      box.scrollLeft = 0;
    }
    syncScroller(false);
    if (running) startTimer();
  }

  var advancing = false;

  function goNext() {
    if (advancing) return;
    advancing = true;
    loadMission();
  }

  function pickCentre(centre) {
    if (!running || solved) return;
    var m = mission();
    if (!m) return;
    stopTimer();
    var btn = document.querySelector('.cr-centre[data-centre="' + centre + '"]');
    if (centre === m.centre) {
      solved = true;
      if (firstTry && !timedOut) score += 1;
      if (btn) btn.classList.add("is-correct");
      document.querySelectorAll(".cr-centre").forEach(function (b) {
        if (b !== btn) b.classList.add("is-disabled");
        b.disabled = true;
      });
      showToast(t("game.run.ok"), true);
      updateHud();
      updateBanner();
      drawBoard();
      var next = el("btn-line-next");
      if (next) next.hidden = false;
      return;
    }
    firstTry = false;
    hintOn = true;
    if (btn) {
      btn.classList.add("is-wrong");
      setTimeout(function () {
        btn.classList.remove("is-wrong");
      }, 500);
    }
    updateBanner();
    showToast(t("game.run.miss"), false);
  }

  function startRound() {
    score = 0;
    questionNum = 0;
    centreBag = [];
    kindBag = [];
    usedPrompts = {};
    running = true;
    setOverlay(false);
    loadMission();
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
    questionNum = 0;
    currentMission = buildMission();
    timeLeft = TIME_LIMIT;
    pickFigure();
    updateBanner();
    updateHud();
    drawBoard();
    setOverlay(true, t("game.ready"), t("game.readyMsg.jm28.run"), false);

    bind(el("btn-start"), "click", startRound);
    bind(el("btn-line-next"), "click", function () {
      if (solved) goNext();
    });
    bind(el("btn-review-comics"), "click", function () {
      location.hash = "comics";
    });
    document.querySelectorAll(".cr-centre").forEach(function (btn) {
      bind(btn, "click", function () {
        pickCentre(btn.getAttribute("data-centre"));
      });
    });
    bind(el("cr-board-scroll"), "scroll", function () {
      var slider = el("cr-scroll");
      var box = el("cr-board-scroll");
      if (slider && box && !slider.hidden) slider.value = String(Math.round(box.scrollTop));
    });
    bind(el("cr-scroll"), "input", function () {
      var box = el("cr-board-scroll");
      if (box) box.scrollTop = Number(el("cr-scroll").value);
    });
  }

  function destroy() {
    stopTimer();
    unbindAll();
    running = false;
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
    _test: {
      type: function () {
        return mission() && mission().centre;
      },
      kind: function () {
        return figure && figure.kind;
      },
      snapCorrect: function () {
        var m = mission();
        if (m) pickCentre(m.centre);
      },
      pickWrong: function () {
        var m = mission();
        if (!m) return;
        var wrong = CENTRES.filter(function (c) {
          return c !== m.centre;
        })[0];
        pickCentre(wrong);
      },
      reveal: function (centre) {
        var m = mission();
        if (m && centre) m.centre = centre;
        solved = true;
        updateBanner();
        drawBoard();
        return m && m.centre;
      },
      forceKind: function (kind) {
        var m = mission();
        if (m && kind) m.kind = kind;
        pickFigure();
        updateBanner();
        drawBoard();
        return figure && figure.kind;
      },
    },
  };
})();
