import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { BookSummaryCard } from '../components/BookSummaryCard'
import { ReviewEditor } from '../components/ReviewEditor'
import { ReviewCard } from '../components/ReviewCard'
import { generateBookSummary } from '../services/ai'
import { useReviews } from '../hooks/useReviews'
import { useAuthStore } from '../store/authStore'
import { GroupMatchSection } from '../components/GroupMatchSection'
import { DisqusComments } from '../components/DisqusComments'
import { AdBanner } from '../components/AdBanner'
import type { BookItem, AISummary, ReactionType } from '../types'

export function BookDetailPage() {
  const { isbn } = useParams<{ isbn: string }>()
  const { state } = useLocation()
  const navigate = useNavigate()
  const book = state?.book as BookItem | undefined

  const [summary, setSummary] = useState<AISummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)

  const { user } = useAuthStore()
  const { reviews, loading: reviewsLoading, submitReview, react } = useReviews(isbn ?? '')

  useEffect(() => {
    if (!book) return
    generateBookSummary(book)
      .then(setSummary)
      .finally(() => setSummaryLoading(false))
  }, [book])

  if (!book) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-[#6B7280]">책 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#C3B1E1] text-sm underline">
            홈으로 돌아가기
          </button>
        </div>
      </Layout>
    )
  }

  const handleReact = (reviewId: string, type: ReactionType) => {
    if (!user) return
    react(reviewId, user.uid, type)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 뒤로가기 */}
        <button onClick={() => navigate(-1)} className="text-sm text-[#6B7280] hover:text-[#2D2D2D]">
          ← 뒤로
        </button>

        {/* 한 문장 훅 — Hero */}
        {summary?.hook && (
          <div className="rounded-2xl bg-gradient-to-br from-[#C3B1E1]/20 to-[#B5EAD7]/20 p-6">
            <p className="font-serif text-xl font-bold text-[#2D2D2D] leading-relaxed">
              "{summary.hook}"
            </p>
          </div>
        )}

        {/* 책 메타 */}
        <div className="flex gap-4">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={book.title} className="w-20 h-28 object-cover rounded-xl shadow-sm flex-shrink-0" />
          ) : (
            <div className="w-20 h-28 rounded-xl bg-[#C3B1E1]/20 flex items-center justify-center text-3xl flex-shrink-0">📖</div>
          )}
          <div className="space-y-1 pt-1">
            <h1 className="font-bold text-[#2D2D2D] leading-snug">{book.title}</h1>
            <p className="text-sm text-[#6B7280]">{book.authors.join(', ')}</p>
            <p className="text-sm text-[#6B7280]">{book.publisher}</p>
          </div>
        </div>

        {/* AI 요약 카드 */}
        <BookSummaryCard summary={summary} loading={summaryLoading} />

        {/* 광고 */}
        <AdBanner slot="YOUR_AD_SLOT_ID" />

        {/* 독서 모임 */}
        {user ? (
          <GroupMatchSection
            isbn={book.isbn}
            title={book.title}
            authors={book.authors}
            uid={user.uid}
            displayName={user.displayName ?? '독자'}
          />
        ) : (
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 text-center space-y-2">
            <p className="font-semibold text-[#2D2D2D]">독서 모임</p>
            <p className="text-sm text-[#6B7280]">로그인하면 같은 취향의 독자와 함께 읽을 수 있어요</p>
          </div>
        )}

        {/* 서평 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2D2D2D]">서평 {reviews.length > 0 ? `(${reviews.length})` : ''}</h2>
            {user ? (
              <button
                onClick={() => setShowEditor((v) => !v)}
                className="text-sm px-4 py-1.5 rounded-xl bg-[#C3B1E1] text-white font-medium hover:bg-[#b09fd0] transition-colors"
              >
                {showEditor ? '취소' : '서평 쓰기'}
              </button>
            ) : (
              <p className="text-xs text-[#6B7280]">로그인 후 서평을 남길 수 있어요</p>
            )}
          </div>

          {showEditor && user && (
            <ReviewEditor
              isbn={book.isbn}
              bookTitle={book.title}
              userId={user.uid}
              userNickname={user.displayName ?? '익명'}
              userPhotoURL={user.photoURL ?? undefined}
              onSubmit={async (review) => {
                await submitReview(review)
                setShowEditor(false)
              }}
              onCancel={() => setShowEditor(false)}
            />
          )}

          {reviewsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
              ))}
            </div>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <p className="text-center text-[#6B7280] text-sm py-8">첫 서평을 남겨보세요 ✍️</p>
          )}

          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.uid}
              onReact={handleReact}
            />
          ))}
        </div>

        {/* Disqus 댓글 */}
        <DisqusComments isbn={book.isbn} />
      </div>
    </Layout>
  )
}
