import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuthStore } from '../store/authStore'
import { getWantList, getMyReviews } from '../services/firestore'
import type { UserFeedback, Review } from '../types'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-xs text-[#C3B1E1]">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

export function MyPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'want' | 'reviews'>('want')
  const [wantList, setWantList] = useState<UserFeedback[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([getWantList(user.uid), getMyReviews(user.uid)])
      .then(([wants, revs]) => {
        setWantList(wants)
        setReviews(revs)
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-3">
          <p className="text-[#6B7280]">로그인 후 마이페이지를 이용할 수 있어요.</p>
          <button onClick={() => navigate('/')} className="text-sm text-[#C3B1E1] underline">
            홈으로
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 프로필 */}
        <div className="flex items-center gap-4 py-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName ?? ''} className="w-14 h-14 rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#C3B1E1]/30 flex items-center justify-center text-2xl">
              📖
            </div>
          )}
          <div>
            <p className="font-bold text-[#2D2D2D]">{user.displayName ?? '독자'}</p>
            <p className="text-sm text-[#6B7280]">{user.email ?? ''}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              읽고 싶은 책 {wantList.length}권 · 서평 {reviews.length}개
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#E5E7EB]">
          {(['want', 'reviews'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-[#C3B1E1] border-b-2 border-[#C3B1E1]'
                  : 'text-[#6B7280] hover:text-[#2D2D2D]'
              }`}
            >
              {t === 'want' ? `읽고 싶은 책 (${wantList.length})` : `내 서평 (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
            ))}
          </div>
        ) : tab === 'want' ? (
          <WantList items={wantList} />
        ) : (
          <ReviewList items={reviews} />
        )}
      </div>
    </Layout>
  )
}

function WantList({ items }: { items: UserFeedback[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-[#6B7280] text-sm py-12">
        아직 읽고 싶은 책이 없어요.<br />카드를 스와이프해서 찜해보세요 📚
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.isbn}
          to={`/book/${item.isbn}`}
          state={{ book: { isbn: item.isbn, title: item.title, authors: item.authors, thumbnail: '', publisher: '', datetime: '', price: 0, sale_price: 0, url: '', contents: '' } }}
          className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#C3B1E1] transition-colors"
        >
          <div className="w-12 h-16 rounded-lg bg-[#C3B1E1]/20 flex items-center justify-center text-xl flex-shrink-0">
            📖
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#2D2D2D] text-sm leading-snug line-clamp-2">{item.title}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{item.authors.join(', ')}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {new Date(item.timestamp).toLocaleDateString('ko-KR')} 찜
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ReviewList({ items }: { items: Review[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-[#6B7280] text-sm py-12">
        아직 작성한 서평이 없어요.<br />책 상세 페이지에서 서평을 남겨보세요 ✍️
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {items.map((review) => (
        <Link
          key={review.id}
          to={`/book/${review.isbn}`}
          className="block bg-white border border-[#E5E7EB] rounded-2xl p-4 hover:border-[#C3B1E1] transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-[#2D2D2D] line-clamp-1">{review.bookTitle}</p>
            <StarDisplay rating={review.rating} />
          </div>
          <p className="text-sm text-[#6B7280] line-clamp-3 leading-relaxed">{review.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-[#9CA3AF]">
              {new Date(review.createdAt).toLocaleDateString('ko-KR')}
            </p>
            {review.isFinished && (
              <span className="text-xs bg-[#B5EAD7]/40 text-[#2D2D2D] px-1.5 py-0.5 rounded-full">완독</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
