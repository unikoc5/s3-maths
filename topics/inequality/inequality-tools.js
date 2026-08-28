/* Inequality — Tab 1 deck wiring + Tab 2 sign-flip flashcards.
 *
 * Each run builds a 12-card deck in ascending difficulty:
 *   Stage 1 × 3 (positive) → Stage 2 × 5 (negative / sign flip) → Stage 3 × 4 (multi-step).
 * Stage 3 requires entering the boundary value of x as well as sign + dot.
 */
(function () {
  "use strict";

  const ACC = "#0277BD", AXIS = "#9AA3AD", ZERO = "#5d544f", CARD_BG = "#ffffff";
  const STAGE_COUNTS = { 1: 3, 2: 5, 3: 4 };

  const SIGNS = [
    { op: ">", label: ">" },
    { op: "<", label: "<" },
    { op: ">=", label: "\u2265" },
    { op: "<=", label: "\u2264" },
  ];

  const DOTS = [
    { id: "hollow", filled: false, label: "Hollow" },
    { id: "filled", filled: true, label: "Filled" },
  ];

  const OPS = [">", "<", ">=", "<="];

  function opTex(op) {
    if (op === ">=") return "\\ge";
    if (op === "<=") return "\\le";
    return op;
  }

  function flipOp(op) {
    if (op === ">") return "<";
    if (op === "<") return ">";
    if (op === ">=") return "<=";
    if (op === "<=") return ">=";
    return op;
  }

  function randInt(lo, hi) {
    return lo + ((Math.random() * (hi - lo + 1)) | 0);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function answerTexFrom(op, k) {
    return "x " + opTex(op) + " " + k;
  }

  function makePart(stage, startTex, divideTex, answerTex, steps) {
    const labels = {
      1: "Stage 1 \u00b7 positive",
      2: "Stage 2 \u00b7 negative",
      3: "Stage 3 \u00b7 multi-step",
    };
    return {
      id: "s" + stage + "-" + startTex + "|" + answerTex + "|" + Math.random().toString(36).slice(2, 7),
      stage: stage,
      stageLabel: labels[stage],
      startTex: startTex,
      divideTex: divideTex,
      answerTex: answerTex,
      steps: steps || null,
      needsBound: stage === 3,
    };
  }

  /** Stage 1 — positive coefficient, divide only (wide integer bank). */
  function genStage1() {
    const a = randInt(2, 9);
    let k = randInt(-8, 8);
    if (k === 0) k = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
    const op = pick(OPS);
    const c = a * k;
    return makePart(1, a + "x " + opTex(op) + " " + c, String(a), answerTexFrom(op, k));
  }

  /** Stage 2 — negative coefficient (sign flips on divide). */
  function genStage2() {
    const a = randInt(2, 8);
    let k = randInt(-7, 7);
    if (k === 0) k = pick([-5, -3, -2, -1, 1, 2, 3, 4]);
    const finalOp = pick(OPS);
    const startOp = flipOp(finalOp);
    const c = -a * k;
    return makePart(2, "-" + a + "x " + opTex(startOp) + " " + c, String(-a), answerTexFrom(finalOp, k));
  }

  /** Stage 3 — multi-step; integer answers only (no decimals). */
  function genStage3() {
    const kind = randInt(0, 5);
    if (kind === 0) {
      const a = randInt(2, 7);
      const b = randInt(1, 12);
      let k = randInt(-5, 8);
      if (k === 0) k = pick([-2, 1, 2, 3, 4]);
      const op = pick(OPS);
      const c = a * k + b;
      return makePart(
        3,
        a + "x + " + b + " " + opTex(op) + " " + c,
        String(a),
        answerTexFrom(op, k),
        ["Subtract " + b + " from both sides", "Divide both sides by " + a]
      );
    }
    if (kind === 1) {
      const a = randInt(2, 7);
      const b = randInt(1, 12);
      let k = randInt(-4, 8);
      if (k === 0) k = pick([-1, 2, 3, 5]);
      const op = pick(OPS);
      const c = a * k - b;
      return makePart(
        3,
        a + "x - " + b + " " + opTex(op) + " " + c,
        String(a),
        answerTexFrom(op, k),
        ["Add " + b + " to both sides", "Divide both sides by " + a]
      );
    }
    if (kind === 2) {
      const a = randInt(2, 6);
      const b = randInt(1, 10);
      let k = randInt(-5, 5);
      if (k === 0) k = pick([-3, -1, 1, 2, 4]);
      const finalOp = pick(OPS);
      const startOp = flipOp(finalOp);
      const c = b - a * k;
      return makePart(
        3,
        "-" + a + "x + " + b + " " + opTex(startOp) + " " + c,
        String(-a),
        answerTexFrom(finalOp, k),
        ["Subtract " + b + " from both sides", "Divide both sides by -" + a + " (flip the sign)"]
      );
    }
    if (kind === 3) {
      const a = randInt(2, 6);
      const b = randInt(1, 10);
      let k = randInt(-4, 6);
      if (k === 0) k = 2;
      const finalOp = pick(OPS);
      const startOp = flipOp(finalOp);
      // -ax - b  startOp  c  →  after add b: -ax startOp (c+b), c+b = -a*k
      const c = -a * k - b;
      return makePart(
        3,
        "-" + a + "x - " + b + " " + opTex(startOp) + " " + c,
        String(-a),
        answerTexFrom(finalOp, k),
        ["Add " + b + " to both sides", "Divide both sides by -" + a + " (flip the sign)"]
      );
    }
    if (kind === 4) {
      // (1/2)x + b  op  c  with integer c and even k so half is integer
      const b = randInt(1, 6);
      const k = pick([2, 4, 6, 8, -2, -4, -6]);
      const op = pick(OPS);
      const c = k / 2 + b;
      return makePart(
        3,
        "\\tfrac{1}{2}x + " + b + " " + opTex(op) + " " + c,
        "1/2",
        answerTexFrom(op, k),
        ["Subtract " + b + " from both sides", "Multiply both sides by 2"]
      );
    }
    // (1/3)x - b  op  c  with k multiple of 3
    const b = randInt(1, 5);
    const k = pick([3, 6, 9, -3, -6]);
    const op = pick(OPS);
    const c = k / 3 - b;
    return makePart(
      3,
      "\\tfrac{1}{3}x - " + b + " " + opTex(op) + " " + c,
      "1/3",
      answerTexFrom(op, k),
      ["Add " + b + " to both sides", "Multiply both sides by 3"]
    );
  }

  function collectStage(gen, count, seen) {
    const out = [];
    let guard = 0;
    while (out.length < count && guard++ < 200) {
      const p = gen();
      const key = p.startTex + "=>" + p.answerTex;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return shuffled(out);
  }

  /** Ascending difficulty: stage 1, then 2, then 3 (shuffle only within each stage). */
  function buildDeck() {
    const seen = new Set();
    return []
      .concat(collectStage(genStage1, STAGE_COUNTS[1], seen))
      .concat(collectStage(genStage2, STAGE_COUNTS[2], seen))
      .concat(collectStage(genStage3, STAGE_COUNTS[3], seen));
  }

  function km(el, tex) {
    try { katex.render(tex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = tex; }
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function cardPrompt(part) {
    if (part.needsBound) {
      const base = part.steps && part.steps.length
        ? part.steps.join(" \u2192 ") + "."
        : "Solve the inequality.";
      return base + " Enter the boundary value of x, then drag the sign and hollow/filled.";
    }
    if (part.steps && part.steps.length) {
      return part.steps.join(" \u2192 ") + ". Then drag the sign and dot type.";
    }
    const d = part.divideTex.charAt(0) === "-" ? "\u2212" + part.divideTex.slice(1) : part.divideTex;
    return "Divide both sides by " + d + ". Drag the sign and dot type.";
  }

  function parseAnswerTex(tex) {
    const plain = tex.replace(/\\ge/g, ">=").replace(/\\le/g, "<=");
    const m = plain.match(/^x\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    return { op: m[1], boundary: parseFloat(m[2]), filled: m[1] === ">=" || m[1] === "<=" };
  }

  function signLabel(op) {
    return SIGNS.find((s) => s.op === op)?.label || op;
  }

  function boundaryTex(n) {
    return Number.isInteger(n) ? String(n) : String(n);
  }

  function chosenAnswerTex(op, boundary) {
    return "x " + opTex(op) + " " + boundaryTex(boundary);
  }

  const BOUND_MIN = -99;
  const BOUND_MAX = 99;

  function parseBoundInput(raw) {
    if (raw == null || String(raw).trim() === "") return null;
    const n = Number(String(raw).trim());
    if (!Number.isFinite(n)) return null;
    if (n < BOUND_MIN || n > BOUND_MAX) return null;
    return n;
  }

  function clampBoundInput(el) {
    if (!el) return;
    const raw = String(el.value).trim();
    if (raw === "" || raw === "-" || raw === "+") return;
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      el.value = "";
      return;
    }
    if (n > BOUND_MAX) el.value = String(BOUND_MAX);
    else if (n < BOUND_MIN) el.value = String(BOUND_MIN);
  }

  function scrollToolsTop() {
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    try { parent.postMessage({ type: "jm-tools-scroll-top" }, "*"); } catch (e) { /* ignore */ }
  }

  function postToolsHeight() {
    if (typeof window.__jmToolsPostHeight !== "function") return;
    var run = window.__jmToolsPostHeight;
    requestAnimationFrame(function () {
      run();
      setTimeout(run, 50);
      setTimeout(run, 200);
      setTimeout(run, 500);
    });
  }

  function nlLayout(boundary) {
    const min = Math.floor(boundary) - 2;
    const max = Math.ceil(boundary) + 2;
    const span = max - min || 1;
    const mapX = (v) => 36 + ((v - min) / span) * 208;
    return { min, max, mapX, cx: mapX(boundary) };
  }

  /** dotFilled: null = dashed target, true/false = student or answer dot
   *  opts.animateRay — grow the ray after check (correct or reveal)
   */
  function numberLineSVG(boundary, op, dotFilled, opts) {
    opts = opts || {};
    const dir = op && (op === ">" || op === ">=") ? "right" : op ? "left" : null;
    const { min, max, mapX, cx } = nlLayout(boundary);
    const axisY = 68, dotY = 32, dotR = 9, arrowLen = 11;
    const tip = dir === "right" ? 252 : dir === "left" ? 28 : 0;
    const rayStart = dir === "right" ? cx + dotR : cx - dotR;
    const lineEnd = dir === "right" ? tip - arrowLen : dir === "left" ? tip + arrowLen : tip;
    const head = dir === "right"
      ? `M${tip},${dotY} l-${arrowLen},-6 l0,12 z`
      : `M${tip},${dotY} l${arrowLen},-6 l0,12 z`;

    let ticks = "";
    for (let i = min; i <= max; i++) {
      const tx = mapX(i);
      const highlight = Math.abs(i - boundary) < 0.001;
      ticks += `<line x1="${tx}" y1="${axisY - 5}" x2="${tx}" y2="${axisY + 5}" stroke="${highlight ? ACC : AXIS}" stroke-width="${highlight ? 2.5 : 1.5}"/>`;
      ticks += `<text x="${tx}" y="90" fill="${highlight ? ACC : ZERO}" font-size="13" text-anchor="middle" font-family="JetBrains Mono, monospace">${i}</text>`;
    }

    const rayClass = opts.animateRay ? ' class="sf-ray-anim"' : "";
    const ray = dir
      ? `<g${rayClass}>
         <line x1="${cx}" y1="${axisY}" x2="${cx}" y2="${dotY + dotR}" stroke="${ACC}" stroke-width="2.5"/>
         <line x1="${rayStart}" y1="${dotY}" x2="${lineEnd}" y2="${dotY}" stroke="${ACC}" stroke-width="5.5" stroke-linecap="butt"/>
         <path d="${head}" fill="${ACC}"/>
         </g>`
      : "";

    let dotMark;
    if (dotFilled === null) {
      dotMark = `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="none" stroke="${AXIS}" stroke-width="2" stroke-dasharray="4 3"/>`;
    } else if (dotFilled) {
      dotMark = `<circle class="sf-dot-pop" cx="${cx}" cy="${dotY}" r="${dotR}" fill="${ACC}"/>`;
    } else {
      dotMark = `<circle class="sf-dot-pop" cx="${cx}" cy="${dotY}" r="${dotR}" fill="${CARD_BG}" stroke="${ACC}" stroke-width="3.5"/>`;
    }

    return `<svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" role="img">
      <line x1="22" y1="${axisY}" x2="258" y2="${axisY}" stroke="${AXIS}" stroke-width="2.5" stroke-linecap="butt"/>
      <path d="M14,${axisY} L22,${axisY - 4} L22,${axisY + 4} Z" fill="${AXIS}"/>
      <path d="M266,${axisY} L258,${axisY - 4} L258,${axisY + 4} Z" fill="${AXIS}"/>
      ${ticks}
      ${ray}
      ${dotMark}
    </svg>`;
  }

  function wireDragSource(el, payload, chips) {
    el.draggable = true;
    el.dataset.payload = payload;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", payload);
      e.dataTransfer.effectAllowed = "copy";
    });
    el.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("selected", c === el));
    });

    let pointerDrag = false;
    let dragGhost = null;

    function clearGhost() {
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }
      document.querySelectorAll("[data-drop-accept].drag-over").forEach((n) => {
        n.classList.remove("drag-over");
      });
      el.style.opacity = "";
    }

    function moveGhost(x, y) {
      if (!dragGhost) return;
      dragGhost.style.left = x + "px";
      dragGhost.style.top = y + "px";
      const hit = document.elementFromPoint(x, y);
      document.querySelectorAll("[data-drop-accept]").forEach((slot) => {
        slot.classList.toggle("drag-over", !!(hit && slot.contains(hit)));
      });
    }

    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      pointerDrag = true;
      chips.forEach((c) => c.classList.toggle("selected", c === el));
      dragGhost = el.cloneNode(true);
      dragGhost.classList.add("sf-drag-ghost");
      dragGhost.removeAttribute("draggable");
      document.body.appendChild(dragGhost);
      moveGhost(e.clientX, e.clientY);
      el.style.opacity = "0.35";
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });

    el.addEventListener("pointermove", (e) => {
      if (!pointerDrag || e.pointerType === "mouse") return;
      moveGhost(e.clientX, e.clientY);
      e.preventDefault();
    });

    el.addEventListener("pointerup", (e) => {
      if (!pointerDrag || e.pointerType === "mouse") return;
      pointerDrag = false;
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      clearGhost();
      if (!hit) return;
      const slot = hit.closest("[data-drop-accept]");
      if (slot && typeof slot._acceptDrop === "function" && slot._acceptDrop(payload)) {
        chips.forEach((c) => c.classList.remove("selected"));
      }
    });

    el.addEventListener("pointercancel", () => {
      pointerDrag = false;
      clearGhost();
    });
  }

  function wireDropSlot(slot, acceptPrefix, onDrop) {
    slot.dataset.dropAccept = acceptPrefix;
    function accept(payload) {
      if (!payload || !payload.startsWith(acceptPrefix)) return false;
      onDrop(payload.slice(acceptPrefix.length));
      return true;
    }
    slot._acceptDrop = accept;
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      slot.classList.add("drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drag-over");
      const payload = e.dataTransfer.getData("text/plain");
      if (payload.startsWith(acceptPrefix)) onDrop(payload.slice(acceptPrefix.length));
    });
    slot.addEventListener("click", () => {
      const sel = document.querySelector(".sf-drag-chip.selected");
      if (sel) accept(sel.dataset.payload);
    });
  }

  function initSignFlipTool() {
    const root = document.getElementById("sf-root");
    if (!root) return;

    let deck = buildDeck();
    let idx = 0;
    /** @type {Record<string, {ok:boolean, chosenSign:string, chosenDot:string, part:object}>} */
    const results = {};

    function scoreCount() {
      return Object.values(results).filter((r) => r.ok).length;
    }

    function progressTrackHtml() {
      return '<div class="sf-progress-fill"><span class="sf-progress-ok" aria-hidden="true"></span><span class="sf-progress-bad" aria-hidden="true"></span></div>';
    }

    function updateProgressBar(track, done) {
      if (!track) return;
      const fill = track.querySelector(".sf-progress-fill");
      const okEl = track.querySelector(".sf-progress-ok");
      const badEl = track.querySelector(".sf-progress-bad");
      if (!fill || !okEl || !badEl) return;
      const answered = Object.keys(results).length;
      const correct = scoreCount();
      const wrong = answered - correct;
      const total = deck.length;
      if (answered > 0 || done) {
        track.classList.add("sf-accuracy");
        fill.style.width = "100%";
        fill.style.background = "transparent";
        okEl.style.width = Math.round((correct / total) * 100) + "%";
        badEl.style.width = Math.round((wrong / total) * 100) + "%";
      } else {
        track.classList.remove("sf-accuracy");
        fill.style.width = "0%";
        fill.style.background = "";
        okEl.style.width = "0%";
        badEl.style.width = "0%";
      }
    }

    function renderProgress(el, done) {
      const answered = Object.keys(results).length;
      const correct = scoreCount();
      const total = deck.length;
      el.className = "sf-progress" + (done ? " done" : "");
      if (done) {
        el.textContent = "Complete \u2014 " + correct + " / " + total + " correct";
      } else {
        el.textContent = "Card " + (idx + 1) + " of " + total
          + (answered ? " \u00b7 " + correct + " correct so far" : "");
      }
      const track = el.parentElement && el.parentElement.querySelector(".sf-progress-track");
      updateProgressBar(track, done);
    }

    function showDone() {
      root.innerHTML = "";
      const deckEl = document.createElement("div");
      deckEl.className = "sf-deck sf-done-enter";

      const progress = document.createElement("div");
      progress.className = "sf-progress done";
      const correct = scoreCount();
      const total = deck.length;
      progress.textContent = "Complete \u2014 " + correct + " / " + total + " correct";
      deckEl.appendChild(progress);

      const track = document.createElement("div");
      track.className = "sf-progress-track sf-accuracy";
      track.innerHTML = progressTrackHtml();
      deckEl.appendChild(track);
      updateProgressBar(track, true);

      const done = document.createElement("div");
      done.className = "sf-done";
      done.innerHTML = correct === total
        ? "<b>Perfect!</b> You matched every sign and dot type."
        : "You scored <b>" + correct + " / " + total + "</b>. Remember: \u2265 / \u2264 use a filled dot; &gt; / &lt; use a hollow dot.";
      deckEl.appendChild(done);

      const wrongs = deck
        .map((p) => results[p.id])
        .filter((r) => r && !r.ok);

      if (wrongs.length) {
        const review = document.createElement("section");
        review.className = "sf-review";
        const rh = document.createElement("h3");
        rh.className = "sf-review-title";
        rh.textContent = "Review \u00b7 " + wrongs.length + " to revisit";
        review.appendChild(rh);

        wrongs.forEach((r, i) => {
          const part = r.part;
          const correct = parseAnswerTex(part.answerTex);
          const item = document.createElement("article");
          item.className = "sf-review-item";
          item.style.animationDelay = (0.08 * i) + "s";

          const q = document.createElement("div");
          q.className = "sf-review-q";
          const qLbl = document.createElement("span");
          qLbl.className = "sf-review-lbl";
          qLbl.textContent = "Question";
          q.appendChild(qLbl);
          const qTex = document.createElement("span");
          km(qTex, part.startTex);
          q.appendChild(qTex);
          item.appendChild(q);

          const rows = document.createElement("div");
          rows.className = "sf-review-rows";

          const yours = document.createElement("div");
          yours.className = "sf-review-yours";
          const yLbl = document.createElement("span");
          yLbl.className = "sf-review-lbl";
          yLbl.textContent = "Your answer";
          yours.appendChild(yLbl);
          const yTex = document.createElement("span");
          const shownBound = r.chosenBound != null ? r.chosenBound : correct.boundary;
          km(yTex, chosenAnswerTex(r.chosenSign, shownBound));
          yours.appendChild(yTex);
          const yDot = document.createElement("span");
          yDot.className = "sf-review-dot " + r.chosenDot;
          yDot.title = r.chosenDot === "filled" ? "Filled dot" : "Hollow dot";
          yours.appendChild(yDot);
          rows.appendChild(yours);

          const okRow = document.createElement("div");
          okRow.className = "sf-review-ok";
          const oLbl = document.createElement("span");
          oLbl.className = "sf-review-lbl";
          oLbl.textContent = "Correct";
          okRow.appendChild(oLbl);
          const oTex = document.createElement("span");
          km(oTex, part.answerTex);
          okRow.appendChild(oTex);
          const oDot = document.createElement("span");
          oDot.className = "sf-review-dot " + (correct.filled ? "filled" : "hollow");
          oDot.title = correct.filled ? "Filled dot" : "Hollow dot";
          okRow.appendChild(oDot);
          rows.appendChild(okRow);

          item.appendChild(rows);

          const nl = document.createElement("div");
          nl.className = "sf-review-nl";
          nl.innerHTML = numberLineSVG(correct.boundary, correct.op, correct.filled, { animateRay: true });
          item.appendChild(nl);

          review.appendChild(item);
        });
        deckEl.appendChild(review);
      }

      const nav = document.createElement("div");
      nav.className = "sf-nav";
      const again = document.createElement("button");
      again.type = "button";
      again.className = "sf-nav-btn";
      again.textContent = "Try again";
      again.addEventListener("click", reset);
      nav.appendChild(again);
      deckEl.appendChild(nav);

      root.appendChild(deckEl);
      postToolsHeight();
    }

    function renderCard() {
      if (idx >= deck.length) { showDone(); return; }

      const part = deck[idx];
      const correct = parseAnswerTex(part.answerTex);
      if (!correct) return;

      root.innerHTML = "";
      let pickedSign = null;
      let pickedDot = null;
      let enteredBound = part.needsBound ? null : correct.boundary;
      let locked = false;

      const deckEl = document.createElement("div");
      deckEl.className = "sf-deck";

      const progress = document.createElement("div");
      progress.className = "sf-progress";
      deckEl.appendChild(progress);

      const track = document.createElement("div");
      track.className = "sf-progress-track";
      track.innerHTML = progressTrackHtml();
      deckEl.appendChild(track);
      renderProgress(progress, false);

      const card = document.createElement("article");
      card.className = "sf-card sf-card-enter";

      const cardTop = document.createElement("div");
      cardTop.className = "sf-card-top";

      const head = document.createElement("div");
      head.className = "sf-head";
      const stageTag = document.createElement("span");
      stageTag.className = "sf-stage";
      stageTag.textContent = part.stageLabel || ("Stage " + (part.stage || 1));
      head.appendChild(stageTag);
      head.appendChild(document.createTextNode(" \u00b7 Card " + (idx + 1) + " / " + deck.length));
      cardTop.appendChild(head);

      const prompt = document.createElement("p");
      prompt.className = "sf-prompt";
      prompt.textContent = cardPrompt(part);
      cardTop.appendChild(prompt);
      card.appendChild(cardTop);

      const layoutRow = document.createElement("div");
      layoutRow.className = "sf-layout";

      const leftCol = document.createElement("div");
      leftCol.className = "sf-left";

      const stemRow = document.createElement("div");
      stemRow.className = "sf-stem-row";
      const stem = document.createElement("div");
      stem.className = "sf-stem";
      km(stem, part.startTex);
      stemRow.appendChild(stem);
      leftCol.appendChild(stemRow);

      const build = document.createElement("div");
      build.className = "sf-build";
      const buildLbl = document.createElement("p");
      buildLbl.className = "sf-build-lbl";
      buildLbl.textContent = "Your answer";
      build.appendChild(buildLbl);

      const xSpan = document.createElement("span");
      xSpan.className = "sf-build-x";
      xSpan.textContent = "x";
      build.appendChild(xSpan);

      const signSlot = document.createElement("div");
      signSlot.className = "sf-sign-slot";
      signSlot.textContent = "?";
      signSlot.setAttribute("aria-label", "Drop inequality sign here");
      build.appendChild(signSlot);

      let boundInput = null;
      const valSpan = document.createElement("span");
      valSpan.className = "sf-build-val";
      if (part.needsBound) {
        boundInput = document.createElement("input");
        boundInput.type = "number";
        boundInput.className = "sf-bound-input";
        boundInput.placeholder = "?";
        boundInput.min = String(BOUND_MIN);
        boundInput.max = String(BOUND_MAX);
        boundInput.step = "1";
        boundInput.setAttribute("aria-label", "Boundary value of x (" + BOUND_MIN + " to " + BOUND_MAX + ")");
        boundInput.inputMode = "numeric";
        valSpan.appendChild(boundInput);
      } else {
        km(valSpan, boundaryTex(correct.boundary));
      }
      build.appendChild(valSpan);
      leftCol.appendChild(build);

      const signBankWrap = document.createElement("div");
      signBankWrap.className = "sf-bank-wrap";
      const signBankLbl = document.createElement("p");
      signBankLbl.className = "sf-bank-lbl";
      signBankLbl.textContent = "Drag a sign";
      signBankWrap.appendChild(signBankLbl);
      const signBank = document.createElement("div");
      signBank.className = "sf-sign-bank";
      const signChips = [];
      SIGNS.forEach((s) => {
        const chip = document.createElement("span");
        chip.className = "sf-drag-chip";
        chip.textContent = s.label;
        chip.title = s.label;
        wireDragSource(chip, "sign:" + s.op, signChips);
        signBank.appendChild(chip);
        signChips.push(chip);
      });
      signBankWrap.appendChild(signBank);
      leftCol.appendChild(signBankWrap);

      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "sf-check-btn";
      checkBtn.textContent = "Check answer";
      checkBtn.disabled = true;
      leftCol.appendChild(checkBtn);

      const feedback = document.createElement("div");
      feedback.className = "sf-feedback";
      leftCol.appendChild(feedback);

      const rightCol = document.createElement("div");
      rightCol.className = "sf-right";

      const nlSection = document.createElement("div");
      nlSection.className = "sf-nl-section";
      const nlLbl = document.createElement("p");
      nlLbl.className = "sf-bank-lbl";
      nlLbl.textContent = part.needsBound
        ? "Number line \u2014 enter the value, then drag hollow or filled"
        : "Number line \u2014 drag hollow or filled onto the dot";
      nlSection.appendChild(nlLbl);

      const nlAnswer = document.createElement("p");
      nlAnswer.className = "sf-nl-answer hidden";
      nlSection.appendChild(nlAnswer);

      const nlBoard = document.createElement("div");
      nlBoard.className = "sf-nl-board drop-target";
      // Stage 3: do not reveal the correct boundary before the student enters it.
      nlBoard.innerHTML = part.needsBound
        ? numberLineSVG(0, null, null)
        : numberLineSVG(correct.boundary, null, null);
      nlSection.appendChild(nlBoard);
      rightCol.appendChild(nlSection);

      const dotBankWrap = document.createElement("div");
      dotBankWrap.className = "sf-bank-wrap";
      const dotBankLbl = document.createElement("p");
      dotBankLbl.className = "sf-bank-lbl";
      dotBankLbl.textContent = "Dot type";
      dotBankWrap.appendChild(dotBankLbl);
      const dotBank = document.createElement("div");
      dotBank.className = "sf-dot-bank";
      const dotChips = [];
      DOTS.forEach((d) => {
        const chip = document.createElement("span");
        chip.className = "sf-drag-chip dot-chip";
        chip.title = d.label;
        const preview = document.createElement("span");
        preview.className = "sf-dot-preview " + d.id;
        chip.appendChild(preview);
        wireDragSource(chip, "dot:" + d.id, dotChips);
        dotBank.appendChild(chip);
        dotChips.push(chip);
      });
      dotBankWrap.appendChild(dotBank);
      rightCol.appendChild(dotBankWrap);

      layoutRow.appendChild(leftCol);
      layoutRow.appendChild(rightCol);
      card.appendChild(layoutRow);

      deckEl.appendChild(card);

      const nav = document.createElement("div");
      nav.className = "sf-nav";
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "sf-nav-btn hidden";
      nextBtn.textContent = idx === deck.length - 1 ? "See results" : "Next card";
      nextBtn.addEventListener("click", () => { idx++; renderCard(); postToolsHeight(); });
      nav.appendChild(nextBtn);
      deckEl.appendChild(nav);

      root.appendChild(deckEl);
      postToolsHeight();

      function dotFilledValue() {
        if (pickedDot === "filled") return true;
        if (pickedDot === "hollow") return false;
        return null;
      }

      function previewBoundary() {
        if (part.needsBound) {
          const n = parseBoundInput(boundInput && boundInput.value);
          return n == null ? null : n;
        }
        return correct.boundary;
      }

      function paintBoard(mode) {
        nlBoard.querySelector("svg")?.remove();
        if (mode === "answer" || mode === "correct") {
          nlBoard.insertAdjacentHTML("afterbegin", numberLineSVG(correct.boundary, correct.op, correct.filled, {
            animateRay: true,
          }));
        } else {
          const b = previewBoundary();
          if (b == null) {
            nlBoard.insertAdjacentHTML("afterbegin", numberLineSVG(0, null, null));
          } else {
            nlBoard.insertAdjacentHTML("afterbegin", numberLineSVG(b, pickedSign, dotFilledValue()));
          }
        }
      }

      function readyToCheck() {
        if (!(pickedSign && pickedDot) || locked) return false;
        if (part.needsBound) return parseBoundInput(boundInput && boundInput.value) != null;
        return true;
      }

      function updatePreview() {
        paintBoard("preview");
        checkBtn.disabled = !readyToCheck();
      }

      function setSign(op) {
        if (locked || !SIGNS.some((s) => s.op === op)) return;
        pickedSign = op;
        signSlot.textContent = signLabel(op);
        signSlot.classList.add("filled");
        signChips.forEach((c) => c.classList.remove("selected"));
        updatePreview();
      }

      function setDot(id) {
        if (locked || !DOTS.some((d) => d.id === id)) return;
        pickedDot = id;
        dotChips.forEach((c) => c.classList.remove("selected"));
        updatePreview();
      }

      wireDropSlot(signSlot, "sign:", setSign);
      wireDropSlot(nlBoard, "dot:", setDot);
      if (boundInput) {
        boundInput.addEventListener("input", () => {
          clampBoundInput(boundInput);
          enteredBound = parseBoundInput(boundInput.value);
          updatePreview();
        });
        boundInput.addEventListener("change", () => {
          clampBoundInput(boundInput);
          enteredBound = parseBoundInput(boundInput.value);
          updatePreview();
        });
      }

      checkBtn.addEventListener("click", () => {
        if (!readyToCheck()) return;
        locked = true;
        checkBtn.disabled = true;
        if (boundInput) boundInput.disabled = true;
        signChips.forEach((c) => { c.draggable = false; c.style.pointerEvents = "none"; });
        dotChips.forEach((c) => { c.draggable = false; c.style.pointerEvents = "none"; });
        signBankWrap.classList.add("hidden");
        dotBankWrap.classList.add("hidden");
        nlBoard.classList.remove("drop-target", "drag-over");

        enteredBound = part.needsBound ? parseBoundInput(boundInput.value) : correct.boundary;
        const signOk = pickedSign === correct.op;
        const dotOk = (pickedDot === "filled") === correct.filled;
        const boundOk = !part.needsBound || (enteredBound != null && Math.abs(enteredBound - correct.boundary) < 1e-9);
        const ok = signOk && dotOk && boundOk;
        results[part.id] = {
          ok: ok,
          chosenSign: pickedSign,
          chosenDot: pickedDot,
          chosenBound: enteredBound,
          part: part,
        };

        signSlot.classList.add(signOk ? "reveal-ok" : "reveal-bad");
        if (boundInput) boundInput.classList.add(boundOk ? "reveal-ok" : "reveal-bad");
        card.classList.add(ok ? "sf-card-ok" : "sf-card-bad");

        if (ok) {
          feedback.className = "sf-feedback ok sf-pop";
          feedback.textContent = "\u2713 Correct";
          nlLbl.textContent = "Your number line";
          nlAnswer.className = "sf-nl-answer ok sf-pop";
          nlAnswer.innerHTML = "";
          const ansTex = document.createElement("span");
          km(ansTex, part.answerTex);
          nlAnswer.appendChild(ansTex);
          nlBoard.classList.add("answer-ok", "sf-board-pulse");
          paintBoard("correct");
        } else {
          const bits = [];
          if (!boundOk) bits.push("boundary value");
          if (!signOk) bits.push("sign");
          if (!dotOk) bits.push("dot type");
          const msg = bits.length === 1
            ? bits[0].charAt(0).toUpperCase() + bits[0].slice(1) + " is incorrect"
            : bits.join(", ") + " need fixing";
          feedback.className = "sf-feedback bad sf-pop";
          feedback.innerHTML = "";
          const msgEl = document.createElement("div");
          msgEl.textContent = "\u2717 " + msg;
          feedback.appendChild(msgEl);

          const cmp = document.createElement("div");
          cmp.className = "sf-compare";
          const yours = document.createElement("div");
          yours.className = "sf-compare-yours";
          yours.innerHTML = "<span class=\"sf-compare-lbl\">Yours</span> ";
          const yoursTex = document.createElement("span");
          km(yoursTex, chosenAnswerTex(pickedSign, enteredBound != null ? enteredBound : 0));
          yours.appendChild(yoursTex);
          const corr = document.createElement("div");
          corr.className = "sf-compare-ok";
          corr.innerHTML = "<span class=\"sf-compare-lbl\">Correct</span> ";
          const corrTex = document.createElement("span");
          km(corrTex, part.answerTex);
          corr.appendChild(corrTex);
          cmp.appendChild(yours);
          cmp.appendChild(corr);
          feedback.appendChild(cmp);

          nlLbl.textContent = "Correct number line";
          nlAnswer.className = "sf-nl-answer sf-pop";
          nlAnswer.innerHTML = "";
          const ansTex = document.createElement("span");
          km(ansTex, part.answerTex);
          nlAnswer.appendChild(ansTex);
          nlBoard.classList.add("answer-bad", "sf-board-pulse");
          paintBoard("answer");
        }

        nextBtn.classList.remove("hidden");
        nextBtn.classList.add("sf-pop");
        renderProgress(progress, false);
        postToolsHeight();
      });
    }

    function reset() {
      scrollToolsTop();
      deck = buildDeck();
      idx = 0;
      for (const k in results) delete results[k];
      renderCard();
      // Shrink iframe back after a tall review page.
      postToolsHeight();
      setTimeout(postToolsHeight, 100);
      setTimeout(postToolsHeight, 350);
    }

    renderCard();
  }

  function initTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = {
      slides: document.getElementById("panel-slides"),
      tools: document.getElementById("panel-tools"),
      game: document.getElementById("panel-game"),
      summary: document.getElementById("panel-summary"),
      quiz: document.getElementById("panel-quiz"),
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      for (const k in panels) if (panels[k]) panels[k].classList.toggle("hidden", k !== t.dataset.tab);
      if (t.dataset.tab === "game" && window.IneqGame) requestAnimationFrame(window.IneqGame.onShow);
    }));
  }

  function initDecks() {
    const frame = document.getElementById("deck-frame");
    const btns = document.querySelectorAll("[data-deck]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("active", x === b));
      frame.src = b.dataset.deck;
    }));
    if (window.KOCDeckTouch) window.KOCDeckTouch.initDeckTouchNav(frame);
  }

  function applyDeepLink() {
    const q = new URLSearchParams(location.search);
    const tab = q.get("tab"), deck = q.get("deck"), style = q.get("style"), game = q.get("game");
    if (tab) { const b = document.querySelector(`[data-tab="${tab}"]`); if (b) b.click(); }
    if (deck) { const b = document.querySelector(`[data-deck*="/${deck}/"]`); if (b) b.click(); }
    if (game === "doors" || game === "matchup") {
      if (!tab) {
        const gameTab = document.querySelector('[data-tab="game"]');
        if (gameTab) gameTab.click();
      }
    }
    if (style && /^style-[1-3]$/.test(style)) {
      if (!tab) {
        const summaryTab = document.querySelector('[data-tab="summary"]');
        if (summaryTab) summaryTab.click();
      }
      const chip = document.querySelector(`[data-summary-style="${style}"]`);
      if (chip) chip.click();
    }
  }

  function initSummaryStyles() {
    const sets = document.querySelectorAll("#summary-stage .summary-set");
    const styleChips = document.querySelectorAll("[data-summary-style]");
    if (!sets.length || !styleChips.length) return;

    let styleId = "style-1";

    function setStyle(id) {
      styleId = id;
      styleChips.forEach((c) => c.classList.toggle("active", c.dataset.summaryStyle === id));
      sets.forEach((s) => s.classList.toggle("hidden", s.dataset.summarySet !== id));
    }

    styleChips.forEach((c) => {
      c.addEventListener("click", () => setStyle(c.dataset.summaryStyle));
    });

    setStyle(styleId);
  }

  function start() {
    if (window.KOCDeckTouch) {
      window.KOCDeckTouch.initTabletClass();
      window.KOCDeckTouch.initTabletMode();
    }
    initTabs(); initDecks(); initSignFlipTool(); initSummaryStyles(); applyDeepLink();
  }
  if (window.katex) window.addEventListener("DOMContentLoaded", start);
  else window.addEventListener("DOMContentLoaded", () => {
    (function wait() { if (window.katex) start(); else setTimeout(wait, 30); })();
  });
})();
