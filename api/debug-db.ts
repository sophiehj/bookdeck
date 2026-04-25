import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const uri = process.env.MONGODB_URI ?? ''
  const masked = uri ? uri.replace(/:([^@]+)@/, ':***@') : '(없음)'

  if (!uri) return res.status(200).json({ error: 'MONGODB_URI 환경변수 없음', masked })

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
    await client.connect()
    await client.db('booklip').command({ ping: 1 })
    await client.close()
    return res.status(200).json({ ok: true, uri: masked })
  } catch (e) {
    return res.status(200).json({ error: (e as Error).message, uri: masked })
  }
}
