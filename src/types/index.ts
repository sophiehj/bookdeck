export interface BookItem {
  isbn: string
  title: string
  authors: string[]
  publisher: string
  thumbnail: string
  datetime: string
  price: number
  sale_price: number
  url: string
  contents: string
}

export interface AISummary {
  line1: string    // 핵심 내용 또는 인상적인 한 장면
  line2: string    // 이런 독자에게 맞다
  cachedAt: number
}

export interface CardItem {
  book: BookItem
  summary: AISummary | null
  summaryLoading: boolean
}

export interface Category {
  label: string   // 표시 이름
  query: string   // Kakao API 검색어
  color: string   // 파스텔 배경색 hex
}
