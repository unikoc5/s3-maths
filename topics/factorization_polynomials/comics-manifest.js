window.JM25_COMICS = {
  factorization: {
    id: "factorization",
    label: "Factorization",
    labelKey: "comic.jm25.factorization",
    series: "The Bracket Labyrinth",
    basePath: "comics/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — The Square Room",
        file: "factorization-chapter-1-color.png",
      },
      {
        id: "ch2",
        title: "Chapter 2 — The Mirror Canyon",
        file: "factorization-chapter-2-color.png",
      },
      {
        id: "ch3",
        title: "Chapter 3 — The Crossroads of Hence",
        file: "factorization-chapter-3-color.png",
      },
      {
        id: "ch4",
        title: "Chapter 4 — The Grouping Gate",
        file: "factorization-chapter-4-color.png",
      },
    ],
    lawCard: {
      title: "Factor Law Card — Bracket Labyrinth",
      file: "factorization-laws-card-color.png",
    },
  },
  "cross-method": {
    id: "cross-method",
    label: "Cross Method",
    labelKey: "comic.jm25.crossMethod",
    series: "Cross Method — Step by Step",
    basePath: "comics/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — Step by Step",
        file: "cross-method-chapter-1-color.png",
      },
    ],
    lawCard: {
      title: "Cross Method — Quick Reference",
      file: "cross-method-laws-card-color.png",
    },
  },
};

window.JM25_COMIC_ORDER = ["factorization", "cross-method"];

window.buildComicFlatListForTopic = function buildComicFlatListForTopic(topicKey) {
  var topic = window.JM25_COMICS[topicKey];
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

  list.push({
    topicKey: topicKey,
    topicLabel: topic.label,
    series: topic.series,
    type: "lawCard",
    index: topic.chapters.length,
    title: topic.lawCard.title,
    src: topic.basePath + topic.lawCard.file,
  });

  return list;
};

window.getComicFlatListForTopic = window.buildComicFlatListForTopic;

window.getNextComicTopicKey = function getNextComicTopicKey(topicKey) {
  var idx = window.JM25_COMIC_ORDER.indexOf(topicKey);
  if (idx < 0 || idx >= window.JM25_COMIC_ORDER.length - 1) return null;
  return window.JM25_COMIC_ORDER[idx + 1];
};

window.getComicFlatList = function getComicFlatList() {
  var list = [];
  window.JM25_COMIC_ORDER.forEach(function (key) {
    list = list.concat(window.buildComicFlatListForTopic(key));
  });
  return list;
};
