/* Measures of Central Tendencies comics — image pages only (no follow-up questions). */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "mean-equal-tea",
      title: "Half milk in every sip",
      chapter: "P1 · Mean",
      image: "comics/01-mean-equal-tea.png?v=20260816-jm31b",
    },
    {
      id: "weighted-creamier",
      title: "Creamier tea, weighted mean",
      chapter: "P2 · Weighted mean",
      image: "comics/02-weighted-creamier.png?v=20260816-jm31b",
    },
    {
      id: "median-lamp-meet",
      title: "Meeting at the lamp posts",
      chapter: "P3 · Median",
      image: "comics/03-median-lamp-meet.png?v=20260816-jm31b",
    },
    {
      id: "median-why-plus-one",
      title: "Why (n+1)/2 ?",
      chapter: "P4 · Median formula",
      image: "comics/04-median-why-plus-one.png?v=20260816-jm31b",
    },
    {
      id: "median-zero-start",
      title: "When do we just ÷2 ?",
      chapter: "P5 · 0-start vs 1-start",
      image: "comics/05-median-zero-start.png?v=20260816-jm31b",
    },
    {
      id: "mode-animal-vote",
      title: "Mode is not 300",
      chapter: "P6 · Mode",
      image: "comics/06-mode-animal-vote.png?v=20260818-jm31c",
    },
    {
      id: "choose-average",
      title: "Mean, median, or mode?",
      chapter: "P7 · Which to choose",
      image: "comics/07-choose-average.png?v=20260818-jm31d",
    },
  ];

  function initComics() {
    var subnav = document.getElementById("comics-subnav");
    var stage = document.getElementById("comics-stage");
    if (!subnav || !stage) return;

    var index = 0;
    var chips = [];

    function goTo(i) {
      if (i < 0 || i >= COMICS.length) return;
      index = i;
      chips.forEach(function (chip, j) {
        chip.classList.toggle("active", j === index);
      });
      render();
    }

    COMICS.forEach(function (comic, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (i === 0 ? " active" : "");
      btn.textContent = "P" + (i + 1);
      btn.title = comic.chapter + " — " + comic.title;
      btn.addEventListener("click", function () { goTo(i); });
      subnav.appendChild(btn);
      chips.push(btn);
    });

    function render() {
      var comic = COMICS[index];
      stage.innerHTML = "";

      var article = document.createElement("article");
      article.className = "comic-page";

      var head = document.createElement("div");
      head.className = "comic-page-head";
      var chap = document.createElement("span");
      chap.className = "comic-chapter";
      chap.textContent = comic.chapter;
      var title = document.createElement("h2");
      title.textContent = comic.title;
      head.appendChild(chap);
      head.appendChild(title);
      article.appendChild(head);

      var fig = document.createElement("figure");
      fig.className = "comic-figure";
      var img = document.createElement("img");
      img.src = comic.image;
      img.alt = comic.title + " — educational comic page";
      img.loading = "lazy";
      fig.appendChild(img);
      article.appendChild(fig);

      if (index < COMICS.length - 1) {
        var nav = document.createElement("div");
        nav.className = "comic-chapter-nav";
        var nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "comic-chapter-next";
        nextBtn.textContent = "Next page: " + COMICS[index + 1].title + " →";
        nextBtn.addEventListener("click", function () { goTo(index + 1); });
        nav.appendChild(nextBtn);
        article.appendChild(nav);
      }

      stage.appendChild(article);
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComics);
  } else {
    initComics();
  }
})();
