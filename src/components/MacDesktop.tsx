import { useMemo, useRef, useState } from 'react'
import type { ComponentType, FormEvent, KeyboardEvent, ReactNode } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  Code2,
  ExternalLink,
  FolderKanban,
  Gamepad2,
  GitBranch,
  Mail,
  Phone,
  Power,
  Sparkles,
  Terminal,
  UserRound,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { about, profile, projects, skillGroups, terminalCommands } from '../data/portfolio'
import { BreakoutGame } from '../games/BreakoutGame'
import { PongGame } from '../games/PongGame'
import { SnakeGame } from '../games/SnakeGame'

type Panel =
  | 'about'
  | 'projects'
  | 'skills'
  | 'terminal'
  | 'games'
  | 'contact'
  | 'calendar'
  | null

type Game = 'snake' | 'pong' | 'breakout' | null
type Line = { id: number; tone: 'system' | 'input' | 'output' | 'error'; text: string | string[] }

const initialLines: Line[] = [
  {
    id: 1,
    tone: 'system',
    text: ['KACPER_OS desktop terminal', 'Type "help" to see every working command.'],
  },
]

const desktopApps = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, panel: 'projects' as const },
  { id: 'about', label: 'About', icon: UserRound, panel: 'about' as const },
  { id: 'skills', label: 'Skills', icon: Wrench, panel: 'skills' as const },
  { id: 'terminal', label: 'Terminal', icon: Terminal, panel: 'terminal' as const },
  { id: 'games', label: 'Games', icon: Gamepad2, panel: 'games' as const },
  { id: 'contact', label: 'Contact', icon: Mail, panel: 'contact' as const },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, panel: 'calendar' as const },
]

const linkApps = [
  { id: 'github', label: 'GitHub', icon: GitBranch, href: profile.github },
  { id: 'linkedin', label: 'LinkedIn', icon: UsersRound, href: profile.linkedin },
  { id: 'portfolio', label: 'Static portfolio', icon: BriefcaseBusiness, href: profile.staticPortfolio },
  { id: 'email', label: 'Email', icon: Mail, href: `mailto:${profile.email}` },
  { id: 'phone', label: 'Phone', icon: Phone, href: `tel:${profile.phone.replace(/\s/g, '')}` },
]

type MacDesktopProps = {
  onShutdown?: () => void
}

