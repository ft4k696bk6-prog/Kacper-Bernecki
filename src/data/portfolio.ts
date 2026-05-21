export const sharedLinks = {
  github: 'https://github.com/ft4k696bk6-prog',
  linkedin: 'https://www.linkedin.com/in/kacper-bernecki/',
  staticPortfolio: 'https://kacper-portfolio.vercel.app',
  calendar: 'https://cal.com/kacper-bernecki/schedule-meeting',
  newPortfolio: 'https://kacper-bernecki.vercel.app',
  berniRushUrl: 'https://bernirushdemooo.vercel.app',
}

export const portfolioContent = {
  en: {
    profile: {
      name: 'Kacper Bernecki',
      title: 'Frontend / Web App Developer',
      tagline:
        'I build business web applications in React, TypeScript, Next.js and Supabase: CRMs, dashboards, forms and workflow tools.',
      location: 'Poland',
      ...sharedLinks,
    },
    about: [
      'I started from business, sales and client work, so I treat applications as tools for solving real process problems, not just as code.',
      'I focus on CRMs, dashboards, forms, offer generators, automations and API integrations that help companies move faster.',
      'The most important parts for me are clear UX, useful flows, reliable deployment and a professional final result.',
    ],
    projects: [
      {
        id: 'b-crm',
        title: 'B-CRM - CRM application',
        description:
          'CRM for sales teams: leads, roles, statuses, comments, callbacks, meetings and admin panel.',
        stack: ['React', 'TypeScript', 'Next.js', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Vercel'],
        liveUrl: 'https://b-crm-berni.vercel.app/login',
        repoUrl: 'https://github.com/ft4k696bk6-prog/B-CRM',
      },
      {
        id: 'berni-rush',
        title: 'Berni Rush - browser game',
        description:
          'Mobile-friendly roguelite arena survival prototype with character classes, skins, enemy waves, bosses and multiple maps.',
        stack: ['React', 'Vite', 'TypeScript', 'Three.js', 'Vercel'],
        liveUrl: sharedLinks.berniRushUrl,
      },
      {
        id: 'leasing-calculator',
        title: 'Leasing calculator',
        description:
          'Business offer tool for indicative leasing payment calculations, lead capture and financing variant presentation.',
        stack: ['React', 'TypeScript', 'Vite', 'Hono', 'Drizzle', 'Vercel'],
        liveUrl: 'https://kalkulatorleasingu-7484-main.vercel.app',
        repoUrl: 'https://github.com/ft4k696bk6-prog/kalkulator.leasingu-1',
      },
      {
        id: 'berninutri-ai',
        title: 'BerniNutri AI',
        description:
          'Mobile web app prototype for meal photo analysis, calorie and macro estimates, and daily local history.',
        stack: ['React', 'TypeScript', 'Vite', 'OpenAI API', 'LocalStorage', 'Vercel'],
        liveUrl: 'https://berninutri-portfolio.vercel.app',
        repoUrl: 'https://github.com/ft4k696bk6-prog/berninutri-portfolio',
      },
      {
        id: 'static-portfolio',
        title: 'Main portfolio',
        description:
          'Main developer portfolio with B-CRM case study, technical reviewer section, project cards and protected contact reveal.',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
        liveUrl: sharedLinks.staticPortfolio,
      },
    ],
    skillGroups: [
      {
        title: 'Frontend and UI',
        items: ['React', 'Next.js', 'Vite', 'TypeScript', 'Tailwind CSS', 'Responsive Design'],
      },
      {
        title: 'Business applications',
        items: ['CRM', 'Dashboards', 'Forms', 'Leads', 'Sales processes', 'Offer generators'],
      },
      {
        title: 'Backend and integrations',
        items: ['Supabase', 'PostgreSQL', 'Hono', 'Drizzle', 'OpenAI API', 'Vercel'],
      },
      {
        title: 'Product work',
        items: ['Application UX', 'Automations', 'Deployment', 'GitHub', 'Technical documentation'],
      },
    ],
    terminalCommands: [
      'help',
      'about',
      'projects',
      'skills',
      'ai',
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
    ],
    ui: {
      ariaDesktop: 'MacBook interactive desktop',
      osName: 'Kacper OS',
      desktopIcons: 'Desktop icons',
      quickActions: 'Quick actions',
      language: 'Language',
      loadingScene: 'Loading scene',
      clickEverywhere: 'Click anywhere',
      autoStart: 'or wait 5 seconds',
      lockSubtitle: 'Portfolio',
      open: 'Open',
      shutDown: 'Shut down',
      closeWindow: 'Close window',
      terminalIntro: ['KACPER_OS terminal', 'Type "help" to see available commands.'],
      terminalPrompt: 'kacper@macbook ~ %',
      unknownCommand: (value: string) => `Unknown command: ${value}. Try "help".`,
      commandDescriptions: {
        help: 'show commands',
        about: 'open about',
        projects: 'open projects',
        skills: 'open skills',
        ai: 'open AI Kacper',
        contact: 'open contact',
        'open github': 'open GitHub',
        'open linkedin': 'open LinkedIn',
        'open portfolio': 'open main portfolio',
        'open calendar': 'open calendar',
        'play snake': 'launch Snake',
        'play pong': 'launch Pong',
        'play breakout': 'launch Breakout',
        'play neon runner': 'launch Neon Runner',
        'berni rush': 'launch Berni Rush',
        clear: 'clear terminal',
      },
      commandMessages: {
        github: 'GitHub opened.',
        linkedin: 'LinkedIn opened.',
        portfolio: 'Main portfolio opened.',
        ai: 'AI Kacper opened.',
        calendar: 'Calendar opened.',
        snake: 'Snake launched.',
        pong: 'Pong launched.',
        breakout: 'Breakout launched.',
        neonRunner: 'Neon Runner launched.',
        berniRush: 'Berni Rush launched.',
      },
      panelTitles: {
        about: 'About me',
        projects: 'Projects',
        skills: 'Skills',
        terminal: 'Terminal',
        ai: 'AI Kacper',
        games: 'Games',
        contact: 'Contact',
        calendar: 'Book a meeting',
      },
      desktopApps: {
        projects: 'Projects',
        about: 'About',
        ai: 'AI Kacper',
        games: 'Games',
        contact: 'Contact',
      },
      dock: {
        terminal: 'Terminal',
        ai: 'AI Kacper',
        calendar: 'Calendar',
        github: 'GitHub',
        linkedin: 'LinkedIn',
        portfolio: 'Main portfolio',
      },
      aboutPills: ['Business-first', 'React', 'TypeScript', 'Web apps', 'CRM'],
      actions: {
        live: 'Live',
        repo: 'Repo',
        portfolio: 'Portfolio',
        calendar: 'Calendar',
        calendarValue: 'Choose a time',
      },
      calendar: {
        timeZone: 'Europe/Warsaw',
        title: 'Book a meeting',
        description: 'Choose a day that fits a short conversation about a project.',
        chooseTime: 'Choose a time',
        timeDescription: 'Times are shown in Europe/Warsaw.',
        changeDay: 'Change day',
        confirmationEyebrow: 'Confirmation',
        confirmationTitle: 'Time is ready',
        day: 'Day',
        time: 'Time',
        confirm: 'Confirm time',
        changeTime: 'Change time',
      },
      games: {
        back: 'Back',
        berniRush: 'Arena survival',
        neonRunner: 'Jump and dodge',
        snake: 'Classic grid',
        pong: 'Arcade duel',
        breakout: 'Brick chase',
      },
      ai: {
        title: 'AI Kacper',
        subtitle: 'Portfolio copilot',
        initialMessage:
          'Hi, I am AI Kacper. Ask about projects, B-CRM, stack, contact or what to click first.',
        placeholder: 'Ask AI Kacper...',
        error: 'AI is warming up. Try again in a moment.',
        quickPrompts: ['Best project?', 'What stack?', 'How to contact?', 'Open B-CRM?'],
      },
    },
  },
  pl: {
    profile: {
      name: 'Kacper Bernecki',
      title: 'Frontend / Web App Developer',
      tagline:
        'Tworzę aplikacje biznesowe w React, TypeScript, Next.js i Supabase: CRM-y, dashboardy, formularze i narzędzia workflow.',
      location: 'Polska',
      ...sharedLinks,
    },
    about: [
      'Zaczynałem od biznesu, sprzedaży i pracy z klientem, dlatego aplikacje traktuję jako narzędzia do rozwiązywania realnych problemów, a nie tylko jako kod.',
      'Interesują mnie CRM-y, dashboardy, formularze, generatory ofert, automatyzacje i integracje API, które pomagają firmom szybciej działać.',
      'Najważniejsze są dla mnie prostota obsługi, czytelny interfejs, szybkie wdrożenie i profesjonalny efekt końcowy.',
    ],
    projects: [
      {
        id: 'b-crm',
        title: 'B-CRM - aplikacja CRM',
        description:
          'CRM dla zespołów sprzedażowych: leady, role, statusy, komentarze, callbacki, spotkania i panel administracyjny.',
        stack: ['React', 'TypeScript', 'Next.js', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Vercel'],
        liveUrl: 'https://b-crm-berni.vercel.app/login',
        repoUrl: 'https://github.com/ft4k696bk6-prog/B-CRM',
      },
      {
        id: 'berni-rush',
        title: 'Berni Rush - gra webowa',
        description:
          'Mobilna gra webowa w stylu roguelite arena survival z klasami postaci, skinami, falami przeciwników, bossami i kilkoma mapami.',
        stack: ['React', 'Vite', 'TypeScript', 'Three.js', 'Vercel'],
        liveUrl: sharedLinks.berniRushUrl,
      },
      {
        id: 'leasing-calculator',
        title: 'Kalkulator leasingu',
        description:
          'Narzędzie ofertowe do orientacyjnego wyliczania rat leasingu, formularza leadowego i prezentacji wariantów finansowania.',
        stack: ['React', 'TypeScript', 'Vite', 'Hono', 'Drizzle', 'Vercel'],
        liveUrl: 'https://kalkulatorleasingu-7484-main.vercel.app',
        repoUrl: 'https://github.com/ft4k696bk6-prog/kalkulator.leasingu-1',
      },
      {
        id: 'berninutri-ai',
        title: 'BerniNutri AI',
        description:
          'Mobilna aplikacja webowa do analizy zdjęć posiłków, szacowania kalorii i makro oraz zapisu dziennej historii.',
        stack: ['React', 'TypeScript', 'Vite', 'OpenAI API', 'LocalStorage', 'Vercel'],
        liveUrl: 'https://berninutri-portfolio.vercel.app',
        repoUrl: 'https://github.com/ft4k696bk6-prog/berninutri-portfolio',
      },
      {
        id: 'static-portfolio',
        title: 'Główne portfolio',
        description:
          'Główne portfolio z case study B-CRM, sekcją dla osób technicznych, kartami projektów i chronionym odsłanianiem kontaktu.',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
        liveUrl: sharedLinks.staticPortfolio,
      },
    ],
    skillGroups: [
      {
        title: 'Frontend i UI',
        items: ['React', 'Next.js', 'Vite', 'TypeScript', 'Tailwind CSS', 'Responsive Design'],
      },
      {
        title: 'Aplikacje biznesowe',
        items: ['CRM', 'Dashboardy', 'Formularze', 'Leady', 'Procesy sprzedaży', 'Generatory ofert'],
      },
      {
        title: 'Backend i integracje',
        items: ['Supabase', 'PostgreSQL', 'Hono', 'Drizzle', 'OpenAI API', 'Vercel'],
      },
      {
        title: 'Produkt',
        items: ['UX aplikacji', 'Automatyzacje', 'Deployment', 'GitHub', 'Dokumentacja techniczna'],
      },
    ],
    terminalCommands: [
      'help',
      'about',
      'projects',
      'skills',
      'ai',
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
    ],
    ui: {
      ariaDesktop: 'Interaktywny pulpit MacBooka',
      osName: 'Kacper OS',
      desktopIcons: 'Ikony pulpitu',
      quickActions: 'Szybkie akcje',
      language: 'Język',
      loadingScene: 'Ładowanie sceny',
      clickEverywhere: 'Kliknij gdziekolwiek',
      autoStart: 'albo poczekaj 5 sekund',
      lockSubtitle: 'Portfolio',
      open: 'Otwórz',
      shutDown: 'Wyłącz',
      closeWindow: 'Zamknij okno',
      terminalIntro: ['Terminal KACPER_OS', 'Wpisz "help", żeby zobaczyć komendy.'],
      terminalPrompt: 'kacper@macbook ~ %',
      unknownCommand: (value: string) => `Nieznana komenda: ${value}. Spróbuj "help".`,
      commandDescriptions: {
        help: 'pokaż komendy',
        about: 'otwórz o mnie',
        projects: 'otwórz projekty',
        skills: 'otwórz umiejętności',
        ai: 'otwórz AI Kacper',
        contact: 'otwórz kontakt',
        'open github': 'otwórz GitHub',
        'open linkedin': 'otwórz LinkedIn',
        'open portfolio': 'otwórz główne portfolio',
        'open calendar': 'otwórz kalendarz',
        'play snake': 'uruchom Snake',
        'play pong': 'uruchom Pong',
        'play breakout': 'uruchom Breakout',
        'play neon runner': 'uruchom Neon Runner',
        'berni rush': 'uruchom Berni Rush',
        clear: 'wyczyść terminal',
      },
      commandMessages: {
        github: 'GitHub otwarty.',
        linkedin: 'LinkedIn otwarty.',
        portfolio: 'Główne portfolio otwarte.',
        ai: 'AI Kacper otwarty.',
        calendar: 'Kalendarz otwarty.',
        snake: 'Snake uruchomiony.',
        pong: 'Pong uruchomiony.',
        breakout: 'Breakout uruchomiony.',
        neonRunner: 'Neon Runner uruchomiony.',
        berniRush: 'Berni Rush uruchomiony.',
      },
      panelTitles: {
        about: 'O mnie',
        projects: 'Projekty',
        skills: 'Umiejętności',
        terminal: 'Terminal',
        ai: 'AI Kacper',
        games: 'Gry',
        contact: 'Kontakt',
        calendar: 'Umów spotkanie',
      },
      desktopApps: {
        projects: 'Projekty',
        about: 'O mnie',
        ai: 'AI Kacper',
        games: 'Gry',
        contact: 'Kontakt',
      },
      dock: {
        terminal: 'Terminal',
        ai: 'AI Kacper',
        calendar: 'Kalendarz',
        github: 'GitHub',
        linkedin: 'LinkedIn',
        portfolio: 'Główne portfolio',
      },
      aboutPills: ['Business-first', 'React', 'TypeScript', 'Web apps', 'CRM'],
      actions: {
        live: 'Demo',
        repo: 'Repo',
        portfolio: 'Portfolio',
        calendar: 'Kalendarz',
        calendarValue: 'Wybierz termin',
      },
      calendar: {
        timeZone: 'Europe/Warsaw',
        title: 'Umów spotkanie',
        description: 'Wybierz dzień, który pasuje do krótkiej rozmowy o projekcie.',
        chooseTime: 'Wybierz godzinę',
        timeDescription: 'Godziny są podane dla strefy Europe/Warsaw.',
        changeDay: 'Zmień dzień',
        confirmationEyebrow: 'Potwierdzenie',
        confirmationTitle: 'Termin gotowy',
        day: 'Dzień',
        time: 'Godzina',
        confirm: 'Potwierdź termin',
        changeTime: 'Zmień godzinę',
      },
      games: {
        back: 'Wróć',
        berniRush: 'Arena survival',
        neonRunner: 'Skacz i unikaj',
        snake: 'Klasyczna siatka',
        pong: 'Pojedynek arcade',
        breakout: 'Rozbijanie bloków',
      },
      ai: {
        title: 'AI Kacper',
        subtitle: 'Asystent portfolio',
        initialMessage:
          'Cześć, jestem AI Kacper. Zapytaj o projekty, B-CRM, stack, kontakt albo co kliknąć jako pierwsze.',
        placeholder: 'Zapytaj AI Kacpra...',
        error: 'AI się rozgrzewa. Spróbuj ponownie za moment.',
        quickPrompts: ['Najlepszy projekt?', 'Jaki stack?', 'Jak się skontaktować?', 'Otworzyć B-CRM?'],
      },
    },
  },
} as const

export type AppLanguage = keyof typeof portfolioContent
export type Language = AppLanguage
export type PortfolioCopy = (typeof portfolioContent)[AppLanguage]
export type PortfolioProject = PortfolioCopy['projects'][number]
export type AiMessagePayload = {
  content: string
  role: 'assistant' | 'user'
}

export function buildAiFallbackAnswer(messages: AiMessagePayload[], language: AppLanguage) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? ''
  const normalized = normalizeForIntent(latestQuestion)
  const isPolish = language === 'pl'

  if (!latestQuestion) {
    return portfolioContent[language].ui.ai.initialMessage
  }

  if (hasAny(normalized, ['b-crm', 'b crm', 'crm', 'lead', 'sales', 'sprzedaz', 'sprzedaż'])) {
    return isPolish
      ? 'B-CRM to najmocniejszy projekt do sprawdzenia: CRM z rolami, statusami leadów, komentarzami, callbackami, spotkaniami, panelem admina i danymi w Supabase/PostgreSQL. Najlepiej pokazuje praktyczne myślenie o procesie biznesowym.'
      : 'B-CRM is the strongest project to review: a CRM with roles, lead statuses, comments, callbacks, meetings, an admin panel and Supabase/PostgreSQL-backed data. It best shows practical thinking around business workflow.'
  }

  if (hasAny(normalized, ['project', 'projects', 'portfolio', 'projek', 'realizac'])) {
    return isPolish
      ? 'Najlepsza ścieżka: B-CRM jako dowód techniczny, główne portfolio jako case studies i SEO/Next.js, Berni Rush jako gameplay/web game, a kalkulator leasingu i BerniNutri jako prototypy narzędzi biznesowych.'
      : 'Best review path: B-CRM as the technical proof, the main portfolio for case studies and Next.js/SEO, Berni Rush for gameplay/web-game work, and the leasing calculator plus BerniNutri as business-tool prototypes.'
  }

  if (hasAny(normalized, ['stack', 'tech', 'technolog', 'typescript', 'react', 'next', 'supabase'])) {
    return isPolish
      ? 'Główny stack Kacpra to React, TypeScript, Next.js, Supabase/PostgreSQL, Tailwind CSS i Vercel. Używa go do CRM-ów, dashboardów, formularzy, integracji API i aplikacji wspierających procesy firmy.'
      : "Kacper's core stack is React, TypeScript, Next.js, Supabase/PostgreSQL, Tailwind CSS and Vercel. He uses it for CRMs, dashboards, forms, API integrations and business workflow tools."
  }

  if (hasAny(normalized, ['contact', 'kontakt', 'email', 'phone', 'telefon', 'book', 'meeting', 'spotkanie'])) {
    return isPolish
      ? 'Najprościej: otwórz okno Kontakt albo Kalendarz na tym pulpicie. Główna strona ma też pełny formularz kontaktowy i chronione dane kontaktowe.'
      : 'Simplest route: open Contact or Calendar on this desktop. The main portfolio also has a full contact flow and protected contact details.'
  }

  if (hasAny(normalized, ['open b-crm', 'otworz b-crm', 'otwórz b-crm', 'demo', 'live'])) {
    return isPolish
      ? 'Kliknij Projekty i przy B-CRM wybierz Demo. To najlepszy pierwszy klik, jeśli chcesz szybko ocenić praktyczny web app.'
      : 'Open Projects and choose Live on B-CRM. That is the best first click if you want to quickly judge the practical web-app work.'
  }

  return isPolish
    ? 'Mogę pomóc szybko ogarnąć portfolio: pytaj o B-CRM, projekty, stack, kontakt albo to, które okno warto otworzyć najpierw.'
    : 'I can help you navigate the portfolio quickly: ask about B-CRM, projects, stack, contact, or which window is worth opening first.'
}

function normalizeForIntent(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}
