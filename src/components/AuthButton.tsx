import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#3C1E1E" d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.7 5.1 4.3 6.6L5.1 21l4.6-2.4c.75.1 1.52.2 2.3.2 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
    </svg>
  )
}

export function AuthButton() {
  const { user, signIn, signInWithKakao, signOut } = useAuth()
  const [loading, setLoading] = useState<null | 'google' | 'kakao'>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (provider: 'google' | 'kakao') => {
    setLoading(provider)
    setError(null)
    try {
      if (provider === 'google') await signIn()
      else await signInWithKakao()
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'auth/popup-blocked') {
        setError('팝업이 차단됐습니다. 브라우저에서 팝업을 허용해주세요.')
      } else if (code === 'auth/unauthorized-domain') {
        setError(`도메인 미등록 — Firebase Console Authorized domains에 "${window.location.hostname}" 추가 필요`)
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(null)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <img src={user.photoURL} alt={user.displayName ?? ''} className="w-8 h-8 rounded-full" />
        )}
        <button
          onClick={signOut}
          className="text-sm text-[#6B7280] hover:text-[#2D2D2D] transition-colors"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={() => handleSignIn('google')}
        disabled={loading !== null}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#2D2D2D] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
      >
        <GoogleIcon />
        <span>{loading === 'google' ? '로그인 중…' : 'Google로 로그인'}</span>
      </button>
      <button
        onClick={() => handleSignIn('kakao')}
        disabled={loading !== null}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEE500] text-[#3C1E1E] text-sm font-medium hover:bg-[#f5dc00] transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
      >
        <KakaoIcon />
        <span>{loading === 'kakao' ? '로그인 중…' : '카카오로 로그인'}</span>
      </button>
      {error && (
        <p className="text-xs text-red-400 max-w-[200px] text-right leading-tight">{error}</p>
      )}
    </div>
  )
}
