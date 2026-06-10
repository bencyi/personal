/* Benjamin Yi — personal site
   Vanilla JS, no dependencies. Every effect is gated on prefers-reduced-motion. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- live clock (Bethesda = America/New_York) ---------- */

  var clock = document.getElementById("clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
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
     The page's thesis acted out: the name arrives as noise and gets
     restored to order, character by character, left to right. */

  var GLYPHS = "#/\\|<>_*+=%$&";
  var hero = document.getElementById("heroName");

  function scrambleRestore(el) {
    var finalText = el.getAttribute("aria-label") || el.textContent;
    var chars = finalText.split("");
    var start = performance.now();
    var PER_CHAR = 55;   // ms between each character locking in
    var PRE = 350;       // ms of pure noise before the first lock

    function frame(now) {
      var t = now - start;
      var out = "";
      var settled = true;
      for (var i = 0; i < chars.length; i++) {
        if (chars[i] === " ") { out += " "; continue; }
        if (t > PRE + i * PER_CHAR) {
          out += chars[i];
        } else {
          settled = false;
          out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
      }
      el.textContent = out;
      if (!settled) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (hero && !reduced) scrambleRestore(hero);

  /* ---------- turbulence settle on the word "order" ----------
     The accent word loads displaced — water-damaged — and settles
     to crisp over ~1.6s. Same filter powers the footer easter egg. */

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

  if (!reduced && wreckMap) {
    wreckMap.setAttribute("scale", "70");
    setTimeout(function () { animateScale(70, 0, 1600); }, 250);
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
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counts = document.querySelectorAll(".count");
  if (!reduced && "IntersectionObserver" in window) {
    // Markup ships the final values (works without JS); zero them out only
    // now that we know we'll animate them back up.
    counts.forEach(function (el) { el.textContent = "0"; });
  }
  if (reduced || !("IntersectionObserver" in window)) {
    counts.forEach(function (el) {
      el.textContent =
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
