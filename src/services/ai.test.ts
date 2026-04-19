import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateBookSummary } from './ai'
import * as firestore from './firestore'
import type { BookItem, AISummary } from '../types'

vi.mock('./firestore')

const mockBook: BookItem = {
  isbn: '9791165341909',
  title: '채식주의자',
  authors: ['한강'],
  publisher: '창비',
  thumbnail: '',
  datetime: '',
  price: 12000,
  sale_price: 10800,
  url: '',
  contents: '채식을 선언한 여자와 그녀를 둘러싼 사람들의 이야기.',
}

const mockSummary: AISummary = {
  hook: '나는 꿈을 꿨어.',
  plot: '채식을 선언한 영혜와 가족의 갈등.',
  message: '폭력과 억압에 맞서는 개인의 저항.',
  recommend: '일상의 폭력을 직시하고 싶은 당신에게',
  reason: '삶의 무게를 느끼는 당신에게 지금 필요한 책',
  cachedAt: Date.now(),
}

// 가짜 Anthropic client
function makeMockClient(responseText: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: responseText }],
      }),
    },
  } as unknown as ReturnType<typeof import('./ai').createAnthropicClient>
}

beforeEach(() => vi.clearAllMocks())

describe('generateBookSummary', () => {
  it('캐시 히트 시 LLM을 호출하지 않고 캐시를 반환한다', async () => {
    vi.mocked(firestore.getCachedSummary).mockResolvedValueOnce(mockSummary)
    const mockClient = makeMockClient('')
    const result = await generateBookSummary(mockBook, mockClient)
    expect(result).toEqual(mockSummary)
    expect(mockClient.messages.create).not.toHaveBeenCalled()
    expect(firestore.saveCachedSummary).not.toHaveBeenCalled()
  })

  it('캐시 미스 시 LLM 호출 후 Firestore에 저장한다', async () => {
    vi.mocked(firestore.getCachedSummary).mockResolvedValueOnce(null)
    vi.mocked(firestore.saveCachedSummary).mockResolvedValueOnce(undefined)
    const mockClient = makeMockClient(JSON.stringify(mockSummary))

    const result = await generateBookSummary(mockBook, mockClient)

    expect(mockClient.messages.create).toHaveBeenCalledOnce()
    expect(result.hook).toBe(mockSummary.hook)
    expect(firestore.saveCachedSummary).toHaveBeenCalledWith(
      mockBook.isbn,
      expect.objectContaining({ hook: mockSummary.hook }),
    )
  })

  it('LLM 호출 시 max_tokens 400, Haiku 모델을 사용한다', async () => {
    vi.mocked(firestore.getCachedSummary).mockResolvedValueOnce(null)
    vi.mocked(firestore.saveCachedSummary).mockResolvedValueOnce(undefined)
    const mockClient = makeMockClient(JSON.stringify(mockSummary))

    await generateBookSummary(mockBook, mockClient)

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
      }),
    )
  })
})
