import { useState, useEffect } from 'react'
import { matchGroup, fetchGroup, triggerModerator } from '../services/mongoApi'
import { GroupChat } from './GroupChat'
import type { BookGroup } from '../services/mongoApi'

interface Props {
  isbn: string
  title: string
  authors: string[]
  uid: string
  displayName: string
}

export function GroupMatchSection({ isbn, title, authors, uid, displayName }: Props) {
  const [group, setGroup] = useState<BookGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    // 기존 그룹 조회
    fetchGroup(isbn)
      .then(setGroup)
      .finally(() => setLoading(false))
  }, [isbn])

  const handleJoin = async () => {
    setJoining(true)
    try {
      const g = await matchGroup(uid, isbn, title)
      setGroup(g)
      // 그룹이 active가 되면 AI 모더레이터 토론 질문 생성 (중복 방지는 서버에서 처리)
      if (g.status === 'active') {
        triggerModerator(isbn, title, authors)
      }
    } finally {
      setJoining(false)
    }
  }

  const isInGroup = group?.members.some((m) => m.uid === uid)

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
        <div className="h-4 w-32 bg-[#E5E7EB] rounded animate-pulse mb-3" />
        <div className="h-3 w-48 bg-[#E5E7EB] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#2D2D2D]">독서 모임</h2>
        {group && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              group.status === 'active'
                ? 'bg-[#B5EAD7] text-[#3a8a6e]'
                : 'bg-[#FFF3CD] text-[#856404]'
            }`}
          >
            {group.status === 'active' ? '모임 활성' : '대기 중'}
          </span>
        )}
      </div>

      {/* 그룹 없음 — 참여 유도 */}
      {!group && (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-[#6B7280]">같은 책을 읽고 싶은 독자를 찾고 있어요</p>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="px-5 py-2 rounded-xl bg-[#C3B1E1] text-white text-sm font-semibold hover:bg-[#b09fd0] transition-all active:scale-95 disabled:opacity-60"
          >
            {joining ? '매칭 중…' : '독서 모임 참여하기'}
          </button>
        </div>
      )}

      {/* 그룹 있음 — 멤버 상태 */}
      {group && (
        <>
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">
              {group.status === 'active'
                ? `${group.members.length}명이 모였어요 — 지금 대화를 시작해보세요`
                : `${group.members.length}명 대기 중 · 3명이 되면 채팅이 열려요`}
            </p>
            {/* 멤버 아바타 */}
            <div className="flex gap-1.5">
              {group.members.map((m, i) => (
                <div
                  key={m.uid}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C3B1E1] to-[#B5EAD7] flex items-center justify-center text-xs font-bold text-white"
                  title={m.uid === uid ? '나' : `독자 ${i + 1}`}
                >
                  {m.uid === uid ? '나' : i + 1}
                </div>
              ))}
              {/* 빈 슬롯 */}
              {Array.from({ length: Math.max(0, 3 - group.members.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-[#E5E7EB] flex items-center justify-center text-xs text-[#9CA3AF]"
                >
                  ?
                </div>
              ))}
            </div>
          </div>

          {/* 참여 버튼 (미참여 상태) */}
          {!isInGroup && group.members.length < 5 && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-2 rounded-xl bg-[#C3B1E1] text-white text-sm font-semibold hover:bg-[#b09fd0] transition-all active:scale-95 disabled:opacity-60"
            >
              {joining ? '참여 중…' : '이 모임에 참여하기'}
            </button>
          )}

          {/* 채팅 (활성 + 참여 상태) */}
          {group.status === 'active' && isInGroup && (
            <GroupChat isbn={isbn} uid={uid} displayName={displayName} />
          )}

          {/* 대기 메시지 (참여했지만 아직 대기) */}
          {group.status === 'waiting' && isInGroup && (
            <p className="text-xs text-center text-[#9CA3AF] pt-1">
              더 많은 독자가 모이면 채팅이 시작됩니다
            </p>
          )}
        </>
      )}
    </div>
  )
}
