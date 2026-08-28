/* Triangle centres comics — image pages only (no follow-up questions). */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "incenter-cake",
      title: "The biggest cake circle",
      chapter: "P1 · Incentre I",
      image: "comics/01-incenter-cake.png?v=20260818-jm28k",
    },
    {
      id: "circumcenter-meet",
      title: "A fair meeting point",
      chapter: "P2 · Circumcentre O",
      image: "comics/02-circumcenter-meet.png?v=20260827-jm28w",
    },
    {
      id: "centroid-balance",
      title: "Where it balances",
      chapter: "P3 · Centroid G",
      image: "comics/03-centroid-balance.png?v=20260818-jm28g",
    },
    {
      id: "orthocenter-block",
      title: "Block all three paths",
      chapter: "P4 · Orthocentre H",
      image: "comics/04-orthocenter-block.png?v=20260818-jm28g",
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
