/* Inequality — Match-up memory game.
 *
 * Eight cards = four pairs. Each pair links an inequality (x>=0, x>0, x<=0, x<0)
 * to its number-line picture (filled / hollow dot, ray left / right):
 *
 *     x >= 0  <->  filled dot at 0, ray to the right
 *     x >  0  <->  hollow dot at 0, ray to the right
 *     x <= 0  <->  filled dot at 0, ray to the left
 *     x <  0  <->  hollow dot at 0, ray to the left
 *
 * Flow (3 rounds, harder each time):
 *   preview  — all eight cards face up; memorise them
 *   shuffle  — cards flip face down and swap positions
 *              (round 1: no shuffle · round 2: gentle · round 3: harsh)
 *   play     — tap two cards; a correct pair stays up, a wrong pair flips back
 *   clear    — all four pairs found -> next round (or you win after round 3)
 */
(function () {
  "use strict";

  const ACC = "#5FB7F0", AXIS = "#33425f", ZERO = "#9fb0c9", CARD_BG = "#0e1830";

  const CONCEPTS = [
    { key: "ge", tex: "x \\ge 0", dir: "right", filled: true },
    { key: "gt", tex: "x > 0", dir: "right", filled: false },
    { key: "le", tex: "x \\le 0", dir: "left", filled: true },
    { key: "lt", tex: "x < 0", dir: "left", filled: false },
  ];

  // per-round shuffle: number of swaps + ms between them (also the move duration)
  const SHUFFLE = { 1: { n: 0, delay: 0 }, 2: { n: 5, delay: 520 }, 3: { n: 11, delay: 300 } };

  function diagramSVG(dir, filled) {
    const cx = 110, axisY = 68, dotY = 30, dotR = 9, arrowLen = 11;
    const tip = dir === "right" ? 198 : 22;
    const rayStart = dir === "right" ? cx + dotR : cx - dotR;
    const lineEnd = dir === "right" ? tip - arrowLen : tip + arrowLen;
    const head = dir === "right"
      ? `M${tip},${dotY} l-${arrowLen},-6 l0,12 z`
      : `M${tip},${dotY} l${arrowLen},-6 l0,12 z`;
    const dot = filled
      ? `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${ACC}"/>`
      : `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${CARD_BG}" stroke="${ACC}" stroke-width="3.5"/>`;
    return `<svg viewBox="0 0 220 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="14" y1="${axisY}" x2="206" y2="${axisY}" stroke="${AXIS}" stroke-width="2.5"/>
      <line x1="${cx}" y1="${axisY - 8}" x2="${cx}" y2="${axisY + 8}" stroke="${ZERO}" stroke-width="2"/>
      <line x1="${cx}" y1="${axisY}" x2="${cx}" y2="${dotY + dotR}" stroke="${ACC}" stroke-width="2.5"/>
      <line x1="${rayStart}" y1="${dotY}" x2="${lineEnd}" y2="${dotY}" stroke="${ACC}" stroke-width="5.5" stroke-linecap="butt"/>
      <path d="${head}" fill="${ACC}"/>
      ${dot}
      <text x="${cx}" y="90" fill="${ZERO}" font-size="14" text-anchor="middle"
            font-family="JetBrains Mono, monospace">0</text>
    </svg>`;
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const G = {
    stage: null, els: {}, cards: [], slots: [],
    cols: 4, cardW: 0, cardH: 0, gap: 14,
    phase: "idle", round: 1, matched: 0, moves: 0, flipped: [], lock: true, built: false,
    activeMode: "matchup",
  };

  function setGameMode(modeName) {
    G.activeMode = modeName;
    document.querySelectorAll("[data-ineq-game]").forEach((b) => {
      b.classList.toggle("active", b.dataset.ineqGame === modeName);
    });
    const matchup = document.getElementById("game-matchup");
    const doors = document.getElementById("game-doors");
    if (matchup) matchup.classList.toggle("hidden", modeName !== "matchup");
    if (doors) doors.classList.toggle("hidden", modeName !== "doors");
    if (modeName === "matchup" && G.built) layout();
    if (modeName === "doors" && window.SignFlipDoors) window.SignFlipDoors.mount();
  }

  function buildCards() {
    G.stage.querySelectorAll(".mcard").forEach((n) => n.remove());
    G.cards = [];
    const defs = [];
    CONCEPTS.forEach((c) => {
      defs.push({ key: c.key, kind: "note", tex: c.tex });
      defs.push({ key: c.key, kind: "diag", dir: c.dir, filled: c.filled });
    });
    defs.forEach((d) => {
      const el = document.createElement("div");
      el.className = "mcard";
      const front = d.kind === "note"
        ? `<div class="mc-face mc-front"><span class="mc-note"></span></div>`
        : `<div class="mc-face mc-front">${diagramSVG(d.dir, d.filled)}</div>`;
      el.innerHTML = `<div class="mc-inner"><div class="mc-face mc-back"></div>${front}</div>`;
      if (d.kind === "note") {
        const span = el.querySelector(".mc-note");
        try { katex.render(d.tex, span, { throwOnError: false }); } catch (e) { span.textContent = d.tex; }
      }
      const card = { key: d.key, kind: d.kind, el, slot: 0, matched: false };
      el.addEventListener("click", () => onCardClick(card));
      G.stage.appendChild(el);
      G.cards.push(card);
    });
    G.built = true;
  }

  function layout() {
    if (!G.stage) return;
    const W = G.stage.clientWidth;
    if (W < 2) return;
    G.cols = W < 560 ? 2 : 4;
    const rows = Math.ceil(8 / G.cols);
    G.cardW = (W - G.gap * (G.cols - 1)) / G.cols;
    G.cardH = G.cardW * 0.66;
    G.stage.style.height = (rows * G.cardH + (rows - 1) * G.gap) + "px";
    G.slots = [];
    for (let i = 0; i < 8; i++) {
      const r = Math.floor(i / G.cols), c = i % G.cols;
      G.slots[i] = { x: c * (G.cardW + G.gap), y: r * (G.cardH + G.gap) };
    }
    G.cards.forEach((card) => {
      card.el.style.width = G.cardW + "px";
      card.el.style.height = G.cardH + "px";
      placeCard(card);
    });
  }

  function placeCard(card) {
    const p = G.slots[card.slot];
    if (p) card.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

  function assignSlots() {
    const perm = shuffled([0, 1, 2, 3, 4, 5, 6, 7]);
    G.cards.forEach((card, i) => { card.slot = perm[i]; });
  }

  // ── UI / HUD ────────────────────────────────────────────────────────────────
  function setUI(msg, btnLabel) {
    G.els.msg.innerHTML = msg;
    if (btnLabel) { G.els.action.textContent = btnLabel; G.els.action.classList.remove("hidden"); }
    else G.els.action.classList.add("hidden");
    G.els.round.textContent = G.round;
    G.els.matched.textContent = G.matched;
    G.els.moves.textContent = G.moves;
    let pips = "";
    for (let r = 1; r <= 3; r++) pips += `<span class="pip ${r < G.round ? "on" : ""}"></span>`;
    G.els.pips.innerHTML = pips;
  }

  // ── phases ────────────────────────────────────────────────────────────────────
  function startGame() {
    if (!G.built) buildCards();
    G.round = 1; G.moves = 0;
    assignSlots();
    layout();
    beginRound();
  }

  function beginRound() {
    G.matched = 0; G.flipped = []; G.lock = true; G.phase = "preview";
    G.cards.forEach((c) => { c.matched = false; c.el.classList.remove("matched", "bad", "locked"); c.el.classList.add("up"); });
    const intro = G.round === 1
      ? "<b>Round 1.</b> Study the eight cards, then hide them and match the four pairs from memory."
      : G.round === 2
        ? "<b>Round 2.</b> Memorise the cards &mdash; this time they get shuffled before you match."
        : "<b>Round 3.</b> Last one! The shuffle is faster and messier. Track them carefully.";
    setUI(intro, G.round === 1 ? "Hide cards \u25B6" : "Hide &amp; shuffle \u25B6");
  }

  function onAction() {
    if (G.phase === "idle") return startGame();
    if (G.phase === "preview") return hideAndShuffle();
    if (G.phase === "clear") { G.round += 1; return beginRound(); }
    if (G.phase === "won") return startGame();
  }

  function hideAndShuffle() {
    G.phase = "shuffle"; G.lock = true;
    G.cards.forEach((c) => c.el.classList.remove("up"));
    setUI("Watch the cards\u2026", null);
    const cfg = SHUFFLE[G.round];
    setTimeout(() => doShuffle(cfg.n, cfg.delay, startPlay), 520);
  }

  function doShuffle(n, delay, done) {
    if (n <= 0) { setTimeout(done, 150); return; }
    G.cards.forEach((c) => { c.el.style.transitionDuration = delay + "ms"; });
    let k = 0;
    (function step() {
      if (k >= n) {
        G.cards.forEach((c) => { c.el.style.transitionDuration = ""; });
        done();
        return;
      }
      let a = (Math.random() * 8) | 0, b = (Math.random() * 8) | 0;
      while (b === a) b = (Math.random() * 8) | 0;
      const ca = G.cards.find((c) => c.slot === a), cb = G.cards.find((c) => c.slot === b);
      ca.slot = b; cb.slot = a;
      placeCard(ca); placeCard(cb);
      k++;
      setTimeout(step, delay);
    })();
  }

  function startPlay() {
    G.phase = "play"; G.lock = false; G.flipped = [];
    setUI("Find the four matching pairs &mdash; tap two cards to compare them.", null);
  }

  function onCardClick(card) {
    if (G.lock || G.phase !== "play" || card.matched) return;
    if (card.el.classList.contains("up")) return;
    if (G.flipped.length >= 2) return;
    card.el.classList.add("up");
    G.flipped.push(card);
    if (G.flipped.length === 2) {
      G.moves += 1;
      G.els.moves.textContent = G.moves;
      G.lock = true;
      const [a, b] = G.flipped;
      if (a.key === b.key) setTimeout(() => resolveMatch(a, b), 420);
      else setTimeout(() => resolveMiss(a, b), 850);
    }
  }

  function resolveMatch(a, b) {
    a.matched = b.matched = true;
    a.el.classList.add("matched", "locked");
    b.el.classList.add("matched", "locked");
    G.flipped = [];
    G.matched += 1;
    G.els.matched.textContent = G.matched;
    if (G.matched >= 4) return roundClear();
    G.lock = false;
  }

  function resolveMiss(a, b) {
    a.el.classList.add("bad"); b.el.classList.add("bad");
    setTimeout(() => {
      a.el.classList.remove("up", "bad");
      b.el.classList.remove("up", "bad");
      G.flipped = [];
      G.lock = false;
    }, 260);
  }

  function roundClear() {
    if (G.round >= 3) {
      G.phase = "won"; G.lock = true;
      setUI(`<b>You cleared all 3 rounds!</b> Every inequality matched to its picture in ${G.moves} moves.`, "Play again \u21BB");
    } else {
      G.phase = "clear"; G.lock = true;
      setUI(`<b>Round ${G.round} cleared!</b> All four pairs found. Ready for a tougher shuffle?`, "Next round \u25B6");
    }
  }

  // ── init ────────────────────────────────────────────────────────────────────
  function init() {
    G.stage = document.getElementById("mg-stage");
    if (!G.stage) return;
    G.els = {
      msg: document.getElementById("mg-msg"),
      action: document.getElementById("mg-action"),
      restart: document.getElementById("mg-restart"),
      round: document.getElementById("mg-round"),
      matched: document.getElementById("mg-matched"),
      moves: document.getElementById("mg-moves"),
      pips: document.getElementById("mg-pips"),
    };
    G.els.action.addEventListener("click", onAction);
    G.els.restart.addEventListener("click", startGame);
    document.querySelectorAll("[data-ineq-game]").forEach((b) => {
      b.addEventListener("click", () => setGameMode(b.dataset.ineqGame));
    });
    window.addEventListener("resize", () => { if (G.built) layout(); });

    buildCards();
    G.cards.forEach((c, i) => { c.slot = i; });
    setUI("Match each inequality to its number-line picture. Three rounds &mdash; the cards shuffle more each time.", "Start \u25B6");
    G.phase = "idle";

    window.IneqGame = {
      onShow() {
        if (G.activeMode === "matchup") layout();
        else if (window.SignFlipDoors) window.SignFlipDoors.mount();
      },
      setMode: setGameMode,
    };

    const qGame = new URLSearchParams(location.search).get("game");
    setGameMode(qGame === "doors" ? "doors" : "matchup");
  }

  if (window.katex) window.addEventListener("DOMContentLoaded", init);
  else window.addEventListener("DOMContentLoaded", () => {
    (function wait() { if (window.katex) init(); else setTimeout(wait, 30); })();
  });
})();
