/* Area & Volume comics — Area & Volume Quest Ch.1 + per-page concept checks.
   Completely separate from area-volume-quiz.js (does not touch QUIZ data). */
(function () {
  "use strict";

  const COMIC_ASSET_V = "20260828-hd2";

  const COMICS = [
    {
      id: "enter-solid-city",
      title: "Enter Solid City",
      chapter: "Ch.1 · Page 1 · Pyramids & cones",
      image: "comics/01-enter-solid-city.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c1q1",
          prompt:
            "A right pyramid has base area B = $24$ cm² and perpendicular height h = $9$ cm. What is its volume?",
          choices: [
            "72\\text{ cm}^3",
            "216\\text{ cm}^3",
            "24\\text{ cm}^3",
            "108\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "V(pyramid) = $\\frac{1}{3}$Bh = $\\frac{1}{3}$ × $24$ × $9$ = $72$ cm³.",
        },
        {
          id: "c1q2",
          prompt:
            "A cone has radius r = $4$ cm and height h = $9$ cm. What is its volume? (Leave π in the answer.)",
          choices: [
            "48\\pi\\text{ cm}^3",
            "144\\pi\\text{ cm}^3",
            "36\\pi\\text{ cm}^3",
            "16\\pi\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "V(cone) = $\\frac{1}{3}$πr²h = $\\frac{1}{3}$π($16$)($9$) = $48$π cm³.",
        },
      ],
    },
    {
      id: "why-one-third",
      title: "Why One Third?",
      chapter: "Ch.1 · Page 2 · Pyramid & cone volume",
      image: "comics/02-why-one-third.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c2q1",
          prompt:
            "A square pyramid has base area B = $36$ cm² and perpendicular height h = $10$ cm. What is its volume?",
          choices: [
            "120\\text{ cm}^3",
            "360\\text{ cm}^3",
            "180\\text{ cm}^3",
            "36\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "V(pyramid) = $\\frac{1}{3}$Bh = $\\frac{1}{3}$ × $36$ × $10$ = $120$ cm³.",
        },
        {
          id: "c2q2",
          prompt:
            "A cone has radius r = $3$ cm and height h = $7$ cm. What is its volume? (Leave π in the answer.)",
          choices: [
            "21\\pi\\text{ cm}^3",
            "63\\pi\\text{ cm}^3",
            "7\\pi\\text{ cm}^3",
            "9\\pi\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "A cone is a circular-base pyramid: V = $\\frac{1}{3}$πr²h = $\\frac{1}{3}$π($9$)($7$) = $21$π cm³.",
        },
      ],
    },
    {
      id: "born-flat",
      title: "Every Solid Is Born Flat",
      chapter: "Ch.1 · Page 3 · Nets & total surface area",
      image: "comics/03-every-solid-born-flat.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c3q1",
          prompt:
            "A cube has edge length $4$ cm. What is its total surface area?",
          choices: [
            "96\\text{ cm}^2",
            "16\\text{ cm}^2",
            "64\\text{ cm}^2",
            "24\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "TSA(cube) = $6$ × (edge)² = $6$ × $16$ = $96$ cm².",
        },
        {
          id: "c3q2",
          prompt:
            "An open-top box is a rectangular prism with length $5$ cm, width $3$ cm and height $2$ cm. What is its total surface area?",
          choices: [
            "47\\text{ cm}^2",
            "62\\text{ cm}^2",
            "32\\text{ cm}^2",
            "15\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "Open top means five faces: base $5$×$3$ = $15$; two $5$×$2$ faces = $20$; two $3$×$2$ faces = $12$. Total = $47$ cm².",
        },
      ],
    },
    {
      id: "net-maternity-ward",
      title: "The Net Maternity Ward",
      chapter: "Ch.1 · Page 4 · Prism, pyramid & cone surface area",
      image: "comics/04-net-maternity-ward.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c4q1",
          prompt:
            "A right prism has base area B = $20$ cm², base perimeter P = $18$ cm and height h = $5$ cm. What is its total surface area?",
          choices: [
            "130\\text{ cm}^2",
            "90\\text{ cm}^2",
            "110\\text{ cm}^2",
            "40\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "TSA(right prism) = $2$B + Ph = $2$($20$) + $18$($5$) = $40$ + $90$ = $130$ cm².",
        },
        {
          id: "c4q2",
          prompt:
            "A regular pyramid has base area B = $36$ cm², base perimeter P = $24$ cm and slant height ℓ = $10$ cm. What is its total surface area?",
          choices: [
            "156\\text{ cm}^2",
            "120\\text{ cm}^2",
            "240\\text{ cm}^2",
            "96\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "Lateral area = $\\frac{1}{2}$Pℓ = $\\frac{1}{2}$($24$)($10$) = $120$ cm². TSA = B + $\\frac{1}{2}$Pℓ = $36$ + $120$ = $156$ cm².",
        },
      ],
    },
    {
      id: "sphere-district",
      title: "The Sphere District",
      chapter: "Ch.1 · Page 5 · Sphere & hemisphere volume",
      image: "comics/05-sphere-district.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c5q1",
          prompt:
            "A sphere has radius r = $3$ cm. What is its volume? (Leave π in the answer.)",
          choices: [
            "36\\pi\\text{ cm}^3",
            "12\\pi\\text{ cm}^3",
            "9\\pi\\text{ cm}^3",
            "4\\pi\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "V(sphere) = $\\frac{4}{3}$πr³ = $\\frac{4}{3}$π($27$) = $36$π cm³.",
        },
        {
          id: "c5q2",
          prompt:
            "A solid hemisphere has radius r = $6$ cm. What is its volume? (Leave π in the answer.)",
          choices: [
            "144\\pi\\text{ cm}^3",
            "288\\pi\\text{ cm}^3",
            "72\\pi\\text{ cm}^3",
            "216\\pi\\text{ cm}^3",
          ],
          answer: 0,
          explain:
            "V(hemisphere) = $\\frac{2}{3}$πr³ = $\\frac{2}{3}$π($216$) = $144$π cm³.",
        },
      ],
    },
    {
      id: "surface-of-sphere",
      title: "The Surface of a Sphere",
      chapter: "Ch.1 · Page 6 · Sphere & hemisphere surface area",
      image: "comics/06-surface-of-sphere.png?v=" + COMIC_ASSET_V,
      checks: [
        {
          id: "c6q1",
          prompt:
            "A sphere has radius r = $2$ cm. What is its surface area? (Leave π in the answer.)",
          choices: [
            "16\\pi\\text{ cm}^2",
            "8\\pi\\text{ cm}^2",
            "4\\pi\\text{ cm}^2",
            "\\frac{32\\pi}{3}\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "SA(sphere) = $4$πr² = $4$π($4$) = $16$π cm².",
        },
        {
          id: "c6q2",
          prompt:
            "A solid hemisphere has radius r = $5$ cm. What is its total surface area? (Leave π in the answer.)",
          choices: [
            "75\\pi\\text{ cm}^2",
            "50\\pi\\text{ cm}^2",
            "25\\pi\\text{ cm}^2",
            "100\\pi\\text{ cm}^2",
          ],
          answer: 0,
          explain:
            "Curved SA = $2$πr² = $50$π cm²; flat base = πr² = $25$π cm². Total = $3$πr² = $75$π cm².",
        },
      ],
    },
  ];

  function renderMixedTex(el, text) {
    if (!text) return;
    if (!window.katex || !/\$[^$]+\$/.test(text)) {
      el.textContent = text;
      return;
    }
    el.textContent = "";
    text.split(/(\$[^$]+\$)/).forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === "$" && part.charAt(part.length - 1) === "$") {
        const span = document.createElement("span");
        try {
          katex.render(part.slice(1, -1), span, { throwOnError: false });
        } catch (e) {
          span.textContent = part;
        }
        el.appendChild(span);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderMaybeTex(el, text) {
    if (text.indexOf("\\") >= 0 && window.katex) {
      try {
        katex.render(text, el, { throwOnError: false });
        return;
      } catch (e) {
        /* fall through */
      }
    }
    renderMixedTex(el, text);
  }

  function initComics() {
    const panel = document.getElementById("panel-comics");
    const subnav = document.getElementById("comics-subnav");
    const stage = document.getElementById("comics-stage");
    if (!panel || !subnav || !stage) return;

    const state = { index: 0, answers: {} };
    const chipButtons = [];

    function isChapterComplete(comic) {
      if (!comic.checks.length) return true;
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
      btn.textContent = "P" + (i + 1) + " · " + comic.title;
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

      if (comic.checks.length) {
        const checkWrap = document.createElement("div");
        checkWrap.className = "comic-checks";
        const checkTitle = document.createElement("h3");
        checkTitle.textContent = "Concept checking";
        checkWrap.appendChild(checkTitle);

        comic.checks.forEach(function (q, qi) {
          checkWrap.appendChild(buildCheckCard(comic, q, qi));
        });
        article.appendChild(checkWrap);
      }

      if (isChapterComplete(comic) && state.index < COMICS.length - 1) {
        const nav = document.createElement("div");
        nav.className = "comic-chapter-nav";
        const nextComic = COMICS[state.index + 1];
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "quiz-nav-btn primary comic-chapter-next";
        nextBtn.textContent =
          "Next page: " + nextComic.title + " \u2192";
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
      renderMixedTex(prompt, q.prompt);
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
        renderMaybeTex(tex, choice);
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
        renderMixedTex(explain, q.explain);
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
