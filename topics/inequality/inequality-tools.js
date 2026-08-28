/* Inequality  ETab 1 deck wiring + Tab 2 sign-flip flashcards.
 *
 * One card at a time: drag the correct inequality sign and hollow/filled dot
 * onto the answer and number line. After checking, wrong cards show the
 * correct diagram on the right; correct cards keep the student's figure.
 */
(function () {
  "use strict";

  /* Light-theme number line (matches Interactive Tools flashcard surfaces) */
  const ACC = "#0277BD", AXIS = "#9AA3AD", ZERO = "#5d544f", CARD_BG = "#ffffff";

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

  const PARTS = [
    { id: 1, startTex: "2x > 2", divideTex: "2", answerTex: "x > 1" },
    { id: 2, startTex: "2x > -2", divideTex: "2", answerTex: "x > -1" },
    { id: 3, startTex: "-2x > 2", divideTex: "-2", answerTex: "x < -1" },
    { id: 4, startTex: "-2x > -2", divideTex: "-2", answerTex: "x < 1" },
    { id: 5, startTex: "3x < 9", divideTex: "3", answerTex: "x < 3" },
    { id: 6, startTex: "-3x < 9", divideTex: "-3", answerTex: "x > -3" },
    { id: 7, startTex: "-4x \\ge 8", divideTex: "-4", answerTex: "x \\le -2" },
    { id: 8, startTex: "5x \\le -10", divideTex: "5", answerTex: "x \\le -2" },
  ];

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

  function dividePrompt(divideTex) {
    const d = divideTex.charAt(0) === "-" ? "\u2212" + divideTex.slice(1) : divideTex;
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

  function nlLayout(boundary) {
    const min = Math.floor(boundary) - 2;
    const max = Math.ceil(boundary) + 2;
    const span = max - min || 1;
    const mapX = (v) => 28 + ((v - min) / span) * 224;
    return { min, max, mapX, cx: mapX(boundary) };
  }

  /** dotFilled: null = dashed target, true/false = student or answer dot */
  function numberLineSVG(boundary, op, dotFilled) {
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

    const ray = dir
      ? `<line x1="${cx}" y1="${axisY}" x2="${cx}" y2="${dotY + dotR}" stroke="${ACC}" stroke-width="2.5"/>
         <line x1="${rayStart}" y1="${dotY}" x2="${lineEnd}" y2="${dotY}" stroke="${ACC}" stroke-width="5.5" stroke-linecap="butt"/>
         <path d="${head}" fill="${ACC}"/>`
      : "";

    let dotMark;
    if (dotFilled === null) {
      dotMark = `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="none" stroke="${AXIS}" stroke-width="2" stroke-dasharray="4 3"/>`;
    } else if (dotFilled) {
      dotMark = `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${ACC}"/>`;
    } else {
      dotMark = `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${CARD_BG}" stroke="${ACC}" stroke-width="3.5"/>`;
    }

    return `<svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" role="img">
      <line x1="20" y1="${axisY}" x2="260" y2="${axisY}" stroke="${AXIS}" stroke-width="2.5"/>
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

    let order = shuffled(PARTS.map((p) => p.id));
    let idx = 0;
    const results = {};

    function scoreCount() {
      return Object.values(results).filter(Boolean).length;
    }

    function renderProgress(el, done) {
      const answered = Object.keys(results).length;
      const correct = scoreCount();
      el.className = "sf-progress" + (done ? " done" : "");
      if (done) {
        el.textContent = "Complete \u2014 " + correct + " / " + PARTS.length + " correct";
      } else {
        el.textContent = "Card " + (idx + 1) + " of " + PARTS.length
          + (answered ? " \u00b7 " + correct + " correct so far" : "");
      }
      const fill = el.nextElementSibling;
      if (fill && fill.classList.contains("sf-progress-fill")) {
        fill.style.width = (done ? 100 : ((idx + (results[order[idx]] != null ? 1 : 0)) / PARTS.length) * 100) + "%";
      }
    }

    function showDone() {
      root.innerHTML = "";
      const deck = document.createElement("div");
      deck.className = "sf-deck";

      const progress = document.createElement("div");
      progress.className = "sf-progress done";
      const correct = scoreCount();
      progress.textContent = "Complete \u2014 " + correct + " / " + PARTS.length + " correct";
      deck.appendChild(progress);

      const track = document.createElement("div");
      track.className = "sf-progress-track";
      track.innerHTML = '<div class="sf-progress-fill" style="width:100%"></div>';
      deck.appendChild(track);

      const done = document.createElement("div");
      done.className = "sf-done";
      done.innerHTML = correct === PARTS.length
        ? "<b>Perfect!</b> You matched every sign and dot type."
        : "You scored <b>" + correct + " / " + PARTS.length + "</b>. Remember: \u2265 / \u2264 use a filled dot; &gt; / &lt; use a hollow dot.";
      deck.appendChild(done);

      const nav = document.createElement("div");
      nav.className = "sf-nav";
      const again = document.createElement("button");
      again.type = "button";
      again.className = "sf-nav-btn";
      again.textContent = "Try again";
      again.addEventListener("click", reset);
      nav.appendChild(again);
      deck.appendChild(nav);

      root.appendChild(deck);
    }

    function renderCard() {
      if (idx >= PARTS.length) { showDone(); return; }

      const part = PARTS.find((p) => p.id === order[idx]);
      const correct = parseAnswerTex(part.answerTex);
      if (!correct) return;

      root.innerHTML = "";
      let pickedSign = null;
      let pickedDot = null;
      let locked = false;

      const deck = document.createElement("div");
      deck.className = "sf-deck";

      const progress = document.createElement("div");
      progress.className = "sf-progress";
      deck.appendChild(progress);

      const track = document.createElement("div");
      track.className = "sf-progress-track";
      track.innerHTML = '<div class="sf-progress-fill"></div>';
      deck.appendChild(track);
      renderProgress(progress, false);

      const card = document.createElement("article");
      card.className = "sf-card";

      const cardTop = document.createElement("div");
      cardTop.className = "sf-card-top";

      const head = document.createElement("div");
      head.className = "sf-head";
      head.textContent = "Flashcard " + (idx + 1);
      cardTop.appendChild(head);

      const prompt = document.createElement("p");
      prompt.className = "sf-prompt";
      prompt.textContent = dividePrompt(part.divideTex);
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

      const valSpan = document.createElement("span");
      valSpan.className = "sf-build-val";
      km(valSpan, boundaryTex(correct.boundary));
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
      nlLbl.textContent = "Number line \u2014 drag hollow or filled onto the dot";
      nlSection.appendChild(nlLbl);

      const nlAnswer = document.createElement("p");
      nlAnswer.className = "sf-nl-answer hidden";
      nlSection.appendChild(nlAnswer);

      const nlBoard = document.createElement("div");
      nlBoard.className = "sf-nl-board drop-target";
      nlBoard.innerHTML = numberLineSVG(correct.boundary, null, null);
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

      deck.appendChild(card);

      const nav = document.createElement("div");
      nav.className = "sf-nav";
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "sf-nav-btn hidden";
      nextBtn.textContent = idx === PARTS.length - 1 ? "See results" : "Next card";
      nextBtn.addEventListener("click", () => { idx++; renderCard(); });
      nav.appendChild(nextBtn);
      deck.appendChild(nav);

      root.appendChild(deck);

      function dotFilledValue() {
        if (pickedDot === "filled") return true;
        if (pickedDot === "hollow") return false;
        return null;
      }

      function paintBoard(showAnswer) {
        nlBoard.querySelector("svg")?.remove();
        if (showAnswer) {
          nlBoard.insertAdjacentHTML("afterbegin", numberLineSVG(correct.boundary, correct.op, correct.filled));
        } else {
          nlBoard.insertAdjacentHTML("afterbegin", numberLineSVG(correct.boundary, pickedSign, dotFilledValue()));
        }
      }

      function updatePreview() {
        paintBoard(false);
        checkBtn.disabled = !(pickedSign && pickedDot) || locked;
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

      checkBtn.addEventListener("click", () => {
        if (locked || !pickedSign || !pickedDot) return;
        locked = true;
        checkBtn.disabled = true;
        signChips.forEach((c) => { c.draggable = false; c.style.pointerEvents = "none"; });
        dotChips.forEach((c) => { c.draggable = false; c.style.pointerEvents = "none"; });
        signBankWrap.classList.add("hidden");
        dotBankWrap.classList.add("hidden");
        nlBoard.classList.remove("drop-target", "drag-over");

        const signOk = pickedSign === correct.op;
        const dotOk = (pickedDot === "filled") === correct.filled;
        const ok = signOk && dotOk;
        results[part.id] = ok;

        signSlot.classList.add(signOk ? "reveal-ok" : "reveal-bad");

        if (ok) {
          feedback.className = "sf-feedback ok";
          feedback.textContent = "\u2713 Correct";
          nlLbl.textContent = "Your number line";
          nlAnswer.className = "sf-nl-answer ok hidden";
          nlBoard.classList.add("answer-ok");
          paintBoard(false);
        } else {
          let msg = "Sign and dot type need fixing";
          if (!signOk && dotOk) msg = "Sign is incorrect";
          else if (signOk && !dotOk) msg = "Dot type is incorrect";
          feedback.className = "sf-feedback bad";
          feedback.textContent = "\u2717 " + msg;

          nlLbl.textContent = "Correct answer";
          nlAnswer.className = "sf-nl-answer";
          nlAnswer.innerHTML = "";
          const ansTex = document.createElement("span");
          km(ansTex, part.answerTex);
          nlAnswer.appendChild(ansTex);
          nlBoard.classList.add("answer-bad");
          paintBoard(true);
        }

        nextBtn.classList.remove("hidden");
        renderProgress(progress, false);
      });
    }

    function reset() {
      order = shuffled(PARTS.map((p) => p.id));
      idx = 0;
      for (const k in results) delete results[k];
      renderCard();
    }

    renderCard();
  }

  function initTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = {
      slides: document.getElementById("panel-slides"),
      tools: document.getElementById("panel-tools"),
      game: document.getElementById("panel-game"),
      comics: document.getElementById("panel-comics"),
      summary: document.getElementById("panel-summary"),
      quiz: document.getElementById("panel-quiz"),
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      for (const k in panels) if (panels[k]) panels[k].classList.toggle("hidden", k !== t.dataset.tab);
      if (t.dataset.tab === "game" && window.IneqGame) requestAnimationFrame(window.IneqGame.onShow);
      if (t.dataset.tab === "comics" && window.ComicsMount && !window.__jm26ComicsReady) {
        window.ComicsMount.init("jm26-comics-root", {
          intro: "Inequalities I manga — tap a chapter to open the reader.",
        });
        window.__jm26ComicsReady = true;
      }
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
