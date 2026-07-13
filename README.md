# maikelstuivenberg.nl

Personal website and app support pages for apps by Maikel Stuivenberg (Encore, Bravo, Qwixx).

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- React Router DOM 7

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Node 20+ (see `.nvmrc`).

## Build

```bash
npm run build
npm run preview
```

Production output is written to `dist/`.

## Routes

| Path | Page |
|------|------|
| `/` | Redirects to `/home` |
| `/home` | Home |
| `/privacy` | Privacy policy |
| `/contact` | Contact |

## Deployment

Static hosting (e.g. Cloudflare Pages):

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 |

`public/_redirects` provides SPA fallback for client-side routing.

`public/app-ads.txt` must remain available at `/app-ads.txt` for Google AdMob verification.

## Agent documentation

See [AGENTS.md](AGENTS.md) for conventions and file map for AI coding agents.
