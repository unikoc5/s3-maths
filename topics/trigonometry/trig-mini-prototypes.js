/* JM34 — two one-level prototypes: Aim Sight + Rhythm Lock.
 * Replaces the earlier quiz-like tries. Blackout Voyage stays. */
(function () {
  "use strict";

  function tex(s) {
    if (window.katex) {
      try { return katex.renderToString(s, { throwOnError: false }); }
      catch (e) { /* ignore */ }
    }
    return s;
  }
  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function btn(label, cls, onClick) {
    var b = h("button", "tm-btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 1 · Aim Sight — pick the exact tan / notch, fire the beam
   * Given: adjacent 200 m, opposite 200√3 m → tan = √3 → 60°
   * ═══════════════════════════════════════════════════════════════════ */
  function mountAim(root) {
    var ANS = 60;
    var pick = null;
    var fired = false;

    var wrap = h("div", "tm-proto");
    var bar = h("div", "tm-bar");
    bar.appendChild(h("strong", "", "Aim Sight"));
    bar.appendChild(h("span", "", "Prototype · one shot"));
    bar.appendChild(btn("Reset", "", reset));
    wrap.appendChild(bar);
    wrap.appendChild(h("p", "tm-hint",
      "Beacon is ahead. Adjacent = <b>200 m</b>, opposite = <b>200√3 m</b>. " +
      "Pick the exact value of $\\tan\\theta$, then fire. The beam must hit the peak."));

    var panel = h("div", "tm-panel");
    var stage = h("div", "tm-aim-stage");
    /* viewBox geometry: ship at (60, 210), ground y=220, peak tip depends on angle */
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 480 270");
    svg.setAttribute("aria-hidden", "true");

    function el(tag, attrs) {
      var n = document.createElementNS(svgNS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      svg.appendChild(n);
      return n;
    }
    /* sky stars */
    el("circle", { cx: "80", cy: "36", r: "1.4", fill: "#94a3b8" });
    el("circle", { cx: "200", cy: "28", r: "1.1", fill: "#64748b" });
    el("circle", { cx: "340", cy: "42", r: "1.5", fill: "#94a3b8" });
    el("circle", { cx: "420", cy: "22", r: "1.2", fill: "#64748b" });
    /* ground */
    el("rect", { x: "0", y: "220", width: "480", height: "50", fill: "#1c1917" });
    el("path", { d: "M0 220 L480 220", stroke: "#57534e", "stroke-width": "2" });
    /* mountain / peak — tip placed for 60° from ship: rise/run = √3, run≈200 units → rise≈346 but we scale to view */
    /* ship S=(70,220), peak base B=(320,220), tip T for 60°: dy = 250*tan60 ≈ 433 too tall — use visual scale */
    /* Visual: adjacent shown as 250 px, height for 60° = 250*√3/2 visually ≈ 216 → tip y = 220-216 = 4 — clip. Use adj=180, h60=180*√3≈311 still tall. Use adj=140, h60≈242 → tip y=-22. Better: adj=120, tan60 height = 120*1.732=208, tip y=12. */
    var SX = 70, SY = 220;
    var RUN = 200;
    var peakX = SX + RUN;
    var peakTipY = 36; /* visual tip for the true 60° answer */
    function tipY(deg) {
      var h60 = Math.sqrt(3);
      var h = Math.tan(deg * Math.PI / 180);
      return SY - (h / h60) * (SY - peakTipY);
    }
    var trueTip = peakTipY;

    el("path", {
      d: "M" + (peakX - 70) + " 220 L" + peakX + " " + trueTip.toFixed(1) + " L" + (peakX + 90) + " 220 Z",
      fill: "#1e293b", stroke: "#475569", "stroke-width": "2",
    });
    var glow = el("circle", { class: "tm-peak-glow", cx: String(peakX), cy: String(trueTip), r: "14" });
    el("circle", { cx: String(peakX), cy: String(trueTip), r: "5", fill: "#fbbf24" });
    /* distance brace */
    el("path", {
      d: "M" + SX + " 236 L" + peakX + " 236", stroke: "#a8a29e", "stroke-width": "1.5",
      "stroke-dasharray": "4 4",
    });
    var distLab = document.createElementNS(svgNS, "text");
    distLab.setAttribute("x", String((SX + peakX) / 2));
    distLab.setAttribute("y", "252");
    distLab.setAttribute("text-anchor", "middle");
    distLab.setAttribute("fill", "#d6d3d1");
    distLab.setAttribute("font-size", "12");
    distLab.setAttribute("font-weight", "700");
    distLab.textContent = "adjacent 200 m";
    svg.appendChild(distLab);

    var hLab = document.createElementNS(svgNS, "text");
    hLab.setAttribute("x", String(peakX + 12));
    hLab.setAttribute("y", String((SY + trueTip) / 2));
    hLab.setAttribute("fill", "#fcd34d");
    hLab.setAttribute("font-size", "12");
    hLab.setAttribute("font-weight", "700");
    hLab.textContent = "opp 200√3 m";
    svg.appendChild(hLab);

    /* ship */
    el("ellipse", { cx: String(SX), cy: "198", rx: "28", ry: "12", fill: "#e7e5e4", stroke: "#a8a29e", "stroke-width": "1.5" });
    el("rect", { x: String(SX - 14), y: "205", width: "22", height: "10", rx: "3", fill: "#78716c" });
    el("circle", { cx: String(SX), cy: String(SY), r: "3.5", fill: "#67e8f9" });

    var beam = el("line", {
      class: "tm-beam",
      x1: String(SX), y1: String(SY), x2: String(SX), y2: String(SY),
    });

    stage.appendChild(svg);
    panel.appendChild(stage);

    var hud = h("div", "tm-aim-hud");
    hud.appendChild(h("span", "label", "tan θ ="));
    var notches = h("div", "tm-notches");
    var opts = [
      { deg: 30, label: "1/\\sqrt{3}" },
      { deg: 45, label: "1" },
      { deg: 60, label: "\\sqrt{3}" },
    ];
    var optBtns = [];
    opts.forEach(function (o) {
      var b = btn(tex(o.label), "", function () {
        if (fired) return;
        pick = o.deg;
        optBtns.forEach(function (x) { x.classList.remove("pick"); });
        b.classList.add("pick");
        note.textContent = "Notch armed. Fire when ready.";
        note.className = "tm-note";
        fireBtn.disabled = false;
      });
      optBtns.push(b);
      notches.appendChild(b);
    });
    hud.appendChild(notches);
    var fireBtn = btn("Fire ▸", "primary", fire);
    fireBtn.disabled = true;
    hud.appendChild(fireBtn);
    panel.appendChild(hud);
    wrap.appendChild(panel);
    var note = h("p", "tm-note", "Pick tan θ from the exact-value table, then fire.");
    wrap.appendChild(note);
    root.appendChild(wrap);

    /* re-render katex in hint */
    if (window.renderMathInElement) {
      try { renderMathInElement(wrap, { delimiters: [{ left: "$", right: "$", display: false }], throwOnError: false }); } catch (e) {}
    }

    function fire() {
      if (pick == null || fired) return;
      fired = true;
      fireBtn.disabled = true;
      optBtns.forEach(function (b) { b.disabled = true; });
      var y = tipY(pick);
      var x2 = SX + RUN;
      /* if wrong angle, beam still goes to that slope tip (maybe miss peak) */
      beam.setAttribute("x2", String(x2));
      beam.setAttribute("y2", String(y));
      beam.classList.remove("hit", "miss");
      beam.classList.add("on");
      var ok = pick === ANS;
      if (ok) {
        beam.classList.add("hit");
        glow.classList.add("on");
        note.textContent = "Hit. tan 60° = √3 → opposite = 200√3.";
        note.className = "tm-note ok";
      } else {
        beam.classList.add("miss");
        note.textContent = "Missed the beacon. Check tan θ = opposite / adjacent.";
        note.className = "tm-note bad";
      }
    }
    function reset() {
      root.dataset.ready = "0";
      clear(root);
      mountAim(root);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 2 · Rhythm Lock — lock true exact-value cards in the zone
   * ═══════════════════════════════════════════════════════════════════ */
  function mountRhythm(root) {
    var DECK = [
      { show: "\\sin 30^\\circ", sub: "=\\,1/2", ok: true },
      { show: "\\cos 45^\\circ", sub: "=\\,1/2", ok: false },
      { show: "\\tan 45^\\circ", sub: "=\\,1", ok: true },
      { show: "\\sin 60^\\circ", sub: "=\\,1/2", ok: false },
      { show: "\\cos 30^\\circ", sub: "=\\,\\sqrt{3}/2", ok: true },
      { show: "\\tan 60^\\circ", sub: "=\\,\\sqrt{3}", ok: true },
      { show: "\\sin 45^\\circ", sub: "=\\,\\sqrt{2}/2", ok: true },
      { show: "\\cos 60^\\circ", sub: "=\\,\\sqrt{3}/2", ok: false },
      { show: "\\tan 30^\\circ", sub: "=\\,1/\\sqrt{3}", ok: true },
      { show: "\\sin 30^\\circ", sub: "=\\,\\sqrt{3}/2", ok: false },
    ];

    var wrap = h("div", "tm-proto");
    var bar = h("div", "tm-bar");
    bar.appendChild(h("strong", "", "Rhythm Lock"));
    bar.appendChild(h("span", "", "Prototype · one wave"));
    bar.appendChild(btn("Restart", "", restart));
    wrap.appendChild(bar);
    wrap.appendChild(h("p", "tm-hint",
      "Cards drift through the blue LOCK zone. Hit <b>Lock</b> only when the exact value is true. " +
      "Locking a false card, or letting a true card slip past, both cost a miss."));

    var panel = h("div", "tm-panel");
    var stage = h("div", "tm-rhythm");
    var lane = h("div", "tm-lane");
    var zone = h("div", "tm-zone");
    stage.appendChild(lane);
    stage.appendChild(zone);
    panel.appendChild(stage);

    var ui = h("div", "tm-rhythm-ui");
    var lockBtn = btn("Lock ␣", "primary", tryLock);
    var scoreEl = h("span", "tm-score", "");
    ui.appendChild(lockBtn);
    ui.appendChild(scoreEl);
    panel.appendChild(ui);
    wrap.appendChild(panel);
    var note = h("p", "tm-note", "Press Lock or Space when a true card is inside the zone.");
    wrap.appendChild(note);
    root.appendChild(wrap);

    var cards = [];
    var idx = 0, score = 0, misses = 0, running = false, raf = 0, last = 0;
    var spawnEvery = 1100;
    var sinceSpawn = 0;
    var speed = 0.14; /* px per ms across ~ stage width */
    var finished = false;
    var keyHandler = null;

    function stageW() { return stage.clientWidth || 480; }
    function zoneHit(card) {
      var zw = 88;
      var zx = stageW() / 2;
      return Math.abs(card.x - zx) <= zw / 2 + 8;
    }

    function spawn() {
      if (idx >= DECK.length) return;
      var d = DECK[idx++];
      var node = h("div", "tm-card", tex(d.show) + '<span class="sub">' + tex(d.sub) + "</span>");
      lane.appendChild(node);
      cards.push({ node: node, x: stageW() + 80, ok: d.ok, judged: false });
    }

    function endWave() {
      if (finished) return;
      finished = true;
      running = false;
      cancelAnimationFrame(raf);
      lockBtn.disabled = true;
      scoreEl.textContent = "Score " + score + " · Misses " + misses;
      note.textContent = misses === 0 ? "Clean wave." : (score >= 6 ? "Not bad — retry for a cleaner run." : "Warm up on special angles, then retry.");
      note.className = "tm-note " + (misses <= 2 ? "ok" : "bad");
    }

    function tick(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min(40, ts - last);
      last = ts;
      sinceSpawn += dt;
      if (sinceSpawn >= spawnEvery && idx < DECK.length) {
        sinceSpawn = 0;
        spawn();
      }
      var w = stageW();
      cards.forEach(function (c) {
        if (c.gone) return;
        c.x -= speed * dt * (w / 480);
        c.node.style.left = c.x + "px";
        if (!c.judged && c.x < w / 2 - 50) {
          /* slipped past lock zone */
          c.judged = true;
          if (c.ok) {
            misses++;
            c.node.classList.add("flash-bad");
            note.textContent = "True card slipped past.";
            note.className = "tm-note bad";
            updateScore();
          }
        }
        if (c.x < -100) {
          c.gone = true;
          if (c.node.parentNode) c.node.parentNode.removeChild(c.node);
        }
      });
      if (idx >= DECK.length && cards.every(function (c) { return c.gone || c.x < -20; })) {
        endWave();
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function updateScore() {
      scoreEl.textContent = "Locked " + score + " · Misses " + misses + " · Left " + Math.max(0, DECK.length - idx);
    }

    function tryLock() {
      if (!running || finished) return;
      var hit = null;
      cards.forEach(function (c) {
        if (c.judged || c.gone) return;
        if (zoneHit(c)) hit = c;
      });
      if (!hit) {
        note.textContent = "Nothing in the zone.";
        note.className = "tm-note";
        return;
      }
      hit.judged = true;
      if (hit.ok) {
        score++;
        hit.node.classList.add("flash-ok");
        note.textContent = "Locked.";
        note.className = "tm-note ok";
      } else {
        misses++;
        hit.node.classList.add("flash-bad");
        note.textContent = "That value was false.";
        note.className = "tm-note bad";
      }
      updateScore();
      setTimeout(function () {
        hit.gone = true;
        hit.node.classList.add("gone");
        if (hit.node.parentNode) hit.node.parentNode.removeChild(hit.node);
      }, 280);
    }

    function onKey(e) {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        tryLock();
      }
    }

    function start() {
      finished = false;
      running = true;
      idx = 0; score = 0; misses = 0;
      sinceSpawn = 900;
      last = 0;
      cards.forEach(function (c) { if (c.node.parentNode) c.node.parentNode.removeChild(c.node); });
      cards = [];
      lockBtn.disabled = false;
      note.textContent = "Wave incoming — Lock true cards only.";
      note.className = "tm-note";
      updateScore();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }

    function restart() {
      start();
    }

    keyHandler = onKey;
    document.addEventListener("keydown", keyHandler);
    /* clean up key listener if root cleared via remount */
    root._tmCleanup = function () { document.removeEventListener("keydown", keyHandler); cancelAnimationFrame(raf); };

    start();
  }

  /* ─── public ────────────────────────────────────────────────────── */
  var MOUNTERS = { aim: mountAim, rhythm: mountRhythm };

  function mount(which) {
    var root = document.getElementById("tm-" + which);
    if (!root) return;
    if (root._tmCleanup) { root._tmCleanup(); root._tmCleanup = null; }
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    (MOUNTERS[which] || function () {})(root);
  }

  function showGame(name) {
    var map = {
      voyage: "bv-game",
      aim: "tm-game-aim",
      rhythm: "tm-game-rhythm",
    };
    Object.keys(map).forEach(function (k) {
      var el = document.getElementById(map[k]);
      if (!el) return;
      el.classList.toggle("game-off", k !== name);
      el.hidden = k !== name;
      /* pause rhythm when leaving */
      if (k === "rhythm" && k !== name && el.querySelector("#tm-rhythm")) {
        var r = document.getElementById("tm-rhythm");
        if (r && r._tmCleanup) r._tmCleanup();
      }
    });
    document.querySelectorAll("#games-subnav [data-game]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-game") === name);
    });
    if (name === "aim" || name === "rhythm") {
      var root = document.getElementById("tm-" + name);
      if (root && name === "rhythm") {
        /* always remount rhythm so animation is fresh */
        root.dataset.ready = "0";
        clear(root);
      }
      mount(name);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.getElementById("games-subnav");
    if (!nav) return;
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("[data-game]");
      if (!b) return;
      showGame(b.getAttribute("data-game"));
    });
    showGame("voyage");
  });

  window.JM34MiniProto = { show: showGame, mount: mount };
})();
