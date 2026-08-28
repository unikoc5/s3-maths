/* Probability quiz — Pre S3 L10–12; paginated MC (10), progress bar */
(function () {
  "use strict";

  const FIG = "quiz-figures/";

  const QUIZ = [
    {
      id: 1,
      type: "mc",
      prompt:
        "A letter is chosen randomly from the word \u2018UNIVERSITY\u2019. Find the probability that is a vowel.",
      choices: ["\\frac{1}{5}", "\\frac{3}{10}", "\\frac{2}{5}", "\\frac{1}{2}"],
      answer: 2,
    },
    {
      id: 2,
      type: "mc",
      prompt:
        "Samuel can choose to go to work by bus, taxi or MTR. Suppose he randomly chooses a mean of transport in two working days. Find the probability that Samuel chooses the same mean of transport in these two working days.",
      choices: ["\\frac{2}{3}", "\\frac{1}{3}", "\\frac{1}{4}", "\\frac{3}{5}"],
      answer: 1,
    },
    {
      id: 3,
      type: "mc",
      prompt:
        "There are 20 basketball and 35 tennis ball in a box. Nick repeats the action of drawing a ball from the box at random and putting it back into the box. Find the expected number of times of getting a tennis ball if he repeats the action for 385 times.",
      choices: ["20", "35", "140", "245"],
      answer: 3,
    },
    {
      id: 4,
      type: "mc",
      prompt:
        "The figure shows a circular fortune wheel in a lucky draw. Dylan turns the wheel once. If the pointer points at the region \u2018c\u2019, \u2018e\u2019 or \u2018g\u2019, a prize will be given. Find the probability that he gets a prize.",
      figures: [{ src: FIG + "q4-wheel.png", alt: "Circular fortune wheel with sectors a to g" }],
      choices: ["\\frac{1}{4}", "\\frac{1}{6}", "\\frac{1}{10}", "\\frac{1}{12}"],
      answer: 0,
    },
    {
      id: 5,
      type: "mc",
      prompt:
        "A bag contains five $1.4 stamps, five $0.2 stamps and ten $0.1 stamps. A stamp is drawn at random from the bag. Find the expected face value of the stamp.",
      choices: ["\\$0.35", "\\$0.4", "\\$0.45", "\\$0.5"],
      answer: 2,
    },
    {
      id: 6,
      type: "mc",
      prompt:
        "There are 24 bottles of water and x bottles of tea on a table. If a bottle of drink is drawn at random, the probability of drawing a bottle of tea is \\frac{3}{5}. Find the value of x.",
      choices: ["36", "38", "40", "42"],
      answer: 0,
    },
    {
      id: 7,
      type: "mc",
      prompt:
        "6\u25b2 is a 2-digit number, where \u25b2 is an integer from 0 to 9 inclusive. Find the probability that the 2-digit number is divisible by 5.",
      choices: ["\\frac{1}{10}", "\\frac{1}{5}", "\\frac{2}{5}", "\\frac{1}{2}"],
      answer: 1,
    },
    {
      id: 8,
      type: "mc",
      prompt:
        "There are 2000 candidates in an examination. If one of the candidates is chosen randomly, the probability of choosing a female candidate is \\frac{11}{20}. Find the number of male candidates in the examination.",
      choices: ["800", "900", "1000", "1100"],
      answer: 1,
    },
    {
      id: 9,
      type: "mc",
      prompt:
        "Two fair dice are thrown at the same time. By using tabulation, find the probability that the sum of the two number is less than 9.",
      choices: ["\\frac{5}{9}", "\\frac{13}{18}", "\\frac{2}{3}", "\\frac{4}{9}"],
      answer: 1,
    },
    {
      id: 10,
      type: "mc",
      prompt:
        "Winnie\u2019s purse contains two $2 coins, one $5 coin and one $10 coin. On a flag day, Winnie takes out two coins randomly from her purse at the same time for donation. Find the expected donation amount.",
      choices: ["\\$7", "\\$8.5", "\\$9.5", "\\$10"],
      answer: 2,
    },
  ];

  function kx(el, tex, display) {
    try { katex.render(tex, el, { throwOnError: false, displayMode: !!display }); }
    catch (e) { el.textContent = tex; }
  }

  function checkQuestion(q, answers) {
    return answers[q.id] === q.answer;
  }

  function renderPrompt(el, text) {
    const re = /(\\frac\{[^}]+\}\{[^}]+\})/g;
    const parts = text.split(re);
    parts.forEach(function (part) {
      if (!part) return;
      if (/^\\frac\{/.test(part)) {
        const span = document.createElement("span");
        span.className = "quiz-prompt-frac";
        kx(span, part, false);
        el.appendChild(span);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
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

    const state = { index: 0, answers: {}, submitted: false, phase: "quiz" };

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
      root.innerHTML = "";
      updateProgress();
      updateNav();
      if (state.phase === "review") { renderReview(); return; }
      const q = QUIZ[state.index];
      if (q) root.appendChild(buildCard(q, false));
    }

    function buildFigures(figs) {
      const wrap = document.createElement("div");
      wrap.className = "quiz-figure";
      figs.forEach((fig) => {
        const img = document.createElement("img");
        img.src = fig.src;
        img.alt = fig.alt || "Figure";
        img.loading = "lazy";
        wrap.appendChild(img);
      });
      return wrap;
    }

    function buildCard(q, reviewMode) {
      const card = document.createElement("article");
      card.className = "quiz-card" + (reviewMode ? " quiz-card-review" : "");
      if (q.figures && q.figures.length) card.classList.add("has-figure");
      const ok = checkQuestion(q, state.answers);

      const head = document.createElement("div");
      head.className = "quiz-head";
      const num = document.createElement("span");
      num.className = "quiz-num";
      num.textContent = q.id + ".";
      head.appendChild(num);
      if (q.prompt) {
        const prompt = document.createElement("div");
        prompt.className = "quiz-prompt";
        if (/\\frac\{/.test(q.prompt)) renderPrompt(prompt, q.prompt);
        else prompt.textContent = q.prompt;
        head.appendChild(prompt);
      }
      if (reviewMode) {
        const mark = document.createElement("span");
        mark.className = "quiz-mark " + (ok ? "ok" : "bad");
        mark.textContent = ok ? "\u2713" : "\u2717";
        head.appendChild(mark);
      }
      card.appendChild(head);

      const content = document.createElement("div");
      content.className = "quiz-content";
      if (q.stem) {
        const stem = document.createElement("div");
        stem.className = "quiz-stem";
        kx(stem, q.stem, false);
        content.appendChild(stem);
      }
      const body = document.createElement("div");
      body.className = "quiz-body";
      body.appendChild(buildMc(q, reviewMode));
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
      const msg = document.createElement("span");
      msg.className = "quiz-result-msg";
      msg.textContent = "Correct answer: ";
      const ans = document.createElement("span");
      ans.className = "quiz-ans-tex";
      kx(ans, q.choices[q.answer]);
      msg.appendChild(ans);
      block.appendChild(msg);
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
        if (!reviewMode) inp.addEventListener("change", () => { state.answers[q.id] = i; });
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

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (state.phase === "review") return;
        if (state.index > 0) { state.index--; render(); }
      });
    }

    nextBtn.addEventListener("click", () => {
      if (state.phase === "review") {
        state.index = 0;
        state.answers = {};
        state.submitted = false;
        state.phase = "quiz";
        render();
        return;
      }
      if (state.index >= QUIZ.length - 1) {
        state.submitted = true;
        state.phase = "review";
        try {
          QUIZ.forEach(function(q) {
            var userAnswerIdx = state.answers[q.id];
            var isCorrect = userAnswerIdx === q.answer;
            var payload = {
              type: 'uniplus:quizAnswer',
              subject: 'MATH',
              quizId: 'math-probability',
              questionId: 'prob-q' + q.id,
              section: 'probability',
              difficulty: 'standard',
              stem: q.stem || q.prompt || null,
              selectedAnswer: userAnswerIdx !== undefined ? String(userAnswerIdx) : null,
              selectedAnswerText: userAnswerIdx !== undefined ? (q.choices[userAnswerIdx] || null) : null,
              correctAnswer: String(q.answer),
              correctAnswerText: q.choices[q.answer] || null,
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
