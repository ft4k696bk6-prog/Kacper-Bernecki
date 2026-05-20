import { useEffect, useMemo, useRef, useState } from 'react'
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
import type { PortfolioCopy } from '../data/portfolio'
import { usePortfolioLanguage } from '../i18n'
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

type MacDesktopProps = {
  onShutdown?: () => void
}

export function MacDesktop({ onShutdown }: MacDesktopProps) {
  const { lang, t } = usePortfolioLanguage()
  const { about, profile, projects, skillGroups, terminalCommands } = t
  const desktopApps = useMemo<PanelApp[]>(
    () => [
      { id: 'projects', label: t.ui.desktopApps.projects, icon: FolderKanban, panel: 'projects' },
      { id: 'about', label: t.ui.desktopApps.about, icon: UserRound, panel: 'about' },
      { id: 'games', label: t.ui.desktopApps.games, icon: Gamepad2, panel: 'games' },
      { id: 'contact', label: t.ui.desktopApps.contact, icon: Mail, panel: 'contact' },
    ],
    [t],
  )
  const dockPanelApps = useMemo<PanelApp[]>(
    () => [
      { id: 'terminal', label: t.ui.dock.terminal, icon: Terminal, panel: 'terminal' },
      { id: 'calendar', label: t.ui.dock.calendar, icon: CalendarDays, panel: 'calendar' },
    ],
    [t],
  )
  const dockLinkApps = useMemo<LinkApp[]>(
    () => [
      { id: 'github', label: t.ui.dock.github, icon: GitBranch, href: profile.github },
      { id: 'linkedin', label: t.ui.dock.linkedin, icon: UsersRound, href: profile.linkedin },
      { id: 'portfolio', label: t.ui.dock.portfolio, icon: BriefcaseBusiness, href: profile.staticPortfolio },
    ],
    [profile.github, profile.linkedin, profile.staticPortfolio, t],
  )
  const [panel, setPanel] = useState<Panel>(null)
  const [hovered, setHovered] = useState<string>(t.ui.osName)
  const [game, setGame] = useState<Game>(null)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const [lines, setLines] = useState<Line[]>(() => getInitialLines(t))
  const lineId = useRef(2)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHovered(t.ui.osName)
      setLines(getInitialLines(t))
      setHistory([])
      setHistoryIndex(null)
      setCommand('')
      lineId.current = 2
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [lang, t])

  function openPanel(nextPanel: Exclude<Panel, null>) {
    setGame(null)
    setPanel(nextPanel)
    setHovered(getPanelTitle(nextPanel, t))
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
        terminalCommands.map((item) => `${item} - ${describeCommand(item, t)}`),
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
      appendLine('output', [
        `${t.ui.actions.portfolio}: ${profile.staticPortfolio}`,
        `GitHub: ${profile.github}`,
        `LinkedIn: ${profile.linkedin}`,
      ])
      return
    }

    if (normalized === 'open github') {
      openExternal(profile.github)
      appendLine('system', t.ui.commandMessages.github)
      return
    }

    if (normalized === 'open linkedin') {
      openExternal(profile.linkedin)
      appendLine('system', t.ui.commandMessages.linkedin)
      return
    }

    if (normalized === 'open portfolio') {
      openExternal(profile.staticPortfolio)
      appendLine('system', t.ui.commandMessages.portfolio)
      return
    }

    if (normalized === 'open calendar') {
      openPanel('calendar')
      appendLine('system', t.ui.commandMessages.calendar)
      return
    }

    if (normalized === 'play snake') {
      openGame('snake')
      appendLine('system', t.ui.commandMessages.snake)
      return
    }

    if (normalized === 'play pong') {
      openGame('pong')
      appendLine('system', t.ui.commandMessages.pong)
      return
    }

    if (normalized === 'play breakout') {
      openGame('breakout')
      appendLine('system', t.ui.commandMessages.breakout)
      return
    }

    if (normalized === 'play neon runner') {
      openGame('neon-runner')
      appendLine('system', t.ui.commandMessages.neonRunner)
      return
    }

    if (normalized === 'berni rush') {
      openGame('berni-rush')
      appendLine('system', t.ui.commandMessages.berniRush)
      return
    }

    appendLine('error', t.ui.unknownCommand(value))
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
    <section className="desktop-shell" aria-label={t.ui.ariaDesktop}>
      <div className="desktop-wallpaper">
        <div className="menu-bar">
          <div>
            <span>{t.ui.osName}</span>
          </div>
          <div className="menu-actions">
            <span>{profile.name}</span>
          </div>
        </div>

        <div className={`desktop-layout ${panel ? 'has-window' : 'is-wallpaper-only'}`}>
          <div className="icon-grid" aria-label={t.ui.desktopIcons}>
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
                title={getPanelTitle(panel, t)}
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

        <div className="dock" aria-label={t.ui.quickActions}>
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
              aria-label={t.ui.shutDown}
              onClick={onShutdown}
              onFocus={() => setHovered(t.ui.shutDown)}
              onMouseEnter={() => setHovered(t.ui.shutDown)}
            >
              <Power size={22} />
              <span className="dock-tooltip" aria-hidden="true">
                {t.ui.shutDown}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function getInitialLines(t: PortfolioCopy): Line[] {
  return [
    {
      id: 1,
      tone: 'system',
      text: [...t.ui.terminalIntro],
    },
  ]
}

