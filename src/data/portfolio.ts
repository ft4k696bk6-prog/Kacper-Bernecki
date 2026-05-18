export const profile = {
  name: 'Kacper Bernecki',
  title: 'Frontend / Web App Developer',
  tagline:
    'Tworze aplikacje biznesowe w React, TypeScript, Next.js i Supabase: CRM-y, dashboardy, formularze i narzedzia workflow.',
  location: 'Polska',
  github: 'https://github.com/ft4k696bk6-prog',
  linkedin: 'https://www.linkedin.com/in/kacper-bernecki/',
  staticPortfolio: 'https://kacper-portfolio.vercel.app',
  calendar: 'https://cal.com/kacper-bernecki/schedule-meeting',
  newPortfolio: 'https://kacper-bernecki.vercel.app',
  berniRushUrl: 'https://bernirushdemooo.vercel.app',
}

export const about = [
  'Zaczynalem od biznesu, sprzedazy i pracy z klientem, dlatego aplikacje traktuje jako narzedzia do rozwiazywania realnych problemow, a nie tylko jako kod.',
  'Interesuja mnie CRM-y, dashboardy, formularze, generatory ofert, automatyzacje i integracje API, ktore pomagaja firmom szybciej dzialac.',
  'Najwazniejsze sa dla mnie prostota obslugi, czytelny interfejs, szybkie wdrozenie i profesjonalny efekt koncowy.',
]

export const projects = [
  {
    id: 'b-crm',
    title: 'B-CRM - aplikacja CRM',
    description:
      'CRM dla zespolow sprzedazowych: leady, role, statusy, komentarze, callbacki, spotkania i panel administracyjny.',
    stack: ['React', 'TypeScript', 'Next.js', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Vercel'],
    liveUrl: 'https://b-crm-berni.vercel.app/login',
    repoUrl: 'https://github.com/ft4k696bk6-prog/B-CRM',
  },
  {
    id: 'berni-rush',
    title: 'Berni Rush - gra webowa',
    description:
      'Mobilna gra webowa w stylu roguelite arena survival z klasami postaci, skinami, falami przeciwnikow, bossami i kilkoma mapami.',
    stack: ['React', 'Vite', 'TypeScript', 'Three.js', 'Vercel'],
    liveUrl: 'https://bernirushdemooo.vercel.app',
  },
  {
    id: 'leasing-calculator',
    title: 'Kalkulator leasingu',
    description:
      'Narzedzie ofertowe do orientacyjnego wyliczania rat leasingu, formularza leadowego i prezentacji wariantow finansowania.',
    stack: ['React', 'TypeScript', 'Vite', 'Hono', 'Drizzle', 'Vercel'],
    liveUrl: 'https://kalkulator-leasingu-1-desktop.vercel.app',
    repoUrl: 'https://github.com/ft4k696bk6-prog/kalkulator.leasingu-1',
  },
  {
    id: 'berninutri-ai',
    title: 'BerniNutri AI',
    description:
      'Mobilna aplikacja webowa do analizy zdjec posilkow, szacowania kalorii i makro oraz zapisu dziennej historii.',
    stack: ['React', 'TypeScript', 'Vite', 'OpenAI API', 'LocalStorage', 'Vercel'],
    liveUrl: 'https://berninutri-portfolio.vercel.app',
    repoUrl: 'https://github.com/ft4k696bk6-prog/berninutri-portfolio',
  },
  {
    id: 'static-portfolio',
    title: 'Static Portfolio',
    description:
      'Glowne portfolio z case study B-CRM, sekcja dla osob technicznych, projektami i zabezpieczonym formularzem kontaktowym.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    liveUrl: 'https://kacper-portfolio.vercel.app',
  },
]

export const skillGroups = [
  {
    title: 'Frontend i UI',
    items: ['React', 'Next.js', 'Vite', 'TypeScript', 'Tailwind CSS', 'Responsive Design'],
  },
  {
    title: 'Aplikacje biznesowe',
    items: ['CRM', 'Dashboardy', 'Formularze', 'Leady', 'Procesy sprzedazy', 'Generatory ofert'],
  },
  {
    title: 'Backend i integracje',
    items: ['Supabase', 'PostgreSQL', 'Hono', 'Drizzle', 'OpenAI API', 'Vercel'],
  },
  {
    title: 'Produkt',
    items: ['UX aplikacji', 'Automatyzacje', 'Deployment', 'GitHub', 'Dokumentacja techniczna'],
  },
]

export const terminalCommands = [
  'help',
  'about',
  'projects',
  'skills',
  'contact',
  'open github',
  'open linkedin',
  'open portfolio',
  'open calendar',
  'play snake',
  'play pong',
  'play breakout',
  'play neon runner',
  'berni rush',
  'clear',
]
