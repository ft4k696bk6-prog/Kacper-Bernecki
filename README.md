# Kacper-Bernecki

Secondary experimental interactive portfolio built as a cinematic MacBook-style web experience. The main professional portfolio is https://kacper-portfolio.vercel.app.

PL: To dodatkowy, eksperymentalny projekt interaktywny. Nie zastępuje głównego portfolio technicznego.

## Live demo

https://kacper-bernecki.vercel.app

## Screenshots

Screenshots should be added to `docs/screenshots/`. Placeholder links are not included.

## Features

- Pre-rendered MP4 intro and shutdown scenes.
- Interactive Mac-style desktop with dock shortcuts.
- Project, skills, about, contact, calendar and game panels.
- Terminal commands that open panels or external project links.
- Embedded Berni Rush frame plus small browser games.
- Responsive handling for mobile-oriented intro assets.

## Tech stack

- React
- TypeScript
- Vite
- CSS
- lucide-react
- Vercel

## Project structure

- `src/components/` — MacBook intro and desktop UI.
- `src/data/portfolio.ts` — project links, profile copy and skill groups.
- `src/games/` — embedded mini game panels.
- `public/videos/` — intro and shutdown videos.
- `public/images/` — avatar and wallpaper assets.
- `docs/` — roadmap, changelog, issue backlog and screenshots folder.

## Getting started

```bash
git clone https://github.com/ft4k696bk6-prog/Kacper-Bernecki.git
cd Kacper-Bernecki
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Positioning

This repository is intentionally marked as an experimental interactive portfolio. The primary positioning is:

Frontend / Web App Developer focused on React, TypeScript, Next.js, Supabase, CRM workflows, dashboards, forms and business web applications.

## Status

Experimental interactive portfolio.

## License

MIT.
