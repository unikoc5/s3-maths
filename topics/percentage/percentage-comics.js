/* Percentage comics — story concepts + per-page concept checks.
   Completely separate from percentage-quiz.js (does not touch QUIZ data). */
(function () {
  "use strict";

  const COMIC_ASSET_V = "20260828-hd";

  const COMICS = [
    {
      id: "calculator-deal",
      title: "The Calculator Deal",
      chapter: "Ch.1 · Successive discounts",
      image: "comics/01-calculator-deal.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c1q1",
          prompt:
            "A jacket is marked HK$320. The shop offers 20% off, then another 10% off the discounted price. What is the final price?",
          choices: ["HK$224", "HK$256", "HK$288", "HK$230.40"],
          answer: 3,
          explain:
            "Apply successive change factors: 320 × 80% × 90% = HK$230.40 (not 30% off the original).",
        },
        {
          id: "c1q2",
          prompt:
            "An item costs HK$500 before any discount. After 15% off, then 10% off the discounted price, what single discount on the original HK$500 gives the same final price? (1 d.p.)",
          choices: ["25.0%", "24.0%", "23.5%", "20.0%"],
          answer: 2,
          explain:
            "0.85 × 0.90 = 0.765, so the buyer pays 76.5% of the original — equivalent to 23.5% off, not 25%.",
        },
      ],
    },
    {
      id: "comic-con-sales",
      title: "Comic-Con Sales",
      chapter: "Ch.2 · Cost, marked & selling price",
      image: "comics/02-comic-con-sales.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c2q1",
          prompt:
            "A pin badge has marked price HK$30. After 40% off the marked price, what is the selling price?",
          choices: ["HK$12", "HK$24", "HK$30", "HK$18"],
          answer: 3,
          explain:
            "Discount is taken from the marked price: 30 × 60% = HK$18.",
        },
        {
          id: "c2q2",
          prompt:
            "A pin badge costs HK$12 and sells for HK$20. What is the profit percentage based on cost price?",
          choices: ["40%", "50%", "66⅔%", "167%"],
          answer: 2,
          explain:
            "Profit = 20 − 12 = HK$8. Profit % = 8 ÷ 12 × 100% = 66⅔%. The base is the cost price.",
        },
      ],
    },
    {
      id: "simple-interest",
      title: "Simple or Compound?",
      chapter: "Ch.3 · Simple interest",
      image: "comics/03-simple-interest.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c3q1",
          prompt:
            "Principal HK$8,000 at 5% p.a. simple interest for 4 years. What is the final amount?",
          choices: ["HK$9,200", "HK$9,648", "HK$8,400", "HK$9,600"],
          answer: 3,
          explain:
            "I = P × r × t = 8000 × 5% × 4 = HK$1,600. Final amount = 8000 + 1600 = HK$9,600.",
        },
        {
          id: "c3q2",
          prompt:
            "HK$2,000 is invested at 6% p.a. simple interest. How much interest is earned in year 2 alone?",
          choices: ["HK$127.20", "HK$240", "HK$120", "HK$212"],
          answer: 2,
          explain:
            "Each year earns the same interest on the original principal: 2000 × 6% = HK$120.",
        },
      ],
    },
    {
      id: "compound-interest",
      title: "Interest on Interest",
      chapter: "Ch.4 · Compound interest",
      image: "comics/04-compound-interest.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c4q1",
          prompt:
            "HK$10,000 at 5% p.a. compounded annually. What is the balance at the end of year 2?",
          choices: [
            "HK$10,500.00",
            "HK$11,000.00",
            "HK$11,576.25",
            "HK$11,025.00",
          ],
          answer: 3,
          explain:
            "Year 1: 10000 × 1.05 = 10500. Year 2: 10500 × 1.05 = HK$11,025.00.",
        },
        {
          id: "c4q2",
          prompt:
            "HK$5,000 at 4% p.a. for 3 years. Which method gives the greatest final amount?",
          choices: [
            "Simple interest",
            "Compounded annually",
            "All three are equal",
            "Compounded monthly",
          ],
          answer: 3,
          explain:
            "Compound interest grows the balance; more frequent compounding earns interest on interest sooner, so monthly is greatest.",
        },
      ],
    },
    {
      id: "who-is-the-base",
      title: "Who Is the Base?",
      chapter: "Ch.5 · Comparison base",
      image: "comics/05-who-is-the-base.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c5q1",
          prompt:
            "Mei has HK$6,000 in savings and Jo has HK$4,000. Mei’s amount is 50% more than Jo’s. The HK$2,000 difference is 50% of:",
          choices: [
            "Mei’s HK$6,000",
            "their total HK$10,000",
            "HK$5,000",
            "Jo’s HK$4,000",
          ],
          answer: 3,
          explain:
            "“50% more than Jo’s” uses Jo’s savings as the base: 4000 × 50% = 2000.",
        },
        {
          id: "c5q2",
          prompt:
            "If P is 20% more than Q, then Q is how much less than P (to the nearest whole percent)?",
          choices: ["20% less", "25% less", "17% less", "80% less"],
          answer: 2,
          explain:
            "If Q = 100, then P = 120. The same gap is 20 ÷ 120 × 100% ≈ 17% less than P — the base is the amount after “than”.",
        },
      ],
    },
  ];

  function initComics() {
    const panel = document.getElementById("panel-comics");
    const subnav = document.getElementById("comics-subnav");
    const stage = document.getElementById("comics-stage");
    if (!panel || !subnav || !stage) return;

    const state = { index: 0, answers: {} };
    const chipButtons = [];

    function isChapterComplete(comic) {
      return comic.checks.every(function (q) {
        return Object.prototype.hasOwnProperty.call(state.answers, q.id);
      });
    }

    function goToChapter(index) {
      if (index < 0 || index >= COMICS.length) return;
      state.index = index;
      chipButtons.forEach(function (chip, j) {
        chip.classList.toggle("active", j === index);
      });
      render();
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    COMICS.forEach(function (comic, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (i === 0 ? " active" : "");
      btn.dataset.comic = comic.id;
      btn.textContent = comic.title;
      btn.addEventListener("click", function () {
        goToChapter(i);
      });
      subnav.appendChild(btn);
      chipButtons.push(btn);
    });

    function render() {
      const comic = COMICS[state.index];
      stage.innerHTML = "";

      const article = document.createElement("article");
      article.className = "comic-page";

      const head = document.createElement("div");
      head.className = "comic-page-head";
      const chap = document.createElement("span");
      chap.className = "comic-chapter";
      chap.textContent = comic.chapter;
      const title = document.createElement("h2");
      title.textContent = comic.title;
      head.appendChild(chap);
      head.appendChild(title);
      article.appendChild(head);

      const fig = document.createElement("figure");
      fig.className = "comic-figure";
      const img = document.createElement("img");
      img.src = comic.image;
      img.alt = comic.title + " — educational comic page";
      img.loading = "lazy";
      fig.appendChild(img);
      article.appendChild(fig);

      const checkWrap = document.createElement("div");
      checkWrap.className = "comic-checks";
      const checkTitle = document.createElement("h3");
      checkTitle.textContent = "Concept checking";
      checkWrap.appendChild(checkTitle);

      comic.checks.forEach(function (q, qi) {
        checkWrap.appendChild(buildCheckCard(comic, q, qi));
      });
      article.appendChild(checkWrap);

      if (isChapterComplete(comic) && state.index < COMICS.length - 1) {
        const nav = document.createElement("div");
        nav.className = "comic-chapter-nav";
        const nextComic = COMICS[state.index + 1];
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "quiz-nav-btn primary comic-chapter-next";
        nextBtn.textContent = "Next chapter: " + nextComic.title + " \u2192";
        nextBtn.addEventListener("click", function () {
          goToChapter(state.index + 1);
        });
        nav.appendChild(nextBtn);
        article.appendChild(nav);
      }

      stage.appendChild(article);
    }

    function buildCheckCard(comic, q, qi) {
      const card = document.createElement("article");
      card.className = "quiz-card comic-check-card";
      const answered = Object.prototype.hasOwnProperty.call(state.answers, q.id);
      const selected = state.answers[q.id];
      const ok = selected === q.answer;

      const head = document.createElement("div");
      head.className = "quiz-head";
      const num = document.createElement("span");
      num.className = "quiz-num";
      num.textContent = qi + 1 + ".";
      const prompt = document.createElement("div");
      prompt.className = "quiz-prompt";
      prompt.textContent = q.prompt;
      head.appendChild(num);
      head.appendChild(prompt);
      if (answered) {
        const mark = document.createElement("span");
        mark.className = "quiz-mark " + (ok ? "ok" : "bad");
        mark.textContent = ok ? "\u2713" : "\u2717";
        head.appendChild(mark);
      }
      card.appendChild(head);

      const mc = document.createElement("div");
      mc.className = "quiz-mc";
      q.choices.forEach(function (choice, ci) {
        const label = document.createElement("label");
        label.className = "quiz-mc-opt";
        if (answered) {
          label.classList.add("locked");
          if (ci === q.answer) label.classList.add("reveal-ok");
          else if (ci === selected) label.classList.add("reveal-bad");
        }
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "comic-check-" + q.id;
        input.value = String(ci);
        input.disabled = answered;
        if (selected === ci) input.checked = true;
        input.addEventListener("change", function () {
          state.answers[q.id] = ci;
          render();
        });
        const letter = document.createElement("span");
        letter.className = "quiz-mc-letter";
        letter.textContent = String.fromCharCode(65 + ci) + ".";
        const tex = document.createElement("span");
        tex.className = "quiz-mc-tex";
        tex.textContent = choice;
        label.appendChild(input);
        label.appendChild(letter);
        label.appendChild(tex);
        mc.appendChild(label);
      });
      card.appendChild(mc);

      if (answered) {
        const result = document.createElement("div");
        result.className = "quiz-result";
        const msg = document.createElement("div");
        msg.className = "quiz-result-msg";
        msg.textContent = ok ? "Correct. " : "Not quite. ";
        const explain = document.createElement("span");
        explain.textContent = q.explain;
        msg.appendChild(explain);
        result.appendChild(msg);
        card.appendChild(result);
      }

      return card;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComics);
  } else {
    initComics();
  }
})();
