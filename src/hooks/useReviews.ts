import { useState, useEffect } from 'react'
import { getReviewsByIsbn, addReview, toggleReaction, getUserReaction } from '../services/firestore'
import type { Review, ReactionType } from '../types'

export function useReviews(isbn: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isbn) return
    setLoading(true)
    getReviewsByIsbn(isbn)
      .then(setReviews)
      .catch(() => setError('서평을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [isbn])

  const submitReview = async (review: Omit<Review, 'id'>) => {
    const id = await addReview(review)
    setReviews((prev) => [{ ...review, id }, ...prev])
    return id
  }

  const react = async (reviewId: string, userId: string, type: ReactionType) => {
    await toggleReaction(reviewId, userId, type)
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r
        return {
          ...r,
          reactions: { ...r.reactions, [type]: r.reactions[type] + 1 },
        }
      }),
    )
  }

  return { reviews, loading, error, submitReview, react, getUserReaction }
}
