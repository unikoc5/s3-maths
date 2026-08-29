/**
 * Mount comics gallery + ComicsReader into a maths_s3 topic panel.
 * Expects COMICS_MAP / COMIC_ORDER globals (JM25_COMICS, JM26_COMICS, or JM28_COMICS).
 */
(function () {
  "use strict";

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      var v = window.I18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback || key;
  }

  function detectBundle() {
    if (window.JM24_COMICS) {
      return { map: window.JM24_COMICS, order: window.JM24_COMIC_ORDER || Object.keys(window.JM24_COMICS) };
    }
    if (window.JM25_COMICS) {
      return { map: window.JM25_COMICS, order: window.JM25_COMIC_ORDER || Object.keys(window.JM25_COMICS) };
    }
    if (window.JM26_COMICS) {
      return { map: window.JM26_COMICS, order: window.JM26_COMIC_ORDER || Object.keys(window.JM26_COMICS) };
    }
    if (window.JM28_COMICS) {
      return { map: window.JM28_COMICS, order: window.JM28_COMIC_ORDER || Object.keys(window.JM28_COMICS) };
    }
    return null;
  }

  function getQuizBank() {
    return (
      window.JM24_COMICS_QUIZ ||
      window.JM25_COMICS_QUIZ ||
      window.JM26_COMICS_QUIZ ||
      window.JM28_COMICS_QUIZ ||
      null
    );
  }

  function renderQuiz(topicKey) {
    var quizBank = getQuizBank();
    if (!quizBank || !quizBank[topicKey]) return "";
    if (typeof window.buildQuizQuestionHtml !== "function") return "";
    var lang = window.I18n && window.I18n.lang === "zh" ? "zh" : "en";
    var questions = quizBank[topicKey];
    var cards = questions
      .map(function (q, i) {
        return window.buildQuizQuestionHtml(q, i, lang);
      })
      .join("");
    return (
      '<section class="quiz-section" id="comic-quiz">' +
      '<h3 class="quiz-heading">' +
      t("quiz.title", "Check your understanding") +
      "</h3>" +
      cards +
      "</section>"
    );
  }

  function wireQuiz(topicKey) {
    var quizSection = document.getElementById("comic-quiz");
    var quizBank = getQuizBank();
    if (!quizSection || !quizBank || !quizBank[topicKey]) return;
    var lang = window.I18n && window.I18n.lang === "zh" ? "zh" : "en";
    var questions = quizBank[topicKey];

    quizSection.querySelectorAll(".quiz-card").forEach(function (card, i) {
      var q = questions[i];
      var feedback = card.querySelector(".quiz-feedback");
      var options = card.querySelectorAll(".quiz-option");
      options.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (card.classList.contains("is-answered")) return;
          var isCorrect = btn.getAttribute("data-correct") === "1";
          card.classList.add("is-answered");
          feedback.hidden = false;
          feedback.classList.remove("is-correct", "is-wrong");
          options.forEach(function (opt) {
            opt.disabled = true;
            if (opt.getAttribute("data-correct") === "1") {
              opt.classList.add("is-correct-option");
            }
          });
          if (isCorrect) {
            btn.classList.add("is-selected");
            feedback.classList.add("is-correct");
            feedback.textContent = t("quiz.correct", "Correct!");
          } else {
            btn.classList.add("is-wrong-option");
            var hint = lang === "zh" ? q.hintZh : q.hintEn;
            feedback.classList.add("is-wrong");
            feedback.textContent =
              t("quiz.wrong", "Not quite — try again.") +
              " " +
              t("quiz.hint", "Hint:") +
              " " +
              hint;
          }
        });
      });
    });
  }

  function renderGrid(root, bundle, topicKey) {
    var container = root.querySelector("#comic-content");
    var topic = bundle.map[topicKey];
    if (!container || !topic) return;

    if (window.ComicsReader) window.ComicsReader.init(topicKey);

    var chapterLabel = t("comic.chapter", "Chapter");
    var lawCardLabel = t("comic.lawCard", "Summary card");
    var topicLabel = topic.label;

    var cards = topic.chapters
      .map(function (ch, i) {
        var src = topic.basePath + ch.file;
        return (
          '<button type="button" class="comic-card" data-topic="' +
          topicKey +
          '" data-index="' +
          i +
          '">' +
          '<div class="comic-thumb-wrap"><img src="' +
          src +
          '" alt="" loading="lazy" /></div>' +
          '<div class="comic-card-body"><strong>' +
          ch.title +
          "</strong><span>" +
          chapterLabel +
          "</span></div></button>"
        );
      })
      .join("");

    var lawCards = topic.lawCards || (topic.lawCard ? [topic.lawCard] : []);
    lawCards.forEach(function (card, i) {
      var lawIndex = topic.chapters.length + i;
      var lawSrc = topic.basePath + card.file;
      cards +=
        '<button type="button" class="comic-card is-law-card" data-topic="' +
        topicKey +
        '" data-index="' +
        lawIndex +
        '">' +
        '<div class="comic-thumb-wrap"><img src="' +
        lawSrc +
        '" alt="" loading="lazy" /></div>' +
        '<div class="comic-card-body"><strong>' +
        card.title +
        "</strong><span>" +
        lawCardLabel +
        "</span></div></button>";
    });

    container.innerHTML =
      '<h2 class="comic-series-title">' +
      topic.series +
      "</h2>" +
      '<p class="comic-series-desc">' +
      topicLabel +
      " · " +
      topic.chapters.length +
      " " +
      t("comic.chaptersPlus", "chapters + law card") +
      "</p>" +
      '<div class="comic-grid">' +
      cards +
      "</div>" +
      renderQuiz(topicKey);

    container.querySelectorAll(".comic-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var tk = card.getAttribute("data-topic");
        var idx = parseInt(card.getAttribute("data-index"), 10);
        if (window.ComicsReader) window.ComicsReader.openAt(tk, idx);
      });
    });

    wireQuiz(topicKey);
  }

  window.ComicsMount = {
    init: function init(rootOrId, options) {
      var root =
        typeof rootOrId === "string"
          ? document.getElementById(rootOrId)
          : rootOrId;
      if (!root) return;

      var bundle = detectBundle();
      if (!bundle || !bundle.order.length) {
        root.innerHTML =
          '<p class="comic-series-desc">Comics coming soon.</p>';
        return;
      }

      options = options || {};
      var active = options.defaultTopic || bundle.order[0];
      var intro =
        options.intro ||
        "Tap a chapter to open the reader. Use arrow keys or the footer buttons to move between pages.";

      var subtabs = "";
      if (bundle.order.length > 1) {
        subtabs =
          '<div class="comic-subtabs" id="comic-subtabs">' +
          bundle.order
            .map(function (key) {
              var comicTopic = bundle.map[key];
              return (
                '<button type="button" class="comic-subtab' +
                (key === active ? " is-active" : "") +
                '" data-comic-topic="' +
                key +
                '">' +
                (comicTopic.label || key) +
                "</button>"
              );
            })
            .join("") +
          "</div>";
      }

      root.innerHTML =
        '<div class="hero-panel"><p>' +
        intro +
        "</p></div>" +
        subtabs +
        '<div id="comic-content"></div>';

      var subtabsEl = root.querySelector("#comic-subtabs");
      if (subtabsEl) {
        subtabsEl.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-comic-topic]");
          if (!btn) return;
          active = btn.getAttribute("data-comic-topic");
          subtabsEl.querySelectorAll(".comic-subtab").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          renderGrid(root, bundle, active);
        });
      }

      renderGrid(root, bundle, active);
    },
  };
})();
