import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecommendCard } from './RecommendCard'
import { useCardStore } from '../store/cardStore'
import { useAuthStore } from '../store/authStore'
import type { FeedbackType } from '../types'

const SWIPE_THRESHOLD = 80 // px

export function CardDeck() {
  const navigate = useNavigate()
  const { cards, currentIndex, loading, error, swipe } = useCardStore()
  const { user } = useAuthStore()

  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const current = cards[currentIndex]
  const next = cards[currentIndex + 1]

  // ─── 드래그 핸들러 ────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true)
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      setDragX(x - startX.current)
    }
    const onEnd = () => {
      setDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchend', onEnd)
      setDragX((dx) => {
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
          handleSwipe(dx > 0 ? 'want' : 'pass')
        }
        return 0
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchend', onEnd)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipe = useCallback(async (type: FeedbackType) => {
    const card = useCardStore.getState().cards[useCardStore.getState().currentIndex]
    if (!card) return
    if (type === 'want') {
      navigate(`/book/${card.book.isbn}`, { state: { book: card.book } })
    }
    await swipe(type, user?.uid)
  }, [navigate, swipe, user])

  // ─── 로딩 상태 ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center gap-3">
        <div className="w-full h-full rounded-3xl bg-white border border-[#E5E7EB] animate-pulse shadow-xl" />
        <p className="text-sm text-[#6B7280] absolute bottom-24">책을 불러오는 중…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="font-bold text-[#2D2D2D]">책을 불러오지 못했습니다</p>
        <p className="text-xs text-[#9CA3AF] max-w-xs break-all">{error}</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <p className="text-4xl">📚</p>
        <p className="font-bold text-[#2D2D2D]">오늘의 카드를 모두 봤어요!</p>
        <p className="text-sm text-[#6B7280]">내일 새로운 책이 기다립니다</p>
      </div>
    )
  }

  // ─── 카드 스타일 ────────────────────────────────────────────────────────
  const rotate = dragging ? dragX * 0.08 : 0
  const opacity = dragging ? Math.max(0.6, 1 - Math.abs(dragX) / 300) : 1

  const currentStyle: React.CSSProperties = {
    transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
    opacity,
    transition: dragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
    zIndex: 10,
  }

  const nextStyle: React.CSSProperties = {
    transform: `scale(${Math.min(1, 0.95 + Math.abs(dragX) / 2000)})`,
    opacity: Math.min(1, 0.5 + Math.abs(dragX) / 200),
    transition: dragging ? 'none' : 'all 0.3s ease',
    zIndex: 5,
  }

  // ─── 스와이프 힌트 오버레이 ─────────────────────────────────────────────
  const hintOpacity = Math.min(1, Math.abs(dragX) / 80)
  const isRight = dragX > 0

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 카드 영역 */}
      <div className="relative flex-1">
        {/* 다음 카드 (뒤에) */}
        {next && <RecommendCard card={next} style={nextStyle} />}

        {/* 현재 카드 */}
        <RecommendCard
          card={current}
          style={currentStyle}
          onDragStart={onDragStart}
        />

        {/* 스와이프 힌트 오버레이 */}
        {dragging && (
          <>
            <div
              className="absolute inset-0 rounded-3xl bg-[#B5EAD7]/60 flex items-center justify-center z-20 pointer-events-none"
              style={{ opacity: isRight ? hintOpacity : 0 }}
            >
              <span className="text-4xl font-bold text-[#3a8a6e]">✓ 읽을래요</span>
            </div>
            <div
              className="absolute inset-0 rounded-3xl bg-[#FFDAC1]/60 flex items-center justify-center z-20 pointer-events-none"
              style={{ opacity: !isRight ? hintOpacity : 0 }}
            >
              <span className="text-4xl font-bold text-[#b05a2a]">→ 패스</span>
            </div>
          </>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 pb-1">
        <button
          onClick={() => handleSwipe('pass')}
          className="flex-1 py-2.5 rounded-xl bg-white border-2 border-[#E5E7EB] text-[#6B7280] font-semibold text-sm hover:border-[#FFDAC1] hover:text-[#b05a2a] transition-all active:scale-95"
          aria-label="패스"
        >
          다음으로 →
        </button>
        <button
          onClick={() => handleSwipe('want')}
          className="flex-1 py-2.5 rounded-xl bg-[#C3B1E1] text-white font-semibold text-sm hover:bg-[#b09fd0] transition-all active:scale-95 shadow-md"
          aria-label="읽을래요"
        >
          읽을래요 ✓
        </button>
      </div>

      {/* 카드 진행 표시 */}
      <p className="text-center text-xs text-[#6B7280] pb-1">
        {currentIndex + 1}번째 카드
        {!user && ' · 로그인하면 취향이 기억됩니다'}
      </p>
    </div>
  )
}
