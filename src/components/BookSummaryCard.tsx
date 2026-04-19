import type { AISummary } from '../types'

interface Props {
  summary: AISummary | null
  loading: boolean
}

export function BookSummaryCard({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-[#F3EFFE] border border-[#C3B1E1]/40 p-5 space-y-3 animate-pulse">
        <div className="h-4 bg-[#C3B1E1]/40 rounded w-3/4" />
        <div className="h-3 bg-[#C3B1E1]/30 rounded w-full" />
        <div className="h-3 bg-[#C3B1E1]/30 rounded w-5/6" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="rounded-2xl bg-[#F3EFFE] border border-[#C3B1E1]/40 p-5 space-y-4">
      <h3 className="text-xs font-semibold text-[#C3B1E1] uppercase tracking-widest">AI 요약</h3>
      <Row label="줄거리" text={summary.plot} />
      <Row label="핵심 메시지" text={summary.message} />
      <Row label="추천 독자" text={summary.recommend} />
    </div>
  )
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6B7280] mb-1">{label}</p>
      <p className="text-sm text-[#2D2D2D] leading-relaxed">{text}</p>
    </div>
  )
}
