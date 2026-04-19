// 도서
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

// AI 요약 카드
export interface AISummary {
  hook: string        // 한 문장 훅
  plot: string        // 줄거리
  message: string     // 핵심 메시지
  recommend: string   // 추천 독자
  reason: string      // 맞춤형 추천 이유 (이 사용자에게)
  cachedAt: number
}

// 카드 덱 아이템
export interface CardItem {
  book: BookItem
  summary: AISummary | null
  summaryLoading: boolean
}

// 피드백 타입
export type FeedbackType = 'want' | 'pass'

// 유저 피드백 (읽을래요 / 패스)
export interface UserFeedback {
  userId: string
  isbn: string
  type: FeedbackType
  title: string
  authors: string[]
  timestamp: number
}

// 서평
export interface Review {
  id?: string
  userId: string
  userNickname: string
  userPhotoURL?: string
  isbn: string
  bookTitle: string
  content: string
  rating: number
  isFinished: boolean
  isPublic: 'public' | 'friends' | 'private'
  reactions: {
    empathy: number
    counter: number
    impressive: number
  }
  createdAt: number
}

// 감정 반응 타입
export type ReactionType = 'empathy' | 'counter' | 'impressive'

// 유저 반응
export interface UserReaction {
  reviewId: string
  userId: string
  type: ReactionType
}

// 인증 유저
export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}
