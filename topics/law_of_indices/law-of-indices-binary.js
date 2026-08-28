/* JM24 Binary lab — interactive base-2 tool (separate from powers lab) */
(function () {
  "use strict";

  const BIT_COUNT = 10;
  const MATCH_BIT_COUNT = 9;

  function ri(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function denaryToBinaryString(n) {
    if (n === 0) return "0";
    let s = "";
    while (n > 0) {
      s = (n % 2) + s;
      n = Math.floor(n / 2);
    }
    return s;
  }

  function bitsToDenary(bits) {
    let n = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) n += Math.pow(2, bits.length - 1 - i);
    }
    return n;
  }

  function bitsToBinaryString(bits) {
    return bits.map(String).join("");
  }

  function bitsToBinaryStringTrimmed(bits) {
    const trimmed = bitsToBinaryString(bits).replace(/^0+/, "");
    return trimmed || "0";
  }

  function expandedFormHtml(bits, base) {
    base = base || 2;
    const terms = [];
    for (let i = 0; i < bits.length; i++) {
      if (!bits[i]) continue;
      const exp = bits.length - 1 - i;
      terms.push("1 \\times " + base + "^{" + exp + "}");
    }
    if (!terms.length) return "\\(0\\)";
    return "\\(" + terms.join(" + ") + "\\)";
  }

  function divideBy2Steps(n) {
    const steps = [];
    let q = n;
    while (q > 0) {
      steps.push({ q: Math.floor(q / 2), r: q % 2, n: q });
      q = Math.floor(q / 2);
    }
    return steps;
  }

  function renderKatexIn(el) {
    if (window.renderMathInElement && el) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  function buildBitRow(container, bits, onChange, compact) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "bit-row" + (compact ? " compact" : "");
    bits.forEach(function (bit, i) {
      const col = document.createElement("div");
      col.className = "bit-col";
      const pv = document.createElement("span");
      pv.className = "bit-pv";
      pv.innerHTML = "\\(2^{" + (bits.length - 1 - i) + "}\\)";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bit-toggle" + (bit ? " on" : "");
      btn.setAttribute("aria-label", "Bit " + (bits.length - 1 - i));
      btn.innerHTML =
        '<span class="bit-bulb"></span><span class="bit-digit">' + bit + "</span>";
      btn.addEventListener("click", function () {
        bits[i] = bits[i] ? 0 : 1;
        btn.classList.toggle("on", !!bits[i]);
        btn.querySelector(".bit-digit").textContent = String(bits[i]);
        if (onChange) onChange(bits);
      });
      col.appendChild(pv);
      col.appendChild(btn);
      wrap.appendChild(col);
    });
    container.appendChild(wrap);
    renderKatexIn(container);
    return bits;
  }

  function updateBitReadout(bits, targets) {
    const den = bitsToDenary(bits);
    const binStr = bitsToBinaryStringTrimmed(bits);
    if (targets.binary) targets.binary.textContent = binStr + "(2)";
    if (targets.denary) targets.denary.innerHTML = "\\(= " + den + "_{(10)}\\)";
    if (targets.expanded) targets.expanded.innerHTML = expandedFormHtml(bits);
    if (targets.denary && targets.denary.parentElement) {
      renderKatexIn(targets.denary.parentElement);
    }
  }

  function ghostDrag(sourceEl, e, onMove, onDrop) {
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = sourceEl.innerHTML;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    ghost.style.left = sx + "px";
    ghost.style.top = sy + "px";
    document.body.appendChild(ghost);
    sourceEl.classList.add("dragging");

    function mv(ev) {
      if (Math.abs(ev.clientX - sx) > 4 || Math.abs(ev.clientY - sy) > 4) moved = true;
      ghost.style.left = ev.clientX + "px";
      ghost.style.top = ev.clientY + "px";
      if (onMove) onMove(ev, moved);
    }

    function cleanup() {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cn);
      ghost.remove();
      sourceEl.classList.remove("dragging");
    }

    function up(ev) {
      cleanup();
      onDrop(ev, moved);
    }

    function cn(ev) {
      cleanup();
      onDrop(ev, true);
    }

    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cn);
  }

  function slotUnder(ev) {
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    return el && el.closest ? el.closest(".sort-slot, .sort-pool") : null;
  }

  function genLadderNumber() {
    return ri(25, 380);
  }

  function genMatchTarget(recent) {
    let t;
    let tries = 0;
    do {
      t = ri(20, 450);
      tries++;
    } while (recent.indexOf(t) >= 0 && tries < 30);
    return t;
  }

  function genArithQuestion() {
    const isAdd = Math.random() < 0.5;
    let a = ri(25, 110);
    let b = ri(12, 75);
    if (!isAdd && b >= a) {
      const t = a;
      a = b + ri(5, 30);
      b = t;
    }
    const binA = denaryToBinaryString(a);
    const binB = denaryToBinaryString(b);
    const answer = isAdd ? a + b : a - b;
    const opSym = isAdd ? "+" : "-";
    return {
      isAdd: isAdd,
      a: a,
      b: b,
      binA: binA,
      binB: binB,
      answer: answer,
      qHtml: "\\(" + binA + "_{(2)} " + opSym + " " + binB + "_{(2)}\\)",
      stepsHtml:
        "\\(" +
        binA +
        "_{(2)}=" +
        a +
        "\\), \\(" +
        binB +
        "_{(2)}=" +
        b +
        "\\), \\(" +
        a +
        opSym +
        b +
        "=" +
        answer +
        "_{(10)}\\)",
      formula: a + " " + opSym + " " + b + " = " + answer + "_{(10)}",
    };
  }

  function genOrderQuestion() {
    const values = [];
    while (values.length < 3) {
      const v = ri(18, 115);
      if (values.indexOf(v) >= 0) continue;
      values.push(v);
    }
    const sorted = values.slice().sort(function (a, b) {
      return a - b;
    });
    const binaryCount = ri(1, 2);
    const binaryIdx = shuffle([0, 1, 2]).slice(0, binaryCount);
    const cards = values.map(function (v, i) {
      const asBinary = binaryIdx.indexOf(i) >= 0;
      return {
        id: "c" + i + "_" + v + "_" + Date.now(),
        value: v,
        asBinary: asBinary,
        label: asBinary
          ? "\\(" + denaryToBinaryString(v) + "_{(2)}\\)"
          : "\\(" + v + "_{(10)}\\)",
        denaryLabel: "\\(" + v + "_{(10)}\\)",
        binaryLabel: "\\(" + denaryToBinaryString(v) + "_{(2)}\\)",
      };
    });
    shuffle(cards);
    return { cards: cards, sorted: sorted };
  }

  function initBinaryLab() {
    const root = document.getElementById("lab-binary");
    if (!root) return;

    if (window.initStepper) window.initStepper("binary-intro");

    const playBits = new Array(BIT_COUNT).fill(0);
    playBits[BIT_COUNT - 1] = 1;
    const playRow = document.getElementById("bin-play-row");
    const readBinary = document.getElementById("bin-read-binary");
    const readDenary = document.getElementById("bin-read-denary");
    const readExpanded = document.getElementById("bin-read-expanded");

    function syncPlay() {
      updateBitReadout(playBits, {
        binary: readBinary,
        denary: readDenary,
        expanded: readExpanded,
      });
    }

    buildBitRow(playRow, playBits, syncPlay);
    syncPlay();

    document.getElementById("bin-random").addEventListener("click", function () {
      for (let i = 0; i < playBits.length; i++) {
        playBits[i] = Math.random() < 0.45 ? 1 : 0;
      }
      buildBitRow(playRow, playBits, syncPlay);
      syncPlay();
    });

    document.getElementById("bin-clear").addEventListener("click", function () {
      playBits.fill(0);
      buildBitRow(playRow, playBits, syncPlay);
      syncPlay();
    });

    let ladderN = genLadderNumber();
    let ladderStep = 0;
    let ladderDigits = [];
    const ladderTarget = document.getElementById("bin-ladder-target");
    const ladderSteps = document.getElementById("bin-ladder-steps");
    const ladderDigitsEl = document.getElementById("bin-ladder-digits");
    const fbLadder = document.getElementById("fb-bin-ladder");
    const formulaLadder = document.getElementById("formula-bin-ladder");

    function syncLadderRemainders() {
      if (!ladderDigits.length) {
        ladderDigitsEl.textContent = "—";
        return;
      }
      const bin = ladderDigits.slice().reverse().join("");
      ladderDigitsEl.innerHTML = "\\(" + bin + "_{(2)}\\)";
      renderKatexIn(ladderDigitsEl);
    }

    function finishLadder() {
      const expected = denaryToBinaryString(ladderN);
      fbLadder.className = "feedback ok";
      fbLadder.innerHTML =
        "Done — \\(" + ladderN + "_{(10)} = " + expected + "_{(2)}\\).";
      if (window.revealFormula) window.revealFormula("formula-bin-ladder");
      renderKatexIn(fbLadder);
    }

    function resetLadder() {
      ladderN = genLadderNumber();
      ladderStep = 0;
      ladderDigits = [];
      ladderTarget.innerHTML = "\\(" + ladderN + "_{(10)}\\)";
      ladderSteps.innerHTML = "";
      syncLadderRemainders();
      fbLadder.className = "feedback";
      fbLadder.textContent = "Click “Divide by 2” for each step. Stack remainders bottom-up.";
      formulaLadder.innerHTML =
        "\\[ " + ladderN + "_{(10)} = " + denaryToBinaryString(ladderN) + "_{(2)} \\]";
      if (window.lockFormula) window.lockFormula("formula-bin-ladder");
      renderKatexIn(ladderTarget.parentElement);
    }

    document.getElementById("bin-ladder-step").addEventListener("click", function () {
      const steps = divideBy2Steps(ladderN);
      if (ladderStep >= steps.length) {
        fbLadder.className = "feedback warn";
        fbLadder.textContent = "Ladder complete.";
        return;
      }
      const s = steps[ladderStep];
      ladderDigits.push(s.r);
      const chip = document.createElement("span");
      chip.className = "ladder-step-chip";
      chip.innerHTML = "\\(" + s.n + "\\div2=" + s.q + "\\,\\text{...}\\," + s.r + "\\)";
      ladderSteps.appendChild(chip);
      renderKatexIn(chip);
      ladderStep++;
      syncLadderRemainders();
      if (ladderStep >= steps.length) {
        finishLadder();
      }
    });

    document.getElementById("bin-ladder-reset").addEventListener("click", resetLadder);
    resetLadder();

    let matchTarget = genMatchTarget([]);
    const recentMatch = [matchTarget];
    let matchStreak = 0;
    const matchBits = new Array(MATCH_BIT_COUNT).fill(0);
    const matchRow = document.getElementById("bin-match-row");
    const matchTargetEl = document.getElementById("bin-match-target");
    const fbMatch = document.getElementById("fb-bin-match");
    const formulaMatch = document.getElementById("formula-bin-match");

    function showMatchChallenge() {
      matchTargetEl.innerHTML = "\\(" + matchTarget + "_{(10)}\\)";
      matchBits.fill(0);
      buildBitRow(matchRow, matchBits);
      fbMatch.className = "feedback";
      fbMatch.textContent = "Flip bits to match the target, then Check.";
      formulaMatch.innerHTML =
        "\\[ " +
        matchTarget +
        "_{(10)} = " +
        denaryToBinaryString(matchTarget) +
        "_{(2)} \\]";
      if (window.lockFormula) window.lockFormula("formula-bin-match");
      renderKatexIn(matchTargetEl.parentElement);
    }

    function nextMatchTarget() {
      matchTarget = genMatchTarget(recentMatch);
      recentMatch.push(matchTarget);
      if (recentMatch.length > 12) recentMatch.shift();
    }

    document.getElementById("bin-match-check").addEventListener("click", function () {
      const got = bitsToDenary(matchBits);
      if (got === matchTarget) {
        matchStreak++;
        fbMatch.className = "feedback ok";
        fbMatch.innerHTML =
          "Correct — \\(" +
          matchTarget +
          "_{(10)} = " +
          denaryToBinaryString(matchTarget) +
          "_{(2)}\\). Streak: " +
          matchStreak +
          ".";
        if (window.revealFormula) window.revealFormula("formula-bin-match");
      } else {
        matchStreak = 0;
        fbMatch.className = "feedback bad";
        fbMatch.innerHTML =
          "Your bits give \\(" +
          got +
          "_{(10)}\\). Answer: \\(" +
          matchTarget +
          "_{(10)} = " +
          denaryToBinaryString(matchTarget) +
          "_{(2)}\\).";
      }
      renderKatexIn(fbMatch);
    });
    document.getElementById("bin-match-reset").addEventListener("click", function () {
      matchStreak = 0;
      nextMatchTarget();
      showMatchChallenge();
    });
    showMatchChallenge();

    let arithQ = genArithQuestion();
    const arithQEl = document.getElementById("bin-arith-q");
    const arithInput = document.getElementById("bin-arith-input");
    const fbArith = document.getElementById("fb-bin-arith");
    const formulaArith = document.getElementById("formula-bin-arith");

    function showArithQuestion() {
      arithQ = genArithQuestion();
      arithQEl.innerHTML = arithQ.qHtml;
      arithInput.value = "";
      fbArith.className = "feedback";
      fbArith.textContent = "Answer the question above.";
      formulaArith.innerHTML = "\\[ " + arithQ.formula + " \\]";
      if (window.lockFormula) window.lockFormula("formula-bin-arith");
      renderKatexIn(arithQEl.parentElement);
    }

    function showArithFeedback(ok) {
      fbArith.className = ok ? "feedback ok" : "feedback bad";
      fbArith.innerHTML =
        (ok ? "Correct — " : "Not quite — ") + arithQ.stepsHtml + ".";
      if (window.revealFormula) window.revealFormula("formula-bin-arith");
      renderKatexIn(fbArith);
    }

    document.getElementById("bin-arith-check").addEventListener("click", function () {
      const val = Number(arithInput.value);
      showArithFeedback(val === arithQ.answer);
    });
    document.getElementById("bin-arith-reset").addEventListener("click", showArithQuestion);
    showArithQuestion();

    let orderQ = genOrderQuestion();
    let orderPlacements = { pool: [], slots: [null, null, null] };
    const orderPool = document.getElementById("bin-order-pool");
    const orderSlotEls = document.querySelectorAll("#bin-order-slots .sort-slot");
    const fbOrder = document.getElementById("fb-bin-order");
    const formulaOrder = document.getElementById("formula-bin-order");

    function cardById(id) {
      return orderQ.cards.find(function (c) {
        return c.id === id;
      });
    }

    function makeSortCard(card) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort-card";
      btn.dataset.id = card.id;
      btn.innerHTML = card.label;
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        const originPool = orderPlacements.pool.slice();
        const originSlots = orderPlacements.slots.slice();
        ghostDrag(
          btn,
          e,
          function (ev) {
            document.querySelectorAll(".sort-slot.drag-over").forEach(function (n) {
              n.classList.remove("drag-over");
            });
            const hit = slotUnder(ev);
            if (hit && hit.classList.contains("sort-slot")) {
              hit.classList.add("drag-over");
            }
          },
          function (ev, moved) {
            document.querySelectorAll(".sort-slot.drag-over").forEach(function (n) {
              n.classList.remove("drag-over");
            });
            if (!moved) return;
            const hit = slotUnder(ev);
            const cardId = card.id;
            const fromSlotIdx = orderPlacements.slots.indexOf(cardId);
            let newPool = orderPlacements.pool.filter(function (id) {
              return id !== cardId;
            });
            let newSlots = orderPlacements.slots.map(function (id) {
              return id === cardId ? null : id;
            });
            if (hit && hit.classList.contains("sort-slot")) {
              const slotIdx = Number(hit.dataset.slot);
              if (fromSlotIdx === slotIdx) {
                orderPlacements.pool = originPool;
                orderPlacements.slots = originSlots;
                renderOrder();
                return;
              }
              const displaced = newSlots[slotIdx];
              newSlots[slotIdx] = cardId;
              if (displaced) {
                if (fromSlotIdx >= 0) {
                  newSlots[fromSlotIdx] = displaced;
                } else {
                  newPool.push(displaced);
                }
              }
            } else if (hit && hit.classList.contains("sort-pool")) {
              newPool.push(cardId);
            } else {
              orderPlacements.pool = originPool;
              orderPlacements.slots = originSlots;
              renderOrder();
              return;
            }
            orderPlacements.pool = newPool;
            orderPlacements.slots = newSlots;
            renderOrder();
          }
        );
      });
      return btn;
    }

    function renderOrder() {
      orderPool.innerHTML = "";
      orderSlotEls.forEach(function (slot, i) {
        slot.innerHTML = "";
        slot.classList.remove("drag-over");
        const id = orderPlacements.slots[i];
        if (id) {
          const card = cardById(id);
          if (card) slot.appendChild(makeSortCard(card));
        }
      });
      orderPlacements.pool.forEach(function (id) {
        const card = cardById(id);
        if (card) orderPool.appendChild(makeSortCard(card));
      });
      renderKatexIn(document.getElementById("bin-order-wrap"));
    }

    function resetOrderQuestion() {
      orderQ = genOrderQuestion();
      orderPlacements = {
        pool: orderQ.cards.map(function (c) {
          return c.id;
        }),
        slots: [null, null, null],
      };
      fbOrder.className = "feedback";
      fbOrder.textContent = "Drag cards into the slots left-to-right (smallest first).";
      formulaOrder.innerHTML = "\\[ " + orderQ.sorted.join(" < ") + " \\]";
      if (window.lockFormula) window.lockFormula("formula-bin-order");
      renderOrder();
    }

    document.getElementById("bin-order-check").addEventListener("click", function () {
      const values = orderPlacements.slots.map(function (id) {
        return id ? cardById(id).value : null;
      });
      const filled = values.every(function (v) {
        return v !== null;
      });
      const ok =
        filled &&
        values.every(function (v, i) {
          return v === orderQ.sorted[i];
        });
      const conversions = orderQ.cards
        .filter(function (c) {
          return c.asBinary;
        })
        .map(function (c) {
          return c.binaryLabel + "=" + c.denaryLabel;
        })
        .join(", ");
      const orderStr = "\\(" + orderQ.sorted.join(" < ") + "\\)";
      const steps = conversions
        ? conversions + " \\(\\Rightarrow\\) " + orderStr
        : orderStr;
      fbOrder.className = ok ? "feedback ok" : "feedback bad";
      fbOrder.innerHTML = (ok ? "Correct — " : "Answer — ") + steps + ".";
      if (window.revealFormula) window.revealFormula("formula-bin-order");
      renderKatexIn(fbOrder);
    });
    document.getElementById("bin-order-reset").addEventListener("click", resetOrderQuestion);
    resetOrderQuestion();

    renderKatexIn(root);
  }

  window.initBinaryLab = initBinaryLab;
})();
