/* Factor Blaster — match factored <-> expanded forms by shooting the correct answer.
 * DOM-based shooter so every prompt/answer renders as real LaTeX (KaTeX).
 * Controls: <- -> move cannon, Space / ArrowUp shoot, or click an answer.
 * Modes: Expand (factored->expansion), Factorize (identities), Cross method (quadratics).
 * Round-based: choose mode + number of questions + speed; 3-2-1 countdown; end-of-round summary with ticks/crosses.
 */
(function () {
  "use strict";

  const C = { ink: "#e5e7eb" };

  // ── Bank (21): p = factored, c = correct expansion, d = expansion distractors, fd = factored distractors ──
  const BANK = [
    { p: "(x+5)^2",  c: "x^2+10x+25",  d: ["x^2+25", "x^2+5x+25", "x^2-10x+25"],              fd: ["(x-5)^2", "(x+5)(x-5)", "(x+10)^2"] },
    { p: "(x+3)^2",  c: "x^2+6x+9",    d: ["x^2+9", "x^2+3x+9", "x^2-6x+9"],                  fd: ["(x-3)^2", "(x+3)(x-3)", "(x+6)^2"] },
    { p: "(2x+1)^2", c: "4x^2+4x+1",   d: ["4x^2+1", "4x^2+2x+1", "4x^2-4x+1"],               fd: ["(2x-1)^2", "(2x+1)(2x-1)", "(4x+1)^2"] },
    { p: "(3x+2)^2", c: "9x^2+12x+4",  d: ["9x^2+4", "9x^2+6x+4", "9x^2-12x+4"],              fd: ["(3x-2)^2", "(3x+2)(3x-2)", "(9x+2)^2"] },
    { p: "(4x+3y)^2", c: "16x^2+24xy+9y^2", d: ["16x^2+9y^2", "16x^2+12xy+9y^2", "16x^2-24xy+9y^2"], fd: ["(4x-3y)^2", "(4x+3y)(4x-3y)", "(4x+9y)^2"] },
    { p: "(x+7)^2",  c: "x^2+14x+49",  d: ["x^2+49", "x^2+7x+49", "x^2-14x+49"],              fd: ["(x-7)^2", "(x+7)(x-7)", "(x+14)^2"] },
    { p: "(2x+5y)^2", c: "4x^2+20xy+25y^2", d: ["4x^2+25y^2", "4x^2+10xy+25y^2", "4x^2-20xy+25y^2"], fd: ["(2x-5y)^2", "(2x+5y)(2x-5y)", "(2x+10y)^2"] },
    { p: "(x-4)^2",  c: "x^2-8x+16",   d: ["x^2+8x+16", "x^2-4x+16", "x^2-16"],               fd: ["(x+4)^2", "(x-4)(x+4)", "(x-8)^2"] },
    { p: "(x-2)^2",  c: "x^2-4x+4",    d: ["x^2+4x+4", "x^2-2x+4", "x^2-4"],                  fd: ["(x+2)^2", "(x-2)(x+2)", "(x-4)^2"] },
    { p: "(3x-1)^2", c: "9x^2-6x+1",   d: ["9x^2+6x+1", "9x^2-3x+1", "9x^2-1"],               fd: ["(3x+1)^2", "(3x-1)(3x+1)", "(9x-1)^2"] },
    { p: "(2x-5)^2", c: "4x^2-20x+25", d: ["4x^2+20x+25", "4x^2-10x+25", "4x^2-25"],          fd: ["(2x+5)^2", "(2x-5)(2x+5)", "(4x-5)^2"] },
    { p: "(5x-2y)^2", c: "25x^2-20xy+4y^2", d: ["25x^2+20xy+4y^2", "25x^2-10xy+4y^2", "25x^2-4y^2"], fd: ["(5x+2y)^2", "(5x-2y)(5x+2y)", "(5x-4y)^2"] },
    { p: "(x-8)^2",  c: "x^2-16x+64",  d: ["x^2+16x+64", "x^2-8x+64", "x^2-64"],              fd: ["(x+8)^2", "(x-8)(x+8)", "(x-16)^2"] },
    { p: "(3x-4y)^2", c: "9x^2-24xy+16y^2", d: ["9x^2+24xy+16y^2", "9x^2-12xy+16y^2", "9x^2-16y^2"], fd: ["(3x+4y)^2", "(3x-4y)(3x+4y)", "(3x-8y)^2"] },
    { p: "(x+5)(x-5)",   c: "x^2-25",  d: ["x^2+25", "x^2-10x+25", "x^2+10x-25"],             fd: ["(x-5)^2", "(x+5)^2", "(5+x)(5-x)"] },
    { p: "(x+8)(x-8)",   c: "x^2-64",  d: ["x^2+64", "x^2-16x+64", "x^2+16x-64"],             fd: ["(x-8)^2", "(x+8)^2", "(8+x)(8-x)"] },
    { p: "(2x+3)(2x-3)", c: "4x^2-9",  d: ["4x^2+9", "4x^2-12x+9", "4x^2+12x-9"],             fd: ["(2x-3)^2", "(2x+3)^2", "(3+2x)(3-2x)"] },
    { p: "(3x+4)(3x-4)", c: "9x^2-16", d: ["9x^2+16", "9x^2-24x+16", "9x^2+24x-16"],          fd: ["(3x-4)^2", "(3x+4)^2", "(4+3x)(4-3x)"] },
    { p: "(x+6)(x-6)",   c: "x^2-36",  d: ["x^2+36", "x^2-12x+36", "x^2+12x-36"],             fd: ["(x-6)^2", "(x+6)^2", "(6+x)(6-x)"] },
    { p: "(4x+5y)(4x-5y)", c: "16x^2-25y^2", d: ["16x^2+25y^2", "16x^2-40xy+25y^2", "16x^2+40xy-25y^2"], fd: ["(4x-5y)^2", "(4x+5y)^2", "(5y+4x)(5y-4x)"] },
    { p: "(7x+1)(7x-1)", c: "49x^2-1", d: ["49x^2+1", "49x^2-14x+1", "49x^2+14x-1"],          fd: ["(7x-1)^2", "(7x+1)^2", "(1+7x)(1-7x)"] },
  ];

  // ── Cross method bank: p = factored, c = trinomial, fd = wrong factorisations ──
  const CROSS_BANK = [
    { p: "(x-7)(x+1)", c: "x^2-6x-7", fd: ["(x-7)(x-1)", "(x+1)(x+7)", "(x-6)(x+1)"] },
    { p: "(x+1)(x+3)", c: "x^2+4x+3", fd: ["(x+1)(x-3)", "(x+3)(x-1)", "(x+2)(x+2)"] },
    { p: "(x-1)(x-13)", c: "x^2-14x+13", fd: ["(x+1)(x-13)", "(x-1)(x+13)", "(x-7)(x-7)"] },
    { p: "(x+1)(x+7)", c: "x^2+8x+7", fd: ["(x+1)(x-7)", "(x+7)(x-1)", "(x+2)(x+5)"] },
    { p: "(y+6)(y-2)", c: "y^2+4y-12", fd: ["(y+6)(y+2)", "(y-6)(y-2)", "(y+3)(y-4)"] },
    { p: "(n+5)(n+7)", c: "n^2+12n+35", fd: ["(n+5)(n-7)", "(n+7)(n-5)", "(n+6)(n+6)"] },
    { p: "(x-7y)(x+5y)", c: "x^2-2xy-35y^2", fd: ["(x-7y)(x-5y)", "(x+7y)(x+5y)", "(x-5y)(x-7y)"] },
    { p: "(x-3y)(x-5y)", c: "x^2-8xy+15y^2", fd: ["(x-3y)(x+5y)", "(x+3y)(x-5y)", "(x-4y)(x-4y)"] },
    { p: "(p+3q)(p+5q)", c: "p^2+8pq+15q^2", fd: ["(p+3q)(p-5q)", "(p-3q)(p+5q)", "(p+5q)(p+5q)"] },
    { p: "(x+2y)(x+15y)", c: "x^2+17xy+30y^2", fd: ["(x+2y)(x-15y)", "(x+3y)(x+10y)", "(x+5y)(x+6y)"] },
    { p: "(a-4b)(a-14b)", c: "a^2-18ab+56b^2", fd: ["(a+4b)(a-14b)", "(a-4b)(a+14b)", "(a-7b)(a-8b)"] },
    { p: "(s+7)(s-13)", c: "s^2-6s-91", fd: ["(s+7)(s+13)", "(s-7)(s-13)", "(s+1)(s-91)"] },
    { p: "(n+8)(n+9)", c: "n^2+17n+72", fd: ["(n+8)(n-9)", "(n+9)(n-8)", "(n+6)(n+12)"] },
    { p: "(x+4y)(x-8y)", c: "x^2-4xy-32y^2", fd: ["(x+4y)(x+8y)", "(x-4y)(x-8y)", "(x+2y)(x-16y)"] },
    { p: "(x-3y)(x+5y)", c: "x^2+2xy-15y^2", fd: ["(x-3y)(x-5y)", "(x+3y)(x+5y)", "(x-y)(x+15y)"] },
    // leading coefficient ≠ 1 (from worked solutions + classics)
    { p: "(2x+1)(x+3)", c: "2x^2+7x+3", fd: ["(2x+3)(x+1)", "(x+1)(x+3)", "(2x-1)(x-3)"] },
    { p: "(x+2)(2x-5)", c: "2x^2-x-10", fd: ["(x-2)(2x+5)", "(x+5)(2x+2)", "(2x+1)(x-10)"] },
    { p: "(2x-3)(7x-2)", c: "14x^2-25x+6", fd: ["(2x+3)(7x+2)", "(2x-1)(7x-6)", "(x-3)(14x-2)"] },
    { p: "(x-4)(6x+1)", c: "6x^2-23x-4", fd: ["(x+4)(6x-1)", "(x-1)(6x+4)", "(2x-4)(3x+1)"] },
    { p: "(a-2c)(3a-c)", c: "3a^2-7ac+2c^2", fd: ["(a+2c)(3a+c)", "(a-c)(3a-2c)", "(3a-2c)(a-c)"] },
    { p: "(x-3y)(5x-2y)", c: "5x^2-17xy+6y^2", fd: ["(x+3y)(5x+2y)", "(x-2y)(5x-3y)", "(x-6y)(5x-y)"] },
    { p: "(a-6)(5a-1)", c: "5a^2-31a+6", fd: ["(a+6)(5a+1)", "(a-1)(5a-6)", "(a-2)(5a-3)"] },
    { p: "(3x+4y)(5x-7y)", c: "15x^2-xy-28y^2", fd: ["(3x-4y)(5x+7y)", "(3x+7y)(5x-4y)", "(x+4y)(15x-7y)"] },
    { p: "(b-6)(5b-1)", c: "5b^2-31b+6", fd: ["(b+6)(5b+1)", "(b-1)(5b-6)", "(b-2)(5b-3)"] },
    { p: "(2\\theta+7\\phi)(3\\theta-2\\phi)", c: "6\\theta^2+17\\theta\\phi-14\\phi^2", fd: ["(2\\theta-7\\phi)(3\\theta+2\\phi)", "(\\theta+7\\phi)(6\\theta-2\\phi)", "(3\\theta+7\\phi)(2\\theta-2\\phi)"] },
  ];

  // ── runtime state ──
  let stage, promptEl, enemiesEl, cannonEl, overlayEl, setupEl, summaryEl, countdownEl;
  let elScore, elAcc, elStreak, elQnum;
  let mode = "expand", numQ = 10, speed = 30, lanes = 4;
  let running = false, inRound = false, locked = false, activeFlag = false, rafId = null, lastT = 0;
  let cannonLane = 1, fireCooldown = 0;
  let enemies = [], roundQueue = [], results = [];
  let curPrompt = "", curCorrect = "";
  let qIndex = 0, score = 0, answered = 0, correctCount = 0, streak = 0;
  let soundOn = true, audioCtx = null;

  function isPhoneCompact() {
    return window.FZPhone ? window.FZPhone.isPhoneCompact() : window.innerWidth <= 767;
  }
  function isTabletTouch() {
    if (isPhoneCompact()) return false;
    const de = document.documentElement;
    if (de.classList.contains("tablet-touch")) return true;
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }
  function isIdentityMode() {
    return mode === "expand" || mode === "factorize" || mode === "identify";
  }
  function usePhoneIdentityMode() {
    return isPhoneCompact() && isIdentityMode();
  }
  function phoneFallSpeed() {
    return isPhoneCompact() ? speed * 0.52 : speed;
  }

  function gameMetrics() {
    const phone = isPhoneCompact();
    const phoneIdentity = phone && stage && stage.classList.contains("game-stage--phone-identity");
    let promptH = phone ? 48 : 66;
    if (phoneIdentity && promptEl) {
      promptH = Math.max(promptH, promptEl.offsetHeight || promptH);
    }
    const cannonBottom = phone ? 14 : 18;
    const cannonH = phone ? 44 : 58;
    const y0 = promptH + 8;
    if (!stage) {
      return {
        y0, limit: phone ? 284 : 464, lanePad: phone ? 8 : 18,
        promptH, cannonBottom, cannonH, beamH: phone ? 300 : 460,
      };
    }
    const limit = stage.clientHeight - cannonBottom - cannonH - 8;
    const beamH = Math.max(120, limit - y0 + 16);
    return { y0, limit, lanePad: phone ? 8 : 18, promptH, cannonBottom, cannonH, beamH };
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function kx(el, tex, color) {
    try { katex.render(tex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = tex; }
    if (color) el.style.color = color;
  }
  /** Split adjacent factors like (x+5)(x-5) for two-line phone display. */
  function splitDualFactors(tex) {
    const m = String(tex).match(/^(\([^)]+\))(\([^)]+\))$/);
    return m ? [m[1], m[2]] : null;
  }
  function renderOptionTex(el, tex) {
    el.className = "enemy-tex";
    el.innerHTML = "";
    const parts = splitDualFactors(tex);
    if (!parts) {
      kx(el, tex, null);
      return;
    }
    el.className = "enemy-tex enemy-tex-split";
    parts.forEach((part) => {
      const row = document.createElement("div");
      row.className = "enemy-tex-line";
      kx(row, part, null);
      el.appendChild(row);
    });
  }
  function speedFromSlider(v) { return 12 * v + 6; }

  // ── audio ──
  function ensureAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } }
  function tone(type, freqA, freqB, dur, gain, t0) {
    const t = t0 == null ? audioCtx.currentTime : t0;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freqA, t);
    if (freqB) o.frequency.exponentialRampToValueAtTime(freqB, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
    o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur + 0.04);
  }
  function beep(type) {
    if (!soundOn || !audioCtx) return;
    if (type === "laser") tone("square", 880, 220, 0.12, 0.12);
    else if (type === "wrong") tone("sawtooth", 180, 70, 0.3, 0.16);
    else if (type === "tick") tone("triangle", 660, null, 0.1, 0.14);
    else if (type === "go") tone("triangle", 990, 1480, 0.25, 0.18);
    else if (type === "correct") {
      const t = audioCtx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, null, 0.16, 0.16, t + i * 0.07));
    }
  }

  function laneCenter(lane) { return stage.clientWidth * (lane + 0.5) / lanes; }

  function specExpand(b) { return { promptTex: b.p, correctTex: b.c, pool: [b.c].concat(b.d) }; }
  function specFactorize(b) { return { promptTex: b.c, correctTex: b.p, pool: [b.p].concat(b.fd) }; }
  /** Phone identities: always expanded prompt + factorized answer options. */
  function specPhoneIdentity(b) { return { promptTex: b.c, correctTex: b.p, pool: [b.p].concat(b.fd) }; }

  function basisFor(m) {
    if (m === "cross") return CROSS_BANK.map(specFactorize);
    if (m === "factorize") return BANK.map(specFactorize);
    return BANK.map(specExpand);
  }
  function buildRoundQueue() {
    const basis = usePhoneIdentityMode() ? BANK.map(specPhoneIdentity) : basisFor(mode);
    const out = []; let pool = [];
    while (out.length < numQ) { if (pool.length === 0) pool = shuffle(basis); out.push(pool.pop()); }
    return out;
  }

  function buildOptions(cur) {
    const pool = cur.pool;
    if (usePhoneIdentityMode()) {
      const wrong = pool.filter((t) => t !== cur.correctTex);
      const picks = shuffle(wrong).slice(0, 2);
      return shuffle([
        { tex: cur.correctTex, correct: true },
        ...picks.map((tex) => ({ tex, correct: false })),
      ]);
    }
    return shuffle(pool.map((t) => ({ tex: t, correct: t === cur.correctTex })));
  }

  function spawnQuestion() {
    enemies.forEach((e) => e.el.remove()); enemies = [];
    if (qIndex >= numQ) { endRound(); return; }
    const cur = roundQueue[qIndex];
    curPrompt = cur.promptTex; curCorrect = cur.correctTex;
    const phoneIdentity = usePhoneIdentityMode();
    if (stage) stage.classList.toggle("game-stage--phone-identity", phoneIdentity);
    lanes = phoneIdentity ? 3 : cur.pool.length;
    kx(promptEl, cur.promptTex, C.ink);
    elQnum.textContent = (qIndex + 1) + "/" + numQ;
    cannonLane = Math.min(cannonLane, lanes - 1);
    const opts = buildOptions(cur);
    const m = gameMetrics();
    opts.forEach((opt, lane) => {
      const el = document.createElement("div");
      el.className = "enemy";
      const inner = document.createElement("div");
      el.appendChild(inner);
      renderOptionTex(inner, opt.tex);
      if (inner.classList.contains("enemy-tex-split")) el.classList.add("enemy-split");
      enemiesEl.appendChild(el);
      const e = {
        el, lane, y: m.y0, correct: opt.correct, tex: opt.tex, dead: false,
      };
      el.addEventListener("click", () => { if (running && !locked) { cannonLane = lane; placeCannon(); fire(); } });
      enemies.push(e); placeEnemy(e);
    });
    placeCannon(); locked = false;
  }
  function placeEnemy(e) {
    const m = gameMetrics();
    const w = stage.clientWidth / lanes;
    const boxW = w - m.lanePad;
    e.el.style.width = boxW + "px";
    e.el.style.left = (laneCenter(e.lane) - boxW / 2) + "px";
    e.el.style.removeProperty("bottom");
    e.el.style.top = e.y + "px";
    const inner = e.el.firstElementChild;
    if (inner && usePhoneIdentityMode()) {
      const split = inner.classList.contains("enemy-tex-split");
      const px = Math.max(13, Math.min(split ? 19 : 24, boxW / (split ? 6.8 : 5.4)));
      inner.style.fontSize = px + "px";
      inner.style.lineHeight = split ? "1.08" : "1.12";
      inner.style.width = "100%";
      inner.style.textAlign = "center";
      inner.querySelectorAll(".katex").forEach((k) => { k.style.fontSize = "1em"; });
    } else if (isPhoneCompact() && inner) {
      const fs = Math.max(9, Math.min(13, stage.clientWidth / 40));
      inner.style.fontSize = fs + "px";
      const katexEl = inner.querySelector(".katex");
      if (katexEl) katexEl.style.fontSize = "0.85em";
    }
  }
  function placeCannon() { cannonEl.style.left = (laneCenter(cannonLane) - cannonEl.offsetWidth / 2) + "px"; }

  function flashLaser(lane) {
    const m = gameMetrics();
    const beam = document.createElement("div"); beam.className = "laser-beam";
    beam.style.left = (laneCenter(lane) - 3) + "px";
    beam.style.height = m.beamH + "px";
    beam.style.bottom = (m.cannonBottom + m.cannonH) + "px";
    enemiesEl.appendChild(beam);
    setTimeout(() => beam.remove(), 140);
  }
  function boom(e, ok) {
    const fx = document.createElement("div"); fx.className = "boom " + (ok ? "boom-ok" : "boom-bad");
    fx.style.left = e.el.style.left; fx.style.top = e.el.style.top; fx.style.width = e.el.style.width;
    enemiesEl.appendChild(fx); setTimeout(() => fx.remove(), 420);
  }
  function shake() { stage.classList.add("shake"); setTimeout(() => stage.classList.remove("shake"), 300); }
  function highlightCorrect() {
    const c = enemies.find((e) => e.correct);
    if (c) { c.el.style.background = "linear-gradient(180deg,#bff3cf,#81e7a0)"; c.el.style.borderColor = "#d7ffe6"; }
  }

  function resolve(chosen, ok) {
    if (locked) return; locked = true;
    results.push({ p: curPrompt, correctTex: curCorrect, chosenTex: chosen, ok: ok });
    answered++;
    if (ok) { correctCount++; streak++; score += 100 + (streak - 1) * 20; }
    else { streak = 0; score = Math.max(0, score - 20); }
    updateHud(); qIndex++;
    setTimeout(spawnQuestion, ok ? 360 : 850);
  }
  function fire() {
    if (!running || locked || fireCooldown > 0) return;
    fireCooldown = 0.22; flashLaser(cannonLane); beep("laser");
    const target = enemies.find((e) => e.lane === cannonLane && !e.dead);
    if (!target) return;
    target.el.style.visibility = "hidden";
    if (target.correct) { boom(target, true); beep("correct"); resolve(target.tex, true); }
    else { boom(target, false); beep("wrong"); shake(); highlightCorrect(); resolve(target.tex, false); }
  }
  function miss() { if (locked) return; beep("wrong"); shake(); highlightCorrect(); resolve(null, false); }

  function updateHud() {
    elScore.textContent = score;
    elAcc.textContent = (answered ? Math.round((correctCount / answered) * 100) : 100) + "%";
    elStreak.textContent = streak;
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    if (fireCooldown > 0) fireCooldown -= dt;
    const limit = gameMetrics().limit;
    let reached = false;
    if (!locked) {
      const fall = phoneFallSpeed();
      enemies.forEach((e) => {
        if (e.dead) return;
        e.y += fall * dt;
        e.el.style.top = e.y + "px";
        if (e.y >= limit) reached = true;
      });
      if (reached) miss();
    }
    rafId = requestAnimationFrame(loop);
  }

  function runCountdown(done) {
    countdownEl.classList.remove("hidden");
    let n = 3;
    const step = () => {
      countdownEl.classList.remove("cd-pop"); void countdownEl.offsetWidth; countdownEl.classList.add("cd-pop");
      if (n > 0) { countdownEl.textContent = n; beep("tick"); n--; setTimeout(step, 700); }
      else { countdownEl.textContent = "Go!"; beep("go"); setTimeout(() => { countdownEl.classList.add("hidden"); done(); }, 520); }
    };
    step();
  }

  function startRound() {
    ensureAudio(); if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    roundQueue = buildRoundQueue();
    results = []; qIndex = 0; score = 0; answered = 0; correctCount = 0; streak = 0;
    lanes = roundQueue[0] ? (usePhoneIdentityMode() ? 3 : roundQueue[0].pool.length) : 4;
    cannonLane = Math.floor(lanes / 2);
    overlayEl.classList.add("hidden");
    updateHud(); spawnQuestion(); // first question shown (static) during countdown
    running = false;
    runCountdown(() => {
      inRound = true;
      if (activeFlag) { running = true; lastT = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop); }
    });
  }

  function endRound() {
    running = false; inRound = false;
    enemies.forEach((e) => e.el.remove()); enemies = [];
    kx(promptEl, "\\;", C.ink);
    showSummary();
  }
  function showSummary() {
    document.getElementById("sum-stats").textContent =
      "Score " + score + "  ·  " + correctCount + "/" + results.length + " correct  ·  " +
      (results.length ? Math.round((correctCount / results.length) * 100) : 0) + "% accuracy";
    const list = document.getElementById("sum-list"); list.innerHTML = "";
    results.forEach((r, i) => {
      const row = document.createElement("div"); row.className = "sum-row";
      const mark = document.createElement("span"); mark.className = "sum-mark " + (r.ok ? "sum-ok" : "sum-bad");
      mark.textContent = r.ok ? "\u2713" : "\u2717";
      const idx = document.createElement("span"); idx.textContent = (i + 1) + ".";
      const q = document.createElement("span"); q.className = "sum-q"; kx(q, r.p);
      const arrow = document.createElement("span"); arrow.className = "sum-arrow"; arrow.textContent = "\u2192";
      const ans = document.createElement("span"); ans.className = "sum-ans";
      if (r.chosenTex) kx(ans, r.chosenTex); else ans.textContent = "(missed)";
      row.appendChild(mark); row.appendChild(idx); row.appendChild(q); row.appendChild(arrow); row.appendChild(ans);
      if (!r.ok) { const cc = document.createElement("span"); cc.className = "sum-correct"; kx(cc, r.correctTex); row.appendChild(cc); }
      list.appendChild(row);
    });
    summaryEl.classList.remove("hidden"); setupEl.classList.add("hidden"); overlayEl.classList.remove("hidden");
  }
  function showSetup() { summaryEl.classList.add("hidden"); setupEl.classList.remove("hidden"); overlayEl.classList.remove("hidden"); }

  const MODE_NOTES = {
    expand: "Expand: match the factored form to its expansion (4 answers).",
    factorize: "Factorize: match the expanded form back to its factorization (4 answers).",
    cross: "Cross method: factorise the quadratic by shooting the correct pair of factors (4 answers). Includes leading coefficient \u2260 1.",
  };
  const PHONE_MODE_NOTES = {
    expand: "Phone: expanded form at top — pick the matching factorization (3 answers).",
    factorize: "Phone: expanded form at top — pick the matching factorization (3 answers).",
    identify: "Phone: expanded form at top — pick the matching factorization (3 answers).",
  };
  function refreshModeNote() {
    const el = document.getElementById("ov-mode-note");
    if (!el) return;
    if (isPhoneCompact() && PHONE_MODE_NOTES[mode]) el.textContent = PHONE_MODE_NOTES[mode];
    else el.textContent = MODE_NOTES[mode] || MODE_NOTES.expand;
  }

  function onKey(ev) {
    if (!running) {
      if ((ev.key === " " || ev.key === "Enter") && !overlayEl.classList.contains("hidden") && !setupEl.classList.contains("hidden")) { startRound(); ev.preventDefault(); }
      return;
    }
    if (ev.key === "ArrowLeft") { cannonLane = Math.max(0, cannonLane - 1); placeCannon(); ev.preventDefault(); }
    else if (ev.key === "ArrowRight") { cannonLane = Math.min(lanes - 1, cannonLane + 1); placeCannon(); ev.preventDefault(); }
    else if (ev.key === " " || ev.key === "ArrowUp") { fire(); ev.preventDefault(); }
  }
  function resize() {
    if (!stage) return;
    const m = gameMetrics();
    enemies.forEach((e) => {
      if (e.y < m.y0) e.y = m.y0;
      placeEnemy(e);
    });
    placeCannon();
  }

  /* ── Cross Method Snake ─────────────────────────────────────────────────── */
  const SN = {
    mounted: false, running: false, won: false, loop: null, mode: "normal",
    canvas: null, ctx: null, prompt: null, msg: null, startBtn: null,
    levelEl: null, livesEl: null, scoreEl: null,
    level: 1, lives: 3, score: 0, grow: 0, cell: 22, cols: 24, rows: 24,
    snake: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    foods: [], cur: null, collected: [], gcfCollected: false,
  };
  function gcfChoices(k) {
    if (k === 2) return [1, 2, 4];
    if (k === 3 || k === 5 || k === 7) return [3, 5, 7];
    const facs = [];
    for (let i = 2; i <= k; i++) if (k % i === 0) facs.push(i);
    if (facs.length >= 3) return facs.slice().sort((a, b) => a - b);
    const pool = k % 2 === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8];
    const extras = pool.filter((n) => !facs.includes(n));
    const third = extras[(Math.random() * extras.length) | 0];
    return shuffle(facs.concat([third]));
  }
  function plainExpr(s) { return s.replace(/\s+/g, ""); }
  function signed(n) { return n < 0 ? String(n) : "+" + n; }
  function linFactor(n) { return "(x" + signed(n) + ")"; }
  function factorKey(s) {
    const nums = [];
    const re = /\(x([+-]\d+)\)/g;
    let m;
    while ((m = re.exec(s))) nums.push(parseInt(m[1], 10));
    return nums.sort((a, b) => a - b).join(",");
  }
  function trinomial(p, q, k) {
    k = k || 1;
    const b = p + q, c = p * q;
    const A = k, B = k * b, Cc = k * c;
    const lead = A === 1 ? "x^2" : A + "x^2";
    const mid = B === 0 ? "" : (B === 1 ? "+x" : B === -1 ? "-x" : signed(B) + "x");
    return lead + mid + signed(Cc);
  }
  function randRoot() {
    let n = 0;
    while (n === 0) n = ((Math.random() * 19) | 0) - 9;
    return n;
  }
  function snakeQuestion() {
    let p = randRoot(), q = randRoot();
    while (q === p || q === -p || p + q === 0) q = randRoot();
    const f1 = linFactor(p), f2 = linFactor(q);
    if (SN.mode === "advanced") {
      const k = [2, 3, 4, 5, 6, 7, 8, 9][(Math.random() * 8) | 0];
      const otherFactors = [];
      while (otherFactors.length < 2) {
        const r = randRoot();
        const tex = linFactor(r);
        if (tex !== f1 && tex !== f2 && !otherFactors.includes(tex)) otherFactors.push(tex);
      }
      return {
        prompt: trinomial(p, q, k),
        k,
        correct: [f1, f2],
        gcfOpts: shuffle(gcfChoices(k)),
        opts: shuffle([f1, f2].concat(otherFactors)),
      };
    }
    const correct = f1 + f2;
    const distractors = [
      linFactor(-p) + linFactor(q),
      linFactor(p) + linFactor(-q),
      linFactor(p + (p > 0 ? 1 : -1)) + linFactor(q),
      linFactor(p) + linFactor(q + (q > 0 ? 1 : -1)),
      linFactor(-p) + linFactor(-q),
    ].filter((x, i, arr) => x !== correct && arr.indexOf(x) === i);
    return { prompt: trinomial(p, q), correct, opts: shuffle([correct].concat(shuffle(distractors).slice(0, 3))) };
  }
  function snakeResetBody() {
    snakeApplyGrid();
    const len = 3 + Math.max(0, SN.level - 1);
    SN.snake = [];
    const midY = Math.floor(SN.rows / 2);
    const startX = Math.floor(SN.cols / 2) - 2;
    for (let i = 0; i < len; i++) SN.snake.push({ x: startX - i, y: midY });
    SN.dir = { x: 1, y: 0 }; SN.nextDir = { x: 1, y: 0 };
  }
  function snakeApplyGrid() {
    if (isPhoneCompact()) {
      SN.cols = 20;
      SN.rows = 20;
    } else {
      SN.cols = 24;
      SN.rows = 24;
    }
  }
  function snakeFoodText(item) {
    return item.type === "gcf" ? String(item.value) : plainExpr(item.tex);
  }
  function snakeFoodLines(item) {
    const text = snakeFoodText(item);
    if (!isPhoneCompact() || item.type === "gcf") return [text];
    const idx = text.indexOf(")(");
    if (item._forceSplit && idx >= 0) return [text.slice(0, idx + 1), text.slice(idx + 1)];
    if (text.length <= 10 || idx < 0) return [text];
    return [text.slice(0, idx + 1), text.slice(idx + 1)];
  }
  function snakeMeasureLines(ctx, lines, fontSize) {
    let maxTw = 0;
    let totalH = 0;
    const lineH = fontSize * 1.12;
    const lineGap = fontSize * 0.14;
    lines.forEach((line, i) => {
      maxTw = Math.max(maxTw, ctx.measureText(line).width);
      totalH += lineH;
      if (i < lines.length - 1) totalH += lineGap;
    });
    return { maxTw, totalH, lineH, lineGap };
  }
  function snakeMeasureFoodBox(ctx, item, cell, slotMaxW, slotMaxH) {
    let lines = snakeFoodLines(item);
    const padX = Math.max(10, cell * 0.35);
    const padY = Math.max(8, cell * 0.22);
    let fontSize = Math.max(13, Math.min(17, cell * 1.0));
    const minFont = 11;
    const gap = 1;

    function measureAt(fs, useLines) {
      ctx.font = "900 " + fs + "px JetBrains Mono, monospace";
      const lm = snakeMeasureLines(ctx, useLines, fs);
      const boxW = lm.maxTw + padX * 2;
      const boxH = lm.totalH + padY * 2;
      const w = Math.ceil(boxW / cell) + gap;
      const h = Math.ceil(boxH / cell) + gap;
      return { fontSize: fs, padX, padY, boxW, boxH, w, h, lines: useLines, lineGap: lm.lineGap, lineH: lm.lineH };
    }

    for (let fs = fontSize; fs >= minFont; fs--) {
      let m = measureAt(fs, lines);
      if (slotMaxW && (m.w > slotMaxW || m.h > slotMaxH)) {
        if (lines.length === 1 && snakeFoodText(item).length > 10 && item.type !== "gcf") {
          lines = snakeFoodLines(Object.assign({}, item, { _forceSplit: true }));
          if (lines.length > 1) {
            m = measureAt(fs, lines);
          }
        }
      }
      if (!slotMaxW || (m.w <= slotMaxW && m.h <= slotMaxH)) return m;
    }

    lines = snakeFoodLines(item);
    if (lines.length === 1 && item.type !== "gcf") {
      const text = snakeFoodText(item);
      const idx = text.indexOf(")(");
      if (idx >= 0) lines = [text.slice(0, idx + 1), text.slice(idx + 1)];
    }
    return measureAt(minFont, lines);
  }
  function snakePhoneSlotAnchors(count) {
    const pad = 1;
    const cols = SN.cols;
    const rows = SN.rows;
    const hw = Math.floor((cols - pad * 2) / 2);
    const hh = Math.floor((rows - pad * 2) / 2);
    const quads = [
      { x: pad, y: pad, maxW: hw - 1, maxH: hh - 1 },
      { x: pad + hw, y: pad, maxW: cols - pad - hw - 1, maxH: hh - 1 },
      { x: pad, y: pad + hh, maxW: hw - 1, maxH: rows - pad - hh - 1 },
      { x: pad + hw, y: pad + hh, maxW: cols - pad - hw - 1, maxH: rows - pad - hh - 1 },
    ];
    if (count <= 4) return shuffle(quads).slice(0, count);
    const thirds = Math.floor((cols - pad * 2) / 3);
    const anchors = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        anchors.push({
          x: pad + col * thirds,
          y: pad + row * hh,
          maxW: thirds - 1,
          maxH: hh - 1,
        });
      }
    }
    return shuffle(anchors).slice(0, count);
  }
  function snakeFoodDims(item) {
    if (!isPhoneCompact()) return item;
    const ctx = SN.ctx || (SN.canvas && SN.canvas.getContext("2d"));
    const cell = SN.cell || Math.max(14, (SN.canvas && SN.canvas.width ? SN.canvas.width / SN.cols : 18));
    if (!ctx) return item;
    const m = snakeMeasureFoodBox(ctx, item, cell);
    return Object.assign({}, item, { w: m.w, h: m.h, metrics: m });
  }
  function snakePlacePhoneFoods(items) {
    const ctx = SN.ctx;
    const cell = SN.cell;
    if (!ctx || !cell) return [];
    const slots = snakePhoneSlotAnchors(items.length);
    const spots = [];
    const blocked = (x, y, w, h) => {
      if (SN.snake.some((p) => p.x >= x - 1 && p.x < x + w + 1 && p.y >= y - 1 && p.y < y + h + 1)) return true;
      return spots.some((s) => x < s.x + s.w + 1 && x + w + 1 > s.x && y < s.y + s.h + 1 && y + h + 1 > s.y);
    };
    items.forEach((item, i) => {
      const slot = slots[i];
      if (!slot) return;
      const m = snakeMeasureFoodBox(ctx, item, cell, slot.maxW, slot.maxH);
      if (m.w > slot.maxW || m.h > slot.maxH) return;
      const x = slot.x + Math.max(0, Math.floor((slot.maxW - m.w) / 2));
      const y = slot.y + Math.max(0, Math.floor((slot.maxH - m.h) / 2));
      if (blocked(x, y, m.w, m.h)) return;
      spots.push(Object.assign({}, item, { x, y, w: m.w, h: m.h, metrics: m }));
    });
    return spots;
  }
  function snakeFoodSpots() {
    snakeApplyGrid();
    const spots = [];
    const blocked = (x, y, w, h) => {
      if (SN.snake.some((p) => p.x >= x - 1 && p.x < x + w + 1 && p.y >= y - 1 && p.y < y + h + 1)) return true;
      return spots.some((s) => x < s.x + s.w + 1 && x + w + 1 > s.x && y < s.y + s.h + 1 && y + h + 1 > s.y);
    };
    const items = [];
    if (SN.mode === "advanced") {
      if (!SN.gcfCollected) {
        SN.cur.gcfOpts.forEach((val) => {
          items.push({ type: "gcf", value: val, correct: val === SN.cur.k, tex: String(val), w: 2, h: 2 });
        });
      }
      SN.cur.opts.forEach((tex) => {
        if (SN.collected.includes(tex)) return;
        items.push({ type: "factor", tex, correct: SN.cur.correct.includes(tex), w: 5, h: 2 });
      });
    } else {
      SN.cur.opts.forEach((tex) => {
        const correct = factorKey(tex) === factorKey(SN.cur.correct);
        items.push({ type: "factor", tex, correct, w: 5, h: 2 });
      });
    }
    if (isPhoneCompact() && SN.ctx) {
      SN.foods = snakePlacePhoneFoods(items);
      return;
    }
    items.forEach((item) => {
      const sized = snakeFoodDims(item);
      const w = sized.w, h = sized.h;
      let x = 1, y = 1, guard = 0;
      let placed = false;
      do {
        x = (Math.random() * (SN.cols - w - 1) + 1) | 0;
        y = (Math.random() * (SN.rows - h - 1) + 1) | 0;
        guard++;
        if (!blocked(x, y, w, h)) placed = true;
      } while (!placed && guard < 300);
      if (placed) spots.push(Object.assign({ x, y }, sized));
    });
    SN.foods = spots;
  }
  function snakeAdvancedDone() {
    return SN.gcfCollected && SN.collected.length >= 2;
  }
  function snakeAdvancedNeedMsg() {
    const need = [];
    if (!SN.gcfCollected) need.push("the common factor");
    if (SN.collected.length < 2) need.push(SN.collected.length ? "the other factor" : "both factors");
    return "Good. Eat " + need.join(" and ") + " too.";
  }
  function snakeFinishLevel() {
    SN.score += 100;
    if (SN.level >= 5) {
      SN.won = true;
      snakeStop("You win! 5 levels cleared.", "ok");
      return true;
    }
    SN.level++;
    snakeNewLevel(true);
    return true;
  }
  function snakeRenderPrompt() {
    if (!SN.prompt) return;
    SN.prompt.innerHTML = "";
    const span = document.createElement("span");
    kx(span, SN.cur ? SN.cur.prompt : "\\;");
    SN.prompt.appendChild(span);
  }
  function snakeNewLevel(keepSnake) {
    SN.cur = snakeQuestion();
    SN.collected = [];
    SN.gcfCollected = false;
    if (!keepSnake) snakeResetBody();
    snakeFoodSpots();
    snakeRenderPrompt();
    snakeUpdateHud("");
    snakeDraw();
  }
  function snakeStart() {
    SN.level = 1; SN.lives = 3; SN.score = 0; SN.grow = 0; SN.won = false; SN.running = true;
    SN.startBtn.textContent = "Restart Snake";
    snakeNewLevel(false);
    clearInterval(SN.loop);
    SN.loop = setInterval(snakeStep, 330);
  }
  function snakeUpdateHud(message, cls) {
    SN.levelEl.textContent = SN.level;
    SN.livesEl.textContent = SN.lives;
    SN.scoreEl.textContent = SN.score;
    SN.msg.textContent = message || "";
    SN.msg.className = "snake-msg" + (cls ? " " + cls : "");
  }
  function snakeStop(message, cls) {
    SN.running = false;
    clearInterval(SN.loop);
    snakeUpdateHud(message, cls);
  }
  function snakeLoseLife(reason) {
    SN.lives--;
    if (SN.lives <= 0) {
      snakeStop("Game over. Press Restart Snake to try again.", "bad");
      return;
    }
    snakeUpdateHud(reason + " Lost 1 life.", "bad");
    snakeResetBody();
    snakeDraw();
  }
  function snakeEat(food) {
    if (!food.correct) {
      snakeLoseLife(food.type === "gcf" ? "Wrong common factor." : "Wrong factorization.");
      return false;
    }
    if (SN.mode === "advanced") {
      if (food.type === "gcf") {
        SN.gcfCollected = true;
        SN.score += 50;
      } else if (!SN.collected.includes(food.tex)) {
        SN.collected.push(food.tex);
      }
      SN.foods = SN.foods.filter((f) => f !== food);
      if (snakeAdvancedDone()) return snakeFinishLevel();
      snakeUpdateHud(snakeAdvancedNeedMsg(), "ok");
      return false;
    }
    SN.foods = SN.foods.filter((f) => f !== food);
    var shouldGrow = true;
    SN.score += 100;
    if (SN.level >= 5) {
      SN.won = true;
      snakeStop("You win! 5 levels cleared.", "ok");
      return shouldGrow;
    }
    SN.level++;
    snakeNewLevel(true);
    return shouldGrow;
  }
  function snakeStep() {
    if (!SN.running) return;
    if (SN.nextDir.x + SN.dir.x !== 0 || SN.nextDir.y + SN.dir.y !== 0) SN.dir = SN.nextDir;
    const head = SN.snake[0];
    const next = { x: head.x + SN.dir.x, y: head.y + SN.dir.y };
    if (next.x < 0 || next.x >= SN.cols || next.y < 0 || next.y >= SN.rows) {
      snakeLoseLife("The snake hit a wall.");
      return;
    }
    if (SN.snake.some((p) => p.x === next.x && p.y === next.y)) {
      snakeLoseLife("The snake ran into itself.");
      return;
    }
    SN.snake.unshift(next);
    const food = SN.foods.find((f) => next.x >= f.x && next.x < f.x + f.w && next.y >= f.y && next.y < f.y + f.h);
    if (food) {
      if (!snakeEat(food)) SN.snake.pop();
    }
    else if (SN.grow > 0) SN.grow--;
    else SN.snake.pop();
    snakeDraw();
  }
  function snakeDrawFoodText(ctx, text, bx, by, bw, bh) {
    const padX = 6;
    const padY = 4;
    const minSize = 8;
    let size = Math.min(16, Math.floor((bh - padY * 2) * 0.52));
    const maxW = bw - padX * 2;
    const maxH = bh - padY * 2;
    do {
      ctx.font = "900 " + size + "px JetBrains Mono, monospace";
      const tw = ctx.measureText(text).width;
      const th = size * 1.12;
      if (tw <= maxW && th <= maxH) break;
      size--;
    } while (size > minSize);
    ctx.font = "900 " + size + "px JetBrains Mono, monospace";
    return { size };
  }
  function snakeDrawFoodItem(ctx, f, x, y, bw, bh) {
    const phone = isPhoneCompact();
    const radius = f.type === "gcf" ? 5 : 8;
    if (phone && f.metrics) {
      const m = f.metrics;
      const bx = x + (bw - m.boxW) / 2;
      const by = y + (bh - m.boxH) / 2;
      ctx.fillStyle = f.type === "gcf" ? "#fde68a" : "#cbd5e1";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, m.boxW, m.boxH, radius, true, true);
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 " + m.fontSize + "px JetBrains Mono, monospace";
      if (m.lines.length === 1) {
        ctx.fillText(m.lines[0], bx + m.boxW / 2, by + m.boxH / 2);
      } else {
        let ly = by + m.padY + m.lineH / 2;
        m.lines.forEach((line, i) => {
          ctx.fillText(line, bx + m.boxW / 2, ly);
          if (i < m.lines.length - 1) ly += m.lineH + m.lineGap;
        });
      }
      return;
    }
    const text = snakeFoodText(f);
    const metrics = snakeDrawFoodText(ctx, text, x, y, bw, bh);
    ctx.fillStyle = f.type === "gcf" ? "#fde68a" : "#cbd5e1";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    const pad = f.type === "gcf" ? 2 : 3;
    roundRect(ctx, x + pad, y + pad, bw - pad * 2, bh - pad * 2, radius, true, true);
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 " + metrics.size + "px JetBrains Mono, monospace";
    ctx.fillText(text, x + bw / 2, y + bh / 2);
  }
  function snakeDraw() {
    if (!SN.ctx) return;
    const ctx = SN.ctx, W = SN.canvas.width, H = SN.canvas.height;
    SN.cell = W / SN.cols;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07101f"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,.12)";
    for (let i = 0; i <= SN.cols; i++) { ctx.beginPath(); ctx.moveTo(i * SN.cell, 0); ctx.lineTo(i * SN.cell, H); ctx.stroke(); }
    for (let j = 0; j <= SN.rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * SN.cell); ctx.lineTo(W, j * SN.cell); ctx.stroke(); }
    SN.foods.forEach((f) => {
      const x = f.x * SN.cell, y = f.y * SN.cell;
      const bw = SN.cell * f.w, bh = SN.cell * f.h;
      snakeDrawFoodItem(ctx, f, x, y, bw, bh);
    });
    SN.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#fb923c" : "#fde047";
      roundRect(ctx, p.x * SN.cell + 3, p.y * SN.cell + 3, SN.cell - 6, SN.cell - 6, 7, true, false);
    });
  }
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) ctx.fill(); if (stroke) ctx.stroke();
  }
  function snakeKey(ev) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") SN.nextDir = { x: -1, y: 0 };
    else if (k === "arrowright" || k === "d") SN.nextDir = { x: 1, y: 0 };
    else if (k === "arrowup" || k === "w") SN.nextDir = { x: 0, y: -1 };
    else if (k === "arrowdown" || k === "s") SN.nextDir = { x: 0, y: 1 };
    else return;
    ev.preventDefault();
  }
  function setSnakeDir(dir) {
    if (dir === "left") SN.nextDir = { x: -1, y: 0 };
    else if (dir === "right") SN.nextDir = { x: 1, y: 0 };
    else if (dir === "up") SN.nextDir = { x: 0, y: -1 };
    else if (dir === "down") SN.nextDir = { x: 0, y: 1 };
  }
  function resizeSnakeBoard() {
    if (!SN.canvas) return;
    const wrap = SN.canvas.parentElement;
    if (!wrap) return;
    let size;
    if (isPhoneCompact()) {
      const game = document.getElementById("snake-game");
      if (game && !game.classList.contains("hidden")) {
        const boardWrap = game.querySelector(".snake-board-wrap");
        const controls = game.querySelector(".snake-controls");
        const modes = game.querySelector(".snake-modes");
        const stats = game.querySelector(".snake-hud-stats");
        const msg = game.querySelector(".snake-msg");
        if (boardWrap && controls) {
          const top = boardWrap.getBoundingClientRect().top;
          let bottom = controls.offsetHeight + 6;
          if (modes) bottom += modes.offsetHeight + 4;
          if (stats) bottom += stats.offsetHeight + 4;
          if (msg && msg.textContent.trim()) bottom += msg.offsetHeight + 2;
          const budgetH = window.innerHeight - top - bottom - 6;
          size = Math.min(wrap.clientWidth - 12, budgetH, 420);
        } else {
          size = Math.min(wrap.clientWidth - 12, window.innerHeight * 0.4, 380);
        }
      } else {
        size = Math.min(wrap.clientWidth - 12, window.innerHeight * 0.4, 380);
      }
    } else if (isTabletTouch()) {
      // iPad: the stylesheet box (width:min(100%,760px) + max-height:78vh) goes
      // non-square in landscape while the canvas buffer stays square, so WebKit
      // stretches the drawing. Force the CSS box to the exact square buffer size.
      size = Math.min(wrap.clientWidth - 24, window.innerHeight * 0.62, 640);
      if (size >= 100) {
        const cssPx = Math.floor(size);
        SN.canvas.style.width = cssPx + "px";
        SN.canvas.style.height = cssPx + "px";
        SN.canvas.style.maxWidth = "100%";
        SN.canvas.style.maxHeight = "none";
        SN.canvas.style.aspectRatio = "1 / 1";
      }
    } else {
      size = Math.min(wrap.clientWidth - 24, window.innerHeight * 0.42, 520);
    }
    if (size < 100) return;
    const px = Math.floor(size);
    const sizeChanged = SN.canvas.width !== px || SN.canvas.height !== px;
    const prevCols = SN.cols;
    const prevRows = SN.rows;
    snakeApplyGrid();
    const gridChanged = prevCols !== SN.cols || prevRows !== SN.rows;
    SN.canvas.width = px;
    SN.canvas.height = px;
    SN.cell = SN.canvas.width / SN.cols;
    if (isPhoneCompact() && SN.cur && (sizeChanged || gridChanged || !SN.foods.length)) snakeFoodSpots();
    snakeDraw();
  }
  function mountSnake() {
    if (SN.mounted) return;
    SN.canvas = document.getElementById("snake-board");
    if (!SN.canvas) return;
    SN.ctx = SN.canvas.getContext("2d");
    SN.prompt = document.getElementById("sn-prompt");
    SN.msg = document.getElementById("sn-msg");
    SN.startBtn = document.getElementById("sn-start");
    SN.levelEl = document.getElementById("sn-level");
    SN.livesEl = document.getElementById("sn-lives");
    SN.scoreEl = document.getElementById("sn-score");
    SN.startBtn.addEventListener("click", snakeStart);
    document.querySelectorAll("[data-snake-mode]").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("[data-snake-mode]").forEach((x) => x.classList.toggle("active", x === b));
        SN.mode = b.dataset.snakeMode;
        SN.running = false; clearInterval(SN.loop);
        SN.level = 1; SN.lives = 3; SN.score = 0; SN.gcfCollected = false; SN.startBtn.textContent = "Start Snake";
        SN.cur = snakeQuestion(); snakeResetBody(); snakeFoodSpots(); snakeRenderPrompt(); snakeUpdateHud(""); snakeDraw();
      });
    });
    document.querySelectorAll("[data-snake-dir]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); setSnakeDir(b.dataset.snakeDir); });
      b.addEventListener("click", (e) => { e.preventDefault(); setSnakeDir(b.dataset.snakeDir); });
    });
    window.addEventListener("keydown", (e) => {
      if (activeFlag && document.getElementById("snake-game") && !document.getElementById("snake-game").classList.contains("hidden")) snakeKey(e);
    });
    SN.mounted = true;
    SN.cur = snakeQuestion(); snakeResetBody(); snakeFoodSpots(); snakeRenderPrompt(); snakeDraw();
    resizeSnakeBoard();
  }
  function setFactorGame(modeName) {
    document.querySelectorAll("[data-factor-game]").forEach((b) => b.classList.toggle("active", b.dataset.factorGame === modeName));
    const blaster = document.getElementById("game-blaster"), snake = document.getElementById("snake-game");
    if (blaster) blaster.classList.toggle("hidden", modeName !== "blaster");
    if (snake) snake.classList.toggle("hidden", modeName !== "snake");
    running = false; cancelAnimationFrame(rafId);
    if (modeName !== "snake") { SN.running = false; clearInterval(SN.loop); }
    if (modeName === "snake") {
      mountSnake();
      snakeDraw();
      if (isPhoneCompact()) {
        requestAnimationFrame(() => {
          resizeSnakeBoard();
          requestAnimationFrame(resizeSnakeBoard);
        });
      }
    }
  }

  const Game = {
    mounted: false,
    mount() {
      if (this.mounted) return;
      stage = document.getElementById("game-stage"); promptEl = document.getElementById("game-prompt");
      enemiesEl = document.getElementById("game-enemies"); cannonEl = document.getElementById("game-cannon");
      overlayEl = document.getElementById("game-overlay"); setupEl = document.getElementById("ov-setup");
      summaryEl = document.getElementById("ov-summary"); countdownEl = document.getElementById("game-countdown");
      elScore = document.getElementById("g-score"); elAcc = document.getElementById("g-acc");
      elStreak = document.getElementById("g-streak"); elQnum = document.getElementById("g-qnum");
      if (!stage) return; this.mounted = true;

      document.getElementById("g-start").addEventListener("click", startRound);
      document.getElementById("g-again").addEventListener("click", startRound);
      document.getElementById("g-settings").addEventListener("click", showSetup);
      document.getElementById("g-restart").addEventListener("click", () => { running = false; inRound = false; cancelAnimationFrame(rafId); countdownEl.classList.add("hidden"); showSetup(); });

      const sBtn = document.getElementById("g-sound");
      sBtn.addEventListener("click", () => { soundOn = !soundOn; sBtn.textContent = soundOn ? "\uD83D\uDD0A" : "\uD83D\uDD07"; });

      document.querySelectorAll(".modebtn").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll(".modebtn").forEach((x) => x.classList.toggle("active", x === b));
        mode = b.dataset.mode;
        refreshModeNote();
      }));
      refreshModeNote();

      const countInp = document.getElementById("ov-count"), countVal = document.getElementById("ov-count-val");
      countInp.addEventListener("input", () => { numQ = +countInp.value; countVal.textContent = numQ; });
      numQ = +countInp.value;

      const ovSpeed = document.getElementById("ov-speed"), ovSpeedVal = document.getElementById("ov-speed-val"), hudSpeed = document.getElementById("g-speed");
      function setSpeed(v) { v = Math.max(1, Math.min(10, +v)); speed = speedFromSlider(v); ovSpeed.value = v; hudSpeed.value = v; ovSpeedVal.textContent = v; }
      ovSpeed.addEventListener("input", () => setSpeed(ovSpeed.value));
      hudSpeed.addEventListener("input", () => setSpeed(hudSpeed.value));
      setSpeed(ovSpeed.value);

      document.querySelectorAll("[data-factor-game]").forEach((b) => b.addEventListener("click", () => setFactorGame(b.dataset.factorGame)));
      mountSnake();

      window.addEventListener("keydown", (e) => {
        if (!activeFlag) return;
        const blaster = document.getElementById("game-blaster");
        if (blaster && !blaster.classList.contains("hidden")) onKey(e);
      });
      window.addEventListener("resize", () => { resize(); resizeSnakeBoard(); });
    },
    show() {
      this.mount(); activeFlag = true;
      const blaster = document.getElementById("game-blaster");
      if (inRound && !running && blaster && !blaster.classList.contains("hidden")) {
        running = true; lastT = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop);
      }
    },
    hide() { activeFlag = false; running = false; cancelAnimationFrame(rafId); SN.running = false; clearInterval(SN.loop); },
    onPhoneLayout() {
      refreshModeNote();
      if (stage && inRound) stage.classList.toggle("game-stage--phone-identity", usePhoneIdentityMode());
      resize();
      resizeSnakeBoard();
    },
  };

  window.FactGame = Game;
})();
