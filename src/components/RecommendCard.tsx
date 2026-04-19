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
      {/* 상단: 파스텔 배경 — 한 문장 + 책 표지 */}
      <div className="bg-[#EDE9F8] px-5 pt-5 pb-4 flex items-start gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold text-[#9b7fd4] tracking-widest uppercase">한 문장</p>
          {summaryLoading ? (
            <div className="space-y-2 pt-1">
              <div className="h-3 bg-[#C3B1E1]/40 rounded animate-pulse w-full" />
              <div className="h-3 bg-[#C3B1E1]/40 rounded animate-pulse w-4/5" />
            </div>
          ) : (
            <p className="font-bold text-[#2D2D2D] text-base leading-snug line-clamp-3">
              "{summary?.hook ?? '—'}"
            </p>
          )}
        </div>
        {book.thumbnail && (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-xl shadow-md shrink-0"
            draggable={false}
          />
        )}
      </div>

      {/* 하단: 흰 배경 — 제목·줄거리·이유 */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-3 gap-3 min-h-0">

        {/* 제목 · 저자 */}
        <div className="shrink-0">
          <h2 className="font-bold text-[#2D2D2D] text-lg leading-snug line-clamp-1">{book.title}</h2>
          <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-1">{book.authors.join(', ')} · {book.publisher}</p>
        </div>

        {/* 줄거리 */}
        <div className="flex-1 min-h-0">
          <p className="text-xs font-semibold text-[#6B7280] mb-1">📖 줄거리</p>
          {summaryLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-[#E5E7EB] rounded animate-pulse w-full" />
              <div className="h-3 bg-[#E5E7EB] rounded animate-pulse w-11/12" />
              <div className="h-3 bg-[#E5E7EB] rounded animate-pulse w-4/5" />
            </div>
          ) : (
            <p className="text-sm text-[#2D2D2D] leading-relaxed line-clamp-6">
              {summary?.plot ?? '—'}
            </p>
          )}
        </div>

        {/* 당신에게 맞는 이유 */}
        <div className="rounded-2xl bg-[#FFF8F3] border border-[#FFDAC1]/60 px-4 py-3 shrink-0">
          <p className="text-xs font-semibold text-[#d4936b] mb-1">✨ 당신에게 맞는 이유</p>
          {summaryLoading ? (
            <div className="h-3 bg-[#FFDAC1]/40 rounded animate-pulse w-4/5" />
          ) : (
            <p className="text-sm text-[#2D2D2D] leading-relaxed line-clamp-2">
              {summary?.reason ?? '—'}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
