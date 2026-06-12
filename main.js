/* Benjamin Yi — personal site
   Vanilla JS, no dependencies. Every effect is gated on prefers-reduced-motion. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // SMIL animations (the orbiting satellite) can't be gated from CSS.
  if (reduced) {
    document.querySelectorAll("svg").forEach(function (s) {
      if (s.pauseAnimations) s.pauseAnimations();
    });
  }

  /* ---------- live clock (Austin = America/Chicago) ---------- */

  var clock = document.getElementById("clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });
    var tick = function () {
      var now = new Date();
      clock.textContent = fmt.format(now);
      clock.dateTime = now.toISOString();
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- theme toggle ---------- */

  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var applyThemeColor = function () {
    if (themeMeta) {
      themeMeta.content =
        document.documentElement.dataset.theme === "light" ? "#f2efe7" : "#0c0c0b";
    }
  };
  applyThemeColor();

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
      applyThemeColor();
    });
  }

  /* ---------- toast ---------- */

  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg, ms) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, ms || 2600);
  }

  /* ---------- contact form ----------
     No backend, no exposed address: the form assembles a mailto at submit
     time. The address only exists base64-encoded here, never in markup. */

  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var addr = atob("YmVuY3lpQG1lLmNvbQ==");
      var data = new FormData(contactForm);
      var subject = "Website message from " + data.get("name");
      var body = data.get("message") +
        "\n\n— " + data.get("name") + " <" + data.get("email") + ">";
      window.location.href = "mailto:" + addr +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      showToast("OPENING YOUR MAIL APP…");
    });
  }

  /* ---------- the name is a physics toy ----------
     Every glyph of the ASCII art becomes a particle on a canvas. On load
     the name scrambles into place column by column. The cursor shoves
     glyphs aside — they glow accent while displaced — and they spring
     back home. Clicking anywhere in the hero detonates the whole name;
     it reassembles itself. Order, restored. Reduced motion (or no JS)
     keeps the static <pre>. */

  var GLYPHS = "█▓▒░╳#%&*+=";
  var ascii = document.getElementById("heroAscii");
  var heroSection = document.querySelector(".hero");

  if (ascii && heroSection && !reduced && window.HTMLCanvasElement) {
    // Pull the mono face in explicitly so the canvas never measures a
    // fallback font; fonts.ready alone can race the stylesheet.
    document.fonts.load("500 25px 'JetBrains Mono'").then(function () {
      return document.fonts.ready;
    }).then(initNameToy)["catch"](initNameToy);
  }

  function initNameToy() {
    var PAD = 160;                  // breathing room so flung glyphs don't clip
    var PER_COL = 16, PRE = 300;    // scramble timing
    var lines = ascii.textContent.split("\n");

    var canvas = document.createElement("canvas");
    canvas.className = "hero__canvas";
    canvas.setAttribute("aria-hidden", "true");
    ascii.parentNode.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    var parts = [];
    var w, h, fs, lineH;
    var palette = [];               // ink → accent ramp, 12 steps
    var mouse = { x: -1e4, y: -1e4, vx: 0, vy: 0 };
    var rafId = null;
    var born = performance.now();
    var scrambleDone = false;

    function hexToRgb(s) {
      s = s.trim().replace("#", "");
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      var n = parseInt(s, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function buildPalette() {
      var cs = getComputedStyle(document.documentElement);
      var a = hexToRgb(cs.getPropertyValue("--ink"));
      var b = hexToRgb(cs.getPropertyValue("--accent"));
      palette = [];
      for (var i = 0; i <= 11; i++) {
        var k = i / 11;
        palette.push("rgb(" +
          Math.round(a[0] + (b[0] - a[0]) * k) + "," +
          Math.round(a[1] + (b[1] - a[1]) * k) + "," +
          Math.round(a[2] + (b[2] - a[2]) * k) + ")");
      }
    }

    function build() {
      var rect = ascii.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      fs = parseFloat(getComputedStyle(ascii).fontSize);
      lineH = fs * 1.06;
      w = rect.width + PAD * 2;
      h = rect.height + PAD * 2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.style.left = (ascii.offsetLeft - PAD) + "px";
      canvas.style.top = (ascii.offsetTop - PAD) + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = "500 " + fs + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = "top";
      var charW = ctx.measureText("█").width;
      parts = [];
      var minOff = Infinity;
      for (var r = 0; r < lines.length; r++) {
        // mirror the pre's text-align: center, line by line
        var lineW = lines[r].replace(/\s+$/, "").length * charW;
        var offX = (rect.width - lineW) / 2;
        if (lines[r].trim() && offX < minOff) minOff = offX;
        for (var c = 0; c < lines[r].length; c++) {
          var ch = lines[r][c];
          if (ch === " ") continue;
          var hx = PAD + offX + c * charW;
          var hy = PAD + r * lineH;
          parts.push({ ch: ch, col: c, hx: hx, hy: hy, x: hx, y: hy, vx: 0, vy: 0 });
        }
      }
      // align the hero's intro copy with the art's true left edge
      heroSection.style.setProperty("--hero-indent", Math.max(0, minOff).toFixed(1) + "px");
    }

    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      var t = now - born;
      var active = false;
      if (!scrambleDone) {
        active = true;
        if (t > PRE + 74 * PER_COL) scrambleDone = true;
      }
      var R = fs * 6.5;
      var R2 = R * R;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          var d = Math.sqrt(d2) || 1;
          var f = 1 - d / R;
          f *= f;
          p.vx += (dx / d) * f * 3.4 + mouse.vx * f * 0.22;
          p.vy += (dy / d) * f * 3.4 + mouse.vy * f * 0.22;
        }
        p.vx += (p.hx - p.x) * 0.02;
        p.vy += (p.hy - p.y) * 0.02;
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;

        var ox = p.x - p.hx, oy = p.y - p.hy;
        var off2 = ox * ox + oy * oy;
        if (off2 > 0.03 || p.vx * p.vx + p.vy * p.vy > 0.03) active = true;

        var ch = p.ch;
        if (!scrambleDone && t < PRE + p.col * PER_COL) {
          ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        var heat = Math.min(Math.sqrt(off2) / (fs * 2.2), 1);
        ctx.fillStyle = palette[(heat * 11) | 0];
        ctx.fillText(ch, p.x, p.y);
      }
      if (active) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null; // everything home and still — sleep until poked
      }
    }

    function wake() {
      if (!rafId) rafId = requestAnimationFrame(frame);
    }

    function toCanvas(e) {
      var rc = canvas.getBoundingClientRect();
      return { x: e.clientX - rc.left, y: e.clientY - rc.top };
    }

    heroSection.addEventListener("pointermove", function (e) {
      var pt = toCanvas(e);
      var nvx = pt.x - mouse.x, nvy = pt.y - mouse.y;
      // ignore the jump on the first event after entering
      if (Math.abs(nvx) < 120 && Math.abs(nvy) < 120) {
        mouse.vx = nvx;
        mouse.vy = nvy;
      } else {
        mouse.vx = 0;
        mouse.vy = 0;
      }
      mouse.x = pt.x;
      mouse.y = pt.y;
      wake();
    });

    heroSection.addEventListener("pointerleave", function () {
      mouse.x = -1e4;
      mouse.y = -1e4;
      mouse.vx = 0;
      mouse.vy = 0;
    });

    // Click (not on a link/button) = detonate. The spring brings it home.
    heroSection.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      var pt = toCanvas(e);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = p.x - pt.x, dy = p.y - pt.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var imp = 30 * Math.exp(-d / 320) * (0.6 + Math.random() * 0.8);
        p.vx += (dx / d) * imp;
        p.vy += (dy / d) * imp + (Math.random() - 0.5) * 2;
      }
      wake();
    });

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        buildPalette();
        wake();
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        build();
        wake();
      }, 150);
    });

    buildPalette();
    build();
    ascii.classList.add("ghost"); // canvas takes over painting
    wake();

    // If the webfont lands after init, metrics changed — rebuild the grid.
    document.fonts.addEventListener("loadingdone", function () {
      build();
      wake();
    });
  }

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up stats ---------- */

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString("en-US") + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counts = document.querySelectorAll(".count");
  if (!reduced && "IntersectionObserver" in window) {
    // Markup ships the final values (works without JS); zero them out only
    // now that we know we'll animate them back up.
    counts.forEach(function (el) {
      el.textContent = (el.getAttribute("data-prefix") || "") + "0";
    });
  }
  if (reduced || !("IntersectionObserver" in window)) {
    counts.forEach(function (el) {
      el.textContent =
        (el.getAttribute("data-prefix") || "") +
        parseInt(el.getAttribute("data-count"), 10).toLocaleString("en-US") +
        (el.getAttribute("data-suffix") || "");
    });
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- footer easter egg: total gravitational collapse ----------
     BREAK THIS PAGE drops the site into a black hole at screen center.
     Every block becomes infalling matter on a Keplerian spiral
     (ω ∝ r^-3/2), spaghettifies radially, and redshift-fades crossing
     the photon sphere. The hole itself: black shadow at 2.5 Rs, photon
     ring just outside it, a tilted accretion disk with relativistic
     doppler beaming (approaching side beamed white-hot), a lensed halo,
     gravitationally lensed background stars, and infalling streams that
     slow asymptotically near the horizon (time dilation). Then it
     evaporates — flash, shockwave, Hawking burst — and all matter is
     ejected back along reversed spirals to exactly where it was. */

  var breakBtn = document.getElementById("breakBtn");
  var collapsing = false;

  if (breakBtn) {
    breakBtn.addEventListener("click", function () {
      if (reduced) {
        showToast("NOTHING TO BREAK — REDUCED MOTION IS ON. SMART.");
        return;
      }
      if (collapsing) return;
      collapsing = true;
      runBlackHole(function () { collapsing = false; });
    });
  }

  function runBlackHole(allDone) {
    var W = window.innerWidth, H = window.innerHeight;
    var cx = W / 2, cy = H / 2;
    var RS = Math.min(W, H) * 0.082;   // Schwarzschild radius at full mass
    var TILT = -0.16;                  // accretion disk inclination
    var SQUASH = 0.27;                 // disk plane foreshortening

    var T_FALL = 2400, T_HOLD = 1200, T_BOOM = 1900;
    var T_END = T_FALL + T_HOLD + T_BOOM;

    var cv = document.createElement("canvas");
    cv.className = "bh-canvas";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var g = cv.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    // canvas is a replaced element: inset alone won't stretch it, so pin
    // the CSS size or high-DPR screens get a dpr-times-oversized overlay
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    document.documentElement.classList.add("bh-lock");

    // ----- the matter: every visible block of the page -----
    var matter = [];
    var maxR = 1;
    document.querySelectorAll(
      "header.site-head, footer.site-foot, .hero > *, .stats__grid > *, .section > *"
    ).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var ex = r.left + r.width / 2;
      var ey = r.top + r.height / 2;
      var dx = ex - cx, dy = ey - cy;
      var r0 = Math.sqrt(dx * dx + dy * dy) || 1;
      if (r0 > maxR) maxR = r0;
      matter.push({
        el: el, ex: ex, ey: ey, r0: r0,
        th0: Math.atan2(dy, dx),
        oldTransition: el.style.transition
      });
    });
    matter.forEach(function (m) {
      m.fallDelay = 120 + (m.r0 / maxR) * 560;  // nearest matter falls first
      m.outDelay = 260 + (m.r0 / maxR) * 340;   // ejected after the flash clears
      m.swirl = 2.1 + Math.random() * 1.5;      // total spiral sweep (rad)
      m.el.style.transition = "none";           // .reveal has a transform transition
      m.el.style.willChange = "transform, opacity";
    });

    // ----- lensed backdrop stars -----
    var stars = [];
    for (var i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        m: 0.3 + Math.random() * 0.7, tw: Math.random() * 7
      });
    }

    var sparks = [];   // accretion streams
    var burst = [];    // Hawking-burst particles
    var burstMade = false;

    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
    function easeInCubic(x) { return x * x * x; }
    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

    // Relativistic doppler beaming across the disk: the side rotating
    // toward the viewer is beamed bright and hot, the receding side red.
    function dopplerGradient(alpha, rOut) {
      var grad = g.createLinearGradient(-rOut, 0, rOut, 0);
      grad.addColorStop(0, "rgba(255,249,240," + alpha + ")");
      grad.addColorStop(0.45, "rgba(255,122,38," + alpha * 0.85 + ")");
      grad.addColorStop(1, "rgba(120,28,6," + alpha * 0.5 + ")");
      return grad;
    }

    // A disk ribbon drawn as ONE filled path: the width follows a profile
    // along the arc, so ends either close to a point ("lens" — the lensed
    // images dissolve where they merge with the flat disk) or stay at
    // full width ("bridge" — joins the flat ring seamlessly). No strokes,
    // no end caps, no overlap seams.
    function diskRibbon(rx, ry, a0, a1, width, alpha, grad, profile) {
      var N = 60, i, p, a, w, tp;
      function wAt(pp) {
        tp = Math.sin(pp * Math.PI);
        return profile === "lens"
          ? width * Math.pow(tp, 0.8)
          : width * (1 + 0.22 * tp);
      }
      g.globalAlpha = alpha;
      g.fillStyle = grad;
      g.beginPath();
      for (i = 0; i <= N; i++) {
        p = i / N; a = a0 + (a1 - a0) * p; w = wAt(p);
        var ox = Math.cos(a) * (rx + w / 2), oy = Math.sin(a) * (ry + w / 2);
        if (i === 0) g.moveTo(ox, oy); else g.lineTo(ox, oy);
      }
      for (i = N; i >= 0; i--) {
        p = i / N; a = a0 + (a1 - a0) * p; w = wAt(p);
        g.lineTo(Math.cos(a) * (rx - w / 2), Math.sin(a) * (ry - w / 2));
      }
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
    }

    // r(progress) and θ(r): shared by infall and ejection so the path
    // out is the exact time-reverse of the path in.
    function radiusAt(m, pr) { return m.r0 * (1 - pr); }
    function angleAt(m, r) {
      return m.th0 + m.swirl * (Math.sqrt(m.r0 / Math.max(r, 8)) - 1);
    }

    function placeMatter(m, pr, op) {
      var r = radiusAt(m, pr);
      var th = angleAt(m, r);
      var x = cx + r * Math.cos(th);
      var y = cy + r * Math.sin(th);
      var stretch = 1 + 2.1 * pr;               // tidal stretch, radial
      var shrink = 0.16 + 0.84 * (1 - pr);
      var sr = Math.max(shrink * stretch, 0.02);
      var st = Math.max(shrink / stretch, 0.02);
      m.el.style.transform =
        "translate(" + (x - m.ex).toFixed(2) + "px," + (y - m.ey).toFixed(2) + "px) " +
        "rotate(" + th.toFixed(4) + "rad) scale(" + sr.toFixed(3) + "," + st.toFixed(3) + ") " +
        "rotate(" + (-th).toFixed(4) + "rad)";
      m.el.style.opacity = op;
      return r;
    }

    function drawSparks(Rs, diskA) {
      var occR2 = 2.5 * Rs * 2.5 * Rs;
      for (var i = 0; i < sparks.length; i++) {
        var s = sparks[i];
        var heat = clamp01((s.r - 2 * Rs) / (5 * Rs));
        var a = clamp01((s.r - 1.55 * Rs) / Rs) * diskA * 0.9;
        if (a <= 0) continue;
        var ex = s.r * Math.cos(s.th);
        var ey = s.r * Math.sin(s.th) * SQUASH;
        // Behind the hole, sparks are swallowed by the shadow — but the
        // disk has thickness, so dissolve smoothly across the plane
        // instead of cutting at a hard line. Per-spark jitter keeps the
        // boundary organic.
        if (ex * ex + ey * ey < occR2) {
          var f = clamp01((Math.sin(s.th) + s.jz + 0.06) / 0.3);
          a *= f * f * (3 - 2 * f); // smoothstep
          if (a <= 0.01) continue;
        }
        g.strokeStyle = "rgba(" + (255) + "," +
          Math.round(120 + 135 * (1 - heat) * 0.9) + "," +
          Math.round(40 + 160 * (1 - heat)) + "," + a + ")";
        g.lineWidth = s.sz;
        g.beginPath();
        g.moveTo(s.px, s.py);
        g.lineTo(ex, ey);
        g.stroke();
      }
    }

    var t0 = performance.now();
    var last = t0;

    function frame(now) {
      var t = now - t0;
      var dt = Math.min(Math.max((now - last) / 16.7, 0.4), 2.5);
      last = now;

      var Rs, veil, diskA, bp = 0;
      var inBoom = t >= T_FALL + T_HOLD;
      if (!inBoom) {
        Rs = RS * easeOutCubic(clamp01(t / 1500));
        veil = 0.94 * easeInCubic(clamp01(t / T_FALL));
        diskA = 0.12 + 0.88 * clamp01(t / T_FALL);
      } else {
        bp = clamp01((t - T_FALL - T_HOLD) / T_BOOM);
        Rs = RS * (1 - easeOutCubic(bp));   // evaporation runs away fast
        veil = 0.94 * Math.max(0, 1 - bp * 1.8);
        diskA = Math.max(0, 1 - bp * 1.3);  // the hole stays lit as it shrinks
      }
      Rs *= 1 + 0.012 * Math.sin(t / 240);  // the hole breathes

      // ----- move the matter -----
      for (var i = 0; i < matter.length; i++) {
        var m = matter[i];
        if (!inBoom) {
          var p = clamp01((t - m.fallDelay) / 1650);
          var pr = easeInCubic(p);              // gravity accelerates
          var r = radiusAt(m, pr);
          // redshift fade approaching the photon sphere
          var op = r < Rs * 3.2 ? clamp01((r - Rs * 1.15) / (Rs * 2.05)) : 1;
          placeMatter(m, pr, op.toFixed(3));
        } else {
          var q = clamp01((t - T_FALL - T_HOLD - m.outDelay) / 1150);
          var prOut = 1 - easeOutCubic(q);      // exact time-reverse
          placeMatter(m, prOut, clamp01(q * 2.4).toFixed(3));
        }
      }

      // ----- paint the hole -----
      g.clearRect(0, 0, W, H);

      if (veil > 0) {
        g.fillStyle = "rgba(2,2,4," + veil + ")";
        g.fillRect(0, 0, W, H);
      }

      // lensed stars: deflection ∝ 1/b², capture below ~2.7 Rs
      if (veil > 0.2) {
        for (var si = 0; si < stars.length; si++) {
          var s = stars[si];
          var sdx = s.x - cx, sdy = s.y - cy;
          var b = Math.sqrt(sdx * sdx + sdy * sdy);
          if (b < 2.7 * Rs) continue;
          var f = 1 + (2.2 * Rs * Rs) / (b * b);
          var a = veil * 0.8 * s.m * (0.55 + 0.45 * Math.sin(t / 600 + s.tw));
          g.fillStyle = "rgba(236,236,255," + a + ")";
          g.fillRect(cx + sdx * f, cy + sdy * f, 1.5, 1.5);
        }
      }

      if (Rs > 2) {
        // accretion streams: Keplerian ω ∝ r^-3/2, with gravitational
        // time dilation freezing them as they near the horizon
        if (!inBoom && t < T_FALL + T_HOLD * 0.7 && sparks.length < 240) {
          for (var n = 0; n < 3; n++) {
            sparks.push({
              r: (4.5 + Math.random() * 4.5) * Math.max(Rs, RS * 0.4),
              th: Math.random() * Math.PI * 2,
              sz: 0.7 + Math.random() * 1.5, px: 0, py: 0,
              jz: (Math.random() - 0.5) * 0.22
            });
          }
        }
        for (var sp = 0; sp < sparks.length; sp++) {
          var k = sparks[sp];
          k.px = k.r * Math.cos(k.th);
          k.py = k.r * Math.sin(k.th) * SQUASH;
          var dil = Math.sqrt(Math.max(0.02, 1 - (2 * Rs) / Math.max(k.r, 2 * Rs + 0.5)));
          k.th += (0.05 * Math.pow((3 * Rs) / Math.max(k.r, 1), 1.5) + 0.006) * dt;
          k.r -= 0.0065 * k.r * dil * dt;
        }

        g.save();
        g.translate(cx, cy);
        g.rotate(TILT);

        var grad = dopplerGradient(1, 4.3 * Rs);

        // 1. the flat equatorial disk: one continuous ring (no seams);
        //    the shadow will occlude what lies behind the hole
        g.shadowColor = "rgba(255,110,30,0.75)";
        g.shadowBlur = Rs * 0.5;
        g.globalAlpha = diskA * 0.85;
        g.strokeStyle = grad;
        g.lineWidth = Rs * 0.85;
        g.beginPath();
        g.ellipse(0, 0, 3.9 * Rs, 3.9 * Rs * SQUASH, 0, 0, Math.PI * 2);
        g.stroke();
        g.shadowBlur = 0;
        g.globalAlpha = 1;

        // 2. the shadow
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(0, 0, 2.5 * Rs, 0, Math.PI * 2);
        g.fill();

        // 3. gravitational lensing of the far side of the disk: light from
        //    behind the hole bends over the top (bright primary image) and
        //    under the bottom (fainter secondary image)
        g.shadowColor = "rgba(255,110,30,0.8)";
        g.shadowBlur = Rs * 0.45;
        diskRibbon(2.72 * Rs, 2.72 * Rs, Math.PI * 0.16, Math.PI * 0.84,
          Rs * 0.42, diskA * 0.5, grad, "lens");
        diskRibbon(2.8 * Rs, 2.88 * Rs, Math.PI * 1.03, Math.PI * 1.97,
          Rs * 0.78, diskA * 0.95, grad, "lens");
        g.shadowBlur = 0;

        // 4. photon ring
        g.globalAlpha = diskA;
        g.strokeStyle = "rgba(255,243,226,0.95)";
        g.lineWidth = Math.max(1.1, Rs * 0.055);
        g.shadowColor = "rgba(255,200,140,0.9)";
        g.shadowBlur = 14;
        g.beginPath();
        g.arc(0, 0, 2.6 * Rs, 0, Math.PI * 2);
        g.stroke();
        g.shadowBlur = 0;
        g.globalAlpha = 1;

        // 5. nothing escapes inside the photon ring: kill inward bloom
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(0, 0, 2.42 * Rs, 0, Math.PI * 2);
        g.fill();

        // 6. the near-side crossing of the flat disk passes in front of
        //    the shadow; the bridge profile matches the flat ring's width
        //    at both ends so the joints are invisible
        var gapA = Math.acos(2.42 / 3.9);
        g.shadowColor = "rgba(255,110,30,0.7)";
        g.shadowBlur = Rs * 0.4;
        diskRibbon(3.9 * Rs, 3.9 * Rs * SQUASH, gapA - 0.06, Math.PI - gapA + 0.06,
          Rs * 0.85, diskA * 0.92, grad, "bridge");
        g.shadowBlur = 0;

        drawSparks(Rs, diskA);
        g.restore();
      }

      // ----- evaporation: flash, shockwave, Hawking burst -----
      if (inBoom) {
        var tb = t - T_FALL - T_HOLD;
        if (!burstMade) {
          burstMade = true;
          for (var bi = 0; bi < 110; bi++) {
            burst.push({
              th: Math.random() * Math.PI * 2,
              r: 2.6 * RS,
              v: 6 + Math.random() * 16
            });
          }
        }
        if (tb < 430) {
          var fa = 1 - tb / 430;
          var fr = 3.2 * RS + tb * 2.4;
          var fg = g.createRadialGradient(cx, cy, 0, cx, cy, fr);
          fg.addColorStop(0, "rgba(255,252,245," + fa + ")");
          fg.addColorStop(0.5, "rgba(255,180,90," + fa * 0.55 + ")");
          fg.addColorStop(1, "rgba(255,120,40,0)");
          g.fillStyle = fg;
          g.fillRect(0, 0, W, H);
        }
        var ringR = easeOutCubic(bp) * Math.hypot(W, H) * 0.62;
        g.strokeStyle = "rgba(255,240,224," + 0.5 * (1 - bp) + ")";
        g.lineWidth = 2 + 9 * (1 - bp);
        g.beginPath();
        g.arc(cx, cy, ringR, 0, Math.PI * 2);
        g.stroke();
        for (var bj = 0; bj < burst.length; bj++) {
          var h = burst[bj];
          h.r += h.v * dt;
          var ha = Math.max(0, 1 - bp * 1.4);
          if (ha <= 0) continue;
          g.strokeStyle = "rgba(255,226,190," + ha * 0.8 + ")";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(cx + (h.r - 7) * Math.cos(h.th), cy + (h.r - 7) * Math.sin(h.th));
          g.lineTo(cx + h.r * Math.cos(h.th), cy + h.r * Math.sin(h.th));
          g.stroke();
        }
      }

      if (t < T_END) {
        requestAnimationFrame(frame);
      } else {
        // hand the universe back, exactly as it was
        matter.forEach(function (m) {
          m.el.style.transform = "";
          m.el.style.opacity = "";
          void m.el.offsetWidth; // settle before re-enabling transitions
          m.el.style.transition = m.oldTransition || "";
          m.el.style.willChange = "";
        });
        cv.remove();
        document.documentElement.classList.remove("bh-lock");
        showToast("SINGULARITY RESOLVED — ALL INFORMATION RECOVERED.", 3400);
        allDone();
      }
    }
    requestAnimationFrame(frame);
  }
})();
