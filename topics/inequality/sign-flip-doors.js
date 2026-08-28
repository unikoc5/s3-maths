/* Sign Flip Doors — standalone export from dashboard/topics/inequality */
(function () {
  "use strict";

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ── Sign Flip Doors game ─────────────────────────────────────────────────── */
  const DF = {
    els: {}, mounted: false, active: false, lock: false, over: false,
    progress: 0, lives: 3, goal: 15,
    shields: 0, flashlightReady: false,
    atCheckpoint: false,
    q: null,
    DOOR_IDS: ["a", "b", "c", "d"],
    KEY_MAP: { KeyA: "a", KeyB: "b", KeyC: "c", KeyD: "d" },
    DRAG_PARTIAL_MS: 1300,
    DRAG_FATAL_MS: 2600,
    CHECKPOINTS: [5, 10],
    SAVE_KEY: "ineqDoorSave",
    STAGES: [
      { id: "forest", name: "The Dark Forest", doors: "1\u20135", blurb: "Basic single-step negatives" },
      { id: "caves", name: "The Haunted Caves", doors: "6\u201310", blurb: "Fraction gates \u2014 division flips too!" },
      { id: "castle", name: "The Castle Gates", doors: "11\u201315", blurb: "Multi-step traps" },
    ],
    SYM: [
      { start: ">", flip: "<", tex: ">" },
      { start: "<", flip: ">", tex: "<" },
      { start: ">=", flip: "<=", tex: "\\ge" },
      { start: "<=", flip: ">=", tex: "\\le" },
    ],
    NEGS: [-2, -3, -4, -5],
  };

  function dfGetStageIndex() {
    if (DF.progress < 5) return 0;
    if (DF.progress < 10) return 1;
    return 2;
  }
  function dfStageDoorNum() {
    const p = DF.progress;
    if (p < 5) return p + 1;
    if (p < 10) return p - 4;
    return p - 9;
  }
  function dfApplyStageTheme() {
    if (!DF.els.scene) return;
    if (DF.over && DF.progress >= DF.goal) {
      DF.els.scene.classList.remove("stage-forest", "stage-caves", "stage-castle");
      DF.els.scene.classList.add("stage-victory");
      if (DF.els.stagePill) DF.els.stagePill.innerHTML = "&#127942; Quest <b>Complete!</b>";
      return;
    }
    const st = DF.STAGES[dfGetStageIndex()];
    DF.els.scene.classList.remove("stage-forest", "stage-caves", "stage-castle", "stage-victory");
    DF.els.scene.classList.add("stage-" + st.id);
    if (DF.els.stagePill) {
      const doorNum = Math.min(dfStageDoorNum(), 5);
      DF.els.stagePill.innerHTML = "Stage " + (dfGetStageIndex() + 1) + " &mdash; <b>" + st.name + "</b> (Door " + doorNum + "/5)";
    }
  }
  function dfUpdateHearts(animateLoss) {
    const max = 3;
    if (DF.els.lives) DF.els.lives.textContent = DF.lives;
    if (!DF.els.hearts) return;
    const hearts = DF.els.hearts.querySelectorAll(".heart");
    hearts.forEach((h, i) => {
      const alive = i < DF.lives;
      h.classList.toggle("full", alive);
      h.classList.toggle("empty", !alive);
      if (!animateLoss || alive) h.classList.remove("heart-lost");
    });
    if (animateLoss && DF.lives < max) {
      const lost = hearts[DF.lives];
      if (lost) {
        lost.classList.add("heart-lost", "empty");
        lost.classList.remove("full");
      }
    }
    if (DF.els.livesPill) {
      DF.els.livesPill.classList.toggle("critical", DF.lives === 1 && DF.active);
      DF.els.livesPill.classList.toggle("dead", DF.lives <= 0);
    }
  }
  function dfResetHeroState() {
    if (!DF.els.charWrap) return;
    DF.els.charWrap.classList.remove("hurt", "critical", "defeated", "danger", "dragged-down", "dragged-partial");
    DF.els.charWrap.style.removeProperty("--drag-x");
    DF.els.charWrap.style.removeProperty("--drag-y");
    const hx = DF.els.charWrap.style.getPropertyValue("--hero-x") || "0px";
    DF.els.charWrap.style.transform = "translateX(" + hx + ")";
    DF.els.charWrap.style.opacity = "";
    if (DF.els.doors) {
      DF.els.doors.forEach((d) => d.btn.classList.remove("dragging-hero", "dragging-partial"));
    }
  }
  function dfClearDrag() {
    if (!DF.els.charWrap) return;
    DF.els.charWrap.classList.remove("dragged-down", "dragged-partial");
    if (DF.els.doors) {
      DF.els.doors.forEach((d) => d.btn.classList.remove("dragging-hero", "dragging-partial"));
    }
    const hx = DF.els.charWrap.style.getPropertyValue("--hero-x") || "0px";
    DF.els.charWrap.style.transform = "translateX(" + hx + ")";
    DF.els.charWrap.style.opacity = "";
  }
  function dfUpdateHeroState() {
    if (!DF.els.charWrap || DF.over) return;
    DF.els.charWrap.classList.toggle("critical", DF.lives === 1 && DF.active);
  }
  function dfHeroHurt() {
    if (!DF.els.charWrap) return;
    DF.els.charWrap.classList.remove("hurt");
    void DF.els.charWrap.offsetWidth;
    DF.els.charWrap.classList.add("hurt");
    setTimeout(() => {
      if (DF.els.charWrap) DF.els.charWrap.classList.remove("hurt");
      dfUpdateHeroState();
    }, 600);
  }
  function dfHeroDrag(doorId, fatal) {
    const hero = DF.els.charWrap;
    const door = DF.els.doors && DF.els.doors.find((d) => d.id === doorId);
    if (!hero || !door) {
      if (fatal) dfHeroDefeated();
      return;
    }
    hero.classList.remove("hurt", "critical", "dragged-down", "dragged-partial");
    if (DF.els.doors) {
      DF.els.doors.forEach((d) => d.btn.classList.remove("dragging-hero", "dragging-partial"));
    }
    void hero.offsetWidth;
    const hr = hero.getBoundingClientRect();
    const dr = door.btn.getBoundingClientRect();
    const dx = (dr.left + dr.width / 2) - (hr.left + hr.width / 2);
    const dy = (dr.top + dr.height * 0.6) - (hr.top + hr.height * 0.45);
    hero.style.setProperty("--drag-x", Math.round(dx) + "px");
    hero.style.setProperty("--drag-y", Math.round(dy) + "px");
    if (fatal) {
      hero.classList.add("dragged-down");
      door.btn.classList.add("dragging-hero");
    } else {
      hero.classList.add("dragged-partial");
      door.btn.classList.add("dragging-partial");
    }
  }
  function dfHeroDefeated() {
    if (!DF.els.charWrap) return;
    DF.els.charWrap.classList.remove("hurt", "critical", "danger");
    DF.els.charWrap.classList.add("defeated");
  }
  function dfHideGameOver() {
    dfResetHeroState();
    if (DF.els.scene) DF.els.scene.classList.remove("gameover-mode");
    if (DF.els.gameover) DF.els.gameover.classList.add("hidden");
    if (DF.els.livesPill) DF.els.livesPill.classList.remove("dead", "critical");
    if (DF.els.hearts) {
      DF.els.hearts.querySelectorAll(".heart").forEach((h) => h.classList.remove("heart-lost"));
    }
  }
  function dfHideVictory() {
    dfHideGameOver();
    if (DF.els.scene) DF.els.scene.classList.remove("victory-mode", "stage-victory");
    if (DF.els.victoryConfetti) DF.els.victoryConfetti.classList.add("hidden");
    if (DF.els.victoryBanner) DF.els.victoryBanner.classList.add("hidden");
    if (DF.els.victoryAgain) DF.els.victoryAgain.classList.add("hidden");
    if (DF.els.hudPlayAgain) DF.els.hudPlayAgain.classList.add("hidden");
    if (DF.els.sub) DF.els.sub.innerHTML = "(Select the correct <i>x</i>)";
  }
  function dfPlayAgain() {
    dfHideVictory();
    dfStart();
  }
  function dfUpdatePowerTags() {
    if (DF.els.shieldTag) DF.els.shieldTag.classList.toggle("hidden", DF.shields <= 0);
    if (DF.els.flashTag) DF.els.flashTag.classList.toggle("hidden", !DF.flashlightReady);
  }
  function dfSaveProgress() {
    try {
      sessionStorage.setItem(DF.SAVE_KEY, JSON.stringify({
        progress: DF.progress, lives: DF.lives, shields: DF.shields,
        flashlightReady: DF.flashlightReady, atCheckpoint: DF.atCheckpoint,
      }));
    } catch (e) { /* ignore */ }
  }
  function dfClearSave() {
    try { sessionStorage.removeItem(DF.SAVE_KEY); } catch (e) { /* ignore */ }
  }
  function dfHasSave() {
    try { return !!sessionStorage.getItem(DF.SAVE_KEY); } catch (e) { return false; }
  }
  function dfLoadSave() {
    try {
      const raw = sessionStorage.getItem(DF.SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (typeof s.progress !== "number" || s.progress <= 0 || s.progress >= DF.goal) return false;
      DF.progress = s.progress;
      DF.lives = typeof s.lives === "number" ? s.lives : 3;
      DF.shields = typeof s.shields === "number" ? s.shields : 0;
      DF.flashlightReady = !!s.flashlightReady;
      DF.atCheckpoint = !!s.atCheckpoint;
      return true;
    } catch (e) { return false; }
  }
  function dfRecomputeAnswer(q) {
    if (q.type === "solve") return dfSolveDirect(q.coeff, q.startOp, q.rhs);
    if (q.type === "fraction") return dfSolveFraction(q.divisor, q.startOp, q.rhs);
    if (q.type === "multistep") return dfSolveMultistep(q.coeff, q.b, q.startOp, q.rhs);
    return dfSolve(q.startSym, q.val, q.kind, q.n);
  }
  function dfWrongsFor(q, correct) {
    if (q.type === "solve") return dfWrongsSolve(q.coeff, q.startOp, q.rhs, correct);
    if (q.type === "fraction") return dfWrongsFraction(q.divisor, q.startOp, q.rhs, correct);
    if (q.type === "multistep") return dfWrongsMultistep(q.coeff, q.b, q.startOp, q.rhs, correct);
    return dfWrongs(q.startSym, q.val, correct, q.kind, q.n);
  }
  function dfSolveFraction(divisor, startOp, rhs) {
    const sym = dfFlipSym(startOp);
    const val = Math.round(rhs * divisor * 100) / 100;
    return { sym, val };
  }
  function dfFractionPromptTex(divisor, startOp, rhs) {
    const s = DF.SYM.find((x) => x.start === startOp);
    const opTex = s ? s.tex : startOp;
    return "\\text{Solve: }\\frac{x}{" + divisor + "} " + opTex + " " + dfFmt(rhs);
  }
  function dfWrongsFraction(divisor, startOp, rhs, correct) {
    const noFlipVal = rhs * divisor;
    const list = [
      { sym: startOp, val: noFlipVal },
      { sym: correct.sym, val: -correct.val },
      { sym: correct.sym, val: Math.abs(correct.val) },
      { sym: startOp, val: -noFlipVal },
      { sym: startOp, val: Math.abs(noFlipVal) },
      { sym: correct.sym, val: correct.val + divisor },
      { sym: correct.sym, val: correct.val - divisor },
    ];
    const out = [];
    list.forEach((w) => {
      const cand = { sym: w.sym, val: Math.round(w.val * 100) / 100 };
      if (!dfSameAnswer(cand, correct) && !out.some((o) => dfSameAnswer(o, cand))) out.push(cand);
    });
    return out;
  }
  function dfSolveMultistep(coeff, b, startOp, rhs) {
    const shifted = rhs - b;
    const sym = dfFlipSym(startOp);
    const val = Math.round((shifted / coeff) * 100) / 100;
    return { sym, val };
  }
  function dfMultistepPromptTex(coeff, b, startOp, rhs) {
    const s = DF.SYM.find((x) => x.start === startOp);
    const opTex = s ? s.tex : startOp;
    const bTex = b >= 0 ? "+" + b : String(b);
    return "\\text{Solve: }" + dfCoeffTex(coeff) + bTex + " " + opTex + " " + dfFmt(rhs);
  }
  function dfWrongsMultistep(coeff, b, startOp, rhs, correct) {
    const shifted = rhs - b;
    const noFlipVal = Math.round((shifted / coeff) * 100) / 100;
    const list = [
      { sym: startOp, val: noFlipVal },
      { sym: correct.sym, val: -correct.val },
      { sym: correct.sym, val: Math.abs(correct.val) },
      { sym: startOp, val: -noFlipVal },
      { sym: startOp, val: Math.abs(noFlipVal) },
      { sym: correct.sym, val: correct.val + coeff },
      { sym: correct.sym, val: correct.val - 2 },
    ];
    const out = [];
    list.forEach((w) => {
      const cand = { sym: w.sym, val: Math.round(w.val * 100) / 100 };
      if (!dfSameAnswer(cand, correct) && !out.some((o) => dfSameAnswer(o, cand))) out.push(cand);
    });
    return out;
  }
  function dfNoFlipAnswer(q) {
    if (q.type === "solve") {
      return { sym: q.startOp, val: Math.round((q.rhs / q.coeff) * 100) / 100 };
    }
    if (q.type === "fraction") {
      return { sym: q.startOp, val: Math.round(q.rhs * q.divisor * 100) / 100 };
    }
    if (q.type === "multistep") {
      return { sym: q.startOp, val: Math.round(((q.rhs - q.b) / q.coeff) * 100) / 100 };
    }
    return null;
  }
  function dfApplyFlashlight(q) {
    if (!DF.flashlightReady) return;
    const trap = dfNoFlipAnswer(q);
    if (!trap) return;
    let targetId = null;
    DF.DOOR_IDS.forEach((id) => {
      const opt = q.options[id];
      if (!opt.correct && dfSameAnswer(opt.answer, trap)) targetId = id;
    });
    if (!targetId) {
      DF.DOOR_IDS.forEach((id) => {
        if (!q.options[id].correct && !targetId) targetId = id;
      });
    }
    if (targetId) {
      const door = DF.els.doors.find((d) => d.id === targetId);
      if (door) {
        door.btn.classList.add("eliminated");
        door.btn.disabled = true;
      }
    }
    DF.flashlightReady = false;
    dfUpdatePowerTags();
  }
  function dfRi(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function dfFmt(n) {
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 100) / 100);
  }
  function dfFlipSym(sym) {
    const m = { ">": "<", "<": ">", ">=": "<=", "<=": ">=" };
    return m[sym];
  }
  function dfAnsKey(sym, val) { return sym + "|" + dfFmt(val); }
  function dfSolve(startSym, val, kind, n) {
    const sym = dfFlipSym(startSym);
    // ÷ negative: flip sign, divide the boundary (e.g. x < −6, ÷(−3) → x > 2).
    // × negative: flip sign, multiply the boundary (e.g. x > 6, ×(−2) → x < −12).
    const newVal = kind === "div" ? val / n : n * val;
    return { sym, val: Math.round(newVal * 100) / 100 };
  }
  function dfRenderTex(el, tex) {
    if (!el) return;
    try { katex.render(tex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = tex.replace(/\\ge/g, "\u2265").replace(/\\le/g, "\u2264"); }
  }
  function dfIneqTex(sym, val) {
    const s = DF.SYM.find((x) => x.start === sym);
    return "x " + (s ? s.tex : sym) + " " + dfFmt(val);
  }
  function dfSameAnswer(a, b) {
    return dfAnsKey(a.sym, a.val) === dfAnsKey(b.sym, b.val);
  }
  function dfSolveDirect(coeff, startOp, rhs) {
    const sym = dfFlipSym(startOp);
    const val = Math.round((rhs / coeff) * 100) / 100;
    return { sym, val };
  }
  function dfCoeffTex(c) { return c < 0 ? c + "x" : c + "x"; }
  function dfSolvePromptTex(coeff, startOp, rhs) {
    const s = DF.SYM.find((x) => x.start === startOp);
    const opTex = s ? s.tex : startOp;
    return "\\text{Solve: }" + dfCoeffTex(coeff) + " " + opTex + " " + dfFmt(rhs);
  }
  function dfWrongsSolve(coeff, startOp, rhs, correct) {
    const solvedVal = rhs / coeff;
    const list = [
      { sym: startOp, val: solvedVal },
      { sym: correct.sym, val: -correct.val },
      { sym: correct.sym, val: Math.abs(correct.val) },
      { sym: startOp, val: -solvedVal },
      { sym: startOp, val: Math.abs(solvedVal) },
      { sym: startOp, val: correct.val + coeff },
      { sym: correct.sym, val: correct.val + 2 },
      { sym: correct.sym, val: correct.val - 2 },
    ];
    const out = [];
    list.forEach((w) => {
      const cand = { sym: w.sym, val: Math.round(w.val * 100) / 100 };
      if (!dfSameAnswer(cand, correct) && !out.some((o) => dfSameAnswer(o, cand))) out.push(cand);
    });
    return out;
  }
  function dfWrongs(startSym, val, correct, kind, n) {
    const rhsOp = kind === "mul" ? n * val : val / n;
    const list = [
      { sym: startSym, val },
      { sym: correct.sym, val },
      { sym: startSym, val: rhsOp },
      { sym: correct.sym, val: kind === "mul" ? val : rhsOp },
      { sym: startSym, val: kind === "mul" ? val * 2 : val * n },
      { sym: startSym, val: -val },
      { sym: dfFlipSym(startSym), val: rhsOp },
      { sym: startSym, val: val + n },
      { sym: startSym, val: val - n },
    ];
    const out = [];
    list.forEach((w) => {
      const cand = { sym: w.sym, val: Math.round(w.val * 100) / 100 };
      if (!dfSameAnswer(cand, correct) && !out.some((o) => dfSameAnswer(o, cand))) out.push(cand);
    });
    return out;
  }
  function dfValidateQuestion(q) {
    const answers = DF.DOOR_IDS.map((id) => q.options[id].answer);
    const correctCount = DF.DOOR_IDS.filter((id) => q.options[id].correct).length;
    if (correctCount !== 1) return false;
    const keys = new Set();
    for (let i = 0; i < answers.length; i++) {
      const k = dfAnsKey(answers[i].sym, answers[i].val);
      if (keys.has(k)) return false;
      keys.add(k);
    }
    const correct = answers.find((_, i) => q.options[DF.DOOR_IDS[i]].correct);
    const recomputed = dfRecomputeAnswer(q);
    const wrongPool = dfWrongsFor(q, recomputed);
    return dfSameAnswer(correct, recomputed) && wrongPool.length >= 3;
  }
  function dfMakeQuestion() {
    for (let t = 0; t < 50; t++) {
      const q = dfBuildQuestion();
      if (dfValidateQuestion(q)) return q;
    }
    return dfBuildQuestion();
  }
  function dfBuildQuestion() {
    const si = dfGetStageIndex();
    if (si === 0) return dfBuildSolveQuestion();
    if (si === 1) return dfBuildFractionQuestion();
    return dfBuildMultistepQuestion();
  }
  function dfPackChoices(correct, wrongs) {
    const pick = wrongs.slice(0, 3);
    while (pick.length < 3) {
      const extra = { sym: ">", val: dfRi(-12, 12) };
      if (!dfSameAnswer(extra, correct) && !pick.some((o) => dfSameAnswer(o, extra))) pick.push(extra);
    }
    const choices = shuffled([
      { answer: correct, correct: true },
      { answer: pick[0], correct: false },
      { answer: pick[1], correct: false },
      { answer: pick[2], correct: false },
    ]);
    const options = {};
    DF.DOOR_IDS.forEach((id, i) => { options[id] = choices[i]; });
    return options;
  }
  function dfBuildSolveQuestion() {
    const symDef = DF.SYM[dfRi(0, DF.SYM.length - 1)];
    const coeff = DF.NEGS[dfRi(0, DF.NEGS.length - 1)];
    let boundary = dfRi(-8, 8);
    if (boundary === 0) boundary = dfRi(0, 1) ? 3 : -3;
    const rhs = coeff * boundary;
    const startOp = dfFlipSym(symDef.start);
    const correct = { sym: symDef.start, val: boundary };
    const wrongs = dfWrongsSolve(coeff, startOp, rhs, correct);
    return {
      type: "solve",
      coeff,
      startOp,
      rhs,
      promptTex: dfSolvePromptTex(coeff, startOp, rhs),
      options: dfPackChoices(correct, wrongs),
    };
  }
  function dfBuildFractionQuestion() {
    const symDef = DF.SYM[dfRi(0, DF.SYM.length - 1)];
    const divisor = DF.NEGS[dfRi(0, DF.NEGS.length - 1)];
    let boundary = dfRi(-8, 8);
    if (boundary === 0) boundary = dfRi(0, 1) ? 4 : -4;
    const rhs = Math.round((boundary / divisor) * 100) / 100;
    const startOp = dfFlipSym(symDef.start);
    const correct = { sym: symDef.start, val: boundary };
    const wrongs = dfWrongsFraction(divisor, startOp, rhs, correct);
    return {
      type: "fraction",
      divisor,
      startOp,
      rhs,
      promptTex: dfFractionPromptTex(divisor, startOp, rhs),
      options: dfPackChoices(correct, wrongs),
    };
  }
  function dfBuildMultistepQuestion() {
    const symDef = DF.SYM[dfRi(0, DF.SYM.length - 1)];
    const coeff = DF.NEGS[dfRi(0, DF.NEGS.length - 1)];
    let boundary = dfRi(-7, 7);
    if (boundary === 0) boundary = dfRi(0, 1) ? 4 : -4;
    let b = dfRi(-8, 8);
    if (b === 0) b = dfRi(0, 1) ? 3 : -3;
    const startOp = dfFlipSym(symDef.start);
    const rhs = coeff * boundary + b;
    const correct = { sym: symDef.start, val: boundary };
    const wrongs = dfWrongsMultistep(coeff, b, startOp, rhs, correct);
    return {
      type: "multistep",
      coeff,
      b,
      startOp,
      rhs,
      promptTex: dfMultistepPromptTex(coeff, b, startOp, rhs),
      options: dfPackChoices(correct, wrongs),
    };
  }
  function dfBuildTransformQuestion() {
    const symDef = DF.SYM[dfRi(0, DF.SYM.length - 1)];
    const n = DF.NEGS[dfRi(0, DF.NEGS.length - 1)];
    const kind = Math.random() < 0.55 ? "mul" : "div";
    let val;
    if (kind === "div") {
      const k = dfRi(-4, 4) || 2;
      val = k * n;
    } else {
      val = dfRi(-9, 12);
      if (val === 0) val = 3;
    }
    const actionTex = kind === "mul"
      ? "\\times(" + n + ")"
      : "\\div(" + n + ")";
    const correct = dfSolve(symDef.start, val, kind, n);
    const wrongs = dfWrongs(symDef.start, val, correct, kind, n);
    return {
      type: "transform",
      startSym: symDef.start,
      val,
      kind,
      n,
      promptTex: "\\text{If }" + dfIneqTex(symDef.start, val) + "\\text{, after }" + actionTex + "\\text{ both sides:}",
      options: dfPackChoices(correct, wrongs),
    };
  }
  function dfUpdateMap() {
    const you = DF.els.mapYou;
    const pathEl = DF.els.mapPath;
    if (!you || !pathEl || typeof pathEl.getTotalLength !== "function") return;
    const len = pathEl.getTotalLength();
    const t = DF.goal ? Math.min(DF.progress / DF.goal, 1) : 0;
    const pt = pathEl.getPointAtLength(len * t);
    you.setAttribute("cx", String(Math.round(pt.x * 10) / 10));
    you.setAttribute("cy", String(Math.round(pt.y * 10) / 10));
  }
  function dfUpdateHud() {
    if (!DF.els.progress) return;
    DF.els.progress.textContent = DF.progress;
    dfUpdateHearts(false);
    dfUpdateMap();
    dfApplyStageTheme();
    dfUpdatePowerTags();
    dfUpdateHeroState();
    const pct = Math.min(DF.progress / DF.goal, 1) * 72;
    if (DF.els.charWrap) {
      DF.els.charWrap.style.setProperty("--hero-x", pct + "px");
      if (!DF.els.charWrap.classList.contains("dragged-down")) {
        DF.els.charWrap.style.transform = "translateX(" + pct + "px)";
      }
    }
  }
  function dfSetMsg(text, kind) {
    DF.els.msg.textContent = text;
    DF.els.msg.className = "door-msg" + (kind ? " " + kind : "");
  }
  function dfSetDoorsEnabled(on) {
    DF.els.doors.forEach((d) => {
      if (!d.btn.classList.contains("eliminated")) d.btn.disabled = !on;
    });
  }
  function dfClearDoorStyles() {
    DF.els.doors.forEach((d) => d.btn.classList.remove("correct", "wrong", "eliminated"));
  }
  function dfCorrectDoorId() {
    return DF.DOOR_IDS.find((id) => DF.q.options[id].correct);
  }
  function dfShowQuestion() {
    dfClearDrag();
    DF.q = dfMakeQuestion();
    dfClearDoorStyles();
    dfRenderTex(DF.els.prompt, DF.q.promptTex);
    DF.DOOR_IDS.forEach((id) => {
      const door = DF.els.doors.find((d) => d.id === id);
      const ans = DF.q.options[id].answer;
      dfRenderTex(door.ans, dfIneqTex(ans.sym, ans.val));
    });
    dfApplyFlashlight(DF.q);
    dfApplyStageTheme();
    dfSetDoorsEnabled(true);
    const st = DF.STAGES[dfGetStageIndex()];
    dfSetMsg(st.name + " \u2014 " + st.blurb, "");
  }
  function dfShowCheckpoint() {
    DF.atCheckpoint = true;
    DF.lock = true;
    dfSetDoorsEnabled(false);
    dfSaveProgress();
    const prev = DF.STAGES[Math.max(dfGetStageIndex() - 1, 0)];
    const next = DF.STAGES[dfGetStageIndex()];
    if (DF.els.checkpointMsg) {
      DF.els.checkpointMsg.textContent = prev.name + " complete! Progress saved at Door " + DF.progress + ". Rest before " + next.name + ".";
    }
    if (DF.els.checkpoint) DF.els.checkpoint.classList.remove("hidden");
    dfSetMsg("Safe camp reached \u2014 pick a power-up!", "ok");
  }
  function dfPickPower(power) {
    if (power === "shield") DF.shields += 1;
    else if (power === "flashlight") DF.flashlightReady = true;
    dfUpdatePowerTags();
    if (DF.els.checkpoint) DF.els.checkpoint.classList.add("hidden");
    DF.atCheckpoint = false;
    DF.lock = false;
    dfSaveProgress();
    dfShowQuestion();
  }
  function dfReset(hardReset) {
    if (hardReset) {
      DF.progress = 0; DF.lives = 3; DF.shields = 0; DF.flashlightReady = false;
      dfClearSave();
    } else if (!DF.active) {
      DF.progress = 0; DF.lives = 3; DF.shields = 0; DF.flashlightReady = false;
    }
    DF.over = false; DF.lock = false; DF.active = false; DF.atCheckpoint = false;
    if (DF.els.charWrap) {
      DF.els.charWrap.style.setProperty("--hero-x", "0px");
      DF.els.charWrap.style.transform = "translateX(0px)";
      dfResetHeroState();
    }
    if (DF.els.checkpoint) DF.els.checkpoint.classList.add("hidden");
    dfHideVictory();
    if (DF.els.continue) DF.els.continue.classList.toggle("hidden", !dfHasSave());
    dfUpdateHud();
    dfSetMsg("Three stages of 5 doors. Rest at safe camps after doors 5 & 10!", "");
    dfRenderTex(DF.els.prompt, "\\text{Ready? Press Begin Quest!}");
    DF.DOOR_IDS.forEach((id) => {
      const door = DF.els.doors.find((d) => d.id === id);
      dfRenderTex(door.ans, "\\text{?}");
    });
    dfSetDoorsEnabled(false);
    dfClearDoorStyles();
  }
  function dfStart() {
    dfReset(true);
    DF.active = true;
    DF.els.start.classList.add("hidden");
    DF.els.restart.classList.add("hidden");
    if (DF.els.continue) DF.els.continue.classList.add("hidden");
    dfShowQuestion();
  }
  function dfContinue() {
    if (!dfLoadSave()) { dfStart(); return; }
    DF.active = true;
    DF.over = false;
    DF.lock = false;
    DF.els.start.classList.add("hidden");
    DF.els.restart.classList.add("hidden");
    if (DF.els.continue) DF.els.continue.classList.add("hidden");
    dfUpdateHud();
    if (DF.atCheckpoint) dfShowCheckpoint();
    else dfShowQuestion();
  }
  function dfWin() {
    DF.lock = true;
    DF.active = false;
    DF.over = true;
    dfSetDoorsEnabled(false);
    dfClearSave();
    dfUpdateHud();
    if (DF.els.scene) DF.els.scene.classList.add("victory-mode", "stage-victory");
    if (DF.els.prompt) DF.els.prompt.textContent = "\uD83C\uDFE0\uD83C\uDF89 You Made It Home!";
    if (DF.els.sub) {
      DF.els.sub.textContent = "Brilliant work! All 15 doors cleared across the Dark Forest, Haunted Caves & Castle Gates.";
    }
    DF.els.doors.forEach((d) => d.btn.classList.add("correct"));
    if (DF.els.victoryConfetti) DF.els.victoryConfetti.classList.remove("hidden");
    if (DF.els.victoryBanner) DF.els.victoryBanner.classList.remove("hidden");
    if (DF.els.victoryAgain) DF.els.victoryAgain.classList.remove("hidden");
    if (DF.els.hudPlayAgain) DF.els.hudPlayAgain.classList.remove("hidden");
    dfApplyStageTheme();
    dfSetMsg("Quest complete \u2014 you should feel proud!", "ok");
  }
  function dfLose() {
    DF.lock = true;
    DF.active = false;
    DF.over = true;
    dfSetDoorsEnabled(false);
    dfUpdateHearts(false);
    if (DF.els.scene) DF.els.scene.classList.add("gameover-mode");
    if (DF.els.prompt) DF.els.prompt.textContent = "\uD83D\uDC80 Game Over";
    if (DF.els.sub) DF.els.sub.textContent = "No lives left \u2014 the wrong doors were too dangerous.";
    DF.els.doors.forEach((d) => {
      d.btn.classList.add("wrong");
      d.btn.classList.remove("correct");
    });
    if (DF.els.gameoverProgress) DF.els.gameoverProgress.textContent = DF.progress;
    if (DF.els.gameover) DF.els.gameover.classList.remove("hidden");
    DF.els.restart.classList.remove("hidden");
    if (DF.els.charWrap && !DF.els.charWrap.classList.contains("dragged-down")) {
      dfHeroDefeated();
    }
    dfSetMsg("Tip: multiply or divide by a negative \u2192 flip the inequality sign!", "bad");
  }
  function dfAfterAnswer(ok, doorId) {
    DF.lock = true;
    dfSetDoorsEnabled(false);
    const correctId = dfCorrectDoorId();
    const correctBtn = DF.els.doors.find((d) => d.id === correctId).btn;
    const wrongBtn = DF.els.doors.find((d) => d.id === doorId).btn;
    if (ok) {
      correctBtn.classList.add("correct");
      DF.progress += 1;
      dfUpdateHud();
      dfSetMsg("Correct! The safe door opens\u2026", "ok");
      if (DF.progress >= DF.goal) {
        setTimeout(dfWin, 700);
        return;
      }
      if (DF.CHECKPOINTS.includes(DF.progress)) {
        setTimeout(dfShowCheckpoint, 900);
        return;
      }
      setTimeout(() => { DF.lock = false; dfShowQuestion(); }, 900);
    } else {
      wrongBtn.classList.add("wrong");
      correctBtn.classList.add("correct");
      if (DF.shields > 0) {
        DF.shields -= 1;
        dfUpdatePowerTags();
        dfSetMsg("Shield blocked the danger! No life lost.", "ok");
        setTimeout(() => { DF.lock = false; dfShowQuestion(); }, 1100);
        return;
      }
      DF.lives -= 1;
      dfUpdateHud();
      dfUpdateHearts(true);
      const fatal = DF.lives <= 0;
      const dragMs = fatal ? DF.DRAG_FATAL_MS : DF.DRAG_PARTIAL_MS;
      dfSetMsg(fatal
        ? "Dragged into the wrong door \u2014 no lives left!"
        : "Wrong door \u2014 chains yanked you! Remember to flip the sign.", "bad");
      setTimeout(() => dfHeroDrag(doorId, fatal), 250);
      if (fatal) {
        setTimeout(dfLose, 250 + dragMs + 200);
        return;
      }
      setTimeout(() => {
        dfClearDrag();
        dfUpdateHeroState();
        DF.lock = false;
        dfShowQuestion();
      }, 250 + dragMs + 150);
    }
  }
  function dfChoose(doorId) {
    if (!DF.active || DF.lock || DF.over || DF.atCheckpoint) return;
    const door = DF.els.doors.find((d) => d.id === doorId);
    if (door && door.btn.classList.contains("eliminated")) return;
    dfAfterAnswer(DF.q.options[doorId].correct, doorId);
  }
  function dfOnKey(e) {
    const panel = document.getElementById("game-doors");
    if (!panel || panel.classList.contains("hidden")) return;
    const doorId = DF.KEY_MAP[e.code];
    if (!doorId) return;
    e.preventDefault();
    if (!DF.active && !DF.over) dfStart();
    else dfChoose(doorId);
  }
  function dfMount() {
    if (DF.mounted) return;
    DF.els = {
      progress: document.getElementById("df-progress"),
      lives: document.getElementById("df-lives"),
      livesPill: document.getElementById("df-lives-pill"),
      hearts: document.getElementById("df-hearts"),
      gameover: document.getElementById("df-gameover"),
      gameoverProgress: document.getElementById("df-gameover-progress"),
      gameoverRetry: document.getElementById("df-gameover-retry"),
      scene: document.getElementById("df-scene"),
      stagePill: document.getElementById("df-stage-pill"),
      shieldTag: document.getElementById("df-shield-tag"),
      flashTag: document.getElementById("df-flash-tag"),
      checkpoint: document.getElementById("df-checkpoint"),
      checkpointMsg: document.getElementById("df-checkpoint-msg"),
      sub: document.getElementById("df-sub"),
      victoryConfetti: document.getElementById("df-victory-confetti"),
      victoryBanner: document.getElementById("df-victory-banner"),
      victoryAgain: document.getElementById("df-victory-again"),
      hudPlayAgain: document.getElementById("df-hud-play-again"),
      mapPath: document.getElementById("df-map-path"),
      mapYou: document.getElementById("df-map-you"),
      prompt: document.getElementById("df-prompt"),
      charWrap: document.getElementById("df-char-wrap"),
      msg: document.getElementById("df-msg"),
      start: document.getElementById("df-start"),
      continue: document.getElementById("df-continue"),
      restart: document.getElementById("df-restart"),
      doors: DF.DOOR_IDS.map((id) => ({
        id,
        btn: document.getElementById("df-door-" + id),
        ans: document.getElementById("df-ans-" + id),
      })),
    };
    DF.els.start.addEventListener("click", dfStart);
    if (DF.els.continue) DF.els.continue.addEventListener("click", dfContinue);
    if (DF.els.checkpoint) {
      DF.els.checkpoint.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-power]");
        if (btn) dfPickPower(btn.dataset.power);
      });
    }
    if (DF.els.victoryAgain) DF.els.victoryAgain.addEventListener("click", dfPlayAgain);
    if (DF.els.hudPlayAgain) DF.els.hudPlayAgain.addEventListener("click", dfPlayAgain);
    if (DF.els.gameoverRetry) {
      DF.els.gameoverRetry.addEventListener("click", () => {
        dfHideGameOver();
        dfStart();
      });
    }
    DF.els.restart.addEventListener("click", () => {
      DF.els.restart.classList.add("hidden");
      DF.els.start.classList.remove("hidden");
      dfReset(true);
    });
    DF.els.doors.forEach((d) => d.btn.addEventListener("click", () => dfChoose(d.id)));
    window.addEventListener("keydown", dfOnKey);
    dfReset();
    DF.mounted = true;
  }

  function init() {
    if (!document.getElementById("game-doors")) return;
    dfMount();
  }

  if (window.katex) window.addEventListener("DOMContentLoaded", init);
  else window.addEventListener("DOMContentLoaded", function () {
    (function wait() { if (window.katex) init(); else setTimeout(wait, 30); })();
  });

  window.SignFlipDoors = { mount: dfMount, reset: function () { dfReset(true); } };
})();
