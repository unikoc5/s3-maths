/* Signal Room — rescuer mode: read the lighthouse code through the telescope (binary → decimal),
   type the message on the console keyboard, then mark the survivor on the map.
   Built on window.SignalRoomKit from signal-room-story.js. */
(function () {
  "use strict";

  var kit = window.SignalRoomKit;
  if (!kit) return;

  var room = kit.room;
  var sfx = kit.sfx;
  var say = kit.say;
  var quiet = kit.quiet;
  var wait = kit.wait;
  var spot = kit.spot;
  var codeOf = kit.codeOf;
  var charOf = kit.charOf;

  var ART = "game-art/signal-room/";
  var FACES = {
    normal: ART + "rescuer-focus.webp",
    think: ART + "rescuer-focus.webp",
    tired: ART + "rescuer-focus.webp",
    anxious: ART + "rescuer-focus.webp",
    alert: ART + "rescuer-alert.webp",
    joy: ART + "rescuer-alert.webp",
    smile: ART + "rescuer-smile.webp"
  };
  var VALUES = [32, 16, 8, 4, 2, 1];
  var POWERS = ["2\u2075", "2\u2074", "2\u00B3", "2\u00B2", "2\u00B9", "2\u2070"];
  var LIGHT_ON = 2000;
  var LIGHT_OFF = 1000;
  var GAP = 1100;

  /* 20 × 20 chart: grid lines 10…29 for both latitude (up the side) and longitude (along the bottom). */
  var MIN = 10;
  var MAX = 29;
  var GRID = { x: 636, y: 28, size: 364 };
  var STEP = GRID.size / (MAX - MIN);

  function mapX(lng) { return GRID.x + (lng - MIN) * STEP; }
  function mapY(lat) { return GRID.y + GRID.size - (lat - MIN) * STEP; }

  var SPOTS = {
    radar: { x: 155, y: 650, rx: 115, ry: 115 },
    telescope: { x: 250, y: 235, rx: 210, ry: 225, label: "Look through", side: "right", gap: 10 },
    houses: { x: 800, y: 440, rx: 430, ry: 200 },
    close: { x: 1478, y: 66, rx: 95, ry: 42, label: "Close", side: "bottom" },
    note: { x: 1440, y: 190, rx: 150, ry: 160 },
    keys: { x: 800, y: 738, rx: 520, ry: 150, label: "Type it here", side: "top", gap: 6 },
    map: { x: 818, y: 226, rx: 248, ry: 248 }
  };

  /* ---------- Scene markup ---------- */

  function keyRow(keys, y, offset) {
    var out = "";
    for (var i = 0; i < keys.length; i++) {
      var x = 324 + offset + i * 96;
      out += '<g class="sgr-key" data-key="' + keys[i] + '" transform="translate(' + x + " " + y + ')">' +
        '<g class="sgr-key-cap"><rect class="sgr-key-base" width="88" height="58" rx="8"/>' +
        '<rect class="sgr-key-top" x="5" y="4" width="78" height="10" rx="5"/>' +
        '<text x="44" y="40">' + keys[i] + "</text></g></g>";
    }
    return out;
  }

  function gridMarkup() {
    var out = "";
    for (var v = MIN; v <= MAX; v++) {
      var major = v % 5 === 0;
      var x = mapX(v).toFixed(1);
      var y = mapY(v).toFixed(1);
      var cls = major ? "sgr-grid sgr-grid-major" : "sgr-grid";
      out += '<path class="' + cls + '" d="M' + x + " " + GRID.y + " V" + (GRID.y + GRID.size) + '"/>';
      out += '<path class="' + cls + '" d="M' + GRID.x + " " + y + " H" + (GRID.x + GRID.size) + '"/>';
      out += '<text class="sgr-map-num" x="' + (GRID.x - 7) + '" y="' + (Number(y) + 4.5) + '" text-anchor="end">' + v + "</text>";
      out += '<text class="sgr-map-num" x="' + x + '" y="' + (GRID.y + GRID.size + 19) + '" text-anchor="middle">' + v + "</text>";
    }
    return out;
  }

  function houseMarkup() {
    var out = "";
    for (var i = 0; i < 6; i++) {
      var x = 500 + i * 120;
      var y = 566 + (i % 2 ? -3 : 2);
      out += '<g class="sgr-house" data-index="' + i + '" transform="translate(' + x + " " + y + ') scale(1.05)">' +
        '<path class="sg-beam" d="M-11 -149 L-84 -430 H84 L11 -149 Z" fill="url(#sg-beam)"/>' +
        '<circle class="sg-glow" cy="-149" r="40" fill="url(#sg-lamp)"/>' +
        '<rect class="sg-lamp" x="-14" y="-160" width="28" height="22"/>' +
        '<use href="#sg-tower"/></g>';
    }
    return out;
  }

  function powerMarkup() {
    var out = "";
    for (var i = 0; i < 6; i++) {
      var x = 500 + i * 120;
      out += '<path d="M' + x + " 624 V640" + '" class="sgr-tick"/>' +
        '<text class="sgr-power" x="' + x + '" y="676">2<tspan class="sgr-exp" dy="-14">' + (5 - i) + "</tspan></text>";
    }
    return out;
  }

  var RAIN_PATTERN =
    '<pattern id="sgr-rain-far" width="127" height="113" patternUnits="userSpaceOnUse">' +
    '<path d="M18 8 l-5 18 M79 42 l-4 14 M111 79 l-6 22 M48 95 l-3 11" stroke="#cbd9ee" stroke-opacity=".2" stroke-width="1.2" stroke-linecap="round"/>' +
    "</pattern>" +
    '<pattern id="sgr-rain-mid" width="173" height="149" patternUnits="userSpaceOnUse">' +
    '<path d="M22 3 l-9 31 M96 18 l-7 25 M151 65 l-10 36 M58 99 l-8 28 M126 128 l-5 18" stroke="#d8e6ff" stroke-opacity=".38" stroke-width="1.7" stroke-linecap="round"/>' +
    "</pattern>" +
    '<pattern id="sgr-rain-near" width="239" height="197" patternUnits="userSpaceOnUse">' +
    '<path d="M31 12 l-16 51 M173 4 l-13 43 M218 93 l-18 58 M91 132 l-14 47" stroke="#eef5ff" stroke-opacity=".52" stroke-width="2.3" stroke-linecap="round"/>' +
    "</pattern>";

  var SCENE =
    '<svg class="sgr-scene" viewBox="0 0 1600 900" role="group" aria-label="Rescue station console">' +
    "<defs>" + RAIN_PATTERN +
    '<clipPath id="sgr-port-clip"><circle cx="190" cy="160" r="100"/></clipPath>' +
    "</defs>" +

    /* timber wall */
    '<rect width="1600" height="470" fill="#4a3220" filter="url(#sg-wood)"/>' +
    '<g fill="#000" opacity=".07"><rect y="78" width="1600" height="78"/><rect y="234" width="1600" height="78"/><rect y="390" width="1600" height="80"/></g>' +
    '<path d="M0 78 H1600 M0 156 H1600 M0 234 H1600 M0 312 H1600 M0 390 H1600" stroke="#1a110a" stroke-width="3"/>' +
    '<path d="M0 81 H1600 M0 159 H1600 M0 237 H1600 M0 315 H1600 M0 393 H1600" stroke="#7b5a3a" stroke-width="1" opacity=".4"/>' +
    '<g fill="#2a1a0e"><rect x="540" width="16" height="470"/><rect x="1046" width="16" height="470"/></g>' +
    '<rect y="360" width="1600" height="110" fill="url(#sg-shade-down)"/>' +

    /* porthole + telescope (the only way to see the lighthouses) */
    '<g class="sgr-scope-hit" role="button" tabindex="-1" aria-label="Look through the telescope">' +
    '<rect x="40" y="20" width="440" height="450" fill="transparent"/>' +
    '<circle cx="190" cy="160" r="122" fill="url(#sg-ring)" stroke="#111410" stroke-width="3" filter="url(#sg-shadow)"/>' +
    '<circle cx="190" cy="160" r="104" fill="#0b0d0b"/>' +
    '<g clip-path="url(#sgr-port-clip)">' +
    '<rect x="90" y="60" width="200" height="200" fill="url(#sg-sky)"/>' +
    '<g class="sg-bolt"><path d="M222 64 L210 104 L222 106 L204 146" fill="none" stroke="#f4f8ff" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<rect x="90" y="176" width="200" height="90" fill="url(#sg-sea)"/>' +
    '<path d="M150 182 C162 172 186 170 200 174 C214 170 232 174 240 182 Z" fill="#232527"/>' +
    '<ellipse class="sgr-port-glow" cx="195" cy="172" rx="34" ry="12" fill="url(#sg-lamp)"/>' +
    '<g class="sgr-rain">' +
    '<rect class="sgr-rain-far" x="70" y="-80" width="250" height="420" fill="url(#sgr-rain-far)"/>' +
    '<rect class="sgr-rain-mid" x="60" y="-100" width="270" height="450" fill="url(#sgr-rain-mid)"/>' +
    '<rect class="sgr-rain-near" x="50" y="-120" width="290" height="480" fill="url(#sgr-rain-near)"/>' +
    "</g>" +
    '<rect class="sg-flash" x="90" y="60" width="200" height="200"/>' +
    '<path d="M110 90 L160 64 L104 214 Z" fill="#fff" opacity=".06"/>' +
    "</g>" +
    '<circle cx="190" cy="160" r="104" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="7"/>' +
    '<g class="sg-rivet" fill="url(#sg-rivet)"><circle cx="190" cy="48" r="5"/><circle cx="302" cy="160" r="5"/><circle cx="190" cy="272" r="5"/><circle cx="78" cy="160" r="5"/>' +
    '<circle cx="111" cy="81" r="5"/><circle cx="269" cy="81" r="5"/><circle cx="269" cy="239" r="5"/><circle cx="111" cy="239" r="5"/></g>' +
    '<g class="sgr-tripod" stroke="#22251f" stroke-width="9" stroke-linecap="round"><path d="M332 292 L262 462 M332 292 L336 466 M332 292 L404 460"/></g>' +
    '<g fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"><rect x="252" y="456" width="22" height="10" rx="3"/><rect x="325" y="460" width="22" height="10" rx="3"/><rect x="394" y="454" width="22" height="10" rx="3"/></g>' +
    '<rect x="316" y="276" width="32" height="24" rx="5" fill="#2b2e2a" stroke="#101210" stroke-width="2"/>' +
    '<g class="sgr-tube" transform="translate(402 336) rotate(-141)" filter="url(#sg-shadow-sm)">' +
    '<rect x="-8" y="-9" width="36" height="18" rx="4" fill="#2b2e2a" stroke="#0f110e" stroke-width="2"/>' +
    '<rect x="26" y="-17" width="122" height="34" rx="5" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2.5"/>' +
    '<rect x="62" y="-19" width="10" height="38" rx="2" fill="#6d5a2c"/><rect x="118" y="-19" width="8" height="38" rx="2" fill="#6d5a2c"/>' +
    '<rect x="146" y="-24" width="70" height="48" rx="6" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2.5"/>' +
    '<rect x="212" y="-27" width="12" height="54" rx="3" fill="#2b2e2a" stroke="#0f110e" stroke-width="2"/>' +
    '<rect x="32" y="-12" width="110" height="5" rx="2.5" fill="#fff" opacity=".22"/>' +
    "</g>" +
    '<g transform="translate(130 330)"><rect x="-62" y="-17" width="124" height="34" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/>' +
    '<text class="sg-plate-text" y="7">TELESCOPE</text></g>' +
    "</g>" +

    /* square chart */
    '<g class="sgr-map" filter="url(#sg-shadow)">' +
    '<rect x="582" y="8" width="440" height="440" rx="6" fill="#dccb9f" stroke="#6a583a" stroke-width="3"/>' +
    '<rect x="' + GRID.x + '" y="' + GRID.y + '" width="' + GRID.size + '" height="' + GRID.size + '" fill="#9db4bb" opacity=".6"/>' +
    '<g id="sgr-islands"></g>' +
    gridMarkup() +
    '<rect x="' + GRID.x + '" y="' + GRID.y + '" width="' + GRID.size + '" height="' + GRID.size + '" fill="none" stroke="#3f5257" stroke-width="2"/>' +
    '<text class="sgr-map-axis" transform="translate(600 ' + (GRID.y + GRID.size / 2) + ') rotate(-90)">LATITUDE</text>' +
    '<text class="sgr-map-axis" x="' + (GRID.x + GRID.size / 2) + '" y="440">LONGITUDE</text>' +
    '<circle id="sgr-hover" r="9"/>' +
    '<g id="sgr-marks"></g>' +
    '<rect class="sgr-map-hit" x="' + (GRID.x - STEP / 2) + '" y="' + (GRID.y - STEP / 2) + '" width="' + (GRID.size + STEP) + '" height="' + (GRID.size + STEP) + '" fill="transparent"/>' +
    "</g>" +

    /* station plate + lifebuoy */
    '<g transform="translate(1196 66)" filter="url(#sg-shadow-sm)"><rect x="-108" y="-30" width="216" height="62" rx="6" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2.5"/>' +
    '<text class="sg-plate-text" y="-4">HARBOUR RESCUE</text><text class="sg-plate-text sg-plate-small" y="20">STATION 7</text></g>' +
    '<g transform="translate(1196 262)" filter="url(#sg-shadow)">' +
    '<path d="M-6 -150 L0 -78 L6 -150" fill="none" stroke="#3a2c1c" stroke-width="4"/>' +
    '<circle r="66" fill="none" stroke="#f2ede1" stroke-width="30"/>' +
    '<circle r="66" fill="none" stroke="#d2402f" stroke-width="30" stroke-dasharray="51.8 51.8" transform="rotate(22)"/>' +
    '<circle r="81" fill="none" stroke="#1d1712" stroke-width="2"/><circle r="51" fill="none" stroke="#1d1712" stroke-width="2"/>' +
    '<path d="M-58 -40 Q0 -98 58 -40 M-58 40 Q0 98 58 40" fill="none" stroke="#cdb98c" stroke-width="4" stroke-dasharray="6 5"/>' +
    "</g>" +

    /* cipher note (same code as the worker's room) */
    '<g class="sgr-note" role="button" tabindex="-1" aria-label="Open complete signal code" transform="translate(1340 58) rotate(3) scale(1.08)">' +
    '<g class="sgr-note-lift" filter="url(#sg-shadow)">' +
    '<path d="M0 4 L176 0 L180 178 L150 210 L2 208 Z" fill="#e6d08a" stroke="#6d5a2c" stroke-width="2"/>' +
    '<path d="M180 178 L150 210 L156 182 Z" fill="#c4ac66" stroke="#6d5a2c" stroke-width="1.5"/>' +
    '<text class="sg-type sg-type-head" x="90" y="44">CIPHER CODE</text>' +
    '<text class="sg-type" x="24" y="82">A=1</text><text class="sg-type" x="100" y="82">B=2</text>' +
    '<text class="sg-type" x="24" y="110">C=3</text><text class="sg-type" x="100" y="110">D=4</text>' +
    '<text class="sg-type" x="80" y="134">\u2026</text>' +
    '<text class="sg-type" x="24" y="160">Y=25</text><text class="sg-type" x="100" y="160">Z=26</text>' +
    '<text class="sg-type" x="24" y="190">0=30 \u2026 9=39</text>' +
    '<circle cx="90" cy="10" r="7" fill="url(#sg-rivet)" stroke="#1c1f1a" stroke-width="1.5"/>' +
    "</g></g>" +

    /* steel console */
    '<rect x="0" y="466" width="1600" height="434" fill="url(#sg-console)"/>' +
    '<rect x="0" y="452" width="1600" height="24" fill="#2c3127" stroke="#101310" stroke-width="2"/>' +
    '<path d="M0 455 H1600" stroke="#5f6855" stroke-width="2" opacity=".7"/>' +
    '<rect x="0" y="476" width="1600" height="20" fill="url(#sg-shade-up)"/>' +
    '<g class="sg-panel" fill="url(#sg-panel)"><rect x="34" y="494" width="244" height="380" rx="14"/><rect x="296" y="488" width="1008" height="392" rx="14"/><rect x="1322" y="494" width="244" height="380" rx="14"/></g>' +
    '<g class="sg-rivet" fill="url(#sg-rivet)">' +
    '<circle cx="52" cy="512" r="4.5"/><circle cx="260" cy="512" r="4.5"/><circle cx="52" cy="856" r="4.5"/><circle cx="260" cy="856" r="4.5"/>' +
    '<circle cx="1340" cy="512" r="4.5"/><circle cx="1548" cy="512" r="4.5"/><circle cx="1340" cy="856" r="4.5"/><circle cx="1548" cy="856" r="4.5"/></g>' +

    /* radar */
    '<g transform="translate(156 650) scale(.86)">' +
    '<circle r="118" fill="url(#sg-ring)" stroke="#121410" stroke-width="3" filter="url(#sg-shadow-sm)"/>' +
    '<circle r="106" fill="#0a0c09" stroke="#2c312a" stroke-width="2"/><circle r="100" fill="url(#sg-radar)"/>' +
    '<g fill="none" stroke="#5cd16b" stroke-opacity=".3" stroke-width="2"><circle r="33"/><circle r="66"/><path d="M-100 0 H100 M0 -100 V100"/></g>' +
    '<g class="sig-radar-sweep"><path d="M0 0 L100 0 A100 100 0 0 0 64.28 -76.6 Z" fill="url(#sg-sweep)"/><path d="M0 0 L100 0" stroke="#b0ffb6" stroke-width="3"/></g>' +
    '<circle class="sgr-blip" cx="58" cy="-44" r="7" fill="#c6ffcb"/><circle r="5" fill="#c6ffcb"/>' +
    '<circle r="100" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="6"/>' +
    "</g>" +
    '<g transform="translate(156 800)"><rect x="-60" y="-18" width="120" height="34" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/><text class="sg-plate-text" y="7">RADAR</text></g>' +

    /* screen */
    '<rect x="312" y="500" width="976" height="100" rx="16" fill="url(#sg-bezel-dark)" stroke="#111410" stroke-width="3"/>' +
    '<rect x="326" y="510" width="948" height="80" rx="10" fill="#08190c" stroke="#030703" stroke-width="3"/>' +
    '<rect x="326" y="510" width="948" height="80" rx="10" fill="url(#sg-screen)"/>' +
    '<text class="sgr-crt-small" x="348" y="536">DECODED MESSAGE</text>' +
    '<text class="sgr-crt-small" id="sgr-status" x="1252" y="536" text-anchor="end">STANDBY</text>' +
    '<text class="sgr-crt-big" id="sgr-log" x="348" y="578"></text>' +
    '<rect x="326" y="510" width="948" height="80" rx="10" fill="url(#sg-scan)" pointer-events="none"/>' +

    /* keyboard */
    '<g class="sgr-keys">' +
    keyRow("1234567890".split(""), 614, 0) +
    keyRow("QWERTYUIOP".split(""), 678, 0) +
    keyRow("ASDFGHJKL".split(""), 742, 48) +
    keyRow("ZXCVBNM".split(""), 806, 144) +
    "</g>" +

    /* transmitter: auto-call lamp, on-air lamp, desk microphone */
    '<g class="sgr-tx">' +
    '<g transform="translate(1444 548)"><circle class="sgr-lamp sgr-lamp-auto" cx="-62" r="11"/><text class="sgr-lamp-text" x="-40" y="6">AUTO CALL</text></g>' +
    '<g transform="translate(1444 596)"><circle class="sgr-lamp sgr-lamp-air" cx="-62" r="11"/><text class="sgr-lamp-text" x="-40" y="6">ON AIR</text></g>' +
    '<g transform="translate(1444 740)">' +
    '<ellipse cy="96" rx="70" ry="14" fill="#1d201b"/><rect x="-52" y="76" width="104" height="22" rx="8" fill="#2b2e2a" stroke="#101210" stroke-width="2"/>' +
    '<path d="M0 78 V20" stroke="#8d938b" stroke-width="8" stroke-linecap="round"/>' +
    '<rect x="-30" y="-74" width="60" height="96" rx="30" fill="#3a3f37" stroke="#101210" stroke-width="2.5"/>' +
    '<path d="M-20 -50 H20 M-24 -36 H24 M-24 -22 H24 M-24 -8 H24 M-20 6 H20" stroke="#1a1d18" stroke-width="3"/>' +
    '<rect x="-22" y="-64" width="10" height="70" rx="5" fill="#fff" opacity=".1"/>' +
    "</g>" +
    '<g transform="translate(1444 860)"><rect x="-64" y="-15" width="128" height="30" rx="4" fill="url(#sg-brass)" stroke="#4d3d20" stroke-width="2"/><text class="sg-plate-text sg-plate-small" y="6">TRANSMIT</text></g>' +
    "</g>" +

    '<rect class="sg-room-flash" width="1600" height="900"/>' +
    '<rect class="sg-vignette" width="1600" height="900" fill="url(#sg-vignette)" pointer-events="none"/>' +
    "</svg>";

  var SCOPE =
    '<svg viewBox="0 0 1600 900" aria-hidden="true">' +
    '<defs><clipPath id="sgr-lens"><circle cx="800" cy="430" r="400"/></clipPath>' +
    '<radialGradient id="sgr-lens-edge" cx=".5" cy=".478" r=".5" gradientUnits="objectBoundingBox">' +
    '<stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient></defs>' +
    '<rect width="1600" height="900" fill="#020303"/>' +
    '<g clip-path="url(#sgr-lens)">' +
    '<rect x="400" y="30" width="800" height="800" fill="url(#sg-sky)"/>' +
    '<g transform="translate(0 -70)">' +
    '<g class="sg-clouds sg-clouds-back" transform="translate(0 -20)"><use href="#sg-cloud-back"/><use href="#sg-cloud-back" x="1040"/></g>' +
    '<g class="sg-bolt"><path d="M1010 40 L985 120 L1006 124 L972 200 L994 204 L960 262" fill="none" stroke="#f4f8ff" stroke-width="5" stroke-linejoin="round"/></g>' +
    '<rect x="400" y="470" width="800" height="440" fill="url(#sg-sea)"/>' +
    '<rect x="400" y="466" width="800" height="5" fill="#5a7690" opacity=".6"/>' +
    '<g class="sg-waves" transform="translate(0 236)"><use href="#sg-waveset"/><use href="#sg-waveset" x="1040"/></g>' +
    '<path d="M410 576 C470 562 520 568 580 566 C660 562 720 558 800 560 C880 562 960 556 1040 562 C1100 566 1150 564 1190 574 L1200 640 H400 Z" fill="url(#sg-rock)" stroke="#121314" stroke-width="2"/>' +
    houseMarkup() +
    '<path d="M400 620 C600 606 1000 606 1200 620 V910 H400 Z" fill="#1b1d1f"/>' +
    '<g class="sg-clouds sg-clouds-front" transform="translate(0 -10)" opacity=".7"><use href="#sg-cloud-front"/><use href="#sg-cloud-front" x="1040"/></g>' +
    '<g class="sgr-rain">' +
    '<rect class="sgr-rain-far" x="350" y="-170" width="900" height="1120" fill="url(#sgr-rain-far)"/>' +
    '<rect class="sgr-rain-mid" x="330" y="-210" width="940" height="1200" fill="url(#sgr-rain-mid)"/>' +
    '<rect class="sgr-rain-near" x="300" y="-250" width="1000" height="1280" fill="url(#sgr-rain-near)"/>' +
    "</g>" +
    '<rect class="sg-flash" x="400" y="30" width="800" height="900"/>' +
    '<g class="sgr-reticle">' +
    '<path d="M800 60 V200 M800 700 V800 M430 430 H470 M1130 430 H1170" class="sgr-tick"/>' +
    '<path d="M440 640 H1160" class="sgr-tick"/>' + powerMarkup() +
    "</g>" +
    "</g>" +
    "</g>" +
    '<circle cx="800" cy="430" r="400" fill="url(#sgr-lens-edge)"/>' +
    '<circle cx="800" cy="430" r="400" fill="none" stroke="#000" stroke-width="22"/>' +
    '<circle cx="800" cy="430" r="412" fill="none" stroke="#3a3a2c" stroke-width="5"/>' +
    "</svg>" +
    '<button type="button" class="sgr-scope-close" aria-label="Close telescope">Close &#10005;</button>';

  var layer = document.createElement("div");
  layer.className = "sgr-layer";
  layer.hidden = true;
  layer.innerHTML = SCENE;
  kit.cam.appendChild(layer);

  var scope = document.createElement("div");
  scope.className = "sgr-scope";
  scope.hidden = true;
  scope.innerHTML = SCOPE;
  room.appendChild(scope);

  var sceneSvg = layer.querySelector(".sgr-scene");
  var islandsG = layer.querySelector("#sgr-islands");
  var marksG = layer.querySelector("#sgr-marks");
  var hover = layer.querySelector("#sgr-hover");
  var mapHit = layer.querySelector(".sgr-map-hit");
  var logEl = layer.querySelector("#sgr-log");
  var statusEl = layer.querySelector("#sgr-status");
  var scopeHit = layer.querySelector(".sgr-scope-hit");
  var noteEl = layer.querySelector(".sgr-note");
  var closeBtn = scope.querySelector(".sgr-scope-close");
  var houses = Array.prototype.slice.call(scope.querySelectorAll(".sgr-house"));
  var keyEls = {};
  Array.prototype.forEach.call(layer.querySelectorAll(".sgr-key"), function (node) {
    keyEls[node.getAttribute("data-key")] = node;
  });

  /* ---------- State ---------- */

  var active = false;
  /* off | intro | needScope | tutorial | needClose | decode | busy | mark | end */
  var phase = "off";
  var stages = [];
  var stage = 0;
  var idx = 0;
  var tries = 0;
  var tutorialChar = false;
  var scopeOpen = false;
  var loopTimer = 0;
  var loopCode = 0;
  var target = { lat: 0, lng: 0 };
  var decoded = [];
  var waiter = null;

  function waitFor(name) {
    return new Promise(function (resolve) { waiter = { name: name, resolve: resolve }; });
  }

  function fire(name) {
    if (!waiter || waiter.name !== name) return;
    var w = waiter;
    waiter = null;
    w.resolve();
  }

  function rand(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function setFlags() {
    layer.classList.toggle("can-scope", !scopeOpen && (phase === "needScope" || phase === "decode" || phase === "busy"));
    layer.classList.toggle("can-type", phase === "decode");
    layer.classList.toggle("can-mark", phase === "mark");
    scope.classList.toggle("can-close", phase !== "needScope" && phase !== "tutorial" && phase !== "intro" && phase !== "end");
  }

  function setPhase(p) {
    phase = p;
    setFlags();
  }

  function status(text) {
    statusEl.textContent = text;
  }

  /* ---------- Lights (only visible through the telescope) ---------- */

  function showLights(code) {
    houses.forEach(function (house, i) {
      house.classList.toggle("is-on", !!(code & VALUES[i]));
    });
    layer.classList.toggle("is-lit", code > 0);
  }

  function stopLoop() {
    window.clearTimeout(loopTimer);
    loopTimer = 0;
    loopCode = 0;
    showLights(0);
  }

  /* No one answers on his side, so the survivor keeps resending the same character. */
  function startLoop(code) {
    stopLoop();
    loopCode = code;
    var on = true;
    var tick = function () {
      if (!loopCode) return;
      showLights(on ? loopCode : 0);
      loopTimer = window.setTimeout(tick, on ? LIGHT_ON : LIGHT_OFF);
      on = !on;
    };
    tick();
    status("SIGNAL: REPEATING");
  }

  /* ---------- Telescope view ---------- */

  async function openScope() {
    if (scopeOpen) return;
    scopeOpen = true;
    setFlags();
    sfx.press();
    room.classList.add("sgr-peek");
    await wait(kit.reduced ? 0 : 520);
    if (!scopeOpen) return;
    scope.hidden = false;
    fire("scope");
  }

  function closeScope() {
    if (!scopeOpen) return;
    scopeOpen = false;
    scope.hidden = true;
    room.classList.add("sgr-snap");
    room.classList.remove("sgr-peek");
    void kit.cam.offsetWidth;
    room.classList.remove("sgr-snap");
    setFlags();
    fire("close");
  }

  scopeHit.addEventListener("click", function () {
    if (!layer.classList.contains("can-scope")) return;
    spot(null);
    openScope();
  });

  closeBtn.addEventListener("click", function () {
    if (!scope.classList.contains("can-close")) return;
    closeScope();
  });

  noteEl.addEventListener("click", function () {
    if (!active || phase === "intro" || phase === "off") return;
    var modal = document.getElementById("sig-note-modal");
    var close = document.getElementById("sig-note-close");
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    if (close) close.focus();
  });

  /* ---------- Screen log ---------- */

  function renderLog(cursor) {
    var parts = decoded.slice();
    var st = stages[stage];
    if (st && idx > 0 && idx < st.word.length) parts.push((st.tag ? st.tag + " " : "") + st.word.slice(0, idx));
    else if (st && cursor && st.tag) parts.push(st.tag + " ");
    logEl.textContent = "> " + parts.join("  ") + (cursor ? "_" : "");
  }

  /* ---------- Map ---------- */

  function blob(cx, cy, r) {
    var pts = [];
    var n = 9;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var rr = r * (0.7 + Math.random() * 0.45);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85]);
    }
    var d = "";
    for (var k = 0; k < n; k++) {
      var p = pts[k];
      var q = pts[(k + 1) % n];
      var mx = ((p[0] + q[0]) / 2).toFixed(1);
      var my = ((p[1] + q[1]) / 2).toFixed(1);
      if (k === 0) {
        var last = pts[n - 1];
        d += "M" + ((last[0] + p[0]) / 2).toFixed(1) + " " + ((last[1] + p[1]) / 2).toFixed(1);
      }
      d += " Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + mx + " " + my;
    }
    return d + " Z";
  }

  function drawIslands() {
    while (islandsG.firstChild) islandsG.removeChild(islandsG.firstChild);
    var spots = [{ lat: target.lat, lng: target.lng, r: 22 }];
    var guard = 0;
    while (spots.length < 6 && guard++ < 200) {
      var c = { lat: rand(11, 28), lng: rand(11, 28), r: 14 + Math.random() * 12 };
      var clash = spots.some(function (s) { return Math.abs(s.lat - c.lat) < 4 && Math.abs(s.lng - c.lng) < 4; });
      if (!clash) spots.push(c);
    }
    var html = "";
    spots.forEach(function (s, i) {
      var cx = mapX(s.lng) + (i === 0 ? (Math.random() - 0.5) * 8 : 0);
      var cy = mapY(s.lat) + (i === 0 ? (Math.random() - 0.5) * 8 : 0);
      html += '<path d="' + blob(cx, cy, s.r) + '" fill="#cdbd8c" stroke="#5f4c2c" stroke-width="2" stroke-linejoin="round"/>';
      html += '<path d="' + blob(cx, cy, s.r * 0.55) + '" fill="none" stroke="#8f7a50" stroke-width="1" opacity=".7"/>';
    });
    islandsG.innerHTML = html;
  }

  function mapPoint(event) {
    var pt = sceneSvg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    var p = pt.matrixTransform(sceneSvg.getScreenCTM().inverse());
    var lng = Math.round((p.x - GRID.x) / STEP) + MIN;
    var lat = Math.round((GRID.y + GRID.size - p.y) / STEP) + MIN;
    return {
      lat: Math.max(MIN, Math.min(MAX, lat)),
      lng: Math.max(MIN, Math.min(MAX, lng))
    };
  }

  function cross(lat, lng, miss) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "sgr-x" + (miss ? " is-miss" : ""));
    g.setAttribute("transform", "translate(" + mapX(lng).toFixed(1) + " " + mapY(lat).toFixed(1) + ")");
    g.innerHTML = '<path d="M-11 -11 L11 11 M11 -11 L-11 11"/>';
    marksG.appendChild(g);
    return g;
  }

  mapHit.addEventListener("pointermove", function (event) {
    if (phase !== "mark") return;
    var p = mapPoint(event);
    hover.setAttribute("cx", mapX(p.lng));
    hover.setAttribute("cy", mapY(p.lat));
    hover.classList.add("is-on");
  });

  mapHit.addEventListener("pointerleave", function () {
    hover.classList.remove("is-on");
  });

  mapHit.addEventListener("click", function (event) {
    if (phase !== "mark") return;
    var p = mapPoint(event);
    if (p.lat === target.lat && p.lng === target.lng) {
      hover.classList.remove("is-on");
      cross(p.lat, p.lng, false);
      found();
      return;
    }
    tries += 1;
    var miss = cross(p.lat, p.lng, true);
    sfx.chirp(false);
    window.setTimeout(function () { if (miss.parentNode) miss.parentNode.removeChild(miss); }, 1400);
    var msg = "That's latitude " + p.lat + ", longitude " + p.lng + ". Not quite...";
    if (tries >= 2) {
      msg += " Find " + target.lat + " on the left side and " + target.lng + " along the bottom, then follow both lines to where they cross.";
    } else {
      msg += " He said latitude " + target.lat + ", longitude " + target.lng + ".";
    }
    say("me", "think", msg, { hold: true, passive: true });
  });

  /* ---------- Keyboard ---------- */

  function flashKey(ch, cls) {
    var node = keyEls[ch];
    if (!node) return;
    node.classList.remove("is-ok", "is-bad", "is-down");
    void node.getBoundingClientRect();
    node.classList.add("is-down", cls);
    window.setTimeout(function () { node.classList.remove("is-down"); }, 140);
    window.setTimeout(function () { node.classList.remove(cls); }, 500);
  }

  function wantChar() {
    var st = stages[stage];
    return st ? st.word[idx] : "";
  }

  function hint(ch) {
    var want = wantChar();
    var code = codeOf(want);
    var lit = [];
    var parts = [];
    for (var i = 0; i < 6; i++) {
      if (code & VALUES[i]) {
        lit.push(POWERS[i]);
        parts.push(VALUES[i]);
      }
    }
    var litText = lit.length > 1 ? lit.slice(0, -1).join(", ") + " and " + lit[lit.length - 1] : lit[0];
    var kind = /\d/.test(want) ? "digit" : "letter";
    var got = codeOf(ch);
    if (tries === 1) {
      return "Hmm, '" + ch + "' would be " + got + " on the cipher code. That doesn't match the lights. Let me add up the lit lighthouses again.";
    }
    if (tries === 2) {
      return "Look closely: the lit lighthouses are " + litText + ". Add their values, then find that number on the cipher code.";
    }
    return "The lights add up to " + parts.join(" + ") + " = " + code + ". Which " + kind + " is " + code + " on the cipher code?";
  }

  var PROMPT = "Open the telescope, add up the lit lighthouses, then type the character he's sending.";

  /* Decoding guide: stays up (no click needed) and lets clicks through to the controls underneath. */
  function guide(text, mood) {
    if (kit.showing() === text) return;
    say("me", mood || "normal", text, { hold: true, mid: true, passive: true });
  }

  function press(ch) {
    if (phase !== "decode") return;
    sfx.press();
    if (ch !== wantChar()) {
      tries += 1;
      flashKey(ch, "is-bad");
      sfx.chirp(false);
      guide(hint(ch), "think");
      return;
    }
    flashKey(ch, "is-ok");
    sfx.chirp(true);
    accept();
  }

  Array.prototype.forEach.call(layer.querySelectorAll(".sgr-key"), function (node) {
    node.addEventListener("click", function () {
      press(node.getAttribute("data-key"));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!active || !kit.gameVisible()) return;
    if (event.key === "Escape" && scopeOpen && scope.classList.contains("can-close")) {
      closeScope();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!/^[a-z0-9]$/i.test(event.key)) return;
    var modal = document.getElementById("sig-note-modal");
    if (modal && !modal.hidden) return;
    if (phase !== "decode") return;
    event.preventDefault();
    press(event.key.toUpperCase());
  });

  /* ---------- Decoding flow ---------- */

  function beginChar() {
    tries = 0;
    renderLog(true);
    startLoop(codeOf(wantChar()));
    guide(PROMPT);
  }

  async function accept() {
    setPhase("busy");
    spot(null);
    stopLoop();
    idx += 1;
    var st = stages[stage];
    var wordDone = idx >= st.word.length;
    if (wordDone || tutorialChar) quiet();
    if (wordDone) {
      decoded.push((st.tag ? st.tag + " " : "") + st.word);
      idx = 0;
      stage += 1;
    }
    renderLog(!wordDone);
    status("SIGNAL: \u2014");

    if (tutorialChar) {
      tutorialChar = false;
      await wait(500);
      await say("me", "joy", "19 is S! That's the first letter... and the lights just went dark. He's moving on to the next one.");
      await say("me", "normal", "Every letter works the same way. I'll open the telescope whenever I need another look.");
      quiet();
    }

    if (wordDone) {
      await afterWord(stage - 1);
      if (phase === "mark" || phase === "end") return;
    } else {
      await wait(GAP);
    }
    setPhase("decode");
    beginChar();
  }

  function onAir(text, mood) {
    layer.classList.add("is-air");
    sfx.burst(0.25, 0.25);
    return say("me", mood || "normal", text, { name: "ME \u00B7 ON AIR", onair: true }).then(function () {
      layer.classList.remove("is-air");
    });
  }

  async function afterWord(n) {
    await wait(500);
    if (n === 0) {
      await say("me", "alert", "S-O-S... It's a distress call! Someone really is stranded out there!");
      await onAir("We read your SOS! Stay calm, we're right here. How many people are with you?", "normal");
      await say("me", "think", "He heard me... the lights are changing again. Here comes his answer.");
    } else if (n === 1) {
      await say("me", "think", "O-N-E... Just one person, alone on that island in this storm.");
      await onAir("Copy that, one survivor. Are you hurt?", "normal");
    } else if (n === 2) {
      await say("me", "normal", "C-O-L-D... Cold, but not injured. That's good news.");
      await onAir("Hang in there! We need your exact position to reach you. Send us your latitude first.", "normal");
      await say("me", "think", "Numbers are coming. On the cipher code, digits use 30 to 39: 0 = 30, 1 = 31, all the way to 9 = 39. He'll send one digit at a time.");
    } else if (n === 3) {
      await say("me", "joy", "Latitude " + target.lat + "!");
      await onAir("Latitude " + target.lat + ", copy. Now send your longitude.", "normal");
    } else if (n === 4) {
      quiet();
      await say("me", "alert", "Longitude " + target.lng + "! Latitude " + target.lat + ", longitude " + target.lng + ". Let me find him on the chart!");
      markMap();
      return;
    }
    quiet();
  }

  function markMap() {
    stopLoop();
    closeScope();
    status("PLOTTING...");
    tries = 0;
    spot({ x: SPOTS.map.x, y: SPOTS.map.y, rx: SPOTS.map.rx, ry: SPOTS.map.ry, label: "LAT " + target.lat + " \u00B7 LNG " + target.lng, side: "right", gap: 16 });
    setPhase("mark");
    say("me", "think", "Latitude runs up the left side, longitude along the bottom. Click where latitude " + target.lat + " and longitude " + target.lng + " meet.", { hold: true });
  }

  async function found() {
    setPhase("end");
    quiet();
    spot(null);
    sfx.thud();
    status("TARGET LOCKED");
    await wait(700);
    await say("me", "alert", "Got him! Latitude " + target.lat + ", longitude " + target.lng + ". Right on that little island!");
    await onAir("We've located you! Hang on, we're coming to rescue you!", "smile");
    quiet();
    await openScope();
    showLights(63);
    room.classList.add("sgs-blaze");
    sfx.fanfare();
    await wait(900);
    await say("me", "smile", "All six lights are on... He heard us. Rescue boat, go!");
    quiet();
    showClear();
  }

  function showClear() {
    kit.showClear("CONGRATULATIONS!", "You rescued the stranded worker \u00B7 LAT " + target.lat + " \u00B7 LNG " + target.lng, true);
  }

  /* ---------- Opening ---------- */

  async function intro() {
    setPhase("intro");
    room.classList.add("sgs-dark");
    status("STANDBY");
    renderLog(false);
    await wait(900);
    kit.lightning();
    await wait(900);
    await say("me", "think", "This storm came out of nowhere... It's the worst one all year. If anyone is out at sea tonight, they're in serious danger.");
    await say("me", "normal", "Let me sweep every channel and scan for signals.");
    quiet();

    spot(SPOTS.radar);
    for (var p = 0; p <= 100; p += 20) {
      status("SCANNING " + p + "%");
      if (p % 40 === 0) sfx.burst(0.4, 0.22);
      await wait(420);
    }
    layer.classList.add("is-blip");
    status("WEAK SIGNAL: EAST ISLAND");
    sfx.chirp(true);
    await wait(500);
    await say("me", "alert", "There! A faint signal... It's coming from that small island to the east!");
    spot(null);
    quiet();

    layer.classList.add("is-auto");
    var bed = sfx.bed(0.12);
    await say("radio", null, "This is Harbour Rescue, Station 7. We are picking up a weak signal from your island. Do you need assistance? Please respond.", { name: "AUTO CALL" });
    bed.stop();
    quiet();
    sfx.burst(1.4, 0.4);
    status("NO REPLY");
    await wait(1600);
    bed = sfx.bed(0.12);
    await say("radio", null, "Repeat: this is Harbour Rescue, Station 7. Please respond on any channel. Over.", { name: "AUTO CALL" });
    bed.stop();
    quiet();
    sfx.blind();
    await wait(2200);
    layer.classList.remove("is-auto");
    await say("me", "think", "Nothing but static... But that signal didn't come from nowhere. Someone is there.");
    room.classList.remove("sgs-dark");

    spot(SPOTS.telescope);
    setPhase("needScope");
    say("me", "normal", "Let me take a look at that island through the telescope.", { hold: true });
    await waitFor("scope");
    quiet();
    spot(null);
    setPhase("tutorial");
    await tutorial();
  }

  async function tutorial() {
    status("OBSERVING");
    await wait(1400);
    kit.lightning();
    await wait(900);
    stage = 0;
    idx = 0;
    startLoop(codeOf(wantChar()));
    await wait(1200);
    await say("me", "alert", "Look! The lighthouses that were dark just lit up! And that's a well-known code... He's trying to tell us something. Quick, let's decode it!");
    await onAir("We see your lights! Keep them coming, we're reading you!", "smile");

    spot(SPOTS.houses);
    await say("me", "think", "From left to right, the six lighthouses stand for 2\u2075, 2\u2074, 2\u00B3, 2\u00B2, 2\u00B9 and 2\u2070. That's 32, 16, 8, 4, 2 and 1.", { top: true });
    await say("me", "think", "A lit lighthouse counts its value; a dark one counts as 0. Add up the lit ones and you get the code number.", { top: true });
    await say("me", "normal", "He keeps repeating the same letter because nobody has answered him. Right now 2\u2074, 2\u00B9 and 2\u2070 are lit: 16 + 2 + 1 = 19.", { top: true });

    spot(SPOTS.close);
    setPhase("needClose");
    say("me", "normal", "Now let me close the telescope and check the cipher code.", { hold: true });
    await waitFor("close");
    quiet();

    spot(SPOTS.note);
    await say("me", "think", "The cipher code on the wall: A = 1, B = 2, C = 3... So which letter is 19? I can click the note to see the full table.");
    spot(SPOTS.keys);
    tutorialChar = true;
    tries = 0;
    renderLog(true);
    setPhase("decode");
    guide("Type that letter on the keyboard.");
  }

  /* ---------- Start / reset ---------- */

  function reset() {
    active = false;
    waiter = null;
    stopLoop();
    scopeOpen = false;
    scope.hidden = true;
    layer.hidden = true;
    ["sgr-peek", "sgs-blaze", "sgs-dark"].forEach(function (c) { room.classList.remove(c); });
    ["is-blip", "is-auto", "is-air", "is-lit"].forEach(function (c) { layer.classList.remove(c); });
    while (marksG.firstChild) marksG.removeChild(marksG.firstChild);
    hover.classList.remove("is-on");
    setPhase("off");
  }

  function start() {
    reset();
    active = true;
    kit.setCast("rescuer", FACES);
    target = { lat: rand(MIN + 1, MAX - 1), lng: rand(MIN + 1, MAX - 1) };
    stages = [
      { word: "SOS" },
      { word: "ONE" },
      { word: "COLD" },
      { word: String(target.lat), tag: "LAT" },
      { word: String(target.lng), tag: "LNG" }
    ];
    stage = 0;
    idx = 0;
    decoded = [];
    drawIslands();
    layer.hidden = false;
    intro();
  }

  window.SignalRoomRescue = { start: start, reset: reset };
})();
