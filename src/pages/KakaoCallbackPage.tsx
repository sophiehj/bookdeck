import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function KakaoCallbackPage() {
  const [params] = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    const error = params.get('error')

    if (window.opener) {
      window.opener.postMessage(
        { type: 'kakao-auth-code', code, error },
        window.location.origin,
      )
      window.close()
    }
  }, [params])

  return (
    <div className="flex items-center justify-center h-screen text-sm text-[#6B7280]">
      카카오 로그인 처리 중…
    </div>
  )
}
