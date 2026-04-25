import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { uid, isbn, type } = req.body as { uid: string; isbn: string; type: 'want' | 'pass' }
  if (!uid || !isbn || !type) return res.status(400).json({ error: 'uid, isbn, type 필수' })

  const db = await getDb()
  const field = type === 'want' ? 'wantIsbns' : 'passIsbns'
  const opposite = type === 'want' ? 'passIsbns' : 'wantIsbns'

  await db.collection('userProfiles').updateOne(
    { _id: uid },
    {
      $addToSet: { [field]: isbn },
      $pull: { [opposite]: isbn },
      $set: { updatedAt: Date.now() },
    },
    { upsert: true },
  )

  res.status(200).json({ ok: true })
}
