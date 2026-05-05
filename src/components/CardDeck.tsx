import { useState, useRef, useCallback } from 'react'
import { RecommendCard } from './RecommendCard'
import { useCardStore } from '../store/cardStore'

const SWIPE_THRESHOLD = 80

export function CardDeck() {
  const { cards, currentIndex, loading, error, swipe } = useCardStore()

  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)

  const current = cards[currentIndex]
  const next = cards[currentIndex + 1]

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true)
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      const y = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
      setDragX(x - startX.current)
      setDragY(y - startY.current)
    }
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchend', onEnd)
      setDragging(false)
      setDragX((dx) => {
        setDragY((dy) => {
          if (Math.abs(dx) >= SWIPE_THRESHOLD || Math.abs(dy) >= SWIPE_THRESHOLD) {
            swipe()
          }
          return 0
        })
        return 0
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchend', onEnd)
  }, [swipe])

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex-1 rounded-3xl bg-white border border-[#E5E7EB] animate-pulse shadow-xl" />
        <div className="h-12 rounded-xl bg-white border border-[#E5E7EB] animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="font-bold text-[#2D2D2D]">책을 불러오지 못했습니다</p>
        <p className="text-xs text-[#9CA3AF] max-w-xs">{error}</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">📚</p>
        <p className="font-bold text-[#2D2D2D]">이 분야의 책을 모두 봤어요!</p>
        <p className="text-sm text-[#6B7280]">다른 분야를 탐색해보세요</p>
      </div>
    )
  }

  const totalDrag = Math.sqrt(dragX ** 2 + dragY ** 2)
  const rotate = dragging ? dragX * 0.06 : 0
  const opacity = dragging ? Math.max(0.6, 1 - totalDrag / 400) : 1

  const currentStyle: React.CSSProperties = {
    transform: `translate(${dragX}px, ${dragY}px) rotate(${rotate}deg)`,
    opacity,
    transition: dragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
    zIndex: 10,
  }

  const nextStyle: React.CSSProperties = {
    transform: `scale(${Math.min(1, 0.95 + totalDrag / 2000)})`,
    opacity: Math.min(1, 0.5 + totalDrag / 200),
    transition: dragging ? 'none' : 'all 0.3s ease',
    zIndex: 5,
  }

  const hintOpacity = Math.min(1, totalDrag / 80)

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 카드 영역 */}
      <div className="relative flex-1 min-h-0">
        {next && <RecommendCard card={next} style={nextStyle} />}
        <RecommendCard card={current} style={currentStyle} onDragStart={onDragStart} />

        {dragging && totalDrag > 20 && (
          <div
            className="absolute inset-0 rounded-3xl bg-[#B5EAD7]/50 flex items-center justify-center z-20 pointer-events-none"
            style={{ opacity: hintOpacity }}
          >
            <span className="text-2xl font-bold text-[#3a8a6e]">다음 →</span>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={() => swipe()}
        className="shrink-0 w-full py-3 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] font-semibold text-sm hover:border-[#C3B1E1] hover:text-[#9b7fd4] transition-all active:scale-95"
        aria-label="다음 책"
      >
        다음 책 →
      </button>
    </div>
  )
}