export function MacDesktop({ onShutdown }: MacDesktopProps) {
  const [panel, setPanel] = useState<Panel>('projects')
  const [hovered, setHovered] = useState<string>('Projects')
  const [game, setGame] = useState<Game>(null)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [lines, setLines] = useState<Line[]>(initialLines)
  const lineId = useRef(2)

  const allApps = useMemo(() => [...desktopApps, ...linkApps], [])

  function openPanel(nextPanel: Panel) {
    setGame(null)
    setPanel(nextPanel)
  }

  function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function appendLine(tone: Line['tone'], text: string | string[]) {
    setLines((current) => [...current, { id: lineId.current++, tone, text }])
  }

  function runCommand(raw: string) {
    const value = raw.trim()
    if (!value) {
      return
    }

    const normalized = value.toLowerCase()
    setHistory((current) => [...current, value])
    setHistoryIndex(null)
    appendLine('input', `> ${value}`)

    if (normalized === 'clear') {
      setLines([])
      return
    }

    if (normalized === 'help') {
      appendLine(
        'output',
        terminalCommands.map((item) => `${item} - ${describeCommand(item)}`),
      )
      return
    }

    if (normalized === 'about') {
      setPanel('about')
      appendLine('output', [profile.name, profile.title, ...about])
      return
    }

    if (normalized === 'projects') {
      setPanel('projects')
      appendLine(
        'output',
        projects.map((project, index) => `${index + 1}. ${project.title}: ${project.description}`),
      )
      return
    }

    if (normalized === 'skills') {
      setPanel('skills')
      appendLine(
        'output',
        skillGroups.map((group) => `${group.title}: ${group.items.join(', ')}`),
      )
      return
    }

    if (normalized === 'contact') {
      setPanel('contact')
      appendLine('output', [
        `Email: ${profile.email}`,
        `Phone: ${profile.phone}`,
        `GitHub: ${profile.github}`,
        `LinkedIn: ${profile.linkedin}`,
        `Calendar: ${profile.calendar}`,
      ])
      return
    }

    if (normalized === 'open github') {
      openExternal(profile.github)
      appendLine('system', `Opening GitHub: ${profile.github}`)
      return
    }

    if (normalized === 'open linkedin') {
      openExternal(profile.linkedin)
      appendLine('system', `Opening LinkedIn: ${profile.linkedin}`)
      return
    }

    if (normalized === 'open portfolio') {
      openExternal(profile.staticPortfolio)
      appendLine('system', `Opening static portfolio: ${profile.staticPortfolio}`)
      return
    }

    if (normalized === 'open calendar') {
      setPanel('calendar')
      openExternal(profile.calendar)
      appendLine('system', `Opening booking calendar: ${profile.calendar}`)
      return
    }

    if (normalized === 'play snake') {
      setPanel('games')
      setGame('snake')
      appendLine('system', 'Snake started. Use arrows or mobile controls.')
      return
    }

    if (normalized === 'play pong') {
      setPanel('games')
      setGame('pong')
      appendLine('system', 'Pong started. Use W/S, arrows or mobile controls.')
      return
    }

    if (normalized === 'play breakout') {
      setPanel('games')
      setGame('breakout')
      appendLine('system', 'Breakout started. Use A/D, arrows or mobile controls.')
      return
    }

    if (normalized === 'berni rush') {
      setPanel('games')
      openExternal('https://bernirushdemooo.vercel.app')
      appendLine('system', 'Opening Berni Rush live build.')
      return
    }

    appendLine('error', `Unknown command: ${value}. Try "help".`)
  }

  function handleTerminalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    runCommand(command)
    setCommand('')
  }

  function handleTerminalKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!history.length) {
        return
      }
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(historyIndex - 1, 0)
      setHistoryIndex(nextIndex)
      setCommand(history[nextIndex])
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) {
        return
      }
      const nextIndex = historyIndex + 1
      if (nextIndex >= history.length) {
        setHistoryIndex(null)
        setCommand('')
      } else {
        setHistoryIndex(nextIndex)
        setCommand(history[nextIndex])
      }
    }
  }

  return (
    <section className="desktop-shell" aria-label="MacBook interactive desktop">
      <div className="desktop-wallpaper">
        <div className="menu-bar">
          <div>
            <Sparkles size={16} />
            <span>Kacper OS</span>
          </div>
          <div className="menu-actions">
            <span>{profile.name}</span>
            {onShutdown ? (
              <button type="button" className="menu-power" aria-label="Shut down MacBook" onClick={onShutdown}>
                <Power size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="desktop-layout">
          <div className="icon-grid" aria-label="Desktop icons">
            {desktopApps.map((app) => {
              const Icon = app.icon
              return (
                <button
                  type="button"
                  className="desktop-icon"
                  key={app.id}
                  onClick={() => openPanel(app.panel)}
                  onMouseEnter={() => setHovered(app.label)}
                >
                  <span>
                    <Icon size={28} />
                  </span>
                  <small>{app.label}</small>
                </button>
              )
            })}
            {linkApps.map((app) => {
              const Icon = app.icon
              return (
                <a
                  className="desktop-icon"
                  href={app.href}
                  key={app.id}
                  target={app.href.startsWith('http') ? '_blank' : undefined}
                  rel={app.href.startsWith('http') ? 'noreferrer' : undefined}
                  onMouseEnter={() => setHovered(app.label)}
                >
                  <span>
                    <Icon size={28} />
                  </span>
                  <small>{app.label}</small>
                </a>
              )
            })}
          </div>

          <div className="desktop-center">
            {panel ? (
              <AppWindow
                title={getPanelTitle(panel)}
                subtitle={hovered}
                onClose={() => {
                  setGame(null)
                  setPanel(null)
                }}
              >
                {panel === 'projects' ? <ProjectsPanel /> : null}
                {panel === 'about' ? <AboutPanel /> : null}
                {panel === 'skills' ? <SkillsPanel /> : null}
                {panel === 'contact' ? <ContactPanel /> : null}
                {panel === 'calendar' ? <CalendarPanel /> : null}
                {panel === 'games' ? <GamesPanel game={game} setGame={setGame} /> : null}
                {panel === 'terminal' ? (
                  <TerminalPanel
                    command={command}
                    lines={lines}
                    onChange={setCommand}
                    onKeyDown={handleTerminalKeyDown}
                    onSubmit={handleTerminalSubmit}
                  />
                ) : null}
              </AppWindow>
            ) : (
              <div className="desktop-empty">
                <Code2 size={34} />
                <h1>{profile.name}</h1>
                <p>{profile.tagline}</p>
              </div>
            )}
          </div>
        </div>

        <div className="dock" aria-label="Quick actions">
          {allApps.slice(0, 10).map((app) => {
            const Icon = app.icon
            if ('href' in app) {
              return (
                <a
                  key={app.id}
                  href={app.href}
                  target={app.href.startsWith('http') ? '_blank' : undefined}
                  rel={app.href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={app.label}
                  onMouseEnter={() => setHovered(app.label)}
                >
                  <Icon size={22} />
                </a>
              )
            }

            return (
              <button
                type="button"
                key={app.id}
                aria-label={app.label}
                onClick={() => openPanel(app.panel)}
                onMouseEnter={() => setHovered(app.label)}
              >
                <Icon size={22} />
              </button>
            )
          })}
          {onShutdown ? (
            <button type="button" aria-label="Shut down MacBook" onClick={onShutdown} onMouseEnter={() => setHovered('Shut down')}>
              <Power size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function describeCommand(command: string) {
  const descriptions: Record<string, string> = {
    help: 'show this list',
    about: 'open the about folder and print bio',
    projects: 'open project folder and list work',
    skills: 'open skill folder and print stack',
    contact: 'show contact data',
    'open github': 'open GitHub profile',
    'open linkedin': 'open LinkedIn profile',
    'open portfolio': 'open the static portfolio',
    'open calendar': 'open Cal.com booking link',
    'play snake': 'launch Snake',
    'play pong': 'launch Pong',
    'play breakout': 'launch Breakout',
    'berni rush': 'open Berni Rush live game',
    clear: 'clear terminal output',
  }
  return descriptions[command] ?? 'run command'
}

function getPanelTitle(panel: Exclude<Panel, null>) {
  const labels: Record<Exclude<Panel, null>, string> = {
    about: 'About me',
    projects: 'Projects',
    skills: 'Skills',
    terminal: 'Terminal',
    games: 'Games',
    contact: 'Contact',
    calendar: 'Book a meeting',
  }
  return labels[panel]
}

function AppWindow({
  children,
  onClose,
  subtitle,
  title,
}: {
  children: ReactNode
  onClose: () => void
  subtitle: string
  title: string
}) {
  return (
    <article className="app-window">
      <header>
        <div className="traffic">
          <button type="button" aria-label="Close window" onClick={onClose}></button>
          <span></span>
          <span></span>
        </div>
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
      </header>
      <div className="window-body">{children}</div>
    </article>
  )
}

function AboutPanel() {
  return (
    <div className="panel-stack about-panel">
      <p className="eyebrow">{profile.title}</p>
      <h1>{profile.name}</h1>
      {about.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <div className="pill-row">
        <span>Business-first</span>
        <span>AI-assisted</span>
        <span>Web apps</span>
        <span>CRM</span>
      </div>
    </div>
  )
}

function ProjectsPanel() {
  return (
    <div className="project-list">
      {projects.map((project) => (
        <article key={project.id} className="project-item">
          <div>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className="pill-row">
              {project.stack.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="action-row">
            {'liveUrl' in project && project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Live
              </a>
            ) : null}
            {'repoUrl' in project && project.repoUrl ? (
              <a href={project.repoUrl} target="_blank" rel="noreferrer">
                <GitBranch size={16} />
                Repo
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function SkillsPanel() {
  return (
    <div className="skill-grid">
      {skillGroups.map((group) => (
        <article key={group.title} className="skill-card">
          <h2>{group.title}</h2>
          <div className="pill-row">
            {group.items.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function ContactPanel() {
  return (
    <div className="contact-grid">
      <ActionCard href={`mailto:${profile.email}`} icon={Mail} label="Email" value={profile.email} />
      <ActionCard href={`tel:${profile.phone.replace(/\s/g, '')}`} icon={Phone} label="Phone" value={profile.phone} />
      <ActionCard href={profile.github} icon={GitBranch} label="GitHub" value="ft4k696bk6-prog" />
      <ActionCard href={profile.linkedin} icon={UsersRound} label="LinkedIn" value="kacper-bernecki" />
      <ActionCard href={profile.staticPortfolio} icon={BriefcaseBusiness} label="Static portfolio" value="kacper-portfolio.vercel.app" />
      <ActionCard href={profile.calendar} icon={CalendarDays} label="Calendar" value="Cal.com booking" />
    </div>
  )
}

function ActionCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string
  icon: ComponentType<{ size?: number }>
  label: string
  value: string
}) {
  return (
    <a
      className="action-card"
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
    >
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </a>
  )
}

function CalendarPanel() {
  return (
    <div className="panel-stack">
      <p className="eyebrow">Europe/Warsaw</p>
      <h1>Umow spotkanie</h1>
      <p>
        Rezerwacja prowadzi do Cal.com. Ikona kalendarza i komenda terminala "open calendar"
        otwieraja ten sam link.
      </p>
      <a className="primary-link" href={profile.calendar} target="_blank" rel="noreferrer">
        <CalendarDays size={18} />
        Otworz kalendarz
      </a>
    </div>
  )
}

function GamesPanel({ game, setGame }: { game: Game; setGame: (game: Game) => void }) {
  if (game) {
    return (
      <div className="game-panel">
        <div className="game-header">
          <strong>{game.toUpperCase()}</strong>
          <button type="button" onClick={() => setGame(null)}>
            Back to games
          </button>
        </div>
        {game === 'snake' ? <SnakeGame /> : null}
        {game === 'pong' ? <PongGame /> : null}
        {game === 'breakout' ? <BreakoutGame /> : null}
      </div>
    )
  }

  return (
    <div className="game-launcher">
      <button type="button" onClick={() => setGame('snake')}>
        <Gamepad2 size={24} />
        Snake
      </button>
      <button type="button" onClick={() => setGame('pong')}>
        <Gamepad2 size={24} />
        Pong
      </button>
      <button type="button" onClick={() => setGame('breakout')}>
        <Gamepad2 size={24} />
        Breakout
      </button>
      <a href="https://bernirushdemooo.vercel.app" target="_blank" rel="noreferrer">
        <Sparkles size={24} />
        Berni Rush
      </a>
    </div>
  )
}

function TerminalPanel({
  command,
  lines,
  onChange,
  onKeyDown,
  onSubmit,
}: {
  command: string
  lines: Line[]
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="desktop-terminal">
      <div className="desktop-terminal-output">
        {lines.map((line) => {
          const text = Array.isArray(line.text) ? line.text : [line.text]
          return (
            <div className={`desktop-terminal-line tone-${line.tone}`} key={line.id}>
              {text.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )
        })}
      </div>
      <form onSubmit={onSubmit}>
        <label htmlFor="desktop-terminal-input">kacper@macbook ~ %</label>
        <input
          id="desktop-terminal-input"
          value={command}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
