import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../_db'
import type { BookGroup } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { isbn } = req.query
  if (!isbn || typeof isbn !== 'string') return res.status(400).json({ error: 'isbn 필수' })

  const db = await getDb()
  const group = await db.collection<BookGroup>('bookGroups').findOne({ _id: isbn })

  if (!group) return res.status(404).json({ error: '그룹 없음' })
  return res.status(200).json(group)
}
