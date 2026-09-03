# Pad Koi

**"Where is the pad?"** — A digital menstrual health accessibility platform by **ScriptySphere**.

Pad Koi helps people quickly find nearby stores, pharmacies, supermarkets and emergency pad points that may have menstrual products, and get directions to them — with no account required.

---

## Overview

- **Type:** Static, client-side website (no backend, no database)
- **Stack:** HTML5, CSS3, vanilla JavaScript, JSON
- **Map:** Leaflet + OpenStreetMap (no API key required)
- **Hosting:** GitHub Pages compatible
- **Languages:** English and বাংলা (Bangla)

## Features

- **Find Pads Near Me** — browser geolocation, with a graceful manual-search fallback if location is denied or unavailable
- **Interactive map** with colour-coded markers for stores and Emergency Pad Points
- **Store directory cards** with distance, opening status, verification state, available products and directions
- **Verification system** — Verified / Community reported / Unknown, each with a timestamp
- **Filters** — open now, verified only, available now, store type, distance radius
- **Emergency Mode** (`emergency.html`) — prioritises open, verified and 24-hour locations plus Emergency Pad Points
- **Add a Store** form and a **Store Owner** claim CTA, both pointing at configurable external forms (no fake backend)
- **Knowledge Hub** with concise, non-judgemental menstrual health articles
- **Bangla/English language toggle**, stored per-visitor
- **Privacy-first**: no sign-up, no location history, minimal data collection
- Responsive from 360px mobile to 1920px desktop, with a mobile filter bottom-sheet
- Accessible: semantic HTML, keyboard navigation, visible focus states, ARIA labels, reduced-motion support
- PWA-ready structure (`manifest.json`, icons)

## Project structure

```
pad-koi/
├── index.html          Homepage (hero, search, map, results, how it works, knowledge, impact, about)
├── emergency.html       Dedicated Emergency Mode page
├── stores.html          Add a Store form + Store Owner CTA
├── knowledge.html        Full Knowledge Hub
├── about.html            About Pad Koi / ScriptySphere
├── privacy.html          Privacy explainer
│
├── css/
│   ├── style.css         Design tokens, typography, base layout, hero, footer
│   ├── components.css    Buttons, cards, badges, forms, map, filters
│   └── responsive.css    Breakpoints (mobile / tablet / desktop)
│
├── js/
│   ├── config.js         All configurable values (map, forms, contact email, demo stats)
│   ├── i18n.js            Language loading + toggle
│   ├── stores.js          Data loading, distance calculation, card rendering
│   ├── map.js             Leaflet map wrapper (swap-friendly for Google Maps)
│   ├── filters.js         Filter/sort state and application
│   └── app.js             Page orchestration, geolocation, forms, knowledge hub
│
├── data/
│   ├── stores.json        Store/location data (demo data included, clearly labelled)
│   └── translations.json  English + Bangla strings
│
├── assets/
│   ├── icons/             Favicon (SVG) and PWA icons (192/512/apple-touch)
│   └── images/            Reserved for future images (e.g. Open Graph image)
│
├── manifest.json
├── README.md
└── LICENSE
```

## Run locally

Because the site uses `fetch()` to load JSON, opening `index.html` directly from the filesystem (`file://`) will fail in most browsers due to CORS restrictions on local files. Serve it instead:

```bash
cd pad-koi
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works (e.g. `npx serve`, VS Code "Live Server").

## Deploy to GitHub Pages

1. Push the contents of this folder to a GitHub repository.
2. In the repository settings, go to **Pages**.
3. Set the source to the branch and folder containing these files (e.g. `main` / `/root`, or `/docs` if you move the files there).
4. Save — GitHub will publish at `https://<username>.github.io/<repo>/`.
5. All internal links use relative paths, so the site works both at the root of a domain and inside a subdirectory (e.g. `/pad-koi/`).
6. If you use a custom domain, add a `CNAME` file with your domain and update the `canonical` / Open Graph URLs in each HTML `<head>`.

## How to add stores

Edit `data/stores.json`. Each entry looks like:

```json
{
  "id": "store-001",
  "name": "Example Pharmacy",
  "type": "pharmacy",
  "latitude": 23.8103,
  "longitude": 90.4125,
  "address": "Example address, Dhaka",
  "district": "Dhaka",
  "phone": "+8801XXXXXXXXX",
  "openingHours": "08:00-23:00",
  "is24Hours": false,
  "verified": true,
  "lastVerified": "2026-09-01T09:30:00+06:00",
  "availabilityStatus": "verified",
  "products": ["Regular Pad", "Overnight Pad"],
  "isEmergencyPoint": false,
  "isDemo": false
}
```

