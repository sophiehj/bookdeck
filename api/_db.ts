import { MongoClient, Db } from 'mongodb'

let client: MongoClient
let dbPromise: Promise<Db>

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    client = new MongoClient(process.env.MONGODB_URI!)
    dbPromise = client.connect().then((c) => c.db('bookdeck'))
  }
  return dbPromise
}

export interface UserProfile {
  uid: string        // Firebase uid (filter key)
  wantIsbns: string[]
  passIsbns: string[]
  updatedAt: number
}

export interface GroupMember {
  uid: string
  similarity: number
  joinedAt: number
}

export interface BookGroup {
  isbn: string       // (filter key)
  title: string
  members: GroupMember[]
  status: 'waiting' | 'active' | 'closed'
  createdAt: number
}

export interface Message {
  groupIsbn: string
  uid: string
  displayName: string
  text: string
  createdAt: number
}
