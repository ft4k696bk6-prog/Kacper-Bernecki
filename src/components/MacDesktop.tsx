import { useRef, useState } from 'react'
import type { ComponentType, FormEvent, KeyboardEvent, ReactNode } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FolderKanban,
  Gamepad2,
  GitBranch,
  Mail,
  Power,
  Sparkles,
  Terminal,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { about, profile, projects, skillGroups, terminalCommands } from '../data/portfolio'
import { BerniRushFrame } from '../games/BerniRushFrame'
import { BreakoutGame } from '../games/BreakoutGame'
import { NeonRunnerGame } from '../games/NeonRunnerGame'
import { PongGame } from '../games/PongGame'
import { SnakeGame } from '../games/SnakeGame'

type Panel = 'about' | 'projects' | 'skills' | 'terminal' | 'games' | 'contact' | 'calendar' | null
type Game = 'snake' | 'pong' | 'breakout' | 'berni-rush' | 'neon-runner' | null
type Line = { id: number; tone: 'system' | 'input' | 'output' | 'error'; text: string | string[] }
type PanelApp = {
  id: string
  label: string
  icon: ComponentType<{ size?: number }>
  panel: Exclude<Panel, null>
}
type LinkApp = {
  id: string
  label: string
  icon: ComponentType<{ size?: number }>
  href: string
}
type DateOption = {
  day: string
  fullLabel: string
  month: string
  value: string
  weekday: string
}

const TIME_ZONE = 'Europe/Warsaw'
const TIME_OPTIONS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

const initialLines: Line[] = [
  {
    id: 1,
    tone: 'system',
    text: ['KACPER_OS terminal', 'Type "help" to see available commands.'],
  },
]

const desktopApps: PanelApp[] = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, panel: 'projects' },
  { id: 'about', label: 'About', icon: UserRound, panel: 'about' },
  { id: 'games', label: 'Games', icon: Gamepad2, panel: 'games' },
  { id: 'contact', label: 'Contact', icon: Mail, panel: 'contact' },
]

const dockPanelApps: PanelApp[] = [
  { id: 'terminal', label: 'Terminal', icon: Terminal, panel: 'terminal' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, panel: 'calendar' },
]

const dockLinkApps: LinkApp[] = [
  { id: 'github', label: 'GitHub', icon: GitBranch, href: profile.github },
  { id: 'linkedin', label: 'LinkedIn', icon: UsersRound, href: profile.linkedin },
  { id: 'portfolio', label: 'Static portfolio', icon: BriefcaseBusiness, href: profile.staticPortfolio },
]

type MacDesktopProps = {
  onShutdown?: () => void
}