function describeCommand(command: string, t: PortfolioCopy) {
  return t.ui.commandDescriptions[command as keyof typeof t.ui.commandDescriptions] ?? 'run command'
}

function getPanelTitle(panel: Exclude<Panel, null>, t: PortfolioCopy) {
  return t.ui.panelTitles[panel]
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
  const { t } = usePortfolioLanguage()

  return (
    <article className="app-window">
      <header>
        <div className="traffic">
          <button type="button" aria-label={t.ui.closeWindow} onClick={onClose}></button>
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
  const { t } = usePortfolioLanguage()
  const { about, profile } = t

  return (
    <div className="panel-stack about-panel">
      <p className="eyebrow">{profile.title}</p>
      <h1>{profile.name}</h1>
      {about.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <div className="pill-row">
        {t.ui.aboutPills.map((pill) => (
          <span key={pill}>{pill}</span>
        ))}
      </div>
    </div>
  )
}

function ProjectsPanel() {
  const { t } = usePortfolioLanguage()

  return (
    <div className="project-list">
      {t.projects.map((project) => (
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
                {t.ui.actions.live}
              </a>
            ) : null}
            {'repoUrl' in project && project.repoUrl ? (
              <a href={project.repoUrl} target="_blank" rel="noreferrer">
                <GitBranch size={16} />
                {t.ui.actions.repo}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function SkillsPanel() {
  const { t } = usePortfolioLanguage()

  return (
    <div className="skill-grid">
      {t.skillGroups.map((group) => (
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
  const { t } = usePortfolioLanguage()
  const { profile } = t

  return (
    <div className="contact-grid">
      <ActionCard href={profile.github} icon={GitBranch} label="GitHub" value="ft4k696bk6-prog" />
      <ActionCard href={profile.linkedin} icon={UsersRound} label="LinkedIn" value="kacper-bernecki" />
      <ActionCard href={profile.staticPortfolio} icon={BriefcaseBusiness} label={t.ui.actions.portfolio} value="kacper-portfolio.vercel.app" />
      <ActionButton icon={CalendarDays} label={t.ui.actions.calendar} value={t.ui.actions.calendarValue} onClick={onOpenCalendar} />
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
  const { lang, t } = usePortfolioLanguage()
  const { profile } = t
  const dateOptions = useMemo(() => buildDateOptions(lang), [lang])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const selectedOption = dateOptions.find((option) => option.value === selectedDate)
  const selectedSlot = selectedDate && selectedTime ? toCalSlotValue(selectedDate, selectedTime) : null
  const confirmUrl = selectedSlot ? `${profile.calendar}?slot=${encodeURIComponent(selectedSlot)}` : profile.calendar

  if (!selectedDate) {
    return (
      <div className="calendar-widget">
        <div>
          <p className="eyebrow">{t.ui.calendar.timeZone}</p>
          <h1>{t.ui.calendar.title}</h1>
          <p>{t.ui.calendar.description}</p>
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
            <h1>{t.ui.calendar.chooseTime}</h1>
            <p>{t.ui.calendar.timeDescription}</p>
          </div>
          <button type="button" onClick={() => setSelectedDate(null)}>
            {t.ui.calendar.changeDay}
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
        <p className="eyebrow">{t.ui.calendar.confirmationEyebrow}</p>
        <h1>{t.ui.calendar.confirmationTitle}</h1>
      </div>
      <div className="calendar-summary">
        <p>
          <span>{t.ui.calendar.day}</span>
          <strong>{selectedOption?.fullLabel}</strong>
        </p>
        <p>
          <span>{t.ui.calendar.time}</span>
          <strong>{selectedTime}</strong>
        </p>
      </div>
      <div className="calendar-actions">
        <a className="primary-link" href={confirmUrl} target="_blank" rel="noreferrer">
          <CalendarDays size={18} />
          {t.ui.calendar.confirm}
        </a>
        <button type="button" onClick={() => setSelectedTime(null)}>
          {t.ui.calendar.changeTime}
        </button>
        <button type="button" onClick={() => setSelectedDate(null)}>
          {t.ui.calendar.changeDay}
        </button>
      </div>
    </div>
  )
}

function GamesPanel({ game, setGame }: { game: Game; setGame: (game: Game) => void }) {
  const { t } = usePortfolioLanguage()

  if (game) {
    return (
      <div className="game-panel game-focus-panel">
        <div className="game-header">
          <strong>{getGameTitle(game)}</strong>
          <button type="button" onClick={() => setGame(null)}>
            {t.ui.games.back}
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
      <GameButton label="Berni Rush" description={t.ui.games.berniRush} icon={Sparkles} onClick={() => setGame('berni-rush')} />
      <GameButton label="Neon Runner" description={t.ui.games.neonRunner} icon={Sparkles} onClick={() => setGame('neon-runner')} />
      <GameButton label="Snake" description={t.ui.games.snake} icon={Gamepad2} onClick={() => setGame('snake')} />
      <GameButton label="Pong" description={t.ui.games.pong} icon={Gamepad2} onClick={() => setGame('pong')} />
      <GameButton label="Breakout" description={t.ui.games.breakout} icon={Gamepad2} onClick={() => setGame('breakout')} />
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
  const { t } = usePortfolioLanguage()

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
        <label htmlFor="desktop-terminal-input">{t.ui.terminalPrompt}</label>
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

function buildDateOptions(lang: 'en' | 'pl') {
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US'
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit' })
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' })
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const fullFormatter = new Intl.DateTimeFormat(locale, {
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
