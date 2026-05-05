import { CATEGORIES } from '../services/bookApi'
import type { Category } from '../types'

interface Props {
  onSelect: (category: Category) => void
}

export function CategoryGrid({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.query}
          onClick={() => onSelect(cat)}
          className="rounded-2xl flex items-center justify-center font-semibold text-[#2D2D2D] text-sm transition-transform active:scale-95 hover:brightness-95 h-20"
          style={{ backgroundColor: cat.color }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
