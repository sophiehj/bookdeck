import { useState, useEffect, useRef } from 'react'
import { searchBooks } from '../services/bookApi'
import type { BookItem } from '../types'

const DEBOUNCE_MS = 300

export function useBookSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchBooks(query)
        setResults(data)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('검색 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  return { query, setQuery, results, loading, error }
}
