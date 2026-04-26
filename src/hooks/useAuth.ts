import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, signInWithCustomToken } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'

const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY ?? ''
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            }
          : null,
      )
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading])

  const signIn = () => signInWithPopup(auth, googleProvider)

  const signInWithKakao = () =>
    new Promise<void>((resolve, reject) => {
      const redirectUri = `${window.location.origin}/kakao-callback`
      const url =
        `https://kauth.kakao.com/oauth/authorize` +
        `?client_id=${KAKAO_REST_KEY}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=profile_nickname`

      const popup = window.open(url, 'kakao-login', 'width=500,height=600,left=200,top=100')

      const handler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type !== 'kakao-auth-code') return

        window.removeEventListener('message', handler)
        clearInterval(timer)

        const { code, error } = event.data as { type: string; code?: string; error?: string }
        if (error || !code) return reject(new Error(error ?? '카카오 로그인 취소'))

        try {
          const res = await fetch(`${API_BASE}/api/kakao-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error((body as { error?: string }).error ?? `서버 오류 ${res.status}`)
          }
          const { customToken } = (await res.json()) as { customToken: string }
          await signInWithCustomToken(auth, customToken)
          resolve()
        } catch (e) {
          console.error('[kakao] error:', e)
          reject(e)
        }
      }

      window.addEventListener('message', handler)

      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer)
          window.removeEventListener('message', handler)
          reject(new Error('로그인 창이 닫혔습니다'))
        }
      }, 500)
    })

  const signOutUser = () => signOut(auth)

  return { user, loading, signIn, signInWithKakao, signOut: signOutUser }
}
