import { create } from 'zustand'
import { fetchCategoryBooks, searchBooks, TRENDING_CATEGORIES } from '../services/bookApi'
import { generateBookSummary } from '../services/ai'
import { saveFeedback, getSeenIsbns, addToWantToRead } from '../services/firestore'
import type { CardItem, FeedbackType, BookItem } from '../types'

const BATCH = 5
let categoryIndex = 0

interface CardStore {
  cards: CardItem[]
  currentIndex: number
  loading: boolean
  error: string | null
  seenIsbns: Set<string>
  tasteQuery: string

  init: (userId?: string) => Promise<void>
  setTasteQuery: (query: string, userId?: string) => Promise<void>
  swipe: (type: FeedbackType, userId?: string) => Promise<void>
  loadMore: () => Promise<void>
}

async function fetchNextBatch(seenIsbns: Set<string>, tasteQuery?: string): Promise<BookItem[]> {
  const results: BookItem[] = []

  if (tasteQuery) {
    const books = await searchBooks(tasteQuery)
    const fresh = books.filter((b) => b.isbn && !seenIsbns.has(b.isbn))
    results.push(...fresh.slice(0, BATCH))
    return results
  }

  let attempts = 0
  while (results.length < BATCH && attempts < TRENDING_CATEGORIES.length * 2) {
    const cat = TRENDING_CATEGORIES[categoryIndex % TRENDING_CATEGORIES.length]
    categoryIndex++
    attempts++

    const books = await fetchCategoryBooks(cat.query, 10)
    const fresh = books.filter((b) => b.isbn && !seenIsbns.has(b.isbn))
    results.push(...fresh.slice(0, BATCH - results.length))
  }

  return results
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  currentIndex: 0,
  loading: true,
  error: null,
  seenIsbns: new Set(),
  tasteQuery: '',

  async init(userId) {
    set({ loading: true, error: null })
    try {
      const seen = userId ? await getSeenIsbns(userId) : new Set<string>()
      set({ seenIsbns: seen })
      await get().loadMore()
    } catch (e) {
      set({ error: (e as Error).message ?? '책을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  async setTasteQuery(query, userId) {
    categoryIndex = 0
    const seen = userId ? await getSeenIsbns(userId) : new Set<string>()
    set({ tasteQuery: query, cards: [], currentIndex: 0, loading: true, error: null, seenIsbns: seen })
    try {
      await get().loadMore()
    } catch (e) {
      set({ error: (e as Error).message ?? '책을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  async loadMore() {
    const { seenIsbns, tasteQuery } = get()
    const books = await fetchNextBatch(seenIsbns, tasteQuery || undefined)

    // 책 기본 정보로 카드 즉시 추가 — 삽입 시점 인덱스를 state에서 직접 읽음
    const newCards: CardItem[] = books.map((book) => ({
      book,
      summary: null,
      summaryLoading: true,
    }))
    const insertAt = get().cards.length
    set((state) => ({ cards: [...state.cards, ...newCards] }))

    // AI 요약 병렬 로드 — 완료되는 순서대로 카드 업데이트
    books.forEach((book, i) => {
      const cardIndex = insertAt + i
      generateBookSummary(book)
        .then((summary) => {
          set((state) => {
            const updated = [...state.cards]
            updated[cardIndex] = { ...updated[cardIndex], summary, summaryLoading: false }
            return { cards: updated }
          })
        })
        .catch((err) => {
          console.error('[AI summary error]', book.isbn, err)
          set((state) => {
            const updated = [...state.cards]
            updated[cardIndex] = { ...updated[cardIndex], summaryLoading: false }
            return { cards: updated }
          })
        })
    })
  },

  async swipe(type, userId) {
    const { cards, currentIndex, seenIsbns, loadMore } = get()
    const current = cards[currentIndex]
    if (!current) return

    const { book } = current
    const newSeen = new Set(seenIsbns)
    newSeen.add(book.isbn)
    set({ seenIsbns: newSeen, currentIndex: currentIndex + 1 })

    // 피드백 저장 (로그인 시)
    if (userId) {
      await saveFeedback({
        userId,
        isbn: book.isbn,
        type,
        title: book.title,
        authors: book.authors,
        timestamp: Date.now(),
      })
      if (type === 'want') await addToWantToRead(userId, book.isbn)
    }

    // 남은 카드 2장 이하 → 추가 로드
    const remaining = cards.length - (currentIndex + 1)
    if (remaining <= 2) await loadMore()
  },
}))
