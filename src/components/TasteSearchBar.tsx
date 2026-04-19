import { useState } from 'react'
import { useCardStore } from '../store/cardStore'
import { useAuthStore } from '../store/authStore'

export function TasteSearchBar() {
  const { tasteQuery, setTasteQuery } = useCardStore()
  const { user } = useAuthStore()
  const [input, setInput] = useState(tasteQuery)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTasteQuery(input.trim(), user?.uid)
  }

  function handleClear() {
    setInput('')
    setTasteQuery('', user?.uid)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="오늘의 기분을 텍스트로 바꾸면"
          className="w-full px-4 py-2.5 pr-8 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#2D2D2D] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2D2D2D] transition-colors"
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] text-lg leading-none"
            aria-label="지우기"
          >
            ×
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-2.5 rounded-xl bg-[#2D2D2D] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors shrink-0"
      >
        검색
      </button>
    </form>
  )
}
