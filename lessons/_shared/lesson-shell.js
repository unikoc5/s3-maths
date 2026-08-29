(function () {
  var VALID_TABS = ["tools", "comics", "game"];
  var activeTab = "tools";
  var activeComicTopic = null;
  var activeToolPill = "sci-notation";

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      return window.I18n.t(key);
    }
    return fallback || key;
  }

  function getLessonId() {
    return document.body.getAttribute("data-lesson") || "jm24";
  }

  function getTopic() {
    if (typeof window.getTopicById !== "function") return null;
    return window.getTopicById(getLessonId());
  }

  function getComicsManifest() {
    var id = getLessonId();
    if (id === "jm24" && window.JM24_COMICS) return window.JM24_COMICS;
    if (id === "jm25" && window.JM25_COMICS) return window.JM25_COMICS;
    if (id === "jm26" && window.JM26_COMICS) return window.JM26_COMICS;
    if (id === "jm28" && window.JM28_COMICS) return window.JM28_COMICS;
    return null;
  }

  function getComicOrder() {
    var id = getLessonId();
    if (id === "jm24" && window.JM24_COMIC_ORDER) return window.JM24_COMIC_ORDER;
    if (id === "jm25" && window.JM25_COMIC_ORDER) return window.JM25_COMIC_ORDER;
    if (id === "jm26" && window.JM26_COMIC_ORDER) return window.JM26_COMIC_ORDER;
    if (id === "jm28" && window.JM28_COMIC_ORDER) return window.JM28_COMIC_ORDER;
    return [];
  }

  function getDefaultComicTopic() {
    var order = getComicOrder();
    return order.length ? order[0] : "rules";
  }

  function getActiveComicTopic() {
    if (!activeComicTopic || getComicOrder().indexOf(activeComicTopic) < 0) {
      activeComicTopic = getDefaultComicTopic();
    }
    return activeComicTopic;
  }

  function hasComics() {
    return !!getComicsManifest();
  }

  function getComicsIntroKey() {
    var id = getLessonId();
    return "comics.intro." + id;
  }

  function getComicsQuiz() {
    var id = getLessonId();
    if (id === "jm24" && window.JM24_COMICS_QUIZ) return window.JM24_COMICS_QUIZ;
    if (id === "jm25" && window.JM25_COMICS_QUIZ) return window.JM25_COMICS_QUIZ;
    if (id === "jm26" && window.JM26_COMICS_QUIZ) return window.JM26_COMICS_QUIZ;
    if (id === "jm28" && window.JM28_COMICS_QUIZ) return window.JM28_COMICS_QUIZ;
    return null;
  }

  function getLessonGame() {
    var id = getLessonId();
    if (id === "jm24" && window.IndicesGame) return window.IndicesGame;
    if (id === "jm25" && window.FactorGame) return window.FactorGame;
    if (id === "jm26" && window.BoundaryRunner) return window.BoundaryRunner;
    return null;
  }

  function getGamePresets() {
    var id = getLessonId();
    if (id === "jm24" && window.JM24_GAME_PRESETS) return window.JM24_GAME_PRESETS;
    if (id === "jm25" && window.JM25_GAME_PRESETS) return window.JM25_GAME_PRESETS;
    return [];
  }

  function hasGame() {
    return !!getLessonGame();
  }

  function getDefaultTab() {
    return "tools";
  }

  function parseHash() {
    var hash = (location.hash || "").replace("#", "");
    if (VALID_TABS.indexOf(hash) >= 0) return hash;
    return getDefaultTab();
  }

  function setHash(tab) {
    if (location.hash !== "#" + tab) {
      history.replaceState(null, "", "#" + tab);
    }
  }

  function langToggleHtml() {
    return (
      '<div class="lang-toggle" role="group" aria-label="Language">' +
      '  <button type="button" class="lang-btn' +
      (window.I18n.lang === "zh" ? " is-active" : "") +
      '" data-lang="zh">中</button>' +
      '  <button type="button" class="lang-btn' +
      (window.I18n.lang === "en" ? " is-active" : "") +
      '" data-lang="en">EN</button>' +
      "</div>"
    );
  }

  function renderShell() {
    var topic = getTopic();
    if (!topic) {
      document.getElementById("app").innerHTML = "<p>Lesson not found.</p>";
      return;
    }

    var title = t("topic." + topic.id + ".title", topic.title);
    document.title = topic.code + " · " + title + " · S3 Mathematics";

    var app = document.getElementById("app");
    app.innerHTML =
      '<header class="topbar">' +
      '  <a class="back-link" href="/s3-maths/#lessons" data-i18n="lesson.back">' +
      t("lesson.back", "← S3 Lessons") +
      "</a>" +
      '  <div class="lesson-brand">' +
      '    <p class="lesson-kicker">' +
      topic.code +
      " · Lesson " +
      topic.lesson +
      "</p>" +
      "    <h1>" +
      title +
      "</h1>" +
      "  </div>" +
      langToggleHtml() +
      '  <nav class="main-tabs" aria-label="Lesson sections">' +
      '    <button type="button" class="main-tab" data-tab="tools" data-i18n="tab.tools">' +
      t("tab.tools", "Interactive Tools") +
      "</button>" +
      '    <button type="button" class="main-tab" data-tab="comics" data-i18n="tab.comics">' +
      t("tab.comics", "Comics") +
      "</button>" +
      '    <button type="button" class="main-tab" data-tab="game" data-i18n="tab.game">' +
      t("tab.game", "Game") +
      "</button>" +
      "  </nav>" +
      "</header>" +
      '<main class="lesson-main">' +
      '  <section id="view-tools" class="view"></section>' +
      '  <section id="view-comics" class="view"></section>' +
      '  <section id="view-game" class="view"></section>' +
      "</main>";

    app.querySelector(".main-tabs").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      switchTab(btn.getAttribute("data-tab"));
    });

    app.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.I18n.setLang(btn.getAttribute("data-lang"));
        window.LessonShell.refresh();
      });
    });

    renderToolsView(topic);
    renderComicsView(topic);
    renderGameView(topic);
    switchTab(parseHash(), true);
  }

  function switchTab(tab, skipHash) {
    if (VALID_TABS.indexOf(tab) < 0) tab = getDefaultTab();
    activeTab = tab;
    if (!skipHash) setHash(tab);

    document.querySelectorAll(".main-tab").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tab);
    });

    document.querySelectorAll(".view").forEach(function (view) {
      view.classList.toggle("is-active", view.id === "view-" + tab);
    });

    var game = getLessonGame();
    if (game) {
      if (tab === "game") {
        game.onShow && game.onShow();
      } else {
        game.onHide && game.onHide();
      }
    }
  }

  function renderComingSoon(titleKey, descText) {
    return (
      '<div class="coming-soon">' +
      "<h2>" +
      t(titleKey, titleKey) +
      "</h2>" +
      "<p>" +
      descText +
      "</p>" +
      "</div>"
    );
  }

  function renderToolsView(topic) {
    var el = document.getElementById("view-tools");
    if (!el) return;

    if (topic.id === "jm24") {
      el.innerHTML =
        '<div class="hero-panel"><p>' +
        t("tools.jm24.intro", "") +
        "</p></div>" +
        '<div class="tool-pills" id="tool-pills">' +
        '  <button type="button" class="tool-pill' +
        (activeToolPill === "powers" ? " is-active" : "") +
        ' is-disabled" data-tool="powers" disabled>' +
        t("tools.pill.powers", "Powers") +
        "</button>" +
        '  <button type="button" class="tool-pill' +
        (activeToolPill === "sci-notation" ? " is-active" : "") +
        '" data-tool="sci-notation">' +
        t("tools.pill.sciNotation", "Scientific Notation") +
        "</button>" +
        '  <button type="button" class="tool-pill' +
        (activeToolPill === "binary" ? " is-active" : "") +
        ' is-disabled" data-tool="binary" disabled>' +
        t("tools.pill.binary", "Binary") +
        "</button>" +
        "</div>" +
        '<div id="tool-content"></div>';

      el.querySelector("#tool-pills").addEventListener("click", function (e) {
        var btn = e.target.closest("[data-tool]");
        if (!btn || btn.disabled) return;
        activeToolPill = btn.getAttribute("data-tool");
        el.querySelectorAll(".tool-pill").forEach(function (pill) {
          pill.classList.toggle("is-active", pill === btn);
        });
        renderToolContent(topic);
      });

      renderToolContent(topic);
      return;
    }

    if (topic.id === "jm25") {
      if (activeToolPill !== "factorization" && activeToolPill !== "cross-method") {
        activeToolPill = "factorization";
      }

      el.innerHTML =
        '<div class="hero-panel"><p>' +
        t("tools.jm25.intro", "") +
        "</p></div>" +
        '<div class="tool-pills" id="tool-pills">' +
        '  <button type="button" class="tool-pill' +
        (activeToolPill === "factorization" ? " is-active" : "") +
        '" data-tool="factorization">' +
        t("tools.pill.jm25Factorization", "Normal Factorization") +
        "</button>" +
        '  <button type="button" class="tool-pill' +
        (activeToolPill === "cross-method" ? " is-active" : "") +
        '" data-tool="cross-method">' +
        t("tools.pill.jm25CrossMethod", "Cross Method") +
        "</button>" +
        "</div>" +
        '<div id="tool-content"></div>';

      el.querySelector("#tool-pills").addEventListener("click", function (e) {
        var btn = e.target.closest("[data-tool]");
        if (!btn || btn.disabled) return;
        activeToolPill = btn.getAttribute("data-tool");
        el.querySelectorAll(".tool-pill").forEach(function (pill) {
          pill.classList.toggle("is-active", pill === btn);
        });
        renderToolContent(topic);
      });

      renderToolContent(topic);
      return;
    }

    el.innerHTML = renderComingSoon(
      "soon.tools.title",
      topic.title + " " + t("soon.tools.desc", "")
    );
  }

  function renderToolContent(topic) {
    var root = document.getElementById("tool-content");
    if (!root) return;

    if (window.SciNotationTool && window.SciNotationTool.destroy) {
      window.SciNotationTool.destroy();
    }
    if (window.FactorTool && window.FactorTool.destroy) {
      window.FactorTool.destroy();
    }

    if (topic.id === "jm25" && window.FactorTool) {
      if (activeToolPill === "cross-method") {
        window.FactorTool.init(root, "cross-method");
      } else {
        window.FactorTool.init(root, "factorization");
      }
      return;
    }

    if (activeToolPill === "sci-notation" && window.SciNotationTool) {
      window.SciNotationTool.init(root);
      return;
    }

    root.innerHTML =
      '<div class="tool-section">' +
      '  <p class="section-label">' +
      t("tools.jm24.part1", "") +
      "</p>" +
      "  <h2>" +
      t("tools.jm24.title", "") +
      "</h2>" +
      "  <p>" +
      t("tools.jm24.desc", "") +
      "</p>" +
      "</div>";
  }

  function renderComicsView(topic) {
    var el = document.getElementById("view-comics");
    if (!el) return;

    if (!hasComics()) {
      el.innerHTML = renderComingSoon(
        "soon.comics.title",
        t("soon.comics.desc", "") +
          " " +
          topic.title +
          " " +
          t("soon.comics.suffix", "")
      );
      return;
    }

    var manifest = getComicsManifest();
    var order = getComicOrder();
    var currentTopic = getActiveComicTopic();
    var introKey = getComicsIntroKey();
    var introText = t(introKey, t("comics.intro", ""));

    var subtabsHtml = "";
    if (order.length > 1) {
      subtabsHtml =
        '<div class="comic-subtabs" id="comic-subtabs">' +
        order
          .map(function (key) {
            var comicTopic = manifest[key];
            var label = comicTopic.labelKey
              ? t(comicTopic.labelKey, comicTopic.label)
              : comicTopic.label;
            return (
              '<button type="button" class="comic-subtab' +
              (key === currentTopic ? " is-active" : "") +
              '" data-comic-topic="' +
              key +
              '">' +
              label +
              "</button>"
            );
          })
          .join("") +
        "</div>";
    }

    el.innerHTML =
      '<div class="hero-panel"><p>' +
      introText +
      "</p></div>" +
      subtabsHtml +
      '<div id="comic-content"></div>';

    var subtabsEl = el.querySelector("#comic-subtabs");
    if (subtabsEl) {
      subtabsEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-comic-topic]");
        if (!btn) return;
        activeComicTopic = btn.getAttribute("data-comic-topic");
        el.querySelectorAll(".comic-subtab").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        renderComicGrid(activeComicTopic);
      });
    }

    renderComicGrid(currentTopic);
  }

  function renderComicQuiz(topicKey) {
    var quizBank = getComicsQuiz();
    if (!quizBank || !quizBank[topicKey]) return "";
    if (typeof window.buildQuizQuestionHtml !== "function") return "";

    var lang = window.I18n.lang === "zh" ? "zh" : "en";
    var questions = quizBank[topicKey];

    var cards = questions
      .map(function (q, i) {
        return window.buildQuizQuestionHtml(q, i, lang);
      })
      .join("");

    return (
      '<section class="quiz-section" id="comic-quiz">' +
      '<h3 class="quiz-heading" data-i18n="quiz.title">' +
      t("quiz.title", "Check your understanding") +
      "</h3>" +
      cards +
      "</section>"
    );
  }

  function wireQuizHandlers(topicKey) {
    var quizSection = document.getElementById("comic-quiz");
    var quizBank = getComicsQuiz();
    if (!quizSection || !quizBank || !quizBank[topicKey]) return;

    var lang = window.I18n.lang === "zh" ? "zh" : "en";
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

  function renderComicGrid(topicKey) {
    var container = document.getElementById("comic-content");
    var manifest = getComicsManifest();
    if (!container || !manifest) return;

    var topic = manifest[topicKey];
    if (!topic) return;
    var scopedList = window.getComicFlatListForTopic
      ? window.getComicFlatListForTopic(topicKey)
      : [];

    if (window.ComicsReader) {
      window.ComicsReader.init(topicKey);
    }

    var chapterLabel = t("comic.chapter", "Chapter");
    var lawCardLabel = t("comic.lawCard", "Summary card");
    var topicLabel = topic.labelKey
      ? t(topic.labelKey, topic.label)
      : topic.label;

    var cards = topic.chapters
      .map(function (ch, i) {
        var src = topic.basePath + ch.file;
        return (
          '<button type="button" class="comic-card" data-topic="' +
          topicKey +
          '" data-index="' +
          i +
          '">' +
          '  <div class="comic-thumb-wrap"><img src="' +
          src +
          '" alt="" loading="lazy" /></div>' +
          '  <div class="comic-card-body"><strong>' +
          ch.title +
          '</strong><span>' +
          chapterLabel +
          "</span></div>" +
          "</button>"
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
        '  <div class="comic-thumb-wrap"><img src="' +
        lawSrc +
        '" alt="" loading="lazy" /></div>' +
        '  <div class="comic-card-body"><strong>' +
        card.title +
        '</strong><span>' +
        lawCardLabel +
        "</span></div>" +
        "</button>";
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
      renderComicQuiz(topicKey);

    container.querySelectorAll(".comic-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var tk = card.getAttribute("data-topic");
        var idx = parseInt(card.getAttribute("data-index"), 10);
        if (window.ComicsReader) {
          window.ComicsReader.openAt(tk, idx);
        }
      });
    });

    wireQuizHandlers(topicKey);
  }

  function renderGamePresetPills() {
    var presets = getGamePresets();
    return presets
      .map(function (preset, index) {
        var label =
          window.I18n && window.I18n.lang === "zh" ? preset.labelZh : preset.labelEn;
        return (
          '<button type="button" class="game-preset-pill' +
          (index === 0 ? " is-active" : "") +
          '" data-preset="' +
          preset.id +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");
  }

  function renderJM26GameHtml(topic) {
    var titleKey = "game.title." + topic.id;
    var introKey = "game.intro." + topic.id;
    return (
      '<div class="indices-game runner-game">' +
      '  <div class="game-head">' +
      "    <div>" +
      "      <h2>" +
      t(titleKey, t("game.title", "Boundary Runner")) +
      "</h2>" +
      '      <p class="game-intro">' +
      t(introKey, t("game.intro", "")) +
      "</p>" +
      "    </div>" +
      '    <div class="game-hud" id="game-hud">' +
      '      <span><span data-i18n="game.lives">' +
      t("game.lives", "Lives") +
      '</span>: <strong id="hud-lives">3</strong></span>' +
      '      <span><span data-i18n="game.progress">' +
      t("game.progress", "Progress") +
      '</span>: <strong id="hud-progress">—</strong></span>' +
      "    </div>" +
      "  </div>" +
      '  <div id="runner-map-view">' +
      '    <div class="runner-map" id="runner-map"></div>' +
      "  </div>" +
      '  <div id="runner-play-view" hidden>' +
      '    <div class="game-wrap">' +
      '      <div class="solve-panel" id="solve-panel"></div>' +
      '      <canvas id="game-canvas" width="900" height="520"></canvas>' +
      '      <div class="game-touch" id="game-touch">' +
      '        <button type="button" id="btn-left" aria-label="Left">◀</button>' +
      '        <button type="button" id="btn-jump" data-i18n="game.runner.jump">' +
      t("game.runner.jump", "Jump") +
      "</button>" +
      '        <button type="button" id="btn-right" aria-label="Right">▶</button>' +
      "      </div>" +
      '      <div class="game-overlay" id="run-overlay">' +
      '        <div class="overlay-card">' +
      '          <h3 id="run-overlay-title"></h3>' +
      '          <p id="run-overlay-msg"></p>' +
      '          <p id="run-overlay-weakest" class="overlay-weakest" hidden></p>' +
      '          <div class="overlay-actions">' +
      '            <button type="button" class="reader-nav" id="btn-run-retry" data-i18n="game.again">' +
      t("game.again", "Play again") +
      "</button>" +
      '            <button type="button" class="reader-nav runner-next-level" id="btn-run-next" hidden data-i18n="game.runner.nextLevel">' +
      t("game.runner.nextLevel", "Next level →") +
      "</button>" +
      '            <button type="button" class="reader-nav" id="btn-run-map" data-i18n="game.runner.backMap">' +
      t("game.runner.backMap", "← World map") +
      "</button>" +
      '            <button type="button" class="reader-nav overlay-review" id="btn-run-review" hidden data-i18n="game.reviewComics">' +
      t("game.reviewComics", "Review comics →") +
      "</button>" +
      "          </div>" +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</div>"
    );
  }

  function renderGameHtml(topic) {
    if (topic.id === "jm26") {
      return renderJM26GameHtml(topic);
    }
    var titleKey = "game.title." + topic.id;
    var introKey = "game.intro." + topic.id;
    return (
      '<div class="indices-game">' +
      '  <div class="game-head">' +
      "    <div>" +
      "      <h2>" +
      t(titleKey, t("game.title", "Shooter")) +
      "</h2>" +
      '      <p class="game-intro">' +
      t(introKey, t("game.intro", "")) +
      "</p>" +
      "    </div>" +
      '    <div class="game-hud" id="game-hud">' +
      '      <span><span data-i18n="game.lives">' +
      t("game.lives", "Lives") +
      '</span>: <strong id="hud-lives">3</strong></span>' +
      '      <span><span data-i18n="game.score">' +
      t("game.score", "Score") +
      '</span>: <strong id="hud-score">0</strong></span>' +
      '      <span><span data-i18n="game.combo">' +
      t("game.combo", "Combo") +
      '</span>: <strong id="hud-combo">0</strong></span>' +
      '      <span><span data-i18n="game.progress">' +
      t("game.progress", "Progress") +
      '</span>: <strong id="hud-progress">—</strong></span>' +
      '      <span><span data-i18n="game.best">' +
      t("game.best", "Best") +
      '</span>: <strong id="hud-best">0</strong></span>' +
      "    </div>" +
      "  </div>" +
      '  <div class="game-preset-pills" role="group" aria-label="Topic preset">' +
      renderGamePresetPills() +
      "  </div>" +
      '  <div class="game-wrap">' +
      '    <div class="game-question" id="game-question"></div>' +
      '    <p class="game-toast" id="game-toast" aria-live="polite"></p>' +
      '    <canvas id="game-canvas" width="900" height="520"></canvas>' +
      '    <div class="game-touch" id="game-touch">' +
      '      <button type="button" id="btn-left" aria-label="Left">◀</button>' +
      '      <button type="button" id="btn-fire" data-i18n="game.fire">' +
      t("game.fire", "Fire") +
      "</button>" +
      '      <button type="button" id="btn-right" aria-label="Right">▶</button>' +
      "    </div>" +
      '    <div class="game-overlay is-visible" id="game-overlay">' +
      '      <div class="overlay-card">' +
      '        <h3 id="overlay-title" data-i18n="game.ready">' +
      t("game.ready", "Ready?") +
      "</h3>" +
      '        <p id="overlay-msg" data-i18n="game.readyMsg">' +
      t("game.readyMsg", "") +
      "</p>" +
      '        <p id="overlay-weakest" class="overlay-weakest" hidden></p>' +
      '        <div class="overlay-actions">' +
      '        <button type="button" class="reader-nav" id="btn-start" data-i18n="game.start">' +
      t("game.start", "Start") +
      "</button>" +
      '        <button type="button" class="reader-nav overlay-review" id="btn-review-comics" hidden data-i18n="game.reviewComics">' +
      t("game.reviewComics", "Review comics →") +
      "</button>" +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</div>"
    );
  }

  function renderGameView(topic) {
    var el = document.getElementById("view-game");
    if (!el) return;

    if (window.IndicesGame && window.IndicesGame.destroy) {
      window.IndicesGame.destroy();
    }
    if (window.FactorGame && window.FactorGame.destroy) {
      window.FactorGame.destroy();
    }
    if (window.BoundaryRunner && window.BoundaryRunner.destroy) {
      window.BoundaryRunner.destroy();
    }

    if (!hasGame()) {
      el.innerHTML = renderComingSoon(
        "soon.game.title",
        topic.title + " " + t("soon.game.desc", "")
      );
      return;
    }

    el.innerHTML = renderGameHtml(topic);

    var game = getLessonGame();
    if (game && game.init) {
      game.init();
    }
  }

  window.LessonComics = {
    switchSubTopic: function switchSubTopic(topicKey) {
      activeComicTopic = topicKey;
      switchTab("comics", true);
      renderComicsView(getTopic());
      var comicsView = document.getElementById("view-comics");
      if (comicsView) {
        comicsView.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    getActiveSubTopic: function getActiveSubTopic() {
      return getActiveComicTopic();
    },
  };

  window.LessonShell = {
    refresh: function refresh() {
      renderShell();
    },
  };

  window.addEventListener("hashchange", function () {
    switchTab(parseHash(), true);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderShell);
  } else {
    renderShell();
  }
})();
