import { MongoClient, Db } from 'mongodb'

let client: MongoClient
let dbPromise: Promise<Db>

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    client = new MongoClient(process.env.MONGODB_URI!)
    dbPromise = client.connect().then((c) => c.db('booklip'))
  }
  return dbPromise
}

export interface UserProfile {
  _id: string        // Firebase uid
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
  _id: string        // isbn
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
