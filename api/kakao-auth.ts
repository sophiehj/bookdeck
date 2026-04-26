import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
  initializeApp({ credential: cert(serviceAccount) })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { accessToken } = req.body as { accessToken: string }
  if (!accessToken) return res.status(400).json({ error: 'accessToken 필수' })

  try {
    // 카카오 유저 정보 조회
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!kakaoRes.ok) return res.status(401).json({ error: '카카오 인증 실패' })

    const kakaoUser = (await kakaoRes.json()) as {
      id: number
      kakao_account?: {
        email?: string
        profile?: { nickname?: string; profile_image_url?: string }
      }
    }

    const kakaoId = String(kakaoUser.id)
    const uid = `kakao_${kakaoId}`
    const displayName = kakaoUser.kakao_account?.profile?.nickname ?? '카카오 유저'
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url ?? undefined

    const auth = getAuth()

    try {
      await auth.updateUser(uid, { displayName, photoURL })
    } catch {
      await auth.createUser({ uid, displayName, photoURL })
    }

    const customToken = await auth.createCustomToken(uid)
    return res.status(200).json({ customToken })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[kakao-auth] error:', msg)
    return res.status(500).json({ error: msg })
  }
}
