import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewEditor } from './ReviewEditor'

const defaultProps = {
  isbn: '1234567890',
  bookTitle: '테스트 책',
  userId: 'u1',
  userNickname: '테스터',
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

describe('ReviewEditor', () => {
  it('플레이스홀더 텍스트를 표시한다', () => {
    render(<ReviewEditor {...defaultProps} />)
    expect(screen.getByPlaceholderText('오늘 이 책에서 가장 인상 깊었던 순간은?')).toBeInTheDocument()
  })

  it('내용이 없으면 등록 버튼이 비활성화된다', () => {
    render(<ReviewEditor {...defaultProps} />)
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
  })

  it('내용 입력 후 등록 버튼이 활성화된다', () => {
    render(<ReviewEditor {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('오늘 이 책에서 가장 인상 깊었던 순간은?'), {
      target: { value: '정말 감동적인 책이었습니다.' },
    })
    expect(screen.getByRole('button', { name: '등록' })).not.toBeDisabled()
  })

  it('등록 시 onSubmit이 올바른 데이터로 호출된다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ReviewEditor {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByPlaceholderText('오늘 이 책에서 가장 인상 깊었던 순간은?'), {
      target: { value: '좋은 책입니다.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          isbn: '1234567890',
          content: '좋은 책입니다.',
          userId: 'u1',
        }),
      )
    })
  })

  it('완독 체크박스가 동작한다', () => {
    render(<ReviewEditor {...defaultProps} />)
    const checkbox = screen.getByLabelText('완독 완료')
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(<ReviewEditor {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
