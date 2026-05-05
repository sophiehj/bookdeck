import { Link, useLocation } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function Layout({ children }: Props) {
  const { pathname } = useLocation()
  const isSearch = pathname === '/search'

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E5E7EB]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-[#2D2D2D] tracking-tight">
            📚 bookdeck
          </Link>
          <Link
            to={isSearch ? '/' : '/search'}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#2D2D2D] hover:bg-gray-100 transition-colors"
            aria-label="검색"
          >
            <SearchIcon />
          </Link>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
