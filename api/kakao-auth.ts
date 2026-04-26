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

  try {
    const { code, redirectUri } = req.body as { code?: string; redirectUri?: string }
    if (!code || !redirectUri) return res.status(400).json({ error: 'code, redirectUri 필수' })

    // 인증 코드 → 액세스 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      return res.status(401).json({ error: `카카오 토큰 교환 실패: ${tokenData.error}` })
    }

    // 카카오 유저 정보 조회
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!kakaoRes.ok) return res.status(401).json({ error: '카카오 유저 정보 조회 실패' })

    const kakaoUser = (await kakaoRes.json()) as {
      id: number
      kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } }
    }

    const uid = `kakao_${kakaoUser.id}`
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
