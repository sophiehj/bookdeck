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
  line1: '채식을 선언한 영혜의 조용한 저항이 가족 전체를 흔든다.',
  line2: '일상의 억압을 직시하고 싶은 당신에게.',
  cachedAt: Date.now(),
}

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
    expect(result.line1).toBe(mockSummary.line1)
    expect(firestore.saveCachedSummary).toHaveBeenCalledWith(
      mockBook.isbn,
      expect.objectContaining({ line1: mockSummary.line1 }),
    )
  })

  it('LLM 호출 시 max_tokens 300, Haiku 모델을 사용한다', async () => {
    vi.mocked(firestore.getCachedSummary).mockResolvedValueOnce(null)
    vi.mocked(firestore.saveCachedSummary).mockResolvedValueOnce(undefined)
    const mockClient = makeMockClient(JSON.stringify(mockSummary))

    await generateBookSummary(mockBook, mockClient)

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
      }),
    )
  })
})
