import Anthropic from '@anthropic-ai/sdk'
import type { AISummary, BookItem } from '../types'
import { getCachedSummary, saveCachedSummary } from './firestore'

const SYSTEM_PROMPT = `You are a Korean book editor creating summary cards for a reading app.
Given book metadata, return ONLY a valid JSON object with no markdown, no explanation, no code fences.
All values must be in Korean. Keep each field concise.`

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
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `책 제목: ${book.title}
저자: ${book.authors.join(', ')}
출판사: ${book.publisher}
${synopsis}

아래 JSON 형식으로만 응답 (마크다운·설명 없이):
{"hook":"한 줄 핵심 문장","plot":"세계관·갈등 소개 2문장","message":"저자의 중심 통찰 1문장","recommend":"~하는 당신에게 (1문장)","reason":"지금 이 책이 필요한 이유 1문장"}`,
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
    hook: parsed.hook ?? '',
    plot: parsed.plot ?? '',
    message: parsed.message ?? '',
    recommend: parsed.recommend ?? '',
    reason: parsed.reason ?? '',
    cachedAt: Date.now(),
  }

  await saveCachedSummary(book.isbn, summary)
  return summary
}
