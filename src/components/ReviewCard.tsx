import { useState, useEffect } from 'react'
import { StarRating } from './StarRating'
import { ReactionButtons } from './ReactionButtons'
import { getUserReaction } from '../services/firestore'
import type { Review, ReactionType } from '../types'

interface Props {
  review: Review
  currentUserId?: string
  onReact: (reviewId: string, type: ReactionType) => void
}

export function ReviewCard({ review, currentUserId, onReact }: Props) {
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null)

  useEffect(() => {
    if (!currentUserId || !review.id) return
    getUserReaction(review.id, currentUserId).then(setMyReaction)
  }, [review.id, currentUserId])

  const handleReact = (type: ReactionType) => {
    if (!currentUserId || !review.id) return
    setMyReaction((prev) => (prev === type ? null : type))
    onReact(review.id!, type)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        {review.userPhotoURL ? (
          <img src={review.userPhotoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#C3B1E1]/30 flex items-center justify-center text-sm">👤</div>
        )}
        <div>
          <p className="text-sm font-medium text-[#2D2D2D]">{review.userNickname}</p>
          <p className="text-xs text-[#6B7280]">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
        <div className="ml-auto">
          <StarRating value={review.rating} readonly />
        </div>
      </div>

      <p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{review.content}</p>

      {review.isFinished && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#B5EAD7]/40 text-[#3a8a6e] font-medium">완독</span>
      )}

      <ReactionButtons
        review={review}
        myReaction={myReaction}
        onReact={handleReact}
        disabled={!currentUserId}
      />
    </div>
  )
}
