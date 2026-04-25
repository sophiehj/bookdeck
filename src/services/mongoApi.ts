import type { BookGroup, Message } from '../../api/_db'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  return res.json()
}

// 스와이프 시 취향 프로필 동기화
export async function syncFeedback(uid: string, isbn: string, type: 'want' | 'pass') {
  return post('/api/feedback', { uid, isbn, type })
}

// 책에 대한 그룹 매칭 요청 (읽을래요 클릭 시)
export async function matchGroup(uid: string, isbn: string, title: string): Promise<BookGroup> {
  return post('/api/match', { uid, isbn, title })
}

// 그룹 정보 조회
export async function fetchGroup(isbn: string): Promise<BookGroup | null> {
  return get<BookGroup>(`/api/group/${isbn}`).catch(() => null)
}

// 채팅 메시지 목록
export async function fetchMessages(isbn: string): Promise<Message[]> {
  return get<Message[]>(`/api/messages/${isbn}`)
}

// 채팅 메시지 전송
export async function sendMessage(
  isbn: string,
  uid: string,
  displayName: string,
  text: string,
): Promise<Message> {
  return post(`/api/messages/${isbn}`, { uid, displayName, text })
}

export type { BookGroup, Message }
