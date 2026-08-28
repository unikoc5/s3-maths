/* Percentage quiz  EPre S3 L04 E6; paginated MC (10), progress bar */
(function () {
  "use strict";

  const QUIZ = [
    {
      id: 1,
      type: "mc",
      prompt:
        "The original weight of a panda was 80 kg. Its weight first decreased by 10% due to illness and then increased by 10% after recovery. After recovery, what was the change in its weight as compared to the original weight?",
      choices: [
        "\\text{no change}",
        "\\text{an increase of }0.8\\text{ kg}",
        "\\text{a decrease of }0.8\\text{ kg}",
        "\\text{a decrease of }8\\text{ kg}",
      ],
      answer: 2,
    },
    {
      id: 2,
      type: "mc",
      prompt:
        "Last Christmas, an artist sold 40 postcards at the price of $90 each for charity. This Christmas, the price of each postcard increases by 30% but the number of postcards sold decreases by 15%. Find the percentage change in the amount of money to charity.",
      choices: ["-15\\%", "+15\\%", "-10.5\\%", "+10.5\\%"],
      answer: 3,
    },
    {
      id: 3,
      type: "mc",
      prompt:
        "Bob deposits 50000 in bank A at a simple interest rate of 6% p.a. and $40000 in bank B at a simple interest rate of 7% p.a. Find the total amount he will receive after 10 years.",
      choices: ["\\$148000", "\\$74000", "\\$58000", "\\$12000"],
      answer: 0,
    },
    {
      id: 4,
      type: "mc",
      prompt:
        "A sum of money is deposited in a bank at an interest rate of 12% p.a. compounded yearly. If the interest received after 7 years is $6000, find the principal.\n(Give the answer correct to the nearest $1000.)",
      choices: ["\\$3000", "\\$4000", "\\$5000", "\\$6000"],
      answer: 2,
    },
    {
      id: 5,
      type: "mc",
      prompt:
        "In this financial year, Tom has a total allowance of $140000 and he has to pay a salaries tax of $15300. If his net chargeable income is greater than $150000 but less than $200000, find his annual income.",
      choices: ["\\$109000", "\\$195000", "\\$249000", "\\$335000"],
      answer: 3,
    },
    {
      id: 6,
      type: "mc",
      prompt:
        "The value of an antique oil painting increases at a steady rate of 25% every 5 years. Its present value is $150000.\nFind its value 20 years ago.",
      choices: ["\\$61440", "\\$614400", "\\$150000", "\\$88560"],
      answer: 0,
    },
    {
      id: 7,
      type: "mc",
      prompt:
        "A retailer buys goods for $480 and wants a profit of 25% on the selling price. Find the selling price.",
      choices: ["\\$600", "\\$520", "\\$640", "\\$720"],
      answer: 2,
    },
    {
      id: 8,
      type: "mc",
      prompt:
        "David borrows $5000 from a bank at an interest rate of 7.8% p.a. compounded monthly. Find the amount he should repay after 3 years.\n(Give the answer correct to the nearest dollar.)",
      choices: ["\\$5800", "\\$6000", "\\$6313", "\\$6500"],
      answer: 2,
    },
    {
      id: 9,
      type: "mc",
      prompt:
        "A dress is marked at $960. During a sale, a customer gets a discount of 25% off the marked price, followed by an extra 10% off the reduced price. Find the amount the customer pays.",
      choices: ["\\$648", "\\$720", "\\$672", "\\$864"],
      answer: 0,
    },
    {
      id: 10,
      type: "mc",
      prompt:
        "A car depreciates in value by 12% each year. If its present value is $50000, find its value after 2 years.",
      choices: ["\\$38720", "\\$40000", "\\$44000", "\\$38000"],
      answer: 0,
    },
  ];

  function kx(el, tex, display) {
    try { katex.render(tex, el, { throwOnError: false, displayMode: !!display }); }
    catch (e) { el.textContent = tex; }
  }

  function checkQuestion(q, answers) {
    return answers[q.id] === q.answer;
  }

  function setReviewBar(progressFill, progressOk, progressBad, score, total) {
    const okShare = total ? score / total : 0;
    const badShare = total ? (total - score) / total : 0;
    if (progressFill) {
      progressFill.style.width = "100%";
      progressFill.style.background = "transparent";
    }
    if (progressOk) progressOk.style.width = Math.round(okShare * 100) + "%";
    if (progressBad) progressBad.style.width = Math.round(badShare * 100) + "%";
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
        const score = QUIZ.filter((q) => checkQuestion(q, state.answers)).length;
        setReviewBar(progressFill, progressOk, progressBad, score, QUIZ.length);
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
        const prompt = document.createElement("div");
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
      card.appendChild(content);

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
              quizId: 'math-percentages',
              questionId: 'pct-q' + q.id,
              section: 'percentages',
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
