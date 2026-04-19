import {
  collection, doc, getDoc, setDoc, addDoc,
  updateDoc, increment, query, where,
  orderBy, getDocs, Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AISummary, Review, UserReaction, ReactionType, UserFeedback, FeedbackType } from '../types'

// ─── AI 요약 캐시 ────────────────────────────────────────────────────────────

export async function getCachedSummary(isbn: string): Promise<AISummary | null> {
  const snap = await getDoc(doc(db, 'books', isbn))
  if (!snap.exists()) return null
  const data = snap.data()
  return (data?.aiSummary as AISummary) ?? null
}

export async function saveCachedSummary(isbn: string, summary: AISummary): Promise<void> {
  await setDoc(doc(db, 'books', isbn), { aiSummary: summary }, { merge: true })
}

// ─── 서평 ───────────────────────────────────────────────────────────────────

export async function addReview(review: Omit<Review, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reviews'), {
    ...review,
    createdAt: Timestamp.now().toMillis(),
  })
  return ref.id
}

export async function getReviewsByIsbn(isbn: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('isbn', '==', isbn),
    where('isPublic', '==', 'public'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))
}

// ─── 감정 반응 ───────────────────────────────────────────────────────────────

export async function toggleReaction(
  reviewId: string,
  userId: string,
  type: ReactionType,
): Promise<void> {
  const reactionId = `${reviewId}_${userId}`
  const reactionRef = doc(db, 'userReactions', reactionId)
  const reviewRef = doc(db, 'reviews', reviewId)

  const existing = await getDoc(reactionRef)

  if (existing.exists()) {
    const prev = existing.data() as UserReaction
    // 같은 반응 재클릭 → 취소
    await updateDoc(reviewRef, { [`reactions.${prev.type}`]: increment(-1) })
    await setDoc(reactionRef, { reviewId, userId, type: null }, { merge: true })

    if (prev.type !== type) {
      // 다른 반응으로 변경
      await updateDoc(reviewRef, { [`reactions.${type}`]: increment(1) })
      await setDoc(reactionRef, { reviewId, userId, type })
    }
  } else {
    await updateDoc(reviewRef, { [`reactions.${type}`]: increment(1) })
    await setDoc(reactionRef, { reviewId, userId, type })
  }
}

export async function getUserReaction(
  reviewId: string,
  userId: string,
): Promise<ReactionType | null> {
  const snap = await getDoc(doc(db, 'userReactions', `${reviewId}_${userId}`))
  if (!snap.exists()) return null
  return (snap.data() as UserReaction).type ?? null
}

// ─── 카드 피드백 (읽을래요 / 패스) ─────────────────────────────────────────

export async function saveFeedback(feedback: UserFeedback): Promise<void> {
  const id = `${feedback.userId}_${feedback.isbn}`
  await setDoc(doc(db, 'userFeedbacks', id), feedback)
}

export async function getSeenIsbns(userId: string): Promise<Set<string>> {
  const q = query(collection(db, 'userFeedbacks'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => (d.data() as UserFeedback).isbn))
}

export async function getWantList(userId: string): Promise<UserFeedback[]> {
  const q = query(
    collection(db, 'userFeedbacks'),
    where('userId', '==', userId),
    where('type', '==', 'want'),
    orderBy('timestamp', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as UserFeedback)
}

export async function getFeedbackCounts(
  userId: string,
): Promise<{ likedAuthors: string[]; passedAuthors: string[] }> {
  const q = query(collection(db, 'userFeedbacks'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const feedbacks = snap.docs.map((d) => d.data() as UserFeedback)
  const wanted = feedbacks.filter((f) => f.type === 'want')
  const passed = feedbacks.filter((f) => f.type === 'pass')
  return {
    likedAuthors: [...new Set(wanted.flatMap((f) => f.authors))],
    passedAuthors: [...new Set(passed.flatMap((f) => f.authors))],
  }
}

// wantToRead 목록 (users/{uid}/wantToRead 배열)
export async function addToWantToRead(userId: string, isbn: string): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    { wantToRead: { [isbn]: true } },
    { merge: true },
  )
}

// 피드백 타입 재export (하위 호환)
export type { FeedbackType }
