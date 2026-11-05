window.JM28_COMICS = {
  triangleLines: {
    id: "triangleLines",
    label: "Special Lines in Triangles",
    labelKey: "comic.jm28.triangleLines",
    series: "Special Lines & Centres in Triangles",
    basePath: "../../Special lines and centres in triangles/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — Altitude",
        file: "triangle-lines-chapter-1-color.png",
      },
      {
        id: "ch2",
        title: "Chapter 2 — Median",
        file: "triangle-lines-chapter-2-color.png",
      },
      {
        id: "ch3",
        title: "Chapter 3 — Angle Bisector",
        file: "triangle-lines-chapter-3-color.png",
      },
      {
        id: "ch4",
        title: "Chapter 4 — Perpendicular Bisector",
        file: "triangle-lines-chapter-4-color.png",
      },
      {
        id: "ch5",
        title: "Chapter 5 — Orthocentre",
        file: "triangle-centres-chapter-5-orthocentre-color.png",
      },
      {
        id: "ch6",
        title: "Chapter 6 — Centroid",
        file: "triangle-centres-chapter-6-centroid-color.png",
      },
      {
        id: "ch7",
        title: "Chapter 7 — In-centre",
        file: "triangle-centres-chapter-7-incentre-color.png",
      },
      {
        id: "ch8",
        title: "Chapter 8 — Circumcentre",
        file: "triangle-centres-chapter-8-circumcentre-color.png",
      },
    ],
    lawCard: {
      title: "Four Special Lines — Quick Reference",
      file: "triangle-lines-laws-card-color.png",
    },
    lawCards: [
      {
        title: "Four Special Lines — Quick Reference",
        file: "triangle-lines-laws-card-color.png",
      },
      {
        title: "Four Triangle Centres — Quick Reference",
        file: "triangle-centres-quick-reference-color.png",
      },
    ],
  },
  anglePairs: {
    id: "anglePairs",
    label: "Angle Pairs",
    labelKey: "comic.jm28.anglePairs",
    series: "Angle Pairs in Parallel Lines",
    basePath: "../../Special lines and centres in triangles/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — Parallel Lines and a Transversal",
        file: "angle-pairs-chapter-1-color.png",
      },
      {
        id: "ch2",
        title: "Chapter 2 — Corresponding Angles",
        file: "angle-pairs-chapter-2-color.png",
      },
      {
        id: "ch3",
        title: "Chapter 3 — Alternate Angles",
        file: "angle-pairs-chapter-3-color.png",
      },
      {
        id: "ch4",
        title: "Chapter 4 — Co-interior Angles",
        file: "angle-pairs-chapter-4-color.png",
      },
    ],
    lawCard: {
      title: "Angle Pairs — Quick Reference",
      file: "angle-pairs-quick-reference-color.png",
    },
  },
  similarCongruent: {
    id: "similarCongruent",
    label: "Similar & Congruent Triangles",
    labelKey: "comic.jm28.similarCongruent",
    series: "Similar & Congruent Triangles",
    basePath: "../../Special lines and centres in triangles/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — The Entrance Gate: Corresponding Parts",
        file: "similar-congruent-chapter-1-labels-fixed.png",
      },
      {
        id: "ch2",
        title: "Chapter 2 — The Mirror Corridor: Similar Triangles",
        file: "similar-congruent-chapter-2-layout-fixed.png",
      },
      {
        id: "ch3",
        title: "Chapter 3 — The Crystal Bridge: Similarity Tests",
        file: "similar-congruent-chapter-3-layout-fixed.png",
      },
      {
        id: "ch4",
        title: "Chapter 4 — The Twin Statues: Congruent Triangles",
        file: "similar-congruent-chapter-4-layout-fixed.png",
      },
      {
        id: "ch5",
        title: "Chapter 5 — The Gear Gate: SSS and SAS",
        file: "similar-congruent-chapter-5-layout-fixed.png",
      },
      {
        id: "ch6",
        title: "Chapter 6 — The Final Seal: ASA, AAS and RHS",
        file: "similar-congruent-chapter-6-layout-fixed.png",
      },
    ],
    lawCard: {
      title: "The Treasure Scroll — Quick Reference",
      file: "similar-congruent-quick-reference-color.png",
    },
  },
};

window.JM28_COMIC_ORDER = ["triangleLines", "anglePairs", "similarCongruent"];

window.buildComicFlatListForTopic = function buildComicFlatListForTopic(topicKey) {
  var topic = window.JM28_COMICS[topicKey];
  if (!topic) return [];

  var list = topic.chapters.map(function (ch, i) {
    return {
      topicKey: topicKey,
      topicLabel: topic.label,
      series: topic.series,
      type: "chapter",
      index: i,
      title: ch.title,
      src: topic.basePath + ch.file,
    };
  });

  var cards = topic.lawCards || (topic.lawCard ? [topic.lawCard] : []);
  cards.forEach(function (card, i) {
    list.push({
      topicKey: topicKey,
      topicLabel: topic.label,
      series: topic.series,
      type: "lawCard",
      index: topic.chapters.length + i,
      title: card.title,
      src: topic.basePath + card.file,
    });
  });

  return list;
};

window.getComicFlatListForTopic = window.buildComicFlatListForTopic;

window.getNextComicTopicKey = function getNextComicTopicKey(topicKey) {
  var idx = window.JM28_COMIC_ORDER.indexOf(topicKey);
  if (idx < 0 || idx >= window.JM28_COMIC_ORDER.length - 1) return null;
  return window.JM28_COMIC_ORDER[idx + 1];
};

window.getComicFlatList = function getComicFlatList() {
  var list = [];
  window.JM28_COMIC_ORDER.forEach(function (key) {
    list = list.concat(window.buildComicFlatListForTopic(key));
  });
  return list;
};
