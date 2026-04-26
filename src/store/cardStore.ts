import { create } from 'zustand'
import { fetchCategoryBooks, searchBooks, TRENDING_CATEGORIES } from '../services/bookApi'
import { generateBookSummary, generatePersonalizedReason } from '../services/ai'
import { saveFeedback, getSeenIsbns, addToWantToRead, getFeedbackCounts } from '../services/firestore'
import { syncFeedback } from '../services/mongoApi'
import type { CardItem, FeedbackType, BookItem } from '../types'

const BATCH = 5
const LIKED_AUTHOR_PER_BATCH = 2  // 배치당 좋아한 저자 책 최대 2권
let categoryIndex = 0
let likedAuthorIndex = 0

interface CardStore {
  cards: CardItem[]
  currentIndex: number
  loading: boolean
  error: string | null
  seenIsbns: Set<string>
  tasteQuery: string
  likedAuthors: string[]

  init: (userId?: string) => Promise<void>
  setTasteQuery: (query: string, userId?: string) => Promise<void>
  swipe: (type: FeedbackType, userId?: string) => Promise<void>
  loadMore: () => Promise<void>
}

async function fetchNextBatch(
  seenIsbns: Set<string>,
  tasteQuery?: string,
  likedAuthors: string[] = [],
): Promise<BookItem[]> {
  const results: BookItem[] = []

  if (tasteQuery) {
    const books = await searchBooks(tasteQuery)
    const fresh = books.filter((b) => b.isbn && !seenIsbns.has(b.isbn))
    results.push(...fresh.slice(0, BATCH))
    return results
  }

  // 좋아한 저자 기반 우선 추천 (배치당 최대 LIKED_AUTHOR_PER_BATCH권)
  if (likedAuthors.length > 0) {
    const author = likedAuthors[likedAuthorIndex % likedAuthors.length]
    likedAuthorIndex++
    const books = await searchBooks(author)
    const fresh = books.filter((b) => b.isbn && !seenIsbns.has(b.isbn))
    results.push(...fresh.slice(0, LIKED_AUTHOR_PER_BATCH))
  }

  // 나머지는 카테고리 로테이션으로 채움
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
  likedAuthors: [],

  async init(userId) {
    set({ loading: true, error: null })
    try {
      const [seen, counts] = await Promise.all([
        userId ? getSeenIsbns(userId) : Promise.resolve(new Set<string>()),
        userId ? getFeedbackCounts(userId) : Promise.resolve({ likedAuthors: [], passedAuthors: [] }),
      ])
      set({ seenIsbns: seen, likedAuthors: counts.likedAuthors })
      await get().loadMore()
    } catch (e) {
      set({ error: (e as Error).message ?? '책을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  async setTasteQuery(query, userId) {
    categoryIndex = 0
    likedAuthorIndex = 0
    const [seen, counts] = await Promise.all([
      userId ? getSeenIsbns(userId) : Promise.resolve(new Set<string>()),
      userId ? getFeedbackCounts(userId) : Promise.resolve({ likedAuthors: [], passedAuthors: [] }),
    ])
    set({ tasteQuery: query, cards: [], currentIndex: 0, loading: true, error: null, seenIsbns: seen, likedAuthors: counts.likedAuthors })
    try {
      await get().loadMore()
    } catch (e) {
      set({ error: (e as Error).message ?? '책을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  async loadMore() {
    const { seenIsbns, tasteQuery, likedAuthors } = get()
    const books = await fetchNextBatch(seenIsbns, tasteQuery || undefined, likedAuthors)

    const newCards: CardItem[] = books.map((book) => ({
      book,
      summary: null,
      summaryLoading: true,
    }))
    const insertAt = get().cards.length
    set((state) => ({ cards: [...state.cards, ...newCards] }))

    // AI 요약 로드 후 피드백 이력 있으면 reason 개인화
    books.forEach((book, i) => {
      const cardIndex = insertAt + i
      generateBookSummary(book)
        .then(async (summary) => {
          // 기본 요약 먼저 표시
          set((state) => {
            const updated = [...state.cards]
            updated[cardIndex] = { ...updated[cardIndex], summary, summaryLoading: false }
            return { cards: updated }
          })
          // 피드백 이력 있으면 reason 개인화 (비동기로 덮어쓰기)
          if (likedAuthors.length > 0) {
            const personalizedReason = await generatePersonalizedReason(book, likedAuthors).catch(() => '')
            if (personalizedReason) {
              set((state) => {
                const updated = [...state.cards]
                const card = updated[cardIndex]
                if (card?.summary) {
                  updated[cardIndex] = {
                    ...card,
                    summary: { ...card.summary, reason: personalizedReason },
                  }
                }
                return { cards: updated }
              })
            }
          }
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
      syncFeedback(userId, book.isbn, type).catch(() => {})

      // 읽을래요 시 likedAuthors 즉시 업데이트 (다음 배치부터 반영)
      if (type === 'want') {
        const current = get().likedAuthors
        const newAuthors = book.authors.filter((a) => !current.includes(a))
        if (newAuthors.length > 0) {
          set({ likedAuthors: [...current, ...newAuthors] })
        }
      }
    }

    const remaining = cards.length - (currentIndex + 1)
    if (remaining <= 2) await loadMore()
  },
}))
