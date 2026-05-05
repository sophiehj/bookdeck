import type { BookItem, Category } from '../types'

// 개발: Vite 프록시(카카오 API 키는 vite.config에서 주입)
// 운영: Cloudflare Worker
const PROXY = import.meta.env.DEV
  ? '/kakao-api/v3/search/book'
  : 'https://bookdeck-proxy.sophie-hjpark.workers.dev'

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
    .filter((d) => d.isbn && (d.contents as string))
    .map(toBookItem)
}

export const CATEGORIES: Category[] = [
  { label: '자기계발', query: '자기계발',  color: '#FFDAC1' },
  { label: '소설',    query: '소설',       color: '#C3B1E1' },
  { label: '에세이',  query: '에세이',     color: '#B5EAD7' },
  { label: '경제·경영', query: '경제경영', color: '#FFEAA7' },
  { label: '역사',    query: '역사',       color: '#B8E4F9' },
  { label: '과학',    query: '과학',       color: '#C7E9B0' },
  { label: '인문',    query: '인문',       color: '#F7C5C5' },
  { label: '사회',    query: '사회',       color: '#FAD4B4' },
  { label: '예술',    query: '예술',       color: '#D4C5F9' },
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
