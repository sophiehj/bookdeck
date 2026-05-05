import Anthropic from '@anthropic-ai/sdk'
import type { AISummary, BookItem } from '../types'
import { getCachedSummary, saveCachedSummary } from './firestore'

const SYSTEM_PROMPT = `You are a Korean book editor creating short summary cards for a shorts-style reading app.
Given book metadata, return ONLY a valid JSON object with no markdown, no explanation, no code fences.
All values must be in Korean. Be concise — each field is one sentence only.`

export function createAnthropicClient() {
  return new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
    dangerouslyAllowBrowser: true,
  })
}

function extractJson(raw: string): Record<string, string> | null {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

export async function generateBookSummary(
  book: BookItem,
  client = createAnthropicClient(),
): Promise<AISummary> {
  const cached = await getCachedSummary(book.isbn)
  if (cached) return cached

  const synopsis = book.contents.trim()
    ? `책 소개: ${book.contents}`
    : '(책 소개 없음 — 제목과 저자 정보만으로 작성해주세요)'

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `책 제목: ${book.title}
저자: ${book.authors.join(', ')}
출판사: ${book.publisher}
${synopsis}

아래 JSON 형식으로만 응답 (마크다운·설명 없이):
{"line1":"이 책의 핵심 내용 또는 가장 인상적인 한 장면 (1문장)","line2":"이런 독자에게 맞다 — ~하는 당신에게 (1문장)"}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = extractJson(raw)

  if (!parsed) {
    console.error('[AI parse failed]', book.isbn, raw.slice(0, 200))
    throw new Error('AI 응답 파싱 실패')
  }

  const summary: AISummary = {
    line1: parsed.line1 ?? '',
    line2: parsed.line2 ?? '',
    cachedAt: Date.now(),
  }

  await saveCachedSummary(book.isbn, summary)
  return summary
}
