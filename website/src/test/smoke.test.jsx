import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test harness', () => {
  it('renders and queries DOM with jest-dom matchers', () => {
    render(<h1>Broadcast</h1>)
    expect(screen.getByRole('heading', { name: 'Broadcast' })).toBeInTheDocument()
  })
})
