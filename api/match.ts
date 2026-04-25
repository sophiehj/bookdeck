import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from './_db.js'
import type { UserProfile, BookGroup, GroupMember } from './_db.js'

const MAX_GROUP = 5
const MIN_ACTIVE = 3

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setB = new Set(b)
  const intersection = a.filter((x) => setB.has(x)).length
  const union = new Set([...a, ...b]).size
  return intersection / union
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { uid, isbn, title } = req.body as { uid: string; isbn: string; title: string }
  if (!uid || !isbn) return res.status(400).json({ error: 'uid, isbn 필수' })

  const db = await getDb()
  const profiles = db.collection<UserProfile>('userProfiles')
  const groups = db.collection<BookGroup>('bookGroups')

  // 현재 유저 프로필
  const me = await profiles.findOne({ _id: uid })
  const myWants = me?.wantIsbns ?? []

  // 기존 그룹 확인
  const existing = await groups.findOne({ _id: isbn })
  if (existing) {
    const alreadyIn = existing.members.some((m) => m.uid === uid)
    if (alreadyIn) return res.status(200).json(existing)

    if (existing.members.length < MAX_GROUP) {
      // 그룹에 합류
      const othersWants = await Promise.all(
        existing.members.map(async (m) => {
          const p = await profiles.findOne({ _id: m.uid })
          return p?.wantIsbns ?? []
        }),
      )
      const avgSimilarity =
        othersWants.reduce((sum, w) => sum + jaccard(myWants, w), 0) /
        Math.max(othersWants.length, 1)

      const newMember: GroupMember = { uid, similarity: avgSimilarity, joinedAt: Date.now() }
      const updatedMembers = [...existing.members, newMember]
      const newStatus = updatedMembers.length >= MIN_ACTIVE ? 'active' : 'waiting'

      await groups.updateOne(
        { _id: isbn },
        { $push: { members: newMember }, $set: { status: newStatus } },
      )
      return res.status(200).json({ ...existing, members: updatedMembers, status: newStatus })
    }

    // 그룹이 꽉 참 — 대기 상태 반환
    return res.status(200).json({ ...existing, full: true })
  }

  // 같은 책 want한 다른 유저 검색
  const candidates = await profiles
    .find({ _id: { $ne: uid }, wantIsbns: isbn })
    .limit(20)
    .toArray()

  // Jaccard 유사도 계산 후 상위 4명 선택
  const ranked = candidates
    .map((c) => ({ uid: c._id, similarity: jaccard(myWants, c.wantIsbns) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_GROUP - 1)

  const members: GroupMember[] = [
    { uid, similarity: 1, joinedAt: Date.now() },
    ...ranked.map((r) => ({ ...r, joinedAt: Date.now() })),
  ]

  const group: BookGroup = {
    _id: isbn,
    title: title ?? '',
    members,
    status: members.length >= MIN_ACTIVE ? 'active' : 'waiting',
    createdAt: Date.now(),
  }

  await groups.insertOne(group)
  return res.status(200).json(group)
}
