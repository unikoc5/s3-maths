(function () {
  "use strict";

  function looksLikeTex(text) {
    return /\\[a-zA-Z]/.test(text);
  }

  function normalizeComicText(text) {
    if (!text) return text;
    return String(text).replace(/\$([^$\n]{1,80})\$/g, function (_, inner) {
      if (/^\d+(\.\d+)?$/.test(inner.trim()) || /\\|[A-Za-z]/.test(inner)) {
        return "\\(" + inner + "\\)";
      }
      return "$" + inner + "$";
    });
  }

  function renderMixed(el, text) {
    if (!text) return;
    text = normalizeComicText(text);
    if (window.katex && looksLikeTex(text) && text.indexOf("\\(") < 0 && text.indexOf("\\[") < 0) {
      try {
        katex.render(text, el, { throwOnError: false });
        return;
      } catch (e) { /* fall through */ }
    }
    el.textContent = "";
    text.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
      if (!part) return;
      if (part.indexOf("**") === 0) {
        var strong = document.createElement("strong");
        strong.textContent = part.slice(2, -2);
        el.appendChild(strong);
      } else {
        var span = document.createElement("span");
        span.textContent = part;
        el.appendChild(span);
      }
    });
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  function pageCaption(comic) {
    if (window.I18n && window.I18n.lang === "zh" && comic.captionZh) {
      return comic.captionZh;
    }
    return comic.caption || comic.captionEn || "";
  }

  window.jmComicsFromTopic = function (topic, checksById) {
    var pages = [];
    if (!topic) return pages;
    (topic.chapters || []).forEach(function (ch, i) {
      pages.push({
        id: ch.id,
        chip: "P" + (i + 1),
        title: String(ch.title || "").replace(/^Chapter\s+\d+\s+[—–-]\s+/, ""),
        chapter: ch.title,
        image: topic.basePath + ch.file,
        captionEn: ch.captionEn,
        captionZh: ch.captionZh,
        checks: checksById && checksById[ch.id],
      });
    });
    var cards = topic.lawCards || (topic.lawCard ? [topic.lawCard] : []);
    cards.forEach(function (card, i) {
      var id = card.id || ("law" + (i + 1));
      pages.push({
        id: id,
        chip: "P" + (pages.length + 1),
        title: card.title,
        chapter: "Summary",
        image: topic.basePath + card.file,
        checks: checksById && checksById[id],
      });
    });
    return pages;
  };

  window.initJmComics = function (comics) {
    var subnav = document.getElementById("comics-subnav");
    var stage = document.getElementById("comics-stage");
    if (!subnav || !stage || !comics || !comics.length) return;

    subnav.innerHTML = "";
    stage.innerHTML = "";

    var state = { index: 0, answers: {} };
    var chips = [];

    function hasChecks(comic) {
      return !!(comic.checks && comic.checks.length);
    }

    function complete(comic) {
      if (!hasChecks(comic)) return true;
      return comic.checks.every(function (q) {
        return Object.prototype.hasOwnProperty.call(state.answers, q.id);
      });
    }

    function go(i) {
      if (i < 0 || i >= comics.length) return;
      state.index = i;
      chips.forEach(function (c, j) { c.classList.toggle("active", j === i); });
      render();
    }

    comics.forEach(function (comic, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (i === 0 ? " active" : "");
      btn.textContent = comic.chip || ("P" + (i + 1));
      btn.title = (comic.chapter || "") + " \u2014 " + (comic.title || "");
      btn.addEventListener("click", function () { go(i); });
      subnav.appendChild(btn);
      chips.push(btn);
    });

    function buildCheck(q, qi) {
      var card = document.createElement("article");
      card.className = "quiz-card";
      var answered = Object.prototype.hasOwnProperty.call(state.answers, q.id);
      var selected = state.answers[q.id];
      var ok = selected === q.answer;

      var head = document.createElement("div");
      head.className = "quiz-head";
      var num = document.createElement("span");
      num.className = "quiz-num";
      num.textContent = qi + 1 + ".";
      var prompt = document.createElement("div");
      prompt.className = "quiz-prompt";
      renderMixed(prompt, q.prompt);
      head.appendChild(num);
      head.appendChild(prompt);
      if (answered) {
        var mark = document.createElement("span");
        mark.className = "quiz-mark " + (ok ? "ok" : "bad");
        mark.textContent = ok ? "\u2713" : "\u2717";
        head.appendChild(mark);
      }
      card.appendChild(head);

      var mc = document.createElement("div");
      mc.className = "quiz-mc";
      q.choices.forEach(function (choice, ci) {
        var label = document.createElement("label");
        label.className = "quiz-mc-opt";
        if (answered) {
          label.classList.add("locked");
          if (ci === q.answer) label.classList.add("reveal-ok");
          else if (ci === selected) label.classList.add("reveal-bad");
        }
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "jm-comic-" + q.id;
        input.disabled = answered;
        if (selected === ci) input.checked = true;
        input.addEventListener("change", function () {
          state.answers[q.id] = ci;
          render();
        });
        var letter = document.createElement("span");
        letter.textContent = String.fromCharCode(65 + ci) + ".";
        var tex = document.createElement("span");
        renderMixed(tex, choice);
        label.appendChild(input);
        label.appendChild(letter);
        label.appendChild(tex);
        mc.appendChild(label);
      });
      card.appendChild(mc);

      if (answered) {
        var result = document.createElement("div");
        result.className = "quiz-result";
        renderMixed(result, (ok ? "Correct. " : "Not quite. ") + q.explain);
        card.appendChild(result);
      }
      return card;
    }

    function render() {
      var comic = comics[state.index];
      stage.innerHTML = "";
      var article = document.createElement("article");
      article.className = "comic-page";

      var head = document.createElement("div");
      head.className = "comic-page-head";
      var chap = document.createElement("div");
      chap.className = "comic-chapter";
      chap.textContent = comic.chapter || "";
      var title = document.createElement("h2");
      title.textContent = comic.title || "";
      head.appendChild(chap);
      head.appendChild(title);
      article.appendChild(head);

      if (comic.image) {
        var fig = document.createElement("figure");
        fig.className = "comic-figure";
        var img = document.createElement("img");
        img.src = comic.image;
        img.alt = (comic.title || "Comic") + " \u2014 educational comic page";
        img.loading = "lazy";
        fig.appendChild(img);
        article.appendChild(fig);
      }

      var caption = pageCaption(comic);
      if (caption) {
        var cap = document.createElement("p");
        cap.className = "comic-caption";
        renderMixed(cap, caption);
        article.appendChild(cap);
      }

      if (comic.text) {
        var body = document.createElement("div");
        body.className = "comic-body";
        renderMixed(body, comic.text);
        article.appendChild(body);
      }

      if (hasChecks(comic)) {
        var checks = document.createElement("div");
        checks.className = "comic-checks";
        var h3 = document.createElement("h3");
        h3.textContent = "Concept checking";
        checks.appendChild(h3);
        comic.checks.forEach(function (q, qi) {
          checks.appendChild(buildCheck(q, qi));
        });
        article.appendChild(checks);
      }

      if (complete(comic) && state.index < comics.length - 1) {
        var nav = document.createElement("div");
        nav.className = "comic-chapter-nav";
        var next = document.createElement("button");
        next.type = "button";
        next.className = "comic-chapter-next";
        next.textContent = "Next: " + comics[state.index + 1].title + " \u2192";
        next.addEventListener("click", function () { go(state.index + 1); });
        nav.appendChild(next);
        article.appendChild(nav);
      }

      stage.appendChild(article);
    }

    render();
  };

  window.initJmComicsBundle = function (series) {
    if (!series || !series.length) return;
    var seriesNav = document.getElementById("comics-series-nav");
    var current = 0;

    function show(i) {
      current = i;
      if (seriesNav) {
        [].forEach.call(seriesNav.querySelectorAll(".chip"), function (c, j) {
          c.classList.toggle("active", j === i);
        });
      }
      window.initJmComics(series[i].comics);
    }

    if (seriesNav) {
      seriesNav.innerHTML = "";
      if (series.length > 1) {
        series.forEach(function (s, i) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "chip" + (i === 0 ? " active" : "");
          btn.textContent = s.label;
          btn.addEventListener("click", function () { show(i); });
          seriesNav.appendChild(btn);
        });
      }
    }

    show(0);
  };
})();
