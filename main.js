/* Benjamin Yi — personal monograph
   Vanilla JS, zero dependencies. Coordinates UI, scroll choreography,
   command palette, and window.BenPhysics (3D WebGL manifold + 6 live physics labs). */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL_B64 = "YmVuY3lpQG1lLmNvbQ==";

  /* ---------- toast ---------- */

  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg, ms) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, ms || 2400);
  }

  /* ---------- live Austin clock + day/night dot ---------- */

  var clock = document.getElementById("clock");
  var skyDot = document.getElementById("skyIndicator");
  if (clock) {
    var fmtTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    var fmtHour = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      hour12: false
    });
    var tick = function () {
      var now = new Date();
      clock.textContent = fmtTime.format(now) + " CT";
      clock.dateTime = now.toISOString();
      if (skyDot) {
        var h = parseInt(fmtHour.format(now), 10);
        var isDay = h >= 6 && h < 19;
        skyDot.style.background = isDay ? "#d97706" : "var(--accent)";
        skyDot.title = isDay ? "Daytime in Austin" : "Nighttime in Austin";
      }
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- theme toggle ---------- */

  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyThemeMeta() {
    if (!themeMeta) return;
    themeMeta.content =
      document.documentElement.dataset.theme === "dark" ? "#0c0d10" : "#f5f3ee";
  }
  applyThemeMeta();

  function toggleTheme() {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    applyThemeMeta();
    if (window.BenPhysics && window.BenPhysics.notifyTheme) {
      window.BenPhysics.notifyTheme();
    }
  }

  var toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
  }

  /* ---------- hero 3D manifold pulse button ---------- */

  var pulseBtn = document.getElementById("pulseField");
  if (pulseBtn) {
    pulseBtn.addEventListener("click", function () {
      if (window.BenPhysics && window.BenPhysics.pulseHero) {
        window.BenPhysics.pulseHero();
      }
    });
  }

  /* ---------- scroll choreography: progress rail, hero 3D flyover & spring pill nav ---------- */

  var siteHead = document.getElementById("siteHead");
  var scrollBar = document.getElementById("scrollBar");
  var heroStage = document.getElementById("heroStage");
  var pillNav = document.querySelector(".pill-nav");
  var navThumb = document.getElementById("navThumb");
  var navLinks = pillNav ? [].slice.call(pillNav.querySelectorAll("a")) : [];
  var navTargets = navLinks.map(function (a) {
    var href = a.getAttribute("href") || "";
    return href.charAt(0) === "#" ? document.querySelector(href) : null;
  });

  function positionNavThumb(link) {
    if (!navThumb || !pillNav) return;
    if (!link) {
      navThumb.style.opacity = "0";
      return;
    }
    var pr = pillNav.getBoundingClientRect();
    var lr = link.getBoundingClientRect();
    navThumb.style.width = lr.width.toFixed(1) + "px";
    navThumb.style.transform = "translateX(" + (lr.left - pr.left).toFixed(1) + "px)";
    navThumb.style.opacity = "1";
  }

  var activeNavIdx = -1;
  var hoverNavLink = null;

  navLinks.forEach(function (link) {
    link.addEventListener("pointerenter", function () {
      hoverNavLink = link;
      positionNavThumb(link);
    });
  });
  if (pillNav) {
    pillNav.addEventListener("pointerleave", function () {
      hoverNavLink = null;
      positionNavThumb(activeNavIdx >= 0 ? navLinks[activeNavIdx] : null);
    });
  }

  var scrollQueued = false;
  var lastScrollY = window.scrollY || 0;

  function syncScroll() {
    scrollQueued = false;
    var y = window.scrollY || 0;
    var vel = (y - lastScrollY) * 0.04;
    lastScrollY = y;

    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollBar) {
      scrollBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0).toFixed(4) + ")";
    }
    if (siteHead) {
      siteHead.classList.toggle("is-scrolled", y > 24);
    }

    // Drive 3D Sticky Basin-Dive Portal across #heroStage runway
    if (heroStage) {
      var sr = heroStage.getBoundingClientRect();
      var runway = Math.max(heroStage.offsetHeight - window.innerHeight, 1);
      var dive = Math.max(0, Math.min(1, -sr.top / runway));
      var diveCopy = Math.max(0, Math.min(1, dive / 0.34));
      var diveExit = Math.max(0, Math.min(1, (dive - 0.68) / 0.32));
      if (!reduced) {
        heroStage.style.setProperty("--dive", dive.toFixed(4));
        heroStage.style.setProperty("--dive-copy", diveCopy.toFixed(4));
        heroStage.style.setProperty("--dive-exit", diveExit.toFixed(4));
      }
      if (window.BenPhysics && window.BenPhysics.setHeroScroll) {
        window.BenPhysics.setHeroScroll(dive, vel);
      }
    }

    if (navLinks.length) {
      var line = window.innerHeight * 0.38;
      var active = -1;
      for (var i = 0; i < navTargets.length; i++) {
        var el = navTargets[i];
        if (el && el.getBoundingClientRect().top <= line) active = i;
      }
      if (active !== activeNavIdx) {
        activeNavIdx = active;
        for (var j = 0; j < navLinks.length; j++) {
          if (j === active) navLinks[j].setAttribute("aria-current", "true");
          else navLinks[j].removeAttribute("aria-current");
        }
        if (!hoverNavLink) {
          positionNavThumb(active >= 0 ? navLinks[active] : null);
        }
      }
    }
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(syncScroll);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    onScroll();
    if (!hoverNavLink && activeNavIdx >= 0) {
      positionNavThumb(navLinks[activeNavIdx]);
    }
  });
  syncScroll();

  /* ---------- kinetic masked editorial headings ---------- */

  if (!reduced) {
    [].forEach.call(document.querySelectorAll(".kinetic-title"), function (h) {
      if (h.children.length) return;
      var words = h.textContent.trim().split(/\s+/);
      if (words.length < 2) return;
      h.textContent = "";
      words.forEach(function (w, i) {
        var outer = document.createElement("span");
        outer.className = "kw";
        outer.style.setProperty("--wi", i);
        var inner = document.createElement("span");
        inner.textContent = w;
        outer.appendChild(inner);
        h.appendChild(outer);
        if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
      });
    });
  }

  /* ---------- writing & research: segmented filter + 3D floating preview ---------- */

  var segWrap = document.querySelector(".segmented");
  var segThumb = document.getElementById("segThumb");
  var segBtns = segWrap ? [].slice.call(segWrap.querySelectorAll(".segmented__btn")) : [];
  var writingItems = [].slice.call(document.querySelectorAll("#writingList .index-item"));

  function moveSegThumb(btn) {
    if (!segThumb || !segWrap || !btn) return;
    var wr = segWrap.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    segThumb.style.width = br.width.toFixed(1) + "px";
    segThumb.style.transform = "translateX(" + (br.left - wr.left).toFixed(1) + "px)";
  }

  if (segBtns.length) {
    segBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        segBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        moveSegThumb(btn);

        writingItems.forEach(function (item) {
          var kind = item.getAttribute("data-kind");
          var show = filter === "all" || kind === filter;
          item.classList.toggle("is-hidden", !show);
        });
      });
    });

    var syncSeg = function () {
      var activeBtn = segWrap.querySelector(".segmented__btn.is-active");
      moveSegThumb(activeBtn);
    };
    syncSeg();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncSeg);
    }
    window.addEventListener("resize", syncSeg);
  }

  var preview = document.getElementById("floatPreview");
  var previewImg = document.getElementById("floatPreviewImg");
  var previewCap = document.getElementById("floatPreviewCap");
  var writingList = document.getElementById("writingList");

  if (preview && previewImg && previewCap && writingList && !reduced && window.matchMedia("(hover: hover) and (min-width: 1021px)").matches) {
    var pv = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false, raf: null };
    var preloaded = false;

    function preloadPreviews() {
      if (preloaded) return;
      preloaded = true;
      writingItems.forEach(function (item) {
        var src = item.getAttribute("data-preview");
        if (src) {
          var im = new Image();
          im.src = src;
        }
      });
    }

    function placeTarget(clientX, clientY) {
      var pw = 310, ph = 210;
      var x = clientX + 28;
      if (x + pw + 20 > window.innerWidth) x = clientX - pw - 28;
      var y = Math.min(Math.max(clientY - ph * 0.5, 76), window.innerHeight - ph - 24);
      pv.tx = x;
      pv.ty = y;
    }

    function tickPreview() {
      var dx = pv.tx - pv.x;
      var dy = pv.ty - pv.y;
      pv.vx = dx * 0.16;
      pv.vy = dy * 0.16;
      pv.x += pv.vx;
      pv.y += pv.vy;
      var rotZ = Math.max(-4.5, Math.min(4.5, pv.vx * 0.22));
      var rotX = Math.max(-8, Math.min(8, -pv.vy * 0.3));
      var rotY = Math.max(-8, Math.min(8, pv.vx * 0.3));
      var sc = pv.active ? 1 : 0.94;
      preview.style.transform =
        "translate3d(" + pv.x.toFixed(1) + "px," + pv.y.toFixed(1) + "px,0) perspective(700px) rotateX(" +
        rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg) rotateZ(" + rotZ.toFixed(2) + "deg) scale(" + sc + ")";

      if (pv.active || Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
        pv.raf = requestAnimationFrame(tickPreview);
      } else {
        pv.raf = null;
      }
    }

    writingItems.forEach(function (item) {
      item.addEventListener("pointerenter", function (e) {
        preloadPreviews();
        var src = item.getAttribute("data-preview");
        var cap = item.getAttribute("data-preview-caption") || "";
        if (!src) return;
        if (previewImg.getAttribute("src") !== src) {
          previewImg.setAttribute("src", src);
        }
        previewCap.textContent = cap;
        placeTarget(e.clientX, e.clientY);
        if (!pv.active) {
          pv.x = pv.tx;
          pv.y = pv.ty;
        }
        pv.active = true;
        preview.classList.add("is-visible");
        if (!pv.raf) pv.raf = requestAnimationFrame(tickPreview);
      });

      item.addEventListener("pointermove", function (e) {
        placeTarget(e.clientX, e.clientY);
      });
    });

    writingList.addEventListener("pointerleave", function () {
      pv.active = false;
      preview.classList.remove("is-visible");
    });
  }

  /* ---------- interactive field notebook (wired to physics.js) ---------- */

  var notebook = document.getElementById("notebook");
  if (notebook) {
    var tabs = [].slice.call(notebook.querySelectorAll(".nb-item"));

    function selectDomain(idx, focusTab) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        if (on && focusTab) t.focus();
      });
      if (window.BenPhysics && window.BenPhysics.setSpecimen) {
        window.BenPhysics.setSpecimen(idx);
      }
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () {
        selectDomain(idx, false);
      });
      tab.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") selectDomain(idx, false);
      });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          selectDomain((idx + 1) % tabs.length, true);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          selectDomain((idx - 1 + tabs.length) % tabs.length, true);
        } else if (e.key === "Home") {
          e.preventDefault();
          selectDomain(0, true);
        } else if (e.key === "End") {
          e.preventDefault();
          selectDomain(tabs.length - 1, true);
        }
      });
    });
  }

  /* ---------- work plate: subtle 3D perspective tilt + tabular roll-in ---------- */

  var workPlate = document.getElementById("workPlate");
  if (workPlate && !reduced && window.matchMedia("(hover: hover) and (min-width: 900px)").matches) {
    workPlate.addEventListener("pointermove", function (e) {
      var r = workPlate.getBoundingClientRect();
      var px = (e.clientX - r.left) / Math.max(r.width, 1);
      var py = (e.clientY - r.top) / Math.max(r.height, 1);
      var rx = (0.5 - py) * 3.2;
      var ry = (px - 0.5) * 3.8;
      workPlate.style.setProperty("--wx", (px * 100).toFixed(1) + "%");
      workPlate.style.setProperty("--wy", (py * 100).toFixed(1) + "%");
      workPlate.style.transform =
        "perspective(1100px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
    });
    workPlate.addEventListener("pointerleave", function () {
      workPlate.style.transform = "";
    });
  }

  var rollNums = document.querySelectorAll(".roll-num");
  if (rollNums.length && !reduced && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        rio.unobserve(el);
        var to = parseInt(el.getAttribute("data-to"), 10);
        var pre = el.getAttribute("data-prefix") || "";
        var suf = el.getAttribute("data-suffix") || "";
        var dur = 1100;
        var start = performance.now();
        function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(to * eased).toLocaleString("en-US") + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    rollNums.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- copy email + contact form ---------- */

  function copyEmailAddress() {
    var addr = atob(EMAIL_B64);
    var btn = document.getElementById("copyEmail");
    var lbl = document.getElementById("copyEmailLabel");
    var done = function () {
      if (btn) btn.classList.add("is-copied");
      if (lbl) lbl.textContent = "Copied — " + addr;
      showToast("Email copied to clipboard");
      setTimeout(function () {
        if (btn) btn.classList.remove("is-copied");
        if (lbl) lbl.textContent = "Copy email address";
      }, 2800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(done)["catch"](function () {
        window.location.href = "mailto:" + addr;
      });
    } else {
      window.location.href = "mailto:" + addr;
    }
  }

  var copyEmailBtn = document.getElementById("copyEmail");
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", copyEmailAddress);
  }

  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var addr = atob(EMAIL_B64);
      var data = new FormData(contactForm);
      var subject = "Note from " + data.get("name");
      var body = data.get("message") +
        "\n\n— " + data.get("name") + " <" + data.get("email") + ">";
      window.location.href = "mailto:" + addr +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      showToast("Opening your mail app…");
    });
  }

  /* ---------- command palette (⌘K) ---------- */

  var cmdBackdrop = document.getElementById("cmdBackdrop");
  var cmdInput = document.getElementById("cmdInput");
  var cmdList = document.getElementById("cmdList");
  var cmdOpenBtn = document.getElementById("cmdOpen");

  if (cmdBackdrop && cmdInput && cmdList) {
    var COMMANDS = [
      { group: "Navigate", label: "Writing & Research", hint: "Section", run: function () { jumpTo("#writing"); } },
      { group: "Navigate", label: "Interactive Physics Lab", hint: "Section", run: function () { jumpTo("#curiosities"); } },
      { group: "Navigate", label: "Work — RestoreFast", hint: "Section", run: function () { jumpTo("#work"); } },
      { group: "Navigate", label: "Contact", hint: "Section", run: function () { jumpTo("#contact"); } },

      { group: "Writing & Papers", label: "The Point Was Always to Be Outgrown", hint: "Essay", run: function () { go("writing/the-point-was-always-to-be-outgrown.html"); } },
      { group: "Writing & Papers", label: "You Cannot Hire Your Way Out of a Systems Problem", hint: "Essay", run: function () { go("writing/you-cannot-hire-your-way-out-of-a-systems-problem.html"); } },
      { group: "Writing & Papers", label: "Scale Invariance in Construction Software", hint: "Essay", run: function () { go("writing/scale-invariance-in-construction-software.html"); } },
      { group: "Writing & Papers", label: "Beyond Transformers", hint: "Paper", run: function () { go("papers/beyond-transformers.html"); } },
      { group: "Writing & Papers", label: "Continuous Thermodynamic Descent", hint: "Paper", run: function () { go("papers/continuous-thermodynamic-descent.html"); } },

      { group: "Actions", label: "Pulse 3D thermodynamic manifold", hint: "3D", run: function () { jumpTo("#top"); if (window.BenPhysics) window.BenPhysics.pulseHero(); } },
      { group: "Actions", label: "Toggle light / dark theme", hint: "Theme", run: function () { toggleTheme(); } },
      { group: "Actions", label: "Copy email address", hint: "Email", run: function () { copyEmailAddress(); } },
      { group: "Actions", label: "Collapse spacetime", hint: "Physics", run: function () { triggerBlackHole(); } },

      { group: "Elsewhere", label: "X / Twitter (@benc_yi)", hint: "↗", run: function () { window.open("https://x.com/benc_yi", "_blank", "noopener"); } },
      { group: "Elsewhere", label: "GitHub (bencyi)", hint: "↗", run: function () { window.open("https://github.com/bencyi", "_blank", "noopener"); } },
      { group: "Elsewhere", label: "LinkedIn", hint: "↗", run: function () { window.open("https://www.linkedin.com/in/bencyi", "_blank", "noopener"); } },
      { group: "Elsewhere", label: "RestoreFast", hint: "↗", run: function () { window.open("https://www.restorefast.com", "_blank", "noopener"); } }
    ];

    var filtered = COMMANDS.slice();
    var selIdx = 0;

    function jumpTo(hash) {
      var target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
    function go(url) {
      window.location.href = url;
    }

    function renderCommands(query) {
      var q = (query || "").trim().toLowerCase();
      filtered = COMMANDS.filter(function (c) {
        if (!q) return true;
        return (c.label + " " + c.group + " " + c.hint).toLowerCase().indexOf(q) !== -1;
      });
      selIdx = 0;
      cmdList.textContent = "";

      if (!filtered.length) {
        var empty = document.createElement("li");
        empty.className = "cmd-empty";
        empty.textContent = "No matching commands.";
        cmdList.appendChild(empty);
        return;
      }

      var lastGroup = "";
      filtered.forEach(function (cmd, idx) {
        if (cmd.group !== lastGroup) {
          lastGroup = cmd.group;
          var grp = document.createElement("li");
          grp.className = "cmd-group";
          grp.textContent = cmd.group;
          cmdList.appendChild(grp);
        }
        var li = document.createElement("li");
        li.setAttribute("role", "option");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cmd-item" + (idx === selIdx ? " is-selected" : "");
        btn.dataset.idx = idx;

        var lbl = document.createElement("span");
        lbl.textContent = cmd.label;
        var hnt = document.createElement("span");
        hnt.className = "cmd-item__hint";
        hnt.textContent = cmd.hint;

        btn.appendChild(lbl);
        btn.appendChild(hnt);
        btn.addEventListener("click", function () {
          closeCmd();
          cmd.run();
        });
        btn.addEventListener("pointerenter", function () {
          updateSelection(idx);
        });
        li.appendChild(btn);
        cmdList.appendChild(li);
      });
    }

    function updateSelection(idx) {
      selIdx = idx;
      var btns = cmdList.querySelectorAll(".cmd-item");
      btns.forEach(function (b, i) {
        b.classList.toggle("is-selected", i === selIdx);
        if (i === selIdx) b.scrollIntoView({ block: "nearest" });
      });
    }

    function openCmd() {
      cmdBackdrop.hidden = false;
      cmdInput.value = "";
      renderCommands("");
      requestAnimationFrame(function () { cmdInput.focus(); });
    }

    function closeCmd() {
      cmdBackdrop.hidden = true;
    }

    if (cmdOpenBtn) cmdOpenBtn.addEventListener("click", openCmd);

    cmdBackdrop.addEventListener("click", function (e) {
      if (e.target === cmdBackdrop) closeCmd();
    });

    cmdInput.addEventListener("input", function () {
      renderCommands(cmdInput.value);
    });

    cmdInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCmd();
      } else if (e.key === "ArrowDown" && filtered.length) {
        e.preventDefault();
        updateSelection((selIdx + 1) % filtered.length);
      } else if (e.key === "ArrowUp" && filtered.length) {
        e.preventDefault();
        updateSelection((selIdx - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selIdx]) {
        e.preventDefault();
        var item = filtered[selIdx];
        closeCmd();
        item.run();
      }
    });

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (cmdBackdrop.hidden) openCmd();
        else closeCmd();
      } else if (e.key === "Escape" && !cmdBackdrop.hidden) {
        closeCmd();
      }
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
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hidden physics easter egg: gravitational collapse ---------- */

  var breakBtn = document.getElementById("breakBtn");
  var collapsing = false;

  function triggerBlackHole() {
    if (reduced) {
      showToast("Reduced motion is enabled — spacetime remains intact.");
      return;
    }
    if (collapsing) return;
    collapsing = true;
    runBlackHole(function () { collapsing = false; });
  }

  if (breakBtn) {
    breakBtn.addEventListener("click", triggerBlackHole);
  }

  function runBlackHole(allDone) {
    var W = window.innerWidth, H = window.innerHeight;
    var cx = W / 2, cy = H / 2;
    var RS = Math.min(W, H) * 0.082;
    var TILT = -0.16;
    var SQUASH = 0.27;

    var T_FALL = 2300, T_HOLD = 1150, T_BOOM = 1850;
    var T_END = T_FALL + T_HOLD + T_BOOM;

    var cv = document.createElement("canvas");
    cv.className = "bh-canvas";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var g = cv.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    document.documentElement.classList.add("bh-lock");

    var matter = [];
    var maxR = 1;
    document.querySelectorAll(
      "header.site-head, footer.site-foot, .hero__inner > *, .band > *"
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
      m.fallDelay = 120 + (m.r0 / maxR) * 540;
      m.outDelay = 250 + (m.r0 / maxR) * 320;
      m.swirl = 2.1 + Math.random() * 1.4;
      m.el.style.transition = "none";
      m.el.style.willChange = "transform, opacity";
    });

    var stars = [];
    for (var i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        m: 0.3 + Math.random() * 0.7, tw: Math.random() * 7
      });
    }

    var sparks = [];
    var burst = [];
    var burstMade = false;

    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
    function easeInCubic(x) { return x * x * x; }
    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

    function dopplerGradient(alpha, rOut) {
      var grad = g.createLinearGradient(-rOut, 0, rOut, 0);
      grad.addColorStop(0, "rgba(235,244,255," + alpha + ")");
      grad.addColorStop(0.42, "rgba(122,162,255," + alpha * 0.9 + ")");
      grad.addColorStop(1, "rgba(44,58,138," + alpha * 0.55 + ")");
      return grad;
    }

    function radiusAt(m, pr) { return m.r0 * (1 - pr); }
    function angleAt(m, r) {
      return m.th0 + m.swirl * (Math.sqrt(m.r0 / Math.max(r, 8)) - 1);
    }

    function placeMatter(m, pr, op) {
      var r = radiusAt(m, pr);
      var th = angleAt(m, r);
      var x = cx + r * Math.cos(th);
      var y = cy + r * Math.sin(th);
      var stretch = 1 + 2.1 * pr;
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
        if (ex * ex + ey * ey < occR2) {
          var f = clamp01((Math.sin(s.th) + s.jz + 0.06) / 0.3);
          a *= f * f * (3 - 2 * f);
          if (a <= 0.01) continue;
        }
        g.strokeStyle = "rgba(" +
          Math.round(145 + 110 * (1 - heat)) + "," +
          Math.round(175 + 80 * (1 - heat)) + ",255," + a + ")";
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
        Rs = RS * easeOutCubic(clamp01(t / 1450));
        veil = 0.94 * easeInCubic(clamp01(t / T_FALL));
        diskA = 0.14 + 0.86 * clamp01(t / T_FALL);
      } else {
        bp = clamp01((t - T_FALL - T_HOLD) / T_BOOM);
        Rs = RS * (1 - easeOutCubic(bp));
        veil = 0.94 * Math.max(0, 1 - bp * 1.8);
        diskA = Math.max(0, 1 - bp * 1.3);
      }
      Rs *= 1 + 0.012 * Math.sin(t / 240);

      for (var i = 0; i < matter.length; i++) {
        var m = matter[i];
        if (!inBoom) {
          var p = clamp01((t - m.fallDelay) / 1600);
          var pr = easeInCubic(p);
          var r = radiusAt(m, pr);
          var op = r < Rs * 3.2 ? clamp01((r - Rs * 1.15) / (Rs * 2.05)) : 1;
          placeMatter(m, pr, op.toFixed(3));
        } else {
          var q = clamp01((t - T_FALL - T_HOLD - m.outDelay) / 1100);
          var prOut = 1 - easeOutCubic(q);
          placeMatter(m, prOut, clamp01(q * 2.4).toFixed(3));
        }
      }

      g.clearRect(0, 0, W, H);
      if (veil > 0) {
        g.fillStyle = "rgba(6,8,14," + veil + ")";
        g.fillRect(0, 0, W, H);
      }

      if (veil > 0.2) {
        for (var si = 0; si < stars.length; si++) {
          var s = stars[si];
          var sdx = s.x - cx, sdy = s.y - cy;
          var b = Math.sqrt(sdx * sdx + sdy * sdy);
          if (b < 2.7 * Rs) continue;
          var f = 1 + (2.2 * Rs * Rs) / (b * b);
          var a = veil * 0.82 * s.m * (0.55 + 0.45 * Math.sin(t / 600 + s.tw));
          g.fillStyle = "rgba(232,240,255," + a + ")";
          g.fillRect(cx + sdx * f, cy + sdy * f, 1.5, 1.5);
        }
      }

      if (Rs > 2) {
        if (!inBoom && t < T_FALL + T_HOLD * 0.7 && sparks.length < 230) {
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

        g.shadowColor = "rgba(100,145,255,0.85)";
        g.shadowBlur = Rs * 0.9;
        g.strokeStyle = dopplerGradient(diskA * 0.55, 4.3 * Rs);
        g.lineWidth = Rs * 0.5;
        g.beginPath();
        g.arc(0, 0, 2.58 * Rs, 0, Math.PI * 2);
        g.stroke();

        g.lineWidth = Rs * 1.05;
        g.strokeStyle = dopplerGradient(diskA * 0.9, 4.3 * Rs);
        g.beginPath();
        g.ellipse(0, 0, 3.9 * Rs, 3.9 * Rs * SQUASH, 0, Math.PI, Math.PI * 2);
        g.stroke();

        g.shadowBlur = 0;
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(0, 0, 2.5 * Rs, 0, Math.PI * 2);
        g.fill();

        g.strokeStyle = "rgba(238,245,255," + 0.95 * diskA + ")";
        g.lineWidth = Math.max(1.1, Rs * 0.055);
        g.shadowColor = "rgba(155,190,255,0.9)";
        g.shadowBlur = 14;
        g.beginPath();
        g.arc(0, 0, 2.6 * Rs, 0, Math.PI * 2);
        g.stroke();

        g.shadowBlur = 0;
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(0, 0, 2.47 * Rs, 0, Math.PI * 2);
        g.fill();

        g.shadowColor = "rgba(100,145,255,0.72)";
        g.shadowBlur = Rs * 0.45;
        g.lineWidth = Rs * 1.05;
        g.strokeStyle = dopplerGradient(diskA, 4.3 * Rs);
        g.beginPath();
        g.ellipse(0, 0, 3.9 * Rs, 3.9 * Rs * SQUASH, 0, 0, Math.PI);
        g.stroke();

        g.shadowBlur = 0;
        drawSparks(Rs, diskA);
        g.restore();
      }

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
        if (tb < 420) {
          var fa = 1 - tb / 420;
          var fr = 3.2 * RS + tb * 2.4;
          var fg = g.createRadialGradient(cx, cy, 0, cx, cy, fr);
          fg.addColorStop(0, "rgba(245,250,255," + fa + ")");
          fg.addColorStop(0.5, "rgba(140,180,255," + fa * 0.52 + ")");
          fg.addColorStop(1, "rgba(60,100,220,0)");
          g.fillStyle = fg;
          g.fillRect(0, 0, W, H);
        }
        var ringR = easeOutCubic(bp) * Math.hypot(W, H) * 0.62;
        g.strokeStyle = "rgba(224,238,255," + 0.5 * (1 - bp) + ")";
        g.lineWidth = 2 + 9 * (1 - bp);
        g.beginPath();
        g.arc(cx, cy, ringR, 0, Math.PI * 2);
        g.stroke();
        for (var bj = 0; bj < burst.length; bj++) {
          var h = burst[bj];
          h.r += h.v * dt;
          var ha = Math.max(0, 1 - bp * 1.4);
          if (ha <= 0) continue;
          g.strokeStyle = "rgba(215,232,255," + ha * 0.8 + ")";
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
        matter.forEach(function (m) {
          m.el.style.transform = "";
          m.el.style.opacity = "";
          void m.el.offsetWidth;
          m.el.style.transition = m.oldTransition || "";
          m.el.style.willChange = "";
        });
        cv.remove();
        document.documentElement.classList.remove("bh-lock");
        showToast("Singularity resolved — information conserved.", 3200);
        allDone();
      }
    }
    requestAnimationFrame(frame);
  }
})();
