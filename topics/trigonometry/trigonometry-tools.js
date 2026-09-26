(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  /* Free-triangle ink: dark blue lines, grey vertices. */
  var TRI = {
    line: "#234e70",
    fill: "rgba(35, 78, 112, 0.12)",
    ink: "#27364a",
    vertex: "#6b7280",
  };
  var CHART = {
    a: "#1f6b4a",
    b: "#6b7280",
    point: "#3d7ea6",
    guide: "#94a3b8",
  };

  function E(tag, attrs, text) {
    var el = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (text != null) el.textContent = text;
    return el;
  }
  function $(id) { return document.getElementById(id); }
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmt(x, n) {
    n = n == null ? 2 : n;
    return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n);
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function nearly(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 8 : eps); }

  /** Exact special trig values as TeX (fallback: decimal). */
  function exactTex(v) {
    if (!isFinite(v)) return "\\infty";
    var eps = 1e-6;
    var s2 = Math.SQRT1_2; // √2/2
    var s3 = Math.sqrt(3);
    var known = [
      [0, "0"], [1, "1"], [-1, "-1"],
      [0.5, "\\dfrac{1}{2}"], [-0.5, "-\\dfrac{1}{2}"],
      [0.25, "\\dfrac{1}{4}"], [-0.25, "-\\dfrac{1}{4}"],
      [0.75, "\\dfrac{3}{4}"], [-0.75, "-\\dfrac{3}{4}"],
      [s2, "\\dfrac{\\sqrt{2}}{2}"], [-s2, "-\\dfrac{\\sqrt{2}}{2}"],
      [s3 / 2, "\\dfrac{\\sqrt{3}}{2}"], [-s3 / 2, "-\\dfrac{\\sqrt{3}}{2}"],
      [s3, "\\sqrt{3}"], [-s3, "-\\sqrt{3}"],
      [1 / s3, "\\dfrac{\\sqrt{3}}{3}"], [-1 / s3, "-\\dfrac{\\sqrt{3}}{3}"],
      [s3 / 3, "\\dfrac{\\sqrt{3}}{3}"], [-s3 / 3, "-\\dfrac{\\sqrt{3}}{3}"],
    ];
    for (var i = 0; i < known.length; i++) {
      if (Math.abs(v - known[i][0]) < eps) return known[i][1];
    }
    // near-integers
    var r = Math.round(v);
    if (Math.abs(v - r) < eps) return String(r);
    return fmt(v, 3);
  }

  /** Safe KaTeX → HTML. Never dump raw TeX into the page. */
  function K(tex, display) {
    if (!window.katex) return "<code>" + tex + "</code>";
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: !!display });
    } catch (e) {
      return "<code>" + tex + "</code>";
    }
  }

  function paintTex(root) {
    (root || document).querySelectorAll("[data-tex]").forEach(function (el) {
      el.innerHTML = K(el.getAttribute("data-tex"), el.hasAttribute("data-display"));
    });
  }

  function svgPoint(svg, e) {
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    return {
      x: (e.clientX - r.left) * (vb.width / Math.max(r.width, 1)),
      y: (e.clientY - r.top) * (vb.height / Math.max(r.height, 1)),
    };
  }

  /* ───────── nav ───────── */
  function initLabNav() {
    var nav = $("trig-lab-nav");
    nav.querySelectorAll("[data-lab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        nav.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        document.querySelectorAll("#panel-tools .lab").forEach(function (lab) {
          lab.classList.toggle("active", lab.id === "lab-" + btn.dataset.lab);
        });
        paintTex($("panel-tools"));
      });
    });

    var p1 = $("p1-subnav");
    p1.querySelectorAll("[data-p1]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p1.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        ["iso", "half", "hand"].forEach(function (k) {
          $("stage-" + k).style.display = btn.dataset.p1 === k ? "" : "none";
        });
        // re-paint after becoming visible (display:none breaks first draw size)
        if (btn.dataset.p1 === "iso") renderIso();
        if (btn.dataset.p1 === "half") renderHalf();
        if (btn.dataset.p1 === "hand") renderHand();
      });
    });

    var p2 = $("p2-subnav");
    if (p2) {
      p2.querySelectorAll("[data-p2]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          p2.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
          btn.classList.add("active");
          $("stage-identity").style.display = btn.dataset.p2 === "pyth" ? "" : "none";
          $("stage-idtan").style.display = btn.dataset.p2 === "tan" ? "" : "none";
          var methods = $("id-method-nav");
          if (methods) methods.style.display = btn.dataset.p2 === "pyth" ? "" : "none";
          if (btn.dataset.p2 === "pyth") renderIdentitySection();
          if (btn.dataset.p2 === "tan") renderIdTan();
        });
      });
    }

    var p3 = $("p3-subnav");
    p3.querySelectorAll("[data-p3]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p3.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        $("stage-cosin").style.display = btn.dataset.p3 === "sin" ? "" : "none";
        $("stage-cotan").style.display = btn.dataset.p3 === "tan" ? "" : "none";
        if (btn.dataset.p3 === "sin") {
          if (coSin.method === "geo") renderCoGeo();
          else renderCoSin();
        } else {
          if (coTan.method === "geo") renderCoTanGeo();
          else renderCoTan();
        }
      });
    });

    var cosinM = $("cosin-method-nav");
    if (cosinM) {
      cosinM.querySelectorAll("[data-cosin-m]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          cosinM.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
          btn.classList.add("active");
          coSin.method = btn.dataset.cosinM;
          $("cosin-geo-wrap").style.display = coSin.method === "geo" ? "flex" : "none";
          $("cosin-graph-wrap").style.display = coSin.method === "graph" ? "flex" : "none";
          if (coSin.method === "geo") renderCoGeo();
          else renderCoSin();
        });
      });
    }

    var cotanM = $("cotan-method-nav");
    if (cotanM) {
      cotanM.querySelectorAll("[data-cotan-m]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          cotanM.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
          btn.classList.add("active");
          coTan.method = btn.dataset.cotanM;
          $("cotan-geo-wrap").style.display = coTan.method === "geo" ? "flex" : "none";
          $("cotan-graph-wrap").style.display = coTan.method === "graph" ? "flex" : "none";
          if (coTan.method === "geo") renderCoTanGeo();
          else renderCoTan();
        });
      });
    }
  }

  /* =========================================================================
   * Free right triangle: C = right angle, angle = direction of leg CA
   * A = C + lenA·u(angle),  B = C + lenB·u(angle+90°)
   * Drawn with auto-fit so the whole triangle always stays on screen.
   * ========================================================================= */
  var BOX = 220;

  function rtPoints(t) {
    var a = rad(t.angle);
    return {
      C: { x: t.cx, y: t.cy },
      A: { x: t.cx + t.lenA * Math.cos(a), y: t.cy + t.lenA * Math.sin(a) },
      B: {
        x: t.cx + t.lenB * Math.cos(a + Math.PI / 2),
        y: t.cy + t.lenB * Math.sin(a + Math.PI / 2),
      },
      thetaA: deg(Math.atan2(t.lenB, t.lenA)),
      thetaB: deg(Math.atan2(t.lenA, t.lenB)),
    };
  }

  /** Map model → viewBox: scale down only if needed, then nudge inside the pad. */
  function fitOf(t, padOpt) {
    var P = rtPoints(t);
    var pad = padOpt != null ? padOpt : 26;
    var minX = Math.min(P.C.x, P.A.x, P.B.x);
    var maxX = Math.max(P.C.x, P.A.x, P.B.x);
    var minY = Math.min(P.C.y, P.A.y, P.B.y);
    var maxY = Math.max(P.C.y, P.A.y, P.B.y);
    var bw = Math.max(maxX - minX, 40);
    var bh = Math.max(maxY - minY, 40);
    var room = BOX - 2 * pad;
    var s = Math.min(1, room / bw, room / bh);
    var tx = 0, ty = 0;
    var a = s * minX, b = s * maxX, c = s * minY, d = s * maxY;
    if (a < pad) tx = pad - a;
    if (b + tx > BOX - pad) tx = BOX - pad - b;
    if (c < pad) ty = pad - c;
    if (d + ty > BOX - pad) ty = BOX - pad - d;
    // if still larger than room (numerical), center
    if (b - a > room + 0.5 || d - c > room + 0.5) {
      tx = BOX / 2 - s * (minX + maxX) / 2;
      ty = BOX / 2 - s * (minY + maxY) / 2;
    }
    function T(p) { return { x: s * p.x + tx, y: s * p.y + ty }; }
    return {
      s: s, tx: tx, ty: ty,
      C: T(P.C), A: T(P.A), B: T(P.B),
      thetaA: P.thetaA, thetaB: P.thetaB,
      inv: function (p) { return { x: (p.x - tx) / s, y: (p.y - ty) / s }; },
    };
  }

  function modelPoint(svg, e) {
    var p = svgPoint(svg, e);
    if (svg._fit && svg._fit.inv) return svg._fit.inv(p);
    return p;
  }

  function drawFreeRight(svg, t, opts) {
    opts = opts || {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // backdrop so empty cards never look blank
    svg.appendChild(E("rect", {
      x: 0, y: 0, width: BOX, height: BOX, fill: "none",
    }));

    var F = fitOf(t, opts.fitPad);
    svg._fit = F;
    var C = F.C, A = F.A, B = F.B;
    var stroke = opts.stroke || TRI.line;
    var fill = opts.fill || TRI.fill;

    // fill + three thick edges (edges guarantee visibility)
    svg.appendChild(E("polygon", {
      points: [C, A, B].map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: fill, stroke: "none",
    }));
    [[C, A], [C, B], [A, B]].forEach(function (seg) {
      svg.appendChild(E("line", {
        x1: seg[0].x, y1: seg[0].y, x2: seg[1].x, y2: seg[1].y,
        stroke: stroke, "stroke-width": 3, "stroke-linecap": "round",
      }));
    });

    // right-angle mark at C
    var la = Math.hypot(A.x - C.x, A.y - C.y) || 1;
    var lb = Math.hypot(B.x - C.x, B.y - C.y) || 1;
    var ux = (A.x - C.x) / la, uy = (A.y - C.y) / la;
    var vx = (B.x - C.x) / lb, vy = (B.y - C.y) / lb;
    var rs = 11;
    svg.appendChild(E("path", {
      d: "M " + (C.x + ux * rs) + " " + (C.y + uy * rs) +
        " L " + (C.x + ux * rs + vx * rs) + " " + (C.y + uy * rs + vy * rs) +
        " L " + (C.x + vx * rs) + " " + (C.y + vy * rs),
      fill: "none", stroke: "#8a9aa3", "stroke-width": 1.6,
    }));

    // θ arc + small green label near the arc (keep clear of the right-angle mark at C)
    var atB = opts.thetaAt === "B";
    var V = atB ? B : A;
    var W = atB ? A : B;
    var th = atB ? F.thetaB : F.thetaA;
    var a1 = Math.atan2(C.y - V.y, C.x - V.x);
    var a2 = Math.atan2(W.y - V.y, W.x - V.x);
    var distVC = Math.hypot(C.x - V.x, C.y - V.y) || 1;
    var arcR = Math.min(18, Math.max(10, distVC * 0.22));
    var sweep = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    var thetaInk = TRI.line;
    svg.appendChild(E("path", {
      d: "M " + (V.x + arcR * Math.cos(a1)) + " " + (V.y + arcR * Math.sin(a1)) +
        " A " + arcR + " " + arcR + " 0 0 " + (sweep > 0 ? 1 : 0) + " " +
        (V.x + arcR * Math.cos(a2)) + " " + (V.y + arcR * Math.sin(a2)),
      fill: "none", stroke: thetaInk, "stroke-width": 2,
    }));
    var am = a1 + sweep / 2;
    // Prefer just outside the angle so the label does not collide with ∠C
    var labelDist = arcR + 14;
    var lx = V.x + labelDist * Math.cos(am);
    var ly = V.y + labelDist * Math.sin(am);
    var mid = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    // If label lands too near C (or inside the right-angle mark), nudge toward centroid then outward from C
    if (Math.hypot(lx - C.x, ly - C.y) < 28) {
      lx = V.x + (mid.x - V.x) * 0.35;
      ly = V.y + (mid.y - V.y) * 0.35;
      var away = Math.hypot(lx - C.x, ly - C.y) || 1;
      lx = C.x + ((lx - C.x) / away) * Math.max(32, away);
      ly = C.y + ((ly - C.y) / away) * Math.max(32, away);
    }
    lx = clamp(lx, 16, BOX - 16);
    ly = clamp(ly, 14, BOX - 14);
    if (!opts.hideTheta) {
      var thetaText = opts.thetaLabel != null
        ? opts.thetaLabel
        : ("θ=" + Math.round(th) + "°");
      var shortLab = opts.thetaLabel != null && String(opts.thetaLabel).length <= 2;
      var tAttrs = {
        x: lx, y: ly,
        fill: thetaInk,
        "font-size": shortLab ? 15 : 10,
        "font-weight": 800,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      };
      /* Single-letter labels: no dark stroke halo (reads as a black box). */
      if (!shortLab) {
        tAttrs.stroke = "#fffefb";
        tAttrs["stroke-width"] = 3;
        tAttrs["paint-order"] = "stroke fill";
      }
      svg.appendChild(E("text", tAttrs, thetaText));
    }

    if (opts.showSides) {
      svg.appendChild(E("text", {
        x: (C.x + A.x) / 2 + ux * (-10), y: (C.y + A.y) / 2 + uy * (-10),
        fill: TRI.ink, "font-size": 12, "font-weight": 700, "text-anchor": "middle",
      }, opts.sideA || "leg"));
      svg.appendChild(E("text", {
        x: (C.x + B.x) / 2 + vx * (-10), y: (C.y + B.y) / 2 + vy * (-10),
        fill: TRI.ink, "font-size": 12, "font-weight": 700, "text-anchor": "middle",
      }, opts.sideB || "leg"));
    }

    // Equal-length tick marks on both legs (isosceles)
    if (opts.equalLegs) {
      function tick(p1, p2) {
        var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var len = Math.hypot(dx, dy) || 1;
        var px = (-dy / len) * 8, py = (dx / len) * 8;
        svg.appendChild(E("line", {
          x1: mx - px, y1: my - py, x2: mx + px, y2: my + py,
          stroke: TRI.line, "stroke-width": 2.8, "stroke-linecap": "round",
        }));
      }
      tick(C, A);
      tick(C, B);
    }

    if (opts.draggable) {
      [["C", C], ["A", A], ["B", B]].forEach(function (h) {
        svg.appendChild(E("circle", {
          cx: h[1].x, cy: h[1].y, r: 14,
          fill: "transparent",
          "data-h": h[0], style: "cursor:grab",
        }));
        svg.appendChild(E("circle", {
          cx: h[1].x, cy: h[1].y, r: 5,
          fill: TRI.vertex, stroke: "#fff", "stroke-width": 1.4,
          "data-h": h[0], style: "cursor:grab;pointer-events:none",
        }));
      });
    }
  }

  /* ───────── Part 1A isosceles ───────── */
  var iso = {
    step: 0,
    drag: null,
    tris: [
      { cx: 90, cy: 130, lenA: 55, lenB: 100, angle: -15 },
      { cx: 100, cy: 120, lenA: 110, lenB: 50, angle: 35 },
      { cx: 110, cy: 110, lenA: 48, lenB: 90, angle: 195 },
    ],
  };

  function isoReady(t) {
    // Displayed θ is Math.round(...) — only accept when the label reads exactly 45°.
    var ang = deg(Math.atan2(t.lenB, t.lenA));
    return Math.round(ang) === 45;
  }
  function isoAllReady() {
    if (!iso.tris.every(isoReady)) return false;
    var s = iso.tris.map(function (t) { return Math.round((t.lenA + t.lenB) / 16); });
    return new Set(s).size >= 2; // at least visibly different; prefer 3
  }
  function angDiff(a, b) {
    var d = Math.abs(((a - b) % 360 + 360) % 360);
    return d > 180 ? 360 - d : d;
  }
  /** Different enough if size OR rotation differs — not clones of each other. */
  function triDifferent(a, b) {
    var sa = (a.lenA + a.lenB) / 2, sb = (b.lenA + b.lenB) / 2;
    var sizeRatio = Math.abs(sa - sb) / Math.max(sa, sb, 1);
    return sizeRatio > 0.03 || angDiff(a.angle, b.angle) > 10;
  }
  function isoDistinct3() {
    return triDifferent(iso.tris[0], iso.tris[1]) &&
      triDifferent(iso.tris[1], iso.tris[2]) &&
      triDifferent(iso.tris[0], iso.tris[2]);
  }
  function isoCanNext() { return iso.tris.every(isoReady) && isoDistinct3(); }

  function bindIsoSvg(svg, idx) {
    if (svg.dataset.bound) return;
    svg.dataset.bound = "1";
    svg.addEventListener("pointerdown", function (e) {
      var h = e.target.getAttribute("data-h");
      if (!h) return;
      iso.drag = { idx: idx, h: h };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!iso.drag || iso.drag.idx !== idx) return;
      var t = iso.tris[idx];
      var p = modelPoint(svg, e);
      if (iso.drag.h === "C") {
        var ddx = p.x - t.cx, ddy = p.y - t.cy;
        t.cx += ddx;
        t.cy += ddy;
      } else if (iso.drag.h === "A") {
        t.angle = deg(Math.atan2(p.y - t.cy, p.x - t.cx));
        t.lenA = clamp(dist(p, { x: t.cx, y: t.cy }), 30, 200);
      } else {
        var angB = Math.atan2(p.y - t.cy, p.x - t.cx);
        t.angle = deg(angB - Math.PI / 2);
        t.lenB = clamp(dist(p, { x: t.cx, y: t.cy }), 30, 200);
      }
      paintIsoCards();
    });
    svg.addEventListener("pointerup", function () { iso.drag = null; });
    svg.addEventListener("pointercancel", function () { iso.drag = null; });
  }

  function paintIsoCards() {
    iso.tris.forEach(function (t, i) {
      var card = $("iso-card-" + i);
      var svg = $("iso-svg-" + i);
      if (!svg) return;
      if (card) {
        card.classList.toggle("ready", isoReady(t));
        var badge = card.querySelector(".badge");
        if (badge) badge.textContent = isoReady(t) ? "Isosceles ✓" : "Make isosceles";
      }
      drawFreeRight(svg, t, { draggable: true, thetaAt: "A", equalLegs: isoReady(t) });
    });
    var next = $("iso-next");
    var st = $("iso-status");
    if (iso.step === 0) {
      next.disabled = !isoCanNext();
      if (st) {
        st.className = "status-line" + (isoCanNext() ? " ok" : "");
        st.textContent = isoCanNext()
          ? "All three are isosceles and not identical. Next unlocked."
          : "Make each isosceles (equal legs → θ = 45°). Triangles just need to not be identical.";
      }
    }
  }

  function renderIso() {
    var body = $("iso-body");
    var label = $("iso-step-label");
    var next = $("iso-next");
    var prev = $("iso-prev");
    prev.disabled = iso.step === 0;
    label.textContent = "Step " + (iso.step + 1) + " / 3";
    next.disabled = false;
    next.textContent = iso.step === 2 ? "Done" : "Next →";

    if (iso.step === 0) {
      body.innerHTML =
        '<p class="hint-sm">Drag <strong>any vertex</strong> — rotate, stretch, move. The right angle never breaks. Make each triangle isosceles (equal legs). The three just need to <strong>not be identical</strong> (size or rotation).</p>' +
        '<div class="tri-row" id="iso-row">' +
        [0, 1, 2].map(function (i) {
          return '<div class="tri-card" id="iso-card-' + i + '">' +
            '<span class="badge">Make isosceles</span>' +
            '<svg viewBox="0 0 220 220" id="iso-svg-' + i + '"></svg></div>';
        }).join("") +
        "</div>" +
        '<p class="status-line" id="iso-status"></p>';
      [0, 1, 2].forEach(function (i) { bindIsoSvg($("iso-svg-" + i), i); });
      paintIsoCards();
    } else if (iso.step === 1) {
      body.innerHTML =
        '<p class="hint-sm">Your three triangles — notice every acute angle?</p>' +
        '<div class="tri-row">' +
        [0, 1, 2].map(function (i) {
          return '<div class="tri-card ready">' +
            '<span class="badge">Isosceles ✓</span>' +
            '<svg viewBox="0 0 220 220" id="iso-s1-' + i + '"></svg></div>';
        }).join("") +
        "</div>" +
        '<div class="q-row">' +
        "<span>Did you notice that all three triangles are made of " + K("45^\\circ") + " angles?</span>" +
        '<button class="btn" type="button" data-iso-q="yes">Yes</button>' +
        '<button class="btn" type="button" data-iso-q="no">No</button>' +
        '<span class="status-line" id="iso-q-fb" style="margin:0"></span>' +
        "</div>";
      [0, 1, 2].forEach(function (i) {
        var t = Object.assign({}, iso.tris[i]);
        t.lenB = t.lenA;
        drawFreeRight($("iso-s1-" + i), t, { thetaAt: "A", equalLegs: true });
      });
      body.querySelectorAll("[data-iso-q]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          body.querySelectorAll("[data-iso-q]").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          var fb = $("iso-q-fb");
          if (btn.dataset.isoQ === "yes") {
            fb.className = "status-line ok";
            fb.textContent = "Yes — equal legs ⇒ equal acute angles ⇒ both 45°.";
          } else {
            fb.className = "status-line";
            fb.style.color = "var(--bad)";
            fb.textContent = "Check the θ labels on each triangle.";
          }
        });
      });
    } else {
      // Steps 3+4 merged: conclusion + tan 45° = 1 (pure text)
      next.disabled = true;
      body.innerHTML =
        '<div class="conclude text-explain">' +
        '<div class="box">' +
        "<p><strong>Conclusion</strong> — for a right triangle:</p>" +
        "<ul>" +
        "<li>If it is isosceles, both acute angles must be " + K("45^\\circ") + ".</li>" +
        "<li>Conversely, if one acute angle is " + K("45^\\circ") + ", the triangle must be isosceles.</li>" +
        "</ul>" +
        '<p class="math-line" style="margin:12px 0">' + K("45^\\circ\\!-\\!45^\\circ\\!-\\!90^\\circ") + "</p>" +
        "<p>Do you still remember what " + K("\\tan\\theta") + " is?</p>" +
        '<p class="math-line">' + K("\\tan\\theta = \\dfrac{\\text{opposite}}{\\text{adjacent}}") + "</p>" +
        "<p style=\"margin-top:8px\">The hypotenuse is not involved.</p>" +
        "<p style=\"margin-top:12px\">When the right triangle is isosceles, the two legs are equal in length, so their ratio is 1:</p>" +
        '<p class="math-line">' + K("\\tan 45^\\circ = 1") + "</p>" +
        "</div></div>";
    }
  }

  function initIso() {
    $("iso-next").addEventListener("click", function () {
      if (iso.step === 0 && !isoCanNext()) return;
      if (iso.step < 2) { iso.step++; renderIso(); }
    });
    $("iso-prev").addEventListener("click", function () {
      if (iso.step > 0) { iso.step--; renderIso(); }
    });
    renderIso();
  }

  /* ───────── Part 1B: free right triangles → make hyp = 2·opp (θ→30°) ───────── */
  // Same free model as iso: lenA = adj to θ at A, lenB = opp to θ at A.
  // Goal: hyp = 2·opp  ⇒  √(lenA²+lenB²) ≈ 2·lenB  ⇒ θ_A ≈ 30°.
  var half = {
    step: 0,
    drag: null,
    tris: [
      { cx: 90, cy: 130, lenA: 90, lenB: 55, angle: -18 },
      { cx: 100, cy: 120, lenA: 70, lenB: 95, angle: 40 },
      { cx: 110, cy: 115, lenA: 100, lenB: 45, angle: 175 },
    ],
  };

  function halfTheta(t) { return deg(Math.atan2(t.lenB, t.lenA)); }
  function halfHyp(t) { return Math.hypot(t.lenA, t.lenB); }
  function halfReady(t) {
    // Hard rule: displayed θ must read exactly 30° (same standard as 45°).
    return Math.round(halfTheta(t)) === 30;
  }
  function halfDistinct3() {
    return triDifferent(half.tris[0], half.tris[1]) &&
      triDifferent(half.tris[1], half.tris[2]) &&
      triDifferent(half.tris[0], half.tris[2]);
  }
  function halfCanNext() { return half.tris.every(halfReady) && halfDistinct3(); }

  function bindHalfSvg(svg, idx) {
    if (svg.dataset.bound) return;
    svg.dataset.bound = "1";
    svg.addEventListener("pointerdown", function (e) {
      var h = e.target.getAttribute("data-h");
      if (!h) return;
      half.drag = { idx: idx, h: h };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!half.drag || half.drag.idx !== idx) return;
      var t = half.tris[idx];
      var p = modelPoint(svg, e);
      if (half.drag.h === "C") {
        t.cx = p.x;
        t.cy = p.y;
      } else if (half.drag.h === "A") {
        t.angle = deg(Math.atan2(p.y - t.cy, p.x - t.cx));
        t.lenA = clamp(dist(p, { x: t.cx, y: t.cy }), 30, 200);
      } else {
        var angB = Math.atan2(p.y - t.cy, p.x - t.cx);
        t.angle = deg(angB - Math.PI / 2);
        t.lenB = clamp(dist(p, { x: t.cx, y: t.cy }), 30, 200);
      }
      paintHalfCards();
    });
    svg.addEventListener("pointerup", function () { half.drag = null; });
    svg.addEventListener("pointercancel", function () { half.drag = null; });
  }

  function paintHalfCards() {
    half.tris.forEach(function (t, i) {
      var card = $("half-card-" + i);
      var svg = $("half-svg-" + i);
      if (!svg) return;
      var opp = t.lenB;
      var hyp = halfHyp(t);
      var ratio = opp > 0.01 ? hyp / opp : 0;
      if (card) {
        card.classList.toggle("ready", halfReady(t));
        var badge = card.querySelector(".badge");
        if (badge) {
          // UI goal text; pass/fail still uses θ === 30° internally
          badge.textContent = halfReady(t)
            ? "opp/hyp = 1/2 ✓"
            : "Make opp/hyp = 1/2";
        }
        var lenEl = card.querySelector(".len-live");
        if (lenEl) {
          lenEl.textContent = "opp " + fmt(opp / 40, 2) + " · hyp " + fmt(hyp / 40, 2) +
            " · hyp/opp " + fmt(ratio, 2);
        }
      }
      drawFreeRight(svg, t, {
        draggable: true,
        thetaAt: "A",
      });
      // live lengths OUTSIDE the triangle, small type
      var F = fitOf(t);
      function edgeLabel(p1, p2, other, text) {
        var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        if (nx * (other.x - mx) + ny * (other.y - my) > 0) { nx = -nx; ny = -ny; }
        var x = clamp(mx + nx * 12, 14, BOX - 14);
        var y = clamp(my + ny * 12, 12, BOX - 12);
        svg.appendChild(E("text", {
          x: x, y: y,
          fill: TRI.ink, "font-size": 10, "font-weight": 700, "text-anchor": "middle",
          "dominant-baseline": "middle",
          stroke: "#fff", "stroke-width": 2.5, "paint-order": "stroke fill",
        }, text));
      }
      edgeLabel(F.C, F.B, F.A, "opp " + fmt(opp / 40, 2));
      edgeLabel(F.A, F.B, F.C, "hyp " + fmt(hyp / 40, 2));
    });
    var next = $("half-next");
    var st = $("half-status");
    if (half.step === 0) {
      if (next) next.disabled = !halfCanNext();
      if (st) {
        st.className = "status-line" + (halfCanNext() ? " ok" : "");
        st.textContent = halfCanNext()
          ? "All three have opp/hyp = 1/2. Next unlocked."
          : "Numbers on the sides: opposite and hypotenuse. Drag until opp/hyp = 1/2 on each card.";
      }
    }
  }

  function renderHalf() {
    var body = $("half-body");
    var label = $("half-step-label");
    var next = $("half-next");
    var prev = $("half-prev");
    prev.disabled = half.step === 0;
    label.textContent = "Step " + (half.step + 1) + " / 4";
    next.disabled = false;
    next.textContent = half.step === 3 ? "Done" : "Next →";

    if (half.step === 0) {
      body.innerHTML =
        '<p class="hint-sm">Same free right triangles as before. Drag any vertex. Make <strong>hypotenuse = 2 × opposite</strong> (to θ) so that every triangle shows <strong>θ = 30°</strong> exactly. Triangles need not be identical.</p>' +
        '<div class="tri-row">' +
        [0, 1, 2].map(function (i) {
          return '<div class="tri-card" id="half-card-' + i + '">' +
            '<span class="badge">Make opp/hyp = 1/2</span>' +
            '<span class="len-live">opp — · hyp —</span>' +
            '<svg viewBox="0 0 220 220" id="half-svg-' + i + '"></svg></div>';
        }).join("") +
        "</div>" +
        '<p class="status-line" id="half-status"></p>';
      [0, 1, 2].forEach(function (i) { bindHalfSvg($("half-svg-" + i), i); });
      paintHalfCards();
    } else if (half.step === 1) {
      // Same style as tan 45° conclusion — full-page text, not a footer line
      body.innerHTML =
        '<div class="conclude text-explain">' +
        '<div class="box">' +
        "<p><strong>Conclusion</strong></p>" +
        "<p>When the hypotenuse is twice the opposite side, the angle θ must be " +
        K("30^\\circ") + ".</p>" +
        "<p style=\"margin-top:12px\">So the instant link you should never forget:</p>" +
        '<p class="math-line">' + K("\\sin 30^\\circ = \\dfrac{1}{2}") + "</p>" +
        "<p style=\"margin-top:14px;text-align:center\">See " + K("30^\\circ") + " → think " +
        K("\\tfrac12") + ".</p>" +
        "</div></div>";
    } else if (half.step === 2) {
      body.innerHTML =
        '<p class="hint-sm">Same triangles — only θ moves to the <strong>other</strong> acute angle. Side lengths stay the same.</p>' +
        '<div class="tri-row">' +
        [0, 1, 2].map(function (i) {
          return '<div class="tri-card ready">' +
            '<span class="badge">adj/hyp = 1/2</span>' +
            '<svg viewBox="0 0 220 220" id="half-svg-' + i + '"></svg></div>';
        }).join("") +
        "</div>" +
        '<div class="conclude text-explain half-note">' +
        '<div class="box">' +
        "<p>That other acute angle is " + K("60^\\circ") + ". Adjacent / hypotenuse = " +
        K("\\tfrac12") + ", so:</p>" +
        '<p class="math-line">' + K("\\cos 60^\\circ = \\dfrac{1}{2}") + "</p>" +
        "</div></div>";
      half.tris.forEach(function (t, i) {
        var svg = $("half-svg-" + i);
        var opp = t.lenB;
        var adj = t.lenA;
        var hyp = halfHyp(t);
        // Same triangles as step 0 — only thetaAt flips from A → B
        drawFreeRight(svg, t, {
          thetaAt: "B",
        });
        var F = fitOf(t);
        function edgeLabel(p1, p2, other, text) {
          var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
          var dx = p2.x - p1.x, dy = p2.y - p1.y;
          var len = Math.hypot(dx, dy) || 1;
          var nx = -dy / len, ny = dx / len;
          if (nx * (other.x - mx) + ny * (other.y - my) > 0) { nx = -nx; ny = -ny; }
          var x = clamp(mx + nx * 12, 14, BOX - 14);
          var y = clamp(my + ny * 12, 12, BOX - 12);
          svg.appendChild(E("text", {
            x: x, y: y,
            fill: TRI.ink, "font-size": 10, "font-weight": 700, "text-anchor": "middle",
            "dominant-baseline": "middle",
            stroke: "#fff", "stroke-width": 2.5, "paint-order": "stroke fill",
          }, text));
        }
        edgeLabel(F.C, F.A, F.B, "adj " + fmt(adj / 40, 2));
        edgeLabel(F.C, F.B, F.A, "opp " + fmt(opp / 40, 2));
        edgeLabel(F.A, F.B, F.C, "hyp " + fmt(hyp / 40, 2));
      });
    } else {
      next.disabled = true;
      body.innerHTML =
        '<div class="conclude text-explain">' +
        '<div class="box">' +
        "<p><strong>Unlocked so far</strong></p>" +
        '<p class="math-line">' + K("\\tan 45^\\circ=1,\\quad \\sin 30^\\circ=\\tfrac12,\\quad \\cos 60^\\circ=\\tfrac12") + "</p>" +
        "<p style=\"margin-top:14px\">The other special values for " + K("30^\\circ,45^\\circ,60^\\circ") +
        " — practise them in the hand game (tab C).</p>" +
        "</div></div>";
    }
  }

  function initHalf() {
    $("half-next").addEventListener("click", function () {
      if (half.step === 0 && !halfCanNext()) return;
      if (half.step < 3) { half.step++; renderHalf(); }
    });
    $("half-prev").addEventListener("click", function () {
      if (half.step > 0) { half.step--; renderHalf(); }
    });
    renderHalf();
  }

  /* ───────── Part 1C hand game ───────── */
  var HAND_ANGLES = [0, 30, 45, 60, 90];
  // Picasso abstract: simple bars + round palm
  var FINGERS = [
    { tip: [58, 140], base: [100, 200], w: 20 },
    { tip: [118, 48], base: [128, 190], w: 16 },
    { tip: [162, 32], base: [162, 190], w: 16 },
    { tip: [206, 48], base: [196, 190], w: 16 },
    { tip: [248, 88], base: [230, 195], w: 16 },
  ];
  var HAND_BANK = [
    { fn: "sin", deg: 0 }, { fn: "sin", deg: 30 }, { fn: "sin", deg: 45 },
    { fn: "sin", deg: 60 }, { fn: "sin", deg: 90 },
    { fn: "cos", deg: 0 }, { fn: "cos", deg: 30 }, { fn: "cos", deg: 45 },
    { fn: "cos", deg: 60 }, { fn: "cos", deg: 90 },
    { fn: "tan", deg: 0 }, { fn: "tan", deg: 30 }, { fn: "tan", deg: 45 },
    { fn: "tan", deg: 60 }, { fn: "tan", deg: 90 },
  ];
  var hand = {
    folded: false,
    tanPhase: "drag", // drag → final (tan only)
    tanSlots: { num: null, den: null },
    counts: {}, // how many times each question has been completed
    current: null,
  };

  function handQKey(q) { return q.fn + ":" + q.deg; }

  function handQCount(k) { return hand.counts[k] || 0; }

  function pickHandQuestion() {
    var lastKey = hand.current ? handQKey(hand.current) : null;
    var minCount = Infinity;
    HAND_BANK.forEach(function (q) {
      var c = handQCount(handQKey(q));
      if (c < minCount) minCount = c;
    });
    function poolAt(min, avoidLast) {
      return HAND_BANK.filter(function (q) {
        var k = handQKey(q);
        if (handQCount(k) !== min) return false;
        if (avoidLast && lastKey && k === lastKey) return false;
        return true;
      });
    }
    var pool = poolAt(minCount, true);
    if (!pool.length) pool = poolAt(minCount, false);
    if (!pool.length) pool = HAND_BANK.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function advanceHandQuestion() {
    if (hand.current) {
      var k = handQKey(hand.current);
      hand.counts[k] = handQCount(k) + 1;
    }
    hand.current = pickHandQuestion();
  }

  function handCounts(d) {
    var i = HAND_ANGLES.indexOf(d);
    return { i: i, left: i, right: 4 - i };
  }
  function handAns(fn, d) {
    var c = handCounts(d);
    if (fn === "sin") {
      if (c.left === 0) return "0";
      if (c.left === 1) return "\\dfrac{1}{2}"; // √1/2 = 1/2
      if (c.left === 4) return "1";
      return "\\dfrac{\\sqrt{" + c.left + "}}{2}";
    }
    if (fn === "cos") {
      if (c.right === 0) return "0";
      if (c.right === 1) return "\\dfrac{1}{2}"; // √1/2 = 1/2
      if (c.right === 4) return "1";
      return "\\dfrac{\\sqrt{" + c.right + "}}{2}";
    }
    if (c.right === 0) return "\\text{undefined}";
    if (c.left === 0) return "0";
    if (c.left === c.right) return "1";
    if (c.left === 3) return "\\sqrt{3}";
    if (c.left === 1) return "\\dfrac{\\sqrt{3}}{3}";
    return "\\dfrac{\\sqrt{" + c.left + "}}{\\sqrt{" + c.right + "}}";
  }

  /** Simple abstract finger bar (fold = short stub). */
  function fingerPath(f, folded) {
    var tip = folded ? [(f.tip[0] + f.base[0]) / 2, f.base[1] - 26] : f.tip;
    var bx = f.base[0], by = f.base[1], w = f.w;
    var dx = tip[0] - bx, dy = tip[1] - by, len = Math.hypot(dx, dy) || 1;
    var nx = (-dy / len) * w, ny = (dx / len) * w;
    return "M " + (bx + nx) + " " + (by + ny) +
      " L " + (tip[0] + nx * 0.65) + " " + (tip[1] + ny * 0.65) +
      " L " + (tip[0] - nx * 0.65) + " " + (tip[1] - ny * 0.65) +
      " L " + (bx - nx) + " " + (by - ny) + " Z";
  }

  function drawHand(svg, hi, folded) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(E("ellipse", { cx: 160, cy: 240, rx: 72, ry: 62, fill: "#38bdf8", opacity: "0.9" }));
    svg.appendChild(E("text", { x: 28, y: 268, fill: "#fb923c", "font-size": 16, "font-weight": "700" }, "sin"));
    svg.appendChild(E("text", { x: 262, y: 268, fill: "#fb923c", "font-size": 16, "font-weight": "700" }, "cos"));
    FINGERS.forEach(function (f, i) {
      var g = E("g", { "data-fi": String(i), style: "cursor:pointer" });
      var fold = folded && i === hi;
      g.appendChild(E("path", {
        d: fingerPath(f, fold),
        fill: "#38bdf8",
        stroke: i === hi ? "#facc15" : "#0ea5e9",
        "stroke-width": i === hi ? 4.5 : 1.4,
        opacity: fold ? "0.55" : "0.95",
      }));
      var lx = fold ? (f.tip[0] + f.base[0]) / 2 : f.tip[0];
      var ly = fold ? f.base[1] - 38 : f.tip[1] - 10;
      g.appendChild(E("text", {
        x: lx, y: ly, fill: "#5eead4", "font-size": 12, "font-weight": "700", "text-anchor": "middle",
      }, HAND_ANGLES[i] + "°"));
      svg.appendChild(g);
    });
  }

  function shuffleInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function buildTanFinalChoices() {
    return shuffleInPlace([
      "0",
      "\\dfrac{\\sqrt{3}}{3}",
      "1",
      "\\sqrt{3}",
      "\\text{undefined}",
    ]);
  }

  function buildSinCosChoices(correct) {
    // 5 options total; no bare √3 (user asked to remove it)
    var pool = ["0", "1", "\\dfrac{1}{2}", "\\dfrac{\\sqrt{2}}{2}", "\\dfrac{\\sqrt{3}}{2}", "\\dfrac{\\sqrt{3}}{3}", "\\text{undefined}"];
    var opts = [correct];
    pool.forEach(function (p) { if (opts.indexOf(p) < 0 && opts.length < 5) opts.push(p); });
    return shuffleInPlace(opts);
  }

  function bindHandChoices(grid, opts, correct, q) {
    opts.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.innerHTML = K(opt);
      btn.addEventListener("click", function () {
        grid.querySelectorAll(".btn").forEach(function (b) {
          b.classList.remove("active", "is-correct", "is-wrong");
        });
        var fb = $("hand-fb");
        fb.style.color = "";
        if (opt === correct) {
          btn.classList.add("is-correct");
          fb.className = "status-line ok";
          fb.innerHTML = "Correct! " + K("\\" + q.fn + "(" + q.deg + "^\\circ)=" + correct);
        } else {
          btn.classList.add("is-wrong");
          fb.className = "status-line";
          fb.style.color = "var(--bad)";
          fb.textContent = "Try again — recount fingers.";
        }
      });
      grid.appendChild(btn);
    });
  }

  function buildTanDragTiles(wantNum, wantDen) {
    // Unique value tiles — each can be reused in both slots (e.g. √2/2 for tan 45°)
    var pool = ["0", "1", "\\dfrac{1}{2}", "\\dfrac{\\sqrt{2}}{2}", "\\dfrac{\\sqrt{3}}{2}"];
    var texes = [];
    [wantNum, wantDen].forEach(function (t) {
      if (texes.indexOf(t) < 0) texes.push(t);
    });
    pool.forEach(function (p) {
      if (texes.indexOf(p) < 0 && texes.length < 5) texes.push(p);
    });
    return shuffleInPlace(texes);
  }

  function bindTanDrag(c, q) {
    var wantNum = handAns("sin", q.deg);
    var wantDen = handAns("cos", q.deg);
    var tiles = buildTanDragTiles(wantNum, wantDen);

    function paintSlots() {
      ["num", "den"].forEach(function (slot) {
        var el = $("tan-slot-" + slot);
        if (!el) return;
        var tex = hand.tanSlots[slot];
        el.classList.toggle("filled", !!tex);
        el.innerHTML = tex ? K(tex) : "?";
      });
      var both = hand.tanSlots.num && hand.tanSlots.den;
      var ok = both &&
        hand.tanSlots.num === wantNum &&
        hand.tanSlots.den === wantDen;
      var fb = $("hand-fb");
      var nextBtn = $("tan-drag-next");
      if (both && ok) {
        fb.className = "status-line ok";
        fb.style.color = "";
        fb.textContent = "Correct! Press Next when you are ready to simplify.";
        if (nextBtn) nextBtn.style.display = "inline-flex";
      } else {
        if (nextBtn) nextBtn.style.display = "none";
        if (both && !ok) {
          fb.className = "status-line";
          fb.style.color = "var(--bad)";
          fb.textContent = "Not quite — put sin in the top and cos in the bottom.";
          hand.tanSlots = { num: null, den: null };
          setTimeout(paintSlots, 500);
        }
      }
    }

    function placeTex(tex) {
      if (!hand.tanSlots.num) hand.tanSlots.num = tex;
      else if (!hand.tanSlots.den) hand.tanSlots.den = tex;
      else return;
      paintSlots();
    }

    var bank = $("tan-tile-bank");
    tiles.forEach(function (tex) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tan-tile";
      tile.draggable = true;
      tile.innerHTML = K(tex);
      tile.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", tex);
        e.dataTransfer.effectAllowed = "copy";
      });
      tile.addEventListener("click", function () { placeTex(tex); });
      bank.appendChild(tile);
    });

    ["num", "den"].forEach(function (slot) {
      var el = $("tan-slot-" + slot);
      el.addEventListener("dragover", function (e) { e.preventDefault(); el.classList.add("over"); });
      el.addEventListener("dragleave", function () { el.classList.remove("over"); });
      el.addEventListener("drop", function (e) {
        e.preventDefault();
        el.classList.remove("over");
        var tex = e.dataTransfer.getData("text/plain");
        if (!tex) return;
        hand.tanSlots[slot] = tex;
        paintSlots();
      });
      el.addEventListener("click", function () {
        hand.tanSlots[slot] = null;
        paintSlots();
      });
    });
    var nextBtn = $("tan-drag-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        hand.tanPhase = "final";
        renderHand();
      });
    }
    paintSlots();
  }

  function renderHand() {
    var body = $("hand-body");
    if (!hand.current) hand.current = pickHandQuestion();
    var q = hand.current;
    var c = handCounts(q.deg);
    var correct = handAns(q.fn, q.deg);
    var isTan = q.fn === "tan";
    var qKey = handQKey(q);

    if (!hand._opts || hand._optsFor !== qKey) {
      hand._opts = buildSinCosChoices(correct);
      hand._optsFor = qKey;
    }

    var qTex = "\\" + q.fn + "(" + q.deg + "^\\circ)=?";
    var sinVal = handAns("sin", q.deg);
    var cosVal = handAns("cos", q.deg);
    var sideExtra = "";
    if (!hand.folded) {
      sideExtra = '<p class="status-line" style="margin:0;color:var(--warn)">Fold the highlighted finger to unlock answers.</p>';
    } else if (isTan && hand.tanPhase === "drag") {
      sideExtra =
        '<div class="tan-drag">' +
        '<p class="tan-eq">' +
        K("\\tan(" + q.deg + "^\\circ)=\\dfrac{\\sin(" + q.deg + "^\\circ)}{\\cos(" + q.deg + "^\\circ)}=") +
        '<span class="tan-frac">' +
        '<span class="tan-slot" id="tan-slot-num" data-slot="num">?</span>' +
        '<span class="tan-bar"></span>' +
        '<span class="tan-slot" id="tan-slot-den" data-slot="den">?</span>' +
        "</span></p>" +
        '<p class="hint-sm" style="margin:4px 0 0;font-size:13px">Drag (or tap) the correct values into the blanks.</p>' +
        '<div class="tan-tile-bank" id="tan-tile-bank"></div>' +
        '<div class="tan-drag-foot">' +
        '<p class="status-line" id="hand-fb" style="margin:0;min-height:1.2em"></p>' +
        '<button class="btn primary" type="button" id="tan-drag-next" style="display:none">Next →</button>' +
        "</div></div>";
    } else if (isTan && hand.tanPhase === "final") {
      sideExtra =
        (c.right > 0
          ? '<p class="tan-eq">' + K("\\tan(" + q.deg + "^\\circ)=\\dfrac{" + sinVal + "}{" + cosVal + "}=") + " ?</p>"
          : '<p class="tan-eq">' + K("\\tan(" + q.deg + "^\\circ)=\\dfrac{" + sinVal + "}{0}=") + " ?</p>") +
        '<div class="choice-grid" id="hand-choices"></div>' +
        '<p class="status-line" id="hand-fb" style="margin:0;min-height:1.2em"></p>';
    } else {
      sideExtra =
        '<div class="choice-grid" id="hand-choices"></div>' +
        '<p class="status-line" id="hand-fb" style="margin:0;min-height:1.2em"></p>';
    }

    body.innerHTML =
      '<div class="hand-q">' + K(qTex) + "</div>" +
      '<div class="hand-layout">' +
      '<div class="hand-stage"><svg id="hand-svg" viewBox="0 0 320 300"></svg></div>' +
      '<div class="hand-side">' +
      '<div class="sqrt-card" aria-label="Square-root finger table">' +
      '<div class="sqrt-frac">' +
      '<div class="sqrt-num">' +
      '<svg class="sqrt-hook" viewBox="0 0 48 160" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M6 88 L20 148 L42 18" fill="none" stroke="#0f172a" stroke-width="7" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>" +
      '<div class="sqrt-body">' +
      '<table class="sqrt-table">' +
      "<thead><tr><th></th><th>0°</th><th>30°</th><th>45°</th><th>60°</th><th>90°</th></tr></thead>" +
      "<tbody>" +
      "<tr><td>sin</td><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td></tr>" +
      "<tr><td>cos</td><td>4</td><td>3</td><td>2</td><td>1</td><td>0</td></tr>" +
      "</tbody></table>" +
      "</div></div>" +
      '<div class="sqrt-rule"></div>' +
      '<div class="sqrt-den">2</div>' +
      "</div></div>" +
      '<p class="hint-sm" style="margin:0">Tap the <strong>yellow</strong> finger to fold. ' +
      K("\\sin=\\dfrac{\\sqrt{L}}{2}") + ", " +
      K("\\cos=\\dfrac{\\sqrt{R}}{2}") + ", " +
      K("\\tan=\\dfrac{\\sqrt{L}}{\\sqrt{R}}") +
      ".</p>" +
      sideExtra +
      "</div></div>";

    var svg = $("hand-svg");
    drawHand(svg, c.i, hand.folded);
    svg.querySelectorAll("[data-fi]").forEach(function (g) {
      g.addEventListener("click", function () {
        if (+g.getAttribute("data-fi") !== c.i) return;
        hand.folded = true;
        hand.tanPhase = q.fn === "tan" ? "drag" : hand.tanPhase;
        hand.tanSlots = { num: null, den: null };
        renderHand();
      });
    });

    if (!hand.folded) return;

    if (isTan && hand.tanPhase === "drag") {
      bindTanDrag(c, q);
      return;
    }

    var grid = $("hand-choices");
    if (!grid) return;
    var finalOpts;
    if (isTan) {
      finalOpts = buildTanFinalChoices();
    } else {
      finalOpts = hand._opts;
    }
    bindHandChoices(grid, finalOpts, correct, q);
  }

  function initHand() {
    hand.counts = {};
    hand.current = pickHandQuestion();
    $("hand-next-q").addEventListener("click", function () {
      advanceHandQuestion();
      hand.folded = false;
      hand._opts = null;
      hand.tanPhase = "drag";
      hand.tanSlots = { num: null, den: null };
      renderHand();
    });
    renderHand();
  }

  /* =========================================================================
   * Part 2 — identity (compact)
   * ========================================================================= */
  var idn = { step: 0, x: 45 };

  function drawAxes(svg, W, H, pad, yMin, yMax, xMin, xMax, mode) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    xMin = xMin == null ? 0 : xMin;
    xMax = xMax == null ? 360 : xMax;
    // mode "chart": room for readable labels; plot fills most of the box
    var padL, padR, padT, padB, labelFs, labelDy, labelFill;
    if (mode === "chart" || mode === "sides") {
      padL = Math.max(pad, 56);
      padR = 28;
      padT = 26;
      padB = 54;
      labelFs = 16;
      labelDy = 22;
      labelFill = "#1e2a32";
    } else {
      padL = pad;
      padR = Math.min(14, pad);
      padT = Math.min(18, pad);
      padB = pad;
      labelFs = 9;
      labelDy = 16;
      labelFill = "#5a6b74";
    }
    var x0 = padL, y0 = H - padB, x1 = W - padR, y1 = padT;
    var span = xMax - xMin || 1;
    var xS = function (d) { return x0 + ((d - xMin) / span) * (x1 - x0); };
    var yS = function (v) { return y0 - ((v - yMin) / (yMax - yMin)) * (y0 - y1); };
    svg.appendChild(E("rect", { width: W, height: H, fill: "none" }));

    var ticks = [];
    for (var t = Math.ceil(xMin / 90) * 90; t <= xMax; t += 90) ticks.push(t);
    if (ticks.indexOf(0) < 0 && xMin < 0 && xMax > 0) ticks.push(0);
    ticks.sort(function (a, b) { return a - b; });
    ticks.forEach(function (d) {
      var x = xS(d);
      svg.appendChild(E("line", {
        x1: x, y1: y1, x2: x, y2: y0,
        stroke: d === 0 ? "#8a9aa3" : "rgba(30,42,50,0.12)",
        "stroke-width": d === 0 ? 1.3 : 1,
        "stroke-dasharray": d === 0 ? "none" : "3 3",
      }));
      svg.appendChild(E("text", {
        x: x, y: y0 + labelDy, fill: labelFill, "font-size": labelFs, "font-weight": "600",
        "text-anchor": "middle",
      }, d + "°"));
    });

    var yTicks = [];
    var yStep = yMax - yMin > 3 ? 1 : (yMax - yMin > 1.5 ? 0.5 : 1);
    for (var yv = Math.ceil(yMin / yStep) * yStep; yv <= yMax + 1e-9; yv += yStep) {
      yTicks.push(Math.round(yv * 1000) / 1000);
    }
    yTicks.forEach(function (v) {
      if (v < yMin - 0.01 || v > yMax + 0.01) return;
      var y = yS(v);
      svg.appendChild(E("line", {
        x1: x0, y1: y, x2: x1, y2: y,
        stroke: v === 0 ? "#8a9aa3" : "rgba(30,42,50,0.12)",
        "stroke-width": v === 0 ? 1.3 : 1,
      }));
      svg.appendChild(E("text", {
        x: x0 - 8, y: y + 5, fill: labelFill, "font-size": labelFs, "font-weight": "600",
        "text-anchor": "end",
      }, String(v)));
    });
    return { xS: xS, yS: yS, x0: x0, y0: y0, x1: x1, y1: y1, xMin: xMin, xMax: xMax };
  }

  function curvePath(fn, S, step) {
    step = step || 3;
    var d = "";
    var first = true;
    for (var x = S.xMin; x <= S.xMax + 0.01; x += step) {
      var y = fn(x);
      if (!isFinite(y)) { first = true; continue; }
      d += (first ? "M" : "L") + S.xS(x) + " " + S.yS(y) + " ";
      first = false;
    }
    return d;
  }

  function paintMini(id, kind, squared) {
    var svg = $(id);
    if (!svg) return;
    svg.setAttribute("preserveAspectRatio", "none");
    var W = 480, H = 220;
    /* Same axes as Step 1 (−1 … 1) so squaring is a transform of the same picture */
    var S = drawAxes(svg, W, H, 28, -1.15, 1.15, -180, 180);
    var baseFn = kind === "sin"
      ? function (d) { return Math.sin(rad(d)); }
      : function (d) { return Math.cos(rad(d)); };
    var stroke = kind === "sin" ? CHART.a : CHART.b;
    if (squared) {
      /* Ghost of Step 1 curve — same graph, before squaring */
      svg.appendChild(E("path", {
        d: curvePath(baseFn, S), fill: "none",
        stroke: stroke, "stroke-width": 1.6, "stroke-dasharray": "4 4", opacity: "0.35",
      }));
      svg.appendChild(E("path", {
        d: curvePath(function (d) { var v = baseFn(d); return v * v; }, S),
        fill: "none", stroke: stroke, "stroke-width": 2.4,
      }));
    } else {
      svg.appendChild(E("path", {
        d: curvePath(baseFn, S), fill: "none",
        stroke: stroke, "stroke-width": 2.2,
      }));
    }
  }

  var idDragging = false;

  function setIdX(degV) {
    idn.x = Math.round(clamp(degV, -180, 180));
    var slider = $("id-x");
    if (slider) slider.value = String(idn.x);
    var val = $("id-x-val");
    if (val) val.textContent = idn.x + "°";
    paintIdBig();
  }

  function bindIdDrag(svg) {
    if (svg.dataset.dragBound) return;
    svg.dataset.dragBound = "1";
    function fromPtr(e) {
      var S = svg._idS;
      if (!S) return;
      var p = svgPoint(svg, e);
      var t = (p.x - S.x0) / Math.max(S.x1 - S.x0, 1);
      setIdX(S.xMin + t * (S.xMax - S.xMin));
    }
    svg.addEventListener("pointerdown", function (e) {
      if (!e.target.getAttribute || e.target.getAttribute("data-id-drag") == null) {
        // allow drag starting on the plot area near the stack
        var S = svg._idS;
        if (!S) return;
        var p = svgPoint(svg, e);
        var xs = S.xS(idn.x);
        if (Math.abs(p.x - xs) > 28) return;
      }
      idDragging = true;
      svg.setPointerCapture(e.pointerId);
      fromPtr(e);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!idDragging) return;
      fromPtr(e);
    });
    svg.addEventListener("pointerup", function () { idDragging = false; });
    svg.addEventListener("pointercancel", function () { idDragging = false; });
  }

  function paintIdBig() {
    var svg = $("id-big");
    if (!svg) return;
    svg.setAttribute("preserveAspectRatio", "none");
    var W = 900, H = 300;
    // pad leaves a black border inside the chart; range −180° … 180°
    var S = drawAxes(svg, W, H, 40, -0.08, 1.25, -180, 180);
    svg._idS = S;
    var s2 = function (d) { var v = Math.sin(rad(d)); return v * v; };
    var c2 = function (d) { var v = Math.cos(rad(d)); return v * v; };
    svg.appendChild(E("path", { d: curvePath(s2, S), fill: "none", stroke: CHART.a, "stroke-width": 2.4 }));
    svg.appendChild(E("path", { d: curvePath(c2, S), fill: "none", stroke: CHART.b, "stroke-width": 2.4 }));
    svg.appendChild(E("line", {
      x1: S.x0, y1: S.yS(1), x2: S.x1, y2: S.yS(1),
      stroke: CHART.guide, "stroke-width": 1.6, "stroke-dasharray": "5 4",
    }));
    var x = idn.x, a = s2(x), b = c2(x), sum = a + b;
    var xs = S.xS(x);
    // Start at y=0 (not plot bottom yMin) + butt caps so the stack doesn't poke below the axis
    var yBase = S.yS(0), yA = S.yS(a), yTop = S.yS(sum);
    svg.appendChild(E("line", {
      x1: xs, y1: yBase, x2: xs, y2: yA,
      stroke: CHART.a, "stroke-width": 10, "stroke-linecap": "butt", opacity: "0.9",
      "data-id-drag": "1", style: "cursor:ew-resize",
    }));
    svg.appendChild(E("line", {
      x1: xs, y1: yA, x2: xs, y2: yTop,
      stroke: CHART.b, "stroke-width": 10, "stroke-linecap": "butt", opacity: "0.9",
      "data-id-drag": "1", style: "cursor:ew-resize",
    }));
    // large invisible hit target + handle at sum=1
    svg.appendChild(E("circle", {
      cx: xs, cy: S.yS(sum), r: 22, fill: "transparent",
      "data-id-drag": "1", style: "cursor:ew-resize",
    }));
    svg.appendChild(E("circle", {
      cx: xs, cy: S.yS(sum), r: 9, fill: CHART.point, stroke: "#fff", "stroke-width": 2.5,
      "data-id-drag": "1", style: "cursor:ew-resize",
    }));
    var ro = $("id-readout");
    if (ro) {
      ro.innerHTML = "At " + K("x=" + x + "^\\circ") + ": " +
        K("\\sin^2 x+\\cos^2 x=" + exactTex(sum)) +
        " · drag the handle";
    }
    bindIdDrag(svg);
  }

  function setIdFoot(step, last) {
    var prev = $("id-prev");
    var next = $("id-next");
    var label = $("id-step-label");
    if (!prev || !next || !label) return;
    prev.disabled = step === 0;
    next.disabled = step === last;
    label.textContent = "Step " + (step + 1) + " / " + (last + 1);
    next.textContent = step === last ? "Done" : "Next →";
  }

  function renderId() {
    var body = $("id-body");
    setIdFoot(idn.step, 3);

    if (idn.step === 0) {
      body.innerHTML =
        '<p class="hint-sm">Same axes for both: ' + K("x\\in[-180^\\circ,180^\\circ]") +
        ", " + K("y\\in[-1,1]") + ". Remember where each curve goes <strong>below</strong> the x-axis.</p>" +
        '<div class="curve-pair">' +
        '<div class="curve-box"><div class="ttl">sin x</div><svg id="id-sin" viewBox="0 0 480 220" preserveAspectRatio="none"></svg></div>' +
        '<div class="curve-box"><div class="ttl">cos x</div><svg id="id-cos" viewBox="0 0 480 220" preserveAspectRatio="none"></svg></div>' +
        "</div>";
      paintMini("id-sin", "sin", false);
      paintMini("id-cos", "cos", false);
    } else if (idn.step === 1) {
      body.innerHTML =
        '<p class="hint-sm"><strong>Same axes as Step 1.</strong> Square each value: ' +
        K("(\\sin x)^2") + " and " + K("(\\cos x)^2") +
        ". Negative parts flip up (dashed = Step 1; solid = squared). Both now sit in " +
        K("[0,1]") + ".</p>" +
        '<div class="curve-pair">' +
        '<div class="curve-box"><div class="ttl">sin² x ← from sin x</div><svg id="id-sin" viewBox="0 0 480 220" preserveAspectRatio="none"></svg></div>' +
        '<div class="curve-box"><div class="ttl">cos² x ← from cos x</div><svg id="id-cos" viewBox="0 0 480 220" preserveAspectRatio="none"></svg></div>' +
        "</div>";
      paintMini("id-sin", "sin", true);
      paintMini("id-cos", "cos", true);
    } else if (idn.step === 2) {
      body.innerHTML =
        '<p class="hint-sm" style="margin-bottom:6px">Drag the handle (or use the slider). Stack always meets ' +
        K("y=1") + ".</p>" +
        '<div class="slider-row" style="margin:0 0 6px">' +
        '<label for="id-x">x</label>' +
        '<input id="id-x" type="range" min="-180" max="180" value="' + idn.x + '">' +
        '<span id="id-x-val">' + idn.x + "°</span></div>" +
        '<svg class="lab-svg-fill" id="id-big" viewBox="0 0 900 300" preserveAspectRatio="none"></svg>' +
        '<p class="point-legend" style="margin-top:4px">' +
        '<span><span class="dot" style="background:' + CHART.a + '"></span>sin²</span>' +
        '<span><span class="dot" style="background:' + CHART.b + '"></span>cos²</span>' +
        '<span><span class="dot" style="background:' + CHART.point + '"></span>handle</span>' +
        '<span class="status-line" id="id-readout" style="margin:0 0 0 8px"></span></p>';
      $("id-x").addEventListener("input", function (e) { setIdX(+e.target.value); });
      paintIdBig();
    } else {
      body.innerHTML =
        '<div class="conclude"><div class="box" style="text-align:center">' +
        '<div class="math-line">' + K("\\sin^2 x + \\cos^2 x = 1") + "</div>" +
        "<p style=\"margin:8px 0 0\">For every x, the stacked heights meet y = 1.</p>" +
        "</div></div>";
    }
  }

  /* =========================================================================
   * Part 2A — right triangle with hypotenuse 1.
   * opposite = sin θ, adjacent = cos θ, then Pythagoras:
   * opposite² + adjacent² = hypotenuse² ⇒ sin²θ + cos²θ = 1.
   * ========================================================================= */
  var idMethod = "graph";
  var lad = { step: 0, deg: 35, drag: false, mode: null };
  var LAD_LAST = 2;
  var LAD_MIN = 18, LAD_MAX = 72;
  var LAD_W = 560, LAD_H = 480, LAD_L = 150;
  var LAD_SIN = "#34d399";
  var LAD_COS = "#60a5fa";

  function ladderMetrics() {
    var th = clamp(lad.deg, LAD_MIN, LAD_MAX);
    var s = Math.sin(rad(th));
    var c = Math.cos(rad(th));
    return { deg: th, sin: s, cos: c, sin2: s * s, cos2: c * c };
  }

  function svgPointMeet(svg, e) {
    var r = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var s = Math.min(r.width / vb.width, r.height / vb.height);
    var ox = (r.width - vb.width * s) / 2;
    var oy = (r.height - vb.height * s) / 2;
    return {
      x: (e.clientX - r.left - ox) / s,
      y: (e.clientY - r.top - oy) / s,
    };
  }

  function distToSeg(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var l2 = dx * dx + dy * dy || 1;
    var t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1);
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }

  function ladText(svg, x, y, str, fill, size, halo) {
    var attrs = {
      x: x, y: y, fill: fill,
      "font-size": size || 15,
      "font-weight": 800,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-family": "Hanken Grotesk, system-ui, sans-serif",
    };
    if (halo) {
      attrs.stroke = "#0f172a";
      attrs["stroke-width"] = 3.5;
      attrs["paint-order"] = "stroke fill";
    }
    svg.appendChild(E("text", attrs, str));
  }

  function ladEq(cls, tex) {
    return '<p class="lad-eq ' + cls + '">' + K(tex) + "</p>";
  }

  function setLadDeg(degV) {
    lad.deg = Math.round(clamp(degV, LAD_MIN, LAD_MAX));
    syncLadControls();
    paintLadder();
  }

  function syncLadControls() {
    var slider = $("lad-deg");
    if (slider && document.activeElement !== slider) slider.value = String(lad.deg);
    else if (slider && +slider.value !== lad.deg) slider.value = String(lad.deg);
    var val = $("lad-deg-val");
    if (val) val.textContent = lad.deg + "°";
    document.querySelectorAll("[data-lad-preset]").forEach(function (b) {
      b.classList.toggle("active", +b.getAttribute("data-lad-preset") === lad.deg);
    });
  }

  function ladderGeom(m) {
    var C = { x: 214, y: 196 };
    return {
      C: C,
      T: { x: C.x, y: C.y - LAD_L * m.sin },
      F: { x: C.x + LAD_L * m.cos, y: C.y },
    };
  }

  function drawDim(svg, x1, y1, x2, y2, color) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy) || 1;
    var px = -dy / len * 6, py = dx / len * 6;
    svg.appendChild(E("line", {
      x1: x1, y1: y1, x2: x2, y2: y2,
      stroke: color, "stroke-width": 2.4, "stroke-linecap": "round",
    }));
    [[x1, y1], [x2, y2]].forEach(function (pt) {
      svg.appendChild(E("line", {
        x1: pt[0] - px, y1: pt[1] - py, x2: pt[0] + px, y2: pt[1] + py,
        stroke: color, "stroke-width": 2.4, "stroke-linecap": "round",
      }));
    });
  }

  function paintLadder() {
    var svg = $("lad-svg");
    var side = $("lad-side");
    if (!svg) return;
    var m = ladderMetrics();
    var G = ladderGeom(m);
    var C = G.C, T = G.T, F = G.F;
    svg.setAttribute("viewBox", "50 6 390 286");
    svg._ladC = C;
    svg._ladL = LAD_L;
    svg._ladT = T;
    svg._ladF = F;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(E("rect", { x: 0, y: 0, width: LAD_W, height: LAD_H, fill: "#0f172a" }));

    svg.appendChild(E("polygon", {
      points: [C, T, F].map(function (p) { return p.x + "," + p.y; }).join(" "),
      fill: "rgba(226,232,240,.08)", stroke: "none",
    }));
    svg.appendChild(E("line", {
      x1: C.x, y1: C.y, x2: C.x, y2: T.y,
      stroke: LAD_SIN, "stroke-width": 5, "stroke-linecap": "round",
    }));
    svg.appendChild(E("line", {
      x1: C.x, y1: C.y, x2: F.x, y2: F.y,
      stroke: LAD_COS, "stroke-width": 5, "stroke-linecap": "round",
    }));
    svg.appendChild(E("line", {
      x1: F.x, y1: F.y, x2: T.x, y2: T.y,
      stroke: "#e2e8f0", "stroke-width": 5, "stroke-linecap": "round",
    }));

    var rs = 14;
    svg.appendChild(E("path", {
      d: "M " + (C.x + rs) + " " + C.y +
        " L " + (C.x + rs) + " " + (C.y - rs) +
        " L " + C.x + " " + (C.y - rs),
      fill: "none", stroke: "#cbd5e1", "stroke-width": 1.8,
    }));

    var aFloor = Math.atan2(C.y - F.y, C.x - F.x);
    var aLad = Math.atan2(T.y - F.y, T.x - F.x);
    var sweep = aLad - aFloor;
    while (sweep <= -Math.PI) sweep += 2 * Math.PI;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    var arcR = 26;
    var ax0 = F.x + arcR * Math.cos(aFloor);
    var ay0 = F.y + arcR * Math.sin(aFloor);
    var ax1 = F.x + arcR * Math.cos(aFloor + sweep);
    var ay1 = F.y + arcR * Math.sin(aFloor + sweep);
    svg.appendChild(E("path", {
      d: "M " + ax0 + " " + ay0 + " A " + arcR + " " + arcR + " 0 0 " +
        (sweep > 0 ? 1 : 0) + " " + ax1 + " " + ay1,
      fill: "none", stroke: "#fbbf24", "stroke-width": 2.4,
    }));
    var labelR = arcR + 13;
    var midAng = aFloor + sweep / 2;
    ladText(
      svg,
      F.x + labelR * Math.cos(midAng),
      F.y + labelR * Math.sin(midAng),
      "θ", "#fbbf24", 16, true
    );

    var midX = (F.x + T.x) / 2, midY = (F.y + T.y) / 2;
    var ox = midX - C.x, oy = midY - C.y;
    var ol = Math.hypot(ox, oy) || 1;
    ladText(svg, midX + (ox / ol) * 28, midY + (oy / ol) * 28, "1", "#f8fafc", 18, true);

    drawDim(svg, C.x - 28, T.y, C.x - 28, C.y, LAD_SIN);
    drawDim(svg, C.x, C.y + 28, F.x, C.y + 28, LAD_COS);
    var hy = (T.y + C.y) / 2;
    var bx = (C.x + F.x) / 2;
    ladText(svg, C.x - 78, hy, "sin θ", "#6ee7b7", 15, true);
    ladText(svg, bx, C.y + 52, "cos θ", "#93c5fd", 15, true);
    if (lad.step >= 1) {
      ladText(svg, C.x - 78, hy + 20, ladPlain(m.sin), "#6ee7b7", 14, true);
      ladText(svg, bx, C.y + 72, ladPlain(m.cos), "#93c5fd", 14, true);
    }

    svg.appendChild(E("line", {
      x1: F.x, y1: F.y, x2: T.x, y2: T.y,
      stroke: "transparent", "stroke-width": 28,
      "data-lad-drag": "bar",
    }));
    [["top", T], ["foot", F]].forEach(function (h) {
      svg.appendChild(E("circle", {
        cx: h[1].x, cy: h[1].y, r: 11,
        fill: "#fbbf24", stroke: "#fff", "stroke-width": 2.5,
        "data-lad-drag": h[0],
      }));
      svg.appendChild(E("circle", {
        cx: h[1].x, cy: h[1].y, r: 22,
        fill: "transparent",
        "data-lad-drag": h[0],
      }));
    });

    if (!side) return;
    var deg = m.deg;
    var opp = exactTex(m.sin);
    var adj = exactTex(m.cos);
    var opp2 = exactTex(m.sin2);
    var adj2 = exactTex(m.cos2);
    if (lad.step === 0) {
      side.innerHTML =
        '<div class="box">' +
        '<p class="lad-title">Why opposite = sin θ and adjacent = cos θ</p>' +
        ladEq("", "\\text{hypotenuse}=1") +
        ladEq("sin", "\\sin\\theta=\\dfrac{\\text{opposite}}{\\text{hypotenuse}}=\\dfrac{\\text{opposite}}{1}") +
        ladEq("sin", "\\text{opposite}=\\sin\\theta") +
        ladEq("cos", "\\cos\\theta=\\dfrac{\\text{adjacent}}{\\text{hypotenuse}}=\\dfrac{\\text{adjacent}}{1}") +
        ladEq("cos", "\\text{adjacent}=\\cos\\theta") +
        '<p class="lad-note">Sine is opposite over hypotenuse. Cosine is adjacent over hypotenuse. The hypotenuse is 1, so each ratio is the side itself. The green side is labeled sin θ. The blue side is labeled cos θ.</p>' +
        "</div>";
    } else if (lad.step === 1) {
      side.innerHTML =
        '<div class="box">' +
        '<p class="lad-title">The two sides, from θ</p>' +
        ladEq("", "\\theta=" + deg + "^\\circ") +
        ladEq("", "\\text{hypotenuse}=1") +
        ladEq("sin", "\\text{opposite}=1\\times\\sin " + deg + "^\\circ=" + opp) +
        ladEq("cos", "\\text{adjacent}=1\\times\\cos " + deg + "^\\circ=" + adj) +
        '<p class="lad-note">The angle is known and the hypotenuse is 1, so multiply by sin θ to get the opposite side, and by cos θ to get the adjacent side.</p>' +
        "</div>";
    } else {
      side.innerHTML =
        '<div class="box final">' +
        '<p class="lad-title">Pythagoras theorem</p>' +
        '<p class="lad-note">The square mark is 90°, so the squares of the two legs add up to the square of the hypotenuse.</p>' +
        ladEq("sum", "\\text{opposite}^2+\\text{adjacent}^2=\\text{hypotenuse}^2") +
        ladEq("", "(1\\times\\sin\\theta)^2+(1\\times\\cos\\theta)^2=1^2") +
        ladEq("sum", "\\sin^2\\theta+\\cos^2\\theta=1") +
        ladEq("sin", "\\sin^2 " + deg + "^\\circ=" + opp2) +
        ladEq("cos", "\\cos^2 " + deg + "^\\circ=" + adj2) +
        ladEq("sum", opp2 + "+" + adj2 + "=1") +
        "</div>";
    }
  }

  function ladPlain(v) {
    var t = exactTex(v);
    if (t === "\\dfrac{\\sqrt{3}}{2}") return "√3/2";
    if (t === "\\dfrac{1}{2}") return "1/2";
    if (t === "\\dfrac{\\sqrt{2}}{2}") return "√2/2";
    if (t === "\\dfrac{3}{4}") return "3/4";
    if (t === "\\dfrac{1}{4}") return "1/4";
    if (t === "1" || t === "0") return t;
    return fmt(v, 3);
  }

  function bindLadderDrag(svg) {
    if (!svg || svg.dataset.dragBound) return;
    svg.dataset.dragBound = "1";
    function fromPtr(e) {
      var C = svg._ladC;
      var L = svg._ladL;
      if (!C || !L) return;
      var p = svgPointMeet(svg, e);
      if (lad.mode === "top") {
        var s = clamp((C.y - p.y) / L, Math.sin(rad(LAD_MIN)), Math.sin(rad(LAD_MAX)));
        setLadDeg(deg(Math.asin(s)));
      } else if (lad.mode === "foot") {
        var c = clamp((p.x - C.x) / L, Math.cos(rad(LAD_MAX)), Math.cos(rad(LAD_MIN)));
        setLadDeg(deg(Math.acos(c)));
      } else {
        var best = lad.deg, bestD = 1e9;
        for (var d = LAD_MIN; d <= LAD_MAX; d++) {
          var ss = Math.sin(rad(d)), cc = Math.cos(rad(d));
          var TT = { x: C.x, y: C.y - L * ss };
          var FF = { x: C.x + L * cc, y: C.y };
          var dist = distToSeg(p, TT, FF);
          if (dist < bestD) { bestD = dist; best = d; }
        }
        setLadDeg(best);
      }
    }
    svg.addEventListener("pointerdown", function (e) {
      var mode = e.target.getAttribute && e.target.getAttribute("data-lad-drag");
      if (!mode) return;
      lad.drag = true;
      lad.mode = mode;
      svg.setPointerCapture(e.pointerId);
      fromPtr(e);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!lad.drag) return;
      fromPtr(e);
    });
    function endDrag() { lad.drag = false; lad.mode = null; }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);
  }

  function renderLadder() {
    var body = $("id-body");
    if (!body) return;
    if (lad.step > LAD_LAST) lad.step = LAD_LAST;
    setIdFoot(lad.step, LAD_LAST);
    var hints = [
      "sin θ = opposite ÷ hypotenuse, and cos θ = adjacent ÷ hypotenuse. The hypotenuse is 1, so opposite = sin θ and adjacent = cos θ. Those labels are on the triangle.",
      "θ is known and the hypotenuse is 1. opposite = 1 × sin θ. adjacent = 1 × cos θ.",
      "Pythagoras theorem: opposite² + adjacent² = hypotenuse². So (1 × sin θ)² + (1 × cos θ)² = 1², which is sin²θ + cos²θ = 1.",
    ];
    var presets = [30, 45, 60].map(function (d) {
      return '<button type="button" class="btn' + (lad.deg === d ? " active" : "") +
        '" data-lad-preset="' + d + '">' + d + "°</button>";
    }).join("");
    body.innerHTML =
      '<p class="hint-sm">' + hints[lad.step] + "</p>" +
      '<div class="slider-row">' +
      '<label for="lad-deg">θ</label>' +
      '<input id="lad-deg" type="range" min="' + LAD_MIN + '" max="' + LAD_MAX + '" value="' + lad.deg + '">' +
      '<span id="lad-deg-val">' + lad.deg + "°</span>" +
      presets +
      "</div>" +
      '<div class="ladder-layout">' +
      '<div class="ladder-fig"><svg id="lad-svg" viewBox="0 0 ' + LAD_W + " " + LAD_H +
      '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Right triangle with hypotenuse 1"></svg></div>' +
      '<div class="ladder-side" id="lad-side"></div>' +
      "</div>";
    $("lad-deg").addEventListener("input", function (e) { setLadDeg(+e.target.value); });
    body.querySelectorAll("[data-lad-preset]").forEach(function (b) {
      b.addEventListener("click", function () { setLadDeg(+b.getAttribute("data-lad-preset")); });
    });
    paintLadder();
    bindLadderDrag($("lad-svg"));
  }

  function renderIdentitySection() {
    var stage = $("stage-identity");
    if (stage) stage.classList.toggle("stage-ladder", idMethod === "ladder");
    if (idMethod === "ladder") renderLadder();
    else renderId();
  }

  function initId() {
    var nav = $("id-method-nav");
    if (nav) {
      nav.querySelectorAll("[data-idm]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          idMethod = btn.getAttribute("data-idm");
          nav.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
          btn.classList.add("active");
          renderIdentitySection();
        });
      });
    }
    $("id-next").addEventListener("click", function () {
      if (idMethod === "ladder") {
        if (lad.step < LAD_LAST) { lad.step++; renderLadder(); }
      } else if (idn.step < 3) {
        idn.step++;
        renderId();
      }
    });
    $("id-prev").addEventListener("click", function () {
      if (idMethod === "ladder") {
        if (lad.step > 0) { lad.step--; renderLadder(); }
      } else if (idn.step > 0) {
        idn.step--;
        renderId();
      }
    });
    renderIdentitySection();
  }

  /* ───────── Part 2B: tan x = sin x / cos x (right triangle) ───────── */
  var idTan = { step: 0 };
  /* Smaller model + larger fit pad so side labels stay inside the card (no clipped “x” fragments). */
  var IDTAN_TRI = { cx: 110, cy: 115, lenA: 100, lenB: 72, angle: 180 };

  function triEdgeLabel(svg, p1, p2, other, text, color) {
    var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    var dx = p2.x - p1.x, dy = p2.y - p1.y;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    if (nx * (other.x - mx) + ny * (other.y - my) > 0) { nx = -nx; ny = -ny; }
    var fs = text.length > 8 ? 10 : 11;
    var lx = clamp(mx + nx * 18, 20, BOX - 20);
    var ly = clamp(my + ny * 18, 18, BOX - 18);
    svg.appendChild(E("text", {
      x: lx, y: ly,
      fill: color, "font-size": fs, "font-weight": 800, "text-anchor": "middle",
      "dominant-baseline": "middle",
    }, text));
  }

  function paintIdTanTri(svg) {
    drawFreeRight(svg, IDTAN_TRI, {
      thetaAt: "A",
      thetaLabel: "x",
      fitPad: 40,
    });
    var F = fitOf(IDTAN_TRI, 40);
    triEdgeLabel(svg, F.C, F.A, F.B, "adjacent", TRI.ink);
    triEdgeLabel(svg, F.C, F.B, F.A, "opposite", TRI.ink);
    triEdgeLabel(svg, F.A, F.B, F.C, "hypotenuse", TRI.ink);
  }

  function renderIdTan() {
    var body = $("idtan-body");
    if (!body) return;
    var steps = [
      {
        hint: "In a right triangle with acute angle " + K("x") + ", label the sides relative to " + K("x") + ": opposite, adjacent, hypotenuse.",
        proof: "<p>Focus on the angle marked " + K("x") + ".</p>",
      },
      {
        hint: "By definition of sine and cosine in a right triangle:",
        proof:
          '<p class="math-line">' + K("\\sin x=\\dfrac{\\text{opposite}}{\\text{hypotenuse}}") + "</p>" +
          '<p class="math-line">' + K("\\cos x=\\dfrac{\\text{adjacent}}{\\text{hypotenuse}}") + "</p>",
      },
      {
        hint: "Divide the two ratios — hypotenuse cancels:",
        proof:
          '<p class="math-line">' + K("\\dfrac{\\sin x}{\\cos x}=\\dfrac{\\text{opposite/hypotenuse}}{\\text{adjacent/hypotenuse}}=\\dfrac{\\text{opposite}}{\\text{adjacent}}") + "</p>" +
          '<p class="math-line">' + K("\\tan x=\\dfrac{\\text{opposite}}{\\text{adjacent}}") + "</p>",
      },
      {
        hint: "So tangent is sine over cosine.",
        proof: '<p class="math-line">' + K("\\tan x=\\dfrac{\\sin x}{\\cos x}") + "</p>",
      },
    ];
    var s = steps[idTan.step];
    $("idtan-prev").disabled = idTan.step === 0;
    $("idtan-next").disabled = idTan.step === 3;
    $("idtan-step-label").textContent = "Step " + (idTan.step + 1) + " / 4";
    $("idtan-next").textContent = idTan.step === 3 ? "Done" : "Next →";

    body.innerHTML =
      '<p class="hint-sm">' + s.hint + "</p>" +
      '<div class="idtan-layout">' +
      '<div class="idtan-tri"><svg id="idtan-svg" viewBox="0 0 220 220"></svg></div>' +
      '<div class="idtan-proof box">' + s.proof + "</div>" +
      "</div>";
    paintIdTanTri($("idtan-svg"));
    body.scrollTop = 0;
  }

  function initIdTan() {
    $("idtan-next").addEventListener("click", function () {
      if (idTan.step < 3) { idTan.step++; renderIdTan(); }
    });
    $("idtan-prev").addEventListener("click", function () {
      if (idTan.step > 0) { idTan.step--; renderIdTan(); }
    });
    renderIdTan();
  }

  /* =========================================================================
   * Part 3 — co-functions (companion angle = 90° − x)
   * ========================================================================= */
  var coSin = { step: 0, x: 30, method: "geo", geoStep: 0 };
  var coTan = { step: 0, x: 30, method: "geo", geoStep: 0 };
  var CO_XMIN = -270, CO_XMAX = 360;
  var CO_W = 750, CO_H = 450; // exact 5:3
  var CO_PAD = 48;

  function coCompanion(x) { return 90 - x; }

  /* ─── Part 3 · Geometric explanation: shared rectangle figure ─── */
  var GEO_W = 520, GEO_H = 340;

  /** kind: "sin" | "tan" — controls which sides are highlighted. */
  function paintRectGeoFig(svgId, state, kind) {
    var svg = $(svgId);
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + GEO_W + " " + GEO_H);

    var xDeg = clamp(state.x, 18, 72);
    var xr = rad(xDeg);
    var cLen = 248;
    var b = cLen * Math.cos(xr);
    var a = cLen * Math.sin(xr);
    var ox = (GEO_W - b) / 2;
    var oy = (GEO_H + a) / 2 + 4;
    var C = { x: ox, y: oy };
    var D = { x: ox + b, y: oy };
    var A = { x: ox, y: oy - a };
    var B = { x: ox + b, y: oy - a };
    var step = state.geoStep;
    var ink = TRI.ink;
    var line = TRI.line;
    var softA = "rgba(31, 107, 74, 0.18)";
    var softB = "rgba(61, 126, 166, 0.16)";

    svg.appendChild(E("text", {
      x: GEO_W / 2, y: 28, fill: ink, "font-size": 18, "font-weight": 800,
      "text-anchor": "middle",
    }, "Rectangle"));

    if (step === 1) {
      svg.appendChild(E("polygon", {
        points: [B, C, D].map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: softA, stroke: "none",
      }));
    } else if (step === 2) {
      svg.appendChild(E("polygon", {
        points: [A, B, C].map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: softB, stroke: "none",
      }));
    } else if (step >= 3) {
      svg.appendChild(E("polygon", {
        points: [B, C, D].map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: softA, stroke: "none",
      }));
      svg.appendChild(E("polygon", {
        points: [A, B, C].map(function (p) { return p.x + "," + p.y; }).join(" "),
        fill: softB, stroke: "none",
      }));
    }

    [[A, B], [B, D], [D, C], [C, A]].forEach(function (seg) {
      svg.appendChild(E("line", {
        x1: seg[0].x, y1: seg[0].y, x2: seg[1].x, y2: seg[1].y,
        stroke: line, "stroke-width": 2.6, "stroke-linecap": "round",
      }));
    });
    svg.appendChild(E("line", {
      x1: C.x, y1: C.y, x2: B.x, y2: B.y,
      stroke: line, "stroke-width": 2.2, "stroke-dasharray": "7 5",
    }));

    function rightMark(corner, pU, pV) {
      var s = 14;
      var lu = Math.hypot(pU.x - corner.x, pU.y - corner.y) || 1;
      var lv = Math.hypot(pV.x - corner.x, pV.y - corner.y) || 1;
      var ux = (pU.x - corner.x) / lu, uy = (pU.y - corner.y) / lu;
      var vx = (pV.x - corner.x) / lv, vy = (pV.y - corner.y) / lv;
      svg.appendChild(E("path", {
        d: "M " + (corner.x + ux * s) + " " + (corner.y + uy * s) +
          " L " + (corner.x + ux * s + vx * s) + " " + (corner.y + uy * s + vy * s) +
          " L " + (corner.x + vx * s) + " " + (corner.y + vy * s),
        fill: "none", stroke: CHART.guide, "stroke-width": 1.6,
      }));
    }
    rightMark(A, C, B);
    rightMark(D, C, B);

    // Side highlights differ for sin (a,c) vs tan (a,b)
    if (kind === "tan") {
      if (step === 1) {
        svg.appendChild(E("line", {
          x1: B.x, y1: B.y, x2: D.x, y2: D.y,
          stroke: CHART.a, "stroke-width": 4, "stroke-linecap": "round",
        }));
        svg.appendChild(E("line", {
          x1: C.x, y1: C.y, x2: D.x, y2: D.y,
          stroke: CHART.a, "stroke-width": 4, "stroke-linecap": "round",
        }));
      } else if (step === 2) {
        svg.appendChild(E("line", {
          x1: A.x, y1: A.y, x2: B.x, y2: B.y,
          stroke: CHART.point, "stroke-width": 4, "stroke-linecap": "round",
        }));
        svg.appendChild(E("line", {
          x1: A.x, y1: A.y, x2: C.x, y2: C.y,
          stroke: CHART.point, "stroke-width": 4, "stroke-linecap": "round",
        }));
      }
    } else {
      if (step === 1) {
        svg.appendChild(E("line", {
          x1: B.x, y1: B.y, x2: D.x, y2: D.y,
          stroke: CHART.a, "stroke-width": 4, "stroke-linecap": "round",
        }));
        svg.appendChild(E("line", {
          x1: C.x, y1: C.y, x2: B.x, y2: B.y,
          stroke: CHART.a, "stroke-width": 4, "stroke-dasharray": "7 5",
        }));
      } else if (step === 2) {
        svg.appendChild(E("line", {
          x1: A.x, y1: A.y, x2: C.x, y2: C.y,
          stroke: CHART.point, "stroke-width": 4, "stroke-linecap": "round",
        }));
        svg.appendChild(E("line", {
          x1: C.x, y1: C.y, x2: B.x, y2: B.y,
          stroke: CHART.point, "stroke-width": 4, "stroke-dasharray": "7 5",
        }));
      }
    }

    function sideLabel(p1, p2, text, outward) {
      var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      var dx = p2.x - p1.x, dy = p2.y - p1.y;
      var len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var cx = (A.x + B.x + C.x + D.x) / 4, cy = (A.y + B.y + C.y + D.y) / 4;
      if ((nx * (cx - mx) + ny * (cy - my) > 0) === !outward) { nx = -nx; ny = -ny; }
      svg.appendChild(E("text", {
        x: mx + nx * 16, y: my + ny * 16,
        fill: ink, "font-size": 16, "font-weight": 800, "text-anchor": "middle",
        "dominant-baseline": "middle",
      }, text));
    }
    sideLabel(A, C, "a", true);
    sideLabel(B, D, "a", true);
    sideLabel(A, B, "b", true);
    sideLabel(C, D, "b", true);
    sideLabel(C, B, "c", false);

    function vertex(p, lab, dx, dy) {
      svg.appendChild(E("circle", {
        cx: p.x, cy: p.y, r: 4.5, fill: CHART.point, stroke: "#fff", "stroke-width": 1.2,
      }));
      svg.appendChild(E("text", {
        x: p.x + dx, y: p.y + dy, fill: ink, "font-size": 15, "font-weight": 800,
      }, lab));
    }
    vertex(A, "A", -16, -6);
    vertex(B, "B", 8, -6);
    vertex(C, "C", -16, 18);
    vertex(D, "D", 8, 18);

    function angleArc(vertex, p1, p2, label, show) {
      if (!show) return;
      var a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      var a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
      var r = 28;
      var sweep = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      svg.appendChild(E("path", {
        d: "M " + (vertex.x + r * Math.cos(a1)) + " " + (vertex.y + r * Math.sin(a1)) +
          " A " + r + " " + r + " 0 0 " + (sweep > 0 ? 1 : 0) + " " +
          (vertex.x + r * Math.cos(a2)) + " " + (vertex.y + r * Math.sin(a2)),
        fill: "none", stroke: CHART.point, "stroke-width": 2.2,
      }));
      var am = a1 + sweep / 2;
      svg.appendChild(E("text", {
        x: vertex.x + (r + 18) * Math.cos(am),
        y: vertex.y + (r + 18) * Math.sin(am),
        fill: CHART.point, "font-size": 14, "font-weight": 800,
        "text-anchor": "middle", "dominant-baseline": "middle",
      }, label));
    }
    angleArc(C, D, B, "x", step >= 0);
    angleArc(C, A, B, "90°−x", step >= 2);

    svg.appendChild(E("circle", {
      cx: B.x, cy: B.y, r: 11, fill: CHART.point, stroke: "#fff", "stroke-width": 2,
      "data-geo-drag": "1", style: "cursor:ew-resize",
    }));
  }

  function bindRectGeoDrag(svg, state, kind, sliderId, valId, proofId, paintProof) {
    if (!svg || svg.dataset.geoBound) return;
    svg.dataset.geoBound = "1";
    var dragging = false;
    function fromPtr(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var p = pt.matrixTransform(ctm.inverse());
      var xDeg = clamp(state.x, 18, 72);
      var xr = rad(xDeg);
      var cLen = 248;
      var b = cLen * Math.cos(xr);
      var a = cLen * Math.sin(xr);
      var ox = (GEO_W - b) / 2;
      var oy = (GEO_H + a) / 2 + 4;
      var dx = p.x - ox;
      var dy = oy - p.y;
      if (dx < 8) dx = 8;
      if (dy < 8) dy = 8;
      state.x = Math.round(clamp(deg(Math.atan2(dy, dx)), 18, 72));
      var slider = $(sliderId);
      var val = $(valId);
      if (slider) slider.value = String(state.x);
      if (val) val.textContent = state.x + "°";
      paintRectGeoFig(svg.id, state, kind);
      paintProof();
      paintTex($(proofId));
    }
    svg.addEventListener("pointerdown", function (e) {
      if (e.target.getAttribute("data-geo-drag") == null) return;
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      fromPtr(e);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      fromPtr(e);
    });
    svg.addEventListener("pointerup", function () { dragging = false; });
    svg.addEventListener("pointercancel", function () { dragging = false; });
  }

  function updateCoGeoProof() {
    var box = $("co-geo-proof");
    if (!box) return;
    var x = clamp(coSin.x, 18, 72);
    var x2 = 90 - x;
    var step = coSin.geoStep;
    function cls(i) {
      if (i < step) return "proof-step";
      if (i === step) return "proof-step on";
      return "proof-step dim";
    }
    var html = "";
    html += '<div class="' + cls(0) + '"><strong>Rectangle ABCD</strong> with diagonal ' +
      K("CB=c") + ". Drag B (or the slider) to change " + K("x") + ".</div>";
    html += '<div class="' + cls(1) + '"><strong>Consider ' + K("\\triangle BCD") + "</strong>" +
      (step >= 1
        ? '<div class="math-line">' + K("\\sin x=\\dfrac{a}{c}") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">Opposite to " + K("x") + " is " + K("BD=a") +
          "; hypotenuse is " + K("CB=c") + ".</p>"
        : "") +
      "</div>";
    html += '<div class="' + cls(2) + '"><strong>Consider ' + K("\\triangle ABC") + "</strong>" +
      (step >= 2
        ? '<div class="math-line">' + K("\\cos(90^\\circ-x)=\\dfrac{a}{c}") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">At C the other acute angle is " +
          K(x2 + "^\\circ") + ". Adjacent is " + K("AC=a") + "; hypotenuse is " + K("CB=c") + ".</p>"
        : "") +
      "</div>";
    html += '<div class="' + cls(3) + '">' +
      (step >= 3
        ? '<div class="math-line">' + K("\\therefore\\;\\sin x=\\cos(90^\\circ-x)") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">Both equal " + K("a/c") +
          ". Now " + K("x=" + x + "^\\circ") + ", so " + K("90^\\circ-x=" + x2 + "^\\circ") + ".</p>"
        : "<strong>Conclusion</strong>") +
      "</div>";
    box.innerHTML = html;
  }

  function updateCoTanGeoProof() {
    var box = $("co-tan-geo-proof");
    if (!box) return;
    var x = clamp(coTan.x, 18, 72);
    var x2 = 90 - x;
    var step = coTan.geoStep;
    function cls(i) {
      if (i < step) return "proof-step";
      if (i === step) return "proof-step on";
      return "proof-step dim";
    }
    var html = "";
    html += '<div class="' + cls(0) + '"><strong>Rectangle ABCD</strong> with diagonal ' +
      K("CB=c") + ". Drag B (or the slider) to change " + K("x") + ".</div>";
    html += '<div class="' + cls(1) + '"><strong>Consider ' + K("\\triangle BCD") + "</strong>" +
      (step >= 1
        ? '<div class="math-line">' + K("\\tan x=\\dfrac{a}{b}") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">Opposite to " + K("x") + " is " + K("BD=a") +
          "; adjacent is " + K("CD=b") + ".</p>"
        : "") +
      "</div>";
    html += '<div class="' + cls(2) + '"><strong>Consider ' + K("\\triangle ABC") + "</strong>" +
      (step >= 2
        ? '<div class="math-line">' + K("\\tan(90^\\circ-x)=\\dfrac{b}{a}") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">At C the other acute angle is " +
          K(x2 + "^\\circ") + ". Opposite is " + K("AB=b") + "; adjacent is " + K("AC=a") + ".</p>"
        : "") +
      "</div>";
    html += '<div class="' + cls(3) + '">' +
      (step >= 3
        ? '<div class="math-line">' + K("\\therefore\\;\\tan(90^\\circ-x)=\\dfrac{1}{\\tan x}") + "</div>" +
          "<p style=\"margin:0;font-weight:500\">Because " + K("b/a=1/(a/b)") +
          ". Now " + K("x=" + x + "^\\circ") + ", so " + K("90^\\circ-x=" + x2 + "^\\circ") + ".</p>"
        : "<strong>Conclusion</strong>") +
      "</div>";
    box.innerHTML = html;
  }

  function renderCoGeo() {
    var body = $("co-geo-body");
    if (!body) return;
    $("co-geo-prev").disabled = coSin.geoStep === 0;
    $("co-geo-next").disabled = coSin.geoStep === 3;
    $("co-geo-step-label").textContent = "Step " + (coSin.geoStep + 1) + " / 4";
    $("co-geo-next").textContent = coSin.geoStep === 3 ? "Done" : "Next →";

    body.innerHTML =
      '<p class="hint-sm">Same side lengths in both right triangles → the ratios match.</p>' +
      '<div class="slider-row">' +
      '<label for="co-geo-x">x</label>' +
      '<input id="co-geo-x" type="range" min="18" max="72" value="' + clamp(coSin.x, 18, 72) + '">' +
      '<span id="co-geo-x-val">' + clamp(coSin.x, 18, 72) + "°</span></div>" +
      '<div class="geo-layout">' +
      '<div class="geo-fig"><svg id="co-geo-svg" viewBox="0 0 520 340" preserveAspectRatio="xMidYMid meet"></svg></div>' +
      '<div class="geo-proof box" id="co-geo-proof"></div>' +
      "</div>";

    $("co-geo-x").addEventListener("input", function (e) {
      coSin.x = +e.target.value;
      $("co-geo-x-val").textContent = coSin.x + "°";
      paintRectGeoFig("co-geo-svg", coSin, "sin");
      updateCoGeoProof();
      paintTex($("co-geo-proof"));
    });
    paintRectGeoFig("co-geo-svg", coSin, "sin");
    bindRectGeoDrag($("co-geo-svg"), coSin, "sin", "co-geo-x", "co-geo-x-val", "co-geo-proof", updateCoGeoProof);
    updateCoGeoProof();
    paintTex(body);
  }

  function renderCoTanGeo() {
    var body = $("co-tan-geo-body");
    if (!body) return;
    $("co-tan-geo-prev").disabled = coTan.geoStep === 0;
    $("co-tan-geo-next").disabled = coTan.geoStep === 3;
    $("co-tan-geo-step-label").textContent = "Step " + (coTan.geoStep + 1) + " / 4";
    $("co-tan-geo-next").textContent = coTan.geoStep === 3 ? "Done" : "Next →";

    body.innerHTML =
      '<p class="hint-sm">Same rectangle — now compare the tangent ratios.</p>' +
      '<div class="slider-row">' +
      '<label for="co-tan-geo-x">x</label>' +
      '<input id="co-tan-geo-x" type="range" min="18" max="72" value="' + clamp(coTan.x, 18, 72) + '">' +
      '<span id="co-tan-geo-x-val">' + clamp(coTan.x, 18, 72) + "°</span></div>" +
      '<div class="geo-layout">' +
      '<div class="geo-fig"><svg id="co-tan-geo-svg" viewBox="0 0 520 340" preserveAspectRatio="xMidYMid meet"></svg></div>' +
      '<div class="geo-proof box" id="co-tan-geo-proof"></div>' +
      "</div>";

    $("co-tan-geo-x").addEventListener("input", function (e) {
      coTan.x = +e.target.value;
      $("co-tan-geo-x-val").textContent = coTan.x + "°";
      paintRectGeoFig("co-tan-geo-svg", coTan, "tan");
      updateCoTanGeoProof();
      paintTex($("co-tan-geo-proof"));
    });
    paintRectGeoFig("co-tan-geo-svg", coTan, "tan");
    bindRectGeoDrag($("co-tan-geo-svg"), coTan, "tan", "co-tan-geo-x", "co-tan-geo-x-val", "co-tan-geo-proof", updateCoTanGeoProof);
    updateCoTanGeoProof();
    paintTex(body);
  }

  function initCoGeo() {
    $("co-geo-next").addEventListener("click", function () {
      if (coSin.geoStep < 3) { coSin.geoStep++; renderCoGeo(); }
    });
    $("co-geo-prev").addEventListener("click", function () {
      if (coSin.geoStep > 0) { coSin.geoStep--; renderCoGeo(); }
    });
    $("co-geo-reset").addEventListener("click", function () {
      coSin.geoStep = 0;
      coSin.x = 30;
      renderCoGeo();
    });
    renderCoGeo();
  }

  function initCoTanGeo() {
    $("co-tan-geo-next").addEventListener("click", function () {
      if (coTan.geoStep < 3) { coTan.geoStep++; renderCoTanGeo(); }
    });
    $("co-tan-geo-prev").addEventListener("click", function () {
      if (coTan.geoStep > 0) { coTan.geoStep--; renderCoTanGeo(); }
    });
    $("co-tan-geo-reset").addEventListener("click", function () {
      coTan.geoStep = 0;
      coTan.x = 30;
      renderCoTanGeo();
    });
    renderCoTanGeo();
  }

  function bindCoAnglePick(containerId, presets, state, renderFn) {
    var pick = $(containerId);
    if (!pick) return;
    presets.forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.x === v ? " active" : "");
      b.innerHTML = K(v + "^\\circ");
      b.addEventListener("click", function () {
        state.x = v;
        state.step = 0;
        renderFn();
      });
      pick.appendChild(b);
    });
    var custom = document.createElement("label");
    custom.className = "co-custom";
    var inp = document.createElement("input");
    inp.type = "number";
    inp.id = containerId + "-custom";
    inp.min = "-270";
    inp.max = "360";
    inp.step = "1";
    inp.value = String(state.x);
    if (presets.indexOf(state.x) < 0) inp.classList.add("active-custom");
    custom.appendChild(document.createTextNode("Custom "));
    custom.appendChild(inp);
    custom.appendChild(document.createTextNode("°"));
    function applyCustom() {
      var v = Math.round(+inp.value);
      if (!isFinite(v)) return;
      v = clamp(v, -270, 360);
      state.x = v;
      state.step = 0;
      renderFn();
    }
    inp.addEventListener("change", applyCustom);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") applyCustom();
    });
    pick.appendChild(custom);
  }

  /** Vertical guide on the x-axis: shows where an angle sits on the chart. */
  function markCoAxis(svg, S, deg, color, label) {
    if (deg < S.xMin || deg > S.xMax) return;
    var px = S.xS(deg);
    svg.appendChild(E("line", {
      x1: px, y1: S.y1, x2: px, y2: S.y0,
      stroke: color, "stroke-width": 2, "stroke-dasharray": "6 4", opacity: "0.9",
    }));
    svg.appendChild(E("line", {
      x1: px - 7, y1: S.y0, x2: px + 7, y2: S.y0,
      stroke: color, "stroke-width": 3.5, "stroke-linecap": "round",
    }));
    svg.appendChild(E("text", {
      x: px, y: S.y0 + 38, fill: color, "font-size": 15, "font-weight": "800",
      "text-anchor": "middle",
    }, label));
  }

  function paintCoSin() {
    var svg = $("co-sin-svg");
    if (!svg) return;
    svg.setAttribute("viewBox", "0 0 " + CO_W + " " + CO_H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    var S = drawAxes(svg, CO_W, CO_H, CO_PAD, -1.15, 1.15, CO_XMIN, CO_XMAX, "chart");
    svg.appendChild(E("path", {
      d: curvePath(function (d) { return Math.sin(rad(d)); }, S),
      fill: "none", stroke: CHART.a, "stroke-width": 2.8,
    }));
    svg.appendChild(E("path", {
      d: curvePath(function (d) { return Math.cos(rad(d)); }, S),
      fill: "none", stroke: CHART.b, "stroke-width": 2.8,
    }));
    var x = coSin.x;
    var x2 = coCompanion(x);
    markCoAxis(svg, S, x, CHART.point, x + "\u00b0");
    if (coSin.step >= 1) {
      markCoAxis(svg, S, x2, CHART.point, "90\u00b0\u2212" + x + "\u00b0=" + x2 + "\u00b0");
    }
    function mark(d, y, lab) {
      var px = S.xS(d), py = S.yS(y);
      svg.appendChild(E("line", {
        x1: px, y1: S.y0, x2: px, y2: py,
        stroke: CHART.point, "stroke-width": 1.4, "stroke-dasharray": "3 3", opacity: "0.75",
      }));
      svg.appendChild(E("circle", { cx: px, cy: py, r: 8, fill: CHART.point, stroke: "#fff", "stroke-width": 1.4 }));
      svg.appendChild(E("text", { x: px + 10, y: py - 10, fill: CHART.point, "font-size": 18, "font-weight": "700" }, lab));
    }
    mark(x, Math.sin(rad(x)), "A");
    if (coSin.step >= 1) mark(x2, Math.sin(rad(x2)), "B");
    if (coSin.step >= 2) mark(x2, Math.cos(rad(x2)), "C");
    if (coSin.step >= 3) {
      var yEq = Math.sin(rad(x));
      svg.appendChild(E("line", {
        x1: S.xS(x), y1: S.yS(yEq), x2: S.xS(x2), y2: S.yS(yEq),
        stroke: CHART.point, "stroke-width": 2.2,
      }));
    }
  }

  function renderCoSin() {
    var body = $("co-sin-body");
    var tips = [
      "Pick " + K("x") + ". Point A = " + K("(x,\\sin x)") + " — the tick shows where " + K("x") + " is on the axis.",
      "Companion angle " + K("90^\\circ-x") + ". The tick marks " + K("90^\\circ-x") + " on the axis; B is on sine there.",
      "Same angle on cosine: C = " + K("(90^\\circ-x,\\,\\cos(90^\\circ-x))") + ".",
      "C and A share the same y ⇒ " + K("\\cos(90^\\circ-x)=\\sin x") + ".",
    ];
    $("co-sin-prev").disabled = coSin.step === 0;
    $("co-sin-next").disabled = coSin.step === 3;
    $("co-sin-step-label").textContent = "Step " + (coSin.step + 1) + " / 4";
    $("co-sin-next").textContent = coSin.step === 3 ? "Done" : "Next →";

    body.innerHTML =
      '<p class="hint-sm">' + tips[coSin.step] + "</p>" +
      '<div class="angle-pick" id="co-sin-pick"></div>' +
      '<svg class="lab-svg-fill" id="co-sin-svg" viewBox="0 0 750 450" preserveAspectRatio="xMidYMid meet"></svg>' +
      '<p class="point-legend">' +
      '<span><span class="dot" style="background:' + CHART.a + '"></span>' + K("\\sin") + "</span>" +
      '<span><span class="dot" style="background:' + CHART.b + '"></span>' + K("\\cos") + "</span>" +
      '<span><span class="dot" style="background:' + CHART.point + '"></span>points</span>' +
      "</p>" +
      '<p class="status-line" id="co-sin-note"></p>';

    bindCoAnglePick("co-sin-pick", [0, 30, 90, 180], coSin, renderCoSin);
    paintCoSin();
    var x = coSin.x, x2 = coCompanion(x);
    var note = $("co-sin-note");
    if (coSin.step === 0) {
      note.innerHTML = K("\\sin(" + x + "^\\circ)=" + exactTex(Math.sin(rad(x))));
    } else if (coSin.step === 1) {
      note.innerHTML = K("90^\\circ-" + x + "^\\circ=" + x2 + "^\\circ,\\;\\sin(" + x2 + "^\\circ)=" + exactTex(Math.sin(rad(x2))));
    } else if (coSin.step === 2) {
      note.innerHTML = K("\\cos(" + x2 + "^\\circ)=" + exactTex(Math.cos(rad(x2))));
    } else {
      note.innerHTML = K("\\cos(90^\\circ-x)=\\sin x=" + exactTex(Math.sin(rad(x))));
    }
  }

  function paintCoTan() {
    var svg = $("co-tan-svg");
    if (!svg) return;
    svg.setAttribute("viewBox", "0 0 " + CO_W + " " + CO_H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    var S = drawAxes(svg, CO_W, CO_H, CO_PAD, -3.2, 3.2, CO_XMIN, CO_XMAX, "chart");
    function plot(fn, color, width) {
      var d = "", pen = false;
      for (var i = CO_XMIN; i <= CO_XMAX; i++) {
        var y = fn(i);
        if (!isFinite(y) || Math.abs(y) > 3.4) { pen = false; continue; }
        d += (pen ? "L" : "M") + S.xS(i) + " " + S.yS(clamp(y, -3.2, 3.2)) + " ";
        pen = true;
      }
      svg.appendChild(E("path", { d: d, fill: "none", stroke: color, "stroke-width": width || 2.8 }));
    }
    plot(function (d) { return Math.tan(rad(d)); }, CHART.a, 2.8);
    plot(function (d) {
      var t = Math.tan(rad(d));
      return t === 0 ? Infinity : 1 / t;
    }, CHART.b, 2.8);
    [-270, -90, 90, 270].forEach(function (a) {
      if (a < CO_XMIN || a > CO_XMAX) return;
      svg.appendChild(E("line", {
        x1: S.xS(a), y1: S.y1, x2: S.xS(a), y2: S.y0,
        stroke: CHART.guide, "stroke-width": 1, "stroke-dasharray": "2 3",
      }));
    });
    var x = coTan.x;
    var x2 = coCompanion(x);
    var t = Math.tan(rad(x));
    var t2 = Math.tan(rad(x2));
    var invT = 1 / t;
    markCoAxis(svg, S, x, CHART.point, x + "\u00b0");
    if (coTan.step >= 1) {
      markCoAxis(svg, S, x2, CHART.point, "90\u00b0\u2212" + x + "\u00b0=" + x2 + "\u00b0");
    }
    function mark(d, y, lab) {
      if (!isFinite(y) || Math.abs(y) > 3.4) return;
      var py = S.yS(clamp(y, -3.2, 3.2));
      svg.appendChild(E("line", {
        x1: S.xS(d), y1: S.y0, x2: S.xS(d), y2: py,
        stroke: CHART.point, "stroke-width": 1.4, "stroke-dasharray": "3 3", opacity: "0.75",
      }));
      svg.appendChild(E("circle", {
        cx: S.xS(d), cy: py, r: 7, fill: CHART.point, stroke: "#fff", "stroke-width": 1.2,
      }));
      svg.appendChild(E("text", {
        x: S.xS(d) + 10, y: py - 10, fill: CHART.point, "font-size": 18, "font-weight": "700",
      }, lab));
    }
    mark(x, t, "A");
    if (coTan.step >= 1) mark(x2, t2, "B");
    if (coTan.step >= 2) mark(x, invT, "C");
    if (coTan.step >= 3 && isFinite(t2) && isFinite(invT)) {
      svg.appendChild(E("line", {
        x1: S.xS(x2), y1: S.yS(clamp(t2, -3.2, 3.2)),
        x2: S.xS(x), y2: S.yS(clamp(invT, -3.2, 3.2)),
        stroke: CHART.point, "stroke-width": 2.2,
      }));
    }
  }

  function renderCoTan() {
    var body = $("co-tan-body");
    var tips = [
      "Pick " + K("x") + ". A = " + K("(x,\\tan x)") + " — the tick shows where " + K("x") + " sits on the axis.",
      "Companion angle " + K("90^\\circ-x") + ". The tick shows " + K("90^\\circ-x") + " on the axis; B is on " + K("\\tan") + " there.",
      "C = " + K("\\bigl(x,\\tfrac{1}{\\tan x}\\bigr)") + " on the " + K("1/\\tan") + " curve (same x as A).",
      "B and C match ⇒ " + K("\\tan(90^\\circ-x)=\\dfrac{1}{\\tan x}") + ".",
    ];
    $("co-tan-prev").disabled = coTan.step === 0;
    $("co-tan-next").disabled = coTan.step === 3;
    $("co-tan-step-label").textContent = "Step " + (coTan.step + 1) + " / 4";
    $("co-tan-next").textContent = coTan.step === 3 ? "Done" : "Next →";

    body.innerHTML =
      '<p class="hint-sm">' + tips[coTan.step] + "</p>" +
      '<div class="angle-pick" id="co-tan-pick"></div>' +
      '<svg class="lab-svg-fill" id="co-tan-svg" viewBox="0 0 750 450" preserveAspectRatio="xMidYMid meet"></svg>' +
      '<p class="point-legend">' +
      '<span><span class="dot" style="background:' + CHART.a + '"></span>' + K("\\tan x") + "</span>" +
      '<span><span class="dot" style="background:' + CHART.b + '"></span>' + K("1/\\tan x") + "</span>" +
      '<span><span class="dot" style="background:' + CHART.point + '"></span>points</span>' +
      "</p>" +
      '<p class="status-line" id="co-tan-note"></p>';

    bindCoAnglePick("co-tan-pick", [30, 60], coTan, renderCoTan);
    paintCoTan();
    var x = coTan.x, x2 = coCompanion(x), t = Math.tan(rad(x));
    var note = $("co-tan-note");
    if (coTan.step === 0) {
      note.innerHTML = K("\\tan(" + x + "^\\circ)=" + exactTex(t));
    } else if (coTan.step === 1) {
      note.innerHTML = K("90^\\circ-" + x + "^\\circ=" + x2 + "^\\circ,\\;\\tan(" + x2 + "^\\circ)=" + exactTex(Math.tan(rad(x2))));
    } else if (coTan.step === 2) {
      note.innerHTML = K("\\dfrac{1}{\\tan(" + x + "^\\circ)}=" + exactTex(1 / t));
    } else {
      note.innerHTML = K("\\tan(90^\\circ-x)=\\dfrac{1}{\\tan x}=" + exactTex(1 / t));
    }
  }

  function initCo() {
    initCoGeo();
    initCoTanGeo();
    $("co-sin-next").addEventListener("click", function () {
      if (coSin.step < 3) { coSin.step++; renderCoSin(); }
    });
    $("co-sin-prev").addEventListener("click", function () {
      if (coSin.step > 0) { coSin.step--; renderCoSin(); }
    });
    $("co-sin-reset").addEventListener("click", function () { coSin.step = 0; renderCoSin(); });
    $("co-tan-next").addEventListener("click", function () {
      if (coTan.step < 3) { coTan.step++; renderCoTan(); }
    });
    $("co-tan-prev").addEventListener("click", function () {
      if (coTan.step > 0) { coTan.step--; renderCoTan(); }
    });
    $("co-tan-reset").addEventListener("click", function () { coTan.step = 0; renderCoTan(); });
  }

  function init() {
    initLabNav();
    paintTex(document);
    initIso();
    initHalf();
    initHand();
    initId();
    initIdTan();
    initCo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
