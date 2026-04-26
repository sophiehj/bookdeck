import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './_db.js'
import type { Message } from './_db.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { isbn, title, authors } = req.body as {
    isbn: string
    title: string
    authors: string[]
  }
  if (!isbn || !title) return res.status(400).json({ error: 'isbn, title 필수' })

  const db = await getDb()
  const col = db.collection<Message>('messages')

  // 이미 모더레이터 메시지가 있으면 중복 생성 방지
  const existing = await col.findOne({ groupIsbn: isbn, uid: 'moderator' })
  if (existing) return res.status(200).json({ ok: true, skipped: true })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `책 제목: ${title}
저자: ${authors?.join(', ') ?? ''}

이 책을 함께 읽은 독서 모임을 위해 토론 질문 3개를 만들어줘.
답변 없이 질문만, 번호 붙여서, 한 줄씩. 예시:
1. ...
2. ...
3. ...`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  const msg: Message = {
    groupIsbn: isbn,
    uid: 'moderator',
    displayName: '📚 AI 모더레이터',
    text,
    createdAt: Date.now(),
  }
  await col.insertOne(msg)

  return res.status(200).json({ ok: true, text })
}
