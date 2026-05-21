import { buildAiFallbackAnswer, type AiMessagePayload, type Language } from '../src/data/portfolio'

type ApiRequest = {
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  method?: string
  socket?: {
    remoteAddress?: string
  }
}

type ApiResponse = {
  end: () => void
  json: (payload: unknown) => void
  setHeader: (name: string, value: string) => void
  status: (code: number) => ApiResponse
}

type NvidiaChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
  error?: {
    message?: string
  }
  message?: string
}

const DEFAULT_NVIDIA_API_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct'
const MAX_MESSAGE_LENGTH = 2200
const MAX_MESSAGES = 8
const rateLimit = new Map<string, { count: number; resetAt: number }>()

export default async function handler(request: ApiRequest, response: ApiResponse) {
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
    const result = (await aiResponse.json().catch(() => ({}))) as NvidiaChatResponse

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

function parsePayload(body: unknown): { language: Language; messages: AiMessagePayload[] } | null {
  const parsedBody = typeof body === 'string' ? parseJson(body) : body
  if (!parsedBody || typeof parsedBody !== 'object') {
    return null
  }

  const candidate = parsedBody as { language?: unknown; messages?: unknown }
  const language: Language = candidate.language === 'pl' ? 'pl' : 'en'
  if (!Array.isArray(candidate.messages)) {
    return null
  }

  const messages = candidate.messages
    .slice(-MAX_MESSAGES)
    .map((message): AiMessagePayload | null => {
      if (!message || typeof message !== 'object') {
        return null
      }

      const item = message as { content?: unknown; role?: unknown }
      if ((item.role !== 'assistant' && item.role !== 'user') || typeof item.content !== 'string') {
        return null
      }

      const content = item.content.trim().slice(0, MAX_MESSAGE_LENGTH)
      return content ? { role: item.role, content } : null
    })
    .filter((message): message is AiMessagePayload => Boolean(message))

  return messages.length ? { language, messages } : null
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function clientIp(request: ApiRequest) {
  const forwarded = request.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(',')[0]?.trim() || 'unknown'
  }

  return forwarded?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown'
}

function isRateLimited(ip: string) {
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

function normalizeNvidiaContent(content: unknown) {
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

function buildSystemPrompt(language: Language) {
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
