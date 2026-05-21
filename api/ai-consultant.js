const DEFAULT_NVIDIA_API_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct'
const MAX_MESSAGE_LENGTH = 2200
const MAX_MESSAGES = 8
const rateLimit = new Map()

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.status(405).json({ message: 'Method not allowed.' })
    return
  }

  const ip = clientIp(request)
  if (isRateLimited(ip)) {
    response.status(429).json({ message: 'Too many AI assistant requests.' })
    return
  }

  const payload = parsePayload(request.body)
  if (!payload) {
    response.status(400).json({ message: 'Invalid AI assistant request.' })
    return
  }

  const apiKey = getNvidiaApiKey()
  if (!apiKey) {
    response.status(200).json({
      ok: true,
      answer: buildAiFallbackAnswer(payload.messages, payload.language),
      configured: false,
      fallback: true,
    })
    return
  }

  try {
    const aiResponse = await fetch(`${getNvidiaApiBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getNvidiaModel(),
        messages: [
          { role: 'system', content: buildSystemPrompt(payload.language) },
          ...payload.messages,
        ],
        max_tokens: 620,
        temperature: 0.25,
        top_p: 0.8,
        stream: false,
      }),
    })
    const result = await aiResponse.json().catch(() => ({}))

    if (!aiResponse.ok) {
      response.status(aiResponse.status >= 400 && aiResponse.status < 600 ? aiResponse.status : 502).json({
        message: result.error?.message || result.message || 'AI request failed.',
      })
      return
    }

    const answer = normalizeNvidiaContent(result.choices?.[0]?.message?.content)
    response.status(200).json({
      ok: true,
      answer: answer || buildAiFallbackAnswer(payload.messages, payload.language),
      configured: Boolean(answer),
      fallback: !answer,
    })
  } catch {
    response.status(200).json({
      ok: true,
      answer: buildAiFallbackAnswer(payload.messages, payload.language),
      configured: false,
      fallback: true,
    })
  }
}

function parsePayload(body) {
  const parsedBody = typeof body === 'string' ? parseJson(body) : body
  if (!parsedBody || typeof parsedBody !== 'object') {
    return null
  }

  const language = parsedBody.language === 'pl' ? 'pl' : 'en'
  if (!Array.isArray(parsedBody.messages)) {
    return null
  }

  const messages = parsedBody.messages
    .slice(-MAX_MESSAGES)
    .map((message) => {
      if (!message || typeof message !== 'object') {
        return null
      }

      if ((message.role !== 'assistant' && message.role !== 'user') || typeof message.content !== 'string') {
        return null
      }

      const content = message.content.trim().slice(0, MAX_MESSAGE_LENGTH)
      return content ? { role: message.role, content } : null
    })
    .filter(Boolean)

  return messages.length ? { language, messages } : null
}

function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function clientIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(',')[0]?.trim() || 'unknown'
  }

  return forwarded?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown'
}

function isRateLimited(ip) {
  const now = Date.now()
  const current = rateLimit.get(ip)

  if (!current || current.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }

  current.count += 1
  return current.count > 12
}

function getNvidiaApiKey() {
  return (
    process.env.NVIDIA_API_KEY?.trim() ||
    process.env.NVIDIA_NIM_API_KEY?.trim() ||
    process.env.NVCF_API_KEY?.trim() ||
    process.env.nvidia?.trim()
  )
}

function getNvidiaApiBaseUrl() {
  return (process.env.NVIDIA_API_BASE_URL?.trim() || DEFAULT_NVIDIA_API_BASE_URL).replace(/\/+$/, '')
}

function getNvidiaModel() {
  return process.env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL
}

function normalizeNvidiaContent(content) {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object' && 'text' in item) {
          return String(item.text)
        }

        return ''
      })
      .join('')
      .trim()
  }

  return ''
}

function buildAiFallbackAnswer(messages, language) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? ''
  const normalized = normalizeForIntent(latestQuestion)
  const isPolish = language === 'pl'

  if (!latestQuestion) {
    return isPolish
      ? 'Cześć, jestem AI Kacper. Zapytaj o projekty, B-CRM, stack, kontakt albo co kliknąć jako pierwsze.'
      : 'Hi, I am AI Kacper. Ask about projects, B-CRM, stack, contact or what to click first.'
  }

  if (hasAny(normalized, ['b-crm', 'b crm', 'crm', 'lead', 'sales', 'sprzedaz', 'sprzedaż'])) {
    return isPolish
      ? 'B-CRM to najmocniejszy projekt do sprawdzenia: CRM z rolami, statusami leadów, komentarzami, callbackami, spotkaniami, panelem admina i danymi w Supabase/PostgreSQL.'
      : 'B-CRM is the strongest project to review: a CRM with roles, lead statuses, comments, callbacks, meetings, an admin panel and Supabase/PostgreSQL-backed data.'
  }

  if (hasAny(normalized, ['project', 'projects', 'portfolio', 'projek', 'realizac'])) {
    return isPolish
      ? 'Najlepsza ścieżka: B-CRM jako dowód techniczny, główne portfolio jako case studies i SEO/Next.js, Berni Rush jako gameplay/web game, a kalkulator leasingu i BerniNutri jako prototypy narzędzi biznesowych.'
      : 'Best review path: B-CRM as the technical proof, the main portfolio for case studies and Next.js/SEO, Berni Rush for gameplay/web-game work, and the leasing calculator plus BerniNutri as business-tool prototypes.'
  }

  if (hasAny(normalized, ['stack', 'tech', 'technolog', 'typescript', 'react', 'next', 'supabase'])) {
    return isPolish
      ? 'Główny stack Kacpra to React, TypeScript, Next.js, Supabase/PostgreSQL, Tailwind CSS i Vercel.'
      : "Kacper's core stack is React, TypeScript, Next.js, Supabase/PostgreSQL, Tailwind CSS and Vercel."
  }

  if (hasAny(normalized, ['contact', 'kontakt', 'email', 'phone', 'telefon', 'book', 'meeting', 'spotkanie'])) {
    return isPolish
      ? 'Najprościej: otwórz okno Kontakt albo Kalendarz na tym pulpicie. Główna strona ma też pełny formularz kontaktowy i chronione dane kontaktowe.'
      : 'Simplest route: open Contact or Calendar on this desktop. The main portfolio also has a full contact flow and protected contact details.'
  }

  return isPolish
    ? 'Mogę pomóc szybko ogarnąć portfolio: pytaj o B-CRM, projekty, stack, kontakt albo to, które okno warto otworzyć najpierw.'
    : 'I can help you navigate the portfolio quickly: ask about B-CRM, projects, stack, contact, or which window is worth opening first.'
}

function normalizeForIntent(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(value, terms) {
  return terms.some((term) => value.includes(term))
}

function buildSystemPrompt(language) {
  const responseLanguage =
    language === 'pl'
      ? 'Answer in Polish unless the user clearly asks for English.'
      : 'Answer in English unless the user clearly asks for Polish.'

  return `
You are AI Kacper, a concise portfolio assistant inside Kacper Bernecki's interactive MacBook portfolio.
${responseLanguage}

Use only this portfolio context:
- Kacper is a Frontend Developer focused on React, TypeScript, Next.js, Supabase/PostgreSQL, Tailwind CSS and Vercel.
- He builds practical business web apps: CRMs, dashboards, forms, lead flows, workflow tools and API integrations.
- B-CRM is the strongest technical proof: lead management, roles, statuses, comments, callbacks, meetings, admin panel and Supabase/PostgreSQL data.
- Other projects include Berni Rush, BerniNutri AI, a leasing calculator and the main static portfolio with case studies.
- For contact, point users to the Contact or Calendar app on this desktop or the main portfolio contact section.

Keep answers short, practical and warm. Do not invent private contact details.
`
}
