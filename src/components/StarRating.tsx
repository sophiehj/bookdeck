interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly = false }: Props) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1" role="group" aria-label="별점">
      {stars.map((star) => {
        const full = value >= star
        const half = !full && value >= star - 0.5

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star}점`}
            onClick={() => onChange?.(value === star ? star - 0.5 : star)}
            className={`text-2xl leading-none transition-transform ${readonly ? '' : 'hover:scale-110 cursor-pointer'}`}
          >
            {full ? '⭐' : half ? '✨' : '☆'}
          </button>
        )
      })}
      <span className="text-sm text-[#6B7280] self-center ml-1">{value.toFixed(1)}</span>
    </div>
  )
}
