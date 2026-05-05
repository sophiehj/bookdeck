import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCardStore } from './cardStore'
import * as bookApi from '../services/bookApi'
import * as ai from '../services/ai'
import type { BookItem, AISummary, Category } from '../types'

vi.mock('../services/bookApi', () => ({
  fetchCategoryBooks: vi.fn(),
  CATEGORIES: [{ label: '소설', query: '소설', color: '#C3B1E1' }],
}))
vi.mock('../services/ai')
vi.mock('../services/firestore')

const mockCategory: Category = { label: '소설', query: '소설', color: '#C3B1E1' }

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
  line1: '핵심 내용 한 문장',
  line2: '이런 독자에게 맞습니다',
  cachedAt: Date.now(),
}

beforeEach(() => {
  vi.clearAllMocks()
  useCardStore.setState({
    category: null,
    cards: [],
    currentIndex: 0,
    loading: false,
    seenIsbns: new Set(),
  })
  vi.mocked(ai.generateBookSummary).mockResolvedValue(mockSummary)
})

describe('cardStore', () => {
  it('selectCategory 시 카드 5장을 로드한다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)

    await useCardStore.getState().selectCategory(mockCategory)

    expect(useCardStore.getState().cards).toHaveLength(5)
    expect(useCardStore.getState().loading).toBe(false)
    expect(useCardStore.getState().category).toEqual(mockCategory)
  })

  it('스와이프 시 currentIndex가 1 증가한다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().selectCategory(mockCategory)

    useCardStore.getState().swipe()

    expect(useCardStore.getState().currentIndex).toBe(1)
  })

  it('스와이프 시 seenIsbns에 추가된다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().selectCategory(mockCategory)

    useCardStore.getState().swipe()

    expect(useCardStore.getState().seenIsbns.has('isbn-0')).toBe(true)
  })

  it('goHome 시 category가 null로 초기화된다', async () => {
    const books = Array.from({ length: 5 }, (_, i) => mockBook(`isbn-${i}`))
    vi.mocked(bookApi.fetchCategoryBooks).mockResolvedValue(books)
    await useCardStore.getState().selectCategory(mockCategory)

    useCardStore.getState().goHome()

    expect(useCardStore.getState().category).toBeNull()
    expect(useCardStore.getState().cards).toHaveLength(0)
    expect(useCardStore.getState().currentIndex).toBe(0)
  })
})
