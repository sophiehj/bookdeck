import { create } from 'zustand'
import { fetchCategoryBooks } from '../services/bookApi'
import { generateBookSummary } from '../services/ai'
import type { CardItem, BookItem, Category } from '../types'

const BATCH = 5

interface CardStore {
  category: Category | null
  cards: CardItem[]
  currentIndex: number
  loading: boolean
  error: string | null
  seenIsbns: Set<string>

  selectCategory: (category: Category) => Promise<void>
  goHome: () => void
  swipe: () => void
  loadMore: () => Promise<void>
}

async function fetchNextBatch(query: string, seenIsbns: Set<string>): Promise<BookItem[]> {
  const books = await fetchCategoryBooks(query, 20)
  return books.filter((b) => b.isbn && !seenIsbns.has(b.isbn)).slice(0, BATCH)
}

function loadSummaries(books: BookItem[], insertAt: number, set: (fn: (s: CardStore) => Partial<CardStore>) => void) {
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
      .catch(() => {
        set((state) => {
          const updated = [...state.cards]
          updated[cardIndex] = { ...updated[cardIndex], summaryLoading: false }
          return { cards: updated }
        })
      })
  })
}

export const useCardStore = create<CardStore>((set, get) => ({
  category: null,
  cards: [],
  currentIndex: 0,
  loading: false,
  error: null,
  seenIsbns: new Set(),

  async selectCategory(category) {
    set({ category, cards: [], currentIndex: 0, seenIsbns: new Set(), loading: true, error: null })
    try {
      await get().loadMore()
    } catch (e) {
      set({ error: (e as Error).message ?? '책을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  goHome() {
    set({ category: null, cards: [], currentIndex: 0, seenIsbns: new Set(), error: null })
  },

  async loadMore() {
    const { category, seenIsbns } = get()
    if (!category) return

    const books = await fetchNextBatch(category.query, seenIsbns)
    const insertAt = get().cards.length
    const newCards: CardItem[] = books.map((book) => ({ book, summary: null, summaryLoading: true }))

    set((state) => ({ cards: [...state.cards, ...newCards] }))
    loadSummaries(books, insertAt, set)
  },

  swipe() {
    const { cards, currentIndex, seenIsbns, loadMore } = get()
    const current = cards[currentIndex]
    if (!current) return

    const newSeen = new Set(seenIsbns)
    newSeen.add(current.book.isbn)
    set({ seenIsbns: newSeen, currentIndex: currentIndex + 1 })

    if (cards.length - (currentIndex + 1) <= 2) loadMore()
  },
}))
