# AGENTS.md

Instructions for AI coding agents working on **maikelstuivenberg-website** — the personal site and app support pages for [maikelstuivenberg.nl](https://maikelstuivenberg.nl).

## Project overview

| | |
|---|---|
| Purpose | Landing, privacy policy, and contact for apps by Maikel Stuivenberg (Encore, Bravo, Qwixx) |
| Stack | React 19 + TypeScript + Vite 7 |
| UI | Tailwind CSS v4 |
| Routing | React Router DOM 7 (`BrowserRouter`) |
| Backend | None — static client-side SPA |
| Deployment | Cloudflare Pages (static `dist/`) |

## Commands

```bash
npm install
npm run dev       # Local dev server (port 5173)
npm run build     # Production build (tsc + vite)
npm run lint      # ESLint
npm run preview   # Preview production build
```

Node 20+ (see `.nvmrc`).

## Architecture

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level pages (`HomePage`, `PrivacyPage`, `ContactPage`) |
| `src/components/layout/` | `AppShell` layout and `nav-items.ts` navigation config |
| `src/components/PageMeta.tsx` | Per-page `<title>` and meta description |
| `src/lib/constants.ts` | Shared constants (e.g. contact email) |
| `src/lib/utils.ts` | `cn()` helper for Tailwind class merging |
| `public/` | Static assets served as-is (`app-ads.txt`, `_redirects`, `favicon.svg`) |

**Import alias:** `@/` → `src/`

## Routing contract

Preserve these URL paths — they are linked from app stores and bookmarks:

| Path | Component |
|------|-----------|
| `/` | Redirects to `/home` |
| `/home` | `HomePage` |
| `/privacy` | `PrivacyPage` |
| `/contact` | `ContactPage` |
| `*` | Redirects to `/home` |

Routes are defined in `src/App.tsx`. Navigation links are in `src/components/layout/nav-items.ts` — keep both in sync when adding pages.

## Content rules

- **Privacy policy** (`src/pages/PrivacyPage.tsx`) is legal copy. Edit carefully; do not change meaning without explicit intent.
- **Contact email** is `app@maikelstuivenberg.nl` — defined in `src/lib/constants.ts` as `CONTACT_EMAIL`.
- **App names** referenced on the site: Encore, Bravo, Qwixx.

## Static files

| File | Requirement |
|------|-------------|
| `public/app-ads.txt` | Must be served at `https://maikelstuivenberg.nl/app-ads.txt` for Google AdMob. Do not change the publisher ID without intent. |
| `public/_redirects` | SPA fallback (`/* /index.html 200`) for Cloudflare Pages |
| `public/favicon.svg` | Site favicon |

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite` — config in `src/index.css` using `@theme inline`
- Font: Rethink Sans (loaded in root `index.html`)
- Brand accent color: `#006094` (`--color-accent`)
- Content max-width: 1000px (in `AppShell`)
- Use `cn()` from `src/lib/utils.ts` for conditional class names

## Deployment (Cloudflare Pages)

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 |

No environment variables required.

## Guidelines

1. **Minimize scope** — only change what the task requires
2. **Match existing patterns** — read similar files before adding new ones
3. **No backend** — do not add Firebase, API routes, or server logic unless explicitly requested
4. **Preserve routes** — do not rename `/home`, `/privacy`, or `/contact` without a migration plan
5. **Keep it static** — this site has no auth, no data fetching, no forms

## File reference

| Path | Purpose |
|------|---------|
| `src/main.tsx` | App bootstrap (`BrowserRouter` + `App`) |
| `src/App.tsx` | Route definitions |
| `src/components/layout/AppShell.tsx` | Site header, nav, main content wrapper |
| `src/components/layout/nav-items.ts` | Navigation link config |
| `src/components/PageMeta.tsx` | Document title and meta description per page |
| `src/pages/HomePage.tsx` | Home landing page |
| `src/pages/PrivacyPage.tsx` | App privacy policy |
| `src/pages/ContactPage.tsx` | Contact information |
| `src/lib/constants.ts` | `CONTACT_EMAIL` and other shared constants |
| `vite.config.ts` | Vite + React + Tailwind plugins, `@` alias |
| `index.html` | HTML entry point |
| `public/app-ads.txt` | Google AdMob ads.txt verification |

## Agent skills

React best-practice guidance is available in `.agents/skills/vercel-react-best-practices/`. Apply relevant rules when maintaining or extending this codebase.

