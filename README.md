# benyi — personal site

Personal website and professional portfolio for **Benjamin Yi** — CEO & Co-Founder
of [RestoreFast](https://www.restorefast.com), an AI-native contracting platform
serving military housing nationwide.

**Concept: "I restore order."** The site acts out its own thesis — the hero name
arrives as noise and is restored to crisp type; the accent word *order* loads
"water-damaged" (SVG displacement) and settles; the footer's **BREAK THIS PAGE**
button wrecks the page and restores it, reporting the response time.

## Structure

```
index.html                  one-page portfolio (hero / stats / work / path / research / notes / contact)
styles.css                  all site styles, dark + light themes
main.js                     all behavior, every effect gated on prefers-reduced-motion
404.html                    "this page suffered a total loss"
og.png                      1200×630 social share image
favicon.ico                 root favicon for browsers and Google Search
favicon.svg                 scalable favicon source
icon-48.png                 Google Search favicon fallback
icon-192.png                high-resolution web app icon
apple-touch-icon.png        iOS home-screen icon
site.webmanifest            web app icon metadata
Benjamin-Yi-Resume.pdf      downloadable résumé (linked from Contact)
papers/
  beyond-transformers.html                  paper rendered as HTML in site design
  continuous-thermodynamic-descent.html     paper rendered as HTML in site design
  *.docx                                    original downloads
  img/                                      paper figures
  paper.css                                 article layout extending styles.css
writing/
  *.html                                    essays first published as X Articles, in the paper layout
  img/                                      essay cover images and figures
```

## Stack

Hand-written HTML, CSS, JS. **Zero dependencies, zero build step, zero trackers.**
Two webfonts (Archivo variable + JetBrains Mono) via Google Fonts are the only
external requests.

- Dark-mode-first with a paper light theme (toggle persists in `localStorage`)
- All motion gated behind `prefers-reduced-motion`; axe audit: 0 violations
- Content fully server-rendered: everything readable with JS disabled
- Live Austin clock, count-up stats, scroll reveals via `IntersectionObserver`
- JSON-LD `Person` schema, OG/Twitter cards, skip link, keyboard navigable
- Root favicon assets with stable URLs for Google Search and browser surfaces

## The interaction layer

Drawn from the [ThreeUI](https://threeui.com) catalog (procedural Three.js
backgrounds, pointer-lit browse cards, shader buttons, per-component variant
pickers) and rebuilt here in raw WebGL and CSS — still zero dependencies.

- **The hero field.** A full-bleed procedural backdrop behind the name, one
  fragment shader with three variants: `EMBER` (a dark ground, an undulating
  horizon, heat rising off it), `FLUX` (contours through a domain-warped noise
  field), `MATRIX` (a noise-driven halftone lattice). Raw WebGL 1, ~90 lines of
  GLSL, rendered at 0.7× and paused whenever the hero scrolls out of view or
  the tab is hidden.
- **Two ways to paint it.** The dark theme *emits* — accent glow with a pale
  core. The paper theme *prints*: the same field is screened through a
  30° halftone so it lands as ink rather than a smudge.
- **The variant picker.** The `FIELD ▸ …` chip in the hero cycles the three
  variants and persists the choice — ThreeUI's "fully customizable" idea, in
  miniature. It only appears once a WebGL context actually exists.
- **A dock on phones.** Below 720px the primary nav leaves the header and
  becomes a floating pill dock with live section highlighting — navigation
  that simply wasn't available on mobile before.
- **Scroll progress + current section.** A hairline accent bar under the header
  tracks scroll; nav links carry `aria-current` for the section in view. Works
  on the paper pages too.
- **Pointer-lit cards.** Interest cards, the two-company split, and the paper
  rows track the cursor and light up under it.
- **Kinetic headings.** Section headings arrive a word at a time from behind a
  mask. Non-breaking spaces stay glued, so deliberate line breaks survive.
- **Shader-ish buttons.** A sheen sweep and an accent bloom on the primary CTA;
  a wipe fill on the ghost buttons.
- **Contact rail.** The form now shares a two-column layout with a small
  instrument card (live Austin clock) and the elsewhere links.

Every one of these degrades: without JS the static CSS ember wash, the dock,
and all content remain; without WebGL the field simply never mounts; under
`prefers-reduced-motion` the field renders a single frozen frame, headings
don't split, and nothing sweeps.

## Develop

No tooling needed:

```sh
python3 -m http.server 8080   # or any static server
```

## Deploy — benyi.ai (primary), benyi.co (redirect)

The site is static with no build step; `CNAME` is committed for GitHub Pages
and all absolute URLs (`canonical`, `og:url`, `og:image`, JSON-LD) point at
`https://benyi.ai`.

### GitHub Pages (recommended, free)

1. **Repo settings → Pages**: Source = "Deploy from a branch", Branch = `main`,
   folder `/ (root)`. The committed `CNAME` file sets the custom domain.
2. **DNS for benyi.ai** (at the registrar):
   - Apex `benyi.ai`: four `A` records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
     (optionally `AAAA` → `2606:50c0:8000::153` … `:8003::153`)
   - `www.benyi.ai`: `CNAME` → `bencyi.github.io`
3. Back in **Settings → Pages**, enter `benyi.ai` as the custom domain and tick
   **Enforce HTTPS** once the certificate is issued (can take ~15 min after DNS
   propagates).

### benyi.co → benyi.ai redirect

Don't host a second copy — redirect. Easiest options:
- Registrar-level forwarding (most registrars: "Domain forwarding" →
  `https://benyi.ai`, permanent/301), or
- Put benyi.co on Cloudflare (free) and add a Bulk Redirect / Page Rule:
  `*benyi.co/*` → `https://benyi.ai/$2` (301).

### Alternative: Vercel / Netlify / Cloudflare Pages

Import the repo, no build command, output directory `/`. Add `benyi.ai` as the
production domain and `benyi.co` as a redirect domain. If you go this route,
delete the `CNAME` file (it's GitHub-Pages-specific).

## Content notes

All facts (revenue, agent-runtime numbers, timeline, installations, clients) are
drawn from Ben's résumé (June 2026). The three "Operating Notes" in section 04
are editorial — written in Ben's voice, edit freely. Papers in `papers/` were
converted from the original .docx manuscripts; originals are linked for download
on each paper page.