export function MacDesktop({ onShutdown }: MacDesktopProps) {
  const [panel, setPanel] = useState<Panel>(null)
  const [hovered, setHovered] = useState<string>('Kacper OS')
  const [game, setGame] = useState<Game>(null)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [lines, setLines] = useState<Line[]>(initialLines)
  const lineId = useRef(2)

  function openPanel(nextPanel: Exclude<Panel, null>) {
    setGame(null)
    setPanel(nextPanel)
    setHovered(getPanelTitle(nextPanel))
  }

  function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function appendLine(tone: Line['tone'], text: string | string[]) {
    setLines((current) => [...current, { id: lineId.current++, tone, text }])
  }

  function openGame(nextGame: Exclude<Game, null>) {
    setPanel('games')
    setGame(nextGame)
    setHovered(getGameTitle(nextGame))
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
      openPanel('about')
      appendLine('output', [profile.name, profile.title, ...about])
      return
    }

    if (normalized === 'projects') {
      openPanel('projects')
      appendLine(
        'output',
        projects.map((project, index) => `${index + 1}. ${project.title}: ${project.description}`),
      )
      return
    }

    if (normalized === 'skills') {
      openPanel('skills')
      appendLine(
        'output',
        skillGroups.map((group) => `${group.title}: ${group.items.join(', ')}`),
      )
      return
    }

    if (normalized === 'contact') {
      openPanel('contact')
      appendLine('output', [`Portfolio contact form: ${profile.staticPortfolio}`, `GitHub: ${profile.github}`, `LinkedIn: ${profile.linkedin}`])
      return
    }

    if (normalized === 'open github') {
      openExternal(profile.github)
      appendLine('system', 'GitHub opened.')
      return
    }

    if (normalized === 'open linkedin') {
      openExternal(profile.linkedin)
      appendLine('system', 'LinkedIn opened.')
      return
    }

    if (normalized === 'open portfolio') {
      openExternal(profile.staticPortfolio)
      appendLine('system', 'Static portfolio opened.')
      return
    }

    if (normalized === 'open calendar') {
      openPanel('calendar')
      appendLine('system', 'Calendar opened.')
      return
    }

    if (normalized === 'play snake') {
      openGame('snake')
      appendLine('system', 'Snake launched.')
      return
    }

    if (normalized === 'play pong') {
      openGame('pong')
      appendLine('system', 'Pong launched.')
      return
    }

    if (normalized === 'play breakout') {
      openGame('breakout')
      appendLine('system', 'Breakout launched.')
      return
    }

    if (normalized === 'play neon runner') {
      openGame('neon-runner')
      appendLine('system', 'Neon Runner launched.')
      return
    }

    if (normalized === 'berni rush') {
      openGame('berni-rush')
      appendLine('system', 'Berni Rush launched.')
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
            <span>Kacper OS</span>
          </div>
          <div className="menu-actions">
            <span>{profile.name}</span>
          </div>
        </div>

        <div className={`desktop-layout ${panel ? 'has-window' : 'is-wallpaper-only'}`}>
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
                {panel === 'contact' ? <ContactPanel onOpenCalendar={() => openPanel('calendar')} /> : null}
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
            ) : null}
          </div>
        </div>

        <div className="dock" aria-label="Quick actions">
          {dockPanelApps.map((app) => {
            const Icon = app.icon
            return (
              <button
                type="button"
                key={app.id}
                aria-label={app.label}
                onClick={() => openPanel(app.panel)}
                onFocus={() => setHovered(app.label)}
                onMouseEnter={() => setHovered(app.label)}
              >
                <Icon size={22} />
                <span className="dock-tooltip" aria-hidden="true">
                  {app.label}
                </span>
              </button>
            )
          })}
          {dockLinkApps.map((app) => {
            const Icon = app.icon
            return (
              <a
                key={app.id}
                href={app.href}
                target={app.href.startsWith('http') ? '_blank' : undefined}
                rel={app.href.startsWith('http') ? 'noreferrer' : undefined}
                aria-label={app.label}
                onFocus={() => setHovered(app.label)}
                onMouseEnter={() => setHovered(app.label)}
              >
                <Icon size={22} />
                <span className="dock-tooltip" aria-hidden="true">
                  {app.label}
                </span>
              </a>
            )
          })}
          {onShutdown ? (
            <button
              type="button"
              aria-label="Shut down MacBook"
              onClick={onShutdown}
              onFocus={() => setHovered('Shut down')}
              onMouseEnter={() => setHovered('Shut down')}
            >
              <Power size={22} />
              <span className="dock-tooltip" aria-hidden="true">
                Shut down
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function describeCommand(command: string) {
  const descriptions: Record<string, string> = {
    help: 'show commands',
    about: 'open about',
    projects: 'open projects',
    skills: 'open skills',
    contact: 'open contact',
    'open github': 'open GitHub',
    'open linkedin': 'open LinkedIn',
    'open portfolio': 'open static portfolio',
    'open calendar': 'open calendar',
    'play snake': 'launch Snake',
    'play pong': 'launch Pong',
    'play breakout': 'launch Breakout',
    'play neon runner': 'launch Neon Runner',
    'berni rush': 'launch Berni Rush',
    clear: 'clear terminal',
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

function getGameTitle(game: Exclude<Game, null>) {
  const labels: Record<Exclude<Game, null>, string> = {
    snake: 'Snake',
    pong: 'Pong',
    breakout: 'Breakout',
    'berni-rush': 'Berni Rush',
    'neon-runner': 'Neon Runner',
  }
  return labels[game]
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
        <span>React</span>
        <span>TypeScript</span>
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

function ContactPanel({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  return (
    <div className="contact-grid">
      <ActionCard href={profile.github} icon={GitBranch} label="GitHub" value="ft4k696bk6-prog" />
      <ActionCard href={profile.linkedin} icon={UsersRound} label="LinkedIn" value="kacper-bernecki" />
      <ActionCard href={profile.staticPortfolio} icon={BriefcaseBusiness} label="Portfolio" value="kacper-portfolio.vercel.app" />
      <ActionButton icon={CalendarDays} label="Calendar" value="Wybierz termin" onClick={onOpenCalendar} />
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

function ActionButton({
  icon: Icon,
  label,
  onClick,
  value,
}: {
  icon: ComponentType<{ size?: number }>
  label: string
  onClick: () => void
  value: string
}) {
  return (
    <button type="button" className="action-card" onClick={onClick}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  )
}

function CalendarPanel() {
  const [dateOptions] = useState<DateOption[]>(() => buildDateOptions())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const selectedOption = dateOptions.find((option) => option.value === selectedDate)
  const selectedSlot = selectedDate && selectedTime ? toCalSlotValue(selectedDate, selectedTime) : null
  const confirmUrl = selectedSlot ? `${profile.calendar}?slot=${encodeURIComponent(selectedSlot)}` : profile.calendar

  if (!selectedDate) {
    return (
      <div className="calendar-widget">
        <div>
          <p className="eyebrow">Europe/Warsaw</p>
          <h1>Umow spotkanie</h1>
          <p>Wybierz dzien, ktory pasuje do krotkiej rozmowy o projekcie.</p>
        </div>
        <div className="calendar-day-grid">
          {dateOptions.map((option) => (
            <button type="button" key={option.value} aria-label={option.fullLabel} onClick={() => setSelectedDate(option.value)}>
              <span>{option.weekday}</span>
              <strong>{option.day}</strong>
              <small>{option.month}</small>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedTime) {
    return (
      <div className="calendar-widget">
        <div className="calendar-toolbar">
          <div>
            <p className="eyebrow">{selectedOption?.fullLabel}</p>
            <h1>Wybierz godzine</h1>
            <p>Godziny sa podane dla strefy Europe/Warsaw.</p>
          </div>
          <button type="button" onClick={() => setSelectedDate(null)}>
            Zmien dzien
          </button>
        </div>
        <div className="calendar-time-grid">
          {TIME_OPTIONS.map((time) => (
            <button type="button" key={time} onClick={() => setSelectedTime(time)}>
              {time}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-widget">
      <div>
        <p className="eyebrow">Potwierdzenie</p>
        <h1>Termin gotowy</h1>
      </div>
      <div className="calendar-summary">
        <p>
          <span>Dzien</span>
          <strong>{selectedOption?.fullLabel}</strong>
        </p>
        <p>
          <span>Godzina</span>
          <strong>{selectedTime}</strong>
        </p>
      </div>
      <div className="calendar-actions">
        <a className="primary-link" href={confirmUrl} target="_blank" rel="noreferrer">
          <CalendarDays size={18} />
          Potwierdz termin
        </a>
        <button type="button" onClick={() => setSelectedTime(null)}>
          Zmien godzine
        </button>
        <button type="button" onClick={() => setSelectedDate(null)}>
          Zmien dzien
        </button>
      </div>
    </div>
  )
}

function GamesPanel({ game, setGame }: { game: Game; setGame: (game: Game) => void }) {
  if (game) {
    return (
      <div className="game-panel game-focus-panel">
        <div className="game-header">
          <strong>{getGameTitle(game)}</strong>
          <button type="button" onClick={() => setGame(null)}>
            Back
          </button>
        </div>
        {game === 'snake' ? <SnakeGame /> : null}
        {game === 'pong' ? <PongGame /> : null}
        {game === 'breakout' ? <BreakoutGame /> : null}
        {game === 'berni-rush' ? <BerniRushFrame /> : null}
        {game === 'neon-runner' ? <NeonRunnerGame /> : null}
      </div>
    )
  }

  return (
    <div className="game-launcher">
      <GameButton label="Berni Rush" description="Arena survival" icon={Sparkles} onClick={() => setGame('berni-rush')} />
      <GameButton label="Neon Runner" description="Jump and dodge" icon={Sparkles} onClick={() => setGame('neon-runner')} />
      <GameButton label="Snake" description="Classic grid" icon={Gamepad2} onClick={() => setGame('snake')} />
      <GameButton label="Pong" description="Arcade duel" icon={Gamepad2} onClick={() => setGame('pong')} />
      <GameButton label="Breakout" description="Brick chase" icon={Gamepad2} onClick={() => setGame('breakout')} />
    </div>
  )
}

function GameButton({
  description,
  icon: Icon,
  label,
  onClick,
}: {
  description: string
  icon: ComponentType<{ size?: number }>
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}>
      <Icon size={24} />
      <strong>{label}</strong>
      <span>{description}</span>
    </button>
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

function buildDateOptions() {
  const dayFormatter = new Intl.DateTimeFormat('pl-PL', { day: '2-digit' })
  const monthFormatter = new Intl.DateTimeFormat('pl-PL', { month: 'short' })
  const weekdayFormatter = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' })
  const fullFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  const options: DateOption[] = []
  let daysAhead = 1

  while (options.length < 8 && daysAhead < 40) {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + daysAhead)
    daysAhead += 1

    const weekday = date.getDay()
    if (weekday < 1 || weekday > 4) {
      continue
    }

    options.push({
      day: dayFormatter.format(date),
      fullLabel: fullFormatter.format(date),
      month: monthFormatter.format(date).replace('.', ''),
      value: toDateValue(date),
      weekday: weekdayFormatter.format(date).replace('.', ''),
    })
  }

  return options
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
  )
  const zonedTime = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second)

  return zonedTime - date.getTime()
}

function toCalSlotValue(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hour, minute] = timeValue.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const offset = getTimeZoneOffset(new Date(utcGuess), TIME_ZONE)

  return new Date(utcGuess - offset).toISOString()
}
