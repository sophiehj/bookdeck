import type { BookItem } from '../types'

// Cloudflare Worker 프록시 (Kakao Books API CORS 우회)
const PROXY = 'https://booklip-proxy.sophie-hjpark.workers.dev'

function toBookItem(doc: Record<string, unknown>): BookItem {
  return {
    isbn: (doc.isbn as string)?.split(' ').pop() ?? '',
    title: doc.title as string,
    authors: doc.authors as string[],
    publisher: doc.publisher as string,
    thumbnail: doc.thumbnail as string,
    datetime: doc.datetime as string,
    price: doc.price as number,
    sale_price: doc.sale_price as number,
    url: doc.url as string,
    contents: ((doc.contents as string) ?? '').slice(0, 500),
  }
}

async function searchKakao(query: string, size = 10, sort = 'accuracy'): Promise<BookItem[]> {
  const params = new URLSearchParams({ query, size: String(size), sort })
  const res = await fetch(`${PROXY}?${params}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`카카오 API 오류: ${res.status} - ${body.slice(0, 100)}`)
  }
  const data = await res.json()
  return (data.documents as Record<string, unknown>[])
    .filter((d) => d.isbn)
    .map(toBookItem)
}

export const TRENDING_CATEGORIES = [
  { label: '📖 소설', query: '소설' },
  { label: '🌱 자기계발', query: '자기계발' },
  { label: '💬 에세이', query: '에세이' },
  { label: '💰 경제·경영', query: '경제경영' },
]

export async function fetchCategoryBooks(query: string, size = 10): Promise<BookItem[]> {
  return searchKakao(query, size, 'latest')
}

export async function searchBooks(query: string): Promise<BookItem[]> {
  return searchKakao(query.trim() || '베스트셀러', 20)
}

export async function searchBooksDebounced(query: string, signal?: AbortSignal): Promise<BookItem[]> {
  const q = query.trim() || '베스트셀러'
  const params = new URLSearchParams({ query: q, size: '20' })
  const res = await fetch(`${PROXY}?${params}`, { signal })
  if (!res.ok) throw new Error(`카카오 API 오류: ${res.status}`)
  const data = await res.json()
  return (data.documents as Record<string, unknown>[]).filter((d) => d.isbn).map(toBookItem)
}
