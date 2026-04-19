import Anthropic from '@anthropic-ai/sdk'
import type { AISummary, BookItem } from '../types'
import { getCachedSummary, saveCachedSummary } from './firestore'

const SYSTEM_PROMPT = `You are a Korean book editor creating summary cards for a reading app.
Given book metadata, return ONLY a valid JSON object with no markdown, no explanation, no code fences.
All values must be in Korean.`

export function createAnthropicClient() {
  return new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
    dangerouslyAllowBrowser: true,
  })
}

function extractJson(raw: string): string {
  // Strip markdown code fences
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  // Extract first {...} block in case of extra text
  const match = stripped.match(/\{[\s\S]*\}/)
  return match ? match[0] : stripped
}

export async function generateBookSummary(
  book: BookItem,
  client = createAnthropicClient(),
): Promise<AISummary> {
  const cached = await getCachedSummary(book.isbn)
  if (cached) return cached

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `책 제목: ${book.title}
저자: ${book.authors.join(', ')}
출판사: ${book.publisher}
책 소개: ${book.contents}

JSON 형식으로만 응답 (마크다운 없이):
{"hook":"독자를 사로잡는 핵심 문장 1줄","plot":"스포일러 없이 세계관·갈등 소개 2-3문장","message":"저자가 전하는 중심 통찰 1-2문장","recommend":"어떤 독자에게 맞는지 1문장 (~하는 당신에게)","reason":"이 책이 지금 이 독자에게 필요한 이유 1문장"}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  console.log('[AI raw response]', book.isbn, raw)

  const jsonText = extractJson(raw)
  const parsed = JSON.parse(jsonText) as Omit<AISummary, 'cachedAt'>
  const summary: AISummary = { ...parsed, cachedAt: Date.now() }

  await saveCachedSummary(book.isbn, summary)
  return summary
}
