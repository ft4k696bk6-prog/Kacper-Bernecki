# Kacper-Bernecki

Interactive cinematic MacBook portfolio built with React, Vite, TypeScript, Canvas analysis, and a native MP4 intro.

Live site: https://kacper-bernecki.vercel.app  
GitHub: https://github.com/ft4k696bk6-prog/Kacper-Bernecki

## Experience

- Native MP4 intro with a MacBook opening on a minimalist desk.
- Green-screen detection that anchors login and desktop UI to the laptop screen.
- Smooth shutdown using a local reverse video with the laptop screen turned off.
- Interactive Mac-style desktop with dock shortcuts, external links, and mobile-friendly focus windows.
- Functional portfolio sections for projects, about, skills, contact, booking, and games.

## Functional Links

- GitHub: https://github.com/ft4k696bk6-prog
- LinkedIn: https://www.linkedin.com/in/kacper-bernecki/
- Static portfolio: https://kacper-portfolio.vercel.app
- Booking: https://cal.com/kacper-bernecki/schedule-meeting
- Email: Kacper.bernecki@gmail.com
- Phone: +48 575 109 897

## Desktop Apps

- Projects folder with live and repository links.
- Games folder with Berni Rush embedded in the laptop plus Neon Runner, Snake, Pong, and Breakout.
- Terminal with real commands that update the UI or open the correct destination.
- Calendar panel with date/time selection before confirming through Cal.com.
- About, Projects, Contact, Calendar, GitHub, LinkedIn, Static Portfolio, Email, Phone, and Power icons.

## Media Assets

- Intro video: `public/videos/macbook-work-scene.mp4`
- Shutdown video: `public/videos/macbook-work-scene-reverse-off.mp4`
- MacBook wallpaper: `public/images/macbook-wallpaper.png`
- GitHub avatar: `public/images/github-avatar.png`

## Terminal Commands

```text
help
about
projects
skills
contact
open github
open linkedin
open portfolio
open calendar
play snake
play pong
play breakout
play neon runner
berni rush
clear
```

## Local Development

```bash
npm install
npm run dev
```

The local development server prints the URL, usually `http://localhost:5173`.

## Quality Checks

```bash
npm run lint
npm run build
```

`npm run build` creates the production output in `dist/`.

## Deploy

This project is configured for Vercel.

```bash
npx vercel deploy --prod --yes
```

The production alias is `https://kacper-bernecki.vercel.app`.
