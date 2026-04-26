import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function KakaoCallbackPage() {
  const [params] = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    const error = params.get('error')

    const channel = new BroadcastChannel('kakao_auth')
    channel.postMessage({ type: 'kakao-auth-code', code, error })
    channel.close()
    window.close()
  }, [params])

  return (
    <div className="flex items-center justify-center h-screen text-sm text-[#6B7280]">
      카카오 로그인 처리 중…
    </div>
  )
}
