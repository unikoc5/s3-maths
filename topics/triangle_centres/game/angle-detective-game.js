window.AngleDetectiveGame = (function () {
  var TOTAL = 8;
  var ARC_R = 22;

  var canvas, ctx;
  var width = 640;
  var height = 400;
  var running = false;
  var solved = false;
  var hintOn = false;
  var firstTry = true;
  var score = 0;
  var missionIndex = 0;
  var missions = [];
  var chosenReason = null;
  var entry = "";
  var listeners = [];

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

  function intersectHorizontal(y, a, b) {
    var t = (y - a.y) / (b.y - a.y);
    return { x: a.x + (b.x - a.x) * t, y: y };
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function makeLayout() {
    var y1 = 108 + Math.floor(Math.random() * 36);
    var y2 = 236 + Math.floor(Math.random() * 40);
    var x0 = 110 + Math.floor(Math.random() * 90);
    var span = 170 + Math.floor(Math.random() * 140);
    var leftToRight = Math.random() < 0.5;
    var transA = { x: leftToRight ? x0 : x0 + span, y: 28 };
    var transB = { x: leftToRight ? x0 + span : x0, y: 372 };
    return {
      y1: y1,
      y2: y2,
      transA: transA,
      transB: transB,
      transAngle: Math.atan2(transB.y - transA.y, transB.x - transA.x),
      p1: intersectHorizontal(y1, transA, transB),
      p2: intersectHorizontal(y2, transA, transB),
    };
  }

  function fallbackLayout() {
    var y1 = 132;
    var y2 = 268;
    var transA = { x: 168, y: 36 };
    var transB = { x: 430, y: 364 };
    return {
      y1: y1,
      y2: y2,
      transA: transA,
      transB: transB,
      transAngle: Math.atan2(transB.y - transA.y, transB.x - transA.x),
      p1: intersectHorizontal(y1, transA, transB),
      p2: intersectHorizontal(y2, transA, transB),
    };
  }

  function layout() {
    var m = mission();
    if (m && m.layout) return m.layout;
    return fallbackLayout();
  }

  function pickGiven(used) {
    var pool = [32, 38, 42, 48, 53, 58, 63, 68, 72, 78, 82, 98, 103, 108, 112, 118, 124, 132, 138, 147];
    var free = pool.filter(function (n) {
      return !used || used.indexOf(n) < 0;
    });
    return pick(free.length ? free : pool);
  }

  function recentKeys() {
    try {
      return JSON.parse(sessionStorage.getItem("jm28-ad-recent") || "[]");
    } catch (e) {
      return [];
    }
  }

  function rememberKeys(list) {
    try {
      var next = recentKeys().concat(
        list.map(function (m) {
          return missionKey(m);
        })
      );
      sessionStorage.setItem("jm28-ad-recent", JSON.stringify(next.slice(-32)));
    } catch (e) {}
  }

  function pairFor(reason) {
    if (reason === "corr") {
      var c = pick(["NW", "NE", "SW", "SE"]);
      return { upper: c, lower: c };
    }
    if (reason === "alt") {
      return pick([
        { upper: "SE", lower: "NW" },
        { upper: "SW", lower: "NE" },
      ]);
    }
    return pick([
      { upper: "SE", lower: "NE" },
      { upper: "SW", lower: "NW" },
    ]);
  }

  function makeMission(reason, usedGivens) {
    var pair = pairFor(reason);
    var givenLine = Math.random() < 0.5 ? 1 : 2;
    return {
      reason: reason,
      given: pickGiven(usedGivens),
      givenLine: givenLine,
      givenAt: givenLine === 1 ? pair.upper : pair.lower,
      xAt: givenLine === 1 ? pair.lower : pair.upper,
      layout: makeLayout(),
    };
  }

  function missionKey(m) {
    return [m.reason, m.given, m.givenLine, m.givenAt, m.xAt].join(":");
  }

  function cornerSweep(transAngle, corner) {
    if (corner === "SE") return { start: 0, end: transAngle };
    if (corner === "SW") return { start: transAngle, end: Math.PI };
    if (corner === "NW") return { start: Math.PI, end: transAngle + Math.PI };
    return { start: transAngle + Math.PI, end: Math.PI * 2 };
  }

  function drawAngleMark(P, corner, color, transAngle) {
    var sweep = cornerSweep(transAngle, corner);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(P.x, P.y, ARC_R, sweep.start, sweep.end);
    ctx.stroke();
    ctx.restore();
  }

  function answerOf(m) {
    return m.reason === "int" ? 180 - m.given : m.given;
  }

  function buildMissions() {
    var reasons = ["corr", "corr", "alt", "alt", "int", "int"];
    while (reasons.length < TOTAL) {
      reasons.push(pick(["corr", "alt", "int"]));
    }
    var i;
    for (i = reasons.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = reasons[i];
      reasons[i] = reasons[j];
      reasons[j] = tmp;
    }
    var banned = {};
    recentKeys().forEach(function (k) {
      banned[k] = true;
    });
    var usedGivens = [];
    var list = [];
    reasons.forEach(function (reason) {
      var m;
      var tries = 0;
      do {
        m = makeMission(reason, usedGivens);
        tries += 1;
      } while (banned[missionKey(m)] && tries < 24);
      banned[missionKey(m)] = true;
      usedGivens.push(m.given);
      list.push(m);
    });
    rememberKeys(list);
    return list;
  }

  function mission() {
    return missions[missionIndex] || null;
  }

  function updateHud() {
    setText("hud-score", String(score));
    setText("hud-progress", (running ? missionIndex + 1 : missionIndex) + " / " + TOTAL);
  }

  function updateEntry() {
    setText("ad-entry", entry || "—");
  }

  function updateBanner() {
    var banner = el("line-mission-banner");
    if (banner) {
      banner.innerHTML =
        '<span class="line-mission-kicker">' +
        t("game.line.mission") +
        "</span> " +
        t("game.angles.mission");
    }
    var hint = el("line-mission-hint");
    if (hint) {
      hint.hidden = !hintOn || !mission();
      hint.textContent = hintOn && mission() ? t("game.angles.hint." + mission().reason) : "";
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

  function setReason(reason) {
    if (solved || !running) return;
    chosenReason = reason;
    document.querySelectorAll(".ad-reason").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-reason") === reason);
    });
  }

  function pressKey(key) {
    if (solved || !running) return;
    if (key === "del") {
      entry = entry.slice(0, -1);
    } else if (entry.length < 3) {
      entry += key;
    }
    updateEntry();
  }

  function drawGlowLine(a, b, color, widthPx) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawTicks(y, x0, x1) {
    var mids = [x0 + 70, x1 - 70];
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    mids.forEach(function (x) {
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 8);
      ctx.lineTo(x + 1, y + 8);
      ctx.moveTo(x + 1, y - 8);
      ctx.lineTo(x + 9, y + 8);
      ctx.stroke();
    });
  }

  function drawLabel(P, corner, text, accent, transAngle) {
    var sweep = cornerSweep(transAngle, corner);
    var mid = (sweep.start + sweep.end) / 2;
    var horiz = corner === "NW" || corner === "SW" ? Math.PI : 0;
    if (corner === "NE") horiz = Math.PI * 2;
    var a = mid * 0.35 + horiz * 0.65;
    ctx.font = "700 16px 'DM Sans', sans-serif";
    var tw = ctx.measureText(text).width;
    var r = ARC_R + 12;
    var x = P.x + Math.cos(a) * r;
    var y = P.y + Math.sin(a) * r;
    var side = corner === "NW" || corner === "SW" ? -1 : 1;
    x += side * (tw * 0.28 + 3);
    var lift = corner === "NW" || corner === "NE" ? -1 : 1;
    y += lift * 3;
    ctx.fillStyle = accent ? "#f87171" : "#e0f2fe";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function draw() {
    if (!ctx) return;
    var m = mission();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, width, height);

    var g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "rgba(34, 211, 238, 0.06)");
    g.addColorStop(1, "rgba(8, 47, 73, 0.2)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    var L = layout();
    drawGlowLine({ x: 48, y: L.y1 }, { x: 520, y: L.y1 }, "#38bdf8", 4);
    drawGlowLine({ x: 48, y: L.y2 }, { x: 520, y: L.y2 }, "#38bdf8", 4);
    drawTicks(L.y1, 48, 520);
    drawTicks(L.y2, 48, 520);
    drawGlowLine(L.transA, L.transB, "#f43f5e", 4);

    if (m) {
      var givenP = m.givenLine === 2 ? L.p2 : L.p1;
      var xP = m.givenLine === 2 ? L.p1 : L.p2;
      drawAngleMark(givenP, m.givenAt, "#e0f2fe", L.transAngle);
      drawAngleMark(xP, m.xAt, "#f87171", L.transAngle);
      drawLabel(givenP, m.givenAt, String(m.given) + "°", false, L.transAngle);
      drawLabel(xP, m.xAt, solved ? String(answerOf(m)) + "°" : "x", true, L.transAngle);
    }

    ctx.fillStyle = "#67e8f9";
    ctx.font = "600 12px 'DM Sans', sans-serif";
    ctx.fillText("ℓ₁  ∥  ℓ₂", 48, height - 16);
  }

  function loadMission() {
    solved = false;
    hintOn = false;
    firstTry = true;
    chosenReason = null;
    entry = "";
    document.querySelectorAll(".ad-reason").forEach(function (btn) {
      btn.classList.remove("is-active");
    });
    el("btn-line-check").hidden = false;
    el("btn-line-next").hidden = true;
    updateEntry();
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
    if (!chosenReason || !entry) {
      showToast(t("game.angles.needBoth"), false);
      return;
    }
    var value = parseInt(entry, 10);
    if (chosenReason === m.reason && value === answerOf(m)) {
      solved = true;
      if (firstTry) score += 1;
      showToast(t("game.angles.ok"), true);
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
    updateBanner();
    showToast(t("game.angles.miss"), false);
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

  function buildKeypad() {
    var root = el("ad-keypad");
    if (!root) return;
    root.innerHTML = "";
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0"];
    keys.forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ad-key" + (key === "del" ? " is-del" : "");
      btn.textContent = key === "del" ? "⌫" : key;
      btn.setAttribute("data-key", key);
      root.appendChild(btn);
    });
  }

  function init() {
    destroy();
    canvas = el("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;
    running = false;
    missions = [makeMission(pick(["corr", "alt", "int"]), [])];
    missionIndex = 0;
    chosenReason = null;
    entry = "";
    buildKeypad();
    updateBanner();
    updateHud();
    updateEntry();
    draw();
    setOverlay(true, t("game.ready"), t("game.readyMsg.jm28.angles"), false);

    bind(el("btn-start"), "click", startRound);
    bind(el("btn-line-check"), "click", check);
    bind(el("btn-line-next"), "click", nextMission);
    bind(el("btn-review-comics"), "click", function () {
      location.hash = "comics";
    });
    document.querySelectorAll(".ad-reason").forEach(function (btn) {
      bind(btn, "click", function () {
        setReason(btn.getAttribute("data-reason"));
      });
    });
    var pad = el("ad-keypad");
    if (pad) {
      bind(pad, "click", function (evt) {
        var btn = evt.target.closest("[data-key]");
        if (btn) pressKey(btn.getAttribute("data-key"));
      });
    }
  }

  function destroy() {
    unbindAll();
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
        return mission() && mission().reason;
      },
      snapCorrect: function () {
        var m = mission();
        if (!m) return;
        setReason(m.reason);
        entry = String(answerOf(m));
        updateEntry();
      },
    },
  };
})();
