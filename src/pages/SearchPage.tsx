import { Layout } from '../components/Layout'
import { SearchBar } from '../components/SearchBar'
import { BookCard } from '../components/BookCard'
import { useBookSearch } from '../hooks/useBookSearch'

export function SearchPage() {
  const { query, setQuery, results, loading, error } = useBookSearch()

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#2D2D2D]">책 검색</h1>
          <p className="text-sm text-[#6B7280] mt-1">제목, 저자, ISBN으로 찾아보세요</p>
        </div>

        <SearchBar value={query} onChange={setQuery} />

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[#6B7280]">"{query}" 검색 결과 {results.length}권</p>
            {results.map((book) => <BookCard key={book.isbn} book={book} />)}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-center text-[#6B7280] text-sm py-10">검색 결과가 없습니다.</p>
        )}

        {!query && (
          <p className="text-center text-[#6B7280] text-sm py-10">검색어를 입력해주세요</p>
        )}
      </div>
    </Layout>
  )
}