- `type` must be one of: `pharmacy`, `supermarket`, `convenience`, `shop`, `emergency`, `vending`.
- `availabilityStatus` must be one of: `verified`, `community`, `unknown`.
- Set `isDemo: false` for real, verified locations — demo entries are labelled "Demo store" in the UI.
- Remove the demo entries in `data/stores.json` before a public launch, or leave them and add real ones alongside; either way keep `isDemo` accurate.

## How to update translations

Edit `data/translations.json`. It has two top-level keys, `en` and `bn`, each a flat map of translation keys to strings. Add a new key to both languages and reference it in HTML with `data-i18n="your.key"` (or `data-i18n-placeholder` / `data-i18n-aria-label` for input placeholders and ARIA labels).

## How to configure Google Maps directions / API key

Pad Koi's "Get Directions" buttons already work without any API key — they build a standard Google Maps directions URL from each store's latitude/longitude.

The map *display* itself uses Leaflet + OpenStreetMap by default (no key needed). If you later want to switch the map display to Google Maps:

1. Obtain a Google Maps JavaScript API key.
2. Set it in `js/config.js` under `map.googleMapsApiKey` (never commit a real key to a public repository — inject it at build/deploy time instead).
3. Set `map.provider` to `"google"` in `js/config.js`.
4. Rewrite `js/map.js` to initialise a Google `Map` instead of a Leaflet map; the rest of the app calls only `PadKoiMap.init`, `setMarkers`, `setUserLocation` and `highlightMarker`, so no other file needs to change.

## How to configure store submissions

Pad Koi is a static site, so form submissions need an external endpoint. In `js/config.js`:

```js
submissions: {
  addStoreFormUrl: "YOUR_GOOGLE_FORM_URL_HERE",
  claimStoreFormUrl: "YOUR_STORE_OWNER_FORM_URL_HERE",
  contactEmail: "hello@scriptysphere.example",
}
```

- Create a Google Form (or any form service) with matching fields and paste its URL into `addStoreFormUrl` — the in-page form will open it in a new tab on submit.
- Do the same for `claimStoreFormUrl` for the store-owner CTA.
- Update `contactEmail` to a real inbox; it's used in the footer, privacy page and `mailto:` links.

## How to replace demo data

1. Open `data/stores.json`.
2. Replace the sample entries under `"stores"` with real, verified locations (or add to them).
3. Set `isDemo: false` on real entries.
4. Update `js/config.js` → `impactDemo` with real, verified statistics once available, and update the "Demo data" label copy in `data/translations.json` (`impact.note`) if you want to remove the disclaimer.

## How to change branding

- **Colours:** CSS variables at the top of `css/style.css` (`--color-primary`, `--color-primary-dark`, etc.).
- **Fonts:** the Google Fonts `<link>` in each HTML `<head>` (Sora for display, Work Sans for body, Noto Sans Bengali for Bangla) and the `--font-display` / `--font-body` variables in `css/style.css`.
- **Logo:** an inline SVG wordmark (`.brand__mark`) repeated in each page's header/footer, plus `assets/icons/favicon.svg`. Edit the SVG paths or regenerate the PNG icons in `assets/icons/` to update it everywhere.
- **Copy:** all UI text lives in `data/translations.json`; long-form page content (About, Privacy, Knowledge Hub) lives directly in the relevant HTML/JS files.

## Accessibility & performance notes

- Colour is never the only signal for availability or open/closed status — text labels always accompany badges and pills.
- The map has an accessible label and results are also available as a plain list, so map failure doesn't block the core task.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
- No build step, no heavy frameworks, no autoplay media — the site is designed to stay fast on slower mobile connections.

## Future backend integration notes

This MVP intentionally has no backend. When Pad Koi is ready to scale (see the project brief's Phase 3–6 roadmap: verification workflows, institutional dashboards, real-time availability, analytics), the natural next steps are:

1. Replace `data/stores.json` with a real API endpoint in `js/config.js` (`data.storesUrl`), keeping the same JSON shape so `stores.js` needs minimal changes.
2. Add authenticated endpoints for store-owner claim/update flows, replacing the external-form CTA in `stores.html`.
3. Add a moderation queue for community submissions and community availability reports, replacing the current "opens an external form" flow.
4. Consider a lightweight service worker for offline shell caching once the data layer is dynamic (the current structure is service-worker-ready but does not ship one, to avoid caching stale location data).

---

**Pad Koi** is a project of **ScriptySphere**.
