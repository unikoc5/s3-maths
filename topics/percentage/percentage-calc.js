/* Pocket calculator for Percentages games tab. */
(function () {
  "use strict";

  const TIPS = {
    mart: "70% off $100<br>→ 100×(1−70÷100)<br>or 100×0.3",
    bank: "$10k at 5% × 2 yr<br>Simple I: 10000×5÷100×2<br>Compound: 10000×(1+5÷100)^2",
  };

  let inited = false;

  function beep(freq, dur) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + (dur || 0.08));
    } catch (e) { /* silent */ }
  }

  function initPctCalculator() {
    if (inited) return;
    const root = document.getElementById("pg-calc");
    const exprEl = document.getElementById("pg-calc-expr");
    const resEl = document.getElementById("pg-calc-result");
    const keys = document.getElementById("pg-calc-keys");
    const tipEl = document.getElementById("pg-calc-tip");
    if (!root || !keys) return;
    inited = true;

    let expr = "";
    let lastWasEq = false;

    function displayExpr() { exprEl.textContent = expr; }

    function formatNum(n) {
      if (!Number.isFinite(n)) return "ERR";
      const r = Math.round(n * 1e8) / 1e8;
      if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
      return String(parseFloat(r.toFixed(6)));
    }

    function evalExpr(raw) {
      const s = raw.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      if (!/^[\d+\-*/().\s]+$/.test(s)) return NaN;
      if (/(\*\*|\/\/|<<|>>|eval|function)/.test(s)) return NaN;
      try {
        const v = Function('"use strict"; return (' + s + ")")();
        return typeof v === "number" ? v : NaN;
      } catch (e) { return NaN; }
    }

    function preview() {
      if (!expr) { resEl.textContent = "0"; resEl.classList.remove("err"); return; }
      const v = evalExpr(expr);
      if (Number.isFinite(v)) {
        resEl.textContent = "= " + formatNum(v);
        resEl.classList.remove("err");
      } else {
        resEl.textContent = expr.endsWith("=") ? "ERR" : "…";
        resEl.classList.toggle("err", expr.endsWith("="));
      }
    }

    function append(tok) {
      if (lastWasEq && /[\d.]/.test(tok)) { expr = ""; lastWasEq = false; }
      if (lastWasEq && /[+\-×÷*\/(]/.test(tok)) {
        expr = resEl.textContent.replace(/^=\s*/, "");
        lastWasEq = false;
      }
      expr += tok;
      displayExpr();
      preview();
    }

    function backspace() { expr = expr.slice(0, -1); lastWasEq = false; displayExpr(); preview(); }
    function clearAll() {
      expr = ""; lastWasEq = false; displayExpr();
      resEl.textContent = "0"; resEl.classList.remove("err");
    }

    function equals() {
      const v = evalExpr(expr);
      if (!Number.isFinite(v)) {
        resEl.textContent = "ERR"; resEl.classList.add("err");
        expr += "="; displayExpr(); return;
      }
      const out = formatNum(v);
      resEl.textContent = "= " + out;
      resEl.classList.remove("err");
      expr = out; lastWasEq = true; displayExpr();
    }

    function percent() {
      const m = expr.match(/(\d+\.?\d*)$/);
      if (m) expr = expr.slice(0, -m[0].length) + "(" + m[0] + "/100)";
      else if (!expr || /[+\-×÷*(]$/.test(expr)) { append("0"); expr += "/100"; }
      else expr = "(" + expr + ")/100";
      displayExpr(); preview();
    }

    function press(k) {
      beep(520, 0.05);
      if (k === "C") clearAll();
      else if (k === "BK") backspace();
      else if (k === "%") percent();
      else if (k === "=") equals();
      else if (k === "(" || k === ")") append(k);
      else if (k === "*") append("×");
      else if (k === "/") append("÷");
      else if (k === "-") append("−");
      else append(k);
    }

    keys.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const btn = ev.target.closest("[data-k]");
      if (btn) press(btn.dataset.k);
    });

    root.addEventListener("click", (ev) => ev.stopPropagation());
    root.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") { ev.preventDefault(); equals(); return; }
      if (ev.key === "Backspace") { ev.preventDefault(); backspace(); return; }
      if (ev.key === "Escape") { ev.preventDefault(); clearAll(); return; }
      const map = {
        "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6",
        "7": "7", "8": "8", "9": "9", ".": ".", "+": "+", "-": "-", "*": "*",
        "/": "/", "%": "%", "(": "(", ")": ")",
      };
      if (map[ev.key]) { ev.preventDefault(); press(map[ev.key]); }
    });

    clearAll();

    window.PctCalc = {
      setTip(mode) {
        if (tipEl && TIPS[mode]) tipEl.innerHTML = TIPS[mode];
      },
    };
  }

  window.initPctCalculator = initPctCalculator;
})();
