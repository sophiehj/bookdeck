import { Link, useNavigate } from 'react-router-dom'
import { CategoryGrid } from '../components/CategoryGrid'
import { CardDeck } from '../components/CardDeck'
import { useCardStore } from '../store/cardStore'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  )
}

export function HomePage() {
  const { category, selectCategory, goHome } = useCardStore()
  const navigate = useNavigate()

  // ── 숏츠 뷰 ───────────────────────────────────────────────────────────────
  if (category) {
    return (
      <div className="bg-[#FAFAF7] flex flex-col overflow-hidden" style={{ height: '100svh' }}>
        <header className="shrink-0 bg-white/80 backdrop-blur border-b border-[#E5E7EB]">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <button
              onClick={goHome}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#2D2D2D] hover:bg-gray-100 transition-colors"
              aria-label="홈으로"
            >
              <HomeIcon />
            </button>
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: category.color, color: '#2D2D2D' }}
            >
              {category.label}
            </span>
            <Link
              to="/search"
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#2D2D2D] hover:bg-gray-100 transition-colors"
              aria-label="검색"
            >
              <SearchIcon />
            </Link>
          </div>
        </header>

        <main className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 py-4 flex flex-col">
          <CardDeck />
        </main>
      </div>
    )
  }

  // ── 홈 뷰 ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg text-[#2D2D2D] tracking-tight">📚 bookdeck</span>
          <Link
            to="/search"
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#2D2D2D] hover:bg-gray-100 transition-colors"
            aria-label="검색"
          >
            <SearchIcon />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <button
          onClick={() => navigate('/search')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#9CA3AF] text-sm text-left hover:border-[#C3B1E1] transition-colors"
        >
          <SearchIcon />
          책 제목, 저자를 검색해보세요
        </button>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#6B7280]">분야 선택</p>
          <CategoryGrid onSelect={selectCategory} />
        </div>
      </main>
    </div>
  )
}
