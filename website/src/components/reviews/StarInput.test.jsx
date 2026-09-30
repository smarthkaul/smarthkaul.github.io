import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StarInput from './StarInput'
import StarRating from './StarRating'

describe('StarInput', () => {
  it('offers eight half-star choices', () => {
    render(<StarInput value={null} onChange={() => {}} />)
    expect(screen.getAllByRole('radio')).toHaveLength(8)
  })

  it('reports the half star that was clicked', () => {
    const onChange = vi.fn()
    render(<StarInput value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '2.5 out of 4 stars' }))
    expect(onChange).toHaveBeenCalledWith(2.5)
  })

  it('marks the current value as checked', () => {
    render(<StarInput value={3} onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: '3 out of 4 stars' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '4 out of 4 stars' })).toHaveAttribute('aria-checked', 'false')
  })
})

describe('StarRating', () => {
  it('announces the rating out of 4', () => {
    render(<StarRating rating={3.5} />)
    expect(screen.getByRole('img', { name: '3.5 out of 4 stars' })).toBeInTheDocument()
  })
})
