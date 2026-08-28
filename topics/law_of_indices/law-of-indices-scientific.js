/* JM24 Scientific notation lab */
(function () {
  "use strict";

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

  /** @returns {{ mantissa: number, exp: number, value: number }} */
  function toScientific(value) {
    if (value === 0) return { mantissa: 0, exp: 0, value: 0 };
    const sign = value < 0 ? -1 : 1;
    let v = Math.abs(value);
    let exp = 0;
    while (v >= 10) {
      v /= 10;
      exp++;
    }
    while (v > 0 && v < 1) {
      v *= 10;
      exp--;
    }
    const mantissa = Math.round(sign * v * 1e9) / 1e9;
    return { mantissa: mantissa, exp: exp, value: value };
  }

  function sciValue(m, e) {
    return m * Math.pow(10, e);
  }

  function formatOrdinary(n) {
    if (Math.abs(n) >= 1e6 || (Math.abs(n) > 0 && Math.abs(n) < 0.001)) {
      return n.toExponential(4).replace("e+", " × 10^").replace("e-", " × 10^{-") + (String(n).includes("e-") ? "}" : "");
    }
    const s = String(n);
    if (s.includes("e")) return s;
    return s;
  }

  function formatOrdinaryDisplay(n) {
    if (!isFinite(n)) return String(n);
    if (Math.abs(n) >= 1 && Math.abs(n) < 1e12 && Math.abs(n) >= 1e-6) {
      return n.toLocaleString("en-US", { maximumFractionDigits: 12 });
    }
    const parts = n.toExponential(6).split("e");
    const mant = parts[0];
    const exp = Number(parts[1]);
    return mant + " × 10^" + exp;
  }

  function sciTex(m, e) {
    const em = e < 0 ? "10^{" + e + "}" : "10^{" + e + "}";
    return m + " \\times " + em;
  }

  function nearlyEqual(a, b, tol) {
    return Math.abs(a - b) <= (tol || 1e-6) * Math.max(1, Math.abs(b));
  }

  function normalizeSciInput(m, e) {
    if (m === 0) return { mantissa: 0, exp: 0 };
    return toScientific(sciValue(m, e));
  }

  const CONVERT_POOL = [
    { n: 102000000, hint: "large" },
    { n: 243000, hint: "large" },
    { n: 9410000000, hint: "large" },
    { n: 16.033, hint: "medium" },
    { n: 0.000504, hint: "small" },
    { n: 0.000562, hint: "small" },
    { n: 3.08e-11, hint: "small" },
    { n: 1.4e-15, hint: "small" },
  ];

  const ARITH_POOL = [
    { tex: "(4.5\\times10^{3})\\times(2\\times10^{8})", m1: 4.5, e1: 3, m2: 2, e2: 8, op: "×" },
    { tex: "4\\times10^{9}\\div(2\\times10^{2})", m1: 4, e1: 9, m2: 2, e2: 2, op: "÷" },
    { tex: "3\\times10^{9}\\div(3\\times10^{-2})", m1: 3, e1: 9, m2: 3, e2: -2, op: "÷" },
    { tex: "(2.5\\times10^{3})\\times(3\\times10^{-8})", m1: 2.5, e1: 3, m2: 3, e2: -8, op: "×" },
    { tex: "4.5\\times10^{3}\\div(2\\times10^{8})", m1: 4.5, e1: 3, m2: 2, e2: 8, op: "÷" },
    { tex: "93\\times10^{3}\\div(6\\times10^{-8})", m1: 93, e1: 3, m2: 6, e2: -8, op: "÷" },
  ];

  const SORT_SETS = [
    {
      cards: [
        { label: "\\(95\\times10^{2}\\)", m: 95, e: 2 },
        { label: "\\(0.0756\\times10^{5}\\)", m: 0.0756, e: 5 },
        { label: "\\(0.0003595\\times10^{6}\\)", m: 0.0003595, e: 6 },
        { label: "\\(95\\,320\\)", m: 95320, e: 0, raw: 95320 },
      ],
      asc: true,
    },
    {
      cards: [
        { label: "\\(0.59\\times10^{-3}\\)", m: 0.59, e: -3 },
        { label: "\\(418\\times10^{-7}\\)", m: 418, e: -7 },
        { label: "\\(0.0461\\times10^{-4}\\)", m: 0.0461, e: -4 },
        { label: "\\(0.003246\\times10^{-2}\\)", m: 0.003246, e: -2 },
      ],
      asc: false,
    },
  ];

  function cardValue(c) {
    if (c.raw != null) return c.raw;
    return sciValue(c.m, c.e);
  }

  function sortedOrder(cards, asc) {
    const vals = cards.map(cardValue).slice().sort(function (a, b) {
      return asc ? a - b : b - a;
    });
    return vals;
  }

  let shiftState = null;
  let convertIdx = 0;
  let arithIdx = 0;
  let sortSetIdx = 0;
  let sortActiveSet = 0;
  let sortSlots = [null, null, null, null];
  let sortPool = [];

  function buildDigitDisplay(container, digits, decPos) {
    container.innerHTML = "";
    const row = document.createElement("div");
    row.className = "sci-digit-row";
    digits.forEach(function (ch, i) {
      if (i === decPos) {
        const dot = document.createElement("span");
        dot.className = "sci-decimal";
        dot.textContent = ".";
        row.appendChild(dot);
      }
      const span = document.createElement("span");
      span.className = "sci-digit" + (i === decPos - 1 || (decPos === 0 && i === 0) ? " sci-digit-mantissa" : "");
      span.textContent = ch;
      row.appendChild(span);
    });
    if (decPos === digits.length) {
      const dot = document.createElement("span");
      dot.className = "sci-decimal";
      dot.textContent = ".";
      row.appendChild(dot);
    }
    container.appendChild(row);
  }

  function digitsFromNumber(n) {
    let s = String(n);
    if (s.includes("e")) {
      s = n.toFixed(20).replace(/\.?0+$/, "");
    }
    s = s.replace(/,/g, "");
    const parts = s.split(".");
    const intPart = parts[0].replace("-", "");
    const fracPart = parts[1] || "";
    const digits = (intPart + fracPart).split("");
    const decPos = intPart.length;
    return { digits: digits, decPos: decPos, negative: n < 0 };
  }

  function trimDigits(digits, decPos) {
    while (digits.length > 1 && digits[0] === "0" && decPos > 1) {
      digits.shift();
      decPos--;
    }
    while (digits.length > 1 && digits[digits.length - 1] === "0" && decPos < digits.length) {
      digits.pop();
    }
    return decPos;
  }

  function digitsToNumber(digits, decPos, expShift) {
    const intPart = digits.slice(0, decPos).join("") || "0";
    const fracPart = digits.slice(decPos).join("");
    let n = Number(intPart + (fracPart ? "." + fracPart : ""));
    if (expShift !== 0) n *= Math.pow(10, expShift);
    return n;
  }

  function resetShiftQuestion() {
    const item = CONVERT_POOL[convertIdx % CONVERT_POOL.length];
    convertIdx++;
    const parsed = digitsFromNumber(item.n);
    parsed.decPos = trimDigits(parsed.digits, parsed.decPos);
    const sci = toScientific(item.n);
    shiftState = {
      value: item.n,
      digits: parsed.digits,
      decPos: parsed.decPos,
      expShift: 0,
      target: sci,
    };
    const targetEl = document.getElementById("sci-shift-target");
    if (targetEl) {
      targetEl.innerHTML = "Convert: <strong>" + formatOrdinaryDisplay(item.n) + "</strong>";
    }
    renderShiftDisplay();
    const fb = document.getElementById("fb-sci-shift");
    fb.className = "feedback";
    fb.textContent = "Move the decimal until you have one non-zero digit before the point.";
    lockFormula("formula-sci-shift");
    document.getElementById("sci-shift-left").disabled = false;
    document.getElementById("sci-shift-right").disabled = false;
  }

  function updateShiftPower(exp) {
    const el = document.getElementById("sci-shift-power");
    if (!el) return;
    el.innerHTML = "Power: \\(10^{" + exp + "}\\)";
    renderKatexIn(el);
  }

  function renderShiftDisplay() {
    if (!shiftState) return;
    const display = document.getElementById("sci-shift-display");
    buildDigitDisplay(display, shiftState.digits, shiftState.decPos);
    updateShiftPower(shiftState.expShift);
    const m = digitsToNumber(shiftState.digits, shiftState.decPos, 0);
    const preview = document.getElementById("sci-shift-preview");
    if (preview) {
      preview.innerHTML = "\\(" + m + " \\times 10^{" + shiftState.expShift + "}\\)";
      renderKatexIn(preview);
    }
  }

  function shiftDecimal(dir) {
    if (!shiftState) return;
    const s = shiftState;
    if (dir < 0) {
      if (s.decPos <= 0) return;
      s.decPos--;
      s.expShift++;
    } else {
      if (s.decPos >= s.digits.length) return;
      s.decPos++;
      s.expShift--;
    }
    renderShiftDisplay();
  }

  function checkShift() {
    const fb = document.getElementById("fb-sci-shift");
    if (!shiftState) return;
    const m = digitsToNumber(shiftState.digits, shiftState.decPos, 0);
    const e = shiftState.expShift;
    const norm = normalizeSciInput(m, e);
    const okM = nearlyEqual(norm.mantissa, shiftState.target.mantissa, 1e-4);
    const okE = norm.exp === shiftState.target.exp;
    const okRange = Math.abs(m) >= 1 && Math.abs(m) < 10;
    if (okM && okE && (shiftState.target.mantissa === 0 || okRange)) {
      fb.className = "feedback ok";
      fb.innerHTML =
        "Correct — \\(" + formatOrdinaryDisplay(shiftState.value) + " = " +
        sciTex(norm.mantissa, norm.exp) + "\\).";
      revealFormula("formula-sci-shift", sciTex(norm.mantissa, norm.exp));
    } else if (!okRange && shiftState.target.mantissa !== 0) {
      fb.className = "feedback bad";
      fb.innerHTML = "The coefficient must satisfy \\(1 \\le a < 10\\). Keep shifting the decimal.";
    } else {
      fb.className = "feedback bad";
      fb.innerHTML = "Not yet — check the coefficient and the power of \\(10\\).";
    }
    renderKatexIn(fb);
  }

  function revealFormula(id, tex) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("formula-locked");
    el.innerHTML = "\\[ " + tex + " \\]";
    renderKatexIn(el);
  }

  function lockFormula(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("formula-locked");
  }

  function resetConvertQuiz() {
    const item = CONVERT_POOL[ri(0, CONVERT_POOL.length - 1)];
    const mode = Math.random() < 0.5 ? "toSci" : "fromSci";
    const sci = toScientific(item.n);
    window._sciConvertQuiz = { mode: mode, n: item.n, sci: sci };
    const q = document.getElementById("sci-convert-q");
    const fields = document.getElementById("sci-convert-fields");
    if (mode === "toSci") {
      q.innerHTML = "Write <strong>" + formatOrdinaryDisplay(item.n) + "</strong> in scientific notation.";
      fields.innerHTML =
        '<label>a = <input id="sci-cv-a" type="number" step="any"></label>' +
        '<label>× 10<sup>n</sup>, n = <input id="sci-cv-n" type="number" step="1"></label>';
    } else {
      q.innerHTML =
        "Write \\(" + sciTex(sci.mantissa, sci.exp) + "\\) as an ordinary number.";
      fields.innerHTML =
        '<label>Answer: <input id="sci-cv-val" type="number" step="any" style="width:min(220px,100%)"></label>';
      renderKatexIn(q);
    }
    const fb = document.getElementById("fb-sci-convert");
    fb.className = "feedback";
    fb.textContent = "Enter your answer, then Check.";
    lockFormula("formula-sci-convert");
  }

  function checkConvertQuiz() {
    const fb = document.getElementById("fb-sci-convert");
    const q = window._sciConvertQuiz;
    if (!q) return;
    if (q.mode === "toSci") {
      const a = Number(document.getElementById("sci-cv-a").value);
      const n = Number(document.getElementById("sci-cv-n").value);
      const norm = normalizeSciInput(a, n);
      if (nearlyEqual(sciValue(norm.mantissa, norm.exp), q.n, 1e-3)) {
        fb.className = "feedback ok";
        fb.innerHTML = "Correct — \\(" + sciTex(norm.mantissa, norm.exp) + "\\).";
        revealFormula("formula-sci-convert", sciTex(norm.mantissa, norm.exp));
      } else {
        fb.className = "feedback bad";
        fb.textContent = "Check: is \\(1 \\le a < 10\\)? Does \\(a \\times 10^n\\) equal the original number?";
        renderKatexIn(fb);
      }
    } else {
      const val = Number(document.getElementById("sci-cv-val").value);
      if (nearlyEqual(val, q.n, Math.max(1, Math.abs(q.n) * 1e-6))) {
        fb.className = "feedback ok";
        fb.innerHTML = "Correct — \\(" + formatOrdinaryDisplay(q.n) + "\\).";
        revealFormula("formula-sci-convert", sciTex(q.sci.mantissa, q.sci.exp) + " = " + q.n);
      } else {
        fb.className = "feedback bad";
        fb.textContent = "Expand the power of 10 — multiply the coefficient by \\(10^n\\).";
        renderKatexIn(fb);
      }
    }
    renderKatexIn(fb);
  }

  function resetArith() {
    const item = ARITH_POOL[arithIdx % ARITH_POOL.length];
    arithIdx++;
    window._sciArith = item;
    const ansM = item.op === "×" ? item.m1 * item.m2 : item.m1 / item.m2;
    const ansE = item.op === "×" ? item.e1 + item.e2 : item.e1 - item.e2;
    window._sciArithAnswer = normalizeSciInput(ansM, ansE);
    document.getElementById("sci-arith-q").innerHTML = "\\(" + item.tex + "\\)";
    renderKatexIn(document.getElementById("sci-arith-q"));
    document.getElementById("sci-arith-a").value = "";
    document.getElementById("sci-arith-n").value = "";
    const fb = document.getElementById("fb-sci-arith");
    fb.className = "feedback";
    fb.innerHTML = item.op === "×"
      ? "Multiply: add the indices. \\((a\\times10^m)(b\\times10^n)=ab\\times10^{m+n}\\)."
      : "Divide: subtract the indices. \\(\\dfrac{a\\times10^m}{b\\times10^n}=\\dfrac{a}{b}\\times10^{m-n}\\).";
    renderKatexIn(fb);
    lockFormula("formula-sci-arith");
  }

  function checkArith() {
    const fb = document.getElementById("fb-sci-arith");
    const ans = window._sciArithAnswer;
    const a = Number(document.getElementById("sci-arith-a").value);
    const n = Number(document.getElementById("sci-arith-n").value);
    const norm = normalizeSciInput(a, n);
    if (nearlyEqual(norm.mantissa, ans.mantissa, 1e-3) && norm.exp === ans.exp) {
      fb.className = "feedback ok";
      fb.innerHTML = "Correct — \\(" + sciTex(norm.mantissa, norm.exp) + "\\).";
      revealFormula("formula-sci-arith", sciTex(norm.mantissa, norm.exp));
    } else if (nearlyEqual(sciValue(a, n), sciValue(ans.mantissa, ans.exp), 1e-2)) {
      fb.className = "feedback warn";
      fb.innerHTML = "Value is right, but write in standard form: \\(1 \\le a < 10\\). Try \\(" +
        sciTex(ans.mantissa, ans.exp) + "\\).";
      revealFormula("formula-sci-arith", sciTex(ans.mantissa, ans.exp));
    } else {
      fb.className = "feedback bad";
      fb.textContent = "Combine coefficients, then add or subtract the indices.";
    }
    renderKatexIn(fb);
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

  function makeSortCard(card, idx) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sort-card";
    btn.dataset.idx = String(idx);
    btn.innerHTML = card.label;
    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      ghostDrag(btn, e, function (ev, moved) {
        document.querySelectorAll(".sort-slot").forEach(function (s) {
          s.classList.toggle("drag-over", slotUnder(ev) === s);
        });
      }, function (ev, moved) {
        document.querySelectorAll(".sort-slot").forEach(function (s) {
          s.classList.remove("drag-over");
        });
        if (!moved) return;
        const target = slotUnder(ev);
        if (!target) return;
        if (target.classList.contains("sort-pool")) {
          sortSlots = sortSlots.map(function (x) {
            return x === idx ? null : x;
          });
        } else if (target.classList.contains("sort-slot")) {
          const slot = Number(target.dataset.slot);
          sortSlots.forEach(function (x, i) {
            if (x === idx) sortSlots[i] = null;
          });
          if (sortSlots[slot] != null && sortSlots[slot] !== idx) {
            sortPool.push(sortSlots[slot]);
          }
          sortSlots[slot] = idx;
          sortPool = sortPool.filter(function (x) {
            return sortSlots.indexOf(x) < 0;
          });
        }
        renderSortUI();
      });
    });
    return btn;
  }

  function renderSortUI() {
    const set = SORT_SETS[sortActiveSet];
    const poolEl = document.getElementById("sci-sort-pool");
    const slotsEl = document.getElementById("sci-sort-slots");
    if (!poolEl || !slotsEl) return;
    poolEl.innerHTML = "";
    sortPool.forEach(function (idx) {
      poolEl.appendChild(makeSortCard(set.cards[idx], idx));
    });
    slotsEl.querySelectorAll(".sort-slot").forEach(function (slot, i) {
      slot.innerHTML = "";
      const idx = sortSlots[i];
      if (idx != null) slot.appendChild(makeSortCard(set.cards[idx], idx));
    });
    renderKatexIn(document.getElementById("sci-sort-wrap"));
  }

  function resetSort(advance) {
    if (advance) sortSetIdx = (sortSetIdx + 1) % SORT_SETS.length;
    sortActiveSet = sortSetIdx;
    const set = SORT_SETS[sortActiveSet];
    sortSlots = [null, null, null, null];
    sortPool = shuffle(set.cards.map(function (_, i) {
      return i;
    }));
    const label = document.getElementById("sci-sort-label");
    if (label) {
      label.textContent = set.asc
        ? "Drag into ascending order (smallest → largest)."
        : "Drag into descending order (largest → smallest).";
    }
    renderSortUI();
    const fb = document.getElementById("fb-sci-sort");
    fb.className = "feedback";
    fb.textContent = "Convert mentally to compare, then drag the cards.";
    lockFormula("formula-sci-sort");
  }

  function checkSort() {
    const fb = document.getElementById("fb-sci-sort");
    const set = SORT_SETS[sortActiveSet];
    if (sortSlots.some(function (x) {
      return x == null;
    })) {
      fb.className = "feedback warn";
      fb.textContent = "Fill all four slots first.";
      return;
    }
    const order = sortSlots.map(function (i) {
      return cardValue(set.cards[i]);
    });
    const expect = sortedOrder(set.cards, set.asc);
    const ok = order.every(function (v, i) {
      return nearlyEqual(v, expect[i], 1e-6);
    });
    if (ok) {
      fb.className = "feedback ok";
      fb.textContent = set.asc ? "Correct ascending order!" : "Correct descending order!";
      const tex = expect.map(function (v) {
        const s = toScientific(v);
        return sciTex(s.mantissa, s.exp);
      }).join(set.asc ? " < " : " > ");
      revealFormula("formula-sci-sort", tex);
    } else {
      fb.className = "feedback bad";
      fb.textContent = "Compare the actual values — rewrite each in \\(a\\times10^n\\) with \\(1\\le a<10\\) if needed.";
      renderKatexIn(fb);
    }
  }

  function initScientificLab() {
    resetShiftQuestion();
    resetConvertQuiz();
    resetArith();
    resetSort();

    document.getElementById("sci-shift-left").addEventListener("click", function () {
      shiftDecimal(-1);
    });
    document.getElementById("sci-shift-right").addEventListener("click", function () {
      shiftDecimal(1);
    });
    document.getElementById("sci-shift-check").addEventListener("click", checkShift);
    document.getElementById("sci-shift-reset").addEventListener("click", resetShiftQuestion);

    document.getElementById("sci-convert-check").addEventListener("click", checkConvertQuiz);
    document.getElementById("sci-convert-reset").addEventListener("click", resetConvertQuiz);

    document.getElementById("sci-arith-check").addEventListener("click", checkArith);
    document.getElementById("sci-arith-reset").addEventListener("click", resetArith);

    document.getElementById("sci-sort-check").addEventListener("click", checkSort);
    document.getElementById("sci-sort-reset").addEventListener("click", function () {
      resetSort(true);
    });

    if (window.initStepper) {
      window.initStepper("sci-intro");
    }
  }

  window.initScientificLab = initScientificLab;
})();
