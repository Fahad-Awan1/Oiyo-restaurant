# Oiyo · Garden Café website

A multi-page, fully responsive café website with procedural 3D (Three.js), scroll choreography (GSAP + Lenis), an offline chat host and a no-checkout order tray. It is built with Vite as a static site, so it deploys anywhere (Netlify, Vercel, Cloudflare Pages, cPanel).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build
```

Upload the contents of `dist/` to any static host.

## Pages

| Page | Highlights |
|---|---|
| `index.html` | 3D stoneware cup that follows you from the hero into the **Ritual Builder** (drink / milk / sweetness repaint the latte art live), signature picks, story teaser, count-ups, journal preview |
| `menu.html` | Category tabs, Vegan / GF / Nut-free filters, live search, deep links (`#matcha`, `?diet=v`), Chef’s seasonal tray, allergen guide |
| `story.html` | Quality cards, ritual steps, a pinned **horizontal-scroll timeline**, the makers |
| `rituals.html` | Scroll-driven **3D pour-over in four acts** (source → roast → pour → share), interactive **brew timer** with chimes, workshops |
| `visit.html` | Two-step reservation with validation, confirmation reference and **.ics calendar download**; live hours; illustrated map; FAQ |
| `journal.html` | Filterable articles opening in a modal; deep links (`#how-we-whisk`) |
| `404.html` | On-brand “spilled cup” page |

## Where to change things

- **Menu items, prices, hours, address**: `src/data/menu.js`. The menu grid, signature cards, tray and chatbot all read from this file.
- **Journal posts**: `src/data/journal.js`.
- **Chatbot answers**: `src/js/chatbot/knowledge.js`. Each intent has keywords and an answer.
- **Header / footer / chat / tray markup**: `partials/*.html`. These are injected at build time by the small plugin in `vite.config.js`.
- **Colours, fonts, spacing**: the tokens at the top of `src/styles/main.css`.
- **Photos**: `public/img/<name>-{sm,md,lg}.webp`. Replace them with your own using the same names. `npm run images` re-downloads the Unsplash placeholders.
- **Logo / favicons / OG image**: the `logo-mark` symbol in `partials/icons.html`, plus `node scripts/make-assets.mjs`.

## Hooking up real services

These are front-end only today. Each has a clearly marked spot:

- **Reservations**: `submitDetails()` in `src/js/pages/visit.js`. POST the `booking` object to your backend, or to OpenTable / Resy / Formspree.
- **Newsletter**: `initNewsletter()` in `src/js/main.js`.
- **Map / directions**: the Google Maps search link in `visit.html` and `src/data/menu.js`.

## Performance notes

- Three.js (≈140 KB gzip) loads only on pages with a 3D scene, after the page has loaded, and when the scene nears the viewport. Shaders compile asynchronously.
- 3D is skipped, and replaced by the designed photo posters, when the visitor prefers reduced motion, is on Save-Data or 2G, or the browser renders WebGL in software. On phones the decorative particle layers are skipped, and the home cup starts on the first touch or scroll.
- Render loops pause off-screen and in background tabs, and the device pixel ratio is capped.
- Menu and journal HTML are rendered at build time (crawlable, no layout shift). Images ship as WebP in 640/960/1400 widths with `srcset`/`sizes`. Fonts are self-hosted, Latin subsets only.
- Speculation rules prefetch internal pages on hover, and cross-page view transitions are enabled where supported.
