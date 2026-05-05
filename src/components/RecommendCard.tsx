import type { CardItem } from '../types'

interface Props {
  card: CardItem
  style?: React.CSSProperties
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void
}

export function RecommendCard({ card, style, onDragStart }: Props) {
  const { book, summary, summaryLoading } = card

  return (
    <div
      className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col"
      style={style}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
    >
      {/* 책 표지 — 상단 55% */}
      <div
        className="relative shrink-0 bg-[#F3F0FB] flex items-center justify-center"
        style={{ height: '55%' }}
      >
        {book.thumbnail ? (
          <img
            src={(() => {
              try {
                const fname = new URL(book.thumbnail).searchParams.get('fname')
                return fname ?? book.thumbnail
              } catch {
                return book.thumbnail
              }
            })()}
            alt={book.title}
            className="h-full w-auto max-w-full object-contain drop-shadow-md"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">📖</div>
        )}
      </div>

      {/* 책 정보 + 2문장 요약 — 하단 45% */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-3 min-h-0">
        <div className="shrink-0">
          <h2 className="font-bold text-[#2D2D2D] text-lg leading-snug line-clamp-1">{book.title}</h2>
          <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-1">{book.authors.join(', ')} · {book.publisher}</p>
        </div>

        <div className="flex-1 min-h-0 space-y-2">
          {summaryLoading ? (
            <>
              <div className="h-3 bg-[#E5E7EB] rounded animate-pulse w-full" />
              <div className="h-3 bg-[#E5E7EB] rounded animate-pulse w-11/12" />
              <div className="h-3 bg-[#C3B1E1]/30 rounded animate-pulse w-4/5 mt-2" />
            </>
          ) : (
            <>
              <p className="text-sm text-[#2D2D2D] leading-relaxed line-clamp-2">
                {summary?.line1 ?? '—'}
              </p>
              <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2 italic">
                {summary?.line2 ?? '—'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
