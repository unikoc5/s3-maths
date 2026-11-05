/* JM29 comics - six-page classroom story. */
(function () {
  "use strict";

  var COMICS = [
    {
      id: "tilted-square",
      chip: "P1",
      title: "The tilted square",
      chapter: "P1 - Shape versus orientation",
      image: "comics/jm29-v11-01-tilted-square.png?v=20260913-geometry-v14",
    },
    {
      id: "same-person-same-shape",
      chip: "P2",
      title: "Same person, same shape",
      chapter: "P2 - Defining properties",
      image: "comics/jm29-v11-02-same-person-same-shape.png?v=20260913-geometry-v14",
    },
    {
      id: "never-judge-by-eye",
      chip: "P3",
      title: "Never judge by eye",
      chapter: "P3 - Read the given facts",
      image: "comics/jm29-v11-03-never-judge-by-eye.png?v=20260913-geometry-v14",
    },
    {
      id: "all-in-one-square",
      chip: "P4",
      title: "The all-in-one square",
      chapter: "P4 - The quadrilateral family",
      image: "comics/jm29-v11-04-all-in-one-square.png?v=20260913-geometry-v14",
    },
    {
      id: "meet-the-kite",
      chip: "P5",
      title: "Meet the kite",
      chapter: "P5 - Enrichment",
      image: "comics/jm29-v11-05-meet-the-kite.png?v=20260913-geometry-v14",
    },
    {
      id: "expanding-gate",
      chip: "P6",
      title: "Why the gate can fold",
      chapter: "P6 - Parallelogram structures",
      image: "comics/jm29-v11-06-expanding-gate.png?v=20260913-geometry-v14",
    },
  ];

  function start() {
    if (window.initJmComics) window.initJmComics(COMICS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
