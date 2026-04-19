import { useState } from 'react'
import { StarRating } from './StarRating'
import type { Review } from '../types'

type Visibility = 'public' | 'friends' | 'private'

interface Props {
  isbn: string
  bookTitle: string
  userId: string
  userNickname: string
  userPhotoURL?: string
  onSubmit: (review: Omit<Review, 'id'>) => Promise<void>
  onCancel?: () => void
}

export function ReviewEditor({ isbn, bookTitle, userId, userNickname, userPhotoURL, onSubmit, onCancel }: Props) {
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isPublic, setIsPublic] = useState<Visibility>('public')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    await onSubmit({
      userId,
      userNickname,
      userPhotoURL,
      isbn,
      bookTitle,
      content,
      rating,
      isFinished,
      isPublic,
      reactions: { empathy: 0, counter: 0, impressive: 0 },
      createdAt: Date.now(),
    })
    setSubmitting(false)
    setContent('')
    setRating(0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
      <h3 className="font-semibold text-[#2D2D2D]">서평 쓰기</h3>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 이 책에서 가장 인상 깊었던 순간은?"
        rows={5}
        className="w-full resize-none rounded-xl border border-[#E5E7EB] p-3 text-sm text-[#2D2D2D] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C3B1E1]"
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[#6B7280] cursor-pointer">
          <input
            type="checkbox"
            checked={isFinished}
            onChange={(e) => setIsFinished(e.target.checked)}
            className="accent-[#C3B1E1]"
          />
          완독 완료
        </label>

        <select
          value={isPublic}
          onChange={(e) => setIsPublic(e.target.value as Visibility)}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C3B1E1]"
        >
          <option value="public">전체 공개</option>
          <option value="friends">친구 공개</option>
          <option value="private">비공개</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50">
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-5 py-2 text-sm rounded-xl bg-[#C3B1E1] text-white font-medium hover:bg-[#b09fd0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '등록 중…' : '등록'}
        </button>
      </div>
    </form>
  )
}
