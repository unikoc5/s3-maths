window.JM26_COMICS = {
  inequalities: {
    id: "inequalities",
    label: "Inequalities I",
    labelKey: "comic.jm26.inequalities",
    series: "Inequalities I — Step by Step",
    basePath: "comics/",
    chapters: [
      {
        id: "ch1",
        title: "Chapter 1 — Linear Steps",
        file: "inequalities-chapter-1-color.png",
      },
      {
        id: "ch2",
        title: "Chapter 2 — Clear the Fraction",
        file: "inequalities-chapter-2-color.png",
      },
      {
        id: "ch3",
        title: "Chapter 3 — Two Bounds",
        file: "inequalities-chapter-3-color.png",
      },
    ],
    lawCard: {
      title: "Inequalities I — Quick Reference",
      file: "inequalities-laws-card-color.png",
    },
  },
};

window.JM26_COMIC_ORDER = ["inequalities"];

window.buildComicFlatListForTopic = function buildComicFlatListForTopic(topicKey) {
  var topic = window.JM26_COMICS[topicKey];
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
  var idx = window.JM26_COMIC_ORDER.indexOf(topicKey);
  if (idx < 0 || idx >= window.JM26_COMIC_ORDER.length - 1) return null;
  return window.JM26_COMIC_ORDER[idx + 1];
};

window.getComicFlatList = function getComicFlatList() {
  var list = [];
  window.JM26_COMIC_ORDER.forEach(function (key) {
    list = list.concat(window.buildComicFlatListForTopic(key));
  });
  return list;
};
