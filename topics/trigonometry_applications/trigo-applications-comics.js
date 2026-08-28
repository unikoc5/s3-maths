/* Application of Trigonometry comics — image pages only (no follow-up questions). */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "inclination-ramp",
      title: "Why is the ramp so long?",
      chapter: "P1A · Inclination",
      image: "comics/01-inclination-ramp.png?v=20260828-hd2",
    },
    {
      id: "measuring-slope",
      title: "Measuring the slope",
      chapter: "P1B · Inclination",
      image: "comics/02-measuring-slope.png?v=20260828-hd2",
    },
    {
      id: "map-scale",
      title: "Why does the bridge look so short?",
      chapter: "P2 · Scale",
      image: "comics/03-map-scale.png?v=20260827-jm35b",
    },
    {
      id: "depression-elevation",
      title: "Looking down, looking up",
      chapter: "P3A · Elevation & depression",
      image: "comics/04-depression-elevation.png?v=20260828-hd2",
    },
    {
      id: "how-far-down",
      title: "How far down?",
      chapter: "P3B · Elevation & depression",
      image: "comics/05-how-far-down.png?v=20260828-hd2",
    },
    {
      id: "true-bearings",
      title: "Where did it go?",
      chapter: "P4A · Bearings",
      image: "comics/06-true-bearings.png?v=20260828-hd2",
    },
    {
      id: "reverse-bearings",
      title: "The way back",
      chapter: "P4B · Bearings",
      image: "comics/07-reverse-bearings.png?v=20260828-hd2",
    },
    {
      id: "ferry-shortcut",
      title: "The ferry's shortcut",
      chapter: "P4C · Bearings",
      image: "comics/08-ferry-shortcut.png?v=20260828-hd2",
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
