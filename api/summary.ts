import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { maxDuration: 30 }

const SYSTEM_PROMPT = `You are a Korean book editor creating short summary cards for a shorts-style reading app.
Given book metadata, return ONLY a valid JSON object with no markdown, no explanation, no code fences.
All values must be in Korean. Be concise — each field is one sentence only.`

function extractJson(raw: string): Record<string, string> | null {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = req.body ?? {}
  const title = body.title as string | undefined
  const authors = body.authors as string[] | undefined
  const publisher = body.publisher as string | undefined
  const contents = body.contents as string | undefined

  if (!title) return res.status(400).json({ error: 'title required' })

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY ?? ''
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const synopsis = contents?.trim()
    ? `책 소개: ${contents}`
    : '(책 소개 없음 — 제목과 저자 정보만으로 작성해주세요)'

  const prompt = `책 제목: ${title}
저자: ${authors?.join(', ') ?? ''}
출판사: ${publisher ?? ''}
${synopsis}

아래 JSON 형식으로만 응답 (마크다운·설명 없이):
{"line1":"이 책의 핵심 내용 또는 가장 인상적인 한 장면 (1문장)","line2":"이런 독자에게 맞다 — ~하는 당신에게 (1문장)"}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text().catch(() => '')
      console.error('[summary] Anthropic error', anthropicRes.status, err.slice(0, 300))
      return res.status(502).json({ error: `Anthropic ${anthropicRes.status}: ${err.slice(0, 100)}` })
    }

    const data = await anthropicRes.json()
    const raw = data.content?.[0]?.text ?? ''
    const parsed = extractJson(raw)
    if (!parsed) {
      console.error('[summary] parse failed', raw.slice(0, 200))
      return res.status(500).json({ error: 'parse failed', raw: raw.slice(0, 100) })
    }

    return res.status(200).json({ line1: parsed.line1 ?? '', line2: parsed.line2 ?? '' })
  } catch (e) {
    clearTimeout(timeout)
    console.error('[summary] fetch error', e)
    return res.status(502).json({ error: String(e) })
  }
}
