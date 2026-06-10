/* Benjamin Yi — personal site
   Vanilla JS, no dependencies. Every effect is gated on prefers-reduced-motion. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------- scramble → restore hero name ----------
     The page's thesis acted out: the ASCII-art name arrives as noise and
     gets restored to order, column by column, left to right. Spaces stay
     spaces, so the damaged silhouette is visible from the first frame. */

  var GLYPHS = "█▓▒░╳#%&*+=";
  var ascii = document.getElementById("heroAscii");

  function scrambleRestore(el) {
    var lines = el.textContent.split("\n");
    var start = performance.now();
    var PER_COL = 16;   // ms between each column locking in
    var PRE = 300;      // ms of pure noise before the first lock

    function frame(now) {
      var t = now - start;
      var settled = true;
      var out = [];
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        var row = "";
        for (var c = 0; c < line.length; c++) {
          var ch = line[c];
          if (ch === " ") { row += " "; continue; }
          if (t > PRE + c * PER_COL) {
            row += ch;
          } else {
            settled = false;
            row += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        out.push(row);
      }
      el.textContent = out.join("\n");
      if (!settled) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (ascii && !reduced) scrambleRestore(ascii);

  /* ---------- liquid distortion on hover ----------
     Hovering the name melts it: displacement scale eases up while the
     turbulence frequency drifts, so the art flows like liquid. Eases back
     to crisp on leave. Mouse-ish pointers only, and never under
     prefers-reduced-motion. */

  var liquidMap = document.getElementById("liquidMap");
  var liquidNoise = document.getElementById("liquidNoise");
  var liquidSpot = document.getElementById("liquidSpot");
  var heroName = document.getElementById("heroName");

  if (!reduced && ascii && heroName && liquidMap && liquidNoise && liquidSpot &&
      window.matchMedia("(hover: hover)").matches) {
    var SPOT_R = 140; // half the lens image size
    var liqScale = 0;
    var liqTarget = 0;
    var liqRaf = null;
    var liqT0 = performance.now();
    var spotX = 0, spotY = 0;       // eased lens position
    var aimX = 0, aimY = 0;         // raw cursor position

    var setAim = function (e) {
      var r = ascii.getBoundingClientRect();
      aimX = e.clientX - r.left;
      aimY = e.clientY - r.top;
    };

    var liqFrame = function (now) {
      liqScale += (liqTarget - liqScale) * 0.09;
      spotX += (aimX - spotX) * 0.22;
      spotY += (aimY - spotY) * 0.22;
      var t = (now - liqT0) / 1000;
      liquidMap.setAttribute("scale", liqScale.toFixed(2));
      liquidSpot.setAttribute("x", (spotX - SPOT_R).toFixed(1));
      liquidSpot.setAttribute("y", (spotY - SPOT_R).toFixed(1));
      liquidNoise.setAttribute("baseFrequency",
        (0.008 + 0.004 * Math.sin(t * 1.1)).toFixed(4) + " " +
        (0.028 + 0.012 * Math.cos(t * 0.8)).toFixed(4));
      if (liqTarget === 0 && liqScale < 0.3) {
        liquidMap.setAttribute("scale", "0");
        liquidSpot.setAttribute("x", "-9999");
        liquidSpot.setAttribute("y", "-9999");
        ascii.classList.remove("liquid");
        liqRaf = null;
        return;
      }
      liqRaf = requestAnimationFrame(liqFrame);
    };

    heroName.addEventListener("pointerenter", function (e) {
      setAim(e);
      spotX = aimX; spotY = aimY; // appear under the cursor, not slide in
      liqTarget = 15;
      ascii.classList.add("liquid");
      if (!liqRaf) liqRaf = requestAnimationFrame(liqFrame);
    });
    heroName.addEventListener("pointermove", setAim);
    heroName.addEventListener("pointerleave", function () {
      liqTarget = 0;
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
