window.JM24_COMICS = {
  rules: {
    id: "rules",
    label: "Rules",
    labelKey: "comic.rules",
    series: "Indices Club",
    basePath: "comics/rules/",
    chapters: [
      { id: "prologue", title: "Prologue — The Algebra World", file: "indices-club-prologue-color.png" },
      { id: "ch1", title: "Chapter 1 — The Maze Trial", file: "indices-club-maze-trial-color.png" },
      { id: "ch2", title: "Chapter 2 — The Stone Bridge", file: "indices-club-stone-bridge-color.png" },
      { id: "ch3", title: "Chapter 3 — Zero Revealed", file: "indices-club-zero-first-form-color.png?v=20260906-fix1" },
      { id: "ch4", title: "Chapter 4 — Zero's Second Form", file: "indices-club-zero-second-form-color.png?v=20260906-crisp" },
    ],
    lawCard: { title: "Law Card — Indices School", file: "indices-school-laws-card-color.png?v=20260906-short-hair" },
  },
  "scientific-notation": {
    id: "scientific-notation",
    label: "Scientific Notation",
    labelKey: "comic.sciNotation",
    series: "Magnitude Express",
    basePath: "comics/scientific-notation/",
    chapters: [
      { id: "ch1", title: "Chapter 1 — Label Shift", file: "magnitude-express-chapter-1-color.png" },
      { id: "ch2", title: "Chapter 2 — Cargo Merge", file: "magnitude-express-chapter-2-color.png" },
      { id: "ch3", title: "Chapter 3 — Manifest Fix", file: "magnitude-express-chapter-3-color.png" },
      { id: "ch4", title: "Chapter 4 — Stellar Run", file: "magnitude-express-chapter-4-color.png" },
    ],
    lawCard: { title: "Law Card — Magnitude Express", file: "magnitude-express-laws-card-color.png" },
  },
  binary: {
    id: "binary",
    label: "Binary",
    labelKey: "comic.binary",
    series: "Bitspire Tower",
    basePath: "comics/binary/",
    chapters: [
      { id: "ch1", title: "Chapter 1 — Floor Ten", file: "bitspire-chapter-1-color.png" },
      { id: "ch2", title: "Chapter 2 — Radix Floors", file: "bitspire-chapter-2-color.png" },
      { id: "ch3", title: "Chapter 3 — Binary Core", file: "bitspire-chapter-3-color.png" },
      { id: "ch4", title: "Chapter 4 — Apex Lock", file: "bitspire-chapter-4-color.png" },
    ],
    lawCard: { title: "Law Card — Bitspire Tower", file: "bitspire-laws-card-color.png" },
  },
};

window.JM24_COMIC_ORDER = ["rules", "scientific-notation", "binary"];

window.buildComicFlatListForTopic = function buildComicFlatListForTopic(topicKey) {
  var topic = window.JM24_COMICS[topicKey];
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
  var idx = window.JM24_COMIC_ORDER.indexOf(topicKey);
  if (idx < 0 || idx >= window.JM24_COMIC_ORDER.length - 1) return null;
  return window.JM24_COMIC_ORDER[idx + 1];
};

window.getComicFlatList = function getComicFlatList() {
  var list = [];
  window.JM24_COMIC_ORDER.forEach(function (key) {
    list = list.concat(window.buildComicFlatListForTopic(key));
  });
  return list;
};
