import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactionButtons } from './ReactionButtons'
import type { Review } from '../types'

const mockReview: Review = {
  id: 'r1',
  userId: 'u1',
  userNickname: '테스터',
  isbn: '1234567890',
  bookTitle: '테스트 책',
  content: '좋은 책',
  rating: 4.5,
  isFinished: true,
  isPublic: 'public',
  reactions: { empathy: 3, counter: 1, impressive: 2 },
  createdAt: Date.now(),
}

describe('ReactionButtons', () => {
  it('공감/반박/인상적 버튼 3개를 렌더링한다', () => {
    render(<ReactionButtons review={mockReview} myReaction={null} onReact={vi.fn()} />)
    expect(screen.getByLabelText('공감')).toBeInTheDocument()
    expect(screen.getByLabelText('반박')).toBeInTheDocument()
    expect(screen.getByLabelText('인상적')).toBeInTheDocument()
  })

  it('각 버튼에 반응 수를 표시한다', () => {
    render(<ReactionButtons review={mockReview} myReaction={null} onReact={vi.fn()} />)
    expect(screen.getByLabelText('공감').textContent).toContain('3')
    expect(screen.getByLabelText('반박').textContent).toContain('1')
  })

  it('버튼 클릭 시 onReact가 올바른 type으로 호출된다', () => {
    const onReact = vi.fn()
    render(<ReactionButtons review={mockReview} myReaction={null} onReact={onReact} />)
    fireEvent.click(screen.getByLabelText('공감'))
    expect(onReact).toHaveBeenCalledWith('empathy')
  })

  it('현재 선택된 반응 버튼은 aria-pressed=true이다', () => {
    render(<ReactionButtons review={mockReview} myReaction="empathy" onReact={vi.fn()} />)
    expect(screen.getByLabelText('공감')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('반박')).toHaveAttribute('aria-pressed', 'false')
  })

  it('disabled 시 버튼이 비활성화된다', () => {
    render(<ReactionButtons review={mockReview} myReaction={null} onReact={vi.fn()} disabled />)
    expect(screen.getByLabelText('공감')).toBeDisabled()
  })
})
