/* Quadrilaterals comics — image pages only (no follow-up questions). */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "para-definition",
      title: "What is a parallelogram?",
      chapter: "P1 · Definition",
      image: "comics/01-para-definition.png?v=20260818-jm29n",
    },
    {
      id: "para-prove-map",
      title: "Four prove tests — the map",
      chapter: "P2 · Prove map",
      image: "comics/02-para-five-tests-map.png?v=20260818-jm29h",
    },
    {
      id: "opp-sides-equal",
      title: "Opp. sides equal — stick intuition",
      chapter: "P3 · Opp. sides equal",
      image: "comics/03-opp-sides-equal-setup.png?v=20260827-jm29ae",
    },
    {
      id: "opp-angles-int",
      title: "Why opposite angles are equal",
      chapter: "P4 · //gram property",
      image: "comics/05-opp-angles-equal-why.png?v=20260827-jm29ae",
    },
    {
      id: "one-pair-equal-parallel",
      title: "Why 1 pair // and equal works",
      chapter: "P5 · 1 pair // and equal",
      image: "comics/06-one-pair-equal-parallel.png?v=20260827-jm29r",
    },
    {
      id: "diags-rotate-180",
      title: "Diagonals & rotate 180°",
      chapter: "P6 · Diags. bisect",
      image: "comics/07-diags-bisect-why.png?v=20260827-jm29w",
    },
    {
      id: "rhombus-definition",
      title: "What is a rhombus?",
      chapter: "P7 · Rhombus",
      image: "comics/08-rhombus-definition.png?v=20260827-jm29y",
    },
    {
      id: "rhombus-diags-perp",
      title: "Symmetry → right angle at centre",
      chapter: "P8 · Diags. of rhombus ⊥",
      image: "comics/09-rhombus-diags-perp.png?v=20260827-jm29u",
    },
    {
      id: "rhombus-bisect-angles",
      title: "Same symmetry bisects angles",
      chapter: "P9 · Diags. bisect ∠s",
      image: "comics/10-rhombus-bisect-angles.png?v=20260827-jm29z",
    },
    {
      id: "square-definition",
      title: "Square = definition",
      chapter: "P10 · Square",
      image: "comics/11-square-definition.png?v=20260827-jm29ac",
    },
    {
      id: "square-diags",
      title: "Square diagonals → 45°",
      chapter: "P11 · Square diags.",
      image: "comics/12-square-diags.png?v=20260827-jm29ac",
    },
    {
      id: "trapezium-definition",
      title: "What is a trapezium?",
      chapter: "P12 · Trapezium",
      image: "comics/13-trapezium-definition.png?v=20260827-jm29ae",
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
