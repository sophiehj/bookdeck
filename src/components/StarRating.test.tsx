import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('5개의 별 버튼을 렌더링한다', () => {
    render(<StarRating value={0} onChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })

  it('별 클릭 시 onChange가 호출된다', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3점'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('같은 점수 클릭 시 0.5 감소 (토글)', () => {
    const onChange = vi.fn()
    render(<StarRating value={3} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3점'))
    expect(onChange).toHaveBeenCalledWith(2.5)
  })

  it('readonly 시 버튼이 비활성화된다', () => {
    render(<StarRating value={4} readonly />)
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })

  it('현재 점수를 텍스트로 표시한다', () => {
    render(<StarRating value={3.5} />)
    expect(screen.getByText('3.5')).toBeInTheDocument()
  })
})
