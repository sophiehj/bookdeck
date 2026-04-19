import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Firebase mock — 테스트에서 실제 Firebase 연결 차단
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}))

// Anthropic SDK mock — class constructor 형태로 mock
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn()
  const MockAnthropic = vi.fn(() => ({
    messages: { create: mockCreate },
  }))
  return { default: MockAnthropic, __mockCreate: mockCreate }
})
