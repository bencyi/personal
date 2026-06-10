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
Benjamin-Yi-Resume.pdf      downloadable résumé (linked from Contact)
papers/
  beyond-transformers.html                  paper rendered as HTML in site design
  continuous-thermodynamic-descent.html     paper rendered as HTML in site design
  *.docx                                    original downloads
  img/                                      paper figures
  paper.css                                 article layout extending styles.css
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

## Develop

No tooling needed:

```sh
python3 -m http.server 8080   # or any static server
```

## Deploy

Any static host works as-is: GitHub Pages (deploy from branch, root), Vercel,
Netlify, Cloudflare Pages — no build command, output directory `/`.

> **Note:** `og:image`, `og:url`, and `canonical` in `index.html` currently point
> at `https://bencyi.github.io/`. Update these three URLs if the site ships on a
> custom domain.

## Content notes

All facts (revenue, agent-runtime numbers, timeline, installations, clients) are
drawn from Ben's résumé (June 2026). The three "Operating Notes" in section 04
are editorial — written in Ben's voice, edit freely. Papers in `papers/` were
converted from the original .docx manuscripts; originals are linked for download
on each paper page.
