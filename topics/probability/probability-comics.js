/* Probability comics  EB-12 fair-games story + per-page concept checks.
   Completely separate from probability-quiz.js (does not touch QUIZ data). */
(function () {
  "use strict";

  const COMICS = [
    {
      id: "vowels-feel-easy",
      title: "Vowels Feel Easy",
      chapter: "Ch.1 · P = favourable / total",
      image: "comics/01-vowels-feel-easy.png",
      checks: [
        {
          id: "c1q1",
          prompt:
            "A letter is chosen at random from MATHEMATICS (11 letters). How many favourable outcomes are there for getting a vowel?",
          choices: ["2", "3", "4", "5"],
          answer: 2,
          explain:
            "Vowels in MATHEMATICS are A, A, E, I  Ethat is 4 favourable letters (count repeats).",
        },
        {
          id: "c1q2",
          prompt:
            "Using the same word, what is P(vowel)?",
          choices: ["\\frac{4}{11}", "\\frac{1}{2}", "\\frac{3}{11}", "\\frac{4}{10}"],
          answer: 0,
          explain:
            "P = favourable / total = 4/11. Do not invent a different total.",
        },
      ],
    },
    {
      id: "same-sticker",
      title: "Same Sticker, Different Rule",
      chapter: "Ch.2 · AND vs OR",
      image: "comics/02-same-sticker-different-rule.png",
      checks: [
        {
          id: "c2q1",
          prompt:
            "A fair die is thrown. Find P(even AND less than 4).",
          choices: ["\\frac{1}{6}", "\\frac{1}{2}", "\\frac{5}{6}", "\\frac{1}{3}"],
          answer: 0,
          explain:
            "Even and <4: only {2}. So P = 1/6.",
        },
        {
          id: "c2q2",
          prompt:
            "Same die. Find P(even OR less than 4).",
          choices: ["\\frac{1}{6}", "\\frac{1}{2}", "\\frac{5}{6}", "\\frac{2}{3}"],
          answer: 2,
          explain:
            "Even ∪ (<4) = {1,2,3,4,6} ↁE5 outcomes. P = 5/6. Same prize, different favourable set.",
        },
      ],
    },
    {
      id: "king-counted-twice",
      title: "The King Who Counted Twice",
      chapter: "Ch.3 · OR with overlap",
      image: "comics/03-king-counted-twice.png",
      checks: [
        {
          id: "c3q1",
          prompt:
            "A card is drawn from 52. Theo counts hearts or kings as 13+4=17. What is the correct favourable count?",
          choices: ["13", "16", "17", "18"],
          answer: 1,
          explain:
            "K♥ is in both sets. Favourable = 13+4∁E = 16.",
        },
        {
          id: "c3q2",
          prompt:
            "Find P(heart or king).",
          choices: ["\\frac{17}{52}", "\\frac{16}{52}=\\frac{4}{13}", "\\frac{13}{52}", "\\frac{4}{52}"],
          answer: 1,
          explain:
            "P(A or B) = P(A)+P(B)−P(A∩B) ↁE16/52 = 4/13.",
        },
      ],
    },
    {
      id: "when-listing-hurts",
      title: "When Listing Hurts",
      chapter: "Ch.4 · Complement",
      image: "comics/04-when-listing-hurts.png",
      checks: [
        {
          id: "c4q1",
          prompt:
            "A card is drawn from 52. Let E = spade or king. How many cards are in E?",
          choices: ["15", "16", "17", "36"],
          answer: 1,
          explain:
            "Spades 13 + kings 4 ∁EK♠ overlap 1 = 16.",
        },
        {
          id: "c4q2",
          prompt:
            "The badge is won if the card is NOT (spade or king). Find that probability.",
          choices: ["\\frac{16}{52}", "\\frac{36}{52}=\\frac{9}{13}", "\\frac{39}{52}", "\\frac{1}{2}"],
          answer: 1,
          explain:
            "P(not E) = 1 ∁E16/52 = 36/52 = 9/13. Complement beats listing all 52.",
        },
      ],
    },
    {
      id: "vinces-bean-bags",
      title: "Vince's Bean Bags",
      chapter: "Ch.5 · Unknown count from P",
      image: "comics/05-vinces-bean-bags.png",
      checks: [
        {
          id: "c5q1",
          prompt:
            "A bag has 8 red beans and k green beans. If P(red) = 2/7, which equation is correct?",
          choices: [
            "\\frac{8}{k}=\\frac{2}{7}",
            "\\frac{8}{8+k}=\\frac{2}{7}",
            "\\frac{k}{8}=\\frac{2}{7}",
            "\\frac{8+k}{8}=\\frac{2}{7}",
          ],
          answer: 1,
          explain:
            "Total = 8+k, so P(red) = 8/(8+k) = 2/7.",
        },
        {
          id: "c5q2",
          prompt:
            "Solve for k.",
          choices: ["14", "16", "20", "28"],
          answer: 2,
          explain:
            "7ÁE = 2(8+k) ↁE56 = 16+2k ↁEk = 20. Total beans = 28.",
        },
      ],
    },
    {
      id: "the-long-queue",
      title: "The Long Queue",
      chapter: "Ch.6 · Expected value",
      image: "comics/06-the-long-queue.png",
      checks: [
        {
          id: "c6q1",
          prompt:
            "Prizes $50, $150, $1000 with probabilities 0.7, 0.2, 0.1. What is the expected prize E?",
          choices: ["HK$165", "HK$200", "HK$400", "HK$1000"],
          answer: 0,
          explain:
            "E = 50(0.7)+150(0.2)+1000(0.1) = 35+30+100 = HK$165.",
        },
        {
          id: "c6q2",
          prompt:
            "The draw costs HK$200 to enter. On average, is it worth playing?",
          choices: [
            "Yes, because you might win $1000",
            "Yes, because E = $200",
            "No, because E = $165 < $200",
            "It does not matter  Eprobability is luck only",
          ],
          answer: 2,
          explain:
            "Compare E with the fee: $165 < $200 ↁEexpected loss of $35. A jackpot is still possible once, but the long-run average is unfavourable.",
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
      img.alt = comic.title + "  Eeducational comic page";
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
        if (choice.indexOf("\\") >= 0 && window.katex) {
          try {
            katex.render(choice, tex, { throwOnError: false });
          } catch (e) {
            tex.textContent = choice;
          }
        } else {
          tex.textContent = choice;
        }
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
