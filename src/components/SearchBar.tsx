import { useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = '책 제목, 저자, ISBN 검색' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E5E7EB] bg-white text-[#2D2D2D] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#C3B1E1] shadow-sm text-base"
      />
    </div>
  )
}
