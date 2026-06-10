# Design Research: Building a Top-Tier Personal Portfolio

> Synthesized June 2026 from a five-track research effort: (1) award-winning portfolios
> (Awwwards / FWA / CSS Design Awards / Godly), (2) deep teardowns of legendary personal
> sites, (3) the techniques and tech stacks behind them, (4) 2025–2026 design trends,
> and (5) the UX-effectiveness evidence (what visitors and recruiters actually respond to).
> Sources are linked throughout. Claims that could not be fully verified are flagged.

---

## 1. TL;DR — The Strategy That the Evidence Supports

1. **One sentence of hook.** Every legendary portfolio compresses to a single line:
   *"drive a car through his résumé"* (Bruno Simon), *"the Mario CV"* (Robby Leonardi),
   *"the ramen shop"* (Jesse Zhou), *"her site changes when you resize it"* (Lynn Fisher),
   *"the face split in half"* (Adham Dannaway). If the concept needs a paragraph, it won't spread.
2. **The medium must demonstrate the skill being sold.** The portfolio is itself the work
   sample, not a container for work samples. Bruno sells WebGL → the site is WebGL.
   Lynn sells CSS → it's CSS-only art.
3. **Hybrid architecture wins.** The best-evidenced pattern is a fast, server-rendered,
   accessible HTML core with the extravagant layer added as progressive enhancement
   (the [14islands pattern](https://14islands.com/blog/progressive-enhancement-with-webgl-and-react)).
   Even the canonical maximalist (Bruno Simon) ships obsessive performance work underneath.
4. **Never gate content behind the spectacle.** Navigation visible immediately, skip
   options, `prefers-reduced-motion` honored, native scroll preserved. Recruiters spend
   under 2 minutes; the showpiece must not cost them their first 10 seconds.
5. **Pre-compute the spectacle.** Baked Blender lighting, image-based "screens,"
   device-tier detection — the shared secret of every smooth 3D portfolio is faking
   expensive things.
6. **Ship a "how I built it" artifact.** The write-up often spreads further than the site
   (Bruno's case study, Jesse Zhou's Medium post, Lynn Fisher's yearly case studies).

---

## 2. Hall of Fame — Sites to Study

### Tier 1: Extravagant / experiential (the site is a world)

| Site | Who | The hook | Why it matters |
|---|---|---|---|
| [bruno-simon.com](https://bruno-simon.com/) | Bruno Simon, creative dev | Drive a physics-simulated car through a 3D world résumé | The most famous personal site ever. 2019: Awwwards SOTD/SOTM, FWA, CSSDA. The 2025 rebuild (Awwwards SOTM early 2026 — month conflictingly reported as Jan/Feb) adds a racetrack with global leaderboard, spatial audio, and subtle multiplayer ("Whispers" — user-placed flame messages, moderated via OpenAI). Three.js with WebGPU→WebGL auto-fallback, TSL shaders. [Case study](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b) |
| [rleonardi.com](http://www.rleonardi.com/) | Robby Leonardi, designer/illustrator | Side-scrolling Mario-style platformer résumé driven entirely by scroll | The ur-gamified CV (2013). Scroll-only control = zero onboarding cost; game completion instinct pulls visitors through the whole CV. FWA/Awwwards/CSSDA. Also the poster child for the scrolljacking critique. |
| [jesse-zhou.com](https://www.jesse-zhou.com/) | Jesse Zhou | Cyberpunk Tokyo ramen shop; vending machine = project nav | Built in <6 months by a management consultant after Bruno's course. Diegetic navigation, GSAP camera tours, Blender-baked lighting, device-benchmarked quality tiers, and on-screen UIs that are just Photoshop images with 3D hitboxes. [Case study](https://jesse-zhou.medium.com/jesses-ramen-case-study-77bae77ab5f0), [source](https://github.com/enderh3art/Ramen-Shop) |
| [henryheffernan.com](https://henryheffernan.com/) | Henry Heffernan (→ Vercel design engineer) | Zoom into a 3D 90s CRT PC running a fully working fake OS | Genius onboarding: unfamiliar 3D shell hands off to a familiar desktop metaphor. The OS is a separate React app composited into the WebGL scene. React + Three.js. Widely credited with landing him the Vercel role. |
| [samsy.ninja](https://samsy.ninja/) | Samuel Honigstein | Multiplayer cyberpunk city you explore with other visitors | WebGPU renderer at 120+ fps; visitors hang out together while browsing his work. Vue + GSAP + custom WebGL. |
| [joshuas.world](https://www.joshuas.world/) | Joshua von Hofen | Explorable low-poly 3D island telling his journey | Awwwards SOTD. Tight 3-color palette (#23008E, #757BFD, #FF6464) proves extravagance doesn't need a big palette. |
| [robin-noguier.com](https://robin-noguier.com/) | Robin Noguier, interactive designer | WebGL gallery with GLSL distortion scroll | One of the most imitated portfolio patterns of the early 2020s. Awwwards SOTD + Developer Award. |
| [david-hckh.com](https://david-hckh.com/) | David Heckhoff | Video-game playground with animated 3D character | Post-Bruno generation. 2025 stack (from his [public repo](https://github.com/davidhckh/portfolio-2025)): Vue 3 + TS + Vite, GSAP + Lenis, Three.js, Howler audio, GLSL. |
| [niccolomiranda.com](https://www.niccolomiranda.com/) | Niccolò Miranda, design director | Vintage-newspaper "Paper Portfolio" — textures, folds, tears | Awwwards Site of the Month Nov 2021. Storytelling through tactile illustration rather than 3D; built in Webflow; explicitly framed as a design-vs-accessibility balance test. |
| [aristidebenoist.com](https://aristidebenoist.com/) | Aristide Benoist | Buttery WebGL image transitions & scroll choreography | 27× FWA of the Day. The benchmark for pure motion craft. |

### Tier 2: Recent award winners worth studying (2024–2026)

- **[Stefan Vitasović](https://stefanvitasovic.com/)** — typographic animation + WebGL grid; drops WebGL entirely on mobile in favor of native video; Next.js-style R3F on Vercel, video on Cloudflare R2. The best documented modern hybrid ([Codrops case study](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/)).
- **[Cyd Stumpel](https://cydstumpel.nl/)** — Awwwards SOTD built almost entirely with **native CSS** (View Transitions API + scroll-driven animations) with accessibility as a first-class constraint. Proof the platform now does what GSAP hacks used to.
- **[Grégory Lallé](https://gregorylalle.com/)** — deliberately anti-extravagant: "no WebGL, no unnecessary animations," brutalist type-driven design that still won SOTD. Important contrast datapoint.
- **[Stas Bondar](https://stabondar.com/)** — aggressive red/black, physics-based GSAP/Three.js effects, designed 404. (Exact URL unverified by direct fetch.)
- **Igloo Inc** (Awwwards **Site of the Year 2025**, by studio Abeto) — procedural ice crystals, fluid sim, shader-driven UI text, entirely WebGL. The current ceiling of the craft.
- **Lusion v3** (Site of the Year 2024) — Houdini vertex-animation textures (983KB desktop / 246KB mobile cloth sim); notably moved *away* from scroll-hijacked full-screen navigation to a long-scroll one-pager for performance ([case study](https://www.awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html)).

### Tier 3: The elegant-minimal counter-school

| Site | Who | Why it's legendary |
|---|---|---|
| [lynnandtonic.com](https://lynnandtonic.com/) | Lynn Fisher | Annual from-scratch redesign ritual; the magic trick is **browser resize** — 2019's self-portrait cracks open matryoshka-style as you widen the window. Pure handwritten CSS/SVG. [Yearly case studies](https://lynnandtonic.com/thoughts/entries/case-study-2025-refresh/). |
| [brittanychiang.com](https://brittanychiang.com/) | Brittany Chiang | The most-forked dev portfolio ever (dark navy, numbered nav, tabbed experience). Its ubiquity is now its weakness — using anything resembling it signals template-use. |
| [rauno.me](https://rauno.me/) | Rauno Freiberg (Vercel) | Portfolio as a quiet OS — dock, interface sounds, the famous `/craft` experiments. Replaced flashy WebGL as the aspirational reference for the interaction-craft crowd. |
| [paco.me](https://paco.me/) | Paco Coursey (Linear) | Maximal-minimal: almost nothing on the page, every detail obsessively tuned. Restraint as flex — but it only works with reputation attached. |
| [joshwcomeau.com](https://www.joshwcomeau.com/) | Josh Comeau | Interactive blog as portfolio: sound effects, drum machine easter egg, famously elaborate dark-mode toggle — every bit of whimsy gated behind `prefers-reduced-motion`. Next.js + MDX + Linaria. |
| [cassie.codes](https://www.cassie.codes/) | Cassie Evans (GSAP) | SVG-first whimsy: interactive SVG self-portrait, pastel illustration, accessibility taught as first-class. The genre-defining non-WebGL creative portfolio. |
| [adhamdannaway.com](https://www.adhamdannaway.com/) | Adham Dannaway | The iconic split-face hero (half designer / half coder) — one strong concept, unchanged for a decade, with boring-good everything else underneath. |
| [p5aholic.me](https://p5aholic.me/) | Keita Yamada | Ultra-minimal monospace text + subtle generative canvas background. |
| [dennissnellenberg.com](https://dennissnellenberg.com/) | Dennis Snellenberg | The archetype "premium freelancer" site (magnetic buttons, curtain transitions, location widget) — so mass-cloned that a "Copy Dennis" tribute collection won its own Awwwards mention. Study it; don't clone it. |

---

## 3. Trend Report 2025–2026

### Rising / credible (safe high-craft bets)

- **Kinetic / oversized typography as hero** — the strongest consensus trend for 2026. Scroll-reactive headlines, variable fonts morphing on hover, type as the identity element. GSAP SplitText (now free, a11y-aware) is the engine. ([Webflow 2026](https://webflow.com/blog/web-design-trends-2026), [Muzli 2026](https://muz.li/blog/web-design-trends-2026/))
- **WebGPU-procedural 3D** — Three.js `WebGPURenderer` + TSL (write shaders once, auto-fallback to WebGL2). WebGPU supported in all major browsers since Safari 26 (Sept 2025). Bruno Simon's 2025 rebuild and Martin Laxenaire's portfolio already ship on it.
- **Tactile / textural design** — grain, paper, noise overlays, print artifacts; the antidote to sterile-digital. Aurora/mesh gradients + SVG noise rising.
- **"Technical mono" / engineered minimalism** — monospace, schematic lines, terminal-adjacent *without* the fake-shell LARP.
- **Dark glassmorphism** — revived by Apple's Liquid Glass (2025); refraction-style, not frosted-card-on-purple-gradient.
- **Native View Transitions API** — ~85%+ browser coverage; the SPA-feel without Barba.js hacks. Use as progressive enhancement.
- **Bold maximal color systems** replacing safe neutrals.
- **IndieWeb / personal-site renaissance** — yearly-redesign culture, /now pages, handmade-web ethos; the philosophical counterweight to AI-slop and template sameness.

### Stable / mature

- **Dark-mode-first** — no longer a trend, a default (dual themes expected).
- **Scrollytelling** — staple of awarded sites; GSAP ScrollTrigger remains the cross-browser engine, with CSS scroll-driven animations making simple cases cheap. Short horizontal *sections* inside vertical flow are accepted; full-page horizontal hijack is not.

### The cliché watchlist (dated among top-tier designers, mid-2026)

1. **Static Apple-clone bento homepage** — reads as "2024 template"; the format literally became a SaaS (bento.me).
2. **Giant circle custom cursor + magnetic buttons** — documented accessibility backlash ([dbushell.com](https://dbushell.com/2025/10/27/custom-cursor-accessibility/)); now a "junior copying Awwwards" tell unless extremely subtle.
3. **Snellenberg-clone** dark minimal portfolio with curtain transitions — acknowledged by its own creator as mass-copied.
4. **UI-kit neo-brutalism** (thick borders + hard shadows from a component library). Subtler "tactile brutalism" still credible.
5. **Frosted-glass cards on purple mesh gradients** (pre-Liquid-Glass glassmorphism).
6. **Fake-terminal portfolios and Windows-XP desktop clones** — brilliant originals (Heffernan), now genre templates ([awesome-web-desktops](https://github.com/syxanash/awesome-web-desktops) catalogs the flood).
7. **Template "chat with my portfolio" bots** with no design integration — already commodity GitHub template-ware.
8. **Locomotive Scroll, ScrollMagic, "Framer Motion" (the name)** — superseded by Lenis, GSAP ScrollTrigger, and "Motion" respectively.

---

## 4. Technique & Stack Catalog (current as of mid-2026)

### The modern award-site stack

| Layer | Current choice | Notes |
|---|---|---|
| Framework | **Next.js + Vercel** (React/R3F sites) or **Astro** (content-led, islands) or **Vite vanilla TS** (pure-WebGL experiences) | Astro endorsed by Codrops' 2026 tutorials; Vite-vanilla is what Lusion/Bruno-tier experience sites actually use |
| 3D | **Three.js** (r170+); **react-three-fiber v9 + drei** (React 19); **TSL/WebGPURenderer** for the frontier; **OGL** (~29KB) for single-effect sites | Spline = quick hero 3D, not award-tier; heavy runtime |
| Animation | **GSAP 3.13+** — Webflow acquired GreenSock and made **all Club plugins free, including commercial** (Apr 2025): ScrollTrigger, SplitText (rewritten, 7KB, screen-reader aware), Flip, MorphSVG, ScrollSmoother | The de facto scrollytelling engine |
| UI motion (React) | **Motion** (`motion/react` — the merged Framer Motion + Motion One, Nov 2024) | Layout-id shared transitions, gestures |
| Smooth scroll | **Lenis** (darkroom.engineering) — native-scroll-based, keeps accessibility | Replaced Locomotive Scroll; drive Lenis + GSAP + WebGL from a single RAF |
| Page transitions | **View Transitions API** (progressive enhancement) with Barba.js still valid for MPA | Codrops Feb 2026 tutorial: GSAP + Three.js + Astro + Barba |
| Lightweight alt | **anime.js v4** (Apr 2025 rewrite, ~10KB, physics easings) | |

### Signature patterns and how they're built

- **Scroll-driven 3D / scrollytelling**: GSAP ScrollTrigger scrubbing timelines + Lenis; camera paths through baked scenes.
- **Text reveals / kinetic type**: SplitText → staggered char/word/line tweens, masked line reveals.
- **Image distortion on hover**: WebGL plane synced to DOM layout, shader displacement, GSAP-animated uniforms ([Codrops 2025](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/)).
- **Infinite WebGL galleries**: DOM-synced planes, wrapped scroll position, velocity-based deformation.
- **Magnetic buttons / cursor effects**: mousemove + GSAP `quickTo` lerp — cheap, but see cliché watchlist.
- **Preloader as experience**: branded loader masks asset fetch *and shader compilation* (the real WebGL hitch, worst on mobile); progress tied to real load events; doubles as entry animation.

### The performance playbook (what separates winners from jank)

1. **Bake, don't compute**: Blender/Houdini-baked lighting, AO, vertex-animation textures, matcaps instead of real-time lights (Bruno Simon, Jesse Zhou, Lusion).
2. **Device-tier detection**: [`detect-gpu`](https://github.com/pmndrs/detect-gpu) (pmndrs) assigns tier 0–3 → gate particle counts, post-processing, DPR.
3. **Mobile = a different experience, not a scaled-down one**: Vitasović drops WebGL entirely on mobile (native video); Lusion ships ¼-resolution sim data (246KB vs 983KB).
4. **Lazy-load the 3D bundle** after first paint; `frameloop="demand"` when static; static WebP frame instead of 3D on mobile breakpoints = instant LCP.
5. **One RAF** driving Lenis + GSAP + WebGL.
6. **Compress everything**: KTX2/basis textures, Draco/meshopt GLTF, CDN-hosted video as textures.
7. **Honor `prefers-reduced-motion`**: swap parallax/zoom/spin for fades; provide pause controls (WCAG 2.2.2). ~70M+ people have vestibular disorders.

---

## 5. UX Reality Check (the adversarial findings)

- **Reviewers are fast and ruthless**: hiring managers screen in under 2 minutes (often ~1); NN/g's survey of 200+ UX hiring managers says they scan for work samples, your *specific role*, and process — they "rarely read entire portfolios word for word." ([NN/g](https://www.nngroup.com/articles/ux-design-portfolios/))
- **Mobile matters**: ~90% of job seekers use mobile in their search; recruiters open links on phones.
- **Scrolljacking is condemned by usability testing** (NN/g: disorientation, interpreted as bugs). Keep native scroll.
- **Canvas/WebGL content is invisible** to screen readers and SEO unless mirrored in real HTML.
- **But extravagance demonstrably works for the creative niche**: Bruno Simon's portfolio brought 400k+ visitors, "lots of job offers, freelance projects, interviews and even conferences." For creative-dev/agency audiences, the flashy site IS the credential. Awwwards itself scores Usability at 30% — winners are flashy *and* navigable.
- **The resolution**: the [14islands hybrid pattern](https://14islands.com/blog/progressive-enhancement-with-webgl-and-react) ([r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig)) — server-rendered HTML core that works with JS off, one persistent WebGL canvas layered on top, DOM proxy elements keeping native scroll. Plus Josh Comeau's "whimsy with an off-switch" rule.

**Concrete budgets**: interactive in <3s on mobile; initial route JS under ~200KB; 3D bundle lazy-loaded after first paint; name + role + 3 strongest projects scannable in seconds on a phone.

---

## 6. Distilled Design Principles for This Site

1. **Pick one memorable concept and execute it completely.** Concept-led beats feature-led. The hook must fit in a sentence and ideally demonstrate the exact skill being sold.
2. **HTML-first, spectacle second.** All content server-rendered, semantic, keyboard-navigable. WebGL/motion is a layer that enhances — never a gate.
3. **Show nav immediately; never delay name/role/contact.** Skip-intro always available. Loader can be branded but short, and should mask real work (shader compilation).
4. **Motion with rules**: every animation in direct response to user action or scroll intent; everything gated behind `prefers-reduced-motion`; no scroll hijacking; one RAF.
5. **Type can be the spectacle.** Kinetic typography is the highest-credibility, lowest-bundle-cost extravagance available right now. A site can feel award-tier with zero WebGL (see Cyd Stumpel, Grégory Lallé).
6. **Texture kills the template feel**: grain, noise, tactile details, considered easing curves, interface sound (subtle, opt-in) — the underused emotional levers.
7. **Avoid the cliché list** (§3). Especially: no static bento, no giant circle cursor, no curtain-transition Snellenberg clone, no fake terminal.
8. **Dark-mode-first with a real light theme**, bold accent system, not safe neutrals.
9. **3–6 selected projects, 2–3 deep case studies** (problem → role → decisions → measurable outcome). This is what reviewers actually read.
10. **Plan the "how I built it" write-up from day one.** It's part of the artifact.

### Recommended starting stack

- **Next.js (App Router) on Vercel** — or **Astro** if the site leans content/writing-heavy
- **Tailwind or CSS Modules** for the core; semantic HTML throughout
- **GSAP 3.13+ (ScrollTrigger, SplitText, Flip — all free now) + Lenis**
- **Motion (`motion/react`)** for UI-level/layout transitions
- **react-three-fiber v9 + drei** for the 3D layer, lazy-loaded, with `detect-gpu` tiering and a static fallback — only if the chosen concept needs 3D
- **View Transitions API** as progressive enhancement for navigation
- Self-hosted **variable font** with a distinctive display face for the kinetic-type layer

### Three viable concept directions (pick one, go deep)

1. **Kinetic-type editorial** (highest credibility-to-cost ratio): oversized scroll-reactive typography as the identity, tactile grain/texture, technical-mono detailing, immaculate case studies. Ships fast everywhere. (Vitasović / Lallé / Stumpel lineage.)
2. **Hybrid 3D signature moment**: HTML-first site with one unforgettable WebGL set-piece (hero scene or project gallery) layered via the 14islands pattern, baked lighting, mobile fallback to video/WebP. (Vitasović / Robin Noguier lineage.)
3. **Interaction-craft OS**: Rauno-style quiet density — every hover, focus ring, and sound obsessively tuned, a `/craft` section of experiments as the proof of skill. Best if the brand is "design engineer."

---

## Appendix: Verification Notes

- Research conducted via parallel web-search agents; Awwwards, Codrops, Muzli, Webflow, and several portfolio sites blocked direct fetches (403) in this environment, so some details rest on cross-referenced search extracts rather than full-text reads.
- Flagged conflicts/unverified: Bruno Simon 2025 SOTM month (Jan vs Feb 2026); Henry Heffernan's Awwwards HM attribution; exact current URLs for Stas Bondar and Eduard Bodak; Brittany Chiang's post-v4 stack details.
- The "55-second / 2-minute screening" figures come from individual hiring-manager write-ups, not peer-reviewed studies. No controlled study comparing hire rates of flashy vs plain portfolios exists.
