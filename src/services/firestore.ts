import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AISummary } from '../types'

const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID

export async function getCachedSummary(isbn: string): Promise<AISummary | null> {
  if (!isFirebaseConfigured) return null
  try {
    const snap = await getDoc(doc(db, 'books', isbn))
    if (!snap.exists()) return null
    const data = snap.data()
    return (data?.aiSummary as AISummary) ?? null
  } catch {
    return null
  }
}

export async function saveCachedSummary(isbn: string, summary: AISummary): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    await setDoc(doc(db, 'books', isbn), { aiSummary: summary }, { merge: true })
  } catch {
    // silently skip cache write
  }
}
