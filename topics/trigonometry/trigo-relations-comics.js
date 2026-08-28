/* Trigonometric Relations comics — image pages only (no follow-up questions). */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "lunchbox-45",
      title: "Lunchbox 45°",
      chapter: "P1 · 45°",
      image: "comics/01-lunchbox-45.png?v=20260828-hd",
    },
    {
      id: "road-sign-30-60",
      title: "Road sign 30°/60°",
      chapter: "P2 · 30°/60°",
      image: "comics/02-road-sign-30-60.png?v=20260828-hd",
    },
    {
      id: "phone-stand-memory",
      title: "Phone stand & memory",
      chapter: "P3 · Special values",
      image: "comics/03-phone-stand-memory.png?v=20260828-hd",
    },
    {
      id: "ladder-identity",
      title: "Ladder of length 1",
      chapter: "P4 · Identity",
      image: "comics/04-ladder-identity.png?v=20260828-hd",
    },
    {
      id: "one-photo-ratios",
      title: "One photo, three ratios",
      chapter: "P5 · tan = sin/cos",
      image: "comics/05-one-photo-ratios.png?v=20260828-hd",
    },
    {
      id: "other-corner",
      title: "Look from the other corner",
      chapter: "P6 · Co-functions",
      image: "comics/06-other-corner.png?v=20260828-hd",
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
