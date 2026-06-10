# benyi — personal site

Personal website and professional portfolio for **Benjamin Yi** — COO & Managing
Partner at [RestoreFast](https://www.restorefast.com).

**Concept: "I restore order."** The site acts out its own thesis — the hero name
arrives as noise and is restored to crisp type; the accent word *order* loads
"water-damaged" (SVG displacement) and settles; the footer's **BREAK THIS PAGE**
button wrecks the page and restores it, reporting the response time.

## Stack

Hand-written `index.html`, `styles.css`, `main.js`. **Zero dependencies, zero
build step, zero trackers.** Two webfonts (Archivo variable + JetBrains Mono)
via Google Fonts are the only external requests.

- Dark-mode-first with a paper light theme (toggle persists in `localStorage`)
- All motion gated behind `prefers-reduced-motion`
- Semantic HTML, skip link, keyboard navigable, JSON-LD `Person` schema
- Live Bethesda clock, count-up stats, scroll reveals via `IntersectionObserver`

## Develop

No tooling needed:

```sh
python3 -m http.server 8080   # or any static server
```

## Deploy

Any static host works as-is:

- **GitHub Pages** — Settings → Pages → deploy from branch (root). Works for
  `bencyi.github.io` or this repo with a custom domain.
- **Vercel / Netlify / Cloudflare Pages** — point at the repo, no build command,
  output directory `/`.

## Content to review before going live

These were drafted from public sources and need Ben's sign-off:

- [ ] **Stats** (`index.html`, stats section): 5,000,000+ sq ft restored, 100+
      emergency responses/yr, 2,400+ workers deployed — from a public interview
      about RestoreFast; verify/update the numbers.
- [ ] **Operating notes** (section 04): three principles written in Ben's voice —
      edit until they actually sound like him.
- [ ] **Off hours** (section 03): descriptions reference side projects from
      private repos in generic terms — confirm comfort level with each line.
- [ ] **Career timeline** (section 02): titles/order from public profiles.
