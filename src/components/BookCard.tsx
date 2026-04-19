import { useNavigate } from 'react-router-dom'
import type { BookItem } from '../types'

interface Props {
  book: BookItem
}

export function BookCard({ book }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/book/${book.isbn}`, { state: { book } })}
      className="flex gap-3 p-3 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow text-left w-full"
    >
      {book.thumbnail ? (
        <img
          src={book.thumbnail}
          alt={book.title}
          className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-20 rounded-lg bg-[#C3B1E1]/30 flex items-center justify-center flex-shrink-0 text-2xl">
          📖
        </div>
      )}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <p className="font-semibold text-[#2D2D2D] text-sm leading-snug line-clamp-2">{book.title}</p>
        <p className="text-[#6B7280] text-xs">{book.authors.join(', ')}</p>
        <p className="text-[#6B7280] text-xs">{book.publisher}</p>
      </div>
    </button>
  )
}
