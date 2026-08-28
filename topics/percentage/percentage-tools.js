/* Percentages — topic page wiring.
 *
 * Tab 1 (Concept & Formula): three Manim-Slides decks shown in an iframe; the
 * chips swap the deck source.
 *
 * Tab 2 (Interactive Tool): a "simple vs compound interest" coin-stack timeline.
 * The learner drags principal ($100–$1000), rate (5–30%) and time (1–5 yr), and
 * can switch compound frequency (yearly / half-yearly / monthly). Stacks are scaled so large
 * dollar amounts stay readable (not one coin per dollar).
 *   • Simple   — only the principal earns each year.
 *   • Compound — interest joins the pile each period (year, half-year, or month).
 *
 * Concept colours match the Manim decks:
 *   old value -> blue   new value -> amber   change factor -> violet
 *   increase / growth -> green   decrease / decay -> pink
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const GOLD = "#FFD54F", GOLD_S = "#caa12f", GREEN = "#66BB6A", GREEN_S = "#3d8b40";
  const GLOW_RING = "#EF5350";
  /** Cap visual coins so $1000 piles stay readable. */
  const MAX_VISUAL_COINS = 28;

  function E(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function km(el, latex) { try { window.katex.render(latex, el, { throwOnError: false, displayMode: false }); } catch (e) { el.textContent = latex; } }
  const money = (x) => "$" + (Math.round(x * 100) / 100).toFixed(2);

  /* ─────────────────────────── interest tool ─────────────────────────── */
  function initInterestTool() {
    const pS = document.getElementById("it-p"), rS = document.getElementById("it-r"), tS = document.getElementById("it-t");
    if (!pS) return;
    const pV = document.getElementById("it-pv"), rV = document.getElementById("it-rv"), tV = document.getElementById("it-tv");
    const simpleSvg = document.getElementById("it-simple"), compoundSvg = document.getElementById("it-compound");
    const simpleTot = document.getElementById("it-simple-tot"), compoundTot = document.getElementById("it-compound-tot");
    const guidance = document.getElementById("it-guidance");
    const freqBtns = document.querySelectorAll(".it-freq-btn");

    let freq = "year"; // "year" | "half" | "month"
    const YBASE = 256, TOPPAD = 46, RY = 7;

    function freqPeriodsPerYear(f) {
      if (f === "month") return 12;
      if (f === "half") return 2;
      return 1;
    }
    function freqLabel(f) {
      if (f === "month") return "monthly";
      if (f === "half") return "half-yearly";
      return "yearly";
    }

    function drawCoin(g, cx, cy, rx, fill, stroke, glow) {
      if (glow) g.appendChild(E("ellipse", { cx, cy, rx: rx + 2, ry: RY + 2, fill: "none", stroke: GLOW_RING, "stroke-width": 2, opacity: 0.95 }));
      g.appendChild(E("ellipse", { cx, cy, rx, ry: RY, fill, stroke, "stroke-width": 1.4 }));
      g.appendChild(E("ellipse", { cx: cx - rx * 0.28, cy: cy - 1.5, rx: rx * 0.42, ry: RY * 0.32, fill: "#ffffff", opacity: 0.35 }));
    }
    function shadow(g, cx, rx) { g.appendChild(E("ellipse", { cx, cy: YBASE + 4, rx: rx + 2, ry: 5, fill: "#000000", opacity: 0.3 })); }
    function label(g, x, y, txt, fill, size, weight, anchor) {
      const t = E("text", { x, y, "text-anchor": anchor || "middle", "dominant-baseline": "middle",
        "font-size": size || 13, fill, "font-weight": weight || 400, "font-family": "Hanken Grotesk, sans-serif" });
      t.textContent = txt; g.appendChild(t); return t;
    }

    /** Map dollars → visual coin count using a shared scale (scale = dollars per coin). */
    function visualCoins(dollars, scale) {
      if (dollars <= 0.005) return 0;
      return Math.max(1, Math.round(dollars / scale));
    }

    // render one lane. amountAt(y) = total amount after y years; interestAt(y) = interest portion
    function renderLane(svg, years, dy, rx, amountAt, interestAt, scale, accent, periodLabel) {
      clear(svg);
      const n = years + 1, colW = Math.max(96, 700 / n), Wv = n * colW;
      svg.setAttribute("viewBox", "0 0 " + Wv + " 300");
      let prevIVis = 0;
      for (let y = 0; y <= years; y++) {
        const cx = colW * (y + 0.5);
        const amt = amountAt(y);
        const iDollars = interestAt(y);
        const pVis = visualCoins(amt - iDollars, scale);
        const iVis = visualCoins(iDollars, scale);
        const totalVis = pVis + iVis;
        const newIVis = Math.max(0, iVis - prevIVis);
        shadow(svg, cx, rx);
        const g = E("g", {});
        if (y === years) g.setAttribute("class", "coin-pop");
        svg.appendChild(g);
        for (let i = 0; i < totalVis; i++) {
          const cy = YBASE - 6 - i * dy;
          if (i < pVis) drawCoin(g, cx, cy, rx, GOLD, GOLD_S, false);
          else {
            const glow = i >= pVis + iVis - newIVis && newIVis > 0;
            drawCoin(g, cx, cy, rx, GREEN, GREEN_S, glow);
          }
        }
        const topY = YBASE - 6 - (totalVis - 1) * dy;
        const lby = Math.max(16, topY - RY - 12);
        label(svg, cx, lby, money(amt), "#e5e7eb", 13, 700);
        label(svg, cx, 284, y === 0 ? "Start" : periodLabel(y), accent, 12, 600);
        prevIVis = iVis;
      }
    }

    function setFreq(next) {
      freq = (next === "month" || next === "half") ? next : "year";
      freqBtns.forEach((b) => b.classList.toggle("active", b.dataset.freq === freq));
      render();
    }

    function render() {
      const P = +pS.value, r = +rS.value, t = +tS.value, rate = r / 100;
      const m = freqPeriodsPerYear(freq);
      pV.textContent = "$" + P;
      rV.textContent = r + "%";
      tV.textContent = t + " yr";

      const simpleInterest = (y) => P * rate * y;
      const simpleAmount = (y) => P + simpleInterest(y);
      const compoundAmount = (y) => P * Math.pow(1 + rate / m, m * y);
      const compoundInterest = (y) => compoundAmount(y) - P;

      const aSimple = simpleAmount(t), aCompound = compoundAmount(t);
      const maxAmt = Math.max(aSimple, aCompound, P);
      const scale = Math.max(1, maxAmt / MAX_VISUAL_COINS);
      const maxVis = Math.ceil(maxAmt / scale);
      const dy = Math.min(11, Math.max(3, (YBASE - TOPPAD) / Math.max(maxVis, 1)));
      const n = t + 1, colW = Math.max(96, 700 / n);
      const rx = Math.min(26, colW * 0.34);

      const yearLbl = (y) => "Year " + y;
      renderLane(simpleSvg, t, dy, rx, simpleAmount, simpleInterest, scale, "#4FC3F7", yearLbl);
      renderLane(compoundSvg, t, dy, rx, compoundAmount, compoundInterest, scale, "#66BB6A", yearLbl);
      simpleTot.textContent = money(aSimple);
      compoundTot.textContent = money(aCompound);

      const perYear = P * rate;
      km(document.getElementById("it-f-simple"),
        "A = P\\left(1+\\tfrac{r}{100}\\,t\\right) = " + P + "\\left(1+\\tfrac{" + r + "}{100}\\cdot" + t + "\\right) = \\$" + aSimple.toFixed(2));
      document.getElementById("it-n-simple").textContent =
        "Interest each year is always " + money(perYear) + " (" + r + "% of the original $" + P + "). After " + t +
        (t === 1 ? " year" : " years") + " the interest is " + money(simpleInterest(t)) + ".";

      if (freq === "month") {
        km(document.getElementById("it-f-compound"),
          "A = P\\left(1+\\tfrac{r}{100\\cdot 12}\\right)^{12t} = " + P +
          "\\left(1+\\tfrac{" + r + "}{1200}\\right)^{" + (12 * t) + "} = \\$" + aCompound.toFixed(2));
        document.getElementById("it-n-compound").textContent =
          "Compounded monthly: each month you earn " + (r / 12).toFixed(3) + "% of the whole pile (" +
          (12 * t) + " periods in " + t + (t === 1 ? " year" : " years") + "). Interest ends at " +
          money(compoundInterest(t)) + ".";
      } else if (freq === "half") {
        km(document.getElementById("it-f-compound"),
          "A = P\\left(1+\\tfrac{r}{100\\cdot 2}\\right)^{2t} = " + P +
          "\\left(1+\\tfrac{" + r + "}{200}\\right)^{" + (2 * t) + "} = \\$" + aCompound.toFixed(2));
        document.getElementById("it-n-compound").textContent =
          "Compounded half-yearly: every 6 months you earn " + (r / 2).toFixed(2) + "% of the whole pile (" +
          (2 * t) + " periods in " + t + (t === 1 ? " year" : " years") + "). Interest ends at " +
          money(compoundInterest(t)) + ".";
      } else {
        km(document.getElementById("it-f-compound"),
          "A = P\\left(1+\\tfrac{r}{100}\\right)^{t} = " + P + "\\left(1+\\tfrac{" + r + "}{100}\\right)^{" + t + "} = \\$" + aCompound.toFixed(2));
        document.getElementById("it-n-compound").textContent =
          "Each year you earn " + r + "% of the whole pile, so the interest grows: $" + P + " \u2192 " +
          money(P * (1 + rate)) + " \u2192 " + money(P * Math.pow(1 + rate, 2)) + " \u2026  After " + t +
          (t === 1 ? " year" : " years") + " the interest is " + money(compoundInterest(t)) + ".";
      }

      const extra = aCompound - aSimple;
      const freqWord = freqLabel(freq) + " compound";
      document.getElementById("it-diff").innerHTML =
        "After <b>" + t + (t === 1 ? " year" : " years") + "</b> at <b>" + r + "%</b> (" + freqWord + "): compound grows to <b>" + money(aCompound) +
        "</b> versus simple's <span class=\"sm\">" + money(aSimple) + "</span> \u2014 compound earns <b>" + money(extra) + "</b> more.";

      if (guidance) {
        const showTip = t >= 3 && extra > P * 0.02;
        guidance.hidden = !showTip;
        if (showTip) {
          if (freq === "month") {
            guidance.innerHTML = "Notice: <b>monthly</b> compounding pulls ahead of simple (and yearly / half-yearly) because interest is added most often.";
          } else if (freq === "half") {
            guidance.innerHTML = "Notice: <b>half-yearly</b> sits between yearly and monthly — a common wording in public-exam compound-interest questions.";
          } else {
            guidance.innerHTML = "Notice: <b>compound</b> pulls ahead because interest earns interest. Try <b>half-yearly</b> or <b>Monthly</b> for a larger gap.";
          }
        }
      }

      if (typeof window.__jmToolsPostHeight === "function") {
        requestAnimationFrame(window.__jmToolsPostHeight);
      }
    }

    [pS, rS, tS].forEach((s) => s.addEventListener("input", render));
    freqBtns.forEach((b) => b.addEventListener("click", () => setFreq(b.dataset.freq)));
    document.querySelectorAll("#panel-tools [data-tool]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("#panel-tools [data-tool]").forEach((x) => x.classList.toggle("active", x === b));
    }));
    render();
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
      if (t.dataset.tab === "game") showGameMode(activeGameMode);
    }));
  }

  /* ─────────────────────────── games tab ─────────────────────────── */
  let activeGameMode = "mart";

  function applyGameSymbols() {
    // Force Unicode labels via JS escapes so HTML encoding never garbles them.
    const labels = { "/": "\u00F7", "*": "\u00D7", "-": "\u2212", BK: "\u232B" };
    document.querySelectorAll("#pg-calc-keys .pg-calc-key[data-k]").forEach((btn) => {
      const sym = labels[btn.dataset.k];
      if (sym) {
        btn.textContent = sym;
        btn.classList.add("sym");
      }
    });
    const dpadHtml = '<span class="pg-sym">\u2191/\u2193 highlight</span>';
    document.querySelectorAll(".pg-dpad > span:first-child").forEach((el) => {
      el.outerHTML = dpadHtml;
    });
  }

  function showGameMode(mode) {
    activeGameMode = mode || "mart";
    const mart = document.getElementById("game-mart");
    const bank = document.getElementById("game-bank");
    const hint = document.getElementById("pg-hint");
    document.querySelectorAll("[data-game]").forEach((b) => {
      b.classList.toggle("active", b.dataset.game === activeGameMode);
    });
    if (mart) mart.classList.toggle("hidden", activeGameMode !== "mart");
    if (bank) bank.classList.toggle("hidden", activeGameMode !== "bank");
    if (window.PctMartGame) window.PctMartGame.hide();
    if (window.PctBankGame) window.PctBankGame.hide();
    const arrowHint =
      '<span class="pg-sym">\u2191/\u2193 highlight</span> | Enter confirm | pocket calc for working';
    if (activeGameMode === "bank") {
      if (window.PctBankGame) window.PctBankGame.show();
      if (window.PctCalc) window.PctCalc.setTip("bank");
      if (hint) hint.innerHTML = "City Bank &mdash; simple vs compound interest.<br>" + arrowHint;
    } else {
      if (window.PctMartGame) window.PctMartGame.show();
      if (window.PctCalc) window.PctCalc.setTip("mart");
      if (hint) hint.innerHTML = "Super Mart &mdash; profit, discount &amp; marked price.<br>" + arrowHint;
    }
  }

  function initGames() {
    if (window.initPctCalculator) window.initPctCalculator();
    applyGameSymbols();
    document.querySelectorAll("[data-game]").forEach((b) => {
      b.addEventListener("click", () => showGameMode(b.dataset.game));
    });
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
    const tab = q.get("tab"), deck = q.get("deck"), game = q.get("game");
    if (tab) { const b = document.querySelector(`[data-tab="${tab}"]`); if (b) b.click(); }
    if (deck) { const b = document.querySelector(`[data-deck*="/${deck}/"]`); if (b) b.click(); }
    if (game === "bank" || game === "mart") showGameMode(game);
  }

  function initSummarySlideshow() {
    const sets = document.querySelectorAll("#summary-stage .summary-set");
    const categoryChips = document.querySelectorAll("[data-summary-category]");
    const styleChips = document.querySelectorAll("[data-summary-style]");
    const bigStyleNav = document.getElementById("summary-big-style-nav");
    const prevBtn = document.getElementById("summary-prev");
    const nextBtn = document.getElementById("summary-next");
    const pageNum = document.getElementById("summary-page-num");
    const pageTotal = document.getElementById("summary-page-total");
    if (!sets.length || !prevBtn || !nextBtn) return;

    let category = "big";
    let bigStyle = "style-1";
    let idx = 0;

    function activeSetId() {
      return category === "big" ? bigStyle : "cards";
    }

    function activeSet() {
      return document.querySelector('#summary-stage .summary-set[data-summary-set="' + activeSetId() + '"]');
    }

    function slides() {
      const set = activeSet();
      return set ? set.querySelectorAll(".summary-slide") : [];
    }

    function render() {
      const setId = activeSetId();
      if (bigStyleNav) bigStyleNav.classList.toggle("hidden", category !== "big");
      sets.forEach((s) => s.classList.toggle("hidden", s.dataset.summarySet !== setId));
      categoryChips.forEach((c) => c.classList.toggle("active", c.dataset.summaryCategory === category));
      styleChips.forEach((c) => c.classList.toggle("active", c.dataset.summaryStyle === bigStyle));
      const list = slides();
      list.forEach((s, i) => s.classList.toggle("active", i === idx));
      if (pageNum) pageNum.textContent = String(idx + 1);
      if (pageTotal) pageTotal.textContent = String(list.length || 1);
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx >= list.length - 1;
    }

    function setCategory(id) {
      category = id;
      idx = 0;
      render();
    }

    function setBigStyle(id) {
      bigStyle = id;
      idx = 0;
      render();
    }

    categoryChips.forEach((c) => {
      c.addEventListener("click", () => setCategory(c.dataset.summaryCategory));
    });
    styleChips.forEach((c) => {
      c.addEventListener("click", () => setBigStyle(c.dataset.summaryStyle));
    });

    prevBtn.addEventListener("click", () => {
      if (idx > 0) { idx--; render(); }
    });
    nextBtn.addEventListener("click", () => {
      const list = slides();
      if (idx < list.length - 1) { idx++; render(); }
    });

    document.addEventListener("keydown", (e) => {
      const panel = document.getElementById("panel-summary");
      if (!panel || panel.classList.contains("hidden")) return;
      const list = slides();
      if (e.key === "ArrowLeft" && idx > 0) { idx--; render(); }
      else if (e.key === "ArrowRight" && idx < list.length - 1) { idx++; render(); }
    });

    render();
  }

  function start() {
    if (window.KOCDeckTouch) {
      window.KOCDeckTouch.initTabletClass();
      window.KOCDeckTouch.initTabletMode();
    }
    initTabs(); initDecks(); initInterestTool(); initGames(); initSummarySlideshow(); applyDeepLink();
  }
  if (window.katex) { window.addEventListener("DOMContentLoaded", start); }
  else { window.addEventListener("DOMContentLoaded", () => {
    (function wait() { if (window.katex) start(); else setTimeout(wait, 30); })();
  }); }
})();
