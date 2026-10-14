/* Signal Room — challenge mode. The keeper answers through the six lighthouses in the window.
   Guess the Number: type a guess (1–63); the lights reply H (higher), L (lower) or Y (yes).
   Speed Decode: random words flash one letter at a time; decode as many letters as you can in 90 s.
   Built on window.SignalRoomKit (signal-room-story.js) and window.SignalRoom (signal-room.js). */
(function () {
  "use strict";

  var kit = window.SignalRoomKit;
  var api = window.SignalRoom;
  if (!kit || !api) return;

  var room = kit.room;
  var sfx = kit.sfx;
  var say = kit.say;
  var quiet = kit.quiet;
  var wait = kit.wait;
  var codeOf = kit.codeOf;

  var VALUES = [32, 16, 8, 4, 2, 1];
  var SPEED_TIME = 90;
  var CHALLENGE_FACES = {
    normal: "game-art/signal-room/challenge-operator.webp",
    think: "game-art/signal-room/challenge-operator.webp",
    tired: "game-art/signal-room/challenge-operator.webp",
    anxious: "game-art/signal-room/challenge-operator.webp",
    joy: "game-art/signal-room/challenge-operator.webp",
    smile: "game-art/signal-room/challenge-operator.webp"
  };
  var WORDS = [
    "SUN", "SEA", "MAP", "BOAT", "SHIP", "STAR", "MOON", "ROCK", "WAVE", "RAIN", "WIND", "FISH", "BIRD",
    "LAMP", "ROPE", "CAKE", "BOOK", "CODE", "KEY", "BOX", "CAT", "DOG", "EGG", "HAT", "ICE", "JAM", "KITE",
    "LION", "MILK", "NEST", "OWL", "PEN", "QUIZ", "RED", "TREE", "VAN", "WOLF", "YES", "ZOO", "BYTE", "BIT",
    "TWO", "FOUR", "SIX", "NINE", "ZERO", "MATH", "SNOW", "FROG", "GOLD", "JET", "MUD", "SAND", "TAXI", "YAK"
  ];
  var REPLY_CODES = { H: 8, L: 12, Y: 25 };

  /* ---------- Scene: covers the chart wall and the console; the window and cipher note stay visible ---------- */

  function keyMarkup(label, x, y, w) {
    return '<g class="sgc-key sgr-key" data-key="' + label + '" transform="translate(' + x + " " + y + ')">' +
      '<g class="sgr-key-cap"><rect class="sgr-key-base" width="' + w + '" height="58" rx="8"/>' +
      '<rect class="sgr-key-top" x="5" y="4" width="' + (w - 10) + '" height="10" rx="5"/>' +
      '<text x="' + w / 2 + '" y="40"' + (w > 88 ? ' class="sgc-key-wide"' : "") + ">" + (label === "DEL" ? "\u232B DEL" : label) + "</text></g></g>";
  }

  function keyRow(keys, y, x0) {
    var out = "";
    for (var i = 0; i < keys.length; i++) out += keyMarkup(keys[i], x0 + i * 96, y, 88);
    return out;
  }

  var KEYS =
    keyRow("1234567890".split(""), 604, 254) + keyMarkup("DEL", 254 + 960, 604, 132) +
    keyRow("QWERTYUIOP".split(""), 668, 254) +
    keyRow("ASDFGHJKL".split(""), 732, 284) + keyMarkup("ENTER", 284 + 864, 732, 162) +
    keyRow("ZXCVBNM".split(""), 796, 332);

  var POWERS = "";
  for (var p = 0; p < 6; p++) {
    var px = 410 + p * 156;
    POWERS += '<rect x="' + (px - 34) + '" y="326" width="68" height="40" rx="7"/>' +
      '<text class="sgr-power" x="' + px + '" y="357">2<tspan class="sgr-exp" dy="-12">' + (5 - p) + "</tspan></text>";
  }

  var SCENE =
    '<svg viewBox="0 0 1600 900" aria-hidden="true">' +
    '<g class="sgc-solid">' +
    /* left wall: ship's clock (covers the worker-mode chart) */
    '<rect width="222" height="412" fill="#4a3220" filter="url(#sg-wood)"/>' +
    '<g fill="#000" opacity=".07"><rect y="74" width="222" height="74"/><rect y="222" width="222" height="74"/><rect y="370" width="222" height="42"/></g>' +
    '<path d="M0 74 H222 M0 148 H222 M0 222 H222 M0 296 H222 M0 370 H222" stroke="#1a110a" stroke-width="3"/>' +
    '<rect y="330" width="222" height="82" fill="url(#sg-shade-down)"/>' +

    '<g transform="translate(112 100)" filter="url(#sg-shadow)">' +
    '<circle r="58" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="3"/>' +
    '<circle r="46" fill="#efe6cc" stroke="#6d5a2c" stroke-width="2"/>' +
    '<g stroke="#3a2d1a" stroke-width="3" stroke-linecap="round"><path d="M0 -40 V-33 M0 40 V33 M-40 0 H-33 M40 0 H33"/></g>' +
    '<g stroke="#3a2d1a" stroke-width="1.5"><path d="M20 -34.6 L18 -31.2 M34.6 -20 L31.2 -18 M34.6 20 L31.2 18 M20 34.6 L18 31.2 M-20 34.6 L-18 31.2 M-34.6 20 L-31.2 18 M-34.6 -20 L-31.2 -18 M-20 -34.6 L-18 -31.2"/></g>' +
    '<path class="sgc-clock-h" d="M0 4 V-22" stroke="#2a2016" stroke-width="5" stroke-linecap="round"/>' +
    '<path class="sgc-clock-m" d="M0 6 V-34" stroke="#2a2016" stroke-width="3" stroke-linecap="round"/>' +
    '<circle r="4" fill="#a6261f"/>' +
    '<circle cx="-40" cy="-40" r="4" fill="url(#sg-rivet)"/><circle cx="40" cy="-40" r="4" fill="url(#sg-rivet)"/>' +
    "</g>" +
    "</g>" +

    /* guess mode: base buttons + lever stay; cover radar and CRT only */
    '<g class="sgc-solid sgc-guess">' +
    '<rect x="40" y="462" width="290" height="366" rx="14" fill="url(#sg-panel)" stroke="#23281f" stroke-width="2"/>' +
    '<g fill="url(#sg-rivet)"><circle cx="58" cy="480" r="4.5"/><circle cx="312" cy="480" r="4.5"/><circle cx="58" cy="810" r="4.5"/><circle cx="312" cy="810" r="4.5"/></g>' +
    '<g transform="translate(185 620)">' +
    '<circle r="100" fill="url(#sg-ring)" stroke="#121410" stroke-width="3" filter="url(#sg-shadow-sm)"/>' +
    '<circle r="86" fill="#0b120c" stroke="#2c312a" stroke-width="2"/>' +
    '<circle r="72" fill="none" stroke="#1c3a22" stroke-width="11"/>' +
    '<circle class="sgg-arc" r="72" fill="none" stroke="#9ef59a" stroke-width="11" stroke-linecap="round" transform="rotate(-90)" pathLength="100" stroke-dasharray="100 100"/>' +
    '<text class="sgg-dial-num" y="20">0</text>' +
    "</g>" +
    '<g transform="translate(185 774)"><rect x="-80" y="-18" width="160" height="34" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/><text class="sg-plate-text" y="7">GUESSES</text></g>' +
    '<rect x="560" y="630" width="480" height="186" rx="22" fill="url(#sg-bezel-dark)" stroke="#111410" stroke-width="3"/>' +
    '<rect x="582" y="652" width="436" height="144" rx="16" fill="#08190c" stroke="#030703" stroke-width="3"/>' +
    '<rect x="582" y="652" width="436" height="144" rx="16" fill="url(#sg-screen)"/>' +
    '<text class="sgg-small" x="602" y="680">GUESS 1-63</text>' +
    '<text class="sgg-small sgg-best" x="998" y="680" text-anchor="end">BEST --</text>' +
    '<text class="sgg-big sgg-main" x="602" y="726"></text>' +
    '<text class="sgg-small sgg-status" x="602" y="758"></text>' +
    '<text class="sgg-small sgg-key" x="602" y="784">H=HIGHER  L=LOWER  Y=YES</text>' +
    '<rect x="582" y="652" width="436" height="144" rx="16" fill="url(#sg-scan)"/>' +
    "</g>" +

    /* speed mode: full console with keyboard */
    '<g class="sgc-solid sgc-speed">' +
    '<g class="sgc-powers" fill="#08190c" fill-opacity=".82" stroke="#2c4a30" stroke-width="2">' + POWERS + "</g>" +
    /* steel console */
    '<rect x="0" y="436" width="1600" height="464" fill="url(#sg-console)"/>' +
    '<rect x="0" y="438" width="1600" height="22" fill="url(#sg-shade-up)"/>' +
    '<rect x="0" y="412" width="1600" height="26" fill="#2c3127" stroke="#101310" stroke-width="2"/>' +
    '<path d="M0 415 H1600" stroke="#5f6855" stroke-width="2" opacity=".7"/>' +
    '<g class="sg-panel" fill="url(#sg-panel)"><rect x="24" y="456" width="208" height="410" rx="14"/><rect x="238" y="450" width="1124" height="420" rx="14"/><rect x="1368" y="456" width="208" height="410" rx="14"/></g>' +
    '<g class="sg-rivet" fill="url(#sg-rivet)">' +
    '<circle cx="40" cy="472" r="4.5"/><circle cx="216" cy="472" r="4.5"/><circle cx="40" cy="850" r="4.5"/><circle cx="216" cy="850" r="4.5"/>' +
    '<circle cx="1384" cy="472" r="4.5"/><circle cx="1560" cy="472" r="4.5"/><circle cx="1384" cy="850" r="4.5"/><circle cx="1560" cy="850" r="4.5"/></g>' +

    /* left: dial (time left / guesses) */
    '<g transform="translate(128 620)">' +
    '<circle r="86" fill="url(#sg-ring)" stroke="#121410" stroke-width="3" filter="url(#sg-shadow-sm)"/>' +
    '<circle r="74" fill="#0b120c" stroke="#2c312a" stroke-width="2"/>' +
    '<circle r="62" fill="none" stroke="#1c3a22" stroke-width="10"/>' +
    '<circle class="sgc-arc" r="62" fill="none" stroke="#9ef59a" stroke-width="10" stroke-linecap="round" transform="rotate(-90)" pathLength="100" stroke-dasharray="100 100"/>' +
    '<text class="sgc-dial-num" y="16">--</text>' +
    "</g>" +
    '<g transform="translate(128 768)"><rect x="-70" y="-18" width="140" height="34" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/><text class="sg-plate-text sgc-dial-label" y="7">TIMER</text></g>' +

    /* right: score + best */
    '<g transform="translate(1472 0)">' +
    '<text class="sgc-lcd-label" y="530">SCORE</text>' +
    '<rect x="-80" y="544" width="160" height="70" rx="8" fill="#08190c" stroke="#030703" stroke-width="3"/>' +
    '<text class="sgc-lcd sgc-score" y="595">0</text>' +
    '<text class="sgc-lcd-label" y="676">BEST</text>' +
    '<rect x="-80" y="690" width="160" height="70" rx="8" fill="#08190c" stroke="#030703" stroke-width="3"/>' +
    '<text class="sgc-lcd sgc-best" y="741">--</text>' +
    '<rect x="-64" y="790" width="128" height="32" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/>' +
    '<text class="sg-plate-text sg-plate-small sgc-unit" y="812">LETTERS</text>' +
    "</g>" +

    /* screen */
    '<rect x="254" y="462" width="1092" height="128" rx="16" fill="url(#sg-bezel-dark)" stroke="#111410" stroke-width="3"/>' +
    '<rect x="268" y="472" width="1064" height="108" rx="10" fill="#08190c" stroke="#030703" stroke-width="3"/>' +
    '<rect x="268" y="472" width="1064" height="108" rx="10" fill="url(#sg-screen)"/>' +
    '<text class="sgr-crt-small sgc-title" x="290" y="498"></text>' +
    '<text class="sgr-crt-small sgc-status" x="1310" y="498" text-anchor="end"></text>' +
    '<text class="sgr-crt-big sgc-main" x="290" y="542"></text>' +
    '<text class="sgc-crt-sub sgc-sub" x="290" y="568"></text>' +
    '<rect x="268" y="472" width="1064" height="108" rx="10" fill="url(#sg-scan)"/>' +
    '<g class="sgc-keys">' + KEYS + "</g>" +
    "</g>" +
    "</svg>";

  var layer = document.createElement("div");
  layer.className = "sgc-layer";
  layer.hidden = true;
  layer.innerHTML = SCENE;
  kit.cam.appendChild(layer);

  function q(sel) { return layer.querySelector(sel); }
  var titleEl = q(".sgc-title");
  var statusEl = q(".sgc-status");
  var mainEl = q(".sgc-main");
  var subEl = q(".sgc-sub");
  var arcEl = q(".sgc-arc");
  var dialNum = q(".sgc-dial-num");
  var dialLabel = q(".sgc-dial-label");
  var scoreEl = q(".sgc-score");
  var bestEl = q(".sgc-best");
  var unitEl = q(".sgc-unit");
  var gArc = q(".sgg-arc");
  var gDialNum = q(".sgg-dial-num");
  var gBest = q(".sgg-best");
  var gMain = q(".sgg-main");
  var gStatus = q(".sgg-status");
  var keyEls = {};
  Array.prototype.forEach.call(layer.querySelectorAll(".sgc-key"), function (node) {
    keyEls[node.getAttribute("data-key")] = node;
  });

  /* ---------- State ---------- */

  var mode = "";
  var live = false;
  var loopTimer = 0;
  var loopCode = 0;
  var tickTimer = 0;
  var g = null;
  var s = null;

  function best(key, value, lowerWins) {
    var name = "jm24-signal-" + key;
    var old = null;
    try { old = window.localStorage.getItem(name); } catch (e) {}
    old = old === null ? null : Number(old);
    if (value === undefined) return old;
    if (old === null || (lowerWins ? value < old : value > old)) {
      try { window.localStorage.setItem(name, String(value)); } catch (e) {}
      return value;
    }
    return old;
  }

  function lights(code) {
    api.setBeacons(VALUES.map(function (v) { return !!(code & v); }));
  }

  function stopLoop() {
    window.clearTimeout(loopTimer);
    loopTimer = 0;
    loopCode = 0;
    lights(0);
  }

  function startLoop(code, onMs, offMs) {
    stopLoop();
    loopCode = code;
    var on = true;
    var tick = function () {
      if (!loopCode) return;
      lights(on ? loopCode : 0);
      loopTimer = window.setTimeout(tick, on ? onMs : offMs);
      on = !on;
    };
    tick();
  }

  function dial(fraction, text) {
    arcEl.setAttribute("stroke-dasharray", Math.max(0, Math.min(100, fraction * 100)).toFixed(1) + " 100");
    arcEl.classList.toggle("is-low", fraction <= 0.2);
    dialNum.textContent = text;
  }

  function flashKey(key, cls) {
    var node = keyEls[key];
    if (!node) return;
    node.classList.remove("is-ok", "is-bad", "is-down");
    void node.getBoundingClientRect();
    node.classList.add("is-down");
    if (cls) node.classList.add(cls);
    window.setTimeout(function () { node.classList.remove("is-down"); }, 140);
    if (cls) window.setTimeout(function () { node.classList.remove(cls); }, 500);
  }

  function keeper(text) {
    return say("radio", null, text, { name: "LIGHTHOUSE KEEPER", clean: true });
  }

  /* ---------- Guess the Number ---------- */

  function guessRender(status) {
    var n = g.history.length;
    gMain.textContent = n ? "SENT: " + g.history.slice(-5).join(" ") : "SENT: --";
    if (status) gStatus.textContent = status;
    gArc.setAttribute("stroke-dasharray", Math.max(0, 100 - n * 10) + " 100");
    gDialNum.textContent = String(n);
  }

  function clearConsole() {
    api.setLever(false);
    for (var i = 0; i < 6; i++) api.setLighthouse(i, false);
  }

  async function guessSend(n) {
    kit.setConsole(false);
    stopLoop();
    g.history.push(n);
    sfx.send();
    guessRender("SENDING...");
    var reply = n < g.secret ? "H" : n > g.secret ? "L" : "Y";
    var token = ++g.token;
    await wait(1400);
    if (token !== g.token || !live) return;
    clearConsole();
    sfx.release();
    await wait(400);
    if (token !== g.token || !live) return;
    guessRender("WATCH THE WINDOW...");
    startLoop(REPLY_CODES[reply], 2000, 1000);
    if (reply === "Y") {
      live = false;
      await wait(3200);
      if (token === g.token) guessWin();
      return;
    }
    kit.setConsole(true);
    guessRender("NEXT GUESS: LIGHTS + LEVER");
  }

  room.addEventListener("signalroom:lever", function (event) {
    if (mode !== "guess" || !live || !event.detail.down) return;
    lights(0);
    var n = 0;
    event.detail.lights.forEach(function (on, i) { if (on) n += VALUES[i]; });
    if (n > 0) guessSend(n);
  });

  async function guessWin() {
    stopLoop();
    var count = g.history.length;
    var top = best("guess-best", count, true);
    gBest.textContent = "BEST " + top;
    api.setBeacons([true, true, true, true, true, true]);
    room.classList.add("sgs-blaze");
    sfx.fanfare();
    await wait(800);
    var rating = count <= 6 ? "That's binary search at its best!" : count <= 9 ? "Nice work! Try always guessing the middle." : "Got there! Tip: guess the middle of what's left.";
    await keeper("Y for YES! My number was " + g.secret + ". You found it in " + count + " guess" + (count === 1 ? "" : "es") + ". " + rating);
    quiet();
    kit.showClear("NUMBER FOUND!", g.secret + " in " + count + " guess" + (count === 1 ? "" : "es") + " \u00B7 Best: " + top, true);
  }

  async function startGuess() {
    g = { secret: 1 + Math.floor(Math.random() * 63), history: [], token: 0 };
    var top = best("guess-best");
    gBest.textContent = "BEST " + (top === null ? "--" : top);
    guessRender("GET READY...");
    await wait(600);
    await keeper("Ahoy! Keeper here. I'm thinking of a number from 1 to 63. Send me your guess with your own lighthouses!");
    await keeper("Switch on the lighthouses that add up to your number, then pull the red lever to send it.");
    await keeper("I'll answer from my island: H means go higher, L means go lower, and Y means you got it. Decode my lights to find out!");
    await say("me", "think", "Six lighthouses can show up to 63... Let's find it in as few guesses as possible.");
    quiet();
    if (mode !== "guess") return;
    live = true;
    kit.setConsole(true);
    guessRender("LIGHTS + LEVER TO SEND");
  }

  /* ---------- Speed Decode ---------- */

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function speedRender() {
    var w = s.word;
    var shown = w.slice(0, s.idx);
    for (var i = s.idx; i < w.length; i++) shown += i === s.idx && live ? "_" : " _";
    mainEl.textContent = "> " + shown;
    subEl.textContent = s.done.length ? "DECODED: " + s.done.slice(-8).join("  ") : "Read the lights, then type the letter.";
    scoreEl.textContent = String(s.letters);
  }

  function speedTiming() {
    var level = s.done.length;
    return { on: Math.max(700, 1700 - level * 110), off: Math.max(300, 800 - level * 55) };
  }

  function speedChar() {
    var t = speedTiming();
    startLoop(codeOf(s.word[s.idx]), t.on, t.off);
    speedRender();
  }

  function speedNextWord() {
    if (!s.bag.length) s.bag = shuffle(WORDS);
    s.word = s.bag.pop();
    s.idx = 0;
    speedChar();
  }

  function speedKey(key) {
    if (!/^[A-Z]$/.test(key)) {
      flashKey(key, "is-bad");
      return;
    }
    if (s.lock) return;
    if (key !== s.word[s.idx]) {
      var answer = s.word[s.idx];
      flashKey(key, "is-bad");
      flashKey(answer, "is-ok");
      sfx.chirp(false);
      stopLoop();
      s.misses += 1;
      s.lock = true;
      speedNote("WRONG! IT WAS " + answer + " = " + codeOf(answer) + " \u2014 NEW WORD");
      mainEl.textContent = "> " + s.word.slice(0, s.idx) + answer + " \u2717";
      window.setTimeout(function () {
        s.lock = false;
        if (live) speedNextWord();
      }, 1100);
      return;
    }
    flashKey(key, "is-ok");
    sfx.chirp(true);
    s.idx += 1;
    s.letters += 1;
    stopLoop();
    if (s.idx >= s.word.length) {
      s.done.push(s.word);
      speedNote("WORD " + s.done.length + ": " + s.word + "!");
      speedRender();
      var pace = s.done.length;
      window.setTimeout(function () { if (live && s.done.length === pace) speedNextWord(); }, 450);
      return;
    }
    speedRender();
    window.setTimeout(function () { if (live) speedChar(); }, 250);
  }

  function speedNote(text) {
    s.note = text;
    s.noteUntil = Date.now() + 1200;
    statusEl.textContent = text;
  }

  function speedTick() {
    var now = Date.now();
    var dt = (now - s.last) / 1000;
    s.last = now;
    if (kit.gameVisible()) s.left -= dt;
    var left = Math.max(0, s.left);
    dial(left / SPEED_TIME, String(Math.ceil(left)));
    statusEl.textContent = now < s.noteUntil ? s.note : "TIME " + Math.ceil(left) + "s";
    if (left <= 0) {
      speedEnd();
      return;
    }
    tickTimer = window.setTimeout(speedTick, 100);
  }

  async function speedEnd() {
    live = false;
    window.clearTimeout(tickTimer);
    stopLoop();
    speedRender();
    statusEl.textContent = "TIME'S UP";
    sfx.blind();
    var top = best("speed-best-" + SPEED_TIME, s.letters, false);
    bestEl.textContent = String(top);
    await wait(900);
    sfx.fanfare();
    await keeper("Time's up! You decoded " + s.done.length + " word" + (s.done.length === 1 ? "" : "s") + " and " + s.letters + " letter" + (s.letters === 1 ? "" : "s") + ". " +
      (s.letters >= top && s.letters > 0 ? "That's a new best!" : "Your best is " + top + " letters."));
    quiet();
    kit.showClear("TIME'S UP!", s.done.length + " words \u00B7 " + s.letters + " letters \u00B7 Best: " + top, true);
  }

  async function startSpeed() {
    s = { bag: shuffle(WORDS), word: "", idx: 0, letters: 0, done: [], misses: 0, lock: false, left: SPEED_TIME, last: 0, note: "", noteUntil: 0 };
    titleEl.textContent = "SPEED DECODE \u00B7 " + SPEED_TIME + " SECONDS";
    statusEl.textContent = "";
    dialLabel.textContent = "TIMER";
    unitEl.textContent = "LETTERS";
    var top = best("speed-best-" + SPEED_TIME);
    bestEl.textContent = top === null ? "--" : String(top);
    dial(1, String(SPEED_TIME));
    mainEl.textContent = "> READY?";
    subEl.textContent = "";
    scoreEl.textContent = "0";
    await wait(600);
    await keeper("Speed round! I'll flash random words, one letter at a time. Decode each letter and type it in.");
    await keeper("You have " + SPEED_TIME + " seconds. The more words you finish, the faster my lights blink.");
    await keeper("No guessing! One wrong letter and I'll switch to a brand-new word. Ready?");
    quiet();
    for (var n = 3; n > 0; n--) {
      mainEl.textContent = "> " + n;
      sfx.chirp(true);
      await wait(800);
      if (!mode) return;
    }
    mainEl.textContent = "> GO!";
    await wait(400);
    live = true;
    s.last = Date.now();
    statusEl.textContent = "TIME " + SPEED_TIME + "s";
    speedNextWord();
    speedTick();
  }

  /* ---------- Input ---------- */

  function press(key) {
    if (!live) return;
    if (mode !== "speed") return;
    sfx.press();
    speedKey(key);
  }

  Array.prototype.forEach.call(layer.querySelectorAll(".sgc-key"), function (node) {
    node.addEventListener("click", function () { press(node.getAttribute("data-key")); });
  });

  document.addEventListener("keydown", function (event) {
    if (mode !== "speed" || !live || !kit.gameVisible()) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    var modal = document.getElementById("sig-note-modal");
    if (modal && !modal.hidden) return;
    var key = event.key;
    if (key === "Enter") key = "ENTER";
    else if (key === "Backspace") key = "DEL";
    else if (/^[a-z0-9]$/i.test(key)) key = key.toUpperCase();
    else return;
    event.preventDefault();
    press(key);
  });

  /* ---------- Start / reset ---------- */

  function reset() {
    var wasGuess = mode === "guess";
    mode = "";
    live = false;
    if (g) g.token += 1;
    kit.setConsole(false);
    window.clearTimeout(tickTimer);
    stopLoop();
    if (wasGuess) clearConsole();
    layer.hidden = true;
    layer.classList.remove("is-guess", "is-speed");
    room.classList.remove("sgs-blaze");
    api.setBeacons(null);
  }

  function start(kind) {
    reset();
    mode = kind;
    kit.setCast("challenge-operator", CHALLENGE_FACES);
    layer.hidden = false;
    layer.classList.add(kind === "guess" ? "is-guess" : "is-speed");
    if (kind === "guess") startGuess();
    else startSpeed();
  }

  window.SignalRoomChallenge = { start: start, reset: reset };
})();
