window.JM26_RUNNER_WORLDS = [
  {
    id: "linear",
    labelEn: "World 1 — Linear Steps",
    labelZh: "世界 1 — 一元一次",
    comicChapter: "ch1",
    levels: [
      {
        id: "1-1",
        labelEn: "Level 1-1",
        labelZh: "關卡 1-1",
        questionId: "r-1-1",
        platform: {
          type: "ray-right",
          endpoint: 2,
          inclusive: false,
          lineMin: -2,
          lineMax: 6,
        },
      },
      {
        id: "1-2",
        labelEn: "Level 1-2",
        labelZh: "關卡 1-2",
        questionId: "r-1-2",
        platform: {
          type: "ray-left",
          endpoint: -3,
          inclusive: false,
          lineMin: -6,
          lineMax: 2,
        },
      },
      {
        id: "1-3",
        labelEn: "Level 1-3",
        labelZh: "關卡 1-3",
        questionId: "r-1-3",
        platform: {
          type: "ray-left",
          endpoint: -2,
          inclusive: true,
          lineMin: -6,
          lineMax: 2,
        },
      },
    ],
  },
  {
    id: "fractions",
    labelEn: "World 2 — Clear the Fraction",
    labelZh: "世界 2 — 分數係數",
    comicChapter: "ch2",
    levels: [
      {
        id: "2-1",
        labelEn: "Level 2-1",
        labelZh: "關卡 2-1",
        questionId: "r-2-1",
        platform: {
          type: "ray-right",
          endpoint: 1,
          inclusive: false,
          lineMin: -2,
          lineMax: 5,
        },
      },
      {
        id: "2-2",
        labelEn: "Level 2-2",
        labelZh: "關卡 2-2",
        questionId: "r-2-2",
        platform: {
          type: "ray-left",
          endpoint: 10,
          inclusive: false,
          lineMin: 4,
          lineMax: 14,
        },
      },
      {
        id: "2-3",
        labelEn: "Level 2-3",
        labelZh: "關卡 2-3",
        questionId: "r-2-3",
        platform: {
          type: "ray-right",
          endpoint: 48,
          inclusive: true,
          lineMin: 42,
          lineMax: 54,
        },
      },
    ],
  },
  {
    id: "double",
    labelEn: "World 3 — Two Bounds",
    labelZh: "世界 3 — 雙重不等式",
    comicChapter: "ch3",
    levels: [
      {
        id: "3-1",
        labelEn: "Level 3-1",
        labelZh: "關卡 3-1",
        questionId: "r-3-1",
        platform: {
          type: "segment",
          left: -5,
          right: 2,
          leftInclusive: true,
          rightInclusive: false,
          lineMin: -7,
          lineMax: 4,
        },
      },
      {
        id: "3-2",
        labelEn: "Level 3-2",
        labelZh: "關卡 3-2",
        questionId: "r-3-2",
        platform: {
          type: "segment",
          left: 2,
          right: 5,
          leftInclusive: true,
          rightInclusive: false,
          lineMin: 0,
          lineMax: 7,
        },
      },
      {
        id: "3-3",
        labelEn: "Level 3-3",
        labelZh: "關卡 3-3",
        questionId: "r-3-3",
        platform: {
          type: "segment",
          left: -5,
          right: 5,
          leftInclusive: true,
          rightInclusive: false,
          lineMin: -7,
          lineMax: 7,
        },
      },
    ],
  },
];

window.JM26_RUNNER_BOSS = {
  id: "boss",
  labelEn: "Boss — Mixed Run",
  labelZh: "Boss — 混合衝刺",
  questionId: "r-boss",
  platform: {
    type: "ray-right",
    endpoint: 4,
    inclusive: false,
    lineMin: -2,
    lineMax: 10,
  },
};

window.getJM26RunnerLevel = function getJM26RunnerLevel(levelId) {
  if (levelId === "boss") return window.JM26_RUNNER_BOSS;
  var worlds = window.JM26_RUNNER_WORLDS || [];
  for (var w = 0; w < worlds.length; w++) {
    var levels = worlds[w].levels || [];
    for (var i = 0; i < levels.length; i++) {
      if (levels[i].id === levelId) return levels[i];
    }
  }
  return null;
};

window.getJM26RunnerLevelOrder = function getJM26RunnerLevelOrder() {
  var order = [];
  (window.JM26_RUNNER_WORLDS || []).forEach(function (world) {
    (world.levels || []).forEach(function (level) {
      order.push(level.id);
    });
  });
  order.push("boss");
  return order;
};

window.buildJM26RunnerPlatforms = function buildJM26RunnerPlatforms(config, canvasWidth) {
  var pad = 48;
  var platformY = 340;
  var platformH = 18;
  var gap = 10;
  var lineMin = config.lineMin;
  var lineMax = config.lineMax;
  var inner = canvasWidth - pad * 2;

  function valueToX(val) {
    return pad + ((val - lineMin) / (lineMax - lineMin)) * inner;
  }

  if (config.type === "ray-right") {
    var start = valueToX(config.endpoint);
    if (!config.inclusive) start += gap;
    return [
      {
        x: start,
        y: platformY,
        w: Math.max(40, canvasWidth - pad - start),
        h: platformH,
      },
    ];
  }

  if (config.type === "ray-left") {
    var end = valueToX(config.endpoint);
    if (!config.inclusive) end -= gap;
    return [{ x: pad, y: platformY, w: Math.max(40, end - pad), h: platformH }];
  }

  if (config.type === "segment") {
    var xL = valueToX(config.left);
    var xR = valueToX(config.right);
    if (!config.leftInclusive) xL += gap;
    if (!config.rightInclusive) xR -= gap;
    return [{ x: xL, y: platformY, w: Math.max(40, xR - xL), h: platformH }];
  }

  return [];
};

window.getJM26RunnerGraphMarks = function getJM26RunnerGraphMarks(config) {
  var marks = [];
  if (config.type === "ray-right" || config.type === "ray-left") {
    marks.push({
      value: config.endpoint,
      solid: !!config.inclusive,
      ray: config.type === "ray-right" ? "right" : "left",
    });
  }
  if (config.type === "segment") {
    marks.push({
      value: config.left,
      solid: !!config.leftInclusive,
      ray: null,
    });
    marks.push({
      value: config.right,
      solid: !!config.rightInclusive,
      ray: null,
    });
  }
  return marks;
};
