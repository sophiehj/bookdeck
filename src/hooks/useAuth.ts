import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, signInWithCustomToken } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY ?? ''
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function loadKakaoSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Kakao?.isInitialized()) return resolve()
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      window.Kakao.init(KAKAO_JS_KEY)
      resolve()
    }
    document.head.appendChild(script)
  })
}

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

  const signInWithKakao = async () => {
    await loadKakaoSDK()
    return new Promise<void>((resolve, reject) => {
      window.Kakao.Auth.login({
        scope: 'profile_nickname',
        success: async (authObj) => {
          try {
            const res = await fetch(`${API_BASE}/api/kakao-auth`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: authObj.access_token }),
            })
            if (!res.ok) {
              const body = await res.json().catch(() => ({}))
              throw new Error(`카카오 인증 서버 오류 (${res.status}): ${JSON.stringify(body)}`)
            }
            const { customToken } = await res.json()
            await signInWithCustomToken(auth, customToken)
            resolve()
          } catch (e) {
            console.error('[kakao] success callback error:', e)
            reject(e)
          }
        },
        fail: (err) => {
          console.error('[kakao] login fail:', err)
          reject(err)
        },
      })
    })
  }

  const signOutUser = () => signOut(auth)

  return { user, loading, signIn, signInWithKakao, signOut: signOutUser }
}
