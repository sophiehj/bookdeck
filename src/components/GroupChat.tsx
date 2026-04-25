import { useState, useEffect, useRef } from 'react'
import { fetchMessages, sendMessage } from '../services/mongoApi'
import type { Message } from '../services/mongoApi'

interface Props {
  isbn: string
  uid: string
  displayName: string
}

const POLL_INTERVAL = 5000

export function GroupChat({ isbn, uid, displayName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = () => fetchMessages(isbn).then(setMessages).catch(() => {})
    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [isbn])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      const msg = await sendMessage(isbn, uid, displayName, trimmed)
      setMessages((prev) => [...prev, msg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
      {/* 메시지 목록 */}
      <div className="h-52 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="text-center text-xs text-[#9CA3AF] pt-8">첫 메시지를 남겨보세요</p>
        )}
        {messages.map((m, i) => {
          const isMe = m.uid === uid
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-xs text-[#9CA3AF] mb-0.5 ml-1">{m.displayName}</span>
              )}
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                  isMe
                    ? 'bg-[#C3B1E1] text-white rounded-tr-sm'
                    : 'bg-[#F3F4F6] text-[#2D2D2D] rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="메시지 입력…"
          className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#C3B1E1]"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="px-4 py-2 rounded-xl bg-[#C3B1E1] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#b09fd0] transition-all"
        >
          전송
        </button>
      </div>
    </div>
  )
}
