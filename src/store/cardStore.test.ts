import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCardStore } from './cardStore'
import * as bookApi from '../services/bookApi'
import * as ai from '../services/ai'
import * as firestore from '../services/firestore'
import type { BookItem, AISummary } from '../types'

vi.mock('../services/bookApi', () => ({
  fetchCategoryBooks: vi.fn(),
  searchBooks: vi.fn(),
  TRENDING_CATEGORIES: [{ label: '소설', query: '소설' }],
}))
vi.mock('../services/ai')
vi.mock('../services/firestore')

const mockBook = (isbn: string): BookItem => ({
  isbn,
  title: `책 ${isbn}`,
  authors: ['저자'],
  publisher: '출판사',
  thumbnail: '',
  datetime: '',
  price: 10000,
  sale_price: 9000,
  url: '',
  contents: '내용',
})

const mockSummary: AISummary = {
  hook: '훅 문장',
  plot: '줄거리',
  message: '메시지',
  recommend: '추천 독자',
  reason: '맞춤 이유',
  cachedAt: Date.now(),
}


beforeEach(() => {
  vi.clearAllMocks()
  useCardStore.setState({
    cards: [],
    currentIndex: 0,
    loading: true,
    seenIsbns: new Set(),
  })
  vi.mocked(firestore.getSeenIsbns).mockResolvedValue(new Set())
  vi.mocked(firestore.saveFeedback).mockResolvedValue(undefined)
  vi.mocked(firestore.addToWantToRead).mockResolvedValue(undefined)
  vi.mocked(ai.generateBookSummary).mockResolvedValue(mockSummary)
})

describe('cardStore', () => {
  it('init 시 카드 5장을 로드한다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)

    await useCardStore.getState().init()

    expect(useCardStore.getState().cards).toHaveLength(5)
    expect(useCardStore.getState().loading).toBe(false)
  })

  it('이미 본 ISBN은 카드에서 제외된다', async () => {
    const seen = new Set(['isbn-0', 'isbn-1'])
    vi.mocked(firestore.getSeenIsbns).mockResolvedValue(seen)
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)

    await useCardStore.getState().init('user1')

    const isbns = useCardStore.getState().cards.map((c) => c.book.isbn)
    expect(isbns).not.toContain('isbn-0')
    expect(isbns).not.toContain('isbn-1')
  })

  it('pass 스와이프 시 currentIndex가 1 증가한다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().init()

    await useCardStore.getState().swipe('pass')

    expect(useCardStore.getState().currentIndex).toBe(1)
  })

  it('want 스와이프 시 Firestore에 피드백이 저장된다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().init()

    await useCardStore.getState().swipe('want', 'user1')

    expect(firestore.saveFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'want', userId: 'user1' }),
    )
    expect(firestore.addToWantToRead).toHaveBeenCalledWith('user1', 'isbn-0')
  })

  it('pass 스와이프 시 seenIsbns에 추가된다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().init()

    await useCardStore.getState().swipe('pass')

    expect(useCardStore.getState().seenIsbns.has('isbn-0')).toBe(true)
  })

  it('취향 검색 시 searchBooks를 호출하고 카드를 교체한다', async () => {
    const categoryBooks = Array.from({ length: 5 }, (_, i) => mockBook(`cat-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(categoryBooks)
    await useCardStore.getState().init()

    const tasteBooks = Array.from({ length: 3 }, (_, i) => mockBook(`taste-${i}`))
    vi.mocked(bookApi.searchBooks).mockResolvedValue(tasteBooks)

    await useCardStore.getState().setTasteQuery('스릴러')

    expect(bookApi.searchBooks).toHaveBeenCalledWith('스릴러')
    const isbns = useCardStore.getState().cards.map((c) => c.book.isbn)
    expect(isbns).toEqual(expect.arrayContaining(['taste-0', 'taste-1', 'taste-2']))
    expect(useCardStore.getState().tasteQuery).toBe('스릴러')
  })
})
