/* Inequality quiz — paginated MC (10), progress bar, submit on last → all results */
(function () {
  "use strict";

  const QUIZ = [
    {
      id: 1,
      type: "mc",
      prompt: "Find the sum of all the negative integers x satisfying the inequality",
      stem: "x > -2\\pi",
      choices: ["-21\\pi", "-21", "-5", "0"],
      answer: 1,
    },
    {
      id: 2,
      type: "mc",
      prompt: "If 2x \u2264 3, which of the following is not true?",
      choices: [
        "4x \\le 2x + 3",
        "1 - 2x \\le -2",
        "2x + 3 \\le 6",
        "\\frac{2x}{3} \\le 1",
      ],
      answer: 1,
    },
    {
      id: 3,
      type: "mc",
      prompt: "If x \u2264 y and z > y, where z is a negative number, which of the following is not true?",
      choices: [
        "x \\le y < z",
        "y - x < z - x",
        "xz < xy",
        "-\\frac{x}{4} < -\\frac{z}{4}",
      ],
      answer: 3,
    },
    {
      id: 4,
      type: "mc",
      prompt: "Solve the inequality",
      stem: "3(x + 2) < 5(6 - x)",
      choices: ["x > 3", "x < 3", "x > -3", "x < -3"],
      answer: 1,
    },
    {
      id: 5,
      type: "mc",
      prompt: "Which of the following groups of numbers can all satisfy the inequality",
      stem: "7x + 3 > 17",
      choices: [
        "-1,\\; 0,\\; 1",
        "1,\\; 3,\\; 5",
        "2,\\; 3,\\; 4",
        "2.1,\\; 3.2,\\; 4.3",
      ],
      answer: 3,
    },
    {
      id: 6,
      type: "mc",
      prompt: "Solve the inequality",
      stem: "\\frac{x}{4} - 2 \\le 0.8 - \\frac{x}{3}",
      choices: ["x > \\frac{24}{5}", "x \\le \\frac{24}{5}", "x \\le 5", "x \\ge 4.8"],
      answer: 1,
    },
    {
      id: 7,
      type: "mc",
      prompt: "Write down all positive integers satisfying",
      stem: "x \\le \\frac{24}{5}",
      choices: [
        "1,\\; 2,\\; 3,\\; 4",
        "1,\\; 2,\\; 3,\\; 4,\\; 5",
        "1,\\; 2,\\; 3",
        "2,\\; 3,\\; 4",
      ],
      answer: 0,
    },
    {
      id: 8,
      type: "mc",
      prompt: "Write down all positive integers satisfying the inequality",
      stem: "\\frac{4x + 3}{5} < \\frac{1 - 3x}{6} + 4",
      choices: [
        "1,\\; 2",
        "1,\\; 2,\\; 3",
        "1 \\text{ only}",
        "2,\\; 3",
      ],
      answer: 0,
    },
    {
      id: 9,
      type: "mc",
      prompt: "A non-negative number x satisfies the equation below, where k is a positive integral constant. How many possible values of k?",
      stem: "\\frac{2x-k}{3} = \\frac{5x-7}{4} + \\frac{x+k}{6}",
      choices: ["1", "2", "3", "4"],
      answer: 2,
    },
    {
      id: 10,
      type: "mc",
      prompt: "Using the same equation as above, find x when k = 3.",
      stem: "\\frac{2x-k}{3} = \\frac{5x-7}{4} + \\frac{x+k}{6}",
      choices: ["x = \\frac{1}{3}", "x = -\\frac{1}{3}", "x = \\frac{7}{3}", "x = 3"],
      answer: 0,
    },
  ];

  const SYMBOLS = [
    { label: "x", insert: "x" },
    { label: "y", insert: "y" },
    { label: "z", insert: "z" },
    { label: "k", insert: "k" },
    { label: "π", insert: "\\pi" },
    { label: "≤", insert: "\\le" },
    { label: "≥", insert: "\\ge" },
    { label: "<", insert: "<" },
    { label: ">", insert: ">" },
    { label: "≤ frac", insert: "\\frac{}{}" },
    { label: "+", insert: "+" },
    { label: "−", insert: "-" },
    { label: "=", insert: "=" },
    { label: ",", insert: ", " },
    { label: "(", insert: "(" },
    { label: ")", insert: ")" },
  ];

  function prepTex(tex, mode) {
    let t = String(tex).replace(/\\frac\{/g, "\\dfrac{");
    if (mode === "block" && !t.includes("\\displaystyle")) {
      t = "\\displaystyle " + t;
    }
    return t;
  }

  function kx(el, tex, display) {
    const mode = display ? "block" : "inline";
    try {
      katex.render(prepTex(tex, mode), el, { throwOnError: false, displayMode: !!display });
    } catch (e) { el.textContent = tex; }
  }

  function partKey(qid, tag) { return qid + "-" + tag; }

  function normalizeTex(s) {
    return String(s || "")
      .replace(/\u2212/g, "-")
      .replace(/\u2013/g, "-")
      .replace(/\s+/g, "")
      .replace(/\\leq/g, "\\le")
      .replace(/\\geq/g, "\\ge")
      .replace(/≤/g, "\\le")
      .replace(/≥/g, "\\ge")
      .toLowerCase();
  }

  function parseIntList(s) {
    const t = String(s || "")
      .replace(/\band\b/gi, ",")
      .replace(/\u2212/g, "-")
      .replace(/;/g, ",");
    const nums = t.match(/-?\d+(?:\.\d+)?/g);
    if (!nums) return null;
    return nums.map(Number).sort((a, b) => a - b);
  }

  function intListsEqual(a, b) {
    const pa = parseIntList(a);
    const pb = parseIntList(b);
    if (!pa || !pb || pa.length !== pb.length) return false;
    return pa.every((v, i) => v === pb[i]);
  }

  function fracToDecimal(tex) {
    const m = tex.match(/\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}/);
    if (!m) return null;
    const den = +m[2];
    if (!den) return null;
    return +m[1] / den;
  }

  function ineqBound(tex) {
    const n = normalizeTex(tex);
    const m = n.match(/^x([<>]|\\le|\\ge|\\leq|\\geq)(.+)$/);
    if (!m) return null;
    let op = m[1].replace("\\leq", "\\le").replace("\\geq", "\\ge");
    let val = m[2];
    const dec = fracToDecimal(val);
    if (dec != null) val = String(dec);
    else val = val.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, (_, a, b) => String(+a / +b));
    return op + val;
  }

  function equivIneq(a, b) {
    if (normalizeTex(a) === normalizeTex(b)) return true;
    const ia = ineqBound(a);
    const ib = ineqBound(b);
    if (ia && ib && ia === ib) return true;
    return false;
  }

  function equivCount(a, b) {
    const na = normalizeTex(a).replace(/values?/g, "");
    const nb = normalizeTex(b);
    if (na === nb) return true;
    const da = na.match(/\d+/);
    const db = nb.match(/\d+/);
    if (da && db && da[0] === db[0]) {
      const list = parseIntList(a);
      if (list && list.length === +da[0]) return true;
    }
    return false;
  }

  function checkPart(part, ans) {
    if (ans == null || String(ans).trim() === "") return false;
    const targets = [part.answer].concat(part.accept || []);
    return targets.some((t) => {
      if (intListsEqual(ans, t)) return true;
      if (equivIneq(ans, t)) return true;
      if (equivCount(ans, t)) return true;
      return normalizeTex(ans) === normalizeTex(t);
    });
  }

  function checkQuestion(q, answers) {
    if (q.type === "mc") return answers[q.id] === q.answer;
    if (q.parts) {
      return q.parts.every((p) => checkPart(p, answers[partKey(q.id, p.tag)]));
    }
    return checkPart({ answer: q.answer, accept: q.accept }, answers[q.id]);
  }

  function initQuiz() {
    const root = document.getElementById("quiz-root");
    const progressWrap = document.getElementById("quiz-progress-wrap");
    const progressLabel = document.getElementById("quiz-progress-label");
    const progressFill = document.getElementById("quiz-progress-fill");
    const progressOk = document.getElementById("quiz-progress-ok");
    const progressBad = document.getElementById("quiz-progress-bad");
    const backBtn = document.getElementById("quiz-back");
    const nextBtn = document.getElementById("quiz-next");
    if (!root || !nextBtn) return;

    const state = {
      index: 0,
      answers: {},
      submitted: false,
      phase: "quiz",
      activeInputId: null,
    };

    function saveCurrentShort() {
      const q = QUIZ[state.index];
      if (!q || q.type !== "short") return;
      if (q.parts) {
        q.parts.forEach((p) => {
          const ta = document.getElementById("quiz-input-" + partKey(q.id, p.tag));
          if (ta) state.answers[partKey(q.id, p.tag)] = ta.value;
        });
      } else {
        const ta = document.getElementById("quiz-input-" + q.id);
        if (ta) state.answers[q.id] = ta.value;
      }
    }

    function updateProgress() {
      if (!progressWrap) return;
      if (state.phase === "review") {
        progressWrap.classList.add("done");
        if (progressLabel) progressLabel.textContent = "Results";
        const total = QUIZ.length;
        const score = QUIZ.filter((q) => checkQuestion(q, state.answers)).length;
        const okShare = total ? score / total : 0;
        const badShare = total ? (total - score) / total : 0;
        if (progressFill) {
          progressFill.style.width = "100%";
          progressFill.style.background = "transparent";
        }
        if (progressOk) progressOk.style.width = Math.round(okShare * 100) + "%";
        if (progressBad) progressBad.style.width = Math.round(badShare * 100) + "%";
        return;
      }
      progressWrap.classList.remove("done");
      const n = QUIZ.length;
      const cur = state.index + 1;
      if (progressLabel) progressLabel.textContent = "Question " + cur + " of " + n;
      if (progressFill) {
        progressFill.style.width = Math.round((cur / n) * 100) + "%";
        progressFill.style.background = "";
      }
      if (progressOk) progressOk.style.width = "0%";
      if (progressBad) progressBad.style.width = "0%";
    }

    function updateNav() {
      const last = state.index >= QUIZ.length - 1;
      if (state.phase === "review") {
        if (backBtn) backBtn.classList.add("hidden");
        nextBtn.textContent = "Try again";
        nextBtn.classList.add("retry");
        return;
      }
      nextBtn.classList.remove("retry");
      if (backBtn) backBtn.classList.toggle("hidden", state.index === 0);
      nextBtn.textContent = last ? "Submit" : "Next";
    }

    function render() {
      saveCurrentShort();
      root.innerHTML = "";
      updateProgress();
      updateNav();
      if (state.phase === "review") {
        renderReview();
        return;
      }
      const q = QUIZ[state.index];
      if (q) root.appendChild(buildCard(q, false));
    }

    function buildCard(q, reviewMode) {
      const card = document.createElement("article");
      card.className = "quiz-card" + (reviewMode ? " quiz-card-review" : "");
      const ok = checkQuestion(q, state.answers);

      const head = document.createElement("div");
      head.className = "quiz-head";
      const num = document.createElement("span");
      num.className = "quiz-num";
      num.textContent = q.id + ".";
      head.appendChild(num);
      if (reviewMode) {
        const mark = document.createElement("span");
        mark.className = "quiz-mark " + (ok ? "ok" : "bad");
        mark.textContent = ok ? "\u2713" : "\u2717";
        head.appendChild(mark);
      }
      card.appendChild(head);

      const content = document.createElement("div");
      content.className = "quiz-content";
      if (q.prompt || q.stem) {
        const stem = document.createElement("div");
        stem.className = "quiz-stem";
        if (q.prompt) {
          const line = document.createElement("p");
          line.className = "quiz-stem-line";
          line.textContent = q.prompt;
          stem.appendChild(line);
        }
        if (q.stem) {
          const line = document.createElement("p");
          line.className = "quiz-stem-line quiz-stem-math";
          kx(line, q.stem, true);
          stem.appendChild(line);
        }
        content.appendChild(stem);
      }
      if (q.items) {
        const list = document.createElement("div");
        list.className = "quiz-item-list";
        q.items.forEach((item) => {
          const row = document.createElement("div");
          row.className = "quiz-item-row";
          const tag = document.createElement("span");
          tag.className = "quiz-item-tag";
          tag.textContent = item.tag;
          row.appendChild(tag);
          const tex = document.createElement("span");
          tex.className = "quiz-item-tex";
          kx(tex, item.tex);
          row.appendChild(tex);
          list.appendChild(row);
        });
        content.appendChild(list);
      }
      const body = document.createElement("div");
      body.className = "quiz-body";
      if (q.type === "mc") body.appendChild(buildMc(q, reviewMode));
      else if (q.parts) body.appendChild(buildShortParts(q, reviewMode));
      else body.appendChild(buildShortSingle(q, reviewMode));
      content.appendChild(body);

      if (q.figures && q.figures.length) {
        const main = document.createElement("div");
        main.className = "quiz-main";
        main.appendChild(content);
        main.appendChild(buildFigures(q.figures));
        card.appendChild(main);
      } else {
        card.appendChild(content);
      }

      if (reviewMode && !ok) card.appendChild(buildCorrectBlock(q));
      return card;
    }

    function buildCorrectBlock(q) {
      const block = document.createElement("div");
      block.className = "quiz-result";
      if (q.parts) {
        q.parts.forEach((p) => {
          if (checkPart(p, state.answers[partKey(q.id, p.tag)])) return;
          const row = document.createElement("div");
          row.className = "quiz-part-result";
          const lbl = document.createElement("span");
          lbl.className = "quiz-part-result-lbl";
          lbl.textContent = "(" + p.tag + ") ";
          row.appendChild(lbl);
          const ans = document.createElement("span");
          ans.className = "quiz-ans-tex";
          kx(ans, p.answer);
          row.appendChild(ans);
          block.appendChild(row);
        });
      } else if (q.type === "mc") {
        const msg = document.createElement("span");
        msg.className = "quiz-result-msg";
        msg.textContent = "Correct answer: ";
        const ans = document.createElement("span");
        ans.className = "quiz-ans-tex";
        kx(ans, q.choices[q.answer]);
        msg.appendChild(ans);
        block.appendChild(msg);
      } else {
        const msg = document.createElement("span");
        msg.className = "quiz-result-msg";
        msg.textContent = "Correct answer: ";
        const ans = document.createElement("span");
        ans.className = "quiz-ans-tex";
        kx(ans, q.answer);
        msg.appendChild(ans);
        block.appendChild(msg);
      }
      return block;
    }

    function buildFigures(figs) {
      const wrap = document.createElement("div");
      wrap.className = "quiz-figure" + (figs.length > 1 ? " quiz-figure-stack" : "");
      figs.forEach((fig) => {
        const img = document.createElement("img");
        img.src = fig.src;
        img.alt = fig.alt || "Figure";
        img.loading = "lazy";
        wrap.appendChild(img);
      });
      return wrap;
    }

    function buildMc(q, reviewMode) {
      const list = document.createElement("div");
      list.className = "quiz-mc";
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      q.choices.forEach((tex, i) => {
        const label = document.createElement("label");
        label.className = "quiz-mc-opt";
        if (reviewMode) label.classList.add("locked");
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = reviewMode ? "review-q-" + q.id : "q-" + q.id;
        inp.value = String(i);
        inp.disabled = reviewMode;
        if (state.answers[q.id] === i) inp.checked = true;
        if (!reviewMode) inp.addEventListener("change", () => { state.answers[q.id] = i; });
        label.appendChild(inp);
        const letter = document.createElement("span");
        letter.className = "quiz-mc-letter";
        letter.textContent = letters[i] + ".";
        label.appendChild(letter);
        const math = document.createElement("span");
        math.className = "quiz-mc-tex";
        kx(math, tex, false);
        label.appendChild(math);
        if (reviewMode) {
          if (i === q.answer) label.classList.add("reveal-ok");
          if (state.answers[q.id] === i && i !== q.answer) label.classList.add("reveal-bad");
        }
        list.appendChild(label);
      });
      return list;
    }

    function buildSymBar() {
      const toolbar = document.createElement("div");
      toolbar.className = "quiz-sym-bar";
      SYMBOLS.forEach((sym) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-sym-btn";
        btn.textContent = sym.label;
        btn.title = sym.insert;
        btn.addEventListener("click", () => insertIntoActive(sym.insert));
        toolbar.appendChild(btn);
      });
      return toolbar;
    }

    function buildShortParts(q, reviewMode) {
      const wrap = document.createElement("div");
      wrap.className = "quiz-short-wrap";
      if (!reviewMode) wrap.appendChild(buildSymBar());
      q.parts.forEach((p) => {
        const key = partKey(q.id, p.tag);
        const partOk = checkPart(p, state.answers[key]);
        const block = document.createElement("div");
        block.className = "quiz-part";
        const head = document.createElement("div");
        head.className = "quiz-part-head";
        const lbl = document.createElement("span");
        lbl.className = "quiz-part-label";
        lbl.textContent = "(" + p.tag + ")";
        head.appendChild(lbl);
        if (reviewMode) {
          const mark = document.createElement("span");
          mark.className = "quiz-mark quiz-part-mark " + (partOk ? "ok" : "bad");
          mark.textContent = partOk ? "\u2713" : "\u2717";
          head.appendChild(mark);
        }
        block.appendChild(head);
        const stem = document.createElement("div");
        stem.className = "quiz-part-stem";
        kx(stem, p.stem);
        block.appendChild(stem);
        if (reviewMode) {
          const yours = document.createElement("div");
          yours.className = "quiz-yours";
          const yl = document.createElement("span");
          yl.className = "quiz-yours-lbl";
          yl.textContent = "Your answer: ";
          yours.appendChild(yl);
          const tex = document.createElement("span");
          tex.className = "quiz-ans-tex";
          kx(tex, String(state.answers[key] || "").trim() || "\\text{(blank)}");
          yours.appendChild(tex);
          block.appendChild(yours);
        } else {
          const ta = document.createElement("textarea");
          ta.className = "quiz-short-input";
          ta.id = "quiz-input-" + key;
          ta.rows = 2;
          ta.placeholder = "Answer for (" + p.tag + ")\u2026";
          ta.value = state.answers[key] || "";
          ta.addEventListener("focus", () => { state.activeInputId = ta.id; });
          ta.addEventListener("input", () => {
            state.answers[key] = ta.value;
            updatePreview(key, ta.value);
          });
          block.appendChild(ta);
          const preview = document.createElement("div");
          preview.className = "quiz-preview";
          preview.id = "quiz-preview-" + key;
          block.appendChild(preview);
          updatePreview(key, ta.value);
        }
        wrap.appendChild(block);
      });
      return wrap;
    }

    function buildShortSingle(q, reviewMode) {
      const wrap = document.createElement("div");
      wrap.className = "quiz-short-wrap";
      const key = String(q.id);
      if (!reviewMode) wrap.appendChild(buildSymBar());
      if (reviewMode) {
        const yours = document.createElement("div");
        yours.className = "quiz-yours";
        const lbl = document.createElement("span");
        lbl.className = "quiz-yours-lbl";
        lbl.textContent = "Your answer: ";
        yours.appendChild(lbl);
        const tex = document.createElement("span");
        tex.className = "quiz-ans-tex";
        kx(tex, String(state.answers[key] || "").trim() || "\\text{(blank)}");
        yours.appendChild(tex);
        wrap.appendChild(yours);
      } else {
        const ta = document.createElement("textarea");
        ta.className = "quiz-short-input";
        ta.id = "quiz-input-" + key;
        ta.rows = 2;
        ta.placeholder = "Type LaTeX or use buttons above\u2026";
        ta.value = state.answers[key] || "";
        ta.addEventListener("focus", () => { state.activeInputId = ta.id; });
        ta.addEventListener("input", () => {
          state.answers[key] = ta.value;
          updatePreview(key, ta.value);
        });
        wrap.appendChild(ta);
        const preview = document.createElement("div");
        preview.className = "quiz-preview";
        preview.id = "quiz-preview-" + key;
        wrap.appendChild(preview);
        updatePreview(key, ta.value);
      }
      return wrap;
    }

    function renderReview() {
      const score = QUIZ.filter((q) => checkQuestion(q, state.answers)).length;
      const header = document.createElement("div");
      header.className = "quiz-review-header";
      const h2 = document.createElement("h2");
      h2.textContent = score + " / " + QUIZ.length + " correct";
      header.appendChild(h2);
      root.appendChild(header);
      QUIZ.forEach((q) => root.appendChild(buildCard(q, true)));
    }

    function insertIntoActive(text) {
      if (state.submitted || state.phase === "review") return;
      const id = state.activeInputId;
      if (!id) return;
      const ta = document.getElementById(id);
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      let ins = text;
      if (text === "\\frac{}{}") {
        ta.value = val.slice(0, start) + "\\frac{}{}" + val.slice(end);
        ta.setSelectionRange(start + 6, start + 6);
      } else {
        ta.value = val.slice(0, start) + ins + val.slice(end);
        ta.setSelectionRange(start + ins.length, start + ins.length);
      }
      const key = id.replace("quiz-input-", "");
      state.answers[key] = ta.value;
      updatePreview(key, ta.value);
      ta.focus();
    }

    function updatePreview(key, tex) {
      const el = document.getElementById("quiz-preview-" + key);
      if (!el) return;
      el.innerHTML = "";
      if (!tex || !tex.trim()) {
        el.textContent = "Preview";
        el.classList.add("empty");
        return;
      }
      el.classList.remove("empty");
      kx(el, tex.trim());
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (state.phase === "review") return;
        saveCurrentShort();
        if (state.index > 0) {
          state.index--;
          render();
        }
      });
    }

    nextBtn.addEventListener("click", () => {
      if (state.phase === "review") {
        state.index = 0;
        state.answers = {};
        state.submitted = false;
        state.phase = "quiz";
        state.activeInputId = null;
        render();
        return;
      }
      saveCurrentShort();
      if (state.index >= QUIZ.length - 1) {
        state.submitted = true;
        state.phase = "review";
        try {
          QUIZ.forEach(function(q) {
            var userAnswerIdx = state.answers[q.id];
            var isCorrect = checkQuestion(q, state.answers);
            var payload = {
              type: 'uniplus:quizAnswer',
              subject: 'MATH',
              quizId: 'math-inequality',
              questionId: 'ineq-q' + q.id,
              section: 'inequality',
              difficulty: 'standard',
              stem: q.stem || null,
              selectedAnswer: userAnswerIdx !== undefined ? String(userAnswerIdx) : null,
              selectedAnswerText: (q.type === 'mc' && userAnswerIdx !== undefined) ? (q.choices[userAnswerIdx] || null) : null,
              correctAnswer: q.type === 'mc' ? String(q.answer) : (q.answer || null),
              correctAnswerText: q.type === 'mc' ? (q.choices[q.answer] || null) : (q.answer || null),
              isCorrect: isCorrect,
              attemptNumber: 1,
              msTaken: 0
            };
            // Send to the immediate parent (dashboard/index.html, where the tracker
            // and session relay live). window.postMessage() alone only targets this
            // same window and never reaches the tracker in the outer frame.
            window.parent.postMessage(payload, '*');
            if (window.top !== window.parent) {
              try { window.top.postMessage(payload, '*'); } catch (_) {}
            }
          });
        } catch(_) {}
        render();
        return;
      }
      state.index++;
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuiz);
  } else {
    initQuiz();
  }
})();
