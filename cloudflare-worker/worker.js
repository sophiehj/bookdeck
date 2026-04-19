const KAKAO_API_KEY = '4967a981e94c7342d24dabee8e6e5c7a'
const KAKAO_BASE = 'https://dapi.kakao.com/v3/search/book'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const query = url.searchParams.get('query') ?? ''
    const size = url.searchParams.get('size') ?? '10'
    const sort = url.searchParams.get('sort') ?? 'accuracy'

    if (!query) {
      return new Response(JSON.stringify({ documents: [], meta: { total_count: 0 } }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const kakaoUrl = `${KAKAO_BASE}?query=${encodeURIComponent(query)}&size=${size}&sort=${sort}`
    const kakaoRes = await fetch(kakaoUrl, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    })

    const data = await kakaoRes.json()

    return new Response(JSON.stringify(data), {
      status: kakaoRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  },
}
