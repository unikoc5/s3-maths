/* Law of Indices quiz — paginated MC, progress bar, submit on last → all results */
(function () {
  "use strict";

  const QUIZ_L01 = [
    {
      id: 1,
      type: "mc",
      prompt: "Evaluate",
      stem: "5^{-2}",
      choices: [
        "\\frac{-1}{25}",
        "\\frac{1}{25}",
        "-25",
        "25",
      ],
      answer: 1,
    },
    {
      id: 2,
      type: "mc",
      prompt: "Simplify",
      stem: "\\left(5x^{4}y\\right)^{3}",
      choices: [
        "15x^{4}y^{3}",
        "15x^{7}y^{3}",
        "125x^{7}y^{3}",
        "125x^{12}y^{3}",
      ],
      answer: 3,
    },
    {
      id: 3,
      type: "mc",
      prompt: "Simplify",
      stem: "\\frac{a^{10}}{a^{-5}}",
      choices: [
        "\\frac{1}{a^{2}}",
        "a^{-2}",
        "a^{-5}",
        "a^{15}",
      ],
      answer: 3,
    },
    {
      id: 4,
      type: "mc",
      prompt: "If x > 1, which of the following must be true?",
      items: [
        { tag: "I.", tex: "\\left(x^{2}\\right)^{0} = 0" },
        { tag: "II.", tex: "\\left(x^{5}\\right)^{-2} = \\frac{1}{x^{10}}" },
        { tag: "III.", tex: "x^{3-2} \\times x^{6} = \\frac{1}{x}" },
      ],
      choices: [
        "\\text{I only}",
        "\\text{II only}",
        "\\text{I and III only}",
        "\\text{II and III only}",
      ],
      answer: 1,
    },
    {
      id: 5,
      type: "mc",
      prompt: "Simplify",
      stem: "\\frac{\\left(x^{-1}y^{-2}\\right)^{4}}{y^{-3}}",
      choices: [
        "x^{3}y^{10}",
        "\\frac{1}{x^{4}y^{5}}",
        "\\frac{x^{3}}{y^{10}}",
        "\\frac{y^{2}}{x}",
      ],
      answer: 1,
    },
  ];

  const QUIZ_L02 = [
    {
      id: 1,
      type: "mc",
      prompt: "Express in scientific notation",
      stem: "0.000\\,073\\,09",
      choices: [
        "7.309 \\times 10^{-5}",
        "7.309 \\times 10^{-6}",
        "73.09 \\times 10^{-5}",
        "73.09 \\times 10^{-6}",
      ],
      answer: 0,
    },
    {
      id: 2,
      type: "mc",
      prompt: "The length of the longest bridge in the world is about 16 490 000 cm. Express the length in scientific notation.",
      choices: [
        "1.649 \\times 10^{6}\\text{ cm}",
        "16.49 \\times 10^{6}\\text{ cm}",
        "1.649 \\times 10^{7}\\text{ cm}",
        "16.49 \\times 10^{7}\\text{ cm}",
      ],
      answer: 2,
    },
    {
      id: 3,
      type: "mc",
      prompt: "Evaluate",
      stem: "2.74 \\times 10^{-6} + 9.05 \\times 10^{-5}",
      choices: [
        "1.179 \\times 10^{-11}",
        "1.179 \\times 10^{-6}",
        "9.324 \\times 10^{-6}",
        "9.324 \\times 10^{-5}",
      ],
      answer: 3,
    },
    {
      id: 4,
      type: "mc",
      prompt: "Which of the following numbers is the smallest?",
      choices: [
        "-7.9 \\times 10^{-11}",
        "7.9 \\times 10^{-11}",
        "-7.9 \\times 10^{11}",
        "7.9 \\times 10^{11}",
      ],
      answer: 2,
    },
    {
      id: 5,
      type: "mc",
      prompt: "The speed of light is 3 \u00d7 10\u2075 km/s and the speed of sound is 300 m/s. The speed of light is how many times the speed of sound?",
      choices: [
        "10^{7}",
        "10^{6}",
        "10^{5}",
        "10^{4}",
      ],
      answer: 1,
    },
  ];

  const QUIZ_L03 = [
    {
      id: 1,
      type: "mc",
      prompt: "What is the place value of the digit 0 in",
      stem: "110111_{2}",
      choices: [
        "4",
        "6",
        "8",
        "16",
      ],
      answer: 2,
    },
    {
      id: 2,
      type: "mc",
      prompt: "Convert into a denary number",
      stem: "10111_{2}",
      choices: [
        "7_{10}",
        "23_{10}",
        "33_{10}",
        "47_{10}",
      ],
      answer: 1,
    },
    {
      id: 3,
      type: "mc",
      prompt: "Convert into a binary number",
      stem: "28_{10}",
      choices: [
        "10101_{2}",
        "11001_{2}",
        "11011_{2}",
        "11100_{2}",
      ],
      answer: 3,
    },
    {
      id: 4,
      type: "mc",
      prompt: "Which of the following numbers lies between",
      stem: "11001110_{2}\\quad\\text{and}\\quad 208_{10}",
      choices: [
        "98_{10}",
        "156_{10}",
        "207_{10}",
        "310_{10}",
      ],
      answer: 2,
    },
    {
      id: 5,
      type: "mc",
      prompt: "Write the following denary number as a binary number",
      stem: "2^{9} + 2^{6} + 5 \\times 2^{3}",
      choices: [
        "100110010_{2}",
        "100110100_{2}",
        "1001100100_{2}",
        "1001101000_{2}",
      ],
      answer: 3,
    },
  ];

  const QUIZ_SETS = [
    { key: "l01", label: "L01 \u00b7 Zero and Negative Indices", idPrefix: "loi-l01-q", questions: QUIZ_L01 },
    { key: "l02", label: "L02 \u00b7 Scientific Notation", idPrefix: "loi-l02-q", questions: QUIZ_L02 },
    { key: "l03", label: "L03 \u00b7 Binary Numbers", idPrefix: "loi-l03-q", questions: QUIZ_L03 },
  ];

  let activeSet = QUIZ_SETS[0];
  let QUIZ = activeSet.questions;

  const SYMBOLS = [
    { label: "x", insert: "x" },
    { label: "y", insert: "y" },
    { label: "a", insert: "a" },
    { label: "b", insert: "b" },
    { label: "n", insert: "n" },
    { label: "p", insert: "p" },
    { label: "q", insert: "q" },
    { label: "u", insert: "u" },
    { label: "v", insert: "v" },
    { label: "z", insert: "z" },
    { label: "x²", insert: "x^2" },
    { label: "y²", insert: "y^2" },
    { label: "()²", insert: "()^2" },
    { label: "^", insert: "^{}" },
    { label: "+", insert: "+" },
    { label: "−", insert: "-" },
    { label: "(", insert: "(" },
    { label: ")", insert: ")" },
    { label: "α", insert: "\\alpha" },
    { label: "β", insert: "\\beta" },
    { label: "γ", insert: "\\gamma" },
  ];

  function kx(el, tex) {
    try { katex.render(tex, el, { throwOnError: false, displayMode: false }); }
    catch (e) { el.textContent = tex; }
  }

  function partKey(qid, tag) { return qid + "-" + tag; }

  function normalizeTex(s) {
    return String(s || "")
      .replace(/\u2212/g, "-")
      .replace(/\u2013/g, "-")
      .replace(/\s+/g, "")
      .replace(/\\cdot/g, "")
      .replace(/\\times/g, "")
      .replace(/\*/g, "")
      .toLowerCase();
  }

  // Flip (a-b) ↔ (b-a) for squared-binomial matching, e.g. (3u-5v)^2 ≡ (5v-3u)^2
  function binomialTerms(inner) {
    if (/^[+-]/.test(inner)) {
      const first = inner.match(/^([+-][^+-]+)/);
      const rest = inner.slice(first[1].length);
      return [first[1]].concat(rest.match(/[+-][^+-]+/g) || []);
    }
    const m = inner.match(/^([^+-]+)([+-].+)?$/);
    if (!m) return [inner];
    const out = [m[1]];
    if (m[2]) out.push(...m[2].match(/[+-][^+-]+/g) || []);
    return out;
  }

  function flipBinomial(inner) {
    const terms = binomialTerms(inner);
    if (terms.length !== 2) return inner;
    const norm = (t) => (t[0] === "+" || t[0] === "-" ? t : "+" + t);
    const flipSign = (t) => (t[0] === "-" ? "+" : "-") + t.slice(1);
    const a = norm(terms[0]);
    const b = norm(terms[1]);
    return flipSign(b).replace(/^\+/, "") + flipSign(a);
  }

  function canonicalSquaredFactor(fac) {
    const m = fac.match(/^\(([^()]+)\)\^2$/);
    if (!m) return fac;
    const inner = m[1];
    const flipped = flipBinomial(inner);
    const key = [inner, flipped].sort().join("|");
    return "sq(" + key + ")";
  }

  function parseFactorProduct(s) {
    const n = normalizeTex(s);
    if (!n) return null;
    let scalar = "1";
    let rest = n;
    const sm = rest.match(/^(-?\d+)(?=\()/);
    if (sm) {
      scalar = sm[1];
      rest = rest.slice(sm[0].length);
    }
    const factors = [];
    while (rest.length) {
      if (rest[0] !== "(") return null;
      let depth = 0;
      let j = 0;
      for (; j < rest.length; j++) {
        if (rest[j] === "(") depth++;
        else if (rest[j] === ")") {
          depth--;
          if (!depth) { j++; break; }
        }
      }
      let fac = rest.slice(0, j);
      rest = rest.slice(j);
      if (rest.startsWith("^2")) {
        fac += "^2";
        rest = rest.slice(2);
      }
      factors.push(canonicalSquaredFactor(fac));
    }
    if (rest.length) return null;
    factors.sort();
    return scalar + "::" + factors.join("|");
  }

  function equivTex(a, b) {
    if (normalizeTex(a) === normalizeTex(b)) return true;
    const pa = parseFactorProduct(a);
    const pb = parseFactorProduct(b);
    if (pa && pb && pa === pb) return true;
    return false;
  }

  function checkPart(part, ans) {
    if (ans == null || String(ans).trim() === "") return false;
    const targets = [part.answer].concat(part.accept || []);
    return targets.some((t) => equivTex(ans, t));
  }

  function checkQuestion(q, answers) {
    if (q.type === "mc") return answers[q.id] === q.answer;
    if (q.parts) {
      return q.parts.every((p) => checkPart(p, answers[partKey(q.id, p.tag)]));
    }
    return checkPart({ answer: q.answer }, answers[q.id]);
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

    function buildSetBar() {
      if (QUIZ_SETS.length < 2) return null;
      const wrap = document.createElement("div");
      wrap.className = "quiz-set-bar";
      wrap.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px";
      QUIZ_SETS.forEach((set) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-nav-btn quiz-set-btn";
        btn.dataset.set = set.key;
        btn.textContent = set.label;
        btn.addEventListener("click", () => selectSet(set));
        wrap.appendChild(btn);
      });
      const anchor = progressWrap || root;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
      return wrap;
    }

    function syncSetBar() {
      if (!setBar) return;
      Array.prototype.forEach.call(setBar.children, (btn) => {
        const on = btn.dataset.set === activeSet.key;
        btn.classList.toggle("primary", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    // Each set reuses question ids 1-5, so answers must be dropped on switch.
    function selectSet(set) {
      if (set === activeSet) return;
      activeSet = set;
      QUIZ = set.questions;
      state.index = 0;
      state.answers = {};
      state.submitted = false;
      state.phase = "quiz";
      state.activeInputId = null;
      render();
    }

    const setBar = buildSetBar();

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
      syncSetBar();
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
      if (q.prompt) {
        const prompt = document.createElement("span");
        prompt.className = "quiz-prompt";
        prompt.textContent = q.prompt;
        head.appendChild(prompt);
      }
      if (reviewMode) {
        const mark = document.createElement("span");
        mark.className = "quiz-mark " + (ok ? "ok" : "bad");
        mark.textContent = ok ? "\u2713" : "\u2717";
        head.appendChild(mark);
      }
      card.appendChild(head);

      if (q.stem) {
        const stem = document.createElement("div");
        stem.className = "quiz-stem";
        kx(stem, q.stem);
        card.appendChild(stem);
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
        card.appendChild(list);
      }

      const body = document.createElement("div");
      body.className = "quiz-body";
      if (q.type === "mc") {
        body.appendChild(buildMc(q, reviewMode));
      } else if (q.parts) {
        body.appendChild(buildShortParts(q, reviewMode));
      } else {
        body.appendChild(buildShortSingle(q, reviewMode));
      }
      card.appendChild(body);

      if (reviewMode && !ok) {
        card.appendChild(buildCorrectBlock(q));
      }

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
        if (!reviewMode) {
          inp.addEventListener("change", () => { state.answers[q.id] = i; });
        }
        label.appendChild(inp);
        const letter = document.createElement("span");
        letter.className = "quiz-mc-letter";
        letter.textContent = letters[i] + ".";
        label.appendChild(letter);
        const math = document.createElement("span");
        math.className = "quiz-mc-tex";
        kx(math, tex);
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
      if (text === "^{}") {
        const sel = val.slice(start, end);
        ins = sel ? "^{" + sel + "}" : "^{}";
        ta.value = val.slice(0, start) + ins + val.slice(end);
        ta.setSelectionRange(start + (sel ? ins.length : 2), start + (sel ? ins.length : 2));
      } else if (text === "()^2") {
        const sel = val.slice(start, end);
        ins = sel ? "(" + sel + ")^2" : "( )^2";
        ta.value = val.slice(0, start) + ins + val.slice(end);
        ta.setSelectionRange(
          sel ? start + ins.length : start + 1,
          sel ? start + ins.length : start + 1
        );
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
              quizId: 'math-law-of-indices',
              questionId: activeSet.idPrefix + q.id,
              section: 'JM24 Law of Indices',
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
