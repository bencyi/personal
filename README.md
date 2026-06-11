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
