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

  /* ---------- copy email ---------- */

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { showToast("COPIED — " + text.toUpperCase()); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          window.location.href = "mailto:" + text;
        });
      } else {
        window.location.href = "mailto:" + text;
      }
    });
  });

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

  /* ---------- turbulence scale animator (powers the footer easter egg) ---------- */

  var wreckMap = document.getElementById("wreckMap");

  function animateScale(from, to, dur, done) {
    if (!wreckMap) { if (done) done(); return; }
    var t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      wreckMap.setAttribute("scale", String(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
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

  /* ---------- footer easter egg: break the page, then restore it ----------
     On-brand demo: damage happens, response is fast, order is restored,
     and the response time is documented. */

  var breakBtn = document.getElementById("breakBtn");
  var main = document.querySelector("main");
  var breaking = false;

  if (breakBtn && main) {
    breakBtn.addEventListener("click", function () {
      if (reduced) {
        showToast("NOTHING TO BREAK — REDUCED MOTION IS ON. SMART.");
        return;
      }
      if (breaking) return;
      breaking = true;
      var t0 = performance.now();
      main.classList.add("breaking");
      animateScale(0, 45, 450, function () {
        setTimeout(function () {
          animateScale(45, 0, 1100, function () {
            main.classList.remove("breaking");
            var secs = ((performance.now() - t0) / 1000).toFixed(1);
            showToast("INCIDENT CONTAINED — RESPONSE TIME " + secs + "s. THAT'S THE JOB.", 3400);
            breaking = false;
          });
        }, 500);
      });
    });
  }
})();
