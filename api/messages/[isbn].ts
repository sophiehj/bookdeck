import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb } from '../_db.js'
import type { Message } from '../_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { isbn } = req.query
  if (!isbn || typeof isbn !== 'string') return res.status(400).json({ error: 'isbn 필수' })

  const db = await getDb()
  const col = db.collection<Message>('messages')

  if (req.method === 'GET') {
    const msgs = await col
      .find({ groupIsbn: isbn })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray()
    return res.status(200).json(msgs)
  }

  if (req.method === 'POST') {
    const { uid, displayName, text } = req.body as {
      uid: string
      displayName: string
      text: string
    }
    if (!uid || !text?.trim()) return res.status(400).json({ error: 'uid, text 필수' })

    const msg: Message = {
      groupIsbn: isbn,
      uid,
      displayName: displayName ?? '익명',
      text: text.trim(),
      createdAt: Date.now(),
    }
    await col.insertOne(msg)
    return res.status(201).json(msg)
  }

  return res.status(405).end()
}
