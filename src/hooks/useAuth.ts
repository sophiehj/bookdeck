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

  const signIn = () =>
    new Promise<void>((resolve, reject) => {
      let settled = false
      let cancelTimer: ReturnType<typeof setTimeout>

      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        window.removeEventListener('focus', onFocus)
        clearTimeout(cancelTimer)
        fn()
      }

      // 팝업 닫고 메인 창으로 돌아오면 Firebase에 3초 유예 후 강제 종료
      const onFocus = () => {
        cancelTimer = setTimeout(
          () => settle(() => reject(new Error('로그인 창이 닫혔습니다'))),
          3000,
        )
      }
      window.addEventListener('focus', onFocus)

      signInWithPopup(auth, googleProvider)
        .then(() => settle(resolve))
        .catch((e) => settle(() => reject(e)))
    })

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

      // BroadcastChannel: COOP 제약 없이 같은 origin 간 통신
      const channel = new BroadcastChannel('kakao_auth')

      const cleanup = (err?: Error) => {
        channel.close()
        clearTimeout(timeout)
        window.removeEventListener('focus', onWindowFocus)
        if (err) reject(err)
      }

      // 메인 창이 포커스 될 때 팝업이 닫혔는지 확인 (팝업 취소 감지)
      const onWindowFocus = () => {
        try {
          if (popup?.closed) cleanup(new Error('로그인 창이 닫혔습니다'))
        } catch {
          // COOP으로 접근 불가한 경우 무시
        }
      }
      window.addEventListener('focus', onWindowFocus)

      const timeout = setTimeout(() => {
        cleanup(new Error('로그인 시간 초과'))
      }, 5 * 60 * 1000)

      channel.onmessage = async (event: MessageEvent) => {
        window.removeEventListener('focus', onWindowFocus)
        channel.close()
        clearTimeout(timeout)

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
    })

  const signOutUser = () => signOut(auth)

  return { user, loading, signIn, signInWithKakao, signOut: signOutUser }
}
