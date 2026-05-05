import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query, size = '10', sort = 'accuracy' } = req.query

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query param required' })
  }

  const params = new URLSearchParams({ query, size: String(size), sort: String(sort) })
  const kakaoRes = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
    headers: { Authorization: `KakaoAK ${process.env.VITE_KAKAO_API_KEY ?? ''}` },
  })

  const data = await kakaoRes.json()
  res.status(kakaoRes.status).json(data)
}
