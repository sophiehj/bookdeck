import type { ReactionType, Review } from '../types'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'empathy', emoji: '🤝', label: '공감' },
  { type: 'counter', emoji: '💬', label: '반박' },
  { type: 'impressive', emoji: '✨', label: '인상적' },
]

interface Props {
  review: Review
  myReaction: ReactionType | null
  onReact: (type: ReactionType) => void
  disabled?: boolean
}

export function ReactionButtons({ review, myReaction, onReact, disabled }: Props) {
  return (
    <div className="flex gap-2" role="group" aria-label="감정 반응">
      {REACTIONS.map(({ type, emoji, label }) => {
        const active = myReaction === type
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={label}
            onClick={() => onReact(type)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${active
                ? 'bg-[#C3B1E1] border-[#C3B1E1] text-white'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C3B1E1]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            <span className="ml-0.5 font-bold text-xs">{review.reactions[type]}</span>
          </button>
        )
      })}
    </div>
  )
}
