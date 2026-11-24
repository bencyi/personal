/* ==========================================================================
   Benjamin Yi — Real-Time 3D WebGL Manifold & Interactive Physics Engines
   Zero external dependencies. Pure WebGL + custom 3D math + 6 live simulations.
   Exposes window.BenPhysics for main.js coordination.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var themeHooks = [];

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  /* ========================================================================
     1. HERO: 3D WEBGL THERMODYNAMIC POTENTIAL MANIFOLD + 1,600-PARTICLE SWARM
     ======================================================================== */

  var heroApi = {
    pulse: function () {},
    setScroll: function () {}
  };

  function initHeroManifold() {
    var canvas = document.getElementById("energyField");
    var hero = document.querySelector(".hero");
    if (!canvas || !hero) return;

    var hint = document.getElementById("fieldHint");
    var wellReadout = document.getElementById("wellCount");

    var gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: true,
        powerPreference: "high-performance"
      }) || canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: true,
        depth: true
      });
    } catch (e) { gl = null; }

    if (!gl) {
      initHeroFallback2D(canvas, hero);
      return;
    }

    // ---------- GLSL: 3D Displaced Surface Manifold ----------
    // Up to 8 wells: vec4(x, z, depth, inv2sigma2)
    // Up to 4 shockwaves: vec4(x, z, radius, amp)
    var SURF_VS = [
      "precision highp float;",
      "attribute vec2 aGrid;",
      "uniform mat4 uMVP;",
      "uniform float uTime;",
      "uniform float uIntro;",
      "uniform float uScrollVel;",
      "uniform vec4 uWells[8];",
      "uniform vec4 uWaves[4];",
      "varying float vElev;",
      "varying vec3 vNormal;",
      "varying vec3 vWorld;",
      "varying vec2 vXZ;",
      "varying float vGradLen;",
      "varying float vWave;",

      "float evalField(vec2 p, out vec2 grad, out float waveOut) {",
      "  float h = 0.0;",
      "  grad = vec2(0.0);",
      "  // Subtle harmonic background undulation",
      "  float b1 = sin(p.x * 1.55 + uTime * 0.42) * cos(p.y * 1.35 - uTime * 0.31);",
      "  float b2 = sin((p.x * 0.9 - p.y * 1.1) * 1.8 + uTime * 0.28);",
      "  float baseAmp = (0.085 + abs(uScrollVel) * 0.035) * uIntro;",
      "  h += (b1 * 0.65 + b2 * 0.35) * baseAmp;",
      "  grad.x += (1.55 * cos(p.x * 1.55 + uTime * 0.42) * cos(p.y * 1.35 - uTime * 0.31) * 0.65 + 1.62 * cos((p.x * 0.9 - p.y * 1.1) * 1.8 + uTime * 0.28) * 0.35) * baseAmp;",
      "  grad.y += (-1.35 * sin(p.x * 1.55 + uTime * 0.42) * sin(p.y * 1.35 - uTime * 0.31) * 0.65 - 1.98 * cos((p.x * 0.9 - p.y * 1.1) * 1.8 + uTime * 0.28) * 0.35) * baseAmp;",

      "  // Gaussian attractor wells + ridges",
      "  for (int i = 0; i < 8; i++) {",
      "    vec4 w = uWells[i];",
      "    if (abs(w.z) < 0.001) continue;",
      "    vec2 d = p - w.xy;",
      "    float r2 = dot(d, d);",
      "    float e = exp(-r2 * w.w);",
      "    float depth = w.z * uIntro;",
      "    // Negative depth = deep gravity basin; slight mexican-hat rim lift",
      "    float rim = exp(-r2 * w.w * 0.38) * 0.22;",
      "    h += depth * (e - rim);",
      "    float dhdr = depth * (-2.0 * w.w * e + 2.0 * w.w * 0.38 * rim);",
      "    grad += dhdr * d;",
      "  }",

      "  // Expanding circular shockwaves on click / pulse",
      "  waveOut = 0.0;",
      "  for (int j = 0; j < 4; j++) {",
      "    vec4 sw = uWaves[j];",
      "    if (sw.w < 0.002) continue;",
      "    vec2 d = p - sw.xy;",
      "    float r = length(d) + 0.0001;",
      "    float band = r - sw.z;",
      "    float env = exp(-band * band * 11.0) * sw.w;",
      "    float osc = cos(band * 12.5);",
      "    h += osc * env;",
      "    waveOut += env;",
      "    float dhdR = (-12.5 * sin(band * 12.5) - 22.0 * band * osc) * env;",
      "    grad += (dhdR / r) * d;",
      "  }",
      "  return h;",
      "}",

      "void main() {",
      "  vec2 xz = aGrid * vec2(3.55, 2.75);",
      "  vec2 grad;",
      "  float wv;",
      "  float y = evalField(xz, grad, wv);",
      "  vec3 pos = vec3(xz.x, y, xz.y);",
      "  vElev = y;",
      "  vXZ = xz;",
      "  vWorld = pos;",
      "  vGradLen = length(grad);",
      "  vWave = wv;",
      "  vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));",
      "  gl_Position = uMVP * vec4(pos, 1.0);",
      "}"
    ].join("\n");

    var SURF_FS = [
      "precision highp float;",
      "uniform vec3 uCamPos;",
      "uniform float uDark;",
      "uniform float uTime;",
      "uniform float uScroll;",
      "varying float vElev;",
      "varying vec3 vNormal;",
      "varying vec3 vWorld;",
      "varying vec2 vXZ;",
      "varying float vGradLen;",
      "varying float vWave;",

      "void main() {",
      "  vec3 N = normalize(vNormal);",
      "  vec3 V = normalize(uCamPos - vWorld);",
      "  vec3 L1 = normalize(vec3(0.55, 0.85, 0.45));",
      "  vec3 L2 = normalize(vec3(-0.7, 0.5, -0.5));",

      "  float diff1 = max(dot(N, L1), 0.0);",
      "  float diff2 = max(dot(N, L2), 0.0);",
      "  vec3 H = normalize(L1 + V);",
      "  float spec = pow(max(dot(N, H), 0.0), 42.0);",
      "  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);",

      "  // Palette: Warm sculptural alabaster + cobalt (light) vs obsidian + iridescent periwinkle (dark)",
      "  vec3 baseLight = vec3(0.961, 0.953, 0.933);",
      "  vec3 deepLight = vec3(0.75, 0.82, 0.97);",
      "  vec3 accLight  = vec3(0.114, 0.306, 0.847);",
      "  vec3 cyanLight = vec3(0.06, 0.56, 0.72);",

      "  vec3 baseDark  = vec3(0.047, 0.051, 0.063);",
      "  vec3 deepDark  = vec3(0.09, 0.16, 0.35);",
      "  vec3 accDark   = vec3(0.478, 0.635, 1.0);",
      "  vec3 cyanDark  = vec3(0.32, 0.86, 0.96);",

      "  vec3 baseCol = mix(baseLight, baseDark, uDark);",
      "  vec3 deepCol = mix(deepLight, deepDark, uDark);",
      "  vec3 accCol  = mix(accLight, accDark, uDark);",
      "  vec3 cyanCol = mix(cyanLight, cyanDark, uDark);",

      "  float basinDepth = clamp(-vElev * 0.95, 0.0, 1.0);",
      "  float ridgeLift  = clamp(vElev * 1.4, 0.0, 1.0);",

      "  vec3 surface = mix(baseCol, deepCol, basinDepth * 0.88);",
      "  surface = mix(surface, mix(baseCol, accCol, 0.22), ridgeLift * mix(0.24, 0.22, uDark));",

      "  // Studio shading",
      "  float shade = mix(0.84 + 0.19 * diff1 + 0.06 * diff2, 0.44 + 0.62 * diff1 + 0.24 * diff2, uDark);",
      "  vec3 col = surface * shade;",
      "  col += mix(accCol, cyanCol, 0.4) * fresnel * mix(0.26, 0.54, uDark);",
      "  col += mix(vec3(1.0), cyanCol, 0.35) * spec * mix(0.28, 0.48, uDark);",

      "  // Analytical anti-aliased iso-elevation contours (no extensions needed!)",
      "  float spacing = 9.5;",
      "  float cPhase = abs(fract(vElev * spacing + 0.5) - 0.5);",
      "  float cWidth = max(0.042, vGradLen * 0.065);",
      "  float contour = 1.0 - smoothstep(cWidth * 0.35, cWidth * 1.15, cPhase);",

      "  // Major index contour every 3rd elevation band",
      "  float mPhase = abs(fract(vElev * (spacing / 3.0) + 0.5) - 0.5);",
      "  float mWidth = max(0.024, vGradLen * 0.030);",
      "  float majorContour = 1.0 - smoothstep(mWidth * 0.35, mWidth * 1.25, mPhase);",

      "  // Warped coordinate wireframe grid (spacetime mesh)",
      "  vec2 gCoord = abs(fract(vXZ * 2.4 + 0.5) - 0.5);",
      "  float gLine = 1.0 - smoothstep(0.014, 0.038, min(gCoord.x, gCoord.y));",

      "  vec3 wireCol = mix(vec3(0.14, 0.14, 0.13), vec3(0.72, 0.78, 0.92), uDark);",
      "  col = mix(col, wireCol, gLine * mix(0.09, 0.11, uDark));",
      "  col = mix(col, accCol, contour * mix(0.32, 0.38, uDark));",
      "  col = mix(col, mix(accCol, cyanCol, 0.45), majorContour * mix(0.65, 0.80, uDark));",

      "  // Luminous shockwave crest highlight",
      "  col += mix(accCol, cyanCol, 0.6) * clamp(vWave * 3.8, 0.0, 1.0) * mix(0.45, 0.85, uDark);",

      "  // Soft elliptical vignette fade so the 3D manifold emerges seamlessly out of the ground",
      "  vec2 edge = vXZ / vec2(3.55, 2.75);",
      "  float rEdge = length(edge * vec2(1.0, 1.08));",
      "  float alpha = smoothstep(0.98, 0.46, rEdge);",
      "  // Fade slightly as user scrolls past hero",
      "  alpha *= (1.0 - smoothstep(0.65, 1.15, uScroll));",

      "  // Boost visibility along contour/basin geometry so it floats cleanly over the paper",
      "  float surfaceOp = mix(0.76, 0.86, uDark);",
      "  float finalA = alpha * clamp(surfaceOp + majorContour * 0.22 + basinDepth * 0.18 + vWave * 0.35, 0.0, 0.98);",
      "  gl_FragColor = vec4(col, finalA);",
      "}"
    ].join("\n");

    // ---------- GLSL: 1,600-Particle 3D Physics Swarm ----------
    var PART_VS = [
      "precision highp float;",
      "attribute vec3 aPos;",
      "attribute float aSize;",
      "attribute float aEnergy;",
      "uniform mat4 uMVP;",
      "uniform float uDpr;",
      "varying float vEnergy;",
      "varying float vDepth;",
      "void main() {",
      "  vec4 clip = uMVP * vec4(aPos, 1.0);",
      "  gl_Position = clip;",
      "  vEnergy = aEnergy;",
      "  vDepth = clip.w;",
      "  gl_PointSize = clamp((aSize * uDpr * 18.0) / max(clip.w, 0.8), 1.5, 16.0);",
      "}"
    ].join("\n");

    var PART_FS = [
      "precision highp float;",
      "uniform float uDark;",
      "uniform float uScroll;",
      "varying float vEnergy;",
      "varying float vDepth;",
      "void main() {",
      "  vec2 c = gl_PointCoord - 0.5;",
      "  float r = length(c);",
      "  if (r > 0.5) discard;",
      "  float core = smoothstep(0.5, 0.08, r);",
      "  float glow = pow(max(0.0, 1.0 - r * 2.0), 2.2);",
      "  vec3 cLowLight  = vec3(0.14, 0.16, 0.22);",
      "  vec3 cHighLight = vec3(0.114, 0.306, 0.847);",
      "  vec3 cHotLight  = vec3(0.04, 0.62, 0.80);",
      "  vec3 cLowDark   = vec3(0.62, 0.72, 0.98);",
      "  vec3 cHighDark  = vec3(0.45, 0.78, 1.0);",
      "  vec3 cHotDark   = vec3(0.92, 0.97, 1.0);",
      "  vec3 lowCol  = mix(cLowLight, cLowDark, uDark);",
      "  vec3 highCol = mix(cHighLight, cHighDark, uDark);",
      "  vec3 hotCol  = mix(cHotLight, cHotDark, uDark);",
      "  vec3 col = mix(lowCol, highCol, clamp(vEnergy * 1.1, 0.0, 1.0));",
      "  col = mix(col, hotCol, clamp((vEnergy - 0.55) * 2.2, 0.0, 1.0));",
      "  float a = (core * 0.75 + glow * 0.45) * (1.0 - smoothstep(0.65, 1.15, uScroll));",
      "  gl_FragColor = vec4(col, a * mix(0.78, 0.92, uDark));",
      "}"
    ].join("\n");

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        return null;
      }
      return sh;
    }

    function makeProg(vs, fs) {
      var v = compile(gl.VERTEX_SHADER, vs);
      var f = compile(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      var p = gl.createProgram();
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }

    var surfProg = makeProg(SURF_VS, SURF_FS);
    var partProg = makeProg(PART_VS, PART_FS);
    if (!surfProg || !partProg) {
      initHeroFallback2D(canvas, hero);
      return;
    }

    // ---------- Build 150 x 118 3D Surface Grid (17,969 verts, silky smooth) ----------
    var NX = 150, NZ = 118;
    var verts = new Float32Array((NX + 1) * (NZ + 1) * 2);
    var vi = 0;
    for (var iz = 0; iz <= NZ; iz++) {
      var gz = (iz / NZ) * 2 - 1;
      for (var ix = 0; ix <= NX; ix++) {
        verts[vi++] = (ix / NX) * 2 - 1;
        verts[vi++] = gz;
      }
    }
    var indices = new Uint16Array(NX * NZ * 6);
    var ii = 0;
    for (var rz = 0; rz < NZ; rz++) {
      for (var rx = 0; rx < NX; rx++) {
        var a = rz * (NX + 1) + rx;
        var b = a + 1;
        var c = a + (NX + 1);
        var d = c + 1;
        indices[ii++] = a; indices[ii++] = c; indices[ii++] = b;
        indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
      }
    }

    var surfVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surfVBO);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var surfIBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // ---------- Build 1,500 Live 3D Physics Particles ----------
    var PCOUNT = 1500;
    var pState = new Array(PCOUNT);
    var pBufData = new Float32Array(PCOUNT * 5); // x, y, z, size, energy
    function spawnParticle(p, scatterHigh) {
      p.x = (Math.random() * 2 - 1) * 3.1;
      p.z = (Math.random() * 2 - 1) * 2.35;
      p.vx = (Math.random() - 0.5) * 0.015;
      p.vz = (Math.random() - 0.5) * 0.015;
      p.lift = scatterHigh ? (0.8 + Math.random() * 1.9) : (0.04 + Math.random() * 0.14);
      p.vy = 0;
      p.size = 0.75 + Math.random() * 1.35;
      p.age = Math.random() * 260;
      p.life = 280 + Math.random() * 340;
    }
    for (var pi = 0; pi < PCOUNT; pi++) {
      pState[pi] = {};
      spawnParticle(pState[pi], !reduced);
    }

    var partVBO = gl.createBuffer();

    // Uniform / attrib locations
    var sLoc = {
      aGrid: gl.getAttribLocation(surfProg, "aGrid"),
      uMVP: gl.getUniformLocation(surfProg, "uMVP"),
      uTime: gl.getUniformLocation(surfProg, "uTime"),
      uIntro: gl.getUniformLocation(surfProg, "uIntro"),
      uScrollVel: gl.getUniformLocation(surfProg, "uScrollVel"),
      uWells: gl.getUniformLocation(surfProg, "uWells[0]"),
      uWaves: gl.getUniformLocation(surfProg, "uWaves[0]"),
      uCamPos: gl.getUniformLocation(surfProg, "uCamPos"),
      uDark: gl.getUniformLocation(surfProg, "uDark"),
      uScroll: gl.getUniformLocation(surfProg, "uScroll")
    };
    var pLoc = {
      aPos: gl.getAttribLocation(partProg, "aPos"),
      aSize: gl.getAttribLocation(partProg, "aSize"),
      aEnergy: gl.getAttribLocation(partProg, "aEnergy"),
      uMVP: gl.getUniformLocation(partProg, "uMVP"),
      uDpr: gl.getUniformLocation(partProg, "uDpr"),
      uDark: gl.getUniformLocation(partProg, "uDark"),
      uScroll: gl.getUniformLocation(partProg, "uScroll")
    };

    // ---------- Minimal 4x4 3D Camera Math ----------
    function mat4Mul(a, b) {
      var o = new Float32Array(16);
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          o[c * 4 + r] =
            a[0 * 4 + r] * b[c * 4 + 0] +
            a[1 * 4 + r] * b[c * 4 + 1] +
            a[2 * 4 + r] * b[c * 4 + 2] +
            a[3 * 4 + r] * b[c * 4 + 3];
        }
      }
      return o;
    }
    function perspective(fov, aspect, near, far) {
      var f = 1.0 / Math.tan(fov / 2);
      var nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    }
    function lookAt(eye, target, up) {
      var zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
      var zl = Math.hypot(zx, zy, zz) || 1;
      zx /= zl; zy /= zl; zz /= zl;
      var xx = up[1] * zz - up[2] * zy;
      var xy = up[2] * zx - up[0] * zz;
      var xz = up[0] * zy - up[1] * zx;
      var xl = Math.hypot(xx, xy, xz) || 1;
      xx /= xl; xy /= xl; xz /= xl;
      var yx = zy * xz - zz * xy;
      var yy = zz * xx - zx * xz;
      var yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
        -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
        -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
        1
      ]);
    }

    // ---------- Wells, Shockwaves & Physics ----------
    var wellUniforms = new Float32Array(8 * 4);
    var waveUniforms = new Float32Array(4 * 4);
    var userWells = [];
    var waves = [];

    var ptr = { nx: 0, ny: 0, tx: 0, ty: 0, active: false, drag: false, yawOff: 0, pitchOff: 0, tyaw: 0, tpitch: 0, lx: 0, ly: 0 };
    var scrollState = { p: 0, vel: 0, lastY: window.scrollY || 0 };
    var t0 = performance.now();
    var lastFrame = t0;
    var W = 1, H = 1, dpr = 1;
    var visible = true;
    var running = false;
    var rafId = null;

    function addWave(wx, wz, amp) {
      waves.push({ x: wx, z: wz, born: (performance.now() - t0) / 1000, amp: amp || 0.24 });
      if (waves.length > 4) waves.shift();
    }

    function depositWell(wx, wz) {
      userWells.push({ x: wx, z: wz, born: (performance.now() - t0) / 1000 });
      if (userWells.length > 4) userWells.shift();
      addWave(wx, wz, 0.26);
      // Kick nearby particles into dramatic 3D ballistic arcs
      for (var i = 0; i < PCOUNT; i++) {
        var p = pState[i];
        var dx = p.x - wx, dz = p.z - wz;
        var d2 = dx * dx + dz * dz;
        if (d2 < 1.8) {
          var k = Math.exp(-d2 * 1.2);
          var d = Math.sqrt(d2) + 0.05;
          p.vy += k * (0.045 + Math.random() * 0.035);
          p.vx += (-dz / d) * k * 0.038 + (dx / d) * k * 0.014;
          p.vz += (dx / d) * k * 0.038 + (dz / d) * k * 0.014;
        }
      }
      if (hint) hint.classList.add("is-gone");
    }

    // Fire an initial subtle harmonic birth wave at 0.35s so the opening pops
    if (!reduced) {
      setTimeout(function () { addWave(0.95, -0.1, 0.22); }, 320);
    }

    heroApi.pulse = function () {
      depositWell(0.75 + (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.2);
    };
    heroApi.setScroll = function (p, vel) {
      scrollState.p = p;
      scrollState.vel = Math.max(-2.5, Math.min(2.5, vel));
    };

    function resize() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // CPU mirror of field evaluation for the 1,500 particles
    function evalCPU(x, z, t, intro, scrollVel, outGrad) {
      var h = 0, gx = 0, gz = 0;
      var baseAmp = (0.085 + Math.abs(scrollVel) * 0.035) * intro;
      h += (Math.sin(x * 1.55 + t * 0.42) * Math.cos(z * 1.35 - t * 0.31) * 0.65 +
            Math.sin((x * 0.9 - z * 1.1) * 1.8 + t * 0.28) * 0.35) * baseAmp;

      for (var i = 0; i < 8; i++) {
        var o = i * 4;
        var depth = wellUniforms[o + 2] * intro;
        if (Math.abs(depth) < 0.001) continue;
        var dx = x - wellUniforms[o];
        var dz = z - wellUniforms[o + 1];
        var inv = wellUniforms[o + 3];
        var r2 = dx * dx + dz * dz;
        var e = Math.exp(-r2 * inv);
        var rim = Math.exp(-r2 * inv * 0.38) * 0.22;
        h += depth * (e - rim);
        var dhdr = depth * (-2.0 * inv * e + 2.0 * inv * 0.38 * rim);
        gx += dhdr * dx;
        gz += dhdr * dz;
      }
      outGrad[0] = gx;
      outGrad[1] = gz;
      return h;
    }

    var gradTmp = [0, 0];

    function render(now) {
      var t = (now - t0) / 1000;
      var dt = Math.min(Math.max((now - lastFrame) / 1000, 0.001), 0.045);
      lastFrame = now;

      // Damped intro curve (0 -> 1 over 1.7s with gentle elastic bloom)
      var intro = reduced ? 1.0 : Math.min(1, t / 1.55);
      intro = 1 - Math.pow(1 - intro, 3.2);

      // Smooth pointer + orbit camera damping
      ptr.nx += (ptr.tx - ptr.nx) * 0.065;
      ptr.ny += (ptr.ty - ptr.ny) * 0.065;
      ptr.yawOff += (ptr.tyaw - ptr.yawOff) * 0.06;
      ptr.pitchOff += (ptr.tpitch - ptr.pitchOff) * 0.06;
      scrollState.vel *= 0.92;

      // Build active wells: 3 primary drifting attractors + cursor probe + up to 4 user-deposited wells
      wellUniforms.fill(0);
      // Primary deep attractor basins biased rightward for balanced composition beside the headline
      var bWells = [
        [1.08 + Math.sin(t * 0.29) * 0.34, -0.22 + Math.cos(t * 0.24) * 0.28, -1.25, 1.35],
        [2.05 + Math.cos(t * 0.22 + 1.4) * 0.32, 0.78 + Math.sin(t * 0.27) * 0.26, -1.05, 1.45],
        [-0.35 + Math.sin(t * 0.2 + 2.6) * 0.35, 0.72 + Math.cos(t * 0.25 + 1.0) * 0.28, -0.82, 1.2]
      ];
      var activeCount = 3;
      for (var bi = 0; bi < 3; bi++) {
        wellUniforms[bi * 4 + 0] = bWells[bi][0];
        wellUniforms[bi * 4 + 1] = bWells[bi][1];
        wellUniforms[bi * 4 + 2] = bWells[bi][2];
        wellUniforms[bi * 4 + 3] = bWells[bi][3];
      }

      // Live pointer gravity probe
      if (ptr.active) {
        wellUniforms[12] = ptr.nx * 2.85 + 0.35;
        wellUniforms[13] = ptr.ny * 2.15;
        wellUniforms[14] = -0.68;
        wellUniforms[15] = 2.1;
      }

      // User-deposited temporary wells (deposition + slow erosion)
      var slot = 4;
      for (var ui = userWells.length - 1; ui >= 0; ui--) {
        var u = userWells[ui];
        var age = t - u.born;
        if (age > 11) {
          userWells.splice(ui, 1);
          continue;
        }
        var env = Math.min(age / 0.28, 1) * Math.max(0, 1 - Math.max(0, age - 2.2) / 8.8);
        if (slot < 8) {
          wellUniforms[slot * 4 + 0] = u.x;
          wellUniforms[slot * 4 + 1] = u.z;
          wellUniforms[slot * 4 + 2] = -1.35 * env;
          wellUniforms[slot * 4 + 3] = 2.2;
          slot++;
          activeCount++;
        }
      }

      if (wellReadout) {
        wellReadout.textContent = String(activeCount);
      }

      // Expanding 3D shockwaves
      waveUniforms.fill(0);
      for (var wi = waves.length - 1; wi >= 0; wi--) {
        var sw = waves[wi];
        var wage = t - sw.born;
        if (wage > 3.2) {
          waves.splice(wi, 1);
          continue;
        }
        var o = wi * 4;
        waveUniforms[o + 0] = sw.x;
        waveUniforms[o + 1] = sw.z;
        waveUniforms[o + 2] = wage * 2.15;
        waveUniforms[o + 3] = sw.amp * Math.exp(-wage * 1.15);
      }

      // Camera: dramatic choreographed opening sweep + scroll flyover + mouse parallax
      var introCam = 1 - intro;
      var sp = Math.min(Math.max(scrollState.p, 0), 1.2);
      var yaw = -0.34 + ptr.nx * 0.22 + ptr.yawOff + Math.sin(t * 0.14) * 0.08 + sp * 0.52 - introCam * 0.55;
      var pitch = 0.58 - ptr.ny * 0.14 + ptr.pitchOff + sp * 0.44 + introCam * 0.48;
      pitch = Math.max(0.28, Math.min(1.22, pitch));
      var dist = 4.65 - sp * 0.65 + introCam * 1.65;

      var target = [0.22 - sp * 0.25, -0.36, 0.12];
      var eye = [
        target[0] + Math.sin(yaw) * Math.cos(pitch) * dist,
        target[1] + Math.sin(pitch) * dist,
        target[2] + Math.cos(yaw) * Math.cos(pitch) * dist
      ];

      var aspect = W / Math.max(H, 1);
      var proj = perspective(0.76, aspect, 0.1, 30.0);
      var view = lookAt(eye, target, [0, 1, 0]);
      var mvp = mat4Mul(proj, view);

      // Update 1,500 3D Langevin particles
      var step60 = reduced ? 0 : dt * 60;
      for (var pi = 0; pi < PCOUNT; pi++) {
        var p = pState[pi];
        var surfY = evalCPU(p.x, p.z, t, intro, scrollState.vel, gradTmp);
        if (step60 > 0) {
          // Gradient descent (-∇E) + orbital Coriolis curl + subtle thermal noise
          p.vx += (-gradTmp[0] * 0.0042 - gradTmp[1] * 0.0036) * step60;
          p.vz += (-gradTmp[1] * 0.0042 + gradTmp[0] * 0.0036) * step60;
          p.vx = p.vx * 0.94 + (Math.random() - 0.5) * 0.0018;
          p.vz = p.vz * 0.94 + (Math.random() - 0.5) * 0.0018;
          p.x += p.vx * step60;
          p.z += p.vz * step60;

          // Vertical spring-gravity settling onto the 3D surface
          p.vy -= 0.0022 * step60;
          p.lift += p.vy * step60;
          if (p.lift < 0.035) {
            p.lift = 0.035;
            if (p.vy < 0) p.vy *= -0.25;
          }
          p.age += step60;
          if (p.age > p.life || Math.abs(p.x) > 3.35 || Math.abs(p.z) > 2.55) {
            spawnParticle(p, false);
          }
        }
        var speed = Math.hypot(p.vx, p.vz) * 28.0;
        var basin = Math.max(0, -surfY * 0.85);
        var fade = Math.sin(Math.min(p.age / p.life, 1) * Math.PI);
        var off = pi * 5;
        pBufData[off + 0] = p.x;
        pBufData[off + 1] = surfY + p.lift;
        pBufData[off + 2] = p.z;
        pBufData[off + 3] = p.size * (0.45 + 0.55 * fade);
        pBufData[off + 4] = Math.min(1, speed + basin * 0.65 + p.lift * 0.8);
      }

      // ---------- WebGL Draw ----------
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);

      var darkF = isDark() ? 1.0 : 0.0;

      // 1. Sculpted 3D Energy Surface
      gl.useProgram(surfProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, surfVBO);
      gl.enableVertexAttribArray(sLoc.aGrid);
      gl.vertexAttribPointer(sLoc.aGrid, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfIBO);

      gl.uniformMatrix4fv(sLoc.uMVP, false, mvp);
      gl.uniform1f(sLoc.uTime, t);
      gl.uniform1f(sLoc.uIntro, intro);
      gl.uniform1f(sLoc.uScrollVel, scrollState.vel);
      gl.uniform4fv(sLoc.uWells, wellUniforms);
      gl.uniform4fv(sLoc.uWaves, waveUniforms);
      gl.uniform3fv(sLoc.uCamPos, eye);
      gl.uniform1f(sLoc.uDark, darkF);
      gl.uniform1f(sLoc.uScroll, sp);

      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      // 2. 1,500 Luminous 3D Physics Particles
      gl.depthMask(false);
      gl.useProgram(partProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, partVBO);
      gl.bufferData(gl.ARRAY_BUFFER, pBufData, gl.DYNAMIC_DRAW);

      gl.enableVertexAttribArray(pLoc.aPos);
      gl.vertexAttribPointer(pLoc.aPos, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(pLoc.aSize);
      gl.vertexAttribPointer(pLoc.aSize, 1, gl.FLOAT, false, 20, 12);
      gl.enableVertexAttribArray(pLoc.aEnergy);
      gl.vertexAttribPointer(pLoc.aEnergy, 1, gl.FLOAT, false, 20, 16);

      gl.uniformMatrix4fv(pLoc.uMVP, false, mvp);
      gl.uniform1f(pLoc.uDpr, dpr);
      gl.uniform1f(pLoc.uDark, darkF);
      gl.uniform1f(pLoc.uScroll, sp);

      gl.drawArrays(gl.POINTS, 0, PCOUNT);
      gl.depthMask(true);
    }

    function loop(now) {
      if (!running) return;
      render(now);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    if (!reduced) {
      var downX = 0, downY = 0, moved = false;

      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        ptr.tx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2;
        ptr.ty = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2;
        ptr.active = true;
        if (ptr.drag) {
          var dx = e.clientX - ptr.lx;
          var dy = e.clientY - ptr.ly;
          ptr.lx = e.clientX;
          ptr.ly = e.clientY;
          if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
          ptr.tyaw = Math.max(-1.1, Math.min(1.1, ptr.tyaw - dx * 0.0045));
          ptr.tpitch = Math.max(-0.35, Math.min(0.45, ptr.tpitch + dy * 0.0035));
        }
      });

      hero.addEventListener("pointerdown", function (e) {
        if (e.target.closest("a, button")) return;
        ptr.drag = true;
        moved = false;
        downX = ptr.lx = e.clientX;
        downY = ptr.ly = e.clientY;
      });

      window.addEventListener("pointerup", function (e) {
        if (!ptr.drag) return;
        ptr.drag = false;
        if (!moved && e.target.closest(".hero") && !e.target.closest("a, button")) {
          var r = hero.getBoundingClientRect();
          var nx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2;
          var ny = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2;
          depositWell(nx * 2.85 + 0.35, ny * 2.15);
        }
      });

      hero.addEventListener("pointerleave", function () {
        ptr.active = false;
        ptr.tx = 0;
        ptr.ty = 0;
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start(); else stop();
        }, { threshold: 0 }).observe(hero);
      }
    }

    themeHooks.push(function () {
      if (reduced) render(performance.now());
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resize();
        if (reduced) render(performance.now());
      }, 140);
    });

    resize();
    render(performance.now());
    start();
  }

  // Fallback isometric 3D wireframe if WebGL is unavailable
  function initHeroFallback2D(canvas, hero) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    function draw() {
      var r = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.strokeStyle = isDark() ? "rgba(122,162,255,0.22)" : "rgba(29,78,216,0.2)";
      ctx.lineWidth = 1;
      for (var z = -10; z <= 10; z++) {
        ctx.beginPath();
        for (var x = -14; x <= 14; x++) {
          var d2 = (x - 3) * (x - 3) + z * z;
          var y = -Math.exp(-d2 * 0.04) * 90;
          var sx = r.width * 0.56 + (x - z * 0.65) * 38;
          var sy = r.height * 0.54 + (z * 0.5 + x * 0.14) * 26 - y;
          if (x === -14) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }
    draw();
    window.addEventListener("resize", draw);
    themeHooks.push(draw);
  }

  /* ========================================================================
     2. FIELD NOTEBOOK: 6 LIVE INTERACTIVE PHYSICS SIMULATIONS
     ======================================================================== */

  var specimenApi = {
    setIndex: function () {}
  };

  function initSpecimens() {
    var canvas = document.getElementById("specimenCanvas");
    var stage = document.getElementById("specimenStage");
    var titleEl = document.getElementById("specTitle");
    var eqEl = document.getElementById("specEq");
    var descEl = document.getElementById("specDesc");
    var promptEl = document.getElementById("specPrompt");
    var readoutEl = document.getElementById("specReadout");
    if (!canvas || !stage || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var W = 520, H = 300, dpr = 1;
    var activeIdx = 0;
    var visible = false;
    var running = false;
    var rafId = null;
    var ptr = { x: W * 0.5, y: H * 0.5, down: false, inside: false };

    var META = [
      {
        title: "Construction",
        eq: "ΣF = 0 · Verlet truss dynamics",
        desc: "My roots — the first industry to show me how widespread the inefficiency and incapability in our country's businesses really are.",
        prompt: "Drag any joint to stress-test the truss"
      },
      {
        title: "Energy",
        eq: "P = V · I · cos φ · grid flux",
        desc: "Compute's next real constraint — the physics, transmission, and generation at the boundary where the grid meets the data center.",
        prompt: "Move cursor to bend electromagnetic flux"
      },
      {
        title: "Chips",
        eq: "P(s) ∝ exp(−E(s) / kT) · Ising lattice",
        desc: "Thermodynamic sampling hardware, analog stochastic substrates, and whatever comes after deterministic digital silicon.",
        prompt: "Hover or click to inject thermal noise kT"
      },
      {
        title: "Robotics",
        eq: "FABRIK 3-DOF inverse kinematics",
        desc: "Physical labor is the ultimate bottleneck in the real economy; capable embodiment is the unlock.",
        prompt: "Move cursor to guide end-effector · Hold to weld"
      },
      {
        title: "Space & Orbital",
        eq: "r̈ = −μ r / |r|³ · symplectic N-body",
        desc: "The cleanest systems problem there is: pure mass, energy, and timing, with zero room for hand-waving.",
        prompt: "Click to launch a satellite into orbit"
      },
      {
        title: "Quantum Mechanics",
        eq: "iℏ ∂|ψ⟩/∂t = Ĥ|ψ⟩ · 3D complex helix",
        desc: "The substrate under everything above.",
        prompt: "Click to perform a measurement & collapse |ψ⟩"
      }
    ];

    function pal() {
      if (isDark()) {
        return {
          ink: "#eceae4",
          inkSoft: "rgba(236, 234, 228, 0.52)",
          faint: "rgba(236, 234, 228, 0.14)",
          accent: "#7aa2ff",
          accentSoft: "rgba(122, 162, 255, 0.24)",
          cyan: "#5ce1e6",
          warm: "#f59e0b"
        };
      }
      return {
        ink: "#161614",
        inkSoft: "rgba(22, 22, 20, 0.55)",
        faint: "rgba(22, 22, 20, 0.12)",
        accent: "#1d4ed8",
        accentSoft: "rgba(29, 78, 216, 0.18)",
        cyan: "#0e7490",
        warm: "#c2410c"
      };
    }

    // ---------- Sim 0: Verlet Structural Truss ----------
    var truss = { nodes: [], sticks: [], grabbed: -1 };
    function initTruss() {
      truss.nodes = [];
      truss.sticks = [];
      var spans = 6;
      var left = W * 0.12, right = W * 0.88;
      var topY = H * 0.36, botY = H * 0.68;
      for (var i = 0; i <= spans; i++) {
        var x = left + ((right - left) * i) / spans;
        truss.nodes.push({ x: x, y: botY, ox: x, oy: botY, pin: i === 0 || i === spans });
      }
      for (var j = 0; j < spans; j++) {
        var mx = left + ((right - left) * (j + 0.5)) / spans;
        truss.nodes.push({ x: mx, y: topY, ox: mx, oy: topY, pin: false });
      }
      function link(a, b) {
        var na = truss.nodes[a], nb = truss.nodes[b];
        truss.sticks.push({ a: a, b: b, len: Math.hypot(nb.x - na.x, nb.y - na.y) });
      }
      for (var k = 0; k < spans; k++) {
        link(k, k + 1);
        link(k, spans + 1 + k);
        link(k + 1, spans + 1 + k);
        if (k < spans - 1) link(spans + 1 + k, spans + 2 + k);
      }
    }

    function stepTruss(t, c) {
      var nodes = truss.nodes, sticks = truss.sticks;
      var loadNode = 3;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.pin) continue;
        if (i === truss.grabbed && ptr.down) {
          n.x = ptr.x; n.y = ptr.y; n.ox = n.x; n.oy = n.y;
          continue;
        }
        var vx = (n.x - n.ox) * 0.96;
        var vy = (n.y - n.oy) * 0.96;
        n.ox = n.x; n.oy = n.y;
        n.x += vx;
        n.y += vy + 0.16 + (i === loadNode ? Math.sin(t * 2.1) * 0.22 : 0);
      }
      for (var it = 0; it < 12; it++) {
        for (var s = 0; s < sticks.length; s++) {
          var st = sticks[s];
          var a = nodes[st.a], b = nodes[st.b];
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist = Math.hypot(dx, dy) || 1;
          var diff = (dist - st.len) / dist;
          st.stress = diff;
          var offX = dx * diff * 0.5, offY = dy * diff * 0.5;
          if (!a.pin && st.a !== truss.grabbed) { a.x += offX; a.y += offY; }
          if (!b.pin && st.b !== truss.grabbed) { b.x -= offX; b.y -= offY; }
        }
      }

      // Draw ground supports
      ctx.strokeStyle = c.faint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.78); ctx.lineTo(W * 0.94, H * 0.78);
      ctx.stroke();

      var peakStress = 0;
      for (var d = 0; d < sticks.length; d++) {
        var sk = sticks[d];
        var na = nodes[sk.a], nb = nodes[sk.b];
        var str = Math.abs(sk.stress || 0) * 65;
        if (str > peakStress) peakStress = str;
        ctx.strokeStyle = str > 0.28 ? (sk.stress > 0 ? c.accent : c.warm) : c.inkSoft;
        ctx.lineWidth = 1.4 + Math.min(str * 2.2, 2.2);
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }
      for (var ni = 0; ni < nodes.length; ni++) {
        var nd = nodes[ni];
        ctx.fillStyle = nd.pin ? c.accent : (ni === truss.grabbed ? c.cyan : c.ink);
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.pin ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (readoutEl) readoutEl.textContent = "max ε = " + (peakStress * 10).toFixed(2) + " mε";
    }

    // ---------- Sim 1: 3D Electromagnetic Grid & Power Flow ----------
    var pulses = [];
    for (var pe = 0; pe < 18; pe++) {
      pulses.push({ t: Math.random(), lane: pe % 3, speed: 0.22 + (pe % 3) * 0.06 });
    }
    function stepEnergy(t, c) {
      var pylons = [W * 0.16, W * 0.44, W * 0.72];
      var baseY = H * 0.78;
      var topY = H * 0.26;
      // Field lines bent by pointer
      ctx.strokeStyle = c.faint;
      ctx.lineWidth = 0.85;
      for (var row = 0; row < 7; row++) {
        var gy = H * (0.16 + row * 0.105);
        ctx.beginPath();
        for (var gx = 20; gx <= W - 20; gx += 12) {
          var dx = gx - ptr.x, dy = gy - ptr.y;
          var d2 = dx * dx + dy * dy + 2200;
          var bend = ptr.inside ? (-26000 / d2) * Math.sin((gy - ptr.y) * 0.025) : 0;
          var wave = Math.sin(gx * 0.025 - t * 2.8 + row * 0.6) * 5;
          var yy = gy + wave + bend;
          if (gx === 20) ctx.moveTo(gx, yy); else ctx.lineTo(gx, yy);
        }
        ctx.stroke();
      }
      // Pylons
      ctx.strokeStyle = c.inkSoft;
      ctx.lineWidth = 1.3;
      for (var p = 0; p < pylons.length; p++) {
        var px = pylons[p];
        ctx.beginPath();
        ctx.moveTo(px - 18, baseY); ctx.lineTo(px, topY); ctx.lineTo(px + 18, baseY);
        ctx.moveTo(px - 26, topY + 14); ctx.lineTo(px + 26, topY + 14);
        ctx.moveTo(px - 10, baseY - 40); ctx.lineTo(px + 10, baseY - 40);
        ctx.stroke();
      }
      // Data center rack block on right
      var dcx = W * 0.84, dcy = H * 0.42;
      ctx.strokeStyle = c.ink;
      ctx.strokeRect(dcx, dcy, 44, baseY - dcy);
      // Conductors + traveling energy pulses
      var lanes = [topY + 14, topY + 26, topY + 38];
      for (var l = 0; l < 3; l++) {
        var ly = lanes[l];
        ctx.strokeStyle = c.inkSoft;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, ly + 8);
        for (var seg = 0; seg < pylons.length; seg++) {
          var x1 = seg === 0 ? 0 : pylons[seg - 1];
          var x2 = pylons[seg];
          ctx.quadraticCurveTo((x1 + x2) * 0.5, ly + 22, x2, ly);
        }
        ctx.quadraticCurveTo((pylons[2] + dcx) * 0.5, ly + 24, dcx, dcy + 14 + l * 16);
        ctx.stroke();
      }
      var load = 0;
      for (var u = 0; u < pulses.length; u++) {
        var pu = pulses[u];
        pu.t = (pu.t + pu.speed * 0.012) % 1;
        var xx = pu.t * dcx;
        var ly2 = lanes[pu.lane] + Math.sin(pu.t * Math.PI * 3.5) * 10 + 6;
        if (pu.t > 0.88) load++;
        ctx.fillStyle = pu.lane === 1 ? c.cyan : c.accent;
        ctx.beginPath();
        ctx.arc(xx, ly2, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Blinking rack LEDs driven by arriving packets
      for (var r = 0; r < 5; r++) {
        var hot = ((Math.floor(t * 6) + r) % 3 === 0) || load > 1;
        ctx.fillStyle = hot ? c.accent : c.faint;
        ctx.fillRect(dcx + 8, dcy + 12 + r * 17, 20, 3);
        ctx.fillStyle = hot ? c.cyan : c.faint;
        ctx.beginPath();
        ctx.arc(dcx + 35, dcy + 13.5 + r * 17, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (readoutEl) readoutEl.textContent = "grid = 345 kV · " + (94 + Math.round(Math.sin(t * 2) * 4)) + " MW";
    }

    // ---------- Sim 2: Real-Time 3D Tilted Ising / Boltzmann Spin Lattice ----------
    var IG = 18;
    var spins = new Int8Array(IG * IG);
    for (var si = 0; si < spins.length; si++) spins[si] = Math.random() < 0.5 ? 1 : -1;

    function stepIsing(t, c) {
      // Metropolis-Hastings Monte Carlo updates each frame
      var baseT = 1.65 + Math.sin(t * 0.45) * 0.55;
      for (var k = 0; k < 48; k++) {
        var ix = (Math.random() * IG) | 0;
        var iy = (Math.random() * IG) | 0;
        var idx = iy * IG + ix;
        var s = spins[idx];
        var sumN =
          spins[iy * IG + ((ix + 1) % IG)] +
          spins[iy * IG + ((ix - 1 + IG) % IG)] +
          spins[((iy + 1) % IG) * IG + ix] +
          spins[((iy - 1 + IG) % IG) * IG + ix];
        var dE = 2 * s * sumN;
        // Local cursor thermal heating
        var px = W * 0.5 + (ix - iy) * 11.5;
        var py = H * 0.16 + (ix + iy) * 5.6;
        var distP = ptr.inside ? Math.hypot(px - ptr.x, py - ptr.y) : 999;
        var localT = distP < 70 ? baseT + (ptr.down ? 6.5 : 3.2) * (1 - distP / 70) : baseT;
        if (dE <= 0 || Math.random() < Math.exp(-dE / Math.max(localT, 0.2))) {
          spins[idx] = -s;
        }
      }

      // Isometric 3D lattice render
      var mag = 0;
      for (var y = 0; y < IG; y++) {
        for (var x = 0; x < IG; x++) {
          var v = spins[y * IG + x];
          mag += v;
          var sx = W * 0.5 + (x - y) * 11.5;
          var sy = H * 0.17 + (x + y) * 5.5 - (v > 0 ? 5.5 : -2.5);
          ctx.strokeStyle = v > 0 ? c.accent : c.faint;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(sx, sy + 7);
          ctx.lineTo(sx, sy - 4);
          ctx.stroke();

          ctx.fillStyle = v > 0 ? c.accent : c.inkSoft;
          ctx.beginPath();
          ctx.arc(sx, sy - 4, v > 0 ? 2.6 : 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      var mVal = Math.abs(mag / spins.length);
      if (readoutEl) readoutEl.textContent = "kT = " + baseT.toFixed(2) + " · |M| = " + mVal.toFixed(2);
    }

    // ---------- Sim 3: Live 3-DOF Inverse Kinematics Robotic Arm ----------
    var ikTarget = { x: W * 0.68, y: H * 0.42 };
    var ikLens = [84, 72, 46];
    var ikPts = [{ x: W * 0.24, y: H * 0.78 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    var weldSparks = [];
    for (var wi = 1; wi < 4; wi++) {
      ikPts[wi].x = ikPts[wi - 1].x + ikLens[wi - 1] * 0.6;
      ikPts[wi].y = ikPts[wi - 1].y - ikLens[wi - 1] * 0.4;
    }

    function stepRobotics(t, c) {
      var base = { x: W * 0.24, y: H * 0.78 };
      var tx = ptr.inside ? ptr.x : (W * 0.62 + Math.cos(t * 1.15) * 65);
      var ty = ptr.inside ? ptr.y : (H * 0.44 + Math.sin(t * 1.7) * 48);
      ikTarget.x += (tx - ikTarget.x) * 0.14;
      ikTarget.y += (ty - ikTarget.y) * 0.14;

      // FABRIK solver (6 iterations)
      ikPts[0].x = base.x; ikPts[0].y = base.y;
      for (var it = 0; it < 6; it++) {
        ikPts[3].x = ikTarget.x; ikPts[3].y = ikTarget.y;
        for (var i = 2; i >= 0; i--) {
          var dx = ikPts[i].x - ikPts[i + 1].x;
          var dy = ikPts[i].y - ikPts[i + 1].y;
          var d = Math.hypot(dx, dy) || 1;
          ikPts[i].x = ikPts[i + 1].x + (dx / d) * ikLens[i];
          ikPts[i].y = ikPts[i + 1].y + (dy / d) * ikLens[i];
        }
        ikPts[0].x = base.x; ikPts[0].y = base.y;
        for (var j = 1; j < 4; j++) {
          var dx2 = ikPts[j].x - ikPts[j - 1].x;
          var dy2 = ikPts[j].y - ikPts[j - 1].y;
          var d2 = Math.hypot(dx2, dy2) || 1;
          ikPts[j].x = ikPts[j - 1].x + (dx2 / d2) * ikLens[j - 1];
          ikPts[j].y = ikPts[j - 1].y + (dy2 / d2) * ikLens[j - 1];
        }
      }

      // Draw workspace reach arc & floor
      ctx.strokeStyle = c.faint;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(base.x, base.y, ikLens[0] + ikLens[1] + ikLens[2], -Math.PI * 0.95, 0.1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(W * 0.08, base.y + 8); ctx.lineTo(W * 0.92, base.y + 8);
      ctx.stroke();

      // Base pedestal
      ctx.fillStyle = c.inkSoft;
      ctx.fillRect(base.x - 20, base.y, 40, 8);

      // Links
      for (var l = 0; l < 3; l++) {
        ctx.strokeStyle = l === 2 ? c.accent : c.ink;
        ctx.lineWidth = 6 - l * 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ikPts[l].x, ikPts[l].y);
        ctx.lineTo(ikPts[l + 1].x, ikPts[l + 1].y);
        ctx.stroke();
      }
      // Joints
      for (var jo = 0; jo < 4; jo++) {
        ctx.fillStyle = jo === 3 ? c.accent : c.ink;
        ctx.beginPath();
        ctx.arc(ikPts[jo].x, ikPts[jo].y, jo === 3 ? 4.2 : 5.5 - jo * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Welding sparks when holding pointer or near target
      if (ptr.down || !ptr.inside) {
        for (var sp = 0; sp < (ptr.down ? 4 : 1); sp++) {
          weldSparks.push({
            x: ikPts[3].x, y: ikPts[3].y,
            vx: (Math.random() - 0.5) * 4.5,
            vy: -Math.random() * 3.5,
            life: 1
          });
        }
      }
      for (var k = weldSparks.length - 1; k >= 0; k--) {
        var ws = weldSparks[k];
        ws.x += ws.vx; ws.y += ws.vy; ws.vy += 0.18; ws.life -= 0.045;
        if (ws.life <= 0) { weldSparks.splice(k, 1); continue; }
        ctx.globalAlpha = ws.life;
        ctx.strokeStyle = ws.life > 0.5 ? c.cyan : c.accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ws.x, ws.y);
        ctx.lineTo(ws.x - ws.vx * 1.8, ws.y - ws.vy * 1.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      var th1 = Math.round(Math.atan2(ikPts[1].y - ikPts[0].y, ikPts[1].x - ikPts[0].x) * -57.3);
      var th2 = Math.round(Math.atan2(ikPts[2].y - ikPts[1].y, ikPts[2].x - ikPts[1].x) * -57.3);
      if (readoutEl) readoutEl.textContent = "θ₁ = " + th1 + "° · θ₂ = " + th2 + "°";
    }

    // ---------- Sim 4: Real-Time 3D Symplectic Orbital N-Body ----------
    var bodies = [];
    function initOrbits() {
      bodies = [
        { x: 118, y: 0, vx: 0, vy: 2.05, trail: [], acc: true },
        { x: -165, y: 12, vx: 0.12, vy: -1.62, trail: [], acc: false },
        { x: 0, y: -82, vx: 2.55, vy: 0.18, trail: [], acc: true }
      ];
    }
    initOrbits();

    function launchSatellite(cx, cy) {
      var rx = cx - W * 0.5;
      var ry = (cy - H * 0.5) / 0.58;
      var r = Math.hypot(rx, ry);
      if (r < 28) return;
      var mu = 520;
      var vCirc = Math.sqrt(mu / r) * (0.9 + Math.random() * 0.22);
      bodies.push({
        x: rx, y: ry,
        vx: (-ry / r) * vCirc,
        vy: (rx / r) * vCirc,
        trail: [],
        acc: true
      });
      if (bodies.length > 9) bodies.shift();
    }

    function stepOrbital(t, c) {
      var cx = W * 0.5, cy = H * 0.5;
      var mu = 520;
      var squash = 0.58;

      // Reference orbital grid rings
      ctx.strokeStyle = c.faint;
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 5]);
      [75, 130, 185].forEach(function (rad) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad, rad * squash, -0.18, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Central planet with wireframe meridian
      ctx.fillStyle = c.accentSoft;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, 7.5, 18, 0, 0, Math.PI * 2); ctx.stroke();

      var cosT = Math.cos(-0.18), sinT = Math.sin(-0.18);
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        // Velocity-Verlet substeps
        for (var sub = 0; sub < 2; sub++) {
          var r2 = b.x * b.x + b.y * b.y + 320;
          var r = Math.sqrt(r2);
          var f = -mu / (r2 * r);
          b.vx += f * b.x * 0.45;
          b.vy += f * b.y * 0.45;
          b.x += b.vx * 0.45;
          b.y += b.vy * 0.45;
        }
        var px = cx + (b.x * cosT - b.y * squash * sinT);
        var py = cy + (b.x * sinT + b.y * squash * cosT);
        b.trail.push([px, py]);
        if (b.trail.length > 52) b.trail.shift();

        if (b.trail.length > 1) {
          ctx.strokeStyle = b.acc ? c.accent : c.inkSoft;
          ctx.lineWidth = b.acc ? 1.5 : 1.1;
          ctx.beginPath();
          ctx.moveTo(b.trail[0][0], b.trail[0][1]);
          for (var ti = 1; ti < b.trail.length; ti++) {
            ctx.lineTo(b.trail[ti][0], b.trail[ti][1]);
          }
          ctx.stroke();
        }
        ctx.fillStyle = b.acc ? c.accent : c.ink;
        ctx.beginPath();
        ctx.arc(px, py, b.acc ? 3.4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (readoutEl) readoutEl.textContent = "n = " + bodies.length + " bodies · Verlet 2×";
    }

    // ---------- Sim 5: 3D Complex Quantum Wavepacket + Measurement Collapse ----------
    var qState = { sigma: 42, center: 0.5, collapsedAt: -10, pulseR: 0 };
    function collapseWave(xPx) {
      qState.center = Math.max(0.18, Math.min(0.82, xPx / Math.max(W, 1)));
      qState.sigma = 6.5;
      qState.collapsedAt = performance.now() / 1000;
      qState.pulseR = 1;
    }

    function stepQuantum(t, c) {
      // Schrödinger spreading after measurement collapse
      if (qState.sigma < 52) {
        qState.sigma += (52 - qState.sigma) * 0.018;
      }
      var midY = H * 0.52;
      var cx = qState.center * W;
      var amp = Math.min(82, 46 * Math.sqrt(42 / Math.max(qState.sigma, 6)));

      // Axis
      ctx.strokeStyle = c.faint;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(22, midY); ctx.lineTo(W - 22, midY); ctx.stroke();

      // Probability envelope ±|ψ(x)|
      ctx.strokeStyle = c.inkSoft;
      ctx.setLineDash([3, 4]);
      for (var sign = -1; sign <= 1; sign += 2) {
        ctx.beginPath();
        for (var x = 22; x <= W - 22; x += 4) {
          var dx = x - cx;
          var env = Math.exp(-(dx * dx) / (2 * qState.sigma * qState.sigma)) * amp;
          var y = midY + sign * env;
          if (x === 22) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 3D projected complex phase helix: Re(ψ) + Im(ψ) tilted into depth
      ctx.strokeStyle = c.cyan;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (var xi = 22; xi <= W - 22; xi += 3) {
        var dxi = xi - cx;
        var envI = Math.exp(-(dxi * dxi) / (2 * qState.sigma * qState.sigma)) * amp;
        var phase = dxi * 0.14 - t * 4.4;
        var imY = midY - Math.sin(phase) * envI * 0.55;
        if (xi === 22) ctx.moveTo(xi, imY); else ctx.lineTo(xi, imY);
      }
      ctx.stroke();

      // Real component Re(ψ) + phase spokes connecting helix
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      for (var xr = 22; xr <= W - 22; xr += 3) {
        var dxr = xr - cx;
        var envR = Math.exp(-(dxr * dxr) / (2 * qState.sigma * qState.sigma)) * amp;
        var phR = dxr * 0.14 - t * 4.4;
        var reY = midY - Math.cos(phR) * envR;
        if (xr === 22) ctx.moveTo(xr, reY); else ctx.lineTo(xr, reY);
      }
      ctx.stroke();

      // Measurement shock ring
      if (qState.pulseR > 0 && qState.pulseR < 110) {
        qState.pulseR += 3.2;
        ctx.globalAlpha = Math.max(0, 1 - qState.pulseR / 110);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, midY, qState.pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (readoutEl) readoutEl.textContent = "Δx = " + (qState.sigma * 0.08).toFixed(2) + " nm · ⟨|ψ|²⟩ = 1";
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(240, r.width);
      H = Math.max(200, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initTruss();
    }

    function render(now) {
      var t = now / 1000;
      var c = pal();
      ctx.clearRect(0, 0, W, H);
      if (activeIdx === 0) stepTruss(t, c);
      else if (activeIdx === 1) stepEnergy(t, c);
      else if (activeIdx === 2) stepIsing(t, c);
      else if (activeIdx === 3) stepRobotics(t, c);
      else if (activeIdx === 4) stepOrbital(t, c);
      else stepQuantum(t, c);
    }

    function loop(now) {
      if (!running) return;
      render(now);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function setSpecimen(idx) {
      activeIdx = idx;
      var m = META[idx] || META[0];
      if (titleEl) titleEl.textContent = m.title;
      if (eqEl) eqEl.textContent = m.eq;
      if (descEl) descEl.textContent = m.desc;
      if (promptEl) promptEl.textContent = m.prompt;
      if (reduced) render(performance.now());
    }
    specimenApi.setIndex = setSpecimen;

    // Pointer interaction on specimen canvas
    function localPt(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener("pointermove", function (e) {
      var p = localPt(e);
      ptr.x = p.x; ptr.y = p.y; ptr.inside = true;
    });
    canvas.addEventListener("pointerleave", function () {
      ptr.inside = false; ptr.down = false; truss.grabbed = -1;
    });
    canvas.addEventListener("pointerdown", function (e) {
      var p = localPt(e);
      ptr.x = p.x; ptr.y = p.y; ptr.down = true; ptr.inside = true;
      if (activeIdx === 0) {
        var best = -1, bestD = 28;
        for (var i = 0; i < truss.nodes.length; i++) {
          if (truss.nodes[i].pin) continue;
          var d = Math.hypot(truss.nodes[i].x - p.x, truss.nodes[i].y - p.y);
          if (d < bestD) { bestD = d; best = i; }
        }
        truss.grabbed = best;
      } else if (activeIdx === 4) {
        launchSatellite(p.x, p.y);
      } else if (activeIdx === 5) {
        collapseWave(p.x);
      }
    });
    window.addEventListener("pointerup", function () {
      ptr.down = false;
      truss.grabbed = -1;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.05 }).observe(stage);
    } else {
      visible = true;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resize();
        if (reduced) render(performance.now());
      }, 140);
    });

    themeHooks.push(function () {
      if (reduced) render(performance.now());
    });

    resize();
    setSpecimen(0);
    render(performance.now());
    start();
  }

  /* ========================================================================
     PUBLIC BRIDGE FOR main.js
     ======================================================================== */

  window.BenPhysics = {
    pulseHero: function () { heroApi.pulse(); },
    setHeroScroll: function (p, vel) { heroApi.setScroll(p, vel); },
    setSpecimen: function (idx) { specimenApi.setIndex(idx); },
    notifyTheme: function () {
      themeHooks.forEach(function (fn) { fn(); });
    }
  };

  initHeroManifold();
  initSpecimens();
})();
