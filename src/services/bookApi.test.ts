import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchBooks } from './bookApi'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockDoc = {
  isbn: '9791165341909 1165341905',
  title: '채식주의자',
  authors: ['한강'],
  publisher: '창비',
  thumbnail: 'https://example.com/cover.jpg',
  datetime: '2007-10-30T00:00:00.000+09:00',
  price: 12000,
  sale_price: 10800,
  url: 'https://example.com',
  contents: '아주 긴 책 소개 내용'.repeat(50),
}

function mockResponse(docs: object[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ documents: docs, meta: { total_count: docs.length } }),
  })
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('searchBooks', () => {
  it('책 목록을 BookItem[] 형태로 반환한다', async () => {
    mockResponse([mockDoc])
    const result = await searchBooks('채식주의자')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('채식주의자')
    expect(result[0].authors).toEqual(['한강'])
  })

  it('ISBN은 마지막 값(13자리)만 추출한다', async () => {
    mockResponse([mockDoc])
    const result = await searchBooks('채식주의자')
    expect(result[0].isbn).toBe('1165341905')
  })

  it('contents를 500자로 자른다 — AI 토큰 절약', async () => {
    mockResponse([mockDoc])
    const result = await searchBooks('채식주의자')
    expect(result[0].contents.length).toBeLessThanOrEqual(500)
  })

  it('빈 쿼리 시 "베스트셀러"로 검색한다', async () => {
    mockResponse([mockDoc])
    await searchBooks('')
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain(encodeURIComponent('베스트셀러'))
  })

  it('API 오류 시 에러를 throw한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => '' })
    await expect(searchBooks('test')).rejects.toThrow('카카오 API 오류: 401')
  })
})
