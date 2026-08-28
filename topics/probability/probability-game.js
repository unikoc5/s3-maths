/* Probability — three mini-games:
 *   1) Apple Catch Quest  — cartoon catcher; build a bag to match P(colour)
 *   2) Expected Value Challenge — pick 1 of 3 options per round (3 rounds)
 *   3) Dice Clear — place 8 chips on 2–12, roll dice, clear the board
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const C = { ink: "#e5e7eb", dim: "#94a3b8", fav: "#FFD54F", tot: "#66BB6A", a: "#4FC3F7", red: "#f06292", line: "#28365c" };
  const APPLE_NAME = { R: "red", G: "green", Y: "yellow" };
  const REC = { apple: "prob-game-apple-best", bet: "prob-game-bet-best", dice: "prob-game-dice-best" };

  function E(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function km(el, latex) { try { window.katex.render(latex, el, { throwOnError: false, displayMode: false }); } catch (e) { el.textContent = latex; } }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function fr(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; }
  const feq = (a, b) => a.n * b.d === b.n * a.d;
  const fracTex = (f) => (f.n === 0 ? "0" : f.d === 1 ? String(f.n) : "\\frac{" + f.n + "}{" + f.d + "}");
  const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const fmtNum = (x) => { const r = Math.round(x * 100) / 100; return Number.isInteger(r) ? String(r) : String(r); };
  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const dash = (v) => (v == null ? "—" : v);

  const memRec = {};

  function loadRec(key) { return memRec[REC[key]] ?? null; }
  function saveRec(key, val) { memRec[REC[key]] = val; }

  /* Best record: commit previous play's pending result when NEXT play starts */
  const pendingBest = { apple: null, bet: null, dice: null };
  const displayBest = { apple: null, bet: null, dice: null };

  function isBetter(game, val, stored) {
    if (stored == null) return true;
    if (game === "bet") return val > stored;
    if (game === "apple") return val < stored;
    return val < stored; /* dice */
  }

  function commitPending(game) {
    if (pendingBest[game] == null) return;
    const stored = loadRec(REC[game]);
    if (isBetter(game, pendingBest[game], stored)) saveRec(REC[game], pendingBest[game]);
    pendingBest[game] = null;
  }

  function beginPlay(game) {
    commitPending(game);
    displayBest[game] = loadRec(REC[game]);
  }

  function queueBest(game, result) {
    const stored = loadRec(REC[game]);
    if (isBetter(game, result, stored)) pendingBest[game] = result;
  }

  function fmtBestDisplay(game) {
    const v = displayBest[game];
    if (v == null) return "—";
    if (game === "apple") return fmtTime(v);
    if (game === "bet") return "$" + v;
    return String(v) + " rounds";
  }

  /* ═══════════════════════ APPLE CATCH QUEST ═══════════════════════ */
  const ROUND_POOL = [
    [{ col: "R", t: fr(1, 2) }, { col: "G", t: fr(1, 3) }, { col: "Y", t: fr(1, 4) }],
    [{ col: "R", t: fr(1, 4) }, { col: "G", t: fr(2, 5) }, { col: "Y", t: fr(3, 8) }],
    [{ col: "R", t: fr(3, 8) }, { col: "G", t: fr(2, 7) }, { col: "Y", t: fr(1, 6) }],
  ];
  const HUB_NEAR = 15;
  const BIN_NEAR = 81;
  const MOVE_LO = 5;
  const MOVE_HI = 95;
  let ag = null, agLoop = null, agPaused = false;

  function acMetrics() {
    const h = els.acStage.clientHeight || 400;
    const w = els.acStage.clientWidth || 640;
    const groundLine = h * 0.91 + 10;
    const playerH = 100;
    const footY = groundLine;
    const canopyBottom = h * 0.30 - 10;
    const spawnXMin = w * 0.22;
    const spawnXMax = w * 0.78;
    const basketTop = footY - playerH + 48;
    const basketBottom = footY - playerH + 72;
    return { h, w, groundLine, footY, canopyBottom, spawnXMin, spawnXMax,
      basketTop, basketBottom, basketHalfW: 26, moveMin: w * (MOVE_LO / 100), moveMax: w * (MOVE_HI / 100) };
  }

  function clearApples() {
    if (!ag) return;
    ag.apples.forEach((a) => a.el.remove());
    ag.apples = [];
  }

  function newApplePlay() {
    beginPlay("apple");
    const rounds = ROUND_POOL.map((pool) => pool[ri(0, pool.length - 1)]);
    ag = {
      round: 1, maxRounds: 3, rounds, done: false, paused: false,
      counts: { R: 0, G: 0, Y: 0 },
      playerX: 50, apples: [], lastSpawn: 0,
      playStart: performance.now(), roundStart: performance.now(),
      totalMs: 0, running: false,
    };
    els.acDone.classList.add("hidden");
    if (els.acGameUi) els.acGameUi.classList.remove("won");
    els.acHome.classList.remove("hidden");
    els.acStart.textContent = "Start game";
    els.acPause.classList.add("hidden");
    els.acFeedback.textContent = "";
    els.acFeedback.className = "pg-feedback";
    clearApples();
    updateAppleHud();
    els.acBest.textContent = fmtBestDisplay("apple");
  }

  function startAppleRound() {
    if (!ag) return;
    els.acHome.classList.add("hidden");
    ag.running = true;
    ag.paused = false;
    agPaused = false;
    ag.playStart = performance.now();
    ag.roundStart = performance.now();
    clearApples();
    startAppleLoop();
    els.acStage.focus();
  }

  function curTarget() { return ag.rounds[ag.round - 1]; }

  function updateAppleHud() {
    if (!ag) return;
    const t = curTarget();
    els.acRound.textContent = ag.round;
    els.acBest.textContent = fmtBestDisplay("apple");
    clear(els.acMission);
    els.acMission.appendChild(document.createTextNode("Catch apples! Make "));
    const tgt = document.createElement("span");
    tgt.className = "ac-target";
    els.acMission.appendChild(tgt);
    km(tgt, "P(\\text{" + APPLE_NAME[t.col] + "}) = " + fracTex(t.t));
    els.acMission.appendChild(document.createTextNode(", then deliver at the house."));
    els.acCr.textContent = ag.counts.R;
    els.acCg.textContent = ag.counts.G;
    els.acCy.textContent = ag.counts.Y;
    const total = ag.counts.R + ag.counts.G + ag.counts.Y;
    clear(els.acProb);
    if (total === 0) km(els.acProb, "P(\\text{" + APPLE_NAME[t.col] + "}) = \\text{--}");
    else {
      const p = fr(ag.counts[t.col], total);
      km(els.acProb, "P(\\text{" + APPLE_NAME[t.col] + "}) = \\frac{" + ag.counts[t.col] + "}{" + total + "} = " + fracTex(p));
    }
  }

  function spawnApple() {
    const m = acMetrics();
    const cols = ["R", "G", "Y"];
    const col = cols[ri(0, 2)];
    const xPx = m.spawnXMin + Math.random() * (m.spawnXMax - m.spawnXMin);
    const el = document.createElement("div");
    el.className = "ac-apple " + col;
    el.style.left = xPx + "px";
    el.style.top = (m.canopyBottom - 8) + "px";
    els.acApples.appendChild(el);
    ag.apples.push({ col, x: xPx, y: m.canopyBottom - 8, el, speed: 0.45 + Math.random() * 0.3 });
  }

  function appleLoop(now) {
    if (!ag || !ag.running || ag.paused) return;
    const m = acMetrics();
    els.acTime.textContent = fmtTime(now - ag.playStart);
    if (now - ag.lastSpawn > 750 + Math.random() * 450) { spawnApple(); ag.lastSpawn = now; }

    const basketX = (ag.playerX / 100) * m.w;

    ag.apples = ag.apples.filter((a) => {
      a.y += a.speed;
      a.el.style.top = a.y + "px";
      const inBasketY = a.y >= m.basketTop && a.y <= m.basketBottom;
      const inBasketX = Math.abs(a.x - basketX) < m.basketHalfW;
      if (inBasketY && inBasketX) {
        ag.counts[a.col]++;
        a.el.remove();
        updateAppleHud();
        return false;
      }
      if (a.y > m.footY + 10) { a.el.remove(); return false; }
      return true;
    });

    els.acPlayer.style.left = ag.playerX + "%";
    agLoop = requestAnimationFrame(appleLoop);
  }

  function startAppleLoop() {
    if (!ag) return;
    if (agLoop) cancelAnimationFrame(agLoop);
    ag.lastSpawn = performance.now();
    agLoop = requestAnimationFrame(appleLoop);
  }

  function stopAppleLoop() {
    if (!ag) return;
    ag.running = false;
    if (agLoop) cancelAnimationFrame(agLoop);
    agLoop = null;
    clearApples();
  }

  function nearHub() { return ag && ag.playerX <= HUB_NEAR; }
  function nearBin() { return ag && ag.playerX >= BIN_NEAR; }

  function trySubmit() {
    if (nearHub()) submitBag();
    else {
      els.acFeedback.textContent = "Walk closer to the house!";
      els.acFeedback.className = "pg-feedback bad";
    }
  }

  function tryEmpty() {
    if (nearBin()) emptyBag();
    else {
      els.acFeedback.textContent = "Walk closer to the bin!";
      els.acFeedback.className = "pg-feedback bad";
    }
  }

  function emptyBag() {
    ag.counts = { R: 0, G: 0, Y: 0 };
    els.acFeedback.textContent = "Bag emptied — keep catching!";
    els.acFeedback.className = "pg-feedback";
    updateAppleHud();
  }

  function submitBag() {
    const total = ag.counts.R + ag.counts.G + ag.counts.Y;
    const t = curTarget();
    if (total === 0) {
      els.acFeedback.textContent = "Catch some apples first!";
      els.acFeedback.className = "pg-feedback bad";
      return;
    }
    const p = fr(ag.counts[t.col], total);
    if (!feq(p, t.t)) {
      els.acFeedback.textContent = "Not quite — P(" + APPLE_NAME[t.col] + ") is " + p.n + "/" + p.d + ", need " + t.t.n + "/" + t.t.d + ".";
      els.acFeedback.className = "pg-feedback bad";
      return;
    }
    ag.totalMs += performance.now() - ag.roundStart;
    clearApples();
    if (ag.round >= ag.maxRounds) finishApplePlay();
    else {
      ag.round++;
      ag.counts = { R: 0, G: 0, Y: 0 };
      ag.roundStart = performance.now();
      els.acFeedback.textContent = "Round " + (ag.round - 1) + " done! Next target…";
      els.acFeedback.className = "pg-feedback ok";
      updateAppleHud();
    }
  }

  function finishApplePlay() {
    stopAppleLoop();
    ag.done = true;
    const totalMs = ag.totalMs + (performance.now() - ag.roundStart);
    queueBest("apple", totalMs);
    els.acDoneMsg.innerHTML = "Total time: <b>" + fmtTime(totalMs) + "</b><br>Best record: <b>" + fmtBestDisplay("apple") + "</b>";
    if (els.acGameUi) els.acGameUi.classList.add("won");
    els.acDone.classList.remove("hidden");
  }

  function togglePause() {
    if (!ag || ag.done || els.acHome && !els.acHome.classList.contains("hidden")) return;
    ag.paused = !ag.paused;
    agPaused = ag.paused;
    if (ag.paused) {
      els.acPause.classList.remove("hidden");
      els.acPauseBtn.textContent = "▶ Resume";
    } else {
      els.acPause.classList.add("hidden");
      els.acPauseBtn.textContent = "⏸ Pause";
      ag.lastSpawn = performance.now();
      startAppleLoop();
    }
  }

  function onStageClick(e) {
    if (!ag || ag.done || ag.paused || !els.acHome.classList.contains("hidden")) return;
    const rect = els.acStage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const mid = rect.width / 2;
    const STEP = 3;
    if (x < mid) ag.playerX = Math.max(MOVE_LO, ag.playerX - STEP);
    else ag.playerX = Math.min(MOVE_HI, ag.playerX + STEP);
  }

  function bindApple() {
    window.addEventListener("keydown", (e) => {
      if (!ag || ag.done || els.gameApple.style.display === "none") return;
      if (els.acHome && !els.acHome.classList.contains("hidden")) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { ag.playerX = Math.max(MOVE_LO, ag.playerX - 3); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { ag.playerX = Math.min(MOVE_HI, ag.playerX + 3); e.preventDefault(); }
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (nearHub()) submitBag();
        else if (nearBin()) emptyBag();
      }
    });
    els.acStage.addEventListener("click", onStageClick);
    els.acHub.addEventListener("click", (e) => { e.stopPropagation(); trySubmit(); });
    els.acBin.addEventListener("click", (e) => { e.stopPropagation(); tryEmpty(); });
    els.acStart.addEventListener("click", () => {
      els.acHome.classList.add("hidden");
      if (!ag.running && !ag.done) startAppleRound();
      else if (ag.paused) {
        ag.paused = false;
        agPaused = false;
        ag.lastSpawn = performance.now();
        startAppleLoop();
      }
    });
    els.acRestart.addEventListener("click", () => { stopAppleLoop(); newApplePlay(); });
    els.acHomeBtn.addEventListener("click", () => {
      if (!ag || ag.done || !els.acHome.classList.contains("hidden")) {
        if (ag && !ag.done) els.acHome.classList.remove("hidden");
        return;
      }
      ag.paused = true;
      agPaused = true;
      if (agLoop) cancelAnimationFrame(agLoop);
      agLoop = null;
      els.acPause.classList.add("hidden");
      els.acHome.classList.remove("hidden");
      els.acStart.textContent = ag.running ? "Continue" : "Start game";
    });
    els.acPauseBtn.addEventListener("click", togglePause);
    els.acResume.addEventListener("click", togglePause);
  }

  /* ═══════════════════════ EXPECTED VALUE CHALLENGE ═══════════════════════ */
  let bet = null;

  function makeOption() {
    const lo = [18, 22, 25, 30][ri(0, 3)];
    const hi = lo + [12, 15, 18, 22][ri(0, 3)];
    const p = [35, 40, 45, 50, 55, 60, 65][ri(0, 6)];
    return { p, hi, lo, ev: p / 100 * hi + (100 - p) / 100 * lo };
  }

  function goodTriple(a, b, c) {
    const evs = [a.ev, b.ev, c.ev].sort((x, y) => x - y);
    if (evs[2] - evs[0] > 22) return false;
    if (evs[2] > 75) return false;
    if (Math.abs(a.p - b.p) < 8 && Math.abs(a.hi - b.hi) < 5 && Math.abs(a.lo - b.lo) < 5) return false;
    return true;
  }

  function newBet() {
    beginPlay("bet");
    let A, B, C, guard = 0;
    do { A = makeOption(); B = makeOption(); C = makeOption(); guard++; }
    while (guard < 300 && !goodTriple(A, B, C));
    bet = { A, B, C, round: 1, total: 0, log: [], busy: false, done: false };
    els.btReveal.classList.add("hidden");
    els.btResult.className = "bt-result";
    els.btResult.textContent = "Pick an option to spin the wheel.";
    els.btFeedback.textContent = "";
    els.btNext.disabled = true;
    els.btNext.textContent = "Next round";
    els.btBest.textContent = fmtBestDisplay("bet");
    drawWheel(null);
    renderBetCards();
    updateBetStatus();
  }

  function updateBetStatus() {
    els.btRound.textContent = bet.round;
    els.btTotal.textContent = "$" + bet.total;
    els.btStatus.innerHTML = bet.done
      ? "Game over — see your score and expected values below."
      : "Round <b>" + bet.round + "</b> of 3: the three options stay fixed this game. Pick one to spin.";
  }

  function optionCardHTML(side, o) {
    const names = { A: "Option A", B: "Option B", C: "Option C" };
    return '<div class="bt-name">' + names[side] + '</div>' +
      '<div class="bt-out"><span class="pct">' + o.p + '%</span><span class="arr">→</span><span class="pay hi-pay">$' + o.hi + '</span></div>' +
      '<div class="bt-out"><span class="pct">' + (100 - o.p) + '%</span><span class="arr">→</span><span class="pay lo-pay">$' + o.lo + '</span></div>' +
      '<div class="bt-bar"><i style="width:' + o.p + '%;background:#66BB6A"></i><i style="width:' + (100 - o.p) + '%;background:#FFD54F"></i></div>';
  }

  function renderBetCards() {
    els.btA.innerHTML = optionCardHTML("A", bet.A);
    els.btB.innerHTML = optionCardHTML("B", bet.B);
    els.btC.innerHTML = optionCardHTML("C", bet.C);
    [els.btA, els.btB, els.btC].forEach((c) => { c.classList.remove("chosen"); c.disabled = bet.busy || bet.done; });
  }

  function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function sector(svg, cx, cy, r, a0, a1, fill) {
    if (a1 - a0 >= 359.999) { svg.appendChild(E("circle", { cx, cy, r, fill })); return; }
    const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    svg.appendChild(E("path", { d: "M" + cx + " " + cy + " L" + p0[0] + " " + p0[1] + " A" + r + " " + r + " 0 " + large + " 1 " + p1[0] + " " + p1[1] + " Z",
      fill, stroke: "#0b1324", "stroke-width": 1.5 }));
  }
  function drawWheel(o) {
    const svg = els.btWheel; clear(svg); const cx = 110, cy = 110, r = 92;
    if (!o) {
      svg.appendChild(E("circle", { cx, cy, r, fill: "#1b2945", stroke: C.line, "stroke-width": 2 }));
      const t = E("text", { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 30, fill: C.dim });
      t.textContent = "?"; svg.appendChild(t);
    } else {
      const g = E("g", { transform: "rotate(0 110 110)" });
      const hiSpan = o.p * 3.6;
      sector(g, cx, cy, r, 0, hiSpan, "#66BB6A");
      sector(g, cx, cy, r, hiSpan, 360, "#FFD54F");
      svg.appendChild(g); svg._rot = g;
    }
    svg.appendChild(E("circle", { cx, cy, r: 8, fill: "#0b1324", stroke: "#fff", "stroke-width": 1.5 }));
    svg.appendChild(E("path", { d: "M110 30 L100 4 L120 4 Z", fill: "#f06292", stroke: "#0b1324", "stroke-width": 1.5 }));
  }
  function animateRot(g, to, done) {
    if (!g) { if (done) done(); return; }
    const t0 = performance.now();
    (function frame(now) {
      const k = Math.min(1, (now - t0) / 2100), e = 1 - Math.pow(1 - k, 3);
      g.setAttribute("transform", "rotate(" + to * e + " 110 110)");
      if (k < 1) requestAnimationFrame(frame); else if (done) done();
    })(t0);
  }

  function pickBet(side) {
    if (bet.busy || bet.done) return;
    const o = bet[side];
    bet.busy = true;
    [els.btA, els.btB, els.btC].forEach((c) => c.classList.remove("chosen"));
    document.getElementById("bt-" + side).classList.add("chosen");
    els.btA.disabled = els.btB.disabled = els.btC.disabled = true;
    els.btResult.textContent = "Spinning…";
    drawWheel(o);
    const hit = Math.random() * 100 < o.p;
    const payout = hit ? o.hi : o.lo;
    const hiSpan = o.p * 3.6;
    const mid = hit ? hiSpan / 2 : (hiSpan + 360) / 2;
    animateRot(els.btWheel._rot, 360 * 4 + (360 - mid), () => {
      bet.total += payout;
      bet.log.push({ round: bet.round, side, payout });
      bet.busy = false;
      els.btResult.innerHTML = "Landed on <span class=\"win\">$" + payout + "</span> (Option " + side + ").";
      updateBetStatus();
      els.btNext.disabled = false;
      els.btNext.textContent = bet.round >= 3 ? "See results" : "Next round";
    });
  }

  function nextBetRound() {
    if (bet.busy) return;
    if (bet.round >= 3) { revealBet(); return; }
    bet.round++;
    els.btResult.textContent = "Pick an option to spin the wheel.";
    els.btNext.disabled = true;
    drawWheel(null);
    renderBetCards();
    updateBetStatus();
  }

  function revealBet() {
    bet.done = true;
    els.btA.disabled = els.btB.disabled = els.btC.disabled = true;
    const opts = [{ id: "A", o: bet.A }, { id: "B", o: bet.B }, { id: "C", o: bet.C }];
    const best = opts.slice().sort((a, b) => b.o.ev - a.o.ev)[0];
    const evTex = (o) => "E = " + (o.p / 100) + "\\times" + o.hi + " + " + ((100 - o.p) / 100) + "\\times" + o.lo + " = \\$" + fmtNum(o.ev);
    const logHtml = bet.log.map((l) => "Round " + l.round + ": Option <span class=\"r\">" + l.side + "</span> → <span class=\"r\">$" + l.payout + "</span>").join("<br>");
    queueBest("bet", bet.total);
    let grid = '<div class="bt-reveal-grid">';
    opts.forEach(({ id, o }) => {
      grid += '<div class="bt-ev ' + (id === best.id ? "best" : "") + '"><div class="ev-name">Option ' + id +
        (id === best.id ? ' <span class="tag">highest EV</span>' : '') + '</div><div class="ev-eq" id="bt-ev' + id + '"></div></div>';
    });
    grid += '</div>';
    els.btReveal.innerHTML = '<h4>Round complete</h4>' + grid +
      '<div class="bt-log">' + logHtml + '<br><b>Your total score: $' + bet.total + '</b></div>' +
      '<div class="bt-verdict">Best record: <b>' + fmtBestDisplay("bet") +
      '</b>. Option <b>' + best.id + '</b> has the highest expected value ($' + fmtNum(best.o.ev) + ' per spin).</div>';
    els.btReveal.classList.remove("hidden");
    opts.forEach(({ id, o }) => km(document.getElementById("bt-ev" + id), evTex(o)));
    els.btNext.disabled = true;
    updateBetStatus();
  }

  /* ═══════════════════════ DICE CLEAR ═══════════════════════ */
  const DICE_CHIPS = 8;
  const PIP_POS = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };
  let dg = null;
  let dgRollSpeed = 1;

  function diceRollTiming() {
    if (dgRollSpeed >= 5) return { instant: true };
    const baseMs = 76;
    const baseCount = 16;
    if (dgRollSpeed <= 1) return { tickMs: baseMs, tickCount: baseCount };
    const t = (dgRollSpeed - 1) / 3;
    return {
      tickMs: Math.max(12, Math.round(baseMs - t * 64)),
      tickCount: Math.max(2, Math.round(baseCount - t * 14)),
    };
  }

  function buildDie(el, n) {
    clear(el);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const pip = document.createElement("div");
      pip.className = "dg-pip";
      const on = (PIP_POS[n] || []).some((p) => p[0] === c && p[1] === r);
      if (on) pip.classList.add("on");
      el.appendChild(pip);
    }
  }

  function newDice() {
    beginPlay("dice");
    dg = { board: {}, pool: DICE_CHIPS, rounds: 0, phase: "place", rolling: false, d1: 1, d2: 1 };
    for (let n = 2; n <= 12; n++) dg.board[n] = 0;
    els.dgFinal.classList.add("hidden");
    els.dgToast.textContent = "";
    els.dgSum.innerHTML = '<span class="lbl">Sum</span>—';
    els.dgRoll.disabled = true;
    els.dgBest.textContent = fmtBestDisplay("dice");
    renderDiceBoard();
  }

  function renderDiceBoard() {
    clear(els.dgBoard);
    for (let n = 2; n <= 12; n++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "dg-cell" + (dg.phase !== "place" ? " disabled" : "");
      cell.dataset.n = n;
      const num = document.createElement("div");
      num.className = "num"; num.textContent = n;
      const chips = document.createElement("div");
      chips.className = "chips";
      for (let i = 0; i < dg.board[n]; i++) {
        const ch = document.createElement("span");
        ch.className = "dg-chip";
        chips.appendChild(ch);
      }
      cell.appendChild(num); cell.appendChild(chips);
      cell.addEventListener("click", () => onCellClick(n, cell));
      els.dgBoard.appendChild(cell);
    }
    clear(els.dgPool);
    for (let i = 0; i < dg.pool; i++) {
      const ch = document.createElement("span");
      ch.className = "dg-chip";
      els.dgPool.appendChild(ch);
    }
    els.dgPoolN.textContent = dg.pool + " left";
    els.dgRounds.textContent = dg.rounds;
    els.dgRoll.disabled = dg.pool > 0 || dg.phase !== "roll" || dg.rolling;
    buildDie(els.dgD1, dg.d1);
    buildDie(els.dgD2, dg.d2);
  }

  function onCellClick(n, cell) {
    if (dg.phase !== "place") return;
    if (dg.pool > 0) {
      dg.board[n]++;
      dg.pool--;
      const ch = document.createElement("span");
      ch.className = "dg-chip";
      cell.querySelector(".chips").appendChild(ch);
    } else if (dg.board[n] > 0) {
      dg.board[n]--;
      dg.pool++;
      const chips = cell.querySelector(".chips");
      if (chips.lastChild) chips.removeChild(chips.lastChild);
    }
    els.dgPoolN.textContent = dg.pool + " left";
    clear(els.dgPool);
    for (let i = 0; i < dg.pool; i++) {
      const ch = document.createElement("span");
      ch.className = "dg-chip";
      els.dgPool.appendChild(ch);
    }
    if (dg.pool === 0) {
      dg.phase = "roll";
      els.dgToast.textContent = "All chips placed — roll the dice!";
      renderDiceBoard();
    }
  }

  function rollDice() {
    if (dg.rolling || dg.pool > 0 || dg.phase !== "roll") return;
    dg.rolling = true;
    els.dgRoll.disabled = true;
    els.dgToast.textContent = "";
    const timing = diceRollTiming();

    function finishRoll() {
      dg.d1 = ri(1, 6);
      dg.d2 = ri(1, 6);
      const sum = dg.d1 + dg.d2;
      dg.rounds++;
      els.dgD1.classList.remove("rolling");
      els.dgD2.classList.remove("rolling");
      buildDie(els.dgD1, dg.d1);
      buildDie(els.dgD2, dg.d2);
      els.dgSum.innerHTML = '<span class="lbl">Sum</span>' + sum;
      els.dgRounds.textContent = dg.rounds;
      handleRoll(sum);
    }

    if (timing.instant) {
      finishRoll();
      return;
    }

    els.dgD1.classList.add("rolling");
    els.dgD2.classList.add("rolling");
    let ticks = 0;
    const iv = setInterval(() => {
      dg.d1 = ri(1, 6);
      dg.d2 = ri(1, 6);
      buildDie(els.dgD1, dg.d1);
      buildDie(els.dgD2, dg.d2);
      if (++ticks >= timing.tickCount) {
        clearInterval(iv);
        finishRoll();
      }
    }, timing.tickMs);
  }

  function handleRoll(sum) {
    const cell = els.dgBoard.querySelector('[data-n="' + sum + '"]');
    if (dg.board[sum] > 0) {
      dg.board[sum]--;
      const chip = cell && cell.querySelector(".dg-chip");
      if (chip) {
        chip.classList.add("removing");
        setTimeout(() => { if (chip.parentNode) chip.remove(); }, 280);
      }
      els.dgToast.textContent = "Removed a chip from " + sum + "!";
      els.dgToast.className = "dg-toast hit";
    } else {
      els.dgToast.textContent = "No chip on " + sum + " — nothing removed.";
      els.dgToast.className = "dg-toast miss";
    }
    const left = Object.values(dg.board).reduce((a, b) => a + b, 0);
    dg.rolling = false;
    if (left === 0) finishDice();
    else els.dgRoll.disabled = false;
  }

  function finishDice() {
    dg.phase = "done";
    queueBest("dice", dg.rounds);
    els.dgFinal.classList.remove("hidden");
    els.dgFinal.innerHTML = "<h4>Board cleared!</h4><p>You finished in <b>" + dg.rounds + " rounds</b>. Best record: <b>" +
      fmtBestDisplay("dice") + "</b>.</p>";
    els.dgRoll.disabled = true;
  }

  /* ═══════════════════════ mount ═══════════════════════ */
  let els = {};

  function bindOnce() {
    els = {
      acMission: document.getElementById("ac-mission"),
      acRound: document.getElementById("ac-round"),
      acTime: document.getElementById("ac-time"),
      acBest: document.getElementById("ac-best"),
      acStage: document.getElementById("ac-stage"),
      acApples: document.getElementById("ac-apples"),
      acPlayer: document.getElementById("ac-player"),
      acHub: document.getElementById("ac-hub"),
      acBin: document.getElementById("ac-bin"),
      acCr: document.getElementById("ac-cr"),
      acCg: document.getElementById("ac-cg"),
      acCy: document.getElementById("ac-cy"),
      acProb: document.getElementById("ac-prob"),
      acFeedback: document.getElementById("ac-feedback"),
      acDone: document.getElementById("ac-done"),
      acDoneMsg: document.getElementById("ac-done-msg"),
      acGameUi: document.getElementById("ac-game-ui"),
      acRestart: document.getElementById("ac-restart"),
      acHome: document.getElementById("ac-home"),
      acPause: document.getElementById("ac-pause"),
      acStart: document.getElementById("ac-start"),
      acHomeBtn: document.getElementById("ac-home-btn"),
      acPauseBtn: document.getElementById("ac-pause-btn"),
      acResume: document.getElementById("ac-resume"),
      btStatus: document.getElementById("bt-status"),
      btRound: document.getElementById("bt-round"),
      btTotal: document.getElementById("bt-total"),
      btBest: document.getElementById("bt-best"),
      btNew: document.getElementById("bt-new"),
      btA: document.getElementById("bt-A"),
      btB: document.getElementById("bt-B"),
      btC: document.getElementById("bt-C"),
      btWheel: document.getElementById("bt-wheel"),
      btResult: document.getElementById("bt-result"),
      btNext: document.getElementById("bt-next"),
      btFeedback: document.getElementById("bt-feedback"),
      btReveal: document.getElementById("bt-reveal"),
      dgBoard: document.getElementById("dg-board"),
      dgPool: document.getElementById("dg-pool"),
      dgPoolN: document.getElementById("dg-pool-n"),
      dgD1: document.getElementById("dg-d1"),
      dgD2: document.getElementById("dg-d2"),
      dgSum: document.getElementById("dg-sum"),
      dgToast: document.getElementById("dg-toast"),
      dgRoll: document.getElementById("dg-roll"),
      dgSpeed: document.getElementById("dg-speed"),
      dgRounds: document.getElementById("dg-rounds"),
      dgBest: document.getElementById("dg-best"),
      dgNew: document.getElementById("dg-new"),
      dgFinal: document.getElementById("dg-final"),
      modeBtns: Array.prototype.slice.call(document.querySelectorAll("[data-game]")),
      gameApple: document.getElementById("game-apple"),
      gameBet: document.getElementById("game-bet"),
      gameDice: document.getElementById("game-dice"),
      hintApple: document.getElementById("hint-apple"),
      hintBet: document.getElementById("hint-bet"),
      hintDice: document.getElementById("hint-dice"),
    };
    bindApple();
    els.btA.addEventListener("click", () => pickBet("A"));
    els.btB.addEventListener("click", () => pickBet("B"));
    els.btC.addEventListener("click", () => pickBet("C"));
    els.btNext.addEventListener("click", nextBetRound);
    els.btNew.addEventListener("click", newBet);
    els.dgRoll.addEventListener("click", rollDice);
    els.dgNew.addEventListener("click", newDice);
    els.dgSpeed.addEventListener("input", () => { dgRollSpeed = +els.dgSpeed.value; });
    els.modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.game)));
  }

  function setMode(mode) {
    els.modeBtns.forEach((b) => b.classList.toggle("active", b.dataset.game === mode));
    els.gameApple.style.display = mode === "apple" ? "" : "none";
    els.gameBet.style.display = mode === "bet" ? "" : "none";
    els.gameDice.style.display = mode === "dice" ? "" : "none";
    if (els.hintApple) els.hintApple.classList.toggle("hidden", mode !== "apple");
    if (els.hintBet) els.hintBet.classList.toggle("hidden", mode !== "bet");
    if (els.hintDice) els.hintDice.classList.toggle("hidden", mode !== "dice");
    if (mode === "apple" && ag && ag.running && !ag.paused && !ag.done && els.acHome.classList.contains("hidden")) startAppleLoop();
    else stopAppleLoop();
  }

  const Game = {
    mounted: false,
    mount() {
      if (this.mounted) return;
      if (!document.getElementById("ac-stage")) return;
      this.mounted = true;
      bindOnce();
      dgRollSpeed = +els.dgSpeed.value;
      newApplePlay();
      newBet();
      newDice();
      setMode("apple");
    },
    show() { this.mount(); },
  };
  window.ProbGame = Game;
})();
